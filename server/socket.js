var hide_socket = {};
module.exports = hide_socket;

var io = require('socket.io');
var hide_game = require('./game');

var _sockets;

var _DENY_DELAY = 3;

//helper
function deny_access (socket, callback)
{
	return function ()
	{
		socket.once('auth', on_auth);
		callback(null);
	};
};

//events
function on_name (name, callback)
{
	callback(hide_game.is_valid_name(name));
};

function on_auth (name, pass, mail, callback)
{
	var player;

	if (mail)
	{
		player = hide_game.register(name, pass, mail);
	}
	else
	{
		player = hide_game.login(name, pass);
	}

	if (player)
	{
		this.set('player', player);

		this.on('disconnect', on_disconnect);
		this.once('ready', on_ready);
		this.on('turn', on_turn);

		player.socket = this;
		callback(player.init());
		player.game.check();
	}
	else
	{
		oO('DENIED', name);
		setTimeout(deny_access(this, callback), _DENY_DELAY * 1000);
	}
};

function on_ready ()
{
	this.get('player', function (x,player) { player.game.ready() });
};

function on_turn (x, y)
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
};

function on_disconnect ()
{
	this.get('player', function (x,player) { player.logout() });
};

//module
hide_socket.open = function (port)
{
	_sockets = io.listen(port).sockets;
	
	_sockets.on('connection', function (socket)
	{
		socket.on('name', on_name);
		socket.once('auth', on_auth);
	});
};

hide_socket.emit_join = function (player)
{

	player.socket.broadcast.to(player.game.id).emit('join', player.name);
};

hide_socket.emit_leave = function (player)
{

	player.socket.broadcast.to(player.game.id).emit('leave', player.name);
};

hide_socket.emit_ready = function (game, delay)
{
	_sockets.to(game.id).emit('ready', delay);
};

hide_socket.emit_start = function (game)
{
	_sockets.to(game.id).emit('start', game.state.players, game.state.board, game.state.turn, game.state.card);
};

hide_socket.emit_away = function (player)
{
	_sockets.to(player.game.id).emit('away', player.name);
};

hide_socket.emit_back = function (player)
{
	_sockets.to(player.game.id).emit('back', player.name);
};
