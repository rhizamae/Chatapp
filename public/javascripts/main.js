$(document).ready(function(){
        
    $("#gochat").click(function(){
        window.location="/chat";
    });
    
    $("#pubrooms").click(function(){
        window.location="/rooms/public";
    });
    
    $("#privaterooms").click(function(){
        window.location="/rooms/private";
    });
    
});