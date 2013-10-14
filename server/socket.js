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
		callback(null);
	}
}

//events
/*function on_name (name, callback)
{
	callback(game.is_valid_name(name));
}*/

function on_auth (name, pass, mail, callback)
{
	var player;

	if (mail)
	{
		player = game.register(name, pass, mail);
	}
	else
	{
		player = game.login(name, pass);
	}

	if (player)
	{
		this.set('player', player);

		this.on('disconnect', on_disconnect);
		this.once('ready', on_ready);
		//this.on('turn', on_turn);
		this.on('pool', on_pool);

		player.socket = this;
		callback(player.init());
		player.game.check();
	}
	else
	{
		oO('DENIED', name);
		setTimeout(deny_access(this, callback), _DENY_DELAY * 1000);
	}
}

function on_ready ()
{
	this.get('player', function (error, player) { player.game.ready() });
}

function on_pool (x, y, type)
{
	this.get('player', function (error, player)
	{
		oO('POOL', player.name);
		player.game.addPool(x, y, type, player);

		player.socket.emit(x, y);
		_sockets.to(player.game.id).emit('pool', x, y, type);
	});
}

/*function on_turn (x, y)
{
	this.get('player', function (n, player)
	{
		var game = player.game;

		if (game.state.players[player.name].turn === game.state.turn)
		{
			oO('TURN', x, y);
			game.build(x, y);
			_sockets.to(game.id).emit('turn', x, y, game.state.turn, game.state.card);
		};
	});
};*/

function on_disconnect ()
{
	this.get('player', function (x,player) { player.logout() });
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
	/*for (var name in game.slots)
	{
		var player = game.slots[name];
		player.socket.emit('info', player.state);//to(player.game.id).
	}*/

	_sockets.to(game.id).emit('start', game.state);
}

socket.emit_tick = function (game)
{
	_sockets.to(game.id).emit('tick', game.state.time);
}

socket.emit_away = function (player)
{
	_sockets.to(player.game.id).emit('away', player.name);
}

socket.emit_back = function (player)
{
	_sockets.to(player.game.id).emit('back', player.name);
}
