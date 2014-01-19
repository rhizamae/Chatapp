

function on_online (conn, cb){
    conn.on("online", function(){
        conn.send(new xmpp.Element("presence", { type: "available" }).c("show").t("chat")); 
        cb();
    });
}

exports.login = function(req,res){
    console.log("Login");
    res.cookie("username", req.body.username);
    res.cookie("password", req.body.password);
    res.redirect('/connect');
};

exports.establishXMPPConnection=function(req, res) {
req.helper.xmpp_connection(req, res, function(o){
        if(o.result=="success"){
            res.redirect('chat');
        }
        else{
            _this.logout(req,res);
        } 
    });
};

exports.logout = function(req, res) {
    console.log("Logout"+req.cookies.username);
    if(global.xmpp){
        if(global.xmpp[req.cookies.username])
            delete global.xmpp[req.cookies.username];
    }
        
    res.clearCookie('username');
    res.clearCookie('password');
    res.clearCookie('nickname');
    res.redirect("/");
};