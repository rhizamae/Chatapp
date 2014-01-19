exports.render = function(req,res){
    req.helper.getUser(req, res, function(o){
        console.log("HELPER");
        console.log(o);
        o["roomname"]="none";
        res.render('chat', o);
    });
};