
//Globals
var socket;

var player;
var players = [];
var facing;
var characterSpeed = 200;


var game = new Phaser.Game(675, 600, Phaser.WEBGL, 'game',
{
    preload: preload,
    create: create,
    update: update,
    render: render
});


function preload()
{
    game.load.spritesheet('player', 'assets/pics/dude.png', 32, 48);
    game.load.image('bullet', 'assets/pics/bullet.png');
    game.load.image('turret', 'assets/pics/bullet.png');
    game.load.image('white', 'assets/pics/white.png');

    game.load.image('floor', 'assets/pics/floor.png');
}

function create()
{
    socket = io.connect('http://localhost');

    game.physics.startSystem(Phaser.Physics.ARCADE);
    createLevel();

}

function createLevel()
{
  var x_org = Math.floor((Math.random() * 300) + 1);
  var y_org = Math.floor((Math.random() * 300) + 1);
  var myid = (new Date()).getTime();
    socket.emit('new player connecting', { myid:myid,  x: x_org, y:y_org });
    
    game.add.tileSprite(0, 0, 2000, 2000, 'floor');
    game.world.setBounds(0, 0, 1400, 1400);
    
    player = game.add.sprite(x_org, y_org, 'player');
    player.checkWorldBounds = true;
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.collideWorldBounds = true;
    player.name ={name:"Player", id:myid };
    game.camera.follow(player);

    //KEYBOARD
    cursors = game.input.keyboard.createCursorKeys();

    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('turn', [4], 20, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
    
    socketConnections();
    
}
function socketConnections()
{
      //If a person connects then they will be added to the players
    socket.on('existing players', function (data) {
        console.log(data);
        var existingPlayer = game.add.sprite(data.x, data.y, 'player');
        existingPlayer.checkWorldBounds = true;
        game.physics.enable(existingPlayer, Phaser.Physics.ARCADE);
        existingPlayer.body.collideWorldBounds = true;
        existingPlayer.name = {id:data.id};
        existingPlayer.animations.add('left', [0, 1, 2, 3], 10, true);
        existingPlayer.animations.add('turn', [4], 20, true);
        existingPlayer.animations.add('right', [5, 6, 7, 8], 10, true);
        
        players.push(existingPlayer);
    });
    
    //If a person connects then they will be added to the players
    socket.on('new player', function (data) {
        console.log(data);
        var newPlayer = game.add.sprite(data.x, data.y, 'player');
        newPlayer.checkWorldBounds = true;
        game.physics.enable(newPlayer, Phaser.Physics.ARCADE);
        newPlayer.body.collideWorldBounds = true;
        newPlayer.name = { name:"Playa", id:data.id };
        newPlayer.animations.add('left', [0, 1, 2, 3], 10, true);
        newPlayer.animations.add('turn', [4], 20, true);
        newPlayer.animations.add('right', [5, 6, 7, 8], 10, true);
    
        players.push(newPlayer);
    });
    socket.on('move player', function (data) {
        var playerMoving = playerById(data.id);
        playerMoving.x = data.x;
        // playerMoving.animations.play(data.facing);
        // console.log('playing animation: ' + data.facing)
        playerMoving.y = data.y;
    });
    socket.on('remove player', function (data) {
      var playerToRemove = playerById(data.id);
      if(playerToRemove !== false)
      {
        console.log(playerToRemove)
        playerToRemove.kill();
      }
    });
    socket.on('message', function (data) {
      var playerSendingMessage = playerById(data.id);
      displayMessage(playerSendingMessage, data.message);
    });
}
// var chatBackground;
var chatText;
var chatHistory = '';
function displayMessage(playerSendingMessage, message)
{
  if(chatBackground !== undefined)
  {
    chatBackground.kill();
  }
  if(chatText !== undefined)
  {
    chatText.destroy();
  }
  chatHistory += playerSendingMessage.name.name + ": " + message +'\n';
  var style = { font: "14px Arial", fill: "#ffffff", align: "center" };
  chatText = game.add.text(0, 0, chatHistory, style);
  chatText.stroke = '#000000';
  chatText.strokeThickness = 1;
  chatText.fixedToCamera = true;
}

function update()
{
  if(player != undefined)
  {
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;
    playerMovement();


  //figure out how to determine the animation frame
  //   for (i = 0; i < players.length; i++) {
  //     console.log(players[i].frame)
  // 		// players[i].animations.stop();
  // 		// if(players[i].frame  < 4)
  // 		// {
  // 		//   players[i].frame = 0;
  // 		// }else if(players[i].frame > 4)
  // 		// {
  // 		//   players[i].frame = 4;
  // 		// }
  // 	}

  }
}

function sendMessage()
{
  if(player !== undefined)
  {
    var message= document.getElementById('messageInput').value;
    if(message != "")
    {
      socket.emit("message", { message:message, id:player.name})
      displayMessage(player, message)
      document.getElementById('messageInput').value = "";
    }
  }
}

function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].name == id)
			return players[i];
	}
	
	return false;
}

function playerMovement()
{

    if (cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A))
    {
        player.body.velocity.x = -characterSpeed;
        if (facing != 'left')
        {
            player.animations.play('left');
            facing = 'left';
        }
    }
    else if (cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D))
    {
        player.body.velocity.x = +characterSpeed;
        if (facing != 'right')
        {
            player.animations.play('right');
            facing = 'right';
        }
    }
    else
    {
        if (facing != 'idle')
        {
            player.animations.stop();

            if (facing == 'left')
            {
                player.frame = 0;
            }
            else
            {
                player.frame = 5;
            }

            facing = 'idle';
        }
    }
    if (cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W))
    {

        player.body.velocity.y = -characterSpeed;

    }
    else if (cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S))
    {

        player.body.velocity.y = characterSpeed;
    }
    if (cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S) || cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W)
    || cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D) || cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A))
    {
      socket.emit('move player', { id: player.name, x: player.x, y:player.y, facing:facing});
    }
    
}

function render()
{
  
}
