var final_transcript = '';
var recognizing = false;
var last10messages = []; //to be populated later
var yourName = '';
  var socket = io.connect("127.0.0.1:3000");
  var myRoomID = null;

/*
Functions
*/
function toggleNameForm() {
   $("#login-screen").toggle();
}

function toggleChatWindow() {
  $("#main-chat-screen").toggle();
}

$(document).ready(function() {

  $("form").submit(function(event) {
    event.preventDefault();
  });

  $("#main-chat-screen").hide();
  $("#fileButton").hide();
  $("#messageInRoom").hide();

  $("#conversation").bind("DOMSubtreeModified",function() {
    $("#conversation").animate({
        scrollTop: $("#conversation")[0].scrollHeight
      });
  });
  
  $("#errors").hide();

  $("#name").keypress(function(e){
    var name = $("#name").val();
    if(name.length < 2) {
      $("#join").attr('disabled', 'disabled'); 
    } else {
      $("#errors").empty();
      $("#errors").hide();
      $("#join").removeAttr('disabled');
    }
  });
});