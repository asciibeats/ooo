

socket.on('login', ['login', 'host', 'join', 'tick'], function (name, pass)
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
			this.send(['continue', game.id, game.rules, names, game.board.terrain, game.time, seat, realm]);
			toothers(name, names, ['back', game.id, player.name]);
		}

		if (!game)
		{
			var list = Object.keys(games);
			this.send(['login', list]);
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
		setTimeout(function () { that.send(['deny']) }, DENY_DELAY * 1000);
	}
});

socket.on('host', ['tick'], function (rules)
{
	var player = sockets[this.id];
	var game = new oO.Game(rules, player.name);
	game.id = oO.fill(games, game);
	console.log('%d HOST %d %s', this.id, game.id, JSON.stringify(rules));
	//player.join(game.id);
	this.send(['lobby', game.id, game.rules, game.joined(), game.board.terrain]);
});

socket.on('join', ['tick'], function (id)
{
	var game = games[id];

	if (!game)
	{
		//game does not exist
		throw 777;
	}

	var player = sockets[this.id];
	var others = game.join(player.name);

	if (others)
	{
		console.log('%d JOIN %d', this.id, id);
		broadcast(others, ['join', id, player.name]);
		this.send(['lobby', game.id, game.rules, game.joined(), game.board.terrain]);

		if (!game.free)
		{
			console.log('READY %d %d', game.id, START_DELAY);
			broadcast(game.joined(), ['ready', id, START_DELAY]);

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
					socket.send(['start', game.id, game.time, seat, realm]);//history.quests, history.results
				}
			}, START_DELAY * 1000);
		}
	}
	else
	{
		//join failed (banned? full? closed?)
		throw 555;
	}
});

socket.on('tick', ['tick'], function (id, quests)
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
			socket.send(['tock', id]);
		}
	});
});


var players = {};
//var groups = {};
var games = {};
var online = {};
var sockets = {};
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
		var player = new oO.Player();
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


socket.on('open', ['host', 'join', 'tick'], function ()
{
	console.log('OPEN %s', this.name);
});

socket.on('login', ['login', 'host', 'join', 'tick'], function (name, pass)
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
			this.send(['continue', game.id, game.rules, names, game.board.terrain, game.time, seat, realm]);
			toothers(name, names, ['back', game.id, player.name]);
		}

		if (!game)
		{
			var list = Object.keys(games);
			this.send(['login', list]);
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
		setTimeout(function () { that.send(['deny']) }, DENY_DELAY * 1000);
	}
});

socket.on('host', ['tick'], function (rules)
{
	var player = sockets[this.id];
	var game = new oO.Game(rules, player.name);
	game.id = oO.fill(games, game);
	console.log('%d HOST %d %s', this.id, game.id, JSON.stringify(rules));
	//player.join(game.id);
	this.send(['lobby', game.id, game.rules, game.joined(), game.board.terrain]);
});

socket.on('join', ['tick'], function (id)
{
	var game = games[id];

	if (!game)
	{
		//game does not exist
		throw 777;
	}

	var player = sockets[this.id];
	var others = game.join(player.name);

	if (others)
	{
		console.log('%d JOIN %d', this.id, id);
		broadcast(others, ['join', id, player.name]);
		this.send(['lobby', game.id, game.rules, game.joined(), game.board.terrain]);

		if (!game.free)
		{
			console.log('READY %d %d', game.id, START_DELAY);
			broadcast(game.joined(), ['ready', id, START_DELAY]);

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
					socket.send(['start', game.id, game.time, seat, realm]);//history.quests, history.results
				}
			}, START_DELAY * 1000);
		}
	}
	else
	{
		//join failed (banned? full? closed?)
		throw 555;
	}
});

socket.on('tick', ['tick'], function (id, quests)
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
			socket.send(['tock', id]);
		}
	});
});

socket.on('close', function ()
{
	console.log('CLOSE %s', this.name);
	return;
	var player = sockets[this.id];

	if (player)
	{
		for (var id in player.games)
		{
			var game = games[id];

			if (game.running)//running
			{
				console.log('%d AWAY %d', this.id, game.id);
				
				for (var name in game.seats)
				{
					if (online[name] && (name != player.name))
					{
						online[name].send(['away', game.id, player.name]);
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

					broadcast(others, ['leave', game.id, player.name]);
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
