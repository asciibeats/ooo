var socket = {};
module.exports = socket;

var io = require('socket.io');
var game = require('./game.js');

var _DENY_DELAY = 1;

var _sockets;

//helper
function deny_access (socket, callback)
{
	return function ()
	{
		socket.once('auth', on_auth);
		callback(false);
	}
}

//events
function on_name (name, callback)
{
	callback(game.is_valid_name(name));
}

function on_auth (name, pass, mail, callback)
{
	if (mail)
	{
		var player = game.register(name, pass, mail);
	}
	else
	{
		var player = game.login(name, pass);
	}

	if (player)
	{
		console.log('GRANTED %s', name);
		this.set('player', player);
		this.once('disconnect', on_disconnect);
		this.on('create', on_create);
		this.on('join', on_join);
		this.once('ready', on_ready);
		var gamee = player.login(this);

		if (gamee)
		{
			var realm = gamee.realms[player.name];
			this.set('realm', realm);
			callback(gamee.board, realm);
		}
		else
		{
			callback(true);
		}
	}
	else
	{
		console.log('DENIED %s', name);
		setTimeout(deny_access(this, callback), _DENY_DELAY * 1000);
	}
}

function on_create (options, callback)//spielparameter mit übergeben
{
	this.get('player', function (error, player)
	{
		var game = player.create_game(options);
		callback(game.stats);
	});
}

function on_join (options, callback)
{
	this.get('player', function (error, player)
	{
		var game = player.join_game(options);
		callback(game.stats);
	});
}

function on_ready ()
{
	//sicherstellen das nur der master das spiel frühzeitig starten kann
	////on('ready')nur für pl1
	this.get('player', function (error, player) { player.game.ready() });
}

function on_disconnect ()
{
	this.get('player', function (error, player) { player.logout() });
}

//module
socket.open = function (port)
{
	_sockets = io.listen(port).set('log level', 1).sockets;
	
	_sockets.on('connection', function (socket)
	{
		//socket.on('name', on_name);
		socket.once('auth', on_auth);
	});
}

socket.emit_join = function (player)
{
	player.socket.broadcast.to(player.game.id).emit('join', player.name);
}

socket.emit_leave = function (player)
{
	player.socket.broadcast.to(player.game.id).emit('leave', player.name);
}

socket.emit_ready = function (game, delay)
{
	_sockets.to(game.id).emit('ready', delay);
}

socket.emit_start = function (game)
{
	for (var name in game.slots)
	{
		var socket = game.slots[name].socket;
		var realm = game.realms[name];
		socket.set('realm', realm);
		socket.emit('start', game.board, realm);
	}
}

socket.emit_tick = function (game)
{
	_sockets.to(game.id).emit('tick', game.time);
}

socket.emit_away = function (player)
{
	player.socket.broadcast.to(player.game.id).emit('away', player.name);
}

socket.emit_back = function (player)
{
	player.socket.broadcast.to(player.game.id).emit('back', player.name);
}
