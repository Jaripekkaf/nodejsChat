
function image (from, base64Image) {
    $("#msgs").append("<li><strong><span class='text-muted'>" + from + "</span></strong> : <img class='chatImage' src='" + base64Image + "'/></li>");
}


$(document).ready(function() {
  $("#showCreateRoom").click(function() {
    $("#createRoomForm").toggle();
  });

  $("#createRoomBtn").click(function() {
    var roomExists = false;
    var roomName = $("#createRoomName").val();
    socket.emit("check", roomName, function(data) {
      roomExists = data.result;
       if (roomExists) {
          $("#errors").empty();
          $("#errors").show();
          $("#errors").append("Room <i>" + roomName + "</i> already exists");
        } else {      
        if (roomName.length > 0) { //also check for roomname
          socket.emit("createRoom", roomName);
          $("#errors").empty();
          $("#errors").hide();
          }
        }
    });
  });
  
    //main chat screen
  $("#messageInRoom").click(function() {
    var msg = $("#msg").val();
    if (msg !== "") {
      $("#msgs").append("<li><strong><span class='text-success'>" + yourName + "</span></strong>: " + msg + "</li>");
      socket.emit("messageChatRoom", new Date().getTime(), msg);
      $("#msg").val("");
    }
  });
  
  $("#privateMessage").click(function() {
    var msg = $("#msg").val();
    var messageToName = $('input[name=privateMsgTo]:checked').val();
    if (msg !== "") {
      $("#msgs").append("<li><strong><span class='text-muted'> You to " + messageToName + "</span></strong> : " + msg + "</li>");

      socket.emit("privateMessage", new Date().getTime(),messageToName, msg);
      $("#msg").val("");
    }
  });

  //'is typing' message
  var typing = false;
  var timeout = undefined;

  function timeoutFunction() {
    typing = false;
    socket.emit("typing", false);
  }

  $("#msg").keypress(function(e){
    if (e.which !== 13) {
      if (typing === false && myRoomID !== null && $("#msg").is(":focus")) {
        typing = true;
        socket.emit("typing", true);
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFunction, 3000);
      }
    }
  });

  socket.on("isTyping", function(data) {
    if (data.isTyping) {
      if ($("#"+data.person+"").length === 0) {
        $("#updates").append("<li id='"+ data.person +"'><span class='text-muted'><small><i class='fa fa-keyboard-o'></i> " + data.person + " is typing.</small></li>");
        timeout = setTimeout(timeoutFunction, 3000);
      }
    } else {
      $("#"+data.person+"").remove();
    }
  });


  $("#showCreateRoom").click(function() {
    $("#createRoomForm").toggle();
  });

  $("#createRoomBtn").click(function() {
    var roomExists = false;
    var roomName = $("#createRoomName").val();
    socket.emit("roomExists", roomName, function(data) {
      roomExists = data.result;
       if (roomExists) {
          $("#errors").empty();
          $("#errors").show();
          $("#errors").append("Room <i>" + roomName + "</i> already exists");
        } else {      
        if (roomName.length > 0) { //also check for roomname
          socket.emit("createRoom", roomName);
          $("#errors").empty();
          $("#errors").hide();
          $("#fileButton").show();
          $("#messageInRoom").show();
          }
        }
    });
  });

  $("#rooms").on('click', '.joinRoomBtn', function() {
    var roomName = $(this).siblings("span").text();
    var roomID = $(this).attr("id");
    socket.emit("joinRoom", roomID);
    $("#fileButton").show();
    $("#messageInRoom").show();
     $("#createRoom").hide();
  });

  $("#rooms").on('click', '.removeRoomBtn', function() {
    var roomName = $(this).siblings("span").text();
    var roomID = $(this).attr("id");
    socket.emit("removeRoom", roomID);
    $("#createRoom").show();
  }); 

  $("#leave").click(function() {
    var roomID = myRoomID;
    socket.emit("leaveRoom", roomID);
    $("#createRoom").show();
    $("#fileButton").hide();
    $("#messageInRoom").hide();
    $("#peopleInRoom").empty();
  });
  
   $("#disconnect").click(function() {
    socket.emit("disconnectFrom");
  });
  
  
    $('#imagefile').change(function(e){
      var data = e.originalEvent.target.files[0];
      var reader = new FileReader();
      reader.onload = function(evt){
        image('me', evt.target.result);
        socket.emit('userImage', evt.target.result);
      };
      reader.readAsDataURL(data);
      
    });


});