var express = require("express");
var app     = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Room = require('./room.js');
var User = require('./user.js');
var underScore = require('underscore')._;
var uuid = require('node-uuid');
var helmet = require('helmet');
var session = require('cookie-session');

app.use('/static', express.static(__dirname + '/public'));
//Helmet for secure app by setting various HTTP headers
app.use(helmet());


//start of setting cookie session
var expiryDate = new Date( Date.now() + 60 * 60 * 1000 ); // 1 hour
app.set('trust proxy', 1);
app.use(session({
  name: 'chatserversession123',
  keys: ['rjkad8jfs', 'nxc3vg4wp'],
  cookie: { secure: true,
            httpOnly: true,
            domain: '127.0.0.1',
            expires: expiryDate
          }
  })
);
//end of setting cookie session
app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var people = {};
var rooms = {};
var chatHistory = {};
var sockets = [];


function disconnectFromChat(s,action) {
	//User disconnect from server
	if (action === "disconnect") {
		io.sockets.emit("messageFromServer", people[s.id].name + " has disconnected from the server.");
		delete people[s.id];
		io.sockets.emit("updatePeople", {people: people, count: underScore.size(people)});
		findSocketAndRemove(s);
	}		
}

//finds right socket connection of current user and removes it
function findSocketAndRemove(s){
	var o = underScore.findWhere(sockets, {'id': s.id});
	sockets = underScore.without(sockets, o);
}

/***
Function that controls users behaviour in chat rooms. 
if user leaves the room and is owner or visitor of the room.
if user removes the room and is owner or visitor of the room.
if user disconnect and is owner or visitor of the room.

***/

function controlRooms(s, action) {
	if (people[s.id].inroom) { //check if user is in room
		var room = rooms[people[s.id].inroom]; //which room user is in.
		if (s.id === room.owner) { //user in room and owns this room
			var socketids = [];
			io.sockets.in(s.room).emit("messageFromServer", "The owner (" +people[s.id].name + ") has left. You have been disconnected from it as well.");
			for (var i=0; i<sockets.length; i++) {
				socketids.push(sockets[i].id);
				if(underScore.contains((socketids)), room.people) {
					sockets[i].leave(room.name);
				}
			}
			if(underScore.contains((room.people)), s.id) {
				for (var i=0; i<room.people.length; i++) {
					people[room.people[i]].inroom = null;
				}
			}
			
			delete rooms[people[s.id].owns]; //delete the room
			delete chatHistory[room.name]; //delete the chat history
			people[s.id].owns = null;
			if (action === "disconnect") {
				findSocketAndRemove(s);
				delete people[s.id]; //delete user from people collection
				io.sockets.emit("updatePeople", {people: people, count: underScore.size(people)});
				
			}
			io.sockets.emit("rooms", {rooms: rooms, count: underScore.size(rooms)});
			
		} else {//user in room but does not own room
			if(action === "removeRoom") {
			   s.emit("messageFromServer", "Only the owner can remove a room.");
			} else {
				if (underScore.contains((room.people), s.id)) {
					var personIndex = room.people.indexOf(s.id);
					room.people.splice(personIndex, 1);
					room.persons.splice(personIndex, 1);
					s.leave(room.name);
					if (action === "disconnect") {
						findSocketAndRemove(s);
						io.sockets.emit("messageFromServer", people[s.id].name + " has disconnected from the server.");
						delete people[s.id];
						io.sockets.emit("updatePeople", {people: people, count: underScore.size(people)});
					}
					else if (action === "leaveRoom") {
						people[s.id].inroom = null;
						io.sockets.emit("messageFromServer", people[s.id].name + " has left the room.");
						io.sockets.in(s.room).emit("peopleInRoom", {roomName:room.name,people: room.persons, count: underScore.size(room.people)});
					}
				}
			}
		}
	} else {
		//backup case if not in room
		disconnectFromChat(s,action);
	}
}

io.sockets.on('connection',function(socket){

  	socket.on("joinServer", function(name) {
		var exists = false;
		var ownerRoomID = inRoomID = null;
		
		//check if user name exist
		underScore.find(people, function(key,value) {
			if (key.name.toLowerCase() === name.toLowerCase())
				return exists = true;
		});
		
		if (exists) {
			socket.emit("userExists", {msg: "Username is all ready in use, please use another one."});
		} else {
			people[socket.id] = new User(name, ownerRoomID, inRoomID);
			socket.emit("messageFromServer", "Welcome to chat server.");
			io.sockets.emit("messageFromServer", people[socket.id].name + " is online.");
			socket.emit("yourData", people[socket.id]);
			io.sockets.emit("updatePeople", {people: people, count: underScore.size(people)});
			socket.emit("rooms", {rooms: rooms, count: underScore.size(rooms)});
			sockets.push(socket);
		}
	});
	
	socket.on('userImage', function (msg) {
        // broadcast to all except to you
        socket.broadcast.in(socket.room).emit('userImage', people[socket.id].name, msg);
    });
	
	socket.on("typing", function(data) {
		if (typeof people[socket.id] !== "undefined") {
			io.sockets.in(socket.room).emit("isTyping", {isTyping: data, person: people[socket.id].name});
		}
	});
	
	socket.on("messageChatRoom", function(msTime, msg) {
		if (io.sockets.adapter.rooms[socket.room].sockets !== undefined ) {
			socket.broadcast.in(socket.room).emit("chatMessage", msTime, people[socket.id], msg);
			socket.emit("isTyping", false);
			if (underScore.size(chatHistory[socket.room]) > 10) {
				chatHistory[socket.room].splice(0,1);
			} else {
				chatHistory[socket.room].push(people[socket.id].name + ": " + msg);
			}
		} else {
			socket.emit("messageFromServer", "Connect to a room first.");
		}
	});
	
	socket.on("privateMessage", function(msTime,toWho, msg) {
		var found = false;
		var toWhoId = false;
		var keys = Object.keys(people);
		if (keys.length != 0) {
			for (var i = 0; i<keys.length; i++) {
				if (people[keys[i]].name === toWho) {
					toWhoId = keys[i];
					found = true;
					if (socket.id === toWhoId) {
						socket.emit("messageFromServer", "You can't send private messages to your self.");
					}
					break;
				} 
			}
			if(!found) {
				socket.emit("messageFromServer", "Can't find " + toWho);
			}
		}
		if (found && socket.id !== toWhoId) {
			io.sockets.to(toWhoId).emit("privateMessage", msTime, people[socket.id], msg);
		}
	});

	socket.on("disconnectFrom", function() {
		if (typeof people[socket.id] !== "undefined") {
			disconnectFromChat(socket, "disconnect");
			socket.disconnect();
		}
	});

	//Room functions
	socket.on("createRoom", function(name) {
		if (people[socket.id].inroom) {
			socket.emit("messageFromServer", "You are in a room. You can leave from room.");
		} else if (!people[socket.id].owns) {
			var id = uuid.v4();//generate unique id for room
			var room = new Room(name, id, socket.id);
			rooms[id] = room;
			io.sockets.emit("rooms", {rooms: rooms, count: underScore.size(rooms)});
			//add room to socket, and join to room
			socket.room = name;
			socket.join(socket.room);
			people[socket.id].owns = id;
			people[socket.id].inroom = id;
			room.addPerson(socket.id,people[socket.id].name);
			socket.emit("messageFromServer", "Welcome to " + room.name + ".");
			socket.emit("sendRoomID", {id: id});
			socket.emit("peopleInRoom", {roomName:room.name,people: room.persons, count: underScore.size(room.people)});
			chatHistory[socket.room] = [];
		} else {
			socket.emit("messageFromServer", "You have already created a room.");
		}
	});

	socket.on("roomExists", function(name, fn) {
		var match = false;
		underScore.find(rooms, function(key,value) {
			if (key.name === name) {
				return match = true;
			}
		});
		fn({result: match});
	});

	socket.on("removeRoom", function(id) {
		 var room = rooms[id];
		 if (socket.id === room.owner) {
			controlRooms(socket, "removeRoom");
		} else {
            socket.emit("messageFromServer", "Only the owner can remove a room.");
		}
	});

	socket.on("joinRoom", function(id) {
		if (typeof people[socket.id] !== "undefined") {
			var room = rooms[id];
			if (socket.id === room.owner) {
				socket.emit("messageFromServer", "You have already joined this room.");
			} else {
				if (underScore.contains((room.people), socket.id)) {
					socket.emit("messageFromServer", "You have already joined this room.");
				} else {
					if (people[socket.id].inroom !== null) {
				    		socket.emit("messageFromServer", "You are already in a room ("+rooms[people[socket.id].inroom].name+"), please leave it first to join another room.");
				    	} else {
						room.addPerson(socket.id,people[socket.id].name);
						people[socket.id].inroom = id;
						socket.room = room.name;
						socket.join(socket.room);
						io.sockets.in(socket.room).emit("messageFromServer", people[socket.id].name + " has connected to " + room.name + " room.");
						socket.emit("messageFromServer", "Welcome to " + room.name + ".");
						socket.emit("sendRoomID", {id: id});
						io.sockets.in(socket.room).emit("peopleInRoom", {roomName:room.name,people: room.persons, count: underScore.size(room.people)});
						var keys = underScore.keys(chatHistory);
						if (underScore.contains(keys, socket.room)) {
							socket.emit("history", chatHistory[socket.room]);
						}
					}
				}
			}
		} else {
			socket.emit("messageFromServer", "Please enter a valid name first.");
		}
	});

	socket.on("leaveRoom", function(id) {
		var room = rooms[id];
		if (room) {
			controlRooms(socket, "leaveRoom");
		}
	});
	
	socket.on('connectFailed', function() {
	  if (typeof console !== "undefined" && console !== null) {
		console.log("Connect failed (port " + socket_port + ")");
	  }
	});
	
	socket.on('error', function() {
	  if (typeof console !== "undefined" && console !== null) {
		console.log("Socket.io reported a generic error"+this.error);
	  }
	});
	
});