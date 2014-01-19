function getRooms(type){
    $.getJSON("/rooms/"+type+"/all", function(data){
        console.log(data);
    });
}

$(document).ready(function(){
    
    $("#enterroom").click(function(){
        if($("#enterroom").attr("name")=="muc"){
            if($("#nickname").val()!=""){
                $.ajax({
                    url: "/rooms/"+$("#enterroom").attr("name")+"/"+$("#list_rooms").val(),
                    type: "PUT",
                    data: JSON.stringify({
                        room_jid: $("#nickname").val()
                    }),
                    contentType: "application/json",
                    dataType: "json"
                }).done(function(data){
                    console.log(data);
                });
            }
        }
        else if($("#enterroom").attr("name")=="vgc"){
            alert($("#list_rooms").val());
            window.location="/rooms/"+$("#enterroom").attr("name")+"/"+$("#list_rooms").val();
        }
    });
    
    $("#newroom").click(function(){
        if($("#newroomname").val()!=""){
          $.ajax({
              url: "/rooms/"+$("#enterroom").attr("name"),
              type: "POST",
              data: JSON.stringify({
                  rname: $("#newroomname").val()
              }),
              contentType: "application/json",
              dataType: "json"
          }).done(function(data){
              console.log(data);
          });
        }
        
    });
    
    $("#inviteroom").click(function(){
        alert($("#invitedname").val());
        if($("#invitedname").val()!=""){
            $.ajax({
                url: "/"+$("#sendto").attr("name")+"/members",
                type: "POST",
                data: JSON.stringify({
                    invited: $("#invitedname").val()
                }),
                contentType: "application/json",
                dataType: "json"
            }).done(function(data){
                console.log(data);
            });
          }
    });
    
    $('#list_rooms').change(function(){
        $(".showHide").css("display","block");
    });
    
});