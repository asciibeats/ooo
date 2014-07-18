var http = require('http');
var sockjs = require('sockjs');

//var NULL = 0;
//var OPEN = -1;
//var CLOSE = -2;
var TARGET = 0;
var PATH = 1;
var ORIGIN = 2;
var NMASK = [[[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]], [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]]];

//terrain
var PLAINS = 1;

//items
var TIME = 0;
var WOOD = 1;
var APPLE = 2;

//quests
var FIREPLACE = 5;

var ACTIONS = [];

ACTIONS[FIREPLACE] = function (i, watch)
{
	do
	{
		this.game.board.occupant[i] = this.seat;
	}
	while (i = watch.pop())

	//return [1];//event?eventqueue
}

t1l = {};
module.exports = t1l;

t1l.fill = function (object, value)
{
	var keys = Object.keys(object);

	for (var id = 0; id < keys.length; id++)
	{
		if (id != keys[id])
		{
			break;
		}
	}

	object[id] = value;
	return id;
}

t1l.Sockman = function ()
{
	this.sockets = {};
	this.events = {};
	this.http = null;
	this.sockjs = null;
}

t1l.Sockman.prototype.open = function  (port)
{
	console.log('OPEN %d', port);
	this.http = http.createServer();
	this.sockjs = sockjs.createServer();
	this.sockjs.installHandlers(this.http);//, {prefix: '/socket'}
	var that = this;

	this.sockjs.on('connection', function (conn)
	{
		var socket = {};
		socket.state = 0;
		socket.conn = conn;
		socket.id = t1l.fill(that.sockets, socket);

		socket.send = function (message)
		{
			conn.write(JSON.stringify(message));
		}

		socket.close = function (code)
		{
			conn.close(code);
		}

		that.trigger(socket, -1);

		conn.on('data', function (string)
		{
			var data = JSON.parse(string);

			if (!Array.isArray(data))
			{
				console.log('ERROR %d', 666);
				return;
			}

			var type = data.shift();

			if (type > 0)
			{
				that.trigger(socket, type, data);
			}
			else
			{
				console.log('%d ERROR %d', socket.id, 345);
			}
		});

		conn.on('close', function ()
		{
			that.trigger(socket, -2);
			delete that.sockets[socket.id];
		});
	});

	this.http.listen(port);//, '0.0.0.0'
}

t1l.Sockman.prototype.on = function (type, expect, action)
{
	this.events[type] = {};
	this.events[type].action = action;
	this.events[type].expect = {};

	for (var i in expect)
	{
		this.events[type].expect[expect[i]] = true;
	}
}

t1l.Sockman.prototype.trigger = function (socket, type, data)
{
	if (this.events[type] && ((type < 0) || this.events[socket.state].expect[type]))
	{
		try
		{
			if (this.events[type].action)
			{
				this.events[type].action.apply(socket, data);
			}

			socket.state = type;
		}
		catch (e)
		{
			console.log('%d EXCEPTION %s', socket.id, e);
			//socket.ecount++;
			//disconnect?
		}
	}
}

/*t1l.Leader = function ()
{
}*/

t1l.Player = function ()
{
	this.chars = [];
	this.games = [];
	this.groups = [];
	this.banned = [];//if you host a game, these players wont be allowed to join
	this.messages = [];
}

t1l.Player.prototype.login = function (name, pass)
{
	this.name = name;
	this.pass = pass;
}

t1l.Player.prototype.load = function (state)
{
	//bank:geld gegen ware
	//hoher rat:richtbarkeit bei verletzung eines vertrages
	//häusertiles->einwohner->arbeiter/entdecker(quests)/krieger
	//felder sind gebäude mit timeout(bei timeout ernte)
	//tile für druiden (waldquests)
	//questen funktioniert so: tile aussuchen (partychef festgelegt durch tile;wiese->mensch;wald->elf;berg->zwerg;wasser->pirat)->partymitglieder an umliegenden feldern ausrichten
	//krieger->nicht ausgespielt->defensiv
	//krieger->ausgespielt->angriff
	//jäger&sammler/holzzeit/steinzeit
	this.chars = state[0];
	this.games = state[1];
	this.groups = state[2];
}

t1l.Player.prototype.store = function (message)
{
	this.messages.push(message);
}

t1l.Player.prototype.join = function (id)
{
	this.games[id] = true;
}

t1l.Player.prototype.leave = function (id)
{
	delete this.games[id];
}

var rough = 0.3;

function diamond (x1, y2, d)
{
	var x2 = (x1 + d) % this.size;

	if (this.tiles[y2][x2] != undefined)
	{
		return [];
	}

	var y1 = (y2 - d + this.size) % this.size;
	var y3 = (y2 + d) % this.size;
	var x3 = (x2 + d) % this.size;

	var h = this.tiles[y2][x1];
	h += this.tiles[y1][x2];
	h += this.tiles[y2][x3];
	h += this.tiles[y3][x2];
	h /= 4;
	h += ((Math.random() * 2 - 1) / (this.size - d)) * rough;
	//h += (Math.random() / (this.size - d)) * rough;

	this.tiles[y2][x2] = h;
	return [[x1, y1], [x2, y1], [x1, y2], [x2, y2]];
}

function square (x1, y1, d)
{
	var x2 = x1 + d;
	var y2 = (y1 + d) % this.size;

	if (this.tiles[y2][x2] != undefined)
	{
		return [];
	}

	var x3 = (x2 + d) % this.size;
	var y3 = (y2 + d) % this.size;

	var h = this.tiles[y1][x1];
	h += this.tiles[y1][x3];
	h += this.tiles[y3][x1];
	h += this.tiles[y3][x3];
	h /= 4;
	h += ((Math.random() * 2 - 1) / (this.size - d)) * rough;
	//h += (Math.random() / (this.size - d)) * rough;

	this.tiles[y2][x2] = h;
	var x0 = (x1 - d + this.size) % this.size;
	return [[x0, y2], [x1, y1], [x2, y2], [x1, y3]];
}

//man muss sich einbunkern können (wenn das terrain es erlaubt)

/*function regroup (tile, group)
{
	if (tile.group == undefined)
	{
		var type = tile.type;

		if (!this.groups[group])
		{
			this.groups[group] = [];
		}

		if (!this.grpmap[type])
		{
			this.grpmap[type] = {};
		}

		this.groups[group].push(tile.i);
		this.grpmap[type][group] = true;
		tile.group = group;

		for (var i = 0; i < 6; i++)
		{
			var next = tile.steps[i];

			if (next.type == tile.type)
			{
				regroup.call(this, next, group);
			}
		}
	}
}*/

//plattentektonik -> berge
//sonne scheint, erhitzt erde je nach oberfläche/äquator -> luftdruck/wind & luftfeuchtigkeit
//luft steigt an bergen auf und regnet ab -> flüsse
var BASETYPES = [0,1,2,3,4,1];

function regroup (tile)
{
	if (('group' in tile) && ('i' in tile.group))
	{
		this.groups.splice(tile.group.i, 1);
		delete tile.group.i;
	}

	var group = {};
	group.type = BASETYPES[tile.type];
	group.tiles = [tile];
	group.borders = {};//todo
	group.steps = [];//todo
	group.i = this.groups.length;
	this.groups.push(group);
	tile.group = group;

	if (group.type in this.types)
	{
		console.log('NEXT GROUP %d', group.type);
		this.types[group.type].push(group);
	}
	else
	{
		console.log('FIRST GROUP %d', group.type);
		this.types[group.type] = [group];
	}

	var open = [tile];

	do
	{
		var current = open.pop();

		for (var i = 0; i < current.steps.length; i++)
		{
			var next = current.steps[i];

			if (BASETYPES[next.type] != group.type)
			{
				/*if ('group' in next)
				{
					if (next.group.i in group.borders)
					{
						group.borders[next.group.i]++;
					}
					else
					{
						group.borders[next.group.i] = 1;
						next.group.borders[next.group] = 1;
					}
				}*/
			}
			else if (next.group != group)
			{
				next.group = group;
				group.tiles.push(next);
				open.push(next);
			}
		}
	}
	while (open.length > 0)
}

function Board (size)
{
	this.size = size;
	this.index = [];
	this.groups = [];
	this.types = [];

	this.terrain =
	[
		0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
		0,2,2,2,1,1,1,1,1,1,2,2,2,2,2,0,
		0,2,2,2,1,1,1,1,2,2,2,2,2,2,2,0,
		0,1,2,2,2,1,1,1,1,2,2,2,2,2,2,0,
		0,1,1,1,1,1,1,1,1,2,3,3,2,2,1,0,
		0,1,1,1,2,1,2,1,1,1,3,3,3,2,1,0,
		0,1,1,1,2,2,2,2,1,3,3,3,1,1,1,0,
		0,1,1,1,1,2,2,3,3,4,3,1,1,1,1,0,
		0,1,1,1,1,1,3,3,4,4,3,1,1,1,1,0,
		0,1,1,1,1,3,3,4,4,3,3,1,1,1,2,0,
		0,1,1,1,2,2,2,3,3,3,2,1,1,2,2,0,
		0,2,2,2,2,2,2,1,1,2,2,2,1,2,2,0,
		0,2,2,2,2,1,1,1,1,1,1,1,1,2,2,0,
		0,1,2,2,1,1,1,1,1,1,2,2,1,1,1,0,
		0,1,1,1,1,1,1,1,1,2,2,2,2,2,1,0,
		0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
	];

	/*for (var y = 0; y < size; y++)
	{
		this.tiles[y] = [];
	}

	var squares = [];
	var diamonds = [];

	var d = size >> 1;
	this.tiles[0][0] = 0.999;
	this.tiles[d][d] = 0.0;
	squares = squares.concat(diamond.call(this, 0, 0, d));
	squares = squares.concat(diamond.call(this, d, d, d));

	for (d >>= 1; d > 0; d >>= 1)
	{
		while (squares.length)
		{
			var s = squares.pop();
			//console.log('SQ', s[0], s[1], d);
			diamonds = diamonds.concat(square.call(this, s[0], s[1], d));
		}

		while (diamonds.length)
		{
			var s = diamonds.pop();
			//console.log('DI', s[0], s[1], d);
			squares = squares.concat(diamond.call(this, s[0], s[1], d));
		}
	}*/

	//creating tiles from terrain
	for (var i = 0; i < this.terrain.length; i++)
	{
		var tile = {};
		tile.i = i;
		tile.type = this.terrain[i];
		this.index[i] = tile;
	}

	//building up neighbor connections
	for (var y = 0, i = 0; y < size; y++)
	{
		var nmask = NMASK[y & 1];

		for (var x = 0; x < size; x++, i++)
		{
			var steps = [];

			for (var j in nmask)
			{
				var nx = (x + nmask[j][0] + size) % size;
				var ny = (y + nmask[j][1] + size) % size;
				steps[j] = this.index[ny * size + nx];
			}

			this.index[i].steps = steps;
		}
	}

	//separate groups
	for (var i = 0; i < this.index.length; i++)
	{
		var tile = this.index[i];

		if (!('group' in tile))
		{
			regroup.call(this, tile);
		}
	}
}

t1l.Game = function (rules, name)
{
	this.time = 0;
	this.open = true;//temp->false
	this.invited = {};
	this.banned = {};
	//this.admins = {};
	//this.admins[name] = true;
	this.seats = {};
	this.seats[name] = true;
	this.rules = rules;
	this.free = rules[0] - 1;
	this.size = rules[1];//has to be even
	this.board = new Board(this.size);
}

t1l.Game.prototype.join = function (name)
{
	if ((this.open || this.invited[name]) && !this.banned[name] && this.free)
	{
		var others = Object.keys(this.seats);
		this.seats[name] = true;
		this.free--;
		return others;
	}
}

t1l.Game.prototype.leave = function (name)
{
	if (!this.time && this.seats[name])
	{
		delete this.seats[name];
		this.free++;
		return Object.keys(this.seats);
	}
}

t1l.Game.prototype.joined = function ()
{
	return Object.keys(this.seats);
}

//helper
function template (size)
{
	var actions = [];

	for (var seat = 0; seat < size; seat++)
	{
		actions[seat] = [];
	}

	return actions;
}

t1l.Game.prototype.start = function ()
{
	this.open = false;
	this.time = 1;
	this.ticks = 0;
	this.realms = [];
	var seat = 0;
	var groups = Object.keys(this.board.types[PLAINS]);
	var size = Object.keys(this.seats).length;

	for (var name in this.seats)
	{
		var group = this.board.types[PLAINS][groups.splice(Math.floor(Math.random() * groups.length), 1)[0]];//pick random group

		var stats = {};
		stats[group.i] = [0, 0, 1, 1, 2];

		this.realms[seat] = [stats, [template(size)]];
		this.seats[name] = seat++;
	}
}

t1l.Game.prototype.tick = function (name, quests, callback)
{
	if (this.time == 0)
	{
		throw 888;
	}

	var seat = this.seats[name];

	if (seat == undefined)
	{
		throw 543;
	}

	var realm = this.realms[seat];

	if (realm[1][this.time] != undefined)
	{
		throw 4444;
	}

	realm[1][this.time] = template(this.size);
	realm[1][this.time][seat] = quests;
	this.ticks++;

	if (this.ticks < this.realms.length)
	{
		return;
	}

	this.time++;
	this.ticks = 0;

	//apply all quests (reihenfolge?)
	/*for (var i = 0, j = quests.length; i < j; i++)
	{
		var type = quests[i][0];
		var args = quests[i][1];
		//subtract from items
		//realm.results[this.time][i] = ACTIONS[type].apply({game: this, seat: seat}, args);
	}*/

	callback();
}

//realm health(basispunkte) + foods produced = actionpoints
////if no food produced decrease health by 1

//domination zone an besetzte geb angrenzende tiles reichweite r (abhängig von powerlevel)
//EARLYGAME: discover!!!
//MIDGAME: diplomacy!!!
//ENDGAME: world quests!!!
//quests sind ereigniskarten
//ereigniskarten kann man als gruppe spielen
//Missgeschicke schicken :DDDD NASSER SCHUH!!(relativ teuer müssen die sein, darf nur dosiert passieren)
//diplomatiekarten müssen vom gegner bestätigt werd und kosten auch erst bei bestätigung etwas(für alle gleichviel?)
//questbelohnung: reveal & evtl mehr
//quests in nicht aufgedeckter karte haben höhreren level als in revealt
//keine quests in realm???
//input/output raster min 1/2 (freier oder eingeschränkter input)
//anfangspreis für beta7alpha bla 5$ endpreis 15$ (transparent machen!!!)
//oder 3€ bis 9€
//nicht tiles direkt angreifen!!(tiles als belohnung->je höher defense desto mehr kostet es tiles einzunehmen))
//besetztes gebiet vergrößert sich durch bauen (target + x tiles (bei outpost 7/3? fireplace 1))
//nur auf nicht besetzten gebieten können ereignisse ausgelöst werden
//mann sollte also keine löcher lassen
//realms sind bei beginn schon komplett ausgeteilt
//bestimmtes gebäude (stall?:) eröffnet diplomatie und die erste runde nachbarn(die auch diese gebäude haben)
//nullsec/lowsec/highsec
//if you get killed you are out of the game
//you can only get killed if your headquarters are taken

/*t1l.Game.prototype.quests = function (seat)
{
	var time = this.time - 1;
	var obj = {};
	obj.quests = this.realms[seat].quests[time];
	obj.results = this.realms[seat].results[time];
	return obj;
}*/

/*Game.prototype.tock = function ()
{
	if (this.running && this.slots[id])//wenn alle ticks da sind
	{
		//update game
		return true;
	}
}

Game.prototype.build = function (name, data)
{
	//verify consitency
	////if no build at that place und player darf da
	//raise updated-flag
	this.update.build.push(tile);
	//update game
	this.board[action.y][action.x].type = 7;
}

Game.prototype.reveal = function (name, x, y)
{
	util.add(this.realms[name].board, this.board[y][x], y, x);
}

Game.prototype.capture = function (name, x, y)
{
	this.board[y][x].realm = name;
}

Game.prototype.retreat = function (tile)
{
	delete this.board[y][x].realm;
}*/
