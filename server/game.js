var game = {};
module.exports = game;

var socket = require('./socket.js');
var util = require('../client/assets/util.js');

var _MIN_PLAYERS = 1;
var _MAX_PLAYERS = 1;
var _START_DELAY = 3;
var _TICK_LENGTH = 30;
var _SIZE = 16;
var _NMASK = [[[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]], [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]]];

var _ACTION_BUILD = 0;
var _ACTION_CAPTURE = 1;

var _players = {};
var _games = {};

game.is_valid_name = function (name)
{
	return (_players[name] ? false : true);
}

game.register = function (name, pass, mail)
{
	if (!_players[name])
	{
		console.log('REGISTER %s', name);
		_players[name] = new Player(name, pass, mail);
		return _players[name];
	}
}

game.login = function (name, pass)
{
	if (_players[name] && !_players[name].socket && (_players[name].pass === pass))
	{
		console.log('LOGIN %s', name);
		return _players[name];
	}
}

function Player (name, pass, mail)
{
	this.name = name;//unique
	this.pass = pass;
	this.mail = mail;
	this.socket = null;
	this.game = null;
	//this.friends = {};
	//this.played = 1;//number of games
	//this.seeked = 1;//times played as seeker(ones because division by zero stuff)
}

Player.prototype.login = function (sock)
{
	this.socket = sock;

	if (this.game)
	{
		console.log('BACK %d %s', this.game.id, this.name);
		this.socket.join(this.game.id);
		socket.emit_back(this);
		return this.game;
	}
}

Player.prototype.stats = function ()
{
	return {};
}

Player.prototype.create_game = function (options)
{
	var game = new Game(options);
	console.log('CREATE %d %s', game.id, this.name);
	game.join(this);
	return game;
}

Player.prototype.join_game = function (options)
{
	for (var id in _games)
	{
		if (_games[id].join(this))
		{
			return this.game;
		}
	}

	return this.create_game();
}

/*Player.prototype.ratio = function ()
{
	return (this.played / this.seeked);
};*/

Player.prototype.logout = function ()
{
	if (this.game)
	{
		if (this.game.time)
		{
			console.log('AWAY %d %s', this.game.id, this.name);
			socket.emit_away(this);
		}
		else
		{
			this.game.leave(this);
		}
	}

	this.socket = null;
}

function Game (options)
{
	//map size
	this.size = options.size || 16;
	//is it open to the public to join
	this.open = true;//temp->false

	//joined players
	//player objectreferences
	this.slots = {};
	//player stats
	this.stats = {};
	//private player knowledge
	this.realms = {};

	//number of ticks past overall
	this.time = 0;
	//hextile types (plain, forest, mountain...)
	this.board = [];
	this.neigh = [];
	//COMBINE BOARD & BUILD!!!! -> SO KNOWLEDGE OF BOARD IMPLIES KNOWLEDGE OF BUILD TO PLAYER
	//the objects on top of tiles (trees, buildings...)
	//this.build = [];
	this.id = util.fill(_games, this);
}

Game.prototype.number_of_players = function ()
{
	return Object.keys(this.slots).length;
}

Game.prototype.join = function (player)
{
	if (this.open && !this.timeout && (this.number_of_players() < _MAX_PLAYERS))
	{
		console.log('JOIN %d %s', this.id, player.name);
		this.slots[player.name] = player;
		this.stats[player.name] = player.stats();
		player.game = this;
		player.socket.join(this.id);
		socket.emit_join(player);

		if (this.number_of_players() === _MAX_PLAYERS)
		{
			this.ready();
		}

		return true;
	}
}

Game.prototype.leave = function (player)
{
	console.log('LEAVE %d %s', this.id, player.name);

	if (this.timeout)
	{
		clearTimeout(this.timeout);
		delete this.timeout;
	}

	delete this.slots[player.name];
	delete this.stats[player.name];

	if (this.number_of_players() > 0)
	{
		socket.emit_leave(player);
	}
	else
	{
		delete _games[this.id];
	}

	player.socket.leave(this.id);
	player.game = null;
}

Game.prototype.ready = function ()
{
	if (!this.timeout && (this.number_of_players() >= _MIN_PLAYERS))
	{
		console.log('READY %d', this.id);
		socket.emit_ready(this, _START_DELAY);
		var that = this;
		this.timeout = setTimeout(function () { that.start() }, _START_DELAY * 1000);
	}
}

Game.prototype.start = function ()
{
	console.log('START %d', this.id);
	this.open = false;
	this.time = 1;
	delete this.timeout;

	//generate random board
	for (var y = 0; y < _SIZE; y++)
	{
		this.board[y] = [];
		this.neigh[y] = [];

		for (var x = 0; x < _SIZE; x++)
		{
			var tile = {};
			tile.x = x;
			tile.y = y;
			tile.type = Math.floor(Math.random() * 4) + 1;
			this.board[y][x] = tile;
			this.neigh[y][x] = [];
		}
	}

	//build up neighbor connections
	for (var y = 0; y < _SIZE; y++)
	{
		var nmask = _NMASK[y & 1];

		for (var x = 0; x < _SIZE; x++)
		{
			var neigh = this.neigh[y][x];

			for (var i in nmask)
			{
				var nx = (x + nmask[i][0] + _SIZE) % _SIZE;
				var ny = (y + nmask[i][1] + _SIZE) % _SIZE;
				neigh[i] = this.board[ny][nx];
			}
		}
	}

	//generate random build
	/*var seeds = [];

	for (var i = 0; i < 5; i++)
	{
		seeds[i] = {x: Math.floor(Math.random() * _SIZE * 2), y: Math.floor(Math.random() * _SIZE * 2)};
	}

	for (var y = 0; y < _SIZE * 2; y++)
	{
		this.build[y] = [];

		for (var x = 0; x < _SIZE * 2; x++)
		{
			var type = Math.round(Math.random() * 12);

			if (type > 6)
			{
				this.build[y][x] = type - 6;
			}
			else
			{
				this.build[y][x] = 0;
			}
		}
	}*/

	//assign startingpoint (and hero) to each player
	//separieren:was alle wissen(allgemeines)/spielerwissen/serverdata
	var id = 0;
	var x = 0;
	var y = 0;

	for (var name in this.slots)
	{
		var realm = {};
		realm.id = id;
		realm.x = x;
		realm.y = y;
		realm.name = 'Mordor';
		
		realm.population = {count: 10, stats: {anger: 0, health: 1}};
		realm.characters = [];
		realm.succession = [];

		realm.gain = 10;
		realm.affect = {};
		realm.affect[id] = 5;//rest geht in entdeckung?
		realm.coins = {};
		realm.coins[id] = 5;
		realm.discover = 5;
		this.realms[name] = realm;
		var neigh = this.neigh[y][x];

		for (var i in neigh)
		{
			neigh[i].realm = id;
		}

		id++;
	}

	socket.emit_start(this);
	var that = this;
	this.interval = setInterval(function () { that.tick() }, _TICK_LENGTH * 1000);
}

Game.prototype.tick = function ()
{
	this.time++;
	console.log('TICK %d %d', this.id, this.time);

	//calc changes
	//return;
	/*for (var name in this.realms)
	{
		var realm = this.realms[name];

		while (var action = realm.actions.pop())
		{
			if (action.type == _ACTION_BUILD)
			{
				this.build(name, action.data);
			}
			else if (action.type == _ACTION_CAPTURE)
			{
			}
		}
	}*/

	socket.emit_tick(this);
}

Game.prototype.build = function (name, data)
{
	//verify consitency
	////if no build at that place und player darf da
	//raise updated-flag
	this.update.build.push(tile);
	//update game
	this.board[action.y][action.x].type = 7;
}

Game.prototype.reveal = function (name, x, y)
{
	util.add(this.realms[name].board, this.board[y][x], y, x);
}

Game.prototype.capture = function (name, x, y)
{
	this.board[y][x].realm = name;
}

Game.prototype.retreat = function (tile)
{
	delete this.board[y][x].realm;
}
