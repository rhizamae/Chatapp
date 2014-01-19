var ws;
function init(){
    console.log($("#username").val());
    var url=document.URL.replace("http://","ws://");
    //ws=new WebSocket(url+"?username="+$("#username").val());
    ws=new WebSocket(url);
    ws.onopen=function(evt){
        if($("#roomsPage").length>0){
            var type="vgc";
            if($("#publicList").length>0)
                type="muc";
            getRooms(type);
        }
    };
    ws.onclose=function(evt){
        //window.location="logout";  
    };
    ws.onmessage=function(evt){ 
        //make json evt
        console.log(evt);
        var tmp=evt.data.split("##");
        if(tmp[0]=="chat" && $("#chatPage").length>0){
            $("#output").append(tmp[1]+"<br>");
        }
        else if(tmp[0]=="groupchat" && $("#chatPage").length>0){
            if(tmp[1].split("@")[0]==$("#sendto").val())
                $("#output").append(tmp[1].split("/")[1]+" : "+tmp[2]+"<br>");
        }
        else if(tmp[0]=="vgc" && $("#chatPage").length>0){
            if(tmp[1].split("@")[0]==$("#sendto").val())
                $("#output").append(tmp[1].split("/")[1]+" : "+tmp[2]+"<br>");
        }
        else if(tmp[0]=="roomlist" && $("#roomsPage").length>0){
            if(tmp[1]=="refresh"){
                window.location="/rooms/"+tmp[2];
            }
            else{
                //alert(tmp[1]);
                if(($("#publicList").length>0 && tmp[1]=="muc") || ($("#privateList").length>0 && tmp[1]=="vgc")){
                    var data=JSON.parse(tmp[2]);
                    if(data.length>0){
                        $.each(data, function(i, field){
                            var room_name="";
                            if(field.name.split(" ")[0]!="")
                                room_name+=field.name.split(" ")[0] + " : ";
                            room_name+=field.jid;
                            $("#list_rooms").append("<option class='pubrooms' value='"+field.jid+"'>" + room_name + "</option>");
                        });
                    }
                    else{
                        $("#rooms").html("No rooms found.");
                    }
                }
                
            }
            
           
        }
        else if(tmp[0]=="roomchat" && $("#roomsPage").length>0){
            if(tmp[1]=="error"){
                alert("Username already in use in room "+tmp[2]+".");
            }
            else{
                
                localStorage.setItem("nickname", tmp[2]);
                window.location="/rooms/"+tmp[1];
            }
        }
    };
    ws.onerror=function(evt){};
}
  
function send(type){
    var obj={};
    obj={
            from:$("#username").val(),      
            msg:$("#msg").val(),
            type: type
    };
    if(type=="vgc")
        obj["to"]=$("#sendto").attr("name");
    else
        obj["to"]=$("#sendto").val();
    ws.send("chat$"+JSON.stringify(obj));
    $("#msg").val("");
}
  
function signout(){
    window.location="index.html";
}