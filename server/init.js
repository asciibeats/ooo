var fs = require('fs');
var ooo = require('./ooo.js');
var mod = require('./mod0.js');
var ooc = require('../client/source/ooc.js');
var jup = require('../client/source/info.js');
var START_DELAY = 0;
var DENY_DELAY = 1;
var ELEMS = ['Fire', 'Ice', 'Stone'];
var POOL_TIMEOUT = 4;

//////EVENT TRIGGGER (protectio/laws)
//remove all recursive functions!!!!!!!
//abwechselnd tag und nacht
//nachwächter action: leuchten (erhöht vision/range)
//group: TRAPS (react to steps/path)

function initKnowledge (knowledge, info, keys)
{
	var open = [];

	do
	{
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

		if (!(info.id in knowledge))
		{
			knowledge[info.id] = [info.type.id];
		}

		if ((info.type.group != 5) && (info.type.group != 1))//temp!!!!gruppen überarbeiten/vereinfachen
		{
			insight -= info.state[1];

			if (insight < 0)
			{
				continue;
			}
		}

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

			ooc.push(child_id, knowledge, info.id, 2);

			if ((child.type.group != 5) || (child.state[1] in keys))
			{
				open.push([child, insight]);
			}
		}
	}
	while (next = open.pop())
}

var World = ooo.TileMap.extend(function ()
{
	this.knowledge = {};
	//this.decay = [];
	ooo.TileMap.call(this);
	this.realms = [];
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
	info.type = jup.infos[data[0]];
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

World.method('charsAt', function (tile_i)
{
	var chars = [];
	var info = this.knowledge[tile_i];

	for (var info_id in info.children)
	{
		var child = info.children[info_id];

		if (child.type.group == 2)
		{
			chars.push(child);
		}
	}

	return chars;
});

World.method('rootsOf', function (info, group)
{
	var roots = {};
	var open = [];

	do
	{
		if (info.type.group == group)
		{
			roots[info.id] = true;
		}
		else
		{
			for (var info_id in info.parents)
			{
				open.push(info.parents[info_id]);
			}
		}
	}
	while (info = open.pop())

	return roots;
});

World.method('birth', function (data, home, seat)
{
	var char = {};
	char.info = this.spawn(data, [home]);
	char.mind = this.spawn([42], [char.info.id]);
	char.home = this.spawn([33, [home]], [char.mind.id]);
	char.task = this.spawn([23, [[home], 0, {}]], [char.mind.id]);
	//char.inventory = {};
	//char.pools = {};
	var realm = this.realms[seat];
	realm.chars[char.info.id] = char;
	initKnowledge(realm.knowledge, char.info, {});
	//return char;
});

var Realm = ooc.Class.extend(function (stats)
{
	this.stats = stats;
	this.time = 0;
	this.deck = [];
	this.hand = [];
	this.chars = {};
	this.knowledge = {};
	this.terrain = {};
	this.briefing = {};
});

var Game = ooc.Class.extend(function (mode, rules)
{
	ooc.Class.call(this);
	this.mode = mode;//get from somewhere getMode(name)
	this.rules = rules;
	this.stats = {};//load from database fetchModStats(name);
	this.core = mod;
	this.size = 0;
	this.time = 0;
	this.tocks = 0;
	this.open = true;
	this.started = false;
	this.players = {};
	//this.seats = [];
	this.world = new World();
	this.actions = {};

	//this.chars = {};
	//this.traps = {};
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

	try
	{
		var ready = this.core.ready(this.stats, this.rules, this.size);
	}
	catch (e)
	{
		console.log('MOD READY EXCEPTION');
	}

	if (ready)
	{
		console.log('READY %d %d', this.id, START_DELAY);
		this.open = false;
		this.broadcast('ready', [START_DELAY]);
		var that = this;
		this.timeout = setTimeout(function () { that.start() }, START_DELAY * 1000);
	}
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
	var seat = 0;

	for (var name in this.players)
	{
		var player = this.players[name];
		player.seat = seat;
		//this.seats[seat] = player;
		var stats = {};//load from database fetchModePlayerStats(name, mode);
		this.world.realms[seat] = new Realm(stats);//seat: seat, 
		seat++;
	}

	this.tick();
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

	//trigger traps
	/*for (var tile_i in this.traps)
	{
		var tile = this.world.index[tile_i];
		var chars = this.world.charsAt(tile_i);

		for (var i = 0; i < this.traps[tile_i].length; i++)
		{
			//test trigger conditions
			var trap = this.traps[tile_i][i];

			if (trap.trigger(tile, chars))
			{
				trap.effect(tile, chars);
			}
			else
			{
				trap.time++;
			}
		}
	}*/

	//trigger events
	/*for (var tile_i in this.pools)
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
					event.char_effect.call(this, tile.i, char);
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
	}*/
	for (var tile_i in this.actions)
	{
		//var tile = this.world.index[tile_i];

		if (ooc.size(this.actions[tile_i]) > 1)
		{
			console.log('Kollision!!');
			//gather gains and merge/match (one shield absorbs one sword)
			////create rule_solve_function

			///jede karte hat ein oder mehr schild(schaden schlucken),schwert(schafen verursachen),taler(+gold),hand(+diplomatie),maske(+itemklauen),magie etc (upleveln / blitze king of tokyo) die bei kollisionen einen pool bilden und bei auflösung abgerechnet werden
			////kollisionen können auch ganz bewusst herbeigeführt werden->angriff etc

			///schwert (deal damage/do nothing)
			///shield (absorb damage/do nothing)
			///smoke (???/escape undetected if not smaller)
			/////nachts +x smoke??
			///hands (both get sum if both play hands)
		}
		else
		{
			for (var info_id in this.actions[tile_i])
			{
				for (var i = 0; i < this.actions[tile_i][info_id].length; i++)
				{
					var action = this.actions[tile_i][info_id][i];

					if (action.card.effect != null)
					{
						console.log('EFFECT "%s"', action.card.title);
						action.card.effect(this.world, action.realm, action.char, action.info);//oder erstmal sammeln und später updaten???
					}
				}
			}
		}
	}

	try
	{
		var over = this.core.update(this.stats, this.rules, this.world, this.time);
	}
	catch (e)
	{
		console.log('MOD TICK EXCEPTION');

		if (e.stack)
		{
			console.log(e.stack);
		}
		else
		{
			console.log(e.toString());
		}
	}

	//update realms
	//for (var seat = 0; seat < this.world.realms.length; seat++)
	for (var name in this.players)
	{
		var player = this.players[name];
		var realm = this.world.realms[player.seat];
		realm.knowledge = {};

		for (var info_id in realm.chars)
		{
			var char = realm.chars[info_id];
			var area = this.world.findArea(ooc.clone(char.task.state[0]), char.info.state[2], function (data) { return data.info.state[2] });

			//var task = ooc.map(char.task.type.param, char.task.state);
			//abgeschlossene aktionen abziehen!!!!(oder noch bestehende aktionen addieren??)
			//determineTask(task, char.pools);
			//task.range = 0;//pay only once for path!? (event exec verzögerungen sollten aber in extra kosten resultieren!!!
			//char.task.state = ooc.index(char.task.type.param, task);

			this.world.relink2(char.mind, [char.home.id, char.task.id]);

			for (var tile_i in area)
			{
				var info = this.world.knowledge[tile_i];
				this.world.link(info, char.mind);
				realm.terrain[tile_i] = info.type.id;
			}

			initKnowledge(realm.knowledge, char.info, {});
			gatherKnowledge(realm.knowledge, char.mind, char.info.state[3], {'xxx': true});
		}

		if (player.client)
		{
			player.client.send('tick', [realm.hand, ooc.intkeys(realm.chars), realm.knowledge, realm.terrain, realm.briefing]);

			if (realm.briefing.draw > 0)
			{
				player.client.expect('draw');
			}
			else
			{
				player.client.expect('tock');
			}
		}
	}

	this.time++;
	this.tocks = 0;
});

Game.method('draw', function (player, type)
{
	console.log('DRAW %d %s %d', this.id, player.name, type);
	var realm = this.world.realms[player.seat];

	try
	{
		var card_id = this.core.draw(this.stats, this.rules, this.world, realm, this.time, type);
	}
	catch (e)
	{
		console.log('MOD DRAW EXCEPTION');
	}

	realm.briefing.draw--;
	realm.hand.push(card_id);

	if (player.client)
	{
		player.client.send('card', [card_id]);

		if (realm.briefing.draw > 0)
		{
			player.client.expect('draw');
		}
		else
		{
			player.client.expect('tock');
		}
	}
});

Game.method('tock', function (player, actions)
{
	var realm = this.world.realms[player.seat];
	console.log('TOCK %d %d %s %s', this.id, realm.time, player.name, JSON.stringify(actions));
	var tasks = {};

	//validate
	for (var info_id in actions)
	{
		if (!(info_id in realm.chars))
		{
			throw 'missing char';
		}

		var char = realm.chars[info_id];
		var home = this.world.index[char.home.state[0]];
		var task = ooc.map(char.task.type.param, char.task.state);
		task.route = ooc.hash(task.route);
		tasks[info_id] = task;

		for (var tile_i in actions[info_id])
		{
			for (var i = 0; i < actions[info_id][tile_i].length; i++)
			{
				var action = actions[info_id][tile_i][i];
				var tile = home;
				var steps = action[0];

				for (var j = 0; j < steps.length; j++)
				{
					tile = tile.steps[steps[j]];

					if (tile.i in task.route)
					{
						continue;
					}

					task.route[tile.i] = true;
					task.range += tile.data.info.state[2];
				}

				if (tile.i != tile_i)
				{
					throw 'target mismatch';
				}

				var card_id = action[1];
				var card = jup.cards[card_id];

				if (!card.condition(tile.data.info))
				{
					throw 'card misplace';
				}

				var info = this.world.knowledge[action[2]];
				var roots = this.world.rootsOf(info, 0);

				if (!(tile_i in roots))
				{
					throw 'no info here';
				}

				task.cost = jup.addCost(task.cost, card.cost);
				actions[info_id][tile_i][i] = {realm: realm, char: char, card: card, info: info};
			}
		}

		if (task.range > char.info.state[2])
		{
			throw 'exceeding range';
		}

		if (!jup.matchCost(task.cost, char.info.state[5]))
		{
			throw 'exceeding power';
		}
	}

	//update
	for (var info_id in actions)
	{
		var char = realm.chars[info_id];
		var task = tasks[info_id];
		task.route = ooc.intkeys(task.route);
		this.world.relink(char.info, task.route);
		char.info.state[2] -= task.range;
		char.info.state[5] = jup.subtractCost(char.info.state[5], task.cost);
		char.task.state = ooc.index(char.task.type.param, task);

		for (var tile_i in actions[info_id])
		{
			for (var i = 0; i < actions[info_id][tile_i].length; i++)
			{
				var action = actions[info_id][tile_i][i];
				ooc.push(action, this.actions, tile_i, info_id);
			}
		}
	}

	realm.time++;
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
		var realm = game.world.realms[player.seat];
		var wait = (realm.time < game.time) ? 0 : this.size - this.tocks;
		this.send('continue', [game.mode, game.rules, game.names(), game.time, realm.hand, ooc.intkeys(realm.chars), realm.knowledge, realm.terrain, realm.briefing, wait]);

		if (!wait)
		{
			if (realm.briefing.draw > 0)
			{
				player.client.expect('draw');
			}
			else
			{
				player.client.expect('tock');
			}
		}
	}
	else
	{
		console.log('GRANT %s', name);
		var games = {};

		for (var id in this.server.games)
		{
			var game = this.server.games[id];
			games[id] = [game.mode, game.rules, game.names()];
		}

		this.send('grant', [games]).expect('host', 'join');
	}
});

Client.on('message:host', function (mode, rules)
{
	console.log('HOST %s %s', this.player.name, JSON.stringify(rules));
	var game = new Game(mode, rules);
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

Client.on('message:draw', function (type)
{
	this.player.game.draw(this.player, type);
});

Client.on('message:tock', function (actions)
{
	this.player.game.tock(this.player, actions);
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

		for (var name in state.games[i].world.realms)
		{
			var realm = state.games[i].world.realms[name];
			var player = this.players[name];
			var seat = game.realms.length;
			game.world.realms[seat] = realm;
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
