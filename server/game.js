var mars_game = {};
module.exports = mars_game;

var oO = require('../client/assets/oO');
var hide_socket = require('./socket');

var _MIN_PLAYERS = 2;
var _MAX_PLAYERS = 2;
var _START_DELAY = 3;

var _players = {};
var _games = {};

function Player (name, pass, mail)
{
	this.name = name;//unique
	this.pass = pass;
	this.mail = mail;
	this.socket = null;
	this.game = null;
	this.friends = {};
	//this.played = 1;//number of games
	//this.seeked = 1;//times played as seeker(ones because division by zero stuff)
};

Player.prototype.init = function ()
{
	if (this.game)
	{
		oO('BACK', this.game.id, this.name);
		this.socket.join(this.game.id);
		hide_socket.emit_back(this);
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
		//hide_socket.emit_invite(this.friends, player.game);
	}

	return this.game.state;
};

/*Player.prototype.ratio = function ()
{

	return (this.played / this.seeked);
};*/

Player.prototype.logout = function ()
{
	if (this.game.state.running)
	{
		oO('AWAY', this.game.id, this.name);
		hide_socket.emit_away(this);
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
	this.timeout = null;
	this.slots = {};

	this.state = {};
	this.state.running = false;
	this.state.players = {};

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
		hide_socket.emit_join(player);

		return true;
	}
};

Game.prototype.leave = function (player)
{
	oO('LEAVE', this.id, player.name);

	if (this.timeout)
	{
		clearTimeout(this.timeout);
		this.timeout = null;
	}

	delete this.slots[player.name];
	delete this.state.players[player.name];

	if (oO.size(this.slots) > 0)
	{
		hide_socket.emit_leave(player);
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
	if (!this.state.running && (oO.size(this.slots) === _MAX_PLAYERS))
	{
		this.ready();
	}
};

Game.prototype.ready = function ()
{
	if (!this.timeout && (oO.size(this.slots) >= _MIN_PLAYERS))
	{
		oO('READY', this.id);

		hide_socket.emit_ready(this, _START_DELAY);
		var that = this;
		this.timeout = setTimeout(function () { that.start() }, _START_DELAY * 1000);
	}
};

Game.prototype.start = function ()
{
	oO('START', this.id);

	this.public = false;
	this.timeout = null;

	var players = Object.keys(this.state.players);
	this.size = players.length;
	//maybe randomize players

	for (var i in players)
	{
		this.state.players[players[i]].turn = parseInt(i);
	}

	var cards = [[1,1,2,1,1,1,2,1,2,1,2,1,1],[3,3,3,4,3,3,4,3,3,4,3,3,3],[5,5,5,5,5,5,5,5,5,5,5,5,5]];

	this.cards = cards;
	this.state.running = true;
	this.state.board = {};
	this.state.turn = 0;
	this.state.card = this.cards[0].shift();

	hide_socket.emit_start(this);
};

Game.prototype.build = function (x, y)
{
	if (!this.state.board[y])
	{
		this.state.board[y] = {};
	}

	this.state.board[y][x] = this.state.card;
	this.state.turn = (this.state.turn + 1) % this.size;
	this.state.card = this.cards[0].shift();
};

mars_game.is_valid_name = function (name)
{

	return (_players[name] ? false : true);
};

mars_game.register = function (name, pass, mail)
{
	if (!_players[name])
	{
		oO('REGISTER', name);
		_players[name] = new Player(name, pass, mail);
		return _players[name];
	}
};

mars_game.login = function (name, pass)
{
	if (_players[name] && !_players[name].socket && (_players[name].pass === pass))
	{
		oO('LOGIN', name);
		return _players[name];
	}
};
