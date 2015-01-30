'use strict';
var ooo = {};
//////TODO
//hitActor verienheitlichen
//block events globally
//ignore mouse_drag, mouse_drop by default and automatically listen on mouse_grab
///ignore again on mouse_drop
//functionality for STAGE: transition between multiple children stages (one inner mask + other outer mask -> mask expand/shrink)
//Textumbruch in ooo.Text()
//cell auto resize; alles relativ zu mid??!!! (im moment bei layout.right relativ zu rel + width)
///ooc.Class für Actor benutzen!!!!
///tilemap rename tiles->coords index->tiles
//system vars von user vars trennen (underscore für sysvars???? this._rel_x)!!! (passiert zu oft daß man wichtige classvars pberschreibet weil man nicht dran denkt daß die schon existiert (und ich habs geschrieben!!!))
//////user vars in data objekt??
//svg parser!!!!!!! ooo.Vector ooo.SVG ??
//aufräumen!!!
//layout/positionsangaben angle etc vereinheitlichen
//keyboard input eingrenzen (keyset = {})
//retrieve constructor name on error

(function ()
{
	var DRAG_OFF = 3;

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

	function ascend (a, b)
	{
		return a - b;
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
		this.ignores = {};
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

	ooo.Actor.on('show', function (root, parent)
	{
		this.root = root;
	});

	/*ooo.Actor.method('on', function (type, func)
	{
		var channel = 'on';

		//does not work if prototype.events exists!!!!!!!!!!
		//if (!this.hasOwnProperty('events)
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
	});*/

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

	ooo.Actor.method('ignore', function ()
	{
		for (var i in arguments)
		{
			this.ignores[arguments[i]] = true;
		}

		return this;
	});

	ooo.Actor.method('listen', function ()
	{
		for (var i in arguments)
		{
			delete this.ignores[arguments[i]];
		}

		return this;
	});

	//Actor
	function triggerActor (child, channel, type, argv)
	{
		if (this.events && this.events[channel] && this.events[channel][type])
		{
			try
			{
				return this.events[channel][type].apply(child, argv);
			}
			catch (e)
			{
				this.ignore(type);
				console.log('ooo: exception in event for %s (%d)', '<todo: type of actor>', this.id);
				console.log('ooo: ignoring future events of type \'%s\'', type);
				console.log(this);
				console.log(e.toString());
				console.log(e.stack);
			}
		}
	}

	ooo.Actor.method('trigger', function (type, argv)
	{
		if (type in this.ignores)
		{
			return;
		}
		
		return triggerActor.call(this, this, 'on', type, argv);
	});

	ooo.Actor.method('hide', function ()
	{
		if (this.id == undefined)
		{
			return;
		}

		var layer = this.parent.children[this.layer];
		delete layer[this.id];

		if (ooc.size(layer) == 0)
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

	//Actor with image
	ooo.Sprite = ooo.Actor.extend(function (asset, index)
	{
		ooo.Actor.call(this);
		this.asset = asset;
		this.index = index;
	});

	ooo.Sprite.on('show', function (root, parent)
	{
		ooo.Actor.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
		this.resize(this.image.tile_w, this.image.tile_h);
	});

	ooo.Sprite.on('draw', function (time, context)
	{
		//context.drawImage(this.image, this.image.tile_x[this.index], this.image.tile_y[this.index], this.image.tile_w, this.image.tile_h, 0, 0, this.width, this.height);
		context.drawImage(this.image, this.image.tile_x[this.index], this.image.tile_y[this.index], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	//Automatically size-adjusting Actor
	ooo.Cell = ooo.Actor.extend(function (layout)
	{
		ooo.Actor.call(this);
		this.layout = layout || {'left': 0, 'right': 0, 'top': 0, 'bottom': 0};
	});

	ooo.Cell.method('arrange', function (layout)
	{
		this.layout = layout || {'left': 0, 'right': 0, 'top': 0, 'bottom': 0};

		//if (this.root && this.root.loaded)
		if (this.parent)
		{
			this.trigger('resize', [this.parent.width, this.parent.height]);
		}

		return this;
	});

	ooo.Cell.on('resize', function (width, height)
	{
		if (this.layout.width != undefined)
		{
			if (this.layout.horizontal != undefined)
			{
				var rel_x = Math.round(width / 100 * this.layout.horizontal) - (this.layout.width >>> 1);
			}
			else if (this.layout.left != undefined)
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
			if (this.layout.vertical != undefined)
			{
				var rel_y = Math.round(height / 100 * this.layout.vertical) - (this.layout.height >>> 1);
			}
			else if (this.layout.top != undefined)
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

	ooo.Text = ooo.Cell.extend(function (layout, color, font, alignment, baseline)//switch to oui.Button.extend
	{
		ooo.Cell.call(this, layout);
		this.color = color || '#f00';
		this.font = font || '12px sans-serif';
		this.alignment = alignment || 'start';
		this.baseline = baseline || 'top';
		this.string = "abc123";
	});

	ooo.Text.on('draw', function (time, context)
	{
		context.fillStyle = this.color;
		context.font = this.font;
		context.textAlign = this.alignment;
		context.textBaseline = this.baseline;
		context.fillText(this.string, 0, 0);
	});

	//Actor
	function hitActor3 (button, down_x, down_y, drag_x, drag_y)
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
		else
		{
			//this.listen('mouse_drag', 'mouse_drop');
			return [button, down_x, down_y, drag_x, drag_y];
		}
	}

	//Actor
	function hitActor (button, down_x, down_y)
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
		else
		{
			return [button, down_x, down_y];
		}
	}

	//Actor
	function hitActor2 (down_x, down_y)
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
		else
		{
			return [down_x, down_y];
		}
	}

	//Scene
	function triggerLayer (i, type, argv, bubble)
	{
		var lid = this.layers[i];
		var layer = this.children[lid];

		for (var id in layer)
		{
			var child = layer[id];
			var retv = triggerActor.call(this, child, 'prepare', type, argv);

			if (retv != false)
			{
				if (retv == null)
				{
					retv = argv;
				}

				if (child.trigger(type, retv, bubble) == false)
				{
					return false;
				}
			}

			triggerActor.call(this, child, 'cleanup', type, argv);
		}
	}

	//Container for actors
	ooo.Scene = ooo.Cell.extend(function (layout)
	{
		ooo.Cell.call(this, layout);
		this.scale_x = 1;
		this.scale_y = 1;
		this.data = {};
		this.children = [];
		this.layers = [];
	});

	ooo.Scene.method('put', function (value, key)
	{
		Array.prototype.splice.call(arguments, 1, 0, this.data);
		ooc.put.apply(null, arguments);
		this.trigger('update_' + key, [this.data[key]]);
	});

	ooo.Scene.method('add', function (value, key)
	{
		Array.prototype.splice.call(arguments, 1, 0, this.data);
		ooc.add.apply(null, arguments);
		this.trigger('update_' + key, [this.data[key]]);
	});

	ooo.Scene.method('push', function (value, key)
	{
		Array.prototype.splice.call(arguments, 1, 0, this.data);
		ooc.push.apply(null, arguments);
		this.trigger('update_' + key, [this.data[key]]);
	});

	ooo.Scene.method('delete', function (key)
	{
		Array.prototype.unshift.call(arguments, this.data);
		ooc.delete.apply(null, arguments);
		this.trigger('update_' + key, [this.data[key]]);
	});

	ooo.Scene.method('pop', function (key)
	{
		Array.prototype.unshift.call(arguments, this.data);
		ooc.pop.apply(null, arguments);
		this.trigger('update_' + key, [this.data[key]]);
	});

	ooo.Scene.method('hideChildren', function ()
	{
		for (var i = 0; i < this.layers.length; i++)
		{
			var lid = this.layers[i];
			var layer = this.children[lid];

			for (var id in layer)
			{
				var child = layer[id];
				delete child.id;
				delete child.layer;
				delete child.parent;
				delete child.root;
			}
		}

		this.children = [];
		this.layers = [];
		return this;
	});

	ooo.Scene.method('show', function (actor, layer)
	{
		if (layer == null)
		{
			layer = 0;
		}

		if (actor.id != undefined)
		{
			if ((layer in this.children) && (actor.id in this.children[layer]))
			{
				return;
			}
			else
			{
				actor.hide();
			}
		}

		if (!(layer in this.children))
		{
			this.children[layer] = {};
			//insert + sort could potentially be optimized
			this.layers.push(layer);
			this.layers.sort(ascend);
		}

		actor.id = ooc.fill(actor, this.children[layer]);
		actor.layer = layer;
		actor.parent = this;

		if (this.root && this.root.loaded)
		{
			actor.trigger('show', [this.root, this]);
			actor.trigger('resize', [this.width, this.height]);

			for (var key in this.data)
			{
				this.trigger('update_' + key, [this.data[key]]);
			}
		}

		return this;
	});

	ooo.Scene.method('trigger', function (type, argv, bubble)
	{
		if (type in this.ignores)
		{
			return;
		}

		var retv = triggerActor.call(this, this, 'on', type, argv);

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
					if (triggerLayer.call(this, i, type, retv, bubble) == false)
					{
						return false;
					}
				}
			}
			else
			{
				for (var i = 0; i < this.layers.length; i++)
				{
					if (triggerLayer.call(this, i, type, retv, bubble) == false)
					{
						return false;
					}
				}
			}
		}
		else
		{
			return false;
		}

		return triggerActor.call(this, this, 'bubble', type, argv);
	});

	ooo.Scene.prepare = addEvent('prepare');
	ooo.Scene.cleanup = addEvent('cleanup');
	ooo.Scene.bubble = addEvent('bubble');

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

	//layers komplett abschaffen? -> array also reihenfolge nicht undefined -> insert before after push, unshift//array id damit auch abschaffen
	//Actor
	ooo.Scene.prepare('mouse_down', hitActor);
	ooo.Scene.prepare('mouse_grab', hitActor3);
	ooo.Scene.prepare('mouse_click', hitActor);
	ooo.Scene.prepare('mouse_over', hitActor2);

	ooo.Scene.cleanup('draw', function (time, context)
	{
		context.restore();
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

	function loaded (root, asset, image)
	{
		return function ()
		{
			root.toload--;
			image.tile_w = asset.width || image.width;
			image.tile_h = asset.height || image.height;
			image.tile_x = [];
			image.tile_y = [];

			var cols = Math.floor(image.width / image.tile_w);
			var rows = Math.floor(image.height / image.tile_h);

			for (var y = 0; y < rows; y++)
			{
				for (var x = 0; x < cols; x++)
				{
					image.tile_x.push(x * image.tile_w);
					image.tile_y.push(y * image.tile_h);
				}
			}

			if (root.toload == 0)
			{
				root.loaded = true;
				root.trigger('show', [root, root]);
				root.trigger('resize', [root.width, root.height]);
			}
		}
	}

	//root actor to be embedded into html
	ooo.Root = ooo.Stage.extend(function (hook, color)
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
		this.assets = {};
		this.images = {};
	});

	ooo.Root.method('load', function (name, source, width, height)
	{
		this.assets[name] = {source: source, width: width, height: height};
	});

	ooo.Root.method('open', function ()
	{
		this.toload = ooc.size(this.assets);

		for (var name in this.assets)
		{
			var asset = this.assets[name];
			var image = new Image();
			image.onload = loaded(this, asset, image);
			image.src = asset.source;
			this.images[name] = image;
		}
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
		var down = false;
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
			down = true;
			that.trigger('mouse_down', [event.button, down_x, down_y], true);
		}

		function on_mousemove (event)
		{
			var over_x = event.clientX;
			var over_y = event.clientY;
			that.trigger('mouse_over', [over_x, over_y], true);

			if (down)
			{
				drag_x = over_x - down_x;
				drag_y = over_y - down_y;

				if (drag)
				{
					that.trigger('mouse_drag', [drag_x, drag_y], true);
				}
				else if ((Math.abs(drag_x) > DRAG_OFF) || (Math.abs(drag_y) > DRAG_OFF))
				{
					drag = true;
					that.trigger('mouse_grab', [event.button, down_x, down_y, drag_x, drag_y], true);
				}
			}
		}

		function on_mouseup (event)
		{
			down = false;

			if (drag)
			{
				drag = false;
				drag_x = 0;
				drag_y = 0;
				that.trigger('mouse_drop', [event.clientX, event.clientY], true);
			}
			else
			{
				that.trigger('mouse_click', [event.button, down_x, down_y], true);
			}
		}

		function on_mouseout (event)
		{
			/*if (down)
			{
				on_mouseup(event);
				//console.log('out', JSON.stringify(that));
			}*/
		}

		function on_keydown (event)
		{
			if (event.keyCode < 48)
			{
				event.preventDefault();
				that.trigger('input:press', [event.timeStamp, null, event.keyCode, event.shiftKey], true);
			}

			/*if (event.keyCode == 8 || event.keyCode == 9)
			{
				event.preventDefault();
			}*/
		}

		function on_keypress (event)
		{
			if (!event.ctrlKey && !event.altKey)
			{
				that.trigger('input:press', [event.timeStamp, String.fromCharCode(event.charCode), null, null], true);
			}
		}

		var argv = [0];
		var requestFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;

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
		this.canvas.addEventListener('mousemove', on_mousemove);
		this.canvas.addEventListener('mouseup', on_mouseup);
		this.canvas.addEventListener('mouseout', on_mouseout);
		window.addEventListener('keydown', on_keydown);
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

	ooo.Client = ooo.Root.extend(function (hook, color)
	{
		ooo.Root.call(this, hook, color);
		this.connected = false;
	});

	ooo.Client.method('open', function (url)
	{
		ooo.Root.prototype.open.call(this);
		this.sockjs = new SockJS(url);
		var that = this;

		this.sockjs.onopen = function ()
		{
			that.connected = true;
			that.trigger('socket:open');
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
			that.connected = false;
			that.trigger('socket:close', [message.code]);
		}
	});

	ooo.Client.method('send', function (type, data)
	{
		this.sockjs.send(JSON.stringify(Array.prototype.slice.call(arguments)));
	});
})();
