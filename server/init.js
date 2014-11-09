var ooo = require('./ooo.js');
var fs = require('fs');

var START_DELAY = 0;
var DENY_DELAY = 0;
//var COOLDOWN = [1, 0];
var SUBTICKS = 24;
//var MAXSKILL = 9;
var STATNAMES = ['insight', 'stamina', 'vision'];
var MAPTYPES = [0, 10, 11, 12];

var ITEMS = [];
ITEMS[0] = {title: 'World', group: 0, obscurity: 0, visibility: 0};
ITEMS[1] = {title: 'Grass', group: 0, obscurity: 1, visibility: 0};
ITEMS[2] = {title: 'Forest', group: 0, obscurity: 3, visibility: 0};
ITEMS[3] = {title: 'Campfire', group: 0, obscurity: 1, visibility: 1};
ITEMS[4] = {title: 'Fishmonster', group: 1, obscurity: 2, visibility: 1};
ITEMS[5] = {title: 'Basket', group: 2, obscurity: 3, visibility: 1};
ITEMS[6] = {title: 'Apple', group: 2, obscurity: 1, visibility: 1};
ITEMS[7] = {title: 'Tree', group: 2, obscurity: 9, visibility: 0};
ITEMS[8] = {title: 'Ring', group: 2, obscurity: 9, visibility: 1};
ITEMS[9] = {title: 'Hero', group: 1, obscurity: 5, visibility: 1};

//char.state
function examine (info, insight)
{
	var item = ITEMS[info.type];
	insight -= item.obscurity;

	if (insight >= 0)
	{
		for (var id in info.children)
		{
			var child = info.children[id];
			var item = ITEMS[child.type];

			if (this.info[id])
			{
				if (insight > this.info[id][1])
				{
					this.info[id][1] = insight;
				}
			}
			else
			{
				this.info[id] = [child.type, insight, []];
				this.info[info.id][2].push(id);
			}

			examine.call(this, child, insight);
		}
	}
}

var ACTIONS = {};

//examine
ACTIONS[0] = function (id)
{
	console.log('%s (%d): examine %d', this.name, this.info.id, id);
	var world = this.home.map;
	var info = world.info[id];
	examine.call(this.state, info, this.state.stats.insight);
}

//spawn
ACTIONS[1] = function (id, info)
{
	console.log('%s (%d): spawn %d %s', this.name, this.info.id, id, JSON.stringify(info));
	var world = this.home.map;
	world.spawn(info, id);
}

//transfer
ACTIONS[2] = function (id, target)
{
	console.log('%s (%d): transfer %d >> %d', this.name, this.info.id, id, target);
	var world = this.home.map;
	var info = world.info[id];
	var parent = world.info[target];
	delete info.parent.children[id];
	parent.children[id] = info;
	info.parent = parent;
}

//process
ACTIONS[3] = function (id, type)
{
	console.log('%s (%d): process %d >> %d', this.name, this.info.id, id, type);
	var world = this.home.map;
	var info = world.info[id];
	info.type = type;
}

//gather
ACTIONS[4] = function (id)
{
	//spawn copy in inventory
	//tranform id back to origin
	console.log('%s (%d): gather %d', this.name, this.info.id, id);
	var world = this.home.map;
	var info = world.info[id];
	info.type = BASETYPES[info.type];
}

//spielidee basierend auf ftl universum karte aber in rasterform//auch verfolgt von irgendwas

var World = ooo.TileMap.extend(function (size)
{
	this.info = {};
	ooo.TileMap.call(this, size);
	this.events = {};
});

World.method('Data', function (map, i, x, y)
{
	var info = {};
	info.type = 1;
	info.children = {};
	info.id = i;
	map.info[i] = info;
	this.info = info;
});

World.method('spawn', function (stack, parent)
{
	var info = {};
	info.type = stack[0];
	info.children = {};
	info.id = ooo.fill(this.info, info);//array mit gelöschten ids!!! (kein object mehr)

	if (parent)
	{
		info.parent = this.info[parent];
		info.parent.children[info.id] = info;
	}

	for (var i = 0; i < stack[1].length; i++)
	{
		this.spawn(stack[1][i], info.id);
	}

	return info;
});

/*World.method('destroy', function (id)
{
	var info = this.info[id];

	for (var i in info.children)
	{
		this.vanish(i);
	}

	delete info.parent.children[id];
	delete this.info[id];
});*/

World.method('move', function (char, direction)
{
	delete char.info.parent.children[char.info.id];
	var state = char.state;
	state.tile = state.tile.steps[direction];
	char.info.parent = state.tile.data.info;
	char.info.parent.children[char.info.id] = char.info;
});

var Game = ooo.Class.extend(function (rules)
{
	this.rules = rules;
	this.world = new World(rules[1]);
	this.time = 0;
	this.ticks = 0;
	this.open = true;
	this.started = false;
	this.players = {};
	this.seats = {};
	this.realms = [];
	this.chars = {};
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

//Game
function spawn_chars (seat, chars)
{
	for (var i = 0; i < chars.length; i++)
	{
		var argv = chars[i];
		var char = {};
		char.seat = seat;
		char.name = argv[0];
		char.stats = ooo.map(STATNAMES, argv[1]);
		char.info = this.world.spawn(argv[2]);
		char.wake = argv[3];
		char.home = this.world.index[argv[4]];
		char.steps = argv[5];
		this.chars[char.info.id] = char;
		this.realms[seat].chars[char.info.id] = argv;
	}
}

Game.method('start', function ()
{
	console.log('START %d', this.id);
	delete this.timeout;
	this.started = true;//move to other container instead!!!!!!!!!!!!!!
	var seat = 0;

	for (var name in this.players)
	{
		var realm = {};
		realm.info = [{}];
		realm.chars = {};
		this.realms[seat] = realm;
		this.seats[name] = seat;
		spawn_chars.call(this, seat, [['hero', [6, 5, 5], [9, [[8, []]]], 9, 4*32+4, [[[]], [[]], [[]], [[]], [[]]]]]);//build this char in game lobby
		//spawn_chars.call(this, seat, [['hero', [5, 5, 2], [9, [[8, []]]], 9, 4*32+4, [[[]], [[], 0], [[], 0], [[], 0], [[], 0]]]]);//build this char in game lobby
		seat++;
	}

	this.tock();

	for (var name in this.players)
	{
		var client = this.players[name].client;

		if (client)
		{
			var seat = this.seats[name];
			var realm = this.realms[seat];
			client.send('start', [this.time, realm.info[this.time - 1], realm.chars]);
			client.expected = {};
			client.expect('tick');
		}
	}
});

Game.method('tick', function (player, chars)
{
	//buildaction passiert nur einmal und kostet resourcen
	//ressourcengewinnung passiert täglich
	//abwechselnd tag und nacht
	//nachwächter action: leuchten (erhöht vision)
	console.log('TICK %d %s %s', this.id, player.name, JSON.stringify(chars));
	this.ticks++;
	var seat = this.seats[player.name];
	var realm = this.realms[seat];
	realm.info[this.time] = {};
	spawn_chars.call(this, seat, chars);//build this char in game lobby
});

function stack_info (info)
{
	var stack = [info.type, []];

	for (var id in info.children)
	{
		var child = info.children[id];
		stack[1].push(stack_info(child));
	}

	return stack;
}

Game.method('tock', function ()
{
	console.log('TOCK %d %d', this.id, this.time);
	this.ticks = 0;

	for (var time = 0; time < SUBTICKS; time++)
	{
		console.log('TIME %d', time);
		var steps = {};

		//collect actions
		for (var id in this.chars)
		{
			var char = this.chars[id];

			if (!char.state)
			{
				if (char.wake == time)
				{
					var state = {};
					state.id = char.info.id;
					state.items = char.info.children;
					state.stats = ooo.clone(char.stats);
					state.tile = char.home;
					state.info = {};

					char.state = state;
					char.step = 0;
					char.info.parent = char.home.data.info;
					char.info.parent.children[char.info.id] = char.info;
				}
				else
				{
					continue;
				}
			}

			if (!steps[char.state.tile.i])
			{
				steps[char.state.tile.i] = [];
			}

			steps[char.state.tile.i].push(char);
		}

		//move onto tile
		for (var i in steps)
		{
			for (var j = 0; j < steps[i].length; j++)
			{
				var char = steps[i][j];
				var step = char.steps[char.step];

				//move if direction is given
				if (step[1] != undefined)
				{
					this.world.move(char, step[1]);
				}
			}
		}

		//trigger events
		for (var i = 0; i < this.world.events[time]; i++)
		{
			var event = this.world.events[time][i];
			ACTIONS[event[1]].apply(event[0], event[2]);
		}

		//check out the area
		for (var i in steps)
		{
			for (var j = 0; j < steps[i].length; j++)
			{
				var char = steps[i][j];
				var step = char.steps[char.step];
				var state = char.state;
				var area = this.world.findArea(state.tile, state.stats.vision, function (data) { return 1 });
				//var area = this.world.findArea(state.tile, state.stats.vision, function (data) { return ITEMS[data.info.type].obscurity });

				for (var id in area)
				{
					var info = this.world.info[id];
					state.info[id] = [info.type, char.stats.insight, []];
					ACTIONS[0].call(char, id);
				}
			}
		}

		//apply actions
		for (var i in steps)
		{
			//sort actions[i]? how?

			for (var j = 0; j < steps[i].length; j++)
			{
				var char = steps[i][j];
				var step = char.steps[char.step];
				var state = char.state;

				//execute actions and accumulate effects
				for (var k = 0; k < step[0].length; k++)
				{
					ACTIONS[step[0][k][0]].apply(char, step[0][k][1]);
				}

				char.step++;
			}
		}

		//remember info
		for (var i in steps)
		{
			for (var j = 0; j < steps[i].length; j++)
			{
				var char = steps[i][j];
				var realm = this.realms[char.seat];
				
				if (!realm.info[this.time][time])
				{
					realm.info[this.time][time] = {};
				}
				
				realm.info[this.time][time][char.info.id] = char.state.info;
				char.state.info = {};

				if (char.step == char.steps.length)
				{
					realm.chars[char.info.id][1] = [char.stats.insight, char.stats.stamina, char.stats.vision];
					realm.chars[char.info.id][2] = stack_info(char.info);
					delete char.info.parent.children[char.info.id];
					delete char.info.parent;
					delete char.step;
					delete char.state;
				}
			}
		}
	}

	this.time++;
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
		var waiting = (game.time != realm.info.length);
		this.send('continue', [game.rules, game.names(), game.time, realm.info[game.time - 1], realm.chars, waiting]);
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
	var game = new Game(rules);
	game.world.index[2*32+5].data.info.type = 2;
	game.world.spawn([8, []], 4*32+5);
	game.world.spawn([6, []], 3*32+3);
	game.world.spawn([6, []], 4*32+4);
	game.world.spawn([5, [[6, []],[6, []]]], 5*32+4);
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
			client.send('tock', [realm.info[game.time - 1], realm.chars]);
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
