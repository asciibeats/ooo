'use strict';
var oox = {};

(function ()
{
	oO.map = function (keys, values)
	{
		var object = {};

		for (var i = 0; i < keys.length; i++)
		{
			object[keys[i]] = values[i];
		}

		return object;
	}

	oO.clone = function (object)
	{
		var clone = {};

		for (var key in object)
		{
			clone[key] = object[key];
		}

		return clone;
	}

	function parse ()
	{
		var argv = Array.prototype.slice.call(arguments);
		var template = argv.shift();
		var re = /<%([^%>]+)?%>/g;
		var js = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/;
		var code = 'var r = [];';
		var cursor = 0;
		var match;

		while (match = re.exec(template))
		{
			var line = template.slice(cursor, match.index);

			if (line != '')
			{
				code += 'r.push("' + line.replace(/"/g, '\\"') + '");';
			}

			line = match[1];

			if (js.test(line))
			{
				code += line;
			}
			else
			{
				code += 'r.push(' + line + ');';
			}

			cursor = match.index + match[0].length;
		}

		var line = template.substr(cursor, template.length - cursor);

		if (line != '')
		{
			code += 'r.push("' + line.replace(/"/g, '\\"') + '");';
		}

		code += 'return r.join("");';
		return new Function(code.replace(/[\r\t\n]/g, '')).apply(this, argv);
	}

	function wrap (index, size)
	{
		return ((index % size) + size) % size;
	}

	function indices (object)//use with sparse arr: i < length
	{
		var keys = [];

		for (var key in object)
		{
			keys.push(parseInt(key));
		}

		return keys;
	}

	oO.array2D = function (width, height, value)
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

	function size (object)
	{
		return Object.keys(object).length;
	}

	function setLocal (name, object)
	{
		localStorage[name] = JSON.stringify(object);
	}

	function getLocal (name)
	{
		if (localStorage[name])
		{
			return JSON.parse(localStorage[name]);
		}
		else
		{
			localStorage[name] = JSON.stringify({});
		}
	}

	function preload (assets, callback)
	{
		if (!assets)
		{
			return;
		}

		var images = {};
		var toload = size(assets);
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

	function Wrap (Func, argv)
	{
		return Func.bind.apply(Func, [Func].concat(argv));
	}

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

		actor.id = fill(scene.children[layer], actor);
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

	oO.Actor = function ()
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

	oO.Actor.on = addEvent('on');

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

		if (Child.prototype.events)
		{
			var events = {};

			for (var channel in Child.prototype.events)
			{
				events[channel] = {};

				for (var type in Child.prototype.events[channel])
				{
					events[channel][type] = Child.prototype.events[channel][type];
				}
			}

			Child.prototype.events = events;
		}

		if (Child.prototype.bottomup)
		{
			var bottomup = {};

			for (var type in Child.prototype.bottomup)
			{
				bottomup[type] = Child.prototype.bottomup[type];
			}

			Child.prototype.bottomup = bottomup;
		}
	}

	oO.Actor.clone = function ()
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

	oO.Actor.extend = function (func)
	{
		var Parent = this;

		var Child = function ()
		{
			func.apply(this, arguments);
		}

		inherit(Child, Parent);
		return Child;
	}

	oO.Actor.method = function (name, func)
	{
		this.prototype[name] = func;
	}

	oO.Actor.method('on', function (type, func)
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

	oO.Actor.method('off', function (type)
	{
		var channel = 'on';

		if (!this.events || !this.events[channel])
		{
			return;
		}

		delete this.events[channel][type];
		return this;
	});

	oO.Actor.method('place', function (rel_x, rel_y)
	{
		this.rel_x = rel_x;
		this.rel_y = rel_y;
		return this;
	});

	oO.Actor.method('resize', function (width, height)
	{
		this.width = width;
		this.height = height;
		return this;
	});

	oO.Actor.method('rotate', function (angle)
	{
		this.angle = angle / 180 * Math.PI;
		return this;
	});

	oO.Actor.method('center', function (mid_x, mid_y)
	{
		this.mid_x = mid_x;
		this.mid_y = mid_y;
		return this;
	});

	oO.Actor.method('trigger', function (type, argv)
	{
		return triggerActor(this, this, 'on', type, argv);
	});

	oO.Actor.method('hide', function ()
	{
		if (this.id == undefined)
		{
			return;
		}

		var layer = this.parent.children[this.layer];
		delete layer[this.id];

		if (size(layer) == 0)
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

	oO.Actor.on('show', function (root, parent)
	{
		this.root = root;
	});

	//Actor with image
	oO.Sprite = oO.Actor.extend(function (image, width, height, img_x, img_y)
	{
		oO.Actor.call(this);
		this.image = image;
		this.width = width || image.width;
		this.height = height || image.height;
		this.img_x = img_x || 0;
		this.img_y = img_y || 0;
	});

	oO.Sprite.on('draw', function (time, context)
	{
		context.drawImage(this.image, this.img_x, this.img_y, this.width, this.height, 0, 0, this.width, this.height);
	});

	oO.Cell = oO.Actor.extend(function (layout)
	{
		oO.Actor.call(this);
		this.layout = layout || {'left': 0, 'right': 0, 'top': 0, 'bottom': 0};
	});

	oO.Cell.method('arrange', function (layout)
	{
		this.layout = layout;
		return this;
	});

	oO.Cell.on('resize', function (width, height)
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
	oO.Box = oO.Cell.extend(function (color, layout)
	{
		oO.Cell.call(this, layout);
		this.color = color;
	});

	oO.Box.on('draw', function (time, context)
	{
		context.fillStyle = this.color;
		context.fillRect(0, 0, this.width, this.height);
	});

	//Container for actors
	oO.Scene = oO.Cell.extend(function (layout)
	{
		oO.Cell.call(this, layout);
		this.scale_x = 1;
		this.scale_y = 1;
		this.children = [];
		this.layers = [];
	});

	oO.Scene.prepare = addEvent('prepare');
	oO.Scene.cleanup = addEvent('cleanup');
	oO.Scene.bubble = addEvent('bubble');

	oO.Scene.register = function (type, value)
	{
		if (this.prototype.bottomup == undefined)
		{
			this.prototype.bottomup = {};
		}

		this.prototype.bottomup[type] = value;
	}

	oO.Scene.register('draw', true);
	oO.Scene.register('resize', true);
	oO.Scene.register('show', true);
	//oO.Scene.register('hide', true);
	//oO.Scene.register('press', false);
	oO.Scene.register('text', false);
	//oO.Scene.register('release', false);
	oO.Scene.register('drag', false);
	oO.Scene.register('drop', false);
	oO.Scene.register('click', false);
	oO.Scene.register('submit', true);

	oO.Scene.register('deny', true);
	oO.Scene.register('grant', true);
	oO.Scene.register('init', true);
	oO.Scene.register('gameinit', true);
	oO.Scene.register('continue', true);

	oO.Scene.register('join', true);
	oO.Scene.register('leave', true);
	oO.Scene.register('ready', true);
	oO.Scene.register('start', true);
	oO.Scene.register('away', true);
	oO.Scene.register('back', true);
	oO.Scene.register('tock', true);

	oO.Scene.method('bubble', function (type, func)//temp
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

	oO.Scene.method('hideChildren', function ()
	{
		this.children = [];
		this.layers = [];
		return this;
	});

	oO.Scene.method('show', function (actor, layer)
	{
		showActor(this, actor, layer);
		actor.trigger('resize', [this.width, this.height]);

		if (this.root && this.root.loaded)
		{
			actor.trigger('show', [this.root, this]);
		}

		return this;
	});

	oO.Scene.method('trigger', function (type, argv)
	{
		if (this.bottomup[type] == undefined)
		{
			return;
		}

		var retv = triggerActor(this, this, 'on', type, argv);

		if (retv != false)
		{
			if (retv == null)
			{
				retv = argv;
			}
			
			if (this.bottomup[type])
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
			else
			{
				for (var i = this.layers.length; i > 0;)
				{
					var layer = this.children[this.layers[--i]];

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

	oO.Scene.on('show', function (root, parent)
	{
		oO.Cell.prototype.events.on.show.call(this, root, parent);
		return [root, this];
	});

	oO.Scene.on('resize', function (width, height)
	{
		oO.Cell.prototype.events.on.resize.call(this, width, height);
		return [this.width, this.height];
	});

	oO.Scene.prepare('draw', function (time, context)
	{
		context.save();
		context.scale(this.scale_x, this.scale_y);
		context.globalAlpha = this.alpha;
		context.translate(this.rel_x + this.mid_x, this.rel_y + this.mid_y);
		context.rotate(this.angle);
		context.translate(-this.mid_x, -this.mid_y);
	});

	oO.Scene.cleanup('draw', function (time, context)
	{
		context.restore();
	});

	//layers komplett abschaffen? -> array also reihenfolge nicht undefined -> insert before after push, unshift//array id damit auch abschaffen
	oO.Scene.prepare('click', function (down_x, down_y)
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
	oO.Stage = oO.Scene.extend(function (layout)
	{
		oO.Scene.call(this, layout);
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		this.update = true;
		this.once = false;
	});

	oO.Stage.method('resize', function (width, height)
	{
		this.width = this.canvas.width = width;
		this.height = this.canvas.height = height;
		return this;
	});

	oO.Stage.method('refresh', function ()
	{
		this.update = false;
		this.once = true;
		return this;
	});

	oO.Stage.method('clear', function ()
	{
		//just one method to clear the canvas (there are others)
		this.canvas.width = this.canvas.width;
	});

	oO.Stage.method('fill', function (color)
	{
		this.context.save();
		this.context.fillStyle = color;
		this.context.fillRect(0, 0, this.width, this.height);
		this.context.restore();
	});

	oO.Stage.on('draw', function (time, context)
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

	oO.Stage.bubble('draw', function (time, context)
	{
		if (context)
		{
			context.drawImage(this.canvas, 0, 0);
		}
	});

	//root actor to be embedded into html
	oO.Root = oO.Stage.extend(function (hook, assets, color)
	{
		oO.Stage.call(this);
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

		preload(assets, function (images)
		{
			that.images = images;
			that.loaded = true;
			that.trigger('show', [that, that]);
		});
	});

	oO.Root.method('toggle', function ()
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

	oO.Root.on('show', function (root, parent)
	{
		var drag = false;
		var down_x = 0;
		var down_y = 0;
		var drag_x = 0;
		var drag_y = 0;
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
				that.trigger('drag', [drag_x, drag_y]);
			}
			else if ((Math.abs(drag_x) > 3) || (Math.abs(drag_y) > 3))
			{
				that.trigger('drag', [drag_x, drag_y]);
				drag = true;
			}
		}

		function on_mouseup (event)
		{
			if (drag)
			{
				that.trigger('drop', [event.clientX, event.clientY]);
				drag_x = 0;
				drag_y = 0;
				drag = false;
			}
			else
			{
				that.trigger('click', [down_x, down_y]);
			}

			that.canvas.removeEventListener('mousemove', on_mousemove);
		}
		
		function on_mouseout (event)
		{
			//console.log('out', JSON.stringify(that));
		}
		
		function on_keydown (event)
		{
			that.trigger('press', [event.timeStamp, event.keyCode, event.shiftKey]);//, event.which
		}
		
		function on_keypress (event)
		{
			if (event.ctrlKey || event.altKey)
			{
				return;
			}

			that.trigger('text', [event.timeStamp, event.charCode, event.keyCode, event.shiftKey]);

			if (event.keyCode == 9)
			{
				//event.stopPropagation();
				event.preventDefault();
			}
		}

		var argv = [0];
		
		function on_resize (event)
		{
			that.trigger('resize', [that.hook.clientWidth, that.hook.clientHeight]);
			that.trigger('draw', argv);
		}

		this.canvas.addEventListener('mousedown', on_mousedown);
		this.canvas.addEventListener('mouseup', on_mouseup);
		this.canvas.addEventListener('mouseout', on_mouseout);
		//window.addEventListener('keydown', on_keydown);
		window.addEventListener('keypress', on_keypress);
		window.addEventListener('resize', on_resize);

		var request = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;

		function loop (time)
		{
			that.request_id = request(loop);
			argv[0] = time;
			that.trigger('draw', argv);
		}

		this.request_id = request(loop);
	});

	oO.Root.on('hide', function ()
	{
		var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame;
		cancel(this.request_id);

		/*this.canvas.addEventListener('mousedown', on_mousedown);
		this.canvas.addEventListener('mouseup', on_mouseup);
		this.canvas.addEventListener('mouseout', on_mouseout);
		window.addEventListener('resize', on_resize);*/
	});

	oO.Button = oO.Cell.extend(function (button_w, button_h, source, styles, layout)
	{
		oO.Cell.call(this, layout);
		this.button_w = button_w;
		this.button_h = button_h;
		this.source = source;
		this.styles = styles;
	});

	oO.Button.method('style', function (name)
	{
		var cols = Math.floor(this.image.width / this.button_w);
		var rows = Math.floor(this.image.height / this.button_h);

		this.tile_x = (this.styles[name] % cols) * this.button_w;
		this.tile_y = Math.floor(this.styles[name] / rows) * this.button_h;
	});

	oO.Button.on('show', function (root, parent)
	{
		oO.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.source];
		this.tiles = [];

		var cols = Math.floor(this.image.width / this.button_w);
		var rows = Math.floor(this.image.height / this.button_h);
		var name = Object.keys(this.styles)[0];

		this.tile_x = (this.styles[name] % cols) * this.button_w;
		this.tile_y = Math.floor(this.styles[name] / rows) * this.button_h;
	});

	oO.Button.on('draw', function (time, context)
	{
		context.drawImage(this.image, this.tile_x, this.tile_y, this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
	});

	oO.Form = oO.Stage.extend(function (color, font, layout, align, baseline)
	{
		oO.Stage.call(this, layout);
		this.color = color || '#f00';
		this.font = font || '24px sans-serif';
		this.align = align || 'start';
		this.baseline = baseline || 'top';
	});

	oO.Form.method('show', function (actor, layer)
	{
		oO.Scene.prototype.show.call(this, actor, layer);

		if (!this.focus && (actor instanceof oO.Input))
		{
			this.focus = actor;
			actor.toggle();
		}

		return this;
	});

	oO.Form.method('reset', function ()
	{
		this.focus.toggle();
		delete this.focus;

		//for (var i = 0; i < this.children.length; i++)
		for (var id in this.children[0])
		{
			var child = this.children[0][id];

			if (child instanceof oO.Input)
			{
				if (!this.focus)
				{
					this.focus = child;
					child.toggle();
				}

				if (child.reset)
				{
					child.reset();
				}
			}
		}
	});

	oO.Form.on('text', function (time, char, key, shift)
	{
		if (key == 9)//tab
		{
			this.focus.toggle();
			var id = this.focus.id;
			var layer = this.children[this.focus.layer];
			var length = size(layer);

			do
			{
				id = wrap(shift ? id - 1 : id + 1, length);
				this.focus = layer[id];
			}
			while (!(this.focus instanceof oO.Input))

			this.focus.toggle();
			return false;
		}
	});

	oO.Form.on('draw', function (time, context)
	{
		context.fillStyle = '#555';
		context.fillRect(0, 0, this.width, this.height);
		context.fillStyle = this.color;
		context.font = this.font;
		context.textAlign = this.align;
		context.textBaseline = this.baseline;
	});

	oO.Form.prepare('text', function (time, char, key, shift)
	{
		if (this.parent.focus != this)
		{
			return false;
		}
	});

	oO.Form.bubble('submit', function (type, data)
	{
		console.log('SUBMIT %s %s', type, JSON.stringify(data));
	});

	oO.Input = oO.Cell.extend(function (layout)//alphabet
	{
		oO.Cell.call(this, layout);
		this.focus = false;
	});

	oO.Input.method('toggle', function ()
	{
		this.focus = !this.focus;
	});

	oO.Input.on('click', function (down_x, down_y)
	{
		this.parent.focus.toggle();
		this.parent.focus = this;
		this.toggle();
	});

	oO.Submit = oO.Input.extend(function (type, color, layout)
	{
		oO.Input.call(this, layout);
		this.type = type;
		this.color = color;
	});

	oO.Submit.on('click', function (down_x, down_y)
	{
		oO.Input.prototype.events.on.click.call(this, down_x, down_y);
		this.parent.trigger('submit', [this.type, []]);
		return false;
	});

	oO.Submit.on('text', function (time, char, key, shift)
	{
		if (key == 13)//enter
		{
			this.parent.trigger('submit', [this.type, []]);
			return false;
		}
	});

	oO.Submit.on('draw', function (time, context)
	{
		context.fillStyle = this.color;
		context.fillRect(0, 0, this.width, this.height);
		context.fillStyle = '#555';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(this.type, this.width >>> 1, this.height >>> 1);
	});

	oO.Field = oO.Input.extend(function (type, layout)//alphabet
	{
		oO.Input.call(this, layout);
		this.type = type;
		this.reset();
	});

	oO.Field.method('reset', function ()
	{
		this.chars = [];
		this.caret = 0;
		this.text = '';
		this.sub = '';
	});

	oO.Field.on('submit', function (type, data)
	{
		data.push(this.text);
	});

	oO.Field.on('text', function (time, char, key, shift)
	{
		if (key == 13)//enter
		{
			this.parent.trigger('submit', [this.type, []]);
			return false;
		}
		else if (key == 8)//backspace
		{
			if (this.caret > 0)
			{
				this.caret--;
				this.chars.splice(this.caret, 1);
			}
		}
		else if (key == 46)//delete
		{
			if (this.caret < this.chars.length)
			{
				this.chars.splice(this.caret, 1);
			}
		}
		else if (key == 37)//left
		{
			if (this.caret > 0)
			{
				this.caret--;
			}
		}
		else if (key == 39)//right
		{
			if (this.caret < this.chars.length)
			{
				this.caret++;
			}
		}
		else
		{
			this.chars.splice(this.caret, 0, String.fromCharCode(char));
			this.caret++;
		}

		this.text = this.chars.join('');
		this.sub = this.text.substr(0, this.caret);
	});

	oO.Field.on('draw', function (time, context)
	{
		//context.drawImage(this.image, this.img_x, this.img_y, this.width, this.height, 0, 0, this.width, this.height);
		context.fillText(this.text, 0, 0);

		if (this.focus && ((time % 2000) < 1300))//caret blink
		{
			context.fillRect(context.measureText(this.sub).width, 0, this.height >>> 3, this.height);
		}
	});

	oO.Count = oO.Input.extend(function (min, max, init, layout)
	{
		oO.Input.call(this, layout);
		this.min = min;
		this.max = max;
		this.init = init;
		this.reset();
	});

	oO.Count.method('reset', function ()
	{
		this.number = this.init;
	});

	oO.Count.on('submit', function (type, data)
	{
		data.push(this.number);
	});

	oO.Count.on('click', function (down_x, down_y)
	{
		oO.Input.prototype.events.on.click.call(this, down_x, down_y);

		if (down_x < (this.width >>> 1))
		{
			if (this.number > this.min)
			{
		 		this.number--;
			}
			else
			{
		 		this.number = this.max;
			}
		}
		else
		{
			if (this.number < this.max)
			{
		 		this.number++;
			}
			else
			{
		 		this.number = this.min;
			}
		}
	});

	oO.Count.on('draw', function (time, context)
	{
		//context.drawImage(this.image, this.img_x, this.img_y, this.width, this.height, 0, 0, this.width, this.height);
		context.fillText(this.number, 0, 0);
	});

	oO.Option = oO.Input.extend(function (options, init, type, layout)
	{
		oO.Input.call(this, type, layout);
		this.options = options;
		this.init = init;
		this.reset();
	});

	oO.Option.method('reset', function ()
	{
		this.pick = this.init;
	});

	oO.Option.on('submit', function (type, data)
	{
		data.push(this.pick);
	});

	oO.Option.on('click', function (down_x, down_y)
	{
		oO.Input.prototype.events.on.click.call(this, down_x, down_y);
		down_x < (this.width >>> 1) ? this.pick-- : this.pick++;
		this.pick = wrap(this.pick, this.options.length);
	});

	oO.Option.on('draw', function (time, context)
	{
		//context.drawImage(this.image, this.img_x, this.img_y, this.width, this.height, 0, 0, this.width, this.height);
		context.fillText(this.options[this.pick], 0, 0);
	});

	oO.Switch = oO.Input.extend(function (init, layout)
	{
		oO.Input.call(this, layout);
		this.init = init;
		this.reset();
	});

	oO.Switch.method('reset', function ()
	{
		this.state = this.init;
	});

	oO.Switch.on('submit', function (type, data)
	{
		data.push(this.state);
	});

	oO.Switch.on('click', function (down_x, down_y)
	{
		oO.Input.prototype.events.on.click.call(this, down_x, down_y);
		this.state = this.state ? 0 : 1;
	});

	oO.Switch.on('draw', function (time, context)
	{
		//context.drawImage(this.image, this.img_x, this.img_y, this.width, this.height, 0, 0, this.width, this.height);
		context.fillText(this.state, 0, 0);
	});

	oO.Menu = oO.Cell.extend(function (button_w, button_h, type, layout, vertical, reversed)//switch to oO.Button.extend
	{
		oO.Cell.call(this, layout);
		this.button_w = button_w;
		this.button_h = button_h;
		this.type = type;
		this.vertical = vertical;
		this.reversed = reversed;
		this.offset_x = vertical ? 0 : reversed ? -button_w : button_w;
		this.offset_y = vertical ? reversed ? -button_h : button_h : 0;
		this.options = [];
	});

	oO.Menu.method('reset', function (options)
	{
		this.options = options || [];
		return this;
	});

	oO.Menu.on('show', function (root, parent)
	{
		oO.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.type];
		this.tiles = [];

		var cols = Math.floor(this.image.width / this.button_w);
		var rows = Math.floor(this.image.height / this.button_h);

		for (var y = 0; y < rows; y++)
		{
			for (var x = 0; x < cols; x++)
			{
				this.tiles.push([x * this.button_w, y * this.button_h]);
			}
		}
	});

	oO.Menu.on('draw', function (time, context)
	{
		if (this.reversed)
		{
			if (this.vertical)
			{
				context.translate(0, this.height - this.button_h);
			}
			else
			{
				context.translate(this.width - this.button_w, 0);
			}
		}

		for (var i = 0; i < this.options.length; i++)
		{
			var index = this.options[i];
			context.drawImage(this.image, this.tiles[index][0], this.tiles[index][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
			context.translate(this.offset_x, this.offset_y);
		}
	});

	oO.Menu.on('click', function (down_x, down_y)
	{
		if (this.vertical)
		{
			if (this.reversed)
			{
				var i = Math.floor((this.height - down_y) / this.button_h);
			}
			else
			{
				var i = Math.floor(down_y / this.button_h);
			}
		}
		else
		{
			if (this.reversed)
			{
				var i = Math.floor((this.width - down_x) / this.button_w);
			}
			else
			{
				var i = Math.floor(down_x / this.button_w);
			}
		}

		if (this.options[i] != undefined)
		{
			this.trigger('pick', [this.options[i], i]);
			return false;
		}
	});

	oO.SingleMenu = oO.Menu.extend(function (button_w, button_h, image, layout, vertical, reversed)
	{
		oO.Menu.apply(this, arguments);
	});

	oO.SingleMenu.method('reset', function (options)
	{
		this.options = options || [];
		delete this.picked;
		return this;
	});

	oO.SingleMenu.on('draw', function (time, context)
	{
		if (this.reversed)
		{
			if (this.vertical)
			{
				context.translate(0, this.height - this.button_h);
			}
			else
			{
				context.translate(this.width - this.button_w, 0);
			}
		}

		for (var i = 0; i < this.options.length; i++)
		{
			if (this.picked == i)
			{
				context.fillStyle = '#f00';
				context.fillRect(0, 0, this.button_w, this.button_h);
			}
			else
			{
				var type = this.options[i];
				context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
			}

			context.translate(this.offset_x, this.offset_y);
		}
	});

	oO.SingleMenu.on('click', function (down_x, down_y)
	{
		if (this.vertical)
		{
			if (this.reversed)
			{
				var i = Math.floor((this.height - down_y) / this.button_h);
			}
			else
			{
				var i = Math.floor(down_y / this.button_h);
			}
		}
		else
		{
			if (this.reversed)
			{
				var i = Math.floor((this.width - down_x) / this.button_w);
			}
			else
			{
				var i = Math.floor(down_x / this.button_w);
			}
		}

		if (this.options[i] != undefined)
		{
			this.picked = i;
			this.trigger('pick', [this.options[i], i]);
			return false;
		}
	});

	oO.MultiMenu = oO.Menu.extend(function (button_w, button_h, image, layout)
	{
		oO.Menu.apply(this, arguments);
	});

	oO.MultiMenu.method('reset', function (options)
	{
		this.options = options || [];
		this.picked = [];

		for (var i = 0; i < this.options.length; i++)
		{
			this.picked[i] = false;
		}

		return this;
	});

	oO.MultiMenu.on('draw', function (time, context)
	{
		if (this.reversed)
		{
			if (this.vertical)
			{
				context.translate(0, this.height - this.button_h);
			}
			else
			{
				context.translate(this.width - this.button_w, 0);
			}
		}

		for (var i = 0; i < this.options.length; i++)
		{
			if (this.picked[i])
			{
				context.fillStyle = '#f00';
				context.fillRect(0, 0, this.button_w, this.button_h);
			}
			else
			{
				var type = this.options[i];
				context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
			}

			context.translate(this.offset_x, this.offset_y);
		}
	});

	oO.MultiMenu.on('click', function (down_x, down_y)
	{
		if (this.vertical)
		{
			if (this.reversed)
			{
				var i = Math.floor((this.height - down_y) / this.button_h);
			}
			else
			{
				var i = Math.floor(down_y / this.button_h);
			}
		}
		else
		{
			if (this.reversed)
			{
				var i = Math.floor((this.width - down_x) / this.button_w);
			}
			else
			{
				var i = Math.floor(down_x / this.button_w);
			}
		}

		if (this.options[i] != undefined)
		{
			this.picked[i] = !this.picked[i];
			var selection = [];

			for (var j = 0; j < this.options.length; j++)
			{
				if (this.picked[j])
				{
					selection.push(this.options[j]);
				}
			}

			this.trigger('pick', [selection, this.options[i], i]);
			return false;
		}
	});

	var SQR_NMASK = [[0, -1], [1, 0], [0, 1], [-1, 0]];
	var HEX_NMASK = [[[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]], [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]]];

	oO.TileMap = oO.Cell.extend(function (size, tile_w, tile_h, type, layout)
	{
		oO.Cell.call(this, layout);
		this.size = size;
		this.tile_w = tile_w;
		this.tile_h = tile_h;
		this.type = type;
		this.patch_w = size * tile_w;
		this.patch_h = size * tile_h;
		this.drag_x = 0;
		this.drag_y = 0;
		this.drop_x = 0;
		this.drop_y = 0;
		this.costs = {0: 1};
		this.marks = [];//remove!
		this.tiles = [];
		this.index = [];

		//create tiles
		for (var y = 0, i = 0; y < size; y++)
		{
			this.tiles[y] = [];

			for (var x = 0; x < size; x++, i++)
			{
				var tile = {};
				tile.i = i;
				tile.x = x;
				tile.y = y;
				tile.type = 0;
				//tile.data = new Tile();
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

	oO.TileMap.method('mark', function (tiles, type)
	{
		for (var i = 0; i < this.marks.length; i++)
		{
			delete this.index[this.marks[i]].mark;
		}

		this.marks = tiles;

		for (var i = 0; i < tiles.length; i++)
		{
			this.index[tiles[i]].mark = type;
		}
	});

	oO.TileMap.method('reset', function ()
	{
		for (var i = 0; i < this.marks.length; i++)
		{
			delete this.index[this.marks[i]].mark;
		}

		this.marks = [];
	});

	oO.TileMap.method('distance', function (a, b)
	{
		//todo wrapping distances (left/right/top/mid/bottom) (see hexmap)
		throw 'TileMap distance calculation not implemented yet!!!';
		return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
	});

	oO.TileMap.method('findArea', function (origin, range)
	{
		var done = [];
		var open = [origin];
		origin.g = 0;

		do
		{
			var current = open.pop();
			done[current.i] = true;

			for (var i = 0; i < current.steps.length; i++)
			{
				var next = current.steps[i];

				if (next.i in done)
				{
					continue;
				}

				var next_c = this.costs[next.type];

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
					open.splice(sorted_index(open, next, 'g'), 0, next);
					continue;
				}

				if (next_g < tile.g)
				{
					tile.g = next_g;
				}
			}
		}
		while (open.length)

		return indices(done);
	});

	oO.TileMap.method('findPath', function (origin, target)
	{
		var done = [];
		var crumbs = [];
		var open = [origin];
		origin.g = 0;
		origin.f = this.distance(origin, target);

		do
		{
			var current = open.pop();
			done[current.i] = true;

			for (var i = 0; i < current.steps.length; i++)
			{
				var next = current.steps[i];

				if (next.i in done)
				{
					continue;
				}

				var next_c = this.costs[next.type];

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
					open.splice(sorted_index(open, next, 'f'), 0, next);
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

	oO.TileMap.on('show', function (root, parent)
	{
		oO.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.type];
		this.coords = [];

		var cols = Math.floor(this.image.width / this.tile_w);
		var rows = Math.floor(this.image.height / this.tile_h);

		for (var y = 0; y < rows; y++)
		{
			for (var x = 0; x < cols; x++)
			{
				this.coords.push([x * this.tile_w, y * this.tile_h]);
			}
		}
	});

	oO.TileMap.on('drag', function (drag_x, drag_y)
	{
		this.drag_x = drag_x;
		this.drag_y = drag_y;
	});

	oO.TileMap.on('drop', function (drop_x, drop_y)
	{
		this.drop_x = wrap(this.drop_x - this.drag_x, this.patch_w);
		this.drop_y = wrap(this.drop_y - this.drag_y, this.patch_h);
		this.drag_x = 0;
		this.drag_y = 0;
	});

	oO.TileMap.on('click', function (down_x, down_y)
	{
		var tile_x = Math.floor(((this.drop_x + down_x) % this.patch_w) / this.tile_w);
		var tile_y = Math.floor(((this.drop_y + down_y) % this.patch_h) / this.tile_h);
		this.trigger('pick', [this.tiles[tile_y][tile_x], tile_x, tile_y]);
	});

	oO.TileMap.on('draw', function (time, context)
	{
		var drop_x = wrap(this.drop_x - this.drag_x, this.patch_w);
		var drop_y = wrap(this.drop_y - this.drag_y, this.patch_h);
		var start_x = Math.floor(drop_x / this.tile_w);
		var start_y = Math.floor(drop_y / this.tile_h);
		var end_x = start_x + Math.ceil(this.width / this.tile_w);
		var end_y = start_y + Math.ceil(this.height / this.tile_h);

		context.translate(-(drop_x % this.tile_w), -(drop_y % this.tile_h));

		for (var y = start_y; y <= end_y; y++)
		{
			var tile_y = y % this.size;
			context.save();

			for (var x = start_x; x <= end_x; x++)
			{
				var tile_x = x % this.size;
				var tile = this.tiles[tile_y][tile_x];
				//this.trigger('
				context.drawImage(this.image, this.coords[tile.type][0], this.coords[tile.type][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);

				if ('mark' in tile)
				{
					context.drawImage(this.image, this.coords[tile.mark][0], this.coords[tile.mark][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
				}

				context.translate(this.tile_w, 0);
			}

			context.restore();
			context.translate(0, this.tile_h);
		}
	});

	oO.HexMap = oO.TileMap.extend(function (size, tile_w, tile_h, type, layout)
	{
		oO.TileMap.apply(this, arguments);
		this.tile_w2 = tile_w >>> 1;
		this.tile_h2 = tile_h >>> 1;
		this.tile_h4 = tile_h >>> 2;
		this.tile_3h4 = this.tile_h2 + this.tile_h4;
		this.patch_h = size * this.tile_3h4;
		var hex_d = Math.sqrt(this.tile_w2 * this.tile_w2 + this.tile_3h4 * this.tile_3h4);//hex diagonale
		this.hex_r = hex_d / 2;//radius
		this.hex_x = this.tile_w2 / hex_d;
		this.hex_y = this.tile_3h4 / hex_d;
		this.size2 = size >>> 1;
		this.size32 = size + this.size2;
		this.tiles = [];
		this.index = [];

		//create tiles
		for (var y = 0, i = 0; y < size; y++)
		{
			this.tiles[y] = [];

			for (var x = 0; x < size; x++, i++)
			{
				var tile = {};
				tile.i = i;
				tile.x = x - (y >> 1);
				tile.y = y;
				tile.z = -tile.x - y;
				tile.type = 0;
				this.tiles[y][x] = tile;
				this.index[i] = tile;
			}
		}

		//connect neighbors
		for (var y = 0; y < size; y++)
		{
			var nmask = HEX_NMASK[y & 1];

			for (var x = 0; x < size; x++)
			{
				var steps = [];

				for (var i = 0; i < nmask.length; i++)
				{
					var nx = (x + nmask[i][0] + size) % size;
					var ny = (y + nmask[i][1] + size) % size;
					steps[i] = this.tiles[ny][nx];
				}

				this.tiles[y][x].steps = steps;
			}
		}
	});

	//private HexMap
	function wrapDist (dx, dy, dz)
	{
		var dist1 = Math.max(Math.abs(this.size2 + dx), this.size - dy, Math.abs(this.size2 + dz));
		var dist2 = Math.max(Math.abs(this.size2 - dx), this.size - dy, Math.abs(this.size32 + dz));
		var dist3 = Math.max(Math.abs(this.size - dx), dy, Math.abs(this.size + dz));
		return Math.min(dist1, dist2, dist3);
	}

	oO.HexMap.method('distance', function (a, b)
	{
		var dx = b.x - a.x;
		var dy = b.y - a.y;
		var dz = b.z - a.z;
		var dist = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));

		if (dist > this.size2)
		{
			if (dy == 0 || dx == dz)
			{
				return (this.size - dist);
			}
			else if (dx > dz)//rechts
			{
				if (dy > 0)//unten
				{
					var quad = wrapDist.call(this, dx, dy, dz);
				}
				else//oben
				{
					var quad = wrapDist.call(this, -dz, -dy, -dx);
				}
			}
			else//links
			{
				if (dy > 0)//unten
				{
					var quad = wrapDist.call(this, dz, dy, dx);
				}
				else//oben
				{
					var quad = wrapDist.call(this, -dx, -dy, -dz);
				}
			}
		}

		return (dist > quad ? quad : dist);
	});

	oO.HexMap.on('click', function (down_x, down_y)
	{
		var raw_x = (this.drop_x + down_x) % this.patch_w;
		var raw_y = (this.drop_y + down_y) % this.patch_h;
		var rel_x = raw_x % this.tile_w2;
		var rel_y = raw_y % this.tile_3h4;
		var min_x = Math.round((raw_x - rel_x) / this.tile_w2);
		var min_y = Math.round((raw_y - rel_y) / this.tile_3h4);

		if ((min_x & 1) == (min_y & 1))
		{
			if ((rel_x * this.hex_x + rel_y * this.hex_y) < this.hex_r)
			{
				var tile_x = (min_x >> 1) % this.size;
				var tile_y = min_y % this.size;
			}
			else
			{
				var tile_x = ((min_x + 1) >> 1) % this.size;
				var tile_y = (min_y + 1) % this.size;
			}
		}
		else
		{
			if (((rel_x - this.tile_w2) * -this.hex_x + rel_y * this.hex_y) < this.hex_r)
			{
				var tile_x = ((min_x + 1) >> 1) % this.size;
				var tile_y = min_y % this.size;
			}
			else
			{
				var tile_x = (min_x >> 1) % this.size;
				var tile_y = (min_y + 1) % this.size;
			}
		}

		this.trigger('pick', [this.tiles[tile_y][tile_x], tile_x, tile_y]);
	});

	oO.HexMap.on('draw', function (time, context)
	{
		var drop_x = wrap(this.drop_x - this.drag_x, this.patch_w);
		var drop_y = wrap(this.drop_y - this.drag_y, this.patch_h);
		var start_x = Math.floor(drop_x / this.tile_w);
		var start_y = Math.floor(drop_y / this.tile_3h4);
		var end_x = start_x + Math.ceil(this.width / this.tile_w) + 1;//besser berechnen als + 1 (width + tile_w2??)
		var end_y = start_y + Math.ceil(this.height / this.tile_3h4) + 1;

		context.translate(-((drop_x % this.tile_w) + this.tile_w2), -((drop_y % this.tile_3h4) + this.tile_h2));
		//context.translate(-((drop_x % this.tile_w)), -((drop_y % this.tile_3h4)));

		for (var y = start_y; y <= end_y; y++)
		{
			var tile_y = y % this.size;
			context.save();

			if (y & 1)
			{
				context.translate(this.tile_w2, 0);
			}

			for (var x = start_x; x <= end_x; x++)
			{
				var tile_x = x % this.size;
				var tile = this.tiles[tile_y][tile_x];
				context.drawImage(this.image, this.coords[tile.type][0], this.coords[tile.type][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);

				if ('mark' in tile)
				{
					context.drawImage(this.image, this.coords[tile.mark][0], this.coords[tile.mark][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
				}

				//context.fillText(tile.group.i, 10, 10);
				context.translate(this.tile_w, 0);
			}

			context.restore();
			context.translate(0, this.tile_3h4);
		}
	});

	var Login = oO.Form.extend(function (color, font, layout, align, baseline)
	{
		oO.Form.call(this, color, font, layout, align, baseline);
		this.show(new oO.Field('auth', {'top': 10, 'left': 10, 'right':10, 'height': 30}));
		this.show(new oO.Field('auth', {'top': 50, 'left': 10, 'right':10, 'height': 30}));
		this.show(new oO.Submit('login', '#a50', {'top': 90, 'left': 10, 'right':10, 'height': 30}));
	});

	Login.bubble('submit', function (type, data)
	{
		this.root.send('login', data[0], data[1]);
	});

	var Rules = oO.Form.extend(function (color, font, layout, align, baseline)
	{
		oO.Form.call(this, color, font, layout, align, baseline);
		this.games = new oO.Scene({'top': 10, 'left': 10, 'width': 180, 'bottom': 50});
		this.show(this.games);
		this.size = new oO.Option(['small', 'medium', 'large'], 1, {'top': 10, 'left': 200, 'width': 180, 'height': 30});
		this.show(this.size);
		this.mode = new oO.Switch(0, {'top': 50, 'left': 200, 'width': 180, 'height': 30});
		this.show(this.mode);
		this.show(new oO.Submit('join', '#a50', {'bottom': 10, 'left': 10, 'width': 180, 'height': 30}));
		this.show(new oO.Submit('host', '#a50', {'bottom': 10, 'left': 200, 'width': 180, 'height': 30}));
	});

	Rules.method('refresh', function (games)
	{
		oO.Stage.prototype.refresh.call(this);
		this.games.hideChildren();
		var i = 0;

		for (var id in games)
		{
			this.games.show(new oO.Box('#05a', {'top': i++ * 40, 'height': 30}));
		}

		return this;
	});

	Rules.bubble('submit', function (type, data)
	{
		this.root.send('host', data[0], data[1]);
		//this.root.init.apply(this, data);
	});

	var Lobby = oO.Form.extend(function (color, font, layout, align, baseline)
	{
		oO.Form.call(this, color, font, layout, align, baseline);
		this.show(new oO.Submit('open for public', '#a50', {'bottom': 50, 'left': 10, 'right': 10, 'height': 30}));
		this.show(new oO.Submit('ready to start', '#a50', {'bottom': 10, 'left': 10, 'right': 10, 'height': 30}));
	});

	Lobby.method('update', function (name)
	{
		var top = size(this.children[0]) * 40 + 10;
		this.show(new oO.Submit(name, '#a50', {'top': top, 'left': 10, 'right': 10, 'height': 30}));
	});

	Lobby.on('join', function (name)
	{
		var top = size(this.children[0]) * 40 + 10;
		this.show(new oO.Submit(name, '#a50', {'top': top, 'left': 10, 'right': 10, 'height': 30}));
	});

	Lobby.bubble('submit', function (type, data)
	{
		this.root.send('ready', data);
	});

	oO.Client = oO.Root.extend(function (hook, url, assets, color)
	{
		oO.Root.call(this, hook, null, color);
		this.sockjs = new SockJS(url);
		this.connected = false;
		this.granted = false;
		this.players = {};
		this.games = {};

		this.forms = {};
		this.forms.login = new Login('#5a0', '21px sans-serif', {'width': 200, 'height': 130}).center(100, 65).rotate(-10);
		this.forms.rules = new Rules('#5a0', '21px sans-serif', {'width': 390, 'height': 130}).center(195, 65).rotate(-10).refresh();
		this.forms.init = new Lobby('#5a0', '21px sans-serif', {'width': 200, 'height': 250}).center(100, 125).rotate(-10);

		this.show(new oO.Box('#a0a'));
		var that = this;

		preload(assets, function (images)
		{
			that.images = images;
			that.loaded = true;

			if (that.connected)
			{
				that.trigger('show', [that, that]);
			}
		});

		this.sockjs.onopen = function ()
		{
			that.connected = true;

			if (that.loaded)
			{
				that.trigger('show', [that, that]);
			}
		}

		this.sockjs.onmessage = function (message)
		{
			console.log('+++ ' + message.data + ' +++');
			var data = JSON.parse(message.data);

			if (!Array.isArray(data))
			{
				console.log('ERROR %d', 666);
				return;
			}

			var type = data.shift();
			that.trigger(type, data);
		}

		this.sockjs.onclose = function (message)
		{
			if (that.loaded && that.connected)
			{
				//jaaaa???? sooooo???
				//that.trigger('hide', [that, that]);
			}

			console.log('CLOSED %s', message.code);
		}
	});

	oO.Client.method('send', function (type, data)
	{
		this.sockjs.send(JSON.stringify(Array.prototype.slice.call(arguments)));
	});

	oO.Client.method('init', function ()
	{
		throw 'oO.Client.prototype.init() is not implemented yet!';
	});

	oO.Client.on('show', function (root, parent)
	{
		oO.Root.prototype.events.on.show.call(this, root, parent);
		this.show(this.forms.login);
	});

	//events.receive.deny !!!
	oO.Client.on('deny', function ()
	{
		this.forms.login.reset();
	});

	oO.Client.on('grant', function (inbox, games)
	{
		if (true)
		{
			setLocal('token', this.token);
		}

		console.log('GRANT %s %s', JSON.stringify(inbox), JSON.stringify(games));
		this.games = games;
		this.forms.login.hide();
		this.show(this.forms.rules.refresh(games));
	});

	oO.Client.on('init', function (id, rules, names)
	{
		console.log('LOBBY %s %s', JSON.stringify(rules), JSON.stringify(names));
		//this.init.apply(this, rules);

		for (var i = 0; i < names.length; i++)
		{
			this.players[names[i]] = true;
			var top = i * 40 + 10;
			this.forms.init.show(new oO.Submit(names[i], '#5a0', {'top': top, 'left': 10, 'right': 10, 'height': 30}));
		}

		this.forms.rules.hide();
		this.show(this.forms.init);
	});

	oO.Client.on('gameinit', function (id, rules, name)
	{
		if (this.games[id])
		{
			this.games[id][1].push(name);
		}
		else
		{
			this.games[id] = [rules, [name]];
		}

		this.forms.rules.refresh(this.games);
	});

	oO.Client.on('continue', function (rules, names, time, world, seat, realm)
	{
		if (true)
		{
			setLocal('token', this.token);
		}

		console.log('CONTINUE %s %s', JSON.stringify(rules), JSON.stringify(names));
		this.init.apply(this, rules);

		for (var i = 0; i < names.length; i++)
		{
			this.players[names[i]] = true;
		}

		this.trigger('start', [time, world, seat, realm]);
	});

	oO.Client.on('join', function (name)
	{
		console.log('JOIN %s', name);
		this.players[name] = true;
	});

	oO.Client.on('leave', function (name)
	{
		console.log('LEAVE %s', name);
		delete this.players[name];

		if (this.timeout)
		{
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	});

	//oO.Client
	function ready (delay)
	{
		console.log('READY %d', delay);
		delay--;

		if (delay > 0)
		{
			this.timeout = setTimeout(function () { ready.call(this, delay) }, 1000);
		}
		else
		{
			delete this.timeout;
		}
	}

	oO.Client.on('ready', function (delay)
	{
		ready.call(this, delay);
	});

	oO.Client.on('start', function (time, world, seat, realm)
	{
		console.log('START %d %s %d %s', time, JSON.stringify(world), seat, JSON.stringify(realm));
		this.time = time;
		this.world = world;
		this.seat = seat;
		this.realm = realm;
	});

	oO.Client.on('away', function (name)
	{
		console.log('AWAY %s', name);
	});

	oO.Client.on('back', function (name)
	{
		console.log('BACK %s', name);
	});

	oO.Client.on('tock', function ()
	{
		console.log('TOCK %d', this.time);
	});
})();
