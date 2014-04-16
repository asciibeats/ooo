var t1l = require('./t1l.js');
var cmn = require('../client/cmn.js');

var DELAY = 1;

var CLOSE = -2;
var OPEN = -1;
var NULL = 0;

var SPAWN = 1;
var SYNC = 2;
var HOST = 3;
var JOIN = 4;
var LOBBY = 5;
var TICK = 6;
var DENY = 7;

var players = {};
var games = {};
var online = {};
var sockets = {};
//var chars = {};

function unique (name)
{
	return (players[name] ? false : true);
}

function register (name, pass)
{
	if (unique(name))
	{
		console.log('REGISTER %s', name);
		var player = new cmn.Player();
		player.login(name, pass);
		players[name] = player;
	}
}

register('a', 'a');
register('b', 'b');

var sockman = new t1l.Sockman();

sockman.on(OPEN, [SPAWN], function ()
{
	console.log('%d OPEN', this.id);
});

sockman.on(CLOSE, [], function ()
{
	var player = sockets[this.id];

	if (player)
	{
		console.log('%d LOGOUT %s', this.id, player.name);
		delete sockets[this.id];
		delete online[player.name];
	}

	console.log('%d CLOSE', this.id);
});

sockman.on(SPAWN, [SPAWN, HOST, JOIN], function (name, pass)
{
	var player = players[name];

	if (player && !online[name] && (player.pass === pass))
	{
		console.log('%d ACCEPTED %s', this.id, name);
		sockets[this.id] = player;
		online[name] = true;
		this.send(SYNC, player.toState(), [1,2,3], Object.keys(games));
	}
	else
	{
		console.log('%d REJECTED %s', this.id, name);
		var that = this;
		setTimeout(function () { that.send(DENY) }, DELAY * 1000);
	}
});

sockman.on(JOIN, [], function (id)
{
	console.log('%d JOIN %s', this.id, id);
	var game = games[id];

	if (!game)
	{
		return 777;
	}

	//game.join(this.id);
});

sockman.on(HOST, [], function (setup)
{
	console.log('%d HOST %s', this.id, setup);
	var game = new cmn.Game(setup);
	game.id = t1l.fill(games, game);
	//game.join(this.id);
});

sockman.open(11133);
