var ooo = {};
module.exports = ooo;

var http = require('http');
var sockjs = require('sockjs');

ooo.Wrap = function (Func, argv)
{
    return Func.bind.apply(Func, [Func].concat(argv));
}

ooo.map = function (keys, values)
{
	var object = {};

	for (var i = 0; i < keys.length; i++)
	{
		object[keys[i]] = values[i];
	}

	return object;
}

ooo.merge = function (keep, add)
{
	for (var key in add)
	{
		var value = add[key];

		if (keep[key] && (typeof value == 'object'))
		{
			ooo.merge(keep[key], value);
		}
		else
		{
			keep[key] = value;
		}
	}
}

ooo.clone = function (object)
{
	var clone = {};

	for (var key in object)
	{
		clone[key] = object[key];
	}

	return clone;
}

ooo.indices = function (object)
{
	var keys = [];

	for (var key in object)
	{
		keys.push(parseInt(key));
	}

	return keys;
}

ooo.sorted_index = function (open, tile, prop)
{
	var low = 0;
	var high = open.length;

	while (low < high)
	{
		var mid = (low + high) >>> 1;

		if (tile[prop] > open[mid][prop])
		{
			high = mid;
		}
		else
		{
			low = mid + 1;
		}
	}

	return low;
}

ooo.size = function (object)
{
	return Object.keys(object).length;
}

ooo.fill = function (object, value)
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

function inherit (Child, Parent)
{
	Child.prototype = Object.create(Parent.prototype);
	Child.prototype.constructor = Child;

	for (var name in Parent)
	{
		if (Parent.hasOwnProperty(name))
		{
			Child[name] = Parent[name];
		}
	}

	if (Parent.prototype.events)
	{
		var events = {};

		for (var type in Parent.prototype.events)
		{
			events[type] = Parent.prototype.events[type];
		}

		Child.prototype.events = events;
	}
}

ooo.Class = function ()
{
}

ooo.Class.clone = function ()
{
	var argv = arguments;
	var Parent = this;

	var Child = function ()
	{
		Parent.apply(this, argv);
	}

	inherit(Child, Parent);
	return Child;
}

ooo.Class.extend = function (func)
{
	var Parent = this;

	var Child = function ()
	{
		func.apply(this, arguments);
	}

	inherit(Child, Parent);
	return Child;
}

ooo.Class.on = function (type, func)
{
	if (!this.prototype.events)
	{
		this.prototype.events = {};
	}

	this.prototype.events[type] = func;
}

ooo.Class.method = function (name, func)
{
	this.prototype[name] = func;
}

ooo.Class.method('attach', function (child)
{
	//this.children.push(child);
});

ooo.Class.method('detach', function (child)
{
});

ooo.Class.method('trigger', function (type, argv)
{
	if (this.events && this.events[type])
	{
		try
		{
			this.events[type].apply(this, argv);
		}
		catch (e)
		{
			console.log('EXCEPTION %s', e.toString());

			if (e.stack)
			{
				console.log(e.stack);
			}
		}
	}
	else
	{
		console.log('NOTYPE: ' + type);
	}
});

var SQR_NMASK = [[0, -1], [1, 0], [0, 1], [-1, 0]];
var HEX_NMASK = [[[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]], [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]]];

ooo.TileMap = ooo.Class.extend(function (size)
{
	ooo.Class.call(this);
	this.size = size;
	this.tiles = [];
	this.index = [];

	//create tiles
	for (var y = 0, i = 0; y < size; y++)
	{
		this.tiles[y] = [];

		for (var x = 0; x < size; x++, i++)
		{
			var tile = {};
			tile.map = this;
			tile.i = i;
			tile.x = x;
			tile.y = y;
			tile.data = new this.Data(this, i, x, y);
			this.tiles[y][x] = tile;
			this.index[i] = tile;
		}
	}

	//connect neighbors
	for (var y = 0; y < size; y++)
	{
		for (var x = 0; x < size; x++)
		{
			var steps = [];

			for (var i in SQR_NMASK)
			{
				var nx = (x + SQR_NMASK[i][0] + size) % size;
				var ny = (y + SQR_NMASK[i][1] + size) % size;
				steps[i] = this.tiles[ny][nx];
			}

			this.tiles[y][x].steps = steps;
		}
	}
});

ooo.TileMap.method('Data', function (i, x, y)
{
	this.type = 0;
});

ooo.TileMap.method('costs', function (data)
{
	return 1;
});

ooo.TileMap.method('distance', function (a, b)
{
	//todo wrapping distances (left/right/top/mid/bottom) (see hexmap)
	throw 'TileMap distance calculation not implemented yet!!!';
	return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
});

ooo.TileMap.method('findArea', function (origin, range, costs)
{
	if (!costs)
	{
		costs = this.costs;
	}

	var done = [];
	var open = [origin];
	origin.g = 0;

	do
	{
		var current = open.pop();
		done[current.i] = current.g;//muss das evtl geupdated werden falls billiger geht?

		for (var i = 0; i < current.steps.length; i++)
		{
			var next = current.steps[i];

			if (next.i in done)
			{
				continue;
			}

			var next_c = costs(next.data);

			if (next_c == undefined)
			{
				continue;
			}

			var next_g = current.g + next_c;

			if (next_g > range)
			{
				continue;
			}

			var tile = null;

			for (var j in open)
			{
				if (open[j] == next)
				{
					tile = next;
					break;
				}
			}

			if (tile == null)
			{
				next.g = next_g;
				open.splice(ooo.sorted_index(open, next, 'g'), 0, next);
				continue;
			}

			if (next_g < tile.g)
			{
				tile.g = next_g;
			}
		}
	}
	while (open.length)

	return done;
});

ooo.TileMap.method('findPath', function (origin, target, costs)
{
	if (!costs)
	{
		costs = this.costs;
	}

	var done = [];
	var crumbs = [];
	var open = [origin];
	origin.g = 0;
	origin.f = this.distance(origin, target);

	do
	{
		var current = open.pop();
		done[current.i] = current.g;//muss das evtl geupdated werden falls billiger geht?

		for (var i = 0; i < current.steps.length; i++)
		{
			var next = current.steps[i];

			if (next.i in done)
			{
				continue;
			}

			var next_c = costs(next.data);

			if (next_c == undefined)
			{
				continue;
			}

			var next_g = current.g + next_c;

			if (next == target)
			{
				var tiles = [next.i];
				var steps = [i];

				while (current != origin)
				{
					tiles.push(current.i);
					steps.push(crumbs[current.i][0]);
					current = crumbs[current.i][1];
				}

				//rückgabewert prüfen/kann ich hier was mit done[] machen?
				return {tiles: tiles.reverse(), steps: steps.reverse(), cost: next_g};
			}

			var tile = null;

			for (var j in open)
			{
				if (open[j] == next)
				{
					tile = next;
					break;
				}
			}

			if (tile == null)
			{
				next.g = next_g;
				next.f = next_g + this.distance(next, target);
				open.splice(ooo.sorted_index(open, next, 'f'), 0, next);
				crumbs[next.i] = [i, current];
				continue;
			}

			if (next_g < tile.g)
			{
				tile.g = next_g;
				tile.f = next_g + this.distance(tile, target);
				crumbs[tile.i] = [i, current];
			}
		}
	}
	while (open.length)
});

ooo.Client = ooo.Class.extend(function (server, socket)
{
	this.server = server;
	this.socket = socket;
	this.expected = {};
});

ooo.Client.method('trigger', function (type, argv)
{
	if (this.events && this.events[type])
	{
		try
		{
			this.events[type].apply(this, argv);
		}
		catch (e)
		{
			this.close(e.toString());
			console.log('EXCEPTION %s', e.toString());

			if (e.stack)
			{
				console.log(e.stack);
			}
		}
	}
	else
	{
		console.log('NOTYPE: ' + type);
	}
});

ooo.Client.method('send', function (type, data)
{
	var message = JSON.stringify(Array.prototype.slice.call(arguments));
	this.socket.write(message);
});

ooo.Client.method('close', function (code)
{
	this.socket.close(code);
});

ooo.Client.method('expect', function ()
{
	for (var i in arguments)
	{
		this.expected[arguments[i]] = true;
	}
});

ooo.Server = ooo.Class.extend(function (Client, port)
{
	console.log('OPEN %d', port);
	this.http = http.createServer();
	this.http.listen(port);//, '0.0.0.0'
	this.sockjs = sockjs.createServer({'log': function (type, message) { if (type != 'info') { console.log(type, message) }}});
	this.sockjs.installHandlers(this.http);//, {prefix: '/player'}
	this.clients = {};
	var that = this;

	this.sockjs.on('connection', function (socket)
	{
		var client = new Client(that, socket);
		client.id = ooo.fill(that.clients, client);
		//client.trigger('socket:open');

		socket.on('data', function (string)
		{
			var data = JSON.parse(string);

			if (!Array.isArray(data) || !Array.isArray(data[1]))
			{
				client.close('bad message');
				return;
			}

			var type = data[0];

			if (!client.expected[type])
			{
				client.close('unexpected message');
				return;
			}

			client.expected = {};
			client.trigger('message:' + type, data[1]);
		});

		socket.on('close', function ()
		{
			delete that.clients[client.id];
			client.trigger('socket:close');
		});
	});
});

ooo.Server.method('broadcast', function (type, data)
{
	for (var id in this.clients)
	{
		var client = this.clients[id];
		client.send(type, data);
	}
});
