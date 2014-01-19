function saveToStorage(username){
    localStorage.setItem("username", username);
    //localStorage.getItem("bar");
}

$(document).ready(function(){
    if($("#nickname").length>0){
        $("#nickname").val(localStorage.getItem("nickname"));
    }
    
    $("#leaveroom").click(function(){
        var sendto="";
        var nickname="";
        if($("#leaveroom").attr("name")=="vgc"){
            sendto=$("#sendto").attr("name");
            nickname="none";
        }
        else{
            sendto=$("#sendto").val();
            nickname=localStorage.getItem("nickname");
        }
            
                
        $.ajax({
            url: "/rooms/"+$("#leaveroom").attr("name")+"/"+sendto,
            type: "DELETE",
            data: JSON.stringify({
                nickname: nickname
            }),
            contentType: "application/json",
            dataType: "json"
        }).done(function(data){
            console.log(data);
            if($("#leaveroom").attr("name")=="muc")
                window.location="/rooms/public";
            else
                window.location="/rooms/private";
        });
        
    });
    
    $(".send").click(function(){
        send($(this).attr("name"));
    });
    
});