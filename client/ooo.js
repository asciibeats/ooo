'use strict';
var ooo = {};

//svg parser!!!!!!! ooo.Vector ooo.SVG ??
//aufräumen!!!
//events: type:name e.g. canvas:frame, mouse:down
//layout/positionsangaben angle etc vereinheitlichen
//refact helper functions (e.g. fill -> ooo.fill)
//keyboard input eingrenzen (keyset = {})

(function ()
{
	ooo.map = function (keys, values)
	{
		var object = {};

		for (var i = 0; i < keys.length; i++)
		{
			object[keys[i]] = values[i];
		}

		return object;
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

	ooo.wrap = function (index, size)
	{
		return ((index % size) + size) % size;
	}

	ooo.size = function (object)
	{
		return Object.keys(object).length;
	}

	ooo.matrix = function (width, height, value)
	{
		var array = [];

		for (var y = 0; y < height; y++)
		{
			array[y] = [];

			for (var x = 0; x < width; x++)
			{
				array[y][x] = value;
			}
		}

		return array;
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

	ooo.preload = function (assets, callback)
	{
		var images = {};
		var toload = ooo.size(assets);
		var loaded = 0;

		for (var name in assets)
		{
			images[name] = new Image();

			images[name].onload = function()
			{
				loaded++;

				if (loaded == toload)
				{
					callback(images);
				}
			}

			images[name].src = assets[name];
		}
	}

	ooo.setLocal = function (name, object)
	{
		localStorage[name] = JSON.stringify(object);
	}

	ooo.getLocal = function (name)
	{
		if (localStorage[name])
		{
			return JSON.parse(localStorage[name]);
		}
		/*else
		{
			localStorage[name] = JSON.stringify({});
		}*/
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

	function indices (object)//use with sparse arr: i < length
	{
		var keys = [];

		for (var key in object)
		{
			keys.push(parseInt(key));
		}

		return keys;
	}

	/*function Wrap (Func, argv)
	{
		return Func.bind.apply(Func, [Func].concat(argv));
	}*/

	function addEvent (channel)
	{
		return function (type, func)
		{
			if (!this.prototype.events)
			{
				this.prototype.events = {};
			}

			if (!this.prototype.events[channel])
			{
				this.prototype.events[channel] = {};
			}

			this.prototype.events[channel][type] = func;
		}
	}

	function triggerActor (actor, child, channel, type, argv)
	{
		if (actor.events && actor.events[channel] && actor.events[channel][type])
		{
			try
			{
				return actor.events[channel][type].apply(child, argv);
			}
			catch (e)
			{
				console.log('EXCEPTION %s', type);
				console.log(e.toString());
				console.log(e.stack);
			}
		}
	}

	function triggerLayer (actor, layer, type, argv)
	{
		for (var id in layer)
		{
			var child = layer[id];
			var retv = triggerActor(actor, child, 'prepare', type, argv);

			if (retv != false)
			{
				if (retv == null)
				{
					retv = argv;
				}

				if (child.trigger(type, retv) == false)
				{
					return false;
				}
			}

			triggerActor(actor, child, 'cleanup', type, argv);
		}
	}

	function showActor (scene, actor, layer)
	{
		if (actor.id != undefined)
		{
			actor.hide();
		}

		if (layer == null)
		{
			layer = 0;
		}

		if (!scene.children[layer])
		{
			scene.children[layer] = {};
			//insert + sort could potentially be optimized
			scene.layers.push(layer);
			scene.layers.sort(ascend);
		}

		actor.id = ooo.fill(scene.children[layer], actor);
		actor.layer = layer;
		actor.parent = scene;
	}

	function ascend (a, b)
	{
		return a - b;
	}

	function sorted_index (open, tile, prop)
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

	ooo.Actor = function ()
	{
		this.rel_x = 0;
		this.rel_y = 0;
		this.mid_x = 0;
		this.mid_y = 0;
		this.width = 0;
		this.height = 0;
		this.alpha = 1;
		this.angle = 0;
	}

	ooo.Actor.on = addEvent('on');

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

			for (var channel in Parent.prototype.events)
			{
				events[channel] = {};

				for (var type in Parent.prototype.events[channel])
				{
					events[channel][type] = Parent.prototype.events[channel][type];
				}
			}

			Child.prototype.events = events;
		}
	}

	ooo.Actor.clone = function ()
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

	ooo.Actor.extend = function (func)
	{
		var Parent = this;

		var Child = function ()
		{
			func.apply(this, arguments);
		}

		inherit(Child, Parent);
		return Child;
	}

	ooo.Actor.method = function (name, func)
	{
		this.prototype[name] = func;
	}

	ooo.Actor.method('on', function (type, func)
	{
		var channel = 'on';

		if (!this.events)
		{
			this.events = {};
		}

		if (!this.events[channel])
		{
			this.events[channel] = {};
		}

		this.events[channel][type] = func;
		return this;
	});

	ooo.Actor.method('off', function (type)
	{
		var channel = 'on';

		if (!this.events || !this.events[channel])
		{
			return;
		}

		delete this.events[channel][type];
		return this;
	});

	ooo.Actor.method('place', function (rel_x, rel_y)
	{
		this.rel_x = rel_x;
		this.rel_y = rel_y;
		return this;
	});

	ooo.Actor.method('resize', function (width, height)
	{
		this.width = width;
		this.height = height;
		return this;
	});

	ooo.Actor.method('rotate', function (angle)
	{
		this.angle = angle / 180 * Math.PI;
		return this;
	});

	ooo.Actor.method('center', function (mid_x, mid_y)
	{
		this.mid_x = mid_x;
		this.mid_y = mid_y;
		return this;
	});

	ooo.Actor.method('trigger', function (type, argv)
	{
		return triggerActor(this, this, 'on', type, argv);
	});

	ooo.Actor.method('hide', function ()
	{
		if (this.id == undefined)
		{
			return;
		}

		var layer = this.parent.children[this.layer];
		delete layer[this.id];

		if (ooo.size(layer) == 0)
		{
			delete this.parent.children[this.layer];
			var layers = this.parent.layers;
			layers.splice(layers.indexOf(this.layer), 1);
		}

		delete this.id;
		delete this.layer;
		delete this.parent;
		delete this.root;
	});

	ooo.Actor.on('show', function (root, parent)
	{
		this.root = root;
	});

	//Actor with image
	ooo.Sprite = ooo.Actor.extend(function (image, width, height, img_x, img_y)
	{
		ooo.Actor.call(this);
		this.image = image;
		this.width = width || image.width;
		this.height = height || image.height;
		this.img_x = img_x || 0;
		this.img_y = img_y || 0;
	});

	ooo.Sprite.on('draw', function (time, context)
	{
		context.drawImage(this.image, this.img_x, this.img_y, this.width, this.height, 0, 0, this.width, this.height);
	});

	//Automatically size-adjusting Actor
	ooo.Cell = ooo.Actor.extend(function (layout)
	{
		ooo.Actor.call(this);
		this.layout = layout || {'left': 0, 'right': 0, 'top': 0, 'bottom': 0};
	});

	ooo.Cell.method('arrange', function (layout)
	{
		this.layout = layout;
		return this;
	});

	ooo.Cell.on('resize', function (width, height)
	{
		if (this.layout.width != undefined)
		{
			if (this.layout.left != undefined)
			{
				var rel_x = this.layout.left;
			}
			else if (this.layout.right != undefined)
			{
				var rel_x = width - this.layout.width - this.layout.right;
			}
			else
			{
				var rel_x = (width - this.layout.width) >> 1;
			}

			width = this.layout.width;
		}
		else if (this.layout.left != undefined)
		{
			var rel_x = this.layout.left;

			if (this.layout.right != undefined)
			{
				width -= rel_x + this.layout.right;
			}
			else
			{
				width -= rel_x;
			}
		}
		else if (this.layout.right != undefined)
		{
			var rel_x = 0;
			width -= this.layout.right;
		}
		else
		{
			var rel_x = 0;
		}

		if (this.layout.height != undefined)
		{
			if (this.layout.top != undefined)
			{
				var rel_y = this.layout.top;
			}
			else if (this.layout.bottom != undefined)
			{
				var rel_y = height - this.layout.height - this.layout.bottom;
			}
			else
			{
				var rel_y = (height - this.layout.height) >> 1;
			}

			height = this.layout.height;
		}
		else if (this.layout.top != undefined)
		{
			var rel_y = this.layout.top;

			if (this.layout.bottom != undefined)
			{
				height -= rel_y + this.layout.bottom;
			}
			else
			{
				height -= rel_y;
			}
		}
		else if (this.layout.bottom != undefined)
		{
			var rel_y = 0;
			height -= this.layout.bottom;
		}
		else
		{
			var rel_y = 0;
		}

		this.place(rel_x, rel_y).resize(width, height);
	});

	//Simple colored Box for testing
	ooo.Box = ooo.Cell.extend(function (color, layout)
	{
		ooo.Cell.call(this, layout);
		this.color = color;
	});

	ooo.Box.on('draw', function (time, context)
	{
		context.fillStyle = this.color;
		context.fillRect(0, 0, this.width, this.height);
	});

	//Container for actors
	ooo.Scene = ooo.Cell.extend(function (layout)
	{
		ooo.Cell.call(this, layout);
		this.scale_x = 1;
		this.scale_y = 1;
		this.children = [];
		this.layers = [];
	});

	ooo.Scene.prepare = addEvent('prepare');
	ooo.Scene.cleanup = addEvent('cleanup');
	ooo.Scene.bubble = addEvent('bubble');

	ooo.Scene.method('bubble', function (type, func)//temp
	{
		var channel = 'bubble';

		if (!this.events)
		{
			this.events = {};
		}

		if (!this.events[channel])
		{
			this.events[channel] = {};
		}

		this.events[channel][type] = func;
		return this;
	});

	ooo.Scene.method('hideChildren', function ()
	{
		this.children = [];
		this.layers = [];
		return this;
	});

	ooo.Scene.method('show', function (actor, layer)
	{
		showActor(this, actor, layer);
		actor.trigger('resize', [this.width, this.height]);

		if (this.root && this.root.loaded)
		{
			actor.trigger('show', [this.root, this]);
		}

		return this;
	});

	ooo.Scene.method('trigger', function (type, argv, bubble)
	{
		var retv = triggerActor(this, this, 'on', type, argv);

		if (retv != false)
		{
			if (retv == null)
			{
				retv = argv;
			}
			
			if (bubble)
			{
				for (var i = (this.layers.length - 1); i >= 0; i--)
				{
					var layer = this.children[this.layers[i]];

					if (triggerLayer(this, layer, type, retv) == false)
					{
						return false;
					}
				}
			}
			else
			{
				for (var i = 0; i < this.layers.length; i++)
				{
					var layer = this.children[this.layers[i]];

					if (triggerLayer(this, layer, type, retv) == false)
					{
						return false;
					}
				}
			}
		}
		else
		{
			return false;//propblematisch da bubble nicht mehr ausgeführt wird??? drauf achten!!
		}

		triggerActor(this, this, 'bubble', type, argv);
	});

	ooo.Scene.on('show', function (root, parent)
	{
		ooo.Cell.prototype.events.on.show.call(this, root, parent);
		return [root, this];
	});

	ooo.Scene.on('resize', function (width, height)
	{
		ooo.Cell.prototype.events.on.resize.call(this, width, height);
		return [this.width, this.height];
	});

	ooo.Scene.prepare('draw', function (time, context)
	{
		context.save();
		context.scale(this.scale_x, this.scale_y);
		context.globalAlpha = this.alpha;
		context.translate(this.rel_x + this.mid_x, this.rel_y + this.mid_y);
		context.rotate(this.angle);
		context.translate(-this.mid_x, -this.mid_y);
	});

	ooo.Scene.cleanup('draw', function (time, context)
	{
		context.restore();
	});

	//layers komplett abschaffen? -> array also reihenfolge nicht undefined -> insert before after push, unshift//array id damit auch abschaffen
	ooo.Scene.prepare('input:click', function (down_x, down_y)
	{
		var shift_x = down_x - this.rel_x - this.mid_x;
		var shift_y = down_y - this.rel_y - this.mid_y;
		var angle = -this.angle;
		down_x = (shift_x * Math.cos(angle) - shift_y * Math.sin(angle)) + this.mid_x;
		down_y = (shift_x * Math.sin(angle) + shift_y * Math.cos(angle)) + this.mid_y;

		if ((down_x < 0) || (down_y < 0) || (down_x >= this.width) || (down_y >= this.height))
		{
			return false;
		}

		return [down_x, down_y];
	});

	//Scene with own canvas
	ooo.Stage = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		this.update = true;
		this.once = false;
	});

	ooo.Stage.method('resize', function (width, height)
	{
		this.width = this.canvas.width = width;
		this.height = this.canvas.height = height;
		return this;
	});

	ooo.Stage.method('refresh', function ()
	{
		this.update = false;
		this.once = true;
		return this;
	});

	ooo.Stage.method('clear', function ()
	{
		//just one method to clear the canvas (there are others)
		this.canvas.width = this.canvas.width;
	});

	ooo.Stage.method('fill', function (color)
	{
		this.context.save();
		this.context.fillStyle = color;
		this.context.fillRect(0, 0, this.width, this.height);
		this.context.restore();
	});

	ooo.Stage.on('draw', function (time, context)
	{
		if (this.update || this.once)
		{
			this.once = false;
			return [time, this.context];
		}
		else
		{
			return false;
		}
	});

	ooo.Stage.bubble('draw', function (time, context)
	{
		if (context)
		{
			context.drawImage(this.canvas, 0, 0);
		}
	});

	//root actor to be embedded into html
	ooo.Root = ooo.Stage.extend(function (hook, assets, color)
	{
		ooo.Stage.call(this);
		this.canvas.style.position = 'absolute';
		this.canvas.focus();
		this.hook = hook;
		this.hook.style.overflow = 'hidden';
		this.hook.appendChild(this.canvas);
		this.resize(hook.clientWidth, hook.clientHeight);
		this.context.fillStyle = color || '#444';
		this.context.fillRect(0, 0, this.width, this.height);
		this.fullscreen = false;
		this.loaded = false;
		this.root = this;
		var that = this;

		ooo.preload(assets, function (images)
		{
			that.images = images;
			that.loaded = true;
			that.trigger('show', [that, that]);
		});
	});

	ooo.Root.method('toggle', function ()
	{
		if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement)
		{
			if (document.exitFullscreen)
			{
				document.exitFullscreen();
			}
			else if (document.msExitFullscreen)
			{
				document.msExitFullscreen();
			}
			else if (document.mozCancelFullScreen)
			{
				document.mozCancelFullScreen();
			}
			else if (document.webkitExitFullscreen)
			{
				document.webkitExitFullscreen();
			}

			this.fullscreen = false;
		}
		else
		{
			if (this.hook.requestFullscreen)
			{
				this.hook.requestFullscreen();
			}
			else if (this.hook.msRequestFullscreen)
			{
				this.hook.msRequestFullscreen();
			}
			else if (this.hook.mozRequestFullScreen)
			{
				this.hook.mozRequestFullScreen();
			}
			else if (this.hook.webkitRequestFullscreen)
			{
				this.hook.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}

			this.fullscreen = true;
		}
	});

	ooo.Root.on('show', function (root, parent)
	{
		var drag = false;
		var down_x = 0;
		var down_y = 0;
		var drag_x = 0;
		var drag_y = 0;
		var argv = [0];
		var requestFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
		var that = this;
		
		function on_mousedown (event)
		{
			down_x = event.clientX;
			down_y = event.clientY;
			that.canvas.addEventListener('mousemove', on_mousemove);
		}
		
		function on_mousemove (event)
		{
			drag_x = event.clientX - down_x;
			drag_y = event.clientY - down_y;

			if (drag)
			{
				that.trigger('input:drag', [drag_x, drag_y], true);
			}
			else if ((Math.abs(drag_x) > 3) || (Math.abs(drag_y) > 3))
			{
				that.trigger('input:drag', [drag_x, drag_y], true);
				drag = true;
			}
		}

		function on_mouseup (event)
		{
			if (drag)
			{
				that.trigger('input:drop', [event.clientX, event.clientY], true);
				drag_x = 0;
				drag_y = 0;
				drag = false;
			}
			else
			{
				that.trigger('input:click', [down_x, down_y], true);
			}

			that.canvas.removeEventListener('mousemove', on_mousemove);
		}
		
		function on_mouseout (event)
		{
			//console.log('out', JSON.stringify(that));
		}
		
		/*function on_keydown (event)
		{
			that.trigger('press', [event.timeStamp, event.keyCode, event.shiftKey], true);//, event.which
		}*/
		
		function on_keypress (event)
		{
			if (event.ctrlKey || event.altKey)
			{
				return;
			}

			that.trigger('input:press', [event.timeStamp, event.charCode, event.keyCode, event.shiftKey], true);

			if (event.keyCode == 9)
			{
				//event.stopPropagation();
				event.preventDefault();
			}
		}
		
		function on_resize (event)
		{
			that.trigger('resize', [that.hook.clientWidth, that.hook.clientHeight]);
			that.trigger('draw', argv);
		}

		function on_draw (time)
		{
			that.request_id = requestFrame(on_draw);
			argv[0] = time;
			that.trigger('draw', argv);
		}

		this.canvas.addEventListener('mousedown', on_mousedown);
		this.canvas.addEventListener('mouseup', on_mouseup);
		this.canvas.addEventListener('mouseout', on_mouseout);
		//window.addEventListener('keydown', on_keydown);
		window.addEventListener('keypress', on_keypress);
		window.addEventListener('resize', on_resize);
		this.request_id = requestFrame(on_draw);
	});

	ooo.Root.on('hide', function ()
	{
		var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame;
		cancel(this.request_id);

		/*this.canvas.addEventListener('mousedown', on_mousedown);
		this.canvas.addEventListener('mouseup', on_mouseup);
		this.canvas.addEventListener('mouseout', on_mouseout);
		window.addEventListener('resize', on_resize);*/
	});

	ooo.Client = ooo.Root.extend(function (url, hook, assets, color)
	{
		ooo.Root.call(this, hook, assets, color);
		this.sockjs = new SockJS(url);
		this.opened = false;
		var that = this;

		this.sockjs.onopen = function ()
		{
			this.opened = true;
			that.trigger('socket:open', []);
		}

		this.sockjs.onmessage = function (message)
		{
			var data = JSON.parse(message.data);

			//if (!Array.isArray(data) || (data.length != 2))
			if (!Array.isArray(data))
			{
				console.log('ERROR %d', 666);
				return;
			}

			var type = 'message:' + data[0];
			that.trigger(type, data[1]);
		}

		this.sockjs.onclose = function (message)
		{
			this.opened = false;
			that.trigger('socket:close', [message.code]);
		}
	});

	ooo.Client.method('send', function (type, data)
	{
		this.sockjs.send(JSON.stringify(Array.prototype.slice.call(arguments)));
	});
})();
