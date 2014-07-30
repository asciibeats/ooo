oO = {};
module.exports = oO;

var http = require('http');
var sockjs = require('sockjs');

//HELPER
function Wrap (Func, argv)
{
    return Func.bind.apply(Func, [Func].concat(argv));
}

function fill (object, value)
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

var Class = function ()
{
}

Class.method = function (name, func)
{
	this.prototype[name] = func;
}

Class.on = function (type, func)
{
	if (!this.prototype.events)
	{
		this.prototype.events = {};
	}

	this.prototype.events[type] = func;
}

Class.extend = function (func)
{
	var Parent = this;

	var Child = function ()
	{
		func.apply(this, arguments);
	}

	Child.prototype = Object.create(Parent.prototype);
	Child.prototype.constructor = Child;

	var names = Object.keys(Parent);

	for (var i = 0; i < names.length; i++)
	{
		var name = names[i];
		Child[name] = Parent[name];
	}

	return Child;
}

var Player = Class.extend(function (name, pass)
{
	this.name = name;
	this.pass = pass;
	this.expected = {};
	//this.game = null;
	this.groups = [];
	this.banned = [];//if you host a game, these players wont be allowed to join
	this.inbox = [];
});

Player.method('expect', function ()
{
	this.expected = {};

	for (var i in arguments)
	{
		this.expected[arguments[i]] = true;
	}
});

Player.method('send', function (data, keep)
{
	if (this.socket)
	{
		this.socket.write(JSON.stringify(data));
	}
	else if (keep)
	{
		this.inbox.push(data);
	}
});

oO.Game = Class.extend(function (size)
{
	this.rules = Array.prototype.slice.call(arguments);
	this.size = size;
	this.free = size;
	this.time = 0;
	this.ticks = 0;
	this.open = true;//temp->false
	this.started = false;
	//this.invited = {};
	//this.banned = {};
	//this.admins = {};
	this.world = [];//common data
	this.realms = [];//per player data
	this.players = {};
	this.seats = {};
});

oO.Game.method('send', function (data, keep)
{
	for (var name in this.players)
	{
		var player = this.players[name];
		player.send.apply(player, arguments);
	}
});

oO.Game.method('others', function (skip, data, keep)
{
	for (var name in this.players)
	{
		if (name != skip)
		{
			var player = this.players[name];
			player.send.call(player, data, keep);
		}
	}
});

oO.Game.method('list', function ()
{
	return Object.keys(this.players);
});

oO.Game.method('start', function ()
{
	console.log('START %d', this.id);
});

oO.Game.method('tock', function ()
{
	console.log('TOCK %d', this.id);
});

oO.Game.on('join', function (player)
{
	if (!player.game && this.open && this.free)
	{
		console.log('JOIN %d %s', this.id, player.name);
		this.send(['join', player.name]);
		this.players[player.name] = player;
		this.free--;
		player.game = this;
		player.send(['lobby', this.rules, this.list()]);
		player.expect('leave');

		if (!this.free)
		{
			console.log('READY %d %d', this.id, this.room.count);
			this.send(['ready', this.room.count]);
			var that = this;

			this.timeout = setTimeout(function ()
			{
				console.log('START %d', that.id);
				delete that.timeout;
				that.open = false;
				that.started = true;
				var seat = 0;

				for (var name in that.players)
				{
					that.realms[seat] = [];
					that.seats[name] = seat++;
				}

				that.start();

				for (var name in that.players)
				{
					player = that.players[name];
					var seat = that.seats[name];
					var realm = that.realms[seat];
					player.send(['start', that.time, that.world, seat, realm]);
					player.expect('tick');
				}
			}, this.room.count * 1000);
		}
	}
	else
	{
		throw 234;
	}
});

oO.Game.on('leave', function (player)
{
	if ((player.game == this) && !this.started)
	{
		delete this.players[player.name];
		delete player.game;
		this.free++;
		player.expect('host', 'join');

		if (this.timeout)
		{
			clearTimeout(this.timeout);
			delete this.timeout;
		}

		if (this.free < this.size)
		{
			console.log('LEAVE %d %s', this.id, player.name);
			this.send(['leave', player.name]);
		}
		else
		{
			console.log('CANCEL %d %s', this.id, player.name);
			delete this.room.games[this.id];
		}
	}
	else
	{
		throw 2346523;
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

oO.Game.on('tick', function (player, data)
{
	console.log('TICK %d %s', this.id, player.name);
	var seat = this.seats[player.name];

	if (!seat)
	{
		throw 543;
	}

	var realm = this.realms[seat];

	if (realm[this.time])
	{
		throw 4444;
	}

	this.tick.apply(this, data);
	player.expect();
	realm[this.time] = template(this.size);
	realm[this.time][seat] = data;
	this.ticks++;

	if (this.ticks < this.size)
	{
		return;
	}

	console.log('TOCK %d', this.id);
	this.time++;
	this.ticks = 0;
	this.tock();
	this.send(['tock']);

	for (var name in this.players)
	{
		this.players[name].expect('tick');
	}
});

oO.Room = function (Game, port, count, delay)
{
	console.log('OPEN %d', port);
	this.Game = Game;
	this.count = count || 10;
	this.delay = delay || 3;
	this.players = {};
	this.games = {};
	this.http = http.createServer();
	this.http.listen(port || 11133);//, '0.0.0.0'
	this.sockjs = sockjs.createServer();
	this.sockjs.installHandlers(this.http);//, {prefix: '/player'}
	var that = this;

	this.sockjs.on('connection', function (socket)
	{
		var player;

		socket.on('data', function (string)
		{
			try
			{
				var data = JSON.parse(string);

				if (!Array.isArray(data))
				{
					throw 966;
				}

				var type = data.shift();

				if (!player)
				{
					if (type != 'auth')
					{
						throw 666;
					}

					var name = data.shift();
					var pass = data.shift();
					var user = that.players[name];

					if (user && !user.socket && (user.pass === pass))
					{
						player = user;
						player.socket = socket;

						if (player.game)
						{
							var game = player.game;
							console.log('BACK %d %s', game.id, name);
							game.others(name, ['back', name]);
							var names = game.list();
							var seat = game.seats[name];
							var realm = game.realms[seat];
							player.send(['continue', game.rules, names, game.time, game.world, seat, realm]);
							player.expect('tick');
						}
						else
						{
							console.log('GRANT %s', name);
							var list = Object.keys(that.games);
							player.send(['browse', list]);
							player.expect('host', 'join');
						}
					}
					else
					{
						console.log('DENY %s', name);
						//blockieren bis timeout (aber vorsicht: irgend ein idiot könnte damit fremde accounts blocken)
						setTimeout(function () { socket.write(JSON.stringify(['deny'])) }, that.delay * 1000);
					}
				}
				else if (player.expected[type])
				{
					if (that.events[type])
					{
						that.events[type].call(that, player, data);
						return;
					}

					var id = data.shift();
					var game = that.games[id];

					if (!game)
					{
						throw 12415;
					}

					if (game.events[type])
					{
						game.events[type].call(game, player, data);
					}
					else
					{
						throw 81231;
					}
				}
				else
				{
					throw 235261;
				}
			}
			catch (e)
			{
				socket.close(e);
				console.log('EXCEPTION %s %s', e.toString(), e.stack);
			}
		});

		socket.on('close', function ()
		{
			if (player)//player is logged in
			{
				console.log('LOGOUT %s', player.name);
				delete player.socket;
				var game = player.game;

				if (game)
				{
					if (game.started)
					{
						console.log('AWAY %d %s', game.id, player.name);
						game.others(player.name, ['away', player.name]);
					}
					else
					{
						game.events.leave.call(game, player);
					}
				}

				for (var name in player.friends)
				{
					//send offline notification
				}
			}
		});
	});
}

oO.Room.method = function (name, func)
{
	this.prototype[name] = func;
}

oO.Room.extend = function (func)
{
	var Parent = this;

	var Child = function ()
	{
		func.apply(this, arguments);
	}

	Child.prototype = Object.create(Parent.prototype);
	Child.prototype.constructor = Child;

	if (Parent.prototype.events)
	{
		var events = {};

		for (var type in Parent.prototype.events)
		{
			events[type] = Parent.prototype.events[type];
		}

		Child.prototype.events = events;
	}

	var names = Object.keys(Parent);

	for (var i = 0; i < names.length; i++)
	{
		var name = names[i];
		Child[name] = Parent[name];
	}

	return Child;
}

oO.Room.receive = function (type, func)
{
	if (!this.prototype.events)
	{
		this.prototype.events = {};
	}

	this.prototype.events[type] = func;
}

oO.Room.method('allow', function (name, pass)
{
	if (this.players[name])
	{
		throw 678;
	}

	console.log('REGISTER %s', name);
	this.players[name] = new Player(name, pass);
});

oO.Room.method('send', function (data, keep)
{
	for (var name in this.players)
	{
		var player = this.players[name];
		player.send.apply(player, arguments);
	}
});

oO.Room.receive('host', function (player, data)
{
	var game = new (Wrap(this.Game, data))();
	game.id = fill(this.games, game);
	game.room = this;
	console.log('HOST %d %s', game.id, player.name);
	game.events.join.call(game, player);
});
