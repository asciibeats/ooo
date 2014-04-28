var http = require('http');
var sockjs = require('sockjs');

//var NULL = 0;
//var OPEN = -1;
//var CLOSE = -2;
var TARGET = 0;
var PATH = 1;
var ORIGIN = 2;
var NMASK = [[[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]], [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]]];

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
			console.log('%d EXCEPTION %d', socket.id, e);
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

t1l.Player.prototype.toState = function ()
{
	return [Object.keys(this.chars), Object.keys(this.games), Object.keys(this.groups)];
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
	this.board = [];
	this.neigh = [];

	//generate random board
	for (var y = 0; y < this.size; y++)
	{
		this.board[y] = [];

		for (var x = 0; x < this.size; x++)
		{
			var tile = {};
			tile.x = x;
			tile.y = y;
			tile.type = Math.floor(Math.random() * 4) + 1;
			this.board[y][x] = tile;
		}
	}

	//build up neighbor connections
	for (var y = 0; y < this.size; y++)
	{
		var nmask = this.NMASK[y & 1];
		this.neigh[y] = [];

		for (var x = 0; x < this.size; x++)
		{
			var neigh = [];

			for (var i in nmask)
			{
				var nx = (x + nmask[i][0] + this.size) % this.size;
				var ny = (y + nmask[i][1] + this.size) % this.size;
				neigh[i] = this.board[ny][nx];
			}

			this.neigh[y][x] = neigh;
		}
	}
}

t1l.Game.prototype.NMASK = [[[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]], [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]]];

t1l.Game.prototype.toState = function ()
{
	return ['state'];
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

t1l.Game.prototype.start = function ()
{
	this.open = false;
	this.time = 1;
	this.stats = [];
	this.history = [];
	this.actions = [];
	var id = 0;

	for (var name in this.seats)
	{
		this.stats[id] = {};
		this.seats[name] = id;
		var x = 0;
		var y = 0;
		this.history[0][y][x].push([id, TARGET, 0]);
		id++;
	}
}

t1l.Game.prototype.update = function (x, y, action)
{
	if (!this.history[this.time])
	{
		this.history[this.time] = {};
	}

	var history = this.history[this.time];

	if (!history[y])
	{
		history[y] = {};
	}

	if (!history[y][x])
	{
		history[y][x] = [];
	}

	history[y][x].push(action);
}

t1l.Game.prototype.tick = function (name, actions)
{
	if (!this.time)
	{
		throw 888;
	}

	var seat = this.seats[name];

	if (seat == undefined)
	{
		throw 543;
	}

	for (var i in actions)
	{
		//[x,y,path[],[type, args[]]]
		var x = actions[i][0];
		var y = actions[i][1];
		var path = actions[i][2];
		var id = this.actions.length;
		this.actions.push(actions[i][3]);

		var last = path.length - 1;
		var nmask = this.NMASK[y & 1];

		this.update(x, y, [seat, type, TARGET, path[0]]);

		for (var j in path)
		{
			var step = path[j];
			x = (x + nmask[step][0] + this.size) % this.size;
			y = (y + nmask[step][1] + this.size) % this.size;

			if (j == last)
			{
				this.update(x, y, [seat, type, ORIGIN, (step + 3) % 6]);
			}
			else
			{
				this.update(x, y, [seat, type, PATH, step, (step + 3) % 6]);
			}
		}
	}

	this.stats[seat].time++;
}

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
