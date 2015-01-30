var fs = require('fs');
var ooo = require('./ooo.js');
var mod = require('./mod0.js');
var ooc = require('../client/source/ooc.js');
var jup = require('../client/source/info.js');
var START_DELAY = 0;
var DENY_DELAY = 1;
var ELEMS = ['Fire', 'Ice', 'Stone'];
var POOL_TIMEOUT = 4;

//mod access to map is baaaaad /// needs to be changed!!!!!!!!!!!1 (or does it??? maximum freedom for mods!!! think about whats really never needed and remove that from reach!!!)
/////do not influence basic game loop and functionality!!!

//////EVENT TRIGGGER (protectio/laws)
//remove all recursive functions!!!!!!!
//abwechselnd tag und nacht
//nachwächter action: leuchten (erhöht vision/range)
//group: TRAPS (react to steps/path)

var World = ooc.Class.extend(function ()
{
	ooc.Class.call(this);
	this.knowledge = {};
	this.realms = [];
	this.chars = {};
});

World.method('link', function (child, parent)
{
	child.parents[parent.id] = this.knowledge[parent.id];
	child.parents[parent.id].children[child.id] = child;
});

World.method('unlink', function (child, parent)
{
	delete child.parents[parent.id];
	delete parent.children[child.id];
});

World.method('relinkParents', function (info, parents)
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

World.method('relinkChildren', function (info, children)
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
	info.id = ooc.fill(info, this.knowledge);//array mit gelöschten ids!!! (kein object mehr)//per closure??: function (deleted) { return function ()
	info.type = jup.infos.by_id[data[0]];
	info.state = data[1] || ooc.clone(info.type.state);
	//info.state = ooc.map(info.type.param, data[1] ? data[1] : info.type.state);
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

World.method('transform', function (info_id, type, state)
{
	var info = this.knowledge[info_id];
	info.type = jup.infos.by_id[type];
	info.state = state || ooc.clone(info.type.state);
});

World.method('unspawn', function (info)
{
	delete this.knowledge[info.id];

	for (var info_id in info.children)
	{
		var child = info.children[info_id];
		this.unlink(child, info);
		//delete child.parents[info.id];
		//delete info.children[i];
		
		if (ooc.size(child.parents) == 0)
		{
			this.unspawn(child);
		}
	}

	for (var info_id in info.parents)
	{
		var parent = info.parents[info_id];
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

World.method('deliver', function (data, home)
{
	var char = {};
	char.info = this.spawn(data, [home]);
	char.mind = this.spawn([42], [char.info.id]);
	char.home = this.spawn([33, [home]], [char.mind.id]);
	char.task = this.spawn([23, [[home], 0, {}]], [char.mind.id]);
	//char.inventory = {};
	//char.pools = {};
	this.chars[char.info.id] = char;
	return char;
});

World.method('kill', function (char)
{
	this.unspawn(char.info);
	delete this.chars[char.info.id];
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

Realm.method('join', function (char)
{
	this.chars[char.info.id] = char;
	initKnowledge(this.knowledge, char.info, {});
});

var Map = ooo.TileMap.extend(function (size)
{
	ooo.TileMap.call(this, size);
});

Map.method('initData', function (i, x, y)
{
	return {info: null};
});

Map.method('calcCost', function (data)
{
	return data.info.type.range;
});

function log_exception (exception, message)
{
	console.log(message);

	if (exception.stack)
	{
		console.log(exception.stack);
	}
	else
	{
		console.log(exception.toString());
	}
}

//apply effects on char
function collideChars(char_a, power_a, char_b, power_b)
{
	//gather powers and merge/match (one shield absorbs one sword)
	////create rule_solve_function

	///jede karte hat ein oder mehr schild(schaden schlucken),schwert(schafen verursachen),taler(+gold),hand(+diplomatie),maske(+itemklauen),magie etc (upleveln / blitze king of tokyo) die bei kollisionen einen pool bilden und bei auflösung abgerechnet werden
	////kollisionen können auch ganz bewusst herbeigeführt werden->angriff etc

	///schwert (deal damage (-1 health))
	///shield (absorb damage)
	///smoke (escape undetected if not smaller (and steal sth from other char(s)?)
	/////nachts +x smoke??
	///hands(nicht coins denn die gibts als items) (both get sum if both play hands)
	///flash (wenn beide flash(haste) spielen wird der char mir mehr ausgeführt als wäre er allein)
	///hearts??? (heal other chars (+1 health))
	///mouth (if >= count than opponent get his power)

	///ANREGEN ZUM TREFFEN ABER AUCH ABHALTEN
	////MAN KANN WAS GEWINNEN ABER AUCH (DURCH DIEBE) VERLIEREN

	//KARTENIDEE: "Nichtangriffspakt" (wenn man kollidiert werden alle schwerter ignoriert oder wandeln sich zu händen)

	console.log('Colliding (%d) against (%d)', char_a.info.id, char_b.info.id, power_a, power_b);

	//CHECK HERE FOR TREATIES!!!!!

	if (power_b[1])//sword
	{
		var damage = power_a[0] ? (power_b[1] - power_a[0]) : power_b[1];

		if (damage > 0)
		{
			console.log('(%d) takes %d damage', char_a.info.id, damage);
			char_a.info.state[2] -= damage;
		}
	}
}

//Game
function resolveCollision (collision)
{
	var powers = {};

	for (var info_id in collision)
	{
		var actions = collision[info_id];
		var power = {};
		console.log('+++ (%d) +++', info_id);

		for (var i = 0; i < actions.length; i++)
		{
			var action = actions[i];
			console.log('GAIN "%s" %s', action.card.title, JSON.stringify(action.card.power));
			power = jup.addPower(power, action.card.power);
		}

		powers[info_id] = power;
	}

	//collide everybody with everybody else (cross)
	for (var info_id_a in collision)
	{
		var char_a = this.world.chars[info_id_a];
		var power_a = powers[info_id_a];

		for (var info_id_b in collision)
		{
			if (info_id_a == info_id_b)
			{
				continue;
			}

			var char_b = this.world.chars[info_id_b];
			var power_b = powers[info_id_b];
			collideChars(char_a, power_a, char_b, power_b);
		}
	}

	for (var info_id in collision)
	{
		var char = this.world.chars[info_id];

		if (char.info.state[2] < 1)
		{
			console.log('(%d) died', info_id);
		}
	}
}

//Game
function executeActions (actions)
{
	for (var i = 0; i < actions.length; i++)
	{
		var action = actions[i];

		if (action.card.effect != null)
		{
			console.log('EFFECT "%s"', action.card.title);
			action.card.effect(this.world, action.realm, action.char, action.info);//oder erstmal sammeln und später updaten???
		}
	}
}

function initKnowledge (knowledge, info, keys)
{
	var open = [];

	do
	{
		if (!(info.id in knowledge))
		{
			knowledge[info.id] = [info.type.id, info.state];
		}

		for (var info_id in info.children)
		{
			var child = info.children[info_id];
			ooc.push(info_id, knowledge, info.id, 2);

			if (child.type.id == 42)
			{
				continue;
			}

			open.push(child);
		}
	}
	while (info = open.pop())
}

function gatherKnowledge (knowledge, info, insight, keys)
{
	var next = [info, insight];
	var open = [];

	//TODO
	////visible/invisible locks (invisible are spells nstuff)
	////merken wo chars anfangen und abbrechen(mit insight) und dort weitermachen
	///////zu kompliziert??? denke schon... wenns anders lange dauert und sich lohnt, vorher net... wenns anders lange dauert und sich lohnt, vorher net
	////wie krieg ich diese mindloop an clients übertragen?

	do
	{
		info = next[0];
		insight = next[1];

		if (!(info.id in knowledge))
		{
			knowledge[info.id] = [info.type.id, info.state];
		}

		for (var info_id in info.children)
		{
			var child = info.children[info_id];

			if (insight < child.obscurity)
			{
				continue;
			}

			//is it locked?
			/*if ((child.type.group == 3) && (child.type.subgroup == 1))
			{
				var key = child.state[0];

				if (key in keys)
				{
					//use key only once
					delete keys[key];
				}
				else
				{
					continue;
				}
			}*/

			ooc.push(info_id, knowledge, info.id, 2);

			if (child.type.id == 42)
			{
				continue;
			}

			open.push([child, insight - child.obscurity]);
		}
	}
	while (next = open.pop())
}

var Game = ooc.Class.extend(function (mode, rules, core, stats)
{
	ooc.Class.call(this);
	this.mode = mode;
	this.rules = rules;
	this.core = core;
	this.stats = stats;
	this.open = true;
	this.started = false;
	this.size = 0;
	this.players = {};
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
		this.map_size = this.core.ready(this.stats, this.rules, this.size);
	}
	catch (e)
	{
		log_exception(e, 'CORE READY EXCEPTION');
	}

	if (this.map_size)
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
		delete this.map_size;
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
	this.actions = {};
	this.time = 0;
	this.tocks = 0;
	this.map = new Map(this.map_size);
	this.world = new World();

	for (var i = 0; i < this.map.index.length; i++)
	{
		this.map.index[i].data.info = this.world.spawn([0]);
	}

	var seat = 0;

	for (var name in this.players)
	{
		var player = this.players[name];
		player.seat = seat;
		var stats = {};//fetchPlayerStats(mode, name);
		this.world.realms[seat] = new Realm(stats);
		seat++;
	}

	try
	{
		this.core.start(this.stats, this.rules, this.world);
	}
	catch (e)
	{
		log_exception(e, 'CORE START EXCEPTION');
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

	for (var tile_i in this.actions)
	{
		var collision = this.actions[tile_i];
		//var tile = this.map.index[tile_i];

		if (ooc.size(collision) > 1)
		{
			console.log('Collision at (%d)', tile_i);
			resolveCollision.call(this, collision);
		}
		else
		{
			console.log('Execution at (%d)', tile_i);
			var actions = ooc.minKeyValue(collision);
			executeActions.call(this, actions);
		}
		
		delete this.actions[tile_i];
	}

	try
	{
		var over = this.core.update(this.stats, this.rules, this.world, this.time);
	}
	catch (e)
	{
		log_exception(e, 'CORE TICK EXCEPTION');
	}

	//update realms (könnte man super parallelisieren!!!! und ist auch das teuerste; nodejs nachschlagen; mit callback??)
	for (var name in this.players)
	{
		var player = this.players[name];
		var realm = this.world.realms[player.seat];
		realm.knowledge = {};

		for (var info_id in realm.chars)
		{
			var char = realm.chars[info_id];
			var area = this.map.findArea(ooc.clone(char.task.state[0]), char.info.state[0]);

			//var task = ooc.map(char.task.type.param, char.task.state);
			//abgeschlossene aktionen abziehen!!!!(oder noch bestehende aktionen addieren??)
			//determineTask(task, char.pools);
			//task.range = 0;//pay only once for path!? (event exec verzögerungen sollten aber in extra kosten resultieren!!!
			//char.task.state = ooc.index(char.task.type.param, task);
			char.task.state = [[char.home.state[0]], 0, {}];//temp

			this.world.relinkChildren(char.mind, [char.home.id, char.task.id]);

			for (var tile_i in area)
			{
				var info = this.world.knowledge[tile_i];
				this.world.link(info, char.mind);
				realm.terrain[tile_i] = info.type.id;
			}

			initKnowledge(realm.knowledge, char.info, {});
			gatherKnowledge(realm.knowledge, char.mind, char.info.state[1], {'xxx': true});
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

Game.method('draw', function (player, group)
{
	console.log('DRAW %d %s %d', this.id, player.name, group);
	var realm = this.world.realms[player.seat];

	try
	{
		var card_id = this.core.draw(this.stats, this.rules, this.world, realm, this.time, group);
	}
	catch (e)
	{
		log_exception(e, 'CORE DRAW EXCEPTION');
	}

	realm.hand.push(card_id);
	realm.briefing.draw--;

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
		var home = this.map.index[char.home.state[0]];
		var task = ooc.map(char.task.type.param, char.task.state);
		task.route = ooc.hash(task.route);
		tasks[info_id] = task;
		var hand_i = 0;

		for (var tile_i in actions[info_id])
		{
			for (var i = 0; i < actions[info_id][tile_i].length; i++)
			{
				var action = actions[info_id][tile_i][i];
				var card_id = action[0];

				if (!(card_id in jup.cards.by_id))
				{
					throw 'no card';
				}

				var card = jup.cards.by_id[card_id];
				hand_i = realm.hand.indexOf(card.id, hand_i);

				if (hand_i < 0)
				{
					throw 'not holding';
				}

				var target_id = action[1];

				if (!(target_id in this.world.knowledge))
				{
					throw 'no info';
				}

				var info = this.world.knowledge[target_id];

				if (!card.condition(info))
				{
					throw 'condition fail';
				}

				var roots = this.world.rootsOf(info, 1);

				if (!(tile_i in roots))
				{
					throw 'no root';
				}

				var tile = home;
				var steps = action[2];

				for (var j = 0; j < steps.length; j++)
				{
					tile = tile.steps[steps[j]];

					if (tile.i in task.route)
					{
						continue;
					}

					task.route[tile.i] = true;
					task.range += tile.data.info.type.range;
				}

				if (tile.i != tile_i)
				{
					throw 'tile mismatch';
				}

				task.power = jup.addPower(task.power, card.power);
				actions[info_id][tile_i][i] = {realm: realm, char: char, card: card, info: info};
			}
		}

		if (task.range > char.info.state[0])
		{
			throw 'exceeding range';
		}

		if (!jup.matchPower(task.power, char.info.state[3]))
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
		this.world.relinkParents(char.info, task.route);
		char.info.state[0] -= task.range;
		char.info.state[3] = jup.subtractPower(char.info.state[3], task.power);
		char.task.state = ooc.index(char.task.type.param, task);

		for (var tile_i in actions[info_id])
		{
			for (var i = 0; i < actions[info_id][tile_i].length; i++)
			{
				var action = actions[info_id][tile_i][i];
				realm.hand.splice(realm.hand.indexOf(action.card.id), 1);
				console.log(realm.hand);
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

//connection object (non persistent)
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
	var core = mod;//getCore(mode);
	var stats = {};//getStats(mode);
	var game = new Game(mode, rules, core, stats);
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

//Account Object (with persistent elements (name, pass, email, stats, etc)
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

		for (var name in state.games[i].map.realms)
		{
			var realm = state.games[i].map.realms[name];
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
