var t1l = require('./t1l.js');

var DENY_DELAY = 1;
var START_DELAY = 3;

var CLOSE = -2;
var OPEN = -1;
var NULL = 0;

var LOGIN = 1;
var READY = 2;
var HOST = 3;
var JOIN = 4;
var LOBBY = 5;
var TICK = 6;
var DENY = 7;
var LEAVE = 8;
var AWAY = 9;
var BACK = 10;
var START = 11;
var TOCK = 12;
var CONTINUE = 13;

var players = {};
//var groups = {};
var games = {};
var online = {};
var sockets = {};
//var leaders = {};
var timeout = {};

function unique (name)
{
	return (players[name] ? false : true);
}

function register (name, pass)
{
	if (unique(name))
	{
		console.log('REGISTER %s', name);
		var player = new t1l.Player();
		player.login(name, pass);
		players[name] = player;
	}
}

function toothers (name, names, message, store)
{
	for (var i in names)
	{
		if (names[i] == name)
		{
			continue;
		}

		var socket = online[names[i]];

		if (socket)
		{
			socket.send(message);
		}
		else if (store)
		{
			var player = players[name];

			if (player)
			{
				player.store(message);
			}
		}
	}
}

function broadcast (names, message, store)
{
	for (var i in names)
	{
		var socket = online[names[i]];

		if (socket)
		{
			socket.send(message);
		}
		else if (store)
		{
			var player = players[name];

			if (player)
			{
				player.store(message);
			}
		}
	}
}

register('a', 'a');
register('b', 'b');

var sockman = new t1l.Sockman();

sockman.on(OPEN, [LOGIN], function ()
{
	console.log('%d OPEN', this.id);
});

sockman.on(LOGIN, [LOGIN, HOST, JOIN, TICK], function (name, pass)
{
	var player = players[name];

	if (player && !online[name] && (player.pass === pass))
	{
		console.log('%d LOGIN %s %s', this.id, name, pass);
		sockets[this.id] = player;
		online[name] = this;

		for (var id in player.games)
		{
			var game = games[id];
			console.log('%d BACK %d', this.id, game.id);
			var names = game.joined();
			var seat = game.seats[name];
			var realm = game.realms[seat];
			this.send([CONTINUE, game.id, game.rules, names, game.board.terrain, game.time, seat, realm]);
			toothers(name, names, [BACK, game.id, player.name]);
		}

		if (!game)
		{
			var list = Object.keys(games);
			this.send([LOGIN, list]);
		}

		/*for (var i = 0, j = message = player.messages.pop())
		{
			//send stored messages
			this.send(message);
		}*/

		//var names = Object.keys(player.friends);
		//broadcast(names, [ONLINE, name]);
	}
	else
	{
		console.log('%d DENY %s', this.id, name);
		var that = this;
		setTimeout(function () { that.send([DENY]) }, DENY_DELAY * 1000);
	}
});

sockman.on(HOST, [TICK], function (rules)
{
	var player = sockets[this.id];
	var game = new t1l.Game(rules, player.name);
	game.id = t1l.fill(games, game);
	console.log('%d HOST %d %s', this.id, game.id, JSON.stringify(rules));
	//player.join(game.id);
	this.send([LOBBY, game.id, game.rules, game.joined(), game.board.terrain]);
});

sockman.on(JOIN, [TICK], function (id)
{
	var game = games[id];

	if (!game)
	{
		//game does not exist
		return 777;
	}

	var player = sockets[this.id];
	var others = game.join(player.name);

	if (others)
	{
		console.log('%d JOIN %d', this.id, id);
		broadcast(others, [JOIN, id, player.name]);
		this.send([LOBBY, game.id, game.rules, game.joined(), game.board.terrain]);

		if (!game.free)
		{
			console.log('READY %d %d', game.id, START_DELAY);
			broadcast(game.joined(), [READY, id, START_DELAY]);

			timeout[game.id] = setTimeout(function ()
			{
				console.log('START %d', game.id);
				delete timeout[game.id];
				game.start();

				for (var name in game.seats)
				{
					players[name].join(game.id);
					var seat = game.seats[name];
					var realm = game.realms[seat];
					//var history = game.history(seat);
					var spawn = 10;
					var socket = online[name];
					socket.send([START, game.id, game.time, seat, realm]);//history.quests, history.results
				}
			}, START_DELAY * 1000);
		}
	}
	else
	{
		//join failed (banned? full? closed?)
		return 555;
	}
});

sockman.on(TICK, [TICK], function (id, quests)
{
	var player = sockets[this.id];

	if (!player)
	{
		throw 233;
	}

	var game = games[id];

	if (!game)
	{
		throw 777;
	}

	console.log('%d TICK %s', this.id, JSON.stringify(quests));

	game.tick(player.name, quests, function ()
	{
		console.log('COMPLETE');
		//broadcast(game.joined(), [TOCK, id]);

		for (var name in game.seats)
		{
			var socket = online[name];
			//var seat = game.seats[name];
			//var history = game.history(seat);
			socket.send([TOCK, id]);
		}
	});
});

sockman.on(CLOSE, [], function ()
{
	var player = sockets[this.id];

	if (player)
	{
		for (var id in player.games)
		{
			var game = games[id];

			if (game.time)//running
			{
				console.log('%d AWAY %d', this.id, game.id);
				
				for (var name in game.seats)
				{
					if (online[name] && (name != player.name))
					{
						online[name].send([AWAY, game.id, player.name]);
					}
				}
			}
			else
			{
				console.log('%d LEAVE %d', this.id, game.id);
				player.leave(game.id);
				var others = game.leave(player.name);

				if (others.length)
				{
					if (timeout[game.id])
					{
						clearTimeout(timeout[game.id]);
						delete timeout[game.id];
					}

					broadcast(others, [LEAVE, game.id, player.name]);
				}
				else
				{
					console.log('delete');
					delete games[game.id];
				}
			}
		}

		for (var name in player.friends)
		{
			//send offline notification
		}

		console.log('%d LOGOUT %s', this.id, player.name);
		delete sockets[this.id];
		delete online[player.name];
	}

	console.log('%d CLOSE', this.id);
});

sockman.open(11133);
