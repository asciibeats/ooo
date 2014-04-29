oO = {};

//PIXMAN
(function ()
{
	function extend (func)
	{
		var That = this;

		var Child = function ()
		{
			That.call(this);//apply parents constructor
			func.apply(this, arguments);//apply constructor function
		}

		Child.prototype = new That();
		Child.prototype.constructor = Child;

		Child.prototype.super = function (name, args)
		{
			That.prototype[name].apply(this, args);
		}

		Child.extend = extend;
		Child.method = method;
		return Child;
	}

	function method (name, func)
	{
		this.prototype[name] = func;
	}

	oO.Actor = function ()
	{
		this.rel_x = 0;
		this.rel_y = 0;
		this.mid_x = 0;
		this.mid_y = 0;
		this.layer = 0;
		this.width = 100;
		this.height = 100;
		this.alpha = 1;
		this.angle = 0;
		//this.state = 0;
	}

	oO.Actor.extend = extend;
	oO.Actor.method = method;

	oO.Actor.method('resize', function (width, height)
	{
		this.width = width;
		this.height = height;
	});

	oO.Actor.method('hide', function ()
	{
		if (!this.parent)
		{
			throw 3456;
		}

		var layer = this.parent.children[this.layer];
		delete layer[this.id];

		if (!oO.size(layer))
		{
			delete this.parent.children[this.layer];
		}

		delete this.id;
		delete this.parent;
	});
	
	oO.Actor.method('on', function (type, expect, action)
	{
		this.events[type] = {};
		this.events[type].action = action;
		this.events[type].expect = {};

		for (var i in expect)
		{
			this.events[type].expect[expect[i]] = true;
		}
	});

	oO.Actor.method('trigger', function (type, data)
	{
		if (this.events[type] && ((type < 0) || this.events[this.state].expect[type]))
		{
			try
			{
				if (this.events[type].action)
				{
					this.events[type].action.apply(this, data);
				}

				this.state = type;
			}
			catch (e)
			{
				console.log('EXCEPTION %d', e);
			}
		}
	});

	//Simple square for testing
	oO.Box = oO.Actor.extend(function (color)
	{
		this.color = color;
	});

	oO.Box.method('draw', function (elapsed, context)
	{
		context.fillStyle = this.color;
		context.fillRect(0, 0, this.width, this.height);
	});

	//Actor with image
	oO.Sprite = oO.Actor.extend(function (image, img_x, img_y, width, height)
	{
		this.image = image;
		this.img_x = img_x || 100;
		this.img_y = img_y || 100;
		this.width = width || 100;
		this.height = height || 100;
	});

	oO.Sprite.method('draw', function (elapsed, context)
	{
		context.drawImage(this.image, this.img_x, this.img_y, this.width, this.height, 0, 0, this.width, this.height);
	});

	//Container for actors
	oO.Scene = oO.Actor.extend(function ()
	{
		this.children = {};
	});

	oO.Scene.method('show', function (actor)
	{
		if (!actor.draw)
		{
			throw 999;
		}

		if (actor.parent)
		{
			actor.hide();
		}

		if (!this.children[actor.layer])
		{
			this.children[actor.layer] = {};
		}

		actor.id = oO.fill(this.children[actor.layer], actor);
		actor.parent = this;
	});

	oO.Scene.method('draw', function (elapsed, context)
	{
		oO.each2d(this.children, function (actor)
		{
			context.save();
			context.globalAlpha = actor.alpha;
			context.translate(actor.rel_x, actor.rel_y);
			context.rotate(actor.angle);
			context.translate(-actor.mid_x, -actor.mid_y);

			actor.draw(elapsed, context);

			context.restore();
		});
	});

	//Scene with own canvas
	oO.Stage = oO.Scene.extend(function ()
	{
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		this.update = true;
		this.once = false;
	});

	oO.Stage.method('resize', function (width, height)
	{
		this.width = this.canvas.width = width;
		this.height = this.canvas.height = height;
	});

	oO.Stage.method('draw', function (elapsed, context)
	{
		if (this.update || this.once)
		{
			oO.Scene.prototype.draw.call(this, elapsed, this.context);
			//this.super('draw', [elapsed, this.context]);
			this.once = false;
		}

		if (context)
		{
			context.drawImage(this.canvas, 0, 0);
		}
	});

	oO.Stage.method('clear', function ()
	{
		//just one method to clear the canvas (there are others)
		this.canvas.width = this.canvas.width;
	});

	oO.Pixman = oO.Stage.extend(function (hook, color, width, height)
	{
		this.hook = hook;
		this.resize(width || hook.clientWidth, height || hook.clientHeight);
		this.context.fillStyle = color || '#00ff00';
		this.context.fillRect(0, 0, this.width, this.height);
		hook.appendChild(this.canvas);
	});

	oO.Pixman.method('open', function (images)
	{
		this.images = images || [];

		//window.addEventListener('mousedown', on_down);
		//window.addEventListener('mouseup', on_up);
		//window.addEventListener('mouseout', on_out);
		//window.addEventListener('resize', on_resize);
		//_root.canvas.addEventListener('click', on_click);

		var that = this;
		var elapsed = 0;
		var last = 0;

		function loop (time)
		{
			that.request_id = request(loop);
			elapsed = last ? (time - last) : 0;
			last = time;
			that.draw(elapsed);
		}

		var request = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
		this.request_id = request(loop);
	});

	oO.Pixman.method('close', function ()
	{
		var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame;
		cancel(this.request_id);

		//window.addEventListener('mousedown', on_down);
		//window.addEventListener('mouseup', on_up);
		//window.addEventListener('mouseout', on_out);
		//window.addEventListener('resize', on_resize);
		//_root.canvas.addEventListener('click', on_click);
	});
})();

//SOCKMAN
(function ()
{
	//var NULL = 0;
	//var OPEN = -1;
	//var CLOSE = -2;

	oO.Sockman = function ()
	{
		this.state = 0;
		this.events = {};
		this.sockjs = null;
	}

	oO.Sockman.prototype.connect = function (url)
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

	oO.Sockman.prototype.send = function (message)
	{
		this.sockjs.send(JSON.stringify(message));
	}

	/*oO.Sockman.prototype.pack = function ()
	{
		var args = Array.prototype.slice.call(arguments);
		var that = this;

		return function ()
		{
			that.send(args.concat(Array.prototype.slice.call(arguments)));
		}
	}*/

	oO.Sockman.prototype.on = function (type, expect, action)
	{
		this.events[type] = {};
		this.events[type].action = action;
		this.events[type].expect = {};

		for (var i in expect)
		{
			this.events[type].expect[expect[i]] = true;
		}
	}

	oO.Sockman.prototype.trigger = function (type, data)
	{
		if (this.events[type] && ((type < 0) || this.events[this.state].expect[type]))
		{
			try
			{
				if (this.events[type].action)
				{
					this.events[type].action.apply(this, data);
				}

				this.state = type;
			}
			catch (e)
			{
				console.log('EXCEPTION %d', e);
			}
		}
	}
})();

oO.fill = function (object, value)
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

oO.size = function (object)
{
	return Object.keys(object).length;
}

oO.each2d = function (object, func, context)
{
	for (var key in object)
	{
		var child = object[key];

		for (var key in child)
		{
			func.call(context, child[key]);
		}
	}
}
