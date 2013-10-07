var game = {};
module.exports = game;

var oO = require('../client/assets/oO.js');
var socket = require('./socket.js');

var _MIN_PLAYERS = 1;
var _MAX_PLAYERS = 1;
var _START_DELAY = 3;
var _TICK_LENGTH = 30;
var _SIZE = 8;

var _players = {};
var _games = {};

function Player (name, pass, mail)
{
	this.name = name;//unique
	this.pass = pass;
	this.mail = mail;
	this.socket = null;
	this.game = null;
	//this.friends = {};
	this.pools = [];
	//this.played = 1;//number of games
	//this.seeked = 1;//times played as seeker(ones because division by zero stuff)
};

Player.prototype.init = function ()
{
	if (this.game)
	{
		oO('BACK', this.game.id, this.name);
		this.socket.join(this.game.id);
		socket.emit_back(this);
	}
	else
	{
		for (var id in _games)
		{
			if (_games[id].join(this))
			{
				break;
			}
		}
	}

	if (!this.game)
	{
		var game = new Game(this);
		game.id = oO.fill(_games, game);
		oO('CREATE', game.id, this.name);
		this.socket.join(game.id);
		//socket.emit_invite(this.friends, player.game);
	}

	return this.game.state;
};

/*Player.prototype.ratio = function ()
{

	return (this.played / this.seeked);
};*/

Player.prototype.logout = function ()
{
	if (this.game.state.time)
	{
		oO('AWAY', this.game.id, this.name);
		socket.emit_away(this);
	}
	else
	{
		this.game.leave(this);
	}

	this.socket = null;
};

function Game (player)
{
	this.id = null;
	this.public = true;//temp->false
	this.slots = {};

	this.state = {};
	this.state.time = 0;
	this.state.players = {};
	this.state.board = [];
	this.state.build = [];
	this.state.pools = {};

	this.slots[player.name] = player;
	this.state.players[player.name] = {};
	player.game = this;
};

Game.prototype.join = function (player)
{
	if (this.public && !this.timeout && (oO.size(this.slots) < _MAX_PLAYERS))//letzte bedingung trifft net zu da autostart??
	{
		oO('JOIN', this.id, player.name);

		this.slots[player.name] = player;
		this.state.players[player.name] = {};
		player.game = this;
		player.socket.join(this.id);
		socket.emit_join(player);

		return true;
	}
};

Game.prototype.leave = function (player)
{
	oO('LEAVE', this.id, player.name);

	if (this.timeout)
	{
		clearTimeout(this.timeout);
		delete this.timeout;
	}

	delete this.slots[player.name];
	delete this.state.players[player.name];

	if (oO.size(this.slots) > 0)
	{
		socket.emit_leave(player);
	}
	else
	{
		delete _games[this.id];
	}

	player.socket.leave(this.id);
	player.game = null;
};

Game.prototype.check = function ()
{
	if (!this.state.time && (oO.size(this.slots) === _MAX_PLAYERS))
	{
		this.ready();
	}
};

Game.prototype.ready = function ()
{
	if (!this.timeout && (oO.size(this.slots) >= _MIN_PLAYERS))
	{
		oO('READY', this.id);

		socket.emit_ready(this, _START_DELAY);
		var that = this;
		this.timeout = setTimeout(function () { that.start() }, _START_DELAY * 1000);
	}
};

Game.prototype.start = function ()
{
	oO('START', this.id);

	this.public = false;
	delete this.timeout;

	for (var y = 0; y < _SIZE; y++)
	{
		this.state.board[y] = [];

		for (var x = 0; x < _SIZE; x++)
		{
			this.state.board[y][x] = Math.floor(Math.random() * 2);
		}
	}

	for (var y = 0; y < _SIZE * 2; y++)
	{
		this.state.build[y] = [];

		for (var x = 0; x < _SIZE * 2; x++)
		{
			var type = Math.round(Math.random() * 12);

			if (type > 6)
			{
				this.state.build[y][x] = type - 6;
			}
			else
			{
				this.state.build[y][x] = 0;
			}
			/*if (((x == 0) && (y % 3 == 0)) || (y == 0))
			{
				this.state.build[y][x] = Math.round(Math.random() * 5) + 1;
			}
			else
			{
				this.state.build[y][x] = 0;
			}*/
		}
	}

	this.state.time = 1;

	socket.emit_start(this);

	var that = this;
	this.interval = setInterval(function () { that.tick() }, _TICK_LENGTH * 1000);
};

Game.prototype.tick = function ()
{
	this.state.time++;
	oO('TICK', this.id, this.state.time);
	socket.emit_tick(this);
};

/*Game.prototype.build = function (x, y)
{
	if (!this.state.board[y])
	{
		this.state.board[y] = {};
	}

	this.state.board[y][x] = this.state.card;
	this.state.turn = (this.state.turn + 1) % this.size;
	this.state.card = this.cards[0].shift();
};*/

Game.prototype.addPool = function (x, y, type, player)
{
	if (!this.state.pools[y])
	{
		this.state.pools[y] = {};
	}

	this.state.pools[y][x] = type;
	player.pools.push([x, y]);
};

game.is_valid_name = function (name)
{
	return (_players[name] ? false : true);
};

game.register = function (name, pass, mail)
{
	if (!_players[name])
	{
		oO('REGISTER', name);
		_players[name] = new Player(name, pass, mail);
		return _players[name];
	}
};

game.login = function (name, pass)
{
	if (_players[name] && !_players[name].socket && (_players[name].pass === pass))
	{
		oO('LOGIN', name);
		return _players[name];
	}
};
