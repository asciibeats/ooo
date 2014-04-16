t1l = {};

//var NULL = 0;
//var OPEN = -1;
//var CLOSE = -2;

t1l.Sockman = function ()
{
	this.state = 0;
	this.events = {};
	this.sockjs = null;
}

t1l.Sockman.prototype.connect = function (url)
{
	this.sockjs = new SockJS(url);
	var that = this;

	this.sockjs.onopen = function ()
	{
		that.trigger(-1);
	}

	this.sockjs.onmessage = function (msg)
	{
		var data = JSON.parse(msg.data);

		if (!Array.isArray(data))
		{
			console.log('ERROR %d', 666);
			return;
		}

		var type = data.shift();

		if (type > 0)
		{
			that.trigger(type, data);
		}
		else
		{
			console.log('ERROR %d', 345);
		}
	}

	this.sockjs.onclose = function (msg)
	{
		that.trigger(-2, [msg.code]);
	}
}

t1l.Sockman.prototype.onOpen = function (action)
{
	this.onopen = action;
}

t1l.Sockman.prototype.onClose = function (action)
{
	this.onclose = action;
}

t1l.Sockman.prototype.send = function ()
{
	this.sockjs.send(JSON.stringify(Array.prototype.slice.call(arguments)));
}

t1l.Sockman.prototype.pack = function ()
{
	var args = Array.prototype.slice.call(arguments);
	var that = this;

	return function ()
	{
		that.sockjs.send(JSON.stringify(args.concat(Array.prototype.slice.call(arguments))));
	}
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

t1l.Sockman.prototype.trigger = function (type, data)
{
	if (this.events[type] && ((type < 0) || this.events[this.state].expect[type]))
	{
		if (this.events[type].action)
		{
			var error = this.events[type].action.apply(this, data);
		}

		if (error)
		{
			console.log('ERROR %d', 123);
		}
		else
		{
			this.state = type;
		}
	}
}
