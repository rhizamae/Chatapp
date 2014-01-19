var xmpp = require("node-xmpp");

exports.render = function(req,res){
    console.log(req.url+" - "+req.params.rname);
    if(req.params.rname=="public" || req.params.rname=="private"){
        req.helper.getUser(req, res, function(o){
            o["type"]=req.params.rname;
            res.render('rooms', o);
        }); 
    }
    
    else{
        req.helper.getUser(req, res, function(o){
            o["roomname"]=req.params.rname;
            o["type"]="muc";
            //o["affiliation"]="";
            console.log("HELPER");
            console.log(o);
            res.render('chat', o);
        });
    }
    
};
 
exports.all = function(req,res){
    console.log("Get Room list");
    var xmpp_conn=global.xmpp[req.cookies.username];
    var room_iq = new xmpp.Element('iq', { from:req.cookies.username, to: req.params.type+"." + req.config.get("account:host"), type: 'get' })
    .c("query", { xmlns : req.config.get("rooms:url")});
    xmpp_conn.send(room_iq);
    res.send({"result":"success get list"});
};

exports.enter = function(req,res){
    console.log("Enter Room");
    var xmpp_conn=global.xmpp[req.cookies.username];
    var room_send="";
    if(req.params.type=="muc"){
        room_send = new xmpp.Element("presence", { 
            to: req.params.rname+"/"+req.body.room_jid }).c('x', { xmlns: req.config.get("room_url")+""+req.params.type });
        res.send({"result":"success enter room"});
    }
    else if(req.params.type=="vgc"){
        room_send = new xmpp.Element("iq", { 
            to: req.params.rname , type:"get"}).c('query', { xmlns: req.config.get("rooms:url") });
    }
    xmpp_conn.send(room_send);
    xmpp_conn.on("stanza", function(stanza){
        if (stanza.is("iq")){
            if(stanza.attrs.type=="result" && stanza.attrs.from.split("@")[1]==req.config.get("vgc:host") && stanza.getChild("query").attrs.xmlns==req.config.get("rooms:url")){
                var query = stanza.getChild("query").getChildren("item");
                var array = [];
                var affiliation="member";
                query.forEach(function(q){
                    if(q.attrs.jid==req.cookies.username)
                        affiliation=q.attrs.affiliation;
                    array.push({
                        "affiliation" : q.attrs.affiliation,
                        "jid" : q.attrs.jid
                    });
                });
                req.helper.getUser(req, res, function(o){
                    console.log("HELPER");
                    console.log(o);
                    o["roomname"]=stanza.attrs.from;
                    o["type"]="vgc";
                    o["members"]=array;
                    o["affiliation"]=affiliation;
                    console.log(o);
                    res.render('chat', o);
                });
            }
            else if(stanza.attrs.type=="error" && stanza.attrs.from.split("@")[1]==req.config.get("vgc:host") && stanza.getChild("query").attrs.xmlns==req.config.get("rooms:url") &&  stanza.getChild("error").attrs.code=="403"){
                res.redirect("rooms/private");
            }    
            
        }
        else if (stanza.is("presence")){
            if(stanza.getChild("x")){ 
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
            }
        }    
    });
    
};

exports.leave = function(req,res){
    console.log("Leave Room "+req.url);
    var xmpp_conn=global.xmpp[req.cookies.username];
    //<presence to='vgcroom1@vgc.localhost' type='unavailable' />
    if(req.params.type=="muc"){
        var room_presence = new xmpp.Element("presence", { 
            type:"unavailable", to: req.params.rname+"@"+req.config.get(req.params.type+":host")+"/"+req.body.nickname });
        xmpp_conn.send(room_presence);
        res.send({"result":"success leave room"});
    }
    else if(req.params.type=="vgc"){
        console.log("leave vgc");
        var room_presence = new xmpp.Element("presence", { 
            type:"unavailable", to: req.params.rname });
        xmpp_conn.send(room_presence);
        xmpp_conn.on("stanza", function(stanza){
            if (stanza.is("presence") && stanza.getChild("x")){
                var status=stanza.getChild("x").getChildren("status");                
                var stanzaFrom=stanza.attrs.from.split("@")[1];
                if(stanza.attrs.type=="unavailable" && stanzaFrom.split("/")[0]==req.config.get("vgc:host") && stanza.getChild("x").attrs.xmlns=="vgc#user" && status[0].attrs.code=="110"){
                    //res.send({"result":"success leave room"});
                }  
            }
        });
        res.send({"result":"success leave room"});
    }
    
};

exports.create = function(req,res){
    console.log("Create Room");
    var xmpp_conn=global.xmpp[req.cookies.username];
    var room_presence = new xmpp.Element("presence", { to: req.body.rname+"@"+req.config.get("vgc:host") });
    xmpp_conn.send(room_presence);
    
    res.send({"result":"success create room"});
};
