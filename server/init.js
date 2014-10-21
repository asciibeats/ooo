var ooo = require('./ooo.js'), fs = require('fs');

var START_DELAY = 0;
var DENY_DELAY = 0;
var COOLDOWN = [1, 0];
var SUBTICKS = 24;
var MAXSKILL = 9;
var STATNAMES = ['insight', 'stamina', 'vision'];
var ITEMTILES = [0, 0, 0, 0, 0, 0, 3, 0, 0, 0];

var ITEMS = [];
ITEMS[0] = {name: 'World', description: '', type: 1, obscurity: 0, visibility: 0};//eatable,wearable,
ITEMS[1] = {name: 'Grass', description: 'Just grass...', type: 1, obscurity: 1, visibility: 1};//eatable,wearable,
ITEMS[2] = {name: 'Forest', description: 'Just grass...', type: 1, obscurity: 1, visibility: 1};//eatable,wearable,
ITEMS[5] = {name: 'Basket', description: 'Delicious green apple', type: 1, obscurity: 2, visibility: 1};
ITEMS[6] = {name: 'Apple', description: 'Delicious green apple', type: 1, obscurity: 1, visibility: 2};
ITEMS[8] = {name: 'Ring', description: 'Delicious green apple', type: 1, obscurity: 9, visibility: 1};
ITEMS[7] = {name: 'Tree', description: 'Maple tree', type: 1, obscurity: 9, visibility: 0};

var VCOSTS = ITEMS.map(function (elem)
{
	return elem.obscurity;
});

var ACTIONS = {};

//char.state
function examine (id, insight)
{
	var info = this.tile.map.info[id];
	var item = ITEMS[info[1]];
	insight -= item.obscurity;

	if (insight > 0)
	{
		var children = info[3];

		for (var i = 0; i < children.length; i++)
		{
			info = this.tile.map.info[children[i]];
			item = ITEMS[info[1]];

			if (item.visibility <= insight)
			{
				this.info[info[0]] = info;
				examine.call(this, info[0], insight - item.visibility);
			}
		}
	}
}

//examine info
ACTIONS[0] = function (id)
{
	examine.call(this, id, this.stats.insight);
}

function Node (argv)
{
	this.id = argv[0];
	this.parent = argv[1];
	this.type = argv[2];
	this.children = {};
}

var Info = function (data)
{
	this.nodes = [];
}

Info.prototype.learn = function (state, info)
{
	var insight = state.insight - ITEMS[info[0]].obscurity;
	var news = [];

	if (insight > 0)
	{
		for (var i = 0; i < info[1].length; i++)
		{
			var type = info[1][i][0];
			var subitem = ITEMS[type];

			if (subitem.visibility <= insight)
			{
				news.push([type, look(node[1][i], insight - subitem.visibility)]);
			}
		}
	}

	return news;
}

//stamina = max hours awake???
var Char = ooo.Class.extend(function (seat, i, name, stats, tile, wake, actions)
{
	this.seat = seat;
	this.i = i;
	this.name = name;
	this.stats = stats;
	this.tile = tile;
	this.wake = wake;
	this.actions = actions;
	this.step = 0;
});

Char.method('prepare', function ()
{
	this.state = {};
	this.state.name = this.name;
	this.state.stats = ooo.clone(this.stats);
	this.state.tile = this.tile;
	this.state.info = [];
});

Char.method('resolve', function ()
{
	console.log(this.name + ' is finished!!!!');

	for (var id in this.state.info)
	{
		var info = this.state.info[id];
		console.log('I saw "' + ITEMS[info[1]].name + '" @ ' + info[2] + '/' + id);
	}

	this.step = 0;
	delete this.state;
});

var World = ooo.TileMap.extend(function (size, info)
{
	if (info.length < (size * size))
	{
		throw 'info to small';
	}

	this.info = info;
	ooo.TileMap.call(this, size);
});

World.method('Data', function (map, i, x, y)
{
	this.type = ITEMTILES[map.info[i][1]];
});

/*World.method('getTile', function (id)
{
	var info = this.info[id];

	while (info[1] != null)
	{
		info = this.info[info[1]];
	}

	return this.index[info[0]];
});*/

var Game = ooo.Class.extend(function (rules, info)
{
	this.rules = rules;
	this.world = new World(rules[1], info);
	this.time = 0;
	this.ticks = 0;
	this.open = true;
	this.started = false;
	this.players = {};
	this.seats = {};
	this.realms = [];
	this.chars = [];
});

Game.method('broadcast', function (type, data)
{
	for (var name in this.players)
	{
		var player = this.players[name];
		player.client.send(type, data);
	}
});

Game.method('names', function ()
{
	return Object.keys(this.players);
});

function isready (game)
{
	return (ooo.size(game.players) == game.rules[0]);
}

Game.method('join', function (player)
{
	console.log('JOIN %d %s', this.id, player.name);
	this.broadcast('join', [player.name]);
	this.players[player.name] = player;
	player.game = this;

	if (!isready(this))
	{
		return;
	}

	console.log('READY %d %d', this.id, START_DELAY);
	this.open = false;
	this.broadcast('ready', [START_DELAY]);
	var that = this;
	this.timeout = setTimeout(function () { that.start() }, START_DELAY * 1000);
});

Game.method('leave', function (player)
{
	delete this.players[player.name];
	player.game = null;

	if (this.timeout)
	{
		this.open = true;
		clearTimeout(this.timeout);
		delete this.timeout;
	}

	if (ooo.size(this.players) > 0)
	{
		console.log('LEAVE %d %s', this.id, player.name);
		this.broadcast('leave', [player.name]);
	}
	else
	{
		console.log('CANCEL %d %s', this.id, player.name);
		delete player.client.server.games[this.id];
	}
});

Game.method('start', function ()
{
	console.log('START %d', this.id);
	delete this.timeout;
	this.started = true;
	var seat = 0;

	for (var name in this.players)
	{
		var realm = {};
		realm.time = 0;
		realm.info = [];
		realm.chars = [];
		this.realms[seat] = realm;
		this.seats[name] = seat++;
		var client = this.players[name].client;

		if (client)
		{
			client.send('start', [realm.info]);
			client.expected = {};
			client.expect('tick');
		}
	}
});

function template (size)
{
	var quests = [];

	for (var seat = 0; seat < size; seat++)
	{
		quests[seat] = [];
	}

	return quests;
}

Game.method('tick', function (player, chars)
{
	console.log('TICK %d %s', this.id, player.name);
	this.ticks++;
	var seat = this.seats[player.name];
	var realm = this.realms[seat];
	realm.chars = chars;
	realm.time++;

	for (var i = 0; i < chars.length; i++)
	{
		var argv = chars[i];
		var stats = ooo.map(STATNAMES, argv[1]);
		var tile = this.world.index[argv[2]];
		var char = new Char(seat, i, argv[0], stats, tile, argv[3], argv[4]);
		this.chars.push(char);
	}
});

Game.method('tock', function ()
{
	console.log('TOCK %d %d', this.id, this.time);
	this.ticks = 0;

	for (var time = 0; time < SUBTICKS; time++)
	{
		var actions = {};

		//collect actions
		for (var i = 0; i < this.chars.length; i++)
		{
			var char = this.chars[i];

			if (char.step == 0)
			{
				if (char.wake == time)
				{
					char.prepare();
				}
				else
				{
					continue;
				}
			}

			if (!actions[char.state.tile.i])
			{
				actions[char.state.tile.i] = [];
			}

			actions[char.state.tile.i].push(char);
		}

		//resolve actions
		for (var i in actions)
		{
			console.log(time + '-' + i);

			//sort actions[i]?

			for (var j = 0; j < actions[i].length; j++)
			{
				var char = actions[i][j];
				console.log(char.name);
				var action = char.actions[char.step];

				//accumulate effects
				for (var k = 0; k < action[0].length; k++)
				{
					ACTIONS[action[0][k][0]].apply(char.state, action[0][k][1]);
				}

				//move if direction is given
				if (action[1] != undefined)
				{
					char.state.tile = char.state.tile.steps[action[1]];
					var id = char.state.tile.i;
					var info = this.world.info[id];

					if (!char.state.info[id])
					{
						char.state.info[id] = [id, info[1], null, []];
					}

					ACTIONS[0].call(char.state, id);
					var area = this.world.findArea(char.state.tile, char.state.stats.vision, [1,1,1,1,1,1,1,1,1,1,1]);

					for (var id in area)
					{
						char.state.info[id] = this.world.info[id];
						examine.call(char.state, id, char.state.stats.insight - (area[i] * area[i]));
					}
				}

				char.step++;

				if (char.step == char.actions.length)
				{
					char.resolve();
				}
				/*else
				{
					char.cooldown = COOLDOWN[char.actions[char.step][0]];
				}*/
			}
		}
	}

	this.time++;
	this.chars = [];
});

var Client = ooo.Client.extend(function (server, socket)
{
	ooo.Client.call(this, server, socket);
	this.expected = {'login': true};
	this.attempts = 0;
});

Client.on('socket:close', function ()
{
	var player = this.player;

	if (player != undefined)
	{
		if (player.game != null)
		{
			if (player.game.started)
			{
				console.log('AWAY %d %s', player.game.id, player.name);
				player.shout('away', [player.name]);
			}
			else
			{
				player.game.leave(player);
			}
		}

		player.client = null;
		delete this.player;
	}
});

Client.on('message:register', function (name, pass)
{
	if (this.server.players[name] != undefined)
	{
		throw 'name exists';
	}

	console.log('REGISTER %s', name);
	console.log('GRANT %s', name);
	var player = new Player(name, pass);
	this.server.players[name] = player;
	player.client = this;
	this.player = player;
	var games = [];
	this.send('grant', [games]);
	this.expect('host', 'join');
});

Client.on('message:login', function (name, pass)
{
	var player = this.server.players[name];

	if ((player == undefined) || (player.client != null) || (player.pass != pass))
	{
		console.log('DENY %s', name);
		//this.attempts++;//issue a warning after x and block for t after y attempts
		var that = this;
		setTimeout(function () { that.send('deny'); that.expect('login') }, DENY_DELAY * 1000);
		return;
	}

	player.client = this;
	this.player = player;

	if (player.game != null)
	{
		var game = player.game;
		console.log('BACK %d %s', game.id, name);
		player.shout('back', [name]);
		var seat = game.seats[name];
		var realm = game.realms[seat];
		this.send('continue', [game.rules, game.names(), game.time, realm.time, realm.info, realm.chars]);
		this.expect('tick');
	}
	else
	{
		console.log('GRANT %s', name);
		var games = {};

		for (var id in this.server.games)
		{
			var game = this.server.games[id];
			games[id] = [game.rules, game.names()];
		}

		this.send('grant', [games]);
		this.expect('host', 'join');
	}
});

Client.on('message:host', function (rules)
{
	console.log('HOST %s %s', this.player.name, JSON.stringify(rules));

	var info = [];
	var tiles = rules[1] * rules[1];

	for (var i = 0; i < tiles; i++)
	{
		info[i] = [i, 1, null, []];
	}

	info[9][1] = 2;
	info[i] = [i, 8, 8, []];
	info[8][3].push(i++);
	info[i] = [i, 6, 15, []];
	info[15][3].push(i++);

	var game = new Game(rules, info);
	game.id = ooo.fill(this.server.games, game);
	game.join(this.player);
	this.expect('leave');
});

Client.on('message:join', function (id)
{
	var game = this.server.games[id];

	if (!game)
	{
		throw 'no such game';
	}

	if (!game.open)
	{
		throw 'game closed';
	}

	game.join(this.player);
	this.expect('leave');
});

Client.on('message:leave', function ()
{
	this.player.game.leave(this.player);
	this.expect('host', 'join');
});

Client.on('message:tick', function (chars)
{
	if (!Array.isArray(chars))
	{
		throw 'chars aint no array';
	}

	var player = this.player;
	var game = player.game;
	game.tick(player, chars);

	if (game.ticks < game.realms.length)
	{
		return;
	}

	game.tock();

	for (var name in game.players)
	{
		var client = game.players[name].client;

		if (client)
		{
			var seat = game.seats[name];
			var realm = game.realms[seat];
			client.send('tock', [realm.info, realm.chars]);
			client.expect('tick');
		}
	}
});

var Player = ooo.Class.extend(function (name, pass)
{
	this.name = name;
	this.pass = pass;
	this.client = null;
	this.game = null;
	//this.access = 0110010;
});

Player.method('shout', function (type, data)
{
	if (this.game == null)
	{
		throw 234111;
	}

	for (var name in this.game.players)
	{
		if (name == this.name)
		{
			continue;
		}

		var player = this.game.players[name];

		if (player.client != null)
		{
			player.client.send(type, data);
		}
	}
});

var Server = ooo.Server.extend(function (Client, port, state)
{
	ooo.Server.call(this, Client, port);
	this.players = {};
	this.games = {};//unterteilen in lobby & running??

	//restore players
	for (var i = 0; i < state.players.length; i++)
	{
		var player = new Player(state.players[i].name, state.players[i].pass);
		this.players[player.name] = player;
	}

	return;
	//restore games
	for (var i = 0; i < state.games.length; i++)
	{
		var game = new Game(state.games[i].size);
		game.id = ooo.fill(this.games, game);

		for (var name in state.games[i].realms)
		{
			var realm = state.games[i].realms[name];
			var player = this.players[name];
			var seat = game.realms.length;
			game.realms[seat] = realm;
			game.players[name] = player;
			game.seats[name] = seat;
			game.open = false;
			game.started = true;
			player.game = game;
		}
	}
});

fs.readFile('./state.json', 'utf8', function (error, data)
{
	if (error)
	{
		throw error;
	}
	
	var state = JSON.parse(data);
	var server = new Server(Client, 11133, state);
});
