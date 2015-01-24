var fs = require('fs');
var ooo = require('./ooo.js');
var ooc = require('../client/source/ooc.js');
var jup = require('../client/source/info.js');
var START_DELAY = 0;
var DENY_DELAY = 1;
var ELEMS = ['Fire', 'Ice', 'Stone'];
var POOL_TIMEOUT = 4;

//remove all recursive functions!!!!!!!
//abwechselnd tag und nacht
//nachwächter action: leuchten (erhöht vision/range)
//group: TRAPS (react to steps/path)

function initKnowledge (knowledge, info, keys)
{
	var open = [];

	do
	{
		//knowledge[info.id] = [info.type.id, 0, info.state];
		knowledge[info.id] = [info.type.id, info.state];

		for (var child_id in info.children)
		{
			var child = info.children[child_id];

			if ((child.type.group != 5) || (child.state[1] in keys))
			{
				ooc.push(child_id, knowledge, info.id, 2);
				open.push(child);
			}
		}
	}
	while (info = open.pop())
}

function gatherKnowledge (knowledge, info, insight, keys)
{
	var next = [info, insight];
	var open = [];

	do
	{
		info = next[0];
		insight = next[1];

		if (info.id in knowledge)
		{
			/*if (insight > knowledge[info.id][1])
			{
				knowledge[info.id][1] = insight;
			}*/
		}
		else
		{
			knowledge[info.id] = [info.type.id];//, insight
		}

		if ((info.type.group != 5) && (info.type.group != 1))//temp!!!!gruppen überarbeiten/vereinfachen
		{
			insight -= info.state[1];

			if (insight < 0)
			{
				continue;
			}
		}

		//knowledge[info.id][2] = info.state;
		knowledge[info.id][1] = info.state;

		for (var child_id in info.children)
		{
			var child = info.children[child_id];

			if ((child.type.group != 1))//temp!!!!gruppen überarbeiten/vereinfachen
			{
				if (insight < child.state[0])
				{
					continue;
				}
			}

			//ooc.push(child_id, knowledge, info.id, 3);
			ooc.push(child_id, knowledge, info.id, 2);

			if ((child.type.group != 5) || (child.state[1] in keys))
			{
				open.push([child, insight]);
			}
		}
	}
	while (next = open.pop())
}

function determineTask (task, pools, full)
{
	var route_hash = ooc.hash(task.route);

	for (var signature in pools)
	{
		var pool = pools[signature];

		for (var tile_i in pool.route)
		{
			if (tile_i in route_hash)
			{
				continue;
			}

			var tile = pool.route[tile_i];
			task.route.push(tile_i);
			task.range += tile.data.info.state[2];
		}

		if (full)
		{
			task.power = jup.mergePower(task.power, pool.power);
		}
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

World.method('link', function (info, parent)
{
	info.parents[parent.id] = this.knowledge[parent.id];
	info.parents[parent.id].children[info.id] = info;
});

World.method('unlink', function (info, parent)
{
	delete info.parents[parent.id];
	delete parent.children[info.id];
});

World.method('relink', function (info, parents)
{
	for (var info_id in info.parents)
	{
		var parent = info.parents[info_id];
		this.unlink(info, parent);
	}

	for (var i = 0; i < parents.length; i++)
	{
		var parent = this.knowledge[parents[i]];
		this.link(info, parent);
	}
});

World.method('relink2', function (info, children)
{
	for (var info_id in info.children)
	{
		var child = info.children[info_id];
		this.unlink(child, info);
	}

	for (var i = 0; i < children.length; i++)
	{
		var child = this.knowledge[children[i]];
		this.link(child, info);
	}
});

World.method('spawn', function (data, parents)//, decay
{
	var info = {};
	info.id = ooc.fill(info, this.knowledge);//array mit gelöschten ids!!! (kein object mehr)
	info.type = jup.info[data[0]];
	//info.argv = data[1] || [];
	info.state = data[1] || ooc.clone(info.type.state);
	info.parents = {};
	info.children = {};

	/*if (decay != null)
	{
		ooc.push(info, this.decay, decay);
	}*/

	if (parents)
	{
		for (var i = 0; i < parents.length; i++)
		{
			var parent = this.knowledge[parents[i]];
			this.link(info, parent);
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

World.method('unspawn', function (info)
{
	delete this.knowledge[info.id];

	for (var i in info.children)
	{
		var child = info.children[i];
		this.unlink(child, info);
		//delete child.parents[info.id];
		//delete info.children[i];
		
		if (ooc.size(child.parents) == 0)
		{
			this.unspawn(i);
		}
	}

	for (var i in info.parents)
	{
		var parent = info.parents[i];
		this.unlink(info, parent);
	}
});

World.method('birth', function (realm, home, data)
{
	var char = {};
	char.realm = realm;
	char.info = this.spawn(data, [home]);
	char.mind = this.spawn([42], [char.info.id]);
	char.home = this.spawn([33, [home]], [char.mind.id]);
	char.task = this.spawn([23, [[home], 0, {}]], [char.mind.id]);
	char.pools = {};
	var knowledge = {};
	initKnowledge(knowledge, char.info, {});
	realm.knowledge[char.info.id] = knowledge;
	this.game.chars[char.info.id] = char;
});

var mergePool = ooc.modify(function (object, key, value)
{
	if (key in object)
	{
		object[key].power = jup.mergePower(object[key].power, value.power);
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
		player.realm = {time: 0, knowledge: {}, map: {}, player: player};

		if (name == 'a')
		{
			this.world.birth(player.realm, 132, [9]);
		}
		else
		{
			this.world.birth(player.realm, 202, [9]);
		}
	}

	this.tick();
});

Game.method('tock', function (player, actions)
{
	console.log('TOCK %d %d %s %s', this.id, player.realm.time, player.name, JSON.stringify(actions));
	var pools = {};
	var tasks = {};

	//gather new investments
	for (var i = 0; i < actions.length; i++)
	{
		var action = actions[i];
		var char_id = action[0];

		if (!(char_id in player.knowledge))
		{
			throw 'missing char';
		}

		var char = this.chars[char_id];
		var steps = action[2];
		var tile = char.home;
		var pool = {target: action[1], power: action[3], route: {}};

		for (var j = 0; j < steps.length; j++)
		{
			tile = tile.steps[steps[j]];
			pool.route[tile.i] = tile;
		}

		if (tile.i != pool.target)
		{
			throw 'target mismatch';
		}

		//merge actions with same path
		var signature = steps.join('/');
		mergePool(pool, pools, char_id, signature);
	}

	//determine effort of char turns
	for (var char_id in player.realm.knowledge)
	{
		var char = this.chars[char_id];
		var task = ooc.map(char.task.type.param, char.task.state);
		determineTask(task, pools[char_id], true);

		if (task.range > char.info.state[2])
		{
			throw 'exceeding range';
		}

		for (var type in task.power)
		{
			var amount = char.info.state[5][type];

			if (!amount || (amount < task.power[type]))
			{
				throw 'exceeding power';
			}
		}

		tasks[char_id] = task;
	}

	//update pools (complete!! input validation before here!!!!!!!!)
	for (var char_id in pools)
	{
		var char = this.chars[char_id];

		for (var signature in pools[char_id])
		{
			var pool = pools[char_id][signature];
			mergePool(pool, char.pools, signature);

			if (pool.target in this.pools)
			{
				var event = this.pools[pool.target];
				event.info.state[3] = 0;//time
			}
			else
			{
				var event = {};
				event.info = this.world.spawn([66], [pool.target]);
				this.pools[pool.target] = event;
			}
			
			ooc.put(char.pools[signature].power, event.info.state[2], char_id, signature);
		}
	}

	//update all chars
	for (var char_id in tasks)
	{
		var task = tasks[char_id];
		var char = this.chars[char_id];
		this.world.relink(char.info, task.route);
		char.info.state[2] -= task.range;
		char.info.state[5] = jup.cancelPower(char.info.state[5], task.power);
		char.task.state = ooc.values(task);
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
			this.world.unspawn(info);
		}
	}*/

	//consume items & init knowledge
	/*for (var char_id in this.chars)
	{
		var char = this.chars[char_id];

		for (var info_id in char.info.children)
		{
			var info = char.info.children[info_id];

			if (info.type.group == 3)
			{
				info.type.effect.call(char);
				this.world.unspawn(info);
			}
		}

		char.realm.knowledge[char_id] = {};
		initKnowledge(char.realm.knowledge[char_id], char.info, {});
	}*/

	//trigger events
	for (var tile_i in this.pools)
	{
		var pool = this.pools[tile_i];
		var power = jup.poolPower(pool.info.state[2]);
		var event = jup.matchEvent(power);

		//apply effects or increase timer
		if (event && (pool.info.state[3] == event.time))
		{
			console.log('EVENT "%s" at (%d)', event.title, tile_i);
			var tile = this.world.index[tile_i];

			if (event.tile_effect)
			{
				event.tile_effect.call(this, tile);
			}

			for (var char_id in pool.info.state[2])
			{
				var char = this.chars[char_id];

				if (event.char_effect)
				{
					event.char_effect.call(this, tile, char);
				}

				for (var signature in pool.info.state[2][char_id])
				{
					char.info.state[5] = jup.mergePower(char.info.state[5], pool.info.state[2][char_id][signature]);
					delete char.pools[signature];
				}
			}

			this.world.unspawn(pool.info);
			delete this.pools[tile_i];
		}
		else if (pool.info.state[3] == POOL_TIMEOUT)
		{
			console.log('TIMEOUT at (%d)', tile_i);

			for (var char_id in pool.info.state[2])
			{
				var char = this.chars[char_id];

				for (var signature in pool.info.state[2][char_id])
				{
					char.info.state[5] = jup.mergePower(char.info.state[5], pool.info.state[2][char_id][signature]);
					delete char.pools[signature];
				}
			}

			this.world.unspawn(pool.info);
			delete this.pools[tile_i];
		}
		else
		{
			pool.info.state[3]++;
		}
	}

	//update realms
	for (var name in this.players)
	{
		var player = this.players[name];
		var realm = player.realm;

		for (var char_id in realm.knowledge)
		{
			var char = this.chars[char_id];
			var area = this.world.findArea(char.task.state[0], char.info.state[2], function (data) { return data.info.state[2] });
			var task = ooc.map(char.task.type.param, char.task.type.state);
			task.route.push(char.home.state[0]);
			determineTask(task, char.pools);
			task.range = 0;//pay only once for path!? (event exec verzögerungen sollten aber in extra kosten resultieren!!!
			char.task.state = ooc.values(task);
			this.world.relink2(char.mind, [char.home.id, char.task.id]);

			for (var tile_i in area)
			{
				var info = this.world.knowledge[tile_i];
				this.world.link(info, char.mind);
				realm.map[tile_i] = info.type.id;
			}

			var knowledge = {};
			initKnowledge(knowledge, char.info, {});
			gatherKnowledge(knowledge, char.mind, char.info.state[3], {'c': true});
			realm.knowledge[char_id] = knowledge;
		}

		if (player.client)
		{
			player.client.send('tick', [realm.knowledge, realm.map]).expect('tock');
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
		this.send('continue', [game.rules, game.names(), game.time, realm.knowledge, realm.map, wait]);

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
		game.world.unspawn(tile.data.info);
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
