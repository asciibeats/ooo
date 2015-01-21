var fs = require('fs');
var ooo = require('./ooo.js');
var ooc = require('../client/source/ooc.js');
var jup = require('../client/source/info.js');
var START_DELAY = 0;
var DENY_DELAY = 1;
var ELEMS = ['Fire', 'Ice', 'Stone'];

//remove all recursive functions!!!!!!!
//abwechselnd tag und nacht
//nachwächter action: leuchten (erhöht vision/range)
//group: TRAPS (react to steps/path)

function initKnowledge (knowledge, info)
{
	knowledge[info.id] = [info.type.id, 0, info.state];

	for (var child_id in info.children)
	{
		var child = info.children[child_id];
		ooc.push(child_id, knowledge, info.id, 3);
		initKnowledge(knowledge, child);
	}
}

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
	info.type = jup.info[data[0]];
	info.argv = data[1] || [];
	info.state = ooc.clone(info.type.state);
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

World.method('birth', function (realm, tile, data)
{
	var char = {};
	char.realm = realm;
	char.home = tile;
	char.info = this.spawn(data, [tile.i]);
	char.pools = {};
	char.effort = {route: {}, range: 0, power: {}};
	char.effort.route[tile.i] = true;
	var knowledge = {};
	realm.data[char.info.id] = [tile.i, knowledge];
	initKnowledge(knowledge, char.info);
	this.game.chars[char.info.id] = char;
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

function gatherKnowledge (knowledge, info, insight)
{
	if (info.id in knowledge)
	{
		if (insight > knowledge[info.id][1])
		{
			knowledge[info.id][1] = insight;
		}
	}
	else
	{
		knowledge[info.id] = [info.type.id, insight];
	}

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

		ooc.push(child_id, knowledge, info.id, 3);
		gatherKnowledge(knowledge, child, insight);
	}
}

function determineEffort (effort, pools, full)
{
	for (var signature in pools)
	{
		var pool = pools[signature];

		for (var tile_i in pool.route)
		{
			if (tile_i in effort.route)
			{
				continue;
			}

			var tile = pool.route[tile_i];
			effort.route[tile_i] = true;
			effort.range += tile.data.info.state[2];
		}

		if (full)
		{
			jup.mergePower(effort.power, pool.power);
		}
	}
}

var mergePool = ooc.modify(function (object, key, value)
{
	if (key in object)
	{
		jup.mergePower(object[key].power, value.power);
	}
	else
	{
		object[key] = value;
	}
});

var Game = ooc.Class.extend(function (rules)
{
	ooc.Class.call(this);
	this.rules = rules;
	this.world = new World(rules[1]);
	this.world.game = this;
	this.time = 0;
	this.tocks = 0;
	this.open = true;
	this.started = false;
	this.size = 0;
	this.players = {};
	this.chars = {};
	this.pools = {};
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

Game.method('start', function ()
{
	console.log('START %d', this.id);
	delete this.timeout;
	this.started = true;//move to other container instead!!!!!!!!!!!!!!

	for (var name in this.players)
	{
		var player = this.players[name];
		player.realm = {time: 0, data: {}, map: {}, player: player};

		if (name == 'a')
		{
			this.world.birth(player.realm, this.world.index[132], [9]);
		}
		else
		{
			this.world.birth(player.realm, this.world.index[202], [9]);
		}
	}

	this.tick();
});

Game.method('tock', function (player, actions)
{
	console.log('TOCK %d %d %s %s', this.id, player.realm.time, player.name, JSON.stringify(actions));
	var pools = {};
	var efforts = {};

	//gather new investments
	for (var i = 0; i < actions.length; i++)
	{
		var action = actions[i];
		var char_id = action[0];

		if (!(char_id in player.realm.data))
		{
			throw 'missing char';
		}

		var char = this.chars[char_id];
		var steps = action[2];
		var tile = char.home;
		var bubu = {target: action[1], power: action[3], route: {}};

		for (var j = 0; j < steps.length; j++)
		{
			tile = tile.steps[steps[j]];
			bubu.route[tile.i] = tile;
		}

		if (tile.i != bubu.target)
		{
			throw 'target mismatch';
		}

		//merge actions with same path
		var signature = steps.join('/');
		mergePool(bubu, pools, char_id, signature);
	}

	//merge investments and determine cost/range
	for (var char_id in player.realm.data)
	{
		var char = this.chars[char_id];
		var effort = ooc.clone(char.effort);
		determineEffort(effort, pools[char_id], true);

		if (effort.range > char.info.state[2])
		{
			throw 'exceeding range';
		}

		for (var type in effort.power)
		{
			var amount = char.info.state[5][type];

			if (!amount || (amount < effort.power[type]))
			{
				throw 'exceeding power';
			}
		}

		efforts[char_id] = effort;
	}

	//update pools (complete!! input validation before here!!!!!!!!)
	for (var char_id in pools)
	{
		var char = this.chars[char_id];

		for (var signature in pools[char_id])
		{
			var pool = pools[char_id][signature];
			mergePool(pool, char.pools, signature);
			ooc.put(char.pools[signature].power, this.pools, pool.target, 'power', char_id, signature);
			ooc.put(0, this.pools, pool.target, 'time');
		}
	}

	//update all chars
	for (var char_id in efforts)
	{
		var effort = efforts[char_id];
		var char = this.chars[char_id];
		this.world.move(char.info, ooc.intkeys(effort.route));
		char.info.state[2] -= effort.range;
		jup.cancelPower(char.info.state[5], effort.power);
		char.effort = effort;
	}

	player.realm.time++;
	this.tocks++;
	var wait = this.size - this.tocks;

	if (wait)
	{
		this.broadcast('wait', [wait]);
	}
	else
	{
		this.tick();
	}
});

Game.method('tick', function ()
{
	console.log('TICK %d %d', this.id, this.time);

	/*/remove deprecated info
	var obsolete = this.world.decay.shift();

	if (obsolete)
	{
		for (var i = 0; i < obsolete.length; i++)
		{
			var info = obsolete[i];
			this.world.erase(info);
		}
	}*/

	//consume items & init knowledge
	for (var char_id in this.chars)
	{
		var char = this.chars[char_id];

		for (var info_id in char.info.children)
		{
			var info = char.info.children[info_id];
			info.type.effect.call(char);
			this.world.erase(info);
		}

		var knowledge = {};
		char.realm.data[char_id] = [char.home.i, knowledge];
		initKnowledge(knowledge, char.info);
	}

	//trigger events
	for (var tile_i in this.pools)
	{
		var pool = this.pools[tile_i];
		var power = {};

		//sum up powers
		for (var char_id in pool.power)
		{
			for (var signature in pool.power[char_id])
			{
				jup.mergePower(power, pool.power[char_id][signature]);
			}
		}

		//cancel out complements
		for (var type in power)
		{
			if (type & 1)//ungerade
			{
				var comp = type - 1;
			}
			else
			{
				var comp = type + 1;
			}

			var a = power[type];
			var b = power[comp] ? power[comp] : 0;

			if (a > b)
			{
				power[type] -= b;
				delete power[comp];
			}
			else if (b > a)
			{
				power[comp] -= a;
				delete power[type];
			}
			else
			{
				delete power[type];
				delete power[comp];
			}
		}

		var event = jup.matchEvent(power);

		//apply effects or increase timer
		if (event && (pool.time == event.time))
		{
			var tile = this.world.index[tile_i];

			if (event.tile_effect)
			{
				event.tile_effect.call(this, tile);
			}

			for (var char_id in pool.power)
			{
				var char = this.chars[char_id];

				if (event.char_effect)
				{
					event.char_effect.call(this, tile, char);
				}

				for (var signature in pool.power[char_id])
				{
					jup.mergePower(char.info.state[5], pool.power[char_id][signature]);
					delete char.pools[signature];
				}
			}

			delete this.pools[tile_i];
		}
		else
		{
			pool.time++;
		}
	}

	//update realms
	for (var name in this.players)
	{
		var player = this.players[name];
		var realm = player.realm;

		for (var char_id in realm.data)
		{
			var char = this.chars[char_id];
			var area = this.world.findArea(ooc.intkeys(char.effort.route), char.info.state[2], function (data) { return data.info.state[2] });
			var knowledge = realm.data[char_id][1];

			for (var tile_i in area)
			{
				var info = this.world.knowledge[tile_i];
				realm.map[tile_i] = info.type.id;
				gatherKnowledge(knowledge, info, char.info.state[3]);
			}
			
			var effort = {route: {}, range: 0, power: {}};
			effort.route[char.home.i] = true;
			determineEffort(effort, char.pools);
			effort.range = 0;//pay only once for path
			realm.data[char_id][2] = [ooc.intkeys(effort.route), effort.range];
			char.effort = effort;
		}

		if (player.client)
		{
			player.client.send('tick', [realm.data, realm.map]).expect('tock');
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
		var wait = (realm.time < game.time) ? 0 : this.size - this.tocks;
		this.send('continue', [game.rules, game.names(), game.time, realm.data, realm.map, wait]);

		if (!wait)
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
