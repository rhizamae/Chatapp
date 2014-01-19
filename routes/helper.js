var fs = require('fs');
var xmpp = require("node-xmpp");
var _this = this;
var config=require("../config/conf");

exports.account= {
    host        : config.get("account:host"),
    port        : config.get("account:port"),
    reconnect   : config.get("account:reconnect")
};

exports.getUser= function(req, res, callback){
    o = {
        username: req.cookies.username
    };
    callback(o);
};

exports.xmpp_connection= function(req, res, callback){
    var xmpp_conn="";
    var o={result:"success"};
    var account= {
            jid         : req.cookies.username+""+req.config.get("app:ext"),
            password    : req.cookies.password,
            host        : req.config.get("account:host"),
            port        : req.config.get("account:port"),
            reconnect   : req.config.get("account:reconnect")
        };
    
    if(!global.xmpp)
        global.xmpp={};
    if(!global.xmpp[req.cookies.username] ){
        xmpp_conn = new xmpp.Client(account);
        global.xmpp[req.cookies.username]=xmpp_conn;
    }
        
    
    xmpp_conn.on("online", function(){ 
        xmpp_conn.send(new xmpp.Element("presence", { type: "available" }).c("show").t("chat")); 
        console.log("Presence Cookies: "+req.cookies.username);
    });
    
    xmpp_conn.on("stanza", function(stanza){
        console.log("STANZAS ["+req.cookies.username+"] " + stanza);
        
        if (stanza.is("message")){
            var str="";
            var sendto="";
            if(stanza.attrs.type=="chat"){
                str="chat##"+stanza.attrs.from+" : "+stanza.getChild('body').getText();
                sendto=stanza.attrs.to;
            }
            else if(stanza.attrs.type=="groupchat"){
                str="groupchat##"+stanza.attrs.from+"##"+stanza.getChild('body').getText();
                sendto=stanza.attrs.to.split("/")[0];
            }
            else if(stanza.attrs.type=="vgc"){
                str="vgc##"+stanza.attrs.from+"##"+stanza.getChild('body').getText();
                sendto=stanza.attrs.to;
            }
            
            for(var c=0;c<global.ws_conn.length;c++){
                if(global.ws_conn[c].username==sendto){
                    global.ws_conn[c].connection.sendUTF(str);
                }
            }
        }
        else if (stanza.is("iq")){
            var temp=stanza.attrs.from.split(".");
            if(stanza.attrs.type=="result" && (temp[0]=="muc" || temp[0]=="vgc")){
                console.log("Get room list");
                var query = stanza.getChild("query").getChildren("item");   
                
                var arrRooms = [];
                query.forEach(function(q){
                    arrRooms.push({
                        "jid" : q.attrs.jid,
                        "name" : q.attrs.name
                    });
                });
                for(var c=0;c<global.ws_conn.length;c++){
                    console.log(global.ws_conn[c].username+" - "+stanza.attrs.to.split("/")[0]);
                    if(global.ws_conn[c].username==stanza.attrs.to.split("/")[0]){
                        global.ws_conn[c].connection.sendUTF("roomlist##"+temp[0]+"##"+JSON.stringify(arrRooms));
                    }
                }
            }
        }
        else if (stanza.is("presence")){
            if(stanza.attrs.type=="error"){
                if(stanza.getChild("error").attrs.code=="409"){
                    var room_name=stanza.attrs.from.split("@")[0]; 
                    for(var c=0;c<global.ws_conn.length;c++){
                        console.log(global.ws_conn[c].username+" - "+stanza.attrs.to.split("/")[0]);
                        if(global.ws_conn[c].username==stanza.attrs.to.split("/")[0]){
                            global.ws_conn[c].connection.sendUTF("roomchat##error##"+room_name);
                        }
                    }
                }
                
            }
            else if(stanza.getChild("x")){ 
                if(stanza.getChild("x").attrs.xmlns==req.config.get("muc:url")+"#user" ){ // enter public room
                    var room_name=stanza.attrs.from.split("@")[0]; 
                    var status = stanza.getChild("x").getChildren("status");
                    if(status.length>1){
                        if(status[0].attrs.code=="110" && status[1].attrs.code=="100"){
                            var nickname=stanza.attrs.from.split("/")[1];
                            for(var c=0;c<global.ws_conn.length;c++){
                                if(global.ws_conn[c].username==stanza.attrs.to.split("/")[0]){
                                    global.ws_conn[c].connection.sendUTF("roomchat##"+room_name+"##"+nickname);
                                }
                            }

                        }
                    }
                }
                else if(stanza.getChild("x").attrs.xmlns=="vgc#user" ){ //create new vgc room
                    //var room_name=stanza.attrs.from.split("@")[0]; 
                    var status = stanza.getChild("x").getChildren("status");
                    if(status.length>1){
                        if(status[0].attrs.code=="110" && status[1].attrs.code=="201"){
                            for(var c=0;c<global.ws_conn.length;c++){
                                if(global.ws_conn[c].username==stanza.attrs.to){
                                    global.ws_conn[c].connection.sendUTF("roomlist##refresh##private");
                                }
                            }
                           
                        }
                    }
                }
            }
            
        }
        
    });
    
    xmpp_conn.on("error", function(stanza){
        console.log("[ERROR] "+stanza);
        o={result:"error"};
    });
    callback(o);
};
