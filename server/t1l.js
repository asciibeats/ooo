var http = require('http');
var sockjs = require('sockjs');

//var NULL = 0;
//var OPEN = -1;
//var CLOSE = -2;

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

		socket.send = function ()
		{
			conn.write(JSON.stringify(Array.prototype.slice.call(arguments)));
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
		if (this.events[type].action)
		{
			var error = this.events[type].action.apply(socket, data);
		}

		if (error)
		{
			console.log('%d ERROR %d', socket.id, 123);
		}
		else
		{
			socket.state = type;
		}
	}
}
