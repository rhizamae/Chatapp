
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , conf = require('./config/conf')
  , xmpp = require("node-xmpp")
  , path = require('path');

var session = require('./routes/session')
  , rooms = require('./routes/rooms')
  , members = require('./routes/members')
  , chat = require('./routes/chat')
  , helper = require('./routes/helper');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(function(req, res, next) {
    req.config = conf;
    req.helper = helper;
    next();
});
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session({cookie: { maxAge: 60*60*1000, expires: false }}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', getUser, routes.index);

app.post('/login', session.login);
app.get('/logout', getUser, session.logout);
app.get('/connect', session.establishXMPPConnection);

app.get('/chat', getUser, chat.render);
app.get('/rooms/:type/all', getUser, rooms.all);

app.get('/rooms/:rname', getUser, rooms.render);
app.delete('/rooms/:type/:rname', getUser, rooms.leave); //leave room

app.get('/rooms/:type/:rname', getUser, rooms.enter); //enter public/private room
app.put('/rooms/:type/:rname', getUser, rooms.enter); //enter public/private room

app.post('/rooms/:type', getUser, rooms.create); //create new room
//app.get('/rooms/:type/all', getUser, rooms.list);

app.post('/:rname/members', getUser, members.invite);

var server=http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var WebSocketServer=require('websocket').server;
wsServer=new WebSocketServer({httpServer : server});  
var ws_conn_index={};

function getUser(req,res,next){
    if (req.cookies.username) {
        if(req.url=="/")
            res.redirect('/chat');
        else
            next();
    }
    else{
        console.log("URL: "+req.url);
        if(req.url=="/")
            next();
        else
            res.redirect('/');
    }
} 

function getCookies(cookies) {
    var obj={};
    cookies.forEach(function(name){
        obj[name.name]=name.value;
    });
    return obj;
}

wsServer.on('request',function(request){
    
    var cookies = getCookies(request.cookies);

    if(cookies.username){
        var conn=request.accept();
        var obj={connection:conn,username:cookies.username};
        if(!global.ws_conn)
            global.ws_conn=new Array();
        global.ws_conn.push(obj);
        console.log("Websocket Received a connection "+global.ws_conn.length);

        conn.on('message',function(message){
            console.log("Msg Received");
            var str=message.utf8Data+"";
            var msg=str.split("$");
      
            if(msg[0]=="chat"){   
                msg=JSON.parse(msg[1]);
                var xmpp_conn=global.xmpp[cookies.username];
                if(msg.type=="chat"){
                    var stanza = new xmpp.Element('message',{ to: msg.to, from: msg.from, type: msg.type }).c('body').t(msg.msg);
                    xmpp_conn.send(stanza);
                    
                    for(var c=0;c<global.ws_conn.length;c++){
                        if(global.ws_conn[c].username==msg.from){
                            global.ws_conn[c].connection.sendUTF("chat##"+msg.from+""+conf.get("app:ext")+" : "+msg.msg);
                        }
                    }
                }
                else if(msg.type=="groupchat"){
                    var stanza = new xmpp.Element('message',{ to: msg.to+"@"+conf.get("muc:host"), from: msg.from, type: msg.type }).c('body').t(msg.msg);
                    xmpp_conn.send(stanza);
                }
                else{
                    var stanza = new xmpp.Element('message',{ to: msg.to, from: msg.from, type: msg.type }).c('body').t(msg.msg);
                    xmpp_conn.send(stanza);
                }
            }
        });
        
        conn.on('close',function(reasonCode,description){
            for(var ctr=0;ctr<global.ws_conn.length;ctr++){
                if(global.ws_conn[ctr].connection==conn){
                    console.log("Removed websocket connection");
                    global.ws_conn.splice(ctr, 1);
                    ctr=global.ws_conn.length+1;
                }
            }
            console.log("Websocket Closed connection ");
        });
    }
});

