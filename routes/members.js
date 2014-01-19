var xmpp = require("node-xmpp");

exports.invite = function(req,res){
    console.log("Invite to Room");
    /*
     <iq to='room1@vgc.localhost' type='set'>
      <query xmlns='vgc#owner'>
        <item affiliation='member' jid='admin@localhost'/>
        <item affiliation='member' jid='account1@localhost'/>
      </query>
    </iq>
     */
    var xmpp_conn=global.xmpp[req.cookies.username];
    var room_iq = new xmpp.Element("iq", { type:"set", to: req.params.rname })
        .c('query', { xmlns: "vgc#owner" });
    room_iq.c('item', { affiliation:'member', jid: req.body.invited });
    
    console.log(room_iq);
    
    xmpp_conn.send(room_iq);
    res.send({"result":"success leave room"});
    //STANZAS [admin@localhostr] <iq from="vgcroom1@vgc.localhost" to="admin@localhostr/BW" type="result" xmlns:stream="http://etherx.jabber.org/streams"><query xmlns="vgc#owner"/></iq>

};
