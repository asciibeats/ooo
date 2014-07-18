socket = {};
module.exports = socket;

var http = require('http');
var sockjs = require('sockjs');
//var util = require('../client/assets/util.js');
var Player = require('./player.js');
var Game = require('./game.js');

var _DENY_DELAY = 1;
var _START_DELAY = 3;
var _DISCONNECT = 'disconnect';
var _PLAYER = 2;

var _INIT = 0;
var _AUTH = 1;
var _ACTION = 3;
var _TICK = 4;
var _TOCK = 5;

_players = {};
_games = {};
_timeout = {};
_message = {};

_message[_AUTH] = function (id, pass)
{
}

socket.register = function (id, pass)
{
	var player = _players[id];

	if (!player)
	{
		console.log('REGISTER %s', id);
		player = new Player(id, pass);
		_players[id] = player;
		return player;
	}
}

socket.open = function  (port)
{
	console.log('OPEN %d', port);
	var hserver = http.createServer();
	var sserver = sockjs.createServer();
	sserver.installHandlers(hserver, {prefix: '/socket'});

	sserver.on('connection', function (socket)
	{
		socket.on('data', function (data)
		{
			if (Array.isArray(data))
			{
				var type = data.shift();
				console.log('DATA[' + type + ']', JSON.stringify(data));
				_message[type].apply(socket, data);
			}
		});

		socket.on('close', function ()
		{
			console.log('CLOSE');
		});
	});

	hserver.listen(port);//, '0.0.0.0'
}

function unique (id)
{
	return (_players[id] ? false : true);
}

function accept (socket, player)
{
	player.socket = socket;
	socket.set(_PLAYER, player);
	socket.once(_STOP, on_accepted(stop));//speicherproblem??? jede verbindung kriegt eigene funktionen??
	socket.on(_HOST, on_accepted(host));
	socket.on(_JOIN, on_accepted(join));
	socket.on(_TICK, on_accepted(tick));

	var states = {};

	for (var id in player.games)
	{
		states[id] = _games[id].state;
	}

	//socket.emit(_ACCEPTED, states);
}

function reject (socket)
{
	return function ()
	{
		socket.once('auth', on_auth);
		socket.emit(_REJECTED);
	}
}

function start (game)
{
	return function ()
	{
		console.log('START %s', game.id);
		delete _timeout[game.id];
		game.start();
		update(game, _START);
	}
}

function send (to, type, data)
{
	_players[to].socket.emit(type, data);
}

function shout (from, game, type, data)
{
	for (var id in game.slots)
	{
		if (id != from)
		{
			_players[id].socket.emit(type, data);
		}
	}
}

function update (game, type, data)
{
	for (var id in game.slots)
	{
		_players[id].socket.emit(type, data);
	}
}

function broadcast (type, data)//server down in x min for maintainence
{
	//io.socket.emit()
	for (var id in _players)
	{
		_players[id].socket.emit(type, data);
	}
}

//socket events
function on_open (socket)
{
	socket.on('data', on_data(socket));
	socket.on('close', on_close(socket));
}

function on_data (socket)
{
	return function (data)
	{
		console.log(data);
		socket.write('testo');
	};
}

function on_close (socket)
{
	return function ()
	{
		console.log('close');
	};
}

function on_auth (id, pass)
{
	console.log('BAAAA');
	var player = _players[id];

	if (player && !player.socket && (player.pass === pass))
	{
		console.log('ACCEPTED %s', id);
		accept(this, player);
	}
	else
	{
		console.log('REJECTED %s', id);
		setTimeout(reject(this), _DENY_DELAY * 1000);
	}
}

function on_accepted (func)
{
	return function ()
	{
		this.get(_DATA, function (error, player)
		{
			if (!error)
			{
				func.apply(player, arguments);
			}
		});
	}
}

//root functions (logged in/this=player)
function host (settings)
{
	var id = 'xz45gs';//get random & unused id
	var game = new Game(settings);
	_games[id] = game;
	this.games[id] = game;//encapsulate with this.join()???
	this.socket.emit(_STATE, [id, game.state]);
}

function join (id)
{
	var game = _games[id];

	if (game && game.join(this.id, this.power))
	{
		console.log('JOIN %s %s', this.id, id);
		this.games[id] = game;
		this.socket.emit(_STATE, [id, game.state]);
		others(this.id, game, _JOIN, [id, this.id, this.power]);

		if (game.full())
		{
			update(game, _READY, _START_DELAY);
			_timeout[id] = setTimeout(start(game), _START_DELAY * 1000);
		}
	}
}

function leave (id)
{
	var game = _games[id];

	if (game && game.leave(this.id))
	{
		console.log('LEAVE %s %s', this.id, id);
		delete this.games[id];

		if (_timeout[id])
		{
			clearTimeout(_timeout[id]);
			delete _timeout[id];
		}

		if (game.empty())
		{
			delete _games[id];
		}
		else
		{
			send_game(game, _LEAVE, [id, this.id]);
		}
	}
}

/*function start (id)//force start before slots reached
{
	if (!_games[id])
	{
		console.log('ERROR %s', 'no such game');
		this.socket.emit(_ERROR, 666);
		return;
	}

	var game = _games[id];

	if (!game.host == this.id)
	{
		console.log('ERROR %s', 'not allowed');
		this.socket.emit(_ERROR, 266);
		return;
	}

	game.start();
	send_game(game, _START, [id, game.state]);
}*/

function tick (id, actions)
{
	var game = _games[id];

	if (game && game.tick(this.id, actions))
	{
		console.log('TICK %s %s', id, this.id);

		if (game.tock())
		{
			update(game, _TOCK, game.state);
		}
		else
		{
			this.socket.emit(_WAIT);//brauch ich das??
		}
	}
}

function stop ()
{
	console.log('DISCONNECT %s', this.id);
	delete this.socket;
}
