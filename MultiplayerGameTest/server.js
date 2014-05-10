var express = require('express');
var app = express();
var socket = require('socket.io');
app.use(express.static(__dirname + '/'));
var server = app.listen(80);
var Player = require("./Player").Player;
var io = socket.listen(server);
//     io.sockets.on('connection', function (socket) {
//         console.log("connnect");
//         socket.on('disconnect', function (socket) {
//         console.log("disconnect");
//     });
// });
var util = require("util");

io.sockets.on('connection', onConnect);

var playerID;
function onConnect(socket)
{
  socket.on('new player connecting',  onNewPlayer)
  socket.on("disconnect", onClientDisconnect);
  socket.on("move player", onMovePlayer);
  socket.on("message", broadcastMessage);

}
function broadcastMessage(data)
{
  this.broadcast.emit("message", { message:data.message, id:this.playerID})
}
function onClientDisconnect() {
  // util.log("Player has disconnected: "+this.id);

	var removePlayer = playerById(this.playerID);

	// Player not found
	if (!removePlayer) {
		// util.log("Player not found: "+this.id);
		return;
	}

	// Remove player from players array
	players.splice(players.indexOf(removePlayer), 1);

	// Broadcast removed player to connected socket clients
	this.broadcast.emit("remove player", {id: this.playerID});
};



var players = [];
// New player has joined
function onNewPlayer(data) {
  
  
	// Create a new player with random coordinates
	var newPlayer = new Player(data.x, data.y);
	newPlayer.id = data.myid;
  this.playerID = data.myid;
  
	// Broadcast new player to connected socket clients
	this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("existing players", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
	}
		
	// Add new player to the players array
	players.push(newPlayer);
}


// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	}
	
	return false;
}


// Player has moved
function onMovePlayer(data) {
  
  // util.log('MOVE PLAYA')
	// Find player in array
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		util.log("Player not found: "+data.id);
		return;
	}

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
  
	// Broadcast updated position to connected socket clients
	this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY(), facing:data.facing});
}