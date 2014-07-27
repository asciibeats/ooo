'use strict';
var oO = {};
//royal alien
//kingdoms from mars
//jupiter kings

//TODO
//Object.create polyobjFill? gibts broswer die canvas haben aber nicht Object.create??

(function ()
{
	var SQR_NMASK = [[0, -1], [1, 0], [0, 1], [-1, 0]];
	var HEX_NMASK = [[[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]], [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]]];

	function intWrap (i, n)
	{
		return (((i % n) + n) % n);
	}

	function intKeys (object)
	{
		var keys = [];

		for (var key in object)
		{
			keys.push(parseInt(key));
		}

		return keys;
	}

	function objFill (object, value)
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

	function objSize (object)
	{
		return Object.keys(object).length;
	}

	function setLocal (name, object)
	{
		localStorage[name] = JSON.stringify(object);
	}

	function getLocal (name)
	{
		if (!localStorage[name])
		{
			localStorage[name] = JSON.stringify({});
		}

		return JSON.parse(localStorage[name]);
	}

	function preload (assets, callback)
	{
		if (!assets)
		{
			return;
		}

		var images = {};
		var toload = objSize(assets);
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

	function listenTo (channel)
	{
		return function (type, func)
		{
			if (this.prototype.events == undefined)
			{
				this.prototype.events = {};
			}

			if (this.prototype.events[channel] == undefined)
			{
				this.prototype.events[channel] = {};
			}

			this.prototype.events[channel][type] = func;
		}
	}

	function triggerActor (actor, child, channel, type, argv)
	{
		if ((actor.events != undefined) && (actor.events[channel] != undefined) && (actor.events[channel][type] != undefined))
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
			var retv = triggerActor(actor, child, 1, type, argv);

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

			triggerActor(actor, child, 2, type, argv);
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

		if (scene.children[layer] == undefined)
		{
			scene.children[layer] = {};
			//insert + sort could potentially be optimized
			scene.layers.push(layer);
			scene.layers.sort(ascend);
		}

		actor.id = objFill(scene.children[layer], actor);
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

	var Class = function ()
	{
	}

	Class.method = function (name, func)
	{
		this.prototype[name] = func;
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

	oO.Actor.on = listenTo(0);

	oO.Actor.clone = function ()
	{
		var argv = arguments;
		var Parent = this;

		var Child = function ()
		{
			Parent.apply(this, argv);
		}

		Child.prototype = Object.create(Parent.prototype);
		Child.prototype.constructor = Child;

		if (Child.prototype.events != undefined)
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

		if (Child.prototype.bottomup != undefined)
		{
			var bottomup = {};

			for (var type in Child.prototype.bottomup)
			{
				bottomup[type] = Child.prototype.bottomup[type];
			}

			Child.prototype.bottomup = bottomup;
		}

		var names = Object.keys(Parent);

		for (var i = 0; i < names.length; i++)
		{
			var name = names[i];
			Child[name] = Parent[name];
		}

		return Child;
	}

	oO.Actor.extend = function (func)
	{
		var Parent = this;

		var Child = function ()
		{
			func.apply(this, arguments);
		}

		Child.prototype = Object.create(Parent.prototype);
		Child.prototype.constructor = Child;

		if (Child.prototype.events != undefined)
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

		if (Child.prototype.bottomup != undefined)
		{
			var bottomup = {};

			for (var type in Child.prototype.bottomup)
			{
				bottomup[type] = Child.prototype.bottomup[type];
			}

			Child.prototype.bottomup = bottomup;
		}

		var names = Object.keys(Parent);

		for (var i = 0; i < names.length; i++)
		{
			var name = names[i];
			Child[name] = Parent[name];
		}

		return Child;
	}

	oO.Actor.method = function (name, func)
	{
		this.prototype[name] = func;
	}

	oO.Actor.method('on', function (type, func)
	{
		var channel = 0;

		if (this.events == undefined)
		{
			this.events = {};
		}

		if (this.events[channel] == undefined)
		{
			this.events[channel] = {};
		}

		this.events[channel][type] = func;
		return this;
	});

	oO.Actor.method('off', function (type)
	{
		var channel = 0;

		if (this.events == undefined)
		{
			return;
		}

		if (this.events[channel] == undefined)
		{
			return;
		}

		delete this.events[channel][type];
		return this;
	});

	oO.Actor.method('trigger', function (type, argv)
	{
		return triggerActor(this, this, 0, type, argv);
	});

	oO.Actor.method('resize', function (width, height)
	{
		this.width = width;
		this.height = height;
		return this;
	});

	oO.Actor.method('rotate', function (angle)
	{
		this.angle = angle;
		return this;
	});

	oO.Actor.method('center', function (mid_x, mid_y)
	{
		this.mid_x = mid_x;
		this.mid_y = mid_y;
		return this;
	});

	oO.Actor.method('place', function (rel_x, rel_y)
	{
		this.rel_x = rel_x;
		this.rel_y = rel_y;
		return this;
	});

	oO.Actor.method('hide', function ()
	{
		if (this.id == undefined)
		{
			return;
		}

		var layer = this.parent.children[this.layer];
		delete layer[this.id];

		if (objSize(layer) == 0)
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

	//Simple square for testing
	oO.Box = oO.Actor.extend(function (color)
	{
		oO.Actor.call(this);
		this.color = color;
		this.width = 100;
		this.height = 100;
	});

	oO.Box.on('frame', function (elapsed, context)
	{
		context.fillStyle = this.color;
		context.fillRect(0, 0, this.width, this.height);
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

	oO.Sprite.on('frame', function (elapsed, context)
	{
		context.drawImage(this.image, this.img_x, this.img_y, this.width, this.height, 0, 0, this.width, this.height);
	});

	oO.Cell = oO.Actor.extend(function (layout)
	{
		oO.Actor.call(this);
		this.layout = layout || {left: 0, right: 0, top: 0, bottom: 0};
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

			var width = this.layout.width;
		}
		else if ((this.layout.left != undefined) && (this.layout.right != undefined))
		{
			var rel_x = this.layout.left;
			var width = width - this.layout.left - this.layout.right;
		}
		else
		{
			throw 765;
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

			var height = this.layout.height;
		}
		else if ((this.layout.top != undefined) && (this.layout.bottom != undefined))
		{
			var rel_y = this.layout.top;
			var height = height - this.layout.top - this.layout.bottom;
		}
		else
		{
			throw 765;
		}

		this.place(rel_x, rel_y).resize(width, height);
	});

	//Container for actors
	oO.Scene = oO.Cell.extend(function (layout)
	{
		oO.Cell.call(this, layout);
		this.children = {};
		this.layers = [];
	});

	oO.Scene.prepare = listenTo(1);
	oO.Scene.cleanup = listenTo(2);
	oO.Scene.bubble = listenTo(3);

	oO.Scene.register = function (type, value)
	{
		if (this.prototype.bottomup == undefined)
		{
			this.prototype.bottomup = {};
		}

		this.prototype.bottomup[type] = value;
	}

	oO.Scene.register('frame', true);
	oO.Scene.register('resize', true);
	oO.Scene.register('show', true);
	//oO.Scene.register('hide', true);
	//oO.Scene.register('press', false);
	//oO.Scene.register('text', false);
	//oO.Scene.register('release', false);
	oO.Scene.register('drag', false);
	oO.Scene.register('drop', false);
	oO.Scene.register('click', false);

	oO.Scene.register('deny', true);
	oO.Scene.register('grant', true);
	oO.Scene.register('lobby', true);
	oO.Scene.register('continue', true);

	oO.Scene.register('join', true);
	oO.Scene.register('leave', true);
	oO.Scene.register('ready', true);
	oO.Scene.register('start', true);
	oO.Scene.register('away', true);
	oO.Scene.register('back', true);
	oO.Scene.register('tock', true);

	oO.Scene.on('show', function (root, parent)
	{
		return [root, this];
	});

	oO.Scene.on('resize', function (width, height)
	{
		oO.Cell.prototype.events[0].resize.apply(this, arguments);
		return [this.width, this.height];
	});

	oO.Scene.on('text', function (time, char, key, shift)
	{
		if (key == 9)
		{
			if (shift)
			{
				this.focus--;
				console.log('backward');
			}
			else
			{
				this.focus++;
				console.log('forward');
			}
		}
	});

	oO.Scene.prepare('show', function (root, parent)
	{
		this.root = root;
	});

	oO.Scene.prepare('frame', function (elapsed, context)
	{
		context.save();
		context.globalAlpha = this.alpha;
		context.translate(this.rel_x, this.rel_y);
		context.rotate(this.angle);
		context.translate(-this.mid_x, -this.mid_y);
	});

	oO.Scene.cleanup('frame', function (elapsed, context)
	{
		context.restore();
	});

	oO.Scene.prepare('click', function (down_x, down_y)
	{
		down_x -= this.rel_x;
		down_y -= this.rel_y;

		if ((down_x < -this.mid_x) || (down_y < -this.mid_y) || (down_x >= (this.width - this.mid_x)) || (down_y >= (this.height - this.mid_y)))
		{
			return false;
		}

		return [down_x, down_y];
	});

	oO.Scene.method('show', function (actor, layer)
	{
		showActor(this, actor, layer);
		actor.trigger('resize', [this.width, this.height]);

		if (this.root && this.root.images)//root has been opened
		{
			actor.trigger('show', [this.root, this]);
		}
	});

	oO.Scene.method('trigger', function (type, argv)
	{
		if (this.bottomup[type] == undefined)
		{
			return;
		}

		var retv = triggerActor(this, this, 0, type, argv);//ons

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

		triggerActor(this, this, 3, type, argv);//bubbles
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

	oO.Stage.on('frame', function (elapsed, context)
	{
		if (this.update || this.once)
		{
			this.once = false;
			return [elapsed, this.context];
		}
		else
		{
			return false;
		}
	});

	oO.Stage.bubble('frame', function (elapsed, context)
	{
		if (context != null)
		{
			context.drawImage(this.canvas, 0, 0);
		}
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

	//root actor to be embedded into html
	oO.Root = oO.Stage.extend(function (hook, assets, color)
	{
		oO.Stage.call(this);//layout is maxed automatically when null
		this.canvas.style.position = 'absolute';
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

	oO.Root.method('augment', function (element)
	{
		element.root = this;
		this.hook.appendChild(element.element);
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

			this.full = false;
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

			this.full = true;
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
			//console.log(event);
			that.trigger('press', [event.timeStamp, event.keyCode, event.shiftKey]);//, event.which
			//event.stopPropagation();
		}
		
		function on_keypress (event)
		{
			//console.log(event);
			that.trigger('text', [event.timeStamp, event.charCode, event.keyCode, event.shiftKey]);
			//event.stopPropagation();
		}

		var argv = [0];
		
		function on_resize (event)
		{
			that.trigger('resize', [that.hook.clientWidth, that.hook.clientHeight]);
			that.trigger('frame', argv);
		}

		this.canvas.addEventListener('mousedown', on_mousedown);
		this.canvas.addEventListener('mouseup', on_mouseup);
		this.canvas.addEventListener('mouseout', on_mouseout);
		//window.addEventListener('keydown', on_keydown);
		//window.addEventListener('keypress', on_keypress);
		window.addEventListener('resize', on_resize);

		var last = 0;
		var request = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;

		function loop (time)
		{
			//that.request_id = request(loop);
			//argv[0] = last ? (time - last) : 0;
			//last = time;
			argv[0] = time;
			that.trigger('frame', argv);
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
		this.marks = [];
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

	oO.TileMap.on('show', function (root, parent)
	{
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
		this.drop_x = intWrap(this.drop_x - this.drag_x, this.patch_w);
		this.drop_y = intWrap(this.drop_y - this.drag_y, this.patch_h);
		this.drag_x = 0;
		this.drag_y = 0;
	});

	oO.TileMap.on('click', function (down_x, down_y)
	{
		var tile_x = Math.floor(((this.drop_x + down_x) % this.patch_w) / this.tile_w);
		var tile_y = Math.floor(((this.drop_y + down_y) % this.patch_h) / this.tile_h);
		this.trigger('pick', [this.tiles[tile_y][tile_x], tile_x, tile_y]);
	});

	oO.TileMap.on('frame', function (elapsed, context)
	{
		var drop_x = intWrap(this.drop_x - this.drag_x, this.patch_w);
		var drop_y = intWrap(this.drop_y - this.drag_y, this.patch_h);
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

		return intKeys(done);
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

	oO.HexMap.on('frame', function (elapsed, context)
	{
		var drop_x = intWrap(this.drop_x - this.drag_x, this.patch_w);
		var drop_y = intWrap(this.drop_y - this.drag_y, this.patch_h);
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

				//context.objFillText(tile.group.i, 10, 10);
				context.translate(this.tile_w, 0);
			}

			context.restore();
			context.translate(0, this.tile_3h4);
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

	//HTML ELEMENTS
	var EVMAP = {};
	EVMAP['click'] = 'click';

	var EVFUNC = {};
	EVFUNC['click'] = function (func)
	{
		return function (event)
		{
			func(event.clientX, event.clientY);
			event.stopPropagation();
		}
	}

	oO.Element = function (type, style)
	{
		this.element = document.createElement(type);
		this.element.style.position = 'relative';

		for (var prop in style)
		{
			this.element.style[prop] = style[prop];
		}

		for (var type in this.events)//in clone/extend function??
		{
			this.element.addEventListener(type, this.events[type]);
		}
	}

	oO.Element.on = function (type, func)
	{
		if (!this.prototype.events)
		{
			this.prototype.events = {};
		}

		this.prototype.events[EVMAP[type]] = EVFUNC[type](func);
		return this;
	}

	oO.Element.clone = function ()
	{
		var argv = arguments;
		var Parent = this;

		var Child = function ()
		{
			Parent.apply(this, argv);
		}

		Child.prototype = Object.create(Parent.prototype);
		Child.prototype.constructor = Child;

		if (Child.prototype.events != undefined)
		{
			var events = {};

			for (var type in Child.prototype.events)
			{
				events[type] = Child.prototype.events[type];
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

	oO.Element.extend = function (func)
	{
		var Parent = this;

		var Child = function ()
		{
			func.apply(this, arguments);
		}

		Child.prototype = Object.create(Parent.prototype);
		Child.prototype.constructor = Child;

		if (Child.prototype.events != undefined)
		{
			var events = {};

			for (var type in Child.prototype.events)
			{
				events[type] = Child.prototype.events[type];
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

	oO.Element.method = function (name, func)
	{
		this.prototype[name] = func;
	}

	oO.Element.method('on', function (type, func)
	{
		if (!this.events)
		{
			this.events = {};
		}

		type = EVMAP[type];

		if (this.events[type])
		{
			this.element.removeEventListener(type, this.events[type]);
		}

		func = EVFUNC[type](func);
		this.events[type] = func;
		this.element.addEventListener(type, func);
		return this;
	});

	oO.Element.method('off', function (type)
	{
		type = EVMAP[type];

		if (!this.events || !this.events[type])
		{
			return;
		}

		this.element.removeEventListener(type, this.events[type]);
		delete this.events[type];
		return this;
	});

	oO.Element.method('hide', function ()
	{
		this.root.hook.removeChild(this.element);
		delete this.root;
	});

	oO.Game = oO.Scene.extend(function (size)
	{
		oO.Scene.call(this);
		this.size = size;
		this.players = {};
	});

	oO.Game.on('join', function (name)
	{
		console.log('JOIN %s', name);
		this.players[name] = true;
	});

	oO.Game.on('leave', function (name)
	{
		console.log('LEAVE %s', name);
		delete this.players[name];

		if (this.timeout)
		{
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	});

	//oO.Game
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

	oO.Game.on('ready', function (delay)
	{
		ready.call(this, delay);
	});

	oO.Game.on('start', function (time, world, seat, realm)
	{
		console.log('START %d %s %d %s', time, JSON.stringify(world), seat, JSON.stringify(realm));
		this.time = time;
		this.world = world;
		this.seat = seat;
		this.realm = realm;
		this.start();
	});

	oO.Game.on('away', function (name)
	{
		console.log('AWAY %s', name);
	});

	oO.Game.on('back', function (name)
	{
		console.log('BACK %s', name);
	});

	oO.Game.on('tock', function ()
	{
		console.log('TOCK %d', this.time);
	});

	oO.Table = oO.Root.extend(function (Game, hook, url, assets, color)
	{
		oO.Root.call(this, hook, null, color);
		this.Game = Game;
		this.sockjs = new SockJS(url);
		this.connected = false;
		this.granted = false;
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

			console.log('CLOSED %d', message.code);
		}
	});

	oO.Table.method('send', function ()
	{
		this.sockjs.send(JSON.stringify(Array.prototype.slice.call(arguments)));
	});

	//oO.Table
	function login (token)
	{
		if (token && localStorage.token)
		{
			this.token = JSON.parse(localStorage.token);
			console.log('LOCAL %s %s', this.token.name, this.token.pass);
			this.send('auth', this.token.name, this.token.pass);
		}
		else
		{
			var name = prompt('name?');
			var pass = prompt('pass?');
			console.log('PROMPT %s %s', name, pass);
			this.send('auth', name, pass);
			this.token = {'name': name, 'pass': pass}
		}
	}

	oO.Table.on('show', function (root, parent)
	{
		oO.Root.prototype.events[0].show.apply(this, arguments);
		login.call(this, true);
	});

	oO.Table.on('deny', function ()
	{
		login.call(this);
	});

	oO.Table.on('grant', function (list)
	{
		if (true)
		{
			localStorage.token = JSON.stringify(this.token);
		}

		console.log('BROWSE %s', JSON.stringify(list));
		var host = confirm('HOST?');

		if (host)
		{
			this.send('host', 2, 16, 8);
		}
		else
		{
			var id = parseInt(prompt('id?'));
			this.send('join', id);
		}
	});

	oO.Table.on('lobby', function (rules, names)
	{
		console.log('LOBBY %s %s', JSON.stringify(rules), JSON.stringify(names));
		this.game = new (Wrap(this.Game, rules))();

		for (var i = 0; i < names.length; i++)
		{
			this.game.trigger('join', [names[i]]);
		}

		this.show(this.game);
	});

	oO.Table.on('continue', function (rules, names, time, world, seat, realm)
	{
		if (true)
		{
			localStorage.token = JSON.stringify(this.token);
		}

		console.log('CONTINUE %s %s', JSON.stringify(rules), JSON.stringify(names));
		this.game = new (Wrap(this.Game, rules))();

		for (var i = 0; i < names.length; i++)
		{
			this.game.trigger('join', [names[i]]);
		}

		this.game.trigger('start', [time, world, seat, realm]);
		this.show(this.game);
	});
})();
