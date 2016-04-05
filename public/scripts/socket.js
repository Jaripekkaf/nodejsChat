$(document).ready(function() {
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

socket.on("userExists", function(data) {
  $("#errors").empty();
  $("#errors").show();
  $("#errors").append(data.msg);
    toggleNameForm();
    toggleChatWindow();
});

socket.on("history", function(data) {
  if (data.length !== 0) {
    $("#msgs").append("<li><strong><span class='text-warning'>Last 10 messages:</li>");
    $.each(data, function(data, msg) {
      $("#msgs").append("<li><span class='text-warning'>" + msg + "</span></li>");
    });
  } else {
    $("#msgs").append("<li><strong><span class='text-warning'>No past messages in this room.</li>");
  }
});

  socket.on("messageFromServer", function(msg) {
    $("#msgs").append("<li>" + msg + "</li>");
  });
  
  socket.on("yourData", function(data) {
    yourName = data.name;
  });
  

  socket.on("updatePeople", function(data){
    $("#people").empty();
    $('#people').append("<li class='list-group-item active'>People online <span class='badge'>"+data.count+"</span></li>");
    var appendString = '';
    $.each(data.people, function(a, obj) {
      appendString += '<li class="list-group-item"><span>' + obj.name + '</span> ';
      if(yourName===obj.name) {
      	appendString += ' THIS IS YOU';
      }else {
      	appendString += '<input type="radio" id="privatMsgToName" name="privateMsgTo" value="'+obj.name+'"/> Private message</li>';
      }
      appendString += '</li>';
    });
	$('#people').append(appendString);
  });

  socket.on("chatMessage", function(msTime, person, msg) {
    $("#msgs").append("<li><strong><span class='text-success'>" + person.name + "</span></strong>: " + msg + "</li>");
     $("#"+person.name+"").remove();
     clearTimeout(timeout);
     timeout = setTimeout(timeoutFunction, 0);
  });

  socket.on("privateMessage", function(msTime, person, msg) {
    $("#msgs").append("<li>From <strong><span class='text-muted'>" + person.name + "</span></strong> : " + msg + "</li>");
  });

  socket.on("rooms", function(data) {
    $("#rooms").text("");
    $("#rooms").append("<li class='list-group-item active'>Rooms<span class='badge'>"+data.count+"</span></li>");
     if (!jQuery.isEmptyObject(data.rooms)) { 
      $.each(data.rooms, function(id, room) {
        var html = "<button id="+id+" class='joinRoomBtn btn btn-default btn-xs' >Join</button>" + " " + "<button id="+id+" class='removeRoomBtn btn btn-default btn-xs'>Remove</button>";
        $('#rooms').append("<li id="+id+" class='list-group-item'><span>" + room.name + "</span> " + html + "</li>");
      });
    } else {
      $("#rooms").append("<li class='list-group-item'>There are no rooms yet.</li>");
      $("#peopleInRoom").empty();
      $("#fileButton").hide();
      $("#messageInRoom").hide();
    }
  });
  

  socket.on("sendRoomID", function(data) {
    myRoomID = data.id;
  });
  
  socket.on("peopleInRoom",function(data) {
  	$("#peopleInRoom").empty();
    $('#peopleInRoom').append("<li class='list-group-item active'>Room :"+data.roomName+" <span class='badge'>"+data.count+"</span></li>");
    var appendString = '';
    $.each(data.people, function(a, obj) {
      appendString += '<li class="list-group-item"><span>' + obj + '</span> ';
      if(yourName===obj) {
      	appendString += ' THIS IS YOU';
      }
      appendString += '</li>';
      
    });
    $('#peopleInRoom').append(appendString);
  });

  socket.on("disconnect", function(){
    $("#msgs").append("<li><strong><span class='text-warning'>The server is not available</span></strong></li>");
    $("#msg").attr("disabled", "disabled");
    $("#send").attr("disabled", "disabled");
  });
  
  socket.on('userImage', function (from, base64Image) {
    $('#msgs').append($('<p>').append($('<b>').text(from),
        '<img class="chatImage" src="' + base64Image + '"/>'));
  });


});