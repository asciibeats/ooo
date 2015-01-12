var fs = require('fs');
var ooo = require('./ooo.js');
var ooc = require('../client/source/ooc.js');
var INFO = require('../client/source/info.js');
var START_DELAY = 0;
var DENY_DELAY = 1;

var World = ooo.TileMap.extend(function (size)
{
	this.knowledge = {};
	this.decay = [];
	ooo.TileMap.call(this, size);
});

World.method('Data', function (map, i, x, y)
{
	this.info = map.spawn([1]);
});

World.method('spawn', function (data, parents, decay)
{
	var info = {};
	info.id = ooc.fill(info, this.knowledge);//array mit gelöschten ids!!! (kein object mehr)
	info.type = INFO[data[0]];
	info.argv = data[1] || [];
	info.state = info.type.state.slice();
	info.parents = {};
	info.children = {};

	if (decay != null)
	{
		ooc.push(info, this.decay, decay);
	}

	if (parents)
	{
		for (var i = 0; i < parents.length; i++)
		{
			var parent_id = parents[i];
			info.parents[parent_id] = this.knowledge[parent_id];
			info.parents[parent_id].children[info.id] = info;
		}
	}

	if (data[2])
	{
		for (var i = 0; i < data[2].length; i++)
		{
			this.spawn(data[2][i], [info.id]);
		}
	}

	return info;
});

World.method('move', function (info, parents)
{
	for (var parent_id in info.parents)
	{
		var parent = info.parents[parent_id];
		delete info.parents[parent_id];
		delete parent.children[info.id];
	}

	for (var i = 0; i < parents.length; i++)
	{
		var parent_id = parents[i];
		var parent = this.knowledge[parent_id];
		info.parents[parent_id] = parent;
		parent.children[info.id] = info;
	}
});

World.method('erase', function (info)
{
	delete this.knowledge[info.id];

	for (var i in info.children)
	{
		var child = info.children[i];
		delete info.children[i];
		delete child.parents[info.id];
		
		if (ooc.size(child.parents) == 0)
		{
			this.erase(i);
		}
	}

	for (var i in info.parents)
	{
		var parent = info.parents[i];
		delete info.parents[i];
		delete parent.children[info.id];
	}
});

var Game = ooc.Class.extend(function (rules)
{
	ooc.Class.call(this);
	this.rules = rules;
	this.world = new World(rules[1]);
	this.time = 0;
	this.tocks = 0;
	this.open = true;
	this.started = false;
	this.size = 0;
	this.players = {};
	this.chars = {};
	this.actions = {};
});

Game.method('broadcast', function (type, data)//, store=true/false
{
	for (var name in this.players)
	{
		var player = this.players[name];

		if (player.client)
		{
			player.client.send(type, data);
		}
	}
});

Game.method('names', function ()
{
	return Object.keys(this.players);
});

Game.method('join', function (player)
{
	console.log('JOIN %d %s', this.id, player.name);
	this.broadcast('join', [player.name]);
	this.players[player.name] = player;
	player.game = this;
	this.size++;

	if (this.size < this.rules[0])
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
	this.size--;

	if (this.timeout)
	{
		this.open = true;
		clearTimeout(this.timeout);
		delete this.timeout;
	}

	if (this.size > 0)
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

//Player
function addChar (tile_i, data)
{
	var char = {};
	char.info = this.game.world.spawn(data, [tile_i]);
	char.realm = this.realm;
	this.game.chars[char.info.id] = char;
	this.realm.chars[char.info.id] = {home: tile_i};
	//knowledge,home,tasks,jobs
}

//Player
function addAction (char_id, tile_i, data)
{
	//COMPLETE VALIDATION OF ACTION (PATH,CAPABILTIY,COST...)
	var char = this.realm.chars[char_id];

	if (!char)
	{
		throw 'no char';
	}

	var steps = data[0];
	var tile = this.game.world.index[char.home];
	var path = {};
	var cost = 0;

	for (var i = 0; i < steps.length; i++)
	{
		tile = tile.steps[steps[i]];
		path[tile.i] = tile;
		cost += tile.data.info.type.state[2];
	}

	if (tile.i != tile_i)
	{
		throw 'target mismatch';
	}

	//validate BEFORE here
	if (false)//action is job
	{
		char.jobs[tile_i] = data;
	}

	var action = {};
	action.path = path;
	action.cost = cost;
	action.argv = data[1];
	//console.log('addA', JSON.stringify(action));
	ooc.add(action, this.game.actions, tile_i, char_id);
}

Game.method('start', function ()
{
	console.log('START %d', this.id);
	delete this.timeout;
	this.started = true;//move to other container instead!!!!!!!!!!!!!!
	var seat = 0;

	for (var name in this.players)
	{
		var player = this.players[name];
		var realm = {time: 0, chars: {}};
		//realm.player = player;
		player.realm = realm;

		if (seat == 0)
		{
			var argv = [132, [9, [3, 5, 1, 10, 0], [[8, [], []]]]];
		}
		else
		{
			var argv = [135, [9, [5, 5, 1, 10, 0], []]];
		}

		addChar.apply(player, argv);
		seat++;
	}

	this.tick();
});

//abwechselnd tag und nacht
//nachwächter action: leuchten (erhöht vision)
//passiv chars (anonyme soldaten/stats) kaserne->X soldaten
//group: TRAPS (react to steps/path)
///(some) cards that transfer/create items are permanent/repeat (for x turns!!!)!!!!!!so klappt das auch mit dem stehlen!!!
////////all cards????
//bewegungs- und kartenkosten differenzieren? damit man anhand der karte besser einschätzen kann wieviel nach aktion noch übrig bleibt

////KARTEN EFFEKTE ALS CLOSURES!!!
////GENAU EINE CLOSURE PER INFO!!!

Game.method('tock', function (player, actions)
{
	console.log('TOCK %d %d %s %s', this.id, player.realm.time, player.name, JSON.stringify(actions));

	for (var i = 0; i < actions.length; i++)
	{
		addAction.apply(player, actions[i]);
	}

	player.realm.time++;
	this.tocks++;
	var left = this.size - this.tocks;

	if (left)
	{
		this.broadcast('wait', [left]);
	}
	else
	{
		this.tick();
	}
});

function examine (knowledge, info, insight)
{
	insight -= info.state[1];

	if (insight < 0)
	{
		return;
	}

	knowledge[info.id][2] = info.state;

	for (var child_id in info.children)
	{
		var child = info.children[child_id];

		if (insight < child.state[0])
		{
			continue;
		}

		var known = knowledge[child_id];

		if (known)
		{
			if (insight > known[1])
			{
				known[1] = insight;
			}
		}
		else
		{
			knowledge[child_id] = [child.type.id, insight];
		}

		ooc.push(child_id, knowledge, info.id, 3);
		examine(knowledge, child, insight);
	}
}

function mergePaths (char, action)
{
	for (var tile_i in action.path)
	{
		if (!char.path[tile_i])
		{
			char.path[tile_i] = action.path[tile_i];
		}
	}
}

Game.method('tick', function ()
{
	console.log('TICK %d %d', this.id, this.time);

	//remove deprecated info
	var obsolete = this.world.decay.shift();

	if (obsolete)
	{
		for (var i = 0; i < obsolete.length; i++)
		{
			var info = obsolete[i];
			this.world.erase(info);
		}
	}

	//reset realms & chars
	for (var name in this.players)
	{
		var player = this.players[name];
		var realm = player.realm;

		for (var char_id in realm.chars)
		{
			var char = this.chars[char_id];
			char.path = {};
			char.path[char.home] = this.world.index[char.home];
			//realm.knowledge[char_id] = [char.home.i, null, []];
		}
	}

	//mark path & subtract cost
	for (var tile_i in this.actions)
	{
		for (var char_id in this.actions[tile_i])
		{
			var action = this.actions[tile_i][char_id];
			var char = this.chars[char_id];
			mergePaths(char, action);
			char.info.state[2] -= action.cost;
			//console.log(char_id, JSON.stringify(char.info.state));
			//char.items mergeadd {123: 1, 42: -2};!!!!!!!!!!!!!!!
		}
	}

	//3. diff
	//4. mult
	//5. special

	//update realminfo based on charpath and remaining ap
	for (var name in this.players)
	{
		var player = this.players[name];
		var realm = player.realm;

		for (var char_id in realm.chars)
		{
			var char = this.chars[char_id];
			this.world.move(char.info, Object.keys(char.path));

			var range = char.info.state[2];
			var insight = char.info.state[3];
			var area = this.world.findArea(ooc.values(char.path), range, function (data) { return data.info.state[2] });
			var knowledge = {};

			for (var tile_i in area)
			{
				var info = this.world.knowledge[tile_i];
				knowledge[tile_i] = [info.type.id, insight];
				examine(knowledge, info, insight);
			}

			realm.knowledge[char_id] = knowledge;
		}

		if (player.client)
		{
			player.client.send('tick', [realm.knowledge, realm.tasks]).expect('tock');
		}
	}

	this.time++;
	this.tocks = 0;
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

	if (player)
	{
		if (player.game)
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
	this.send('grant', [games]).expect('host', 'join');
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
		var realm = player.realm;
		var move = (realm.time < game.time) ? 1 : 0;
		this.send('continue', [game.rules, game.names(), game.time, realm.chars, move]);

		if (move)
		{
			this.expect('tock');
		}
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

		this.send('grant', [games]).expect('host', 'join');
	}
});

Client.on('message:host', function (rules)
{
	console.log('HOST %s %s', this.player.name, JSON.stringify(rules));
	var game = new Game(rules);
	var forest = [133, 134, 135, 102, 166];

	for (var i = 0; i < forest.length; i++)
	{
		var tile = game.world.index[forest[i]];
		game.world.erase(tile.data.info);
		tile.data.info = game.world.spawn([2]);
	}

	game.id = ooc.fill(game, this.server.games);
	game.join(this.player);
	this.expect('leave');
});

Client.on('message:join', function (id)
{
	var game = this.server.games[id];

	if (!game || !game.open)
	{
		throw 'no such game';
	}

	game.join(this.player);
	this.expect('leave');
});

Client.on('message:leave', function ()
{
	this.player.game.leave(player);
	this.expect('host', 'join');
});

Client.on('message:tock', function (turn)
{
	this.player.game.tock(this.player, turn);
});

var Player = ooc.Class.extend(function (name, pass)
{
	ooc.Class.call(this);
	this.name = name;
	this.pass = pass;
	this.client = null;
	this.game = null;
	this.seat = null;
	//this.access = 0110010;
});

Player.method('shout', function (type, data)
{
	if (!this.game)
	{
		throw 'not joined';
	}

	var players = this.game.players;

	for (var name in players)
	{
		if (name == this.name)
		{
			continue;
		}

		var player = players[name];

		if (player.client)
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
		game.id = ooc.fill(game, this.games);

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
