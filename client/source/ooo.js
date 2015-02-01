'use strict';
var ooo = {};
//////TODO
//block events globally
//ignore mouse_drag, mouse_drop by default and automatically listen on mouse_grab
///ignore again on mouse_drop
//functionality for STAGE: transition between multiple children stages (one inner mask + other outer mask -> mask expand/shrink)
//Textumbruch in ooo.Text()
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

	//Actor
	function triggerActor (actor, channel, type, argv)
	{
		if (this.events && this.events[channel] && this.events[channel][type])
		{
			try
			{
				return this.events[channel][type].apply(actor, argv);
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

	//Base type all others are derived from (not to be used directly)
	ooo.Actor = ooc.Class.extend(function ()
	{
		ooc.Class.call(this);
		this.rel_x = 0;
		this.rel_y = 0;
		this.scale_x = 1;
		this.scale_y = 1;
		this.mid_x = 0;
		this.mid_y = 0;
		this.width = 100;
		this.height = 100;
		this.alpha = 1;
		this.angle = 0;
		this.over = false;
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

	ooo.Actor.method('center', function (mid_x, mid_y)
	{
		this.mid_x = mid_x;
		this.mid_y = mid_y;
		return this;
	});

	ooo.Actor.method('rotate', function (angle)
	{
		this.angle = angle / 180 * Math.PI;
		return this;
	});

	ooo.Actor.method('trigger', function (type, argv)
	{
		if (type in this.ignores)
		{
			return;
		}
		else
		{
			return triggerActor.call(this, this, 'on', type, argv);
		}
	});

	ooo.Actor.method('hide', function ()
	{
		if (this.parent == undefined)
		{
			return;
		}

		this.parent.children[this.index] = undefined;
		delete this.index;
		delete this.parent;
		delete this.root;
	});

	ooo.Actor.on('show', function (root, parent)
	{
		this.root = root;
	});

	//Autoadjusting Actor
	ooo.Cell = ooo.Actor.extend(function (layout)
	{
		ooo.Actor.call(this);
		this.layout = layout || {left: 0, right: 0, top: 0, bottom: 0};
	});

	ooo.Cell.method('arrange', function (layout)
	{
		this.layout = layout || {left: 0, right: 0, top: 0, bottom: 0};

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
				var rel_x = Math.round(width / 100 * this.layout.horizontal) - (this.layout.width >> 1);
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
				var rel_y = Math.round(height / 100 * this.layout.vertical) - (this.layout.height >> 1);
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

	//Actor with image
	ooo.Sprite = ooo.Cell.extend(function (asset, type, layout)
	{
		ooo.Cell.call(this, layout);
		this.asset = asset;
		this.type = type;
	});

	ooo.Sprite.on('show', function (root, parent)
	{
		ooo.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
	});

	ooo.Sprite.on('draw', function (time, context)
	{
		context.drawImage(this.image, this.image.tile_x[this.type], this.image.tile_y[this.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	//Simple Textbox
	ooo.Text = ooo.Cell.extend(function (layout, color, font, alignment, baseline)//switch to oui.Button.extend
	{
		ooo.Cell.call(this, layout);
		this.color = color || '#f00';
		this.font = font || '10px sans-serif';
		this.alignment = alignment || 'start';//"start", "end", "left", "right", "center"
		this.baseline = baseline || 'top';//"top", "hanging", "middle", "alphabetic", "ideographic", "bottom"
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

	//Scene
	function triggerChild (actor, type, argv, topdown)
	{
		//return value of false means to skip this child (not stop all propagation)
		var retv = triggerActor.call(this, actor, 'prepare', type, argv);

		if (retv != false)
		{
			if (retv == null)
			{
				retv = argv;
			}

			retv = actor.trigger(type, retv, topdown);
		}
		else
		{
			retv = true;
		}

		if ((triggerActor.call(this, actor, 'cleanup', type, argv) == false) || (retv == false))
		{
			return false;
		}
	}

	//Cell containing other actors
	ooo.Scene = ooo.Cell.extend(function (layout)
	{
		ooo.Cell.call(this, layout);
		this.children = [];
		this.data = {};
	});

	delete ooo.Scene.on;
	ooo.Scene.capture = ooc.addEvent('capture');
	ooo.Scene.prepare = ooc.addEvent('prepare');
	ooo.Scene.cleanup = ooc.addEvent('cleanup');
	ooo.Scene.bubble = ooc.addEvent('bubble');

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

	ooo.Scene.method('show', function (actor, index)
	{
		if (actor.parent)
		{
			actor.hide();
		}

		if (this.children[index])
		{
			this.children[index].hide();
		}

		this.children[index] = actor;
		actor.index = index;
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

	ooo.Scene.method('trigger', function (type, argv, topdown)
	{
		var retv = triggerActor.call(this, this, 'capture', type, argv);

		if (retv != false)
		{
			if (retv == null)
			{
				retv = argv;
			}

			if (topdown)
			{
				for (var i = (this.children.length - 1); i >= 0; i--)
				{
					var actor = this.children[i];

					if ((actor != undefined) && !(type in actor.ignores))
					{
						var stop = triggerChild.call(this, actor, type, retv, topdown);

						if (stop == false)
						{
							break;
						}
					}
				}
			}
			else
			{
				for (var i = 0; i < this.children.length; i++)
				{
					var actor = this.children[i];

					if ((actor != undefined) && !(type in actor.ignores))
					{
						var stop = triggerChild.call(this, actor, type, retv, topdown);

						if (stop == false)
						{
							break;
						}
					}
				}
			}
		}

		if ((triggerActor.call(this, this, 'bubble', type, argv) == false) || (retv == false) || (stop == false))
		{
			return false;
		}
	});

	ooo.Scene.capture('show', function (root, parent)
	{
		ooo.Cell.prototype.events.on.show.call(this, root, parent);
		return [root, this];
	});

	ooo.Scene.capture('resize', function (width, height)
	{
		ooo.Cell.prototype.events.on.resize.call(this, width, height);
		return [this.width, this.height];
	});

	ooo.Scene.prepare('mouse_grab', function (button, down_x, down_y, drag_x, drag_y)
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
			return [button, down_x, down_y, drag_x, drag_y];
		}
	});

	ooo.Scene.prepare(['mouse_down', 'mouse_click'], function (button, down_x, down_y)
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
	});

	ooo.Scene.prepare('mouse_move', function (down_x, down_y)
	{
		var shift_x = down_x - this.rel_x - this.mid_x;
		var shift_y = down_y - this.rel_y - this.mid_y;
		var angle = -this.angle;
		down_x = (shift_x * Math.cos(angle) - shift_y * Math.sin(angle)) + this.mid_x;
		down_y = (shift_x * Math.sin(angle) + shift_y * Math.cos(angle)) + this.mid_y;

		if ((down_x < 0) || (down_y < 0) || (down_x >= this.width) || (down_y >= this.height))
		{
			if (this.over)
			{
				this.trigger('mouse_out', [down_x, down_y], true);
				this.over = false;
			}
		}
		else
		{
			if (!this.over)
			{
				this.trigger('mouse_over', [down_x, down_y], true);
				this.over = true;
			}
		}

		return [down_x, down_y];
	});

	ooo.Scene.prepare('draw', function (time, context)
	{
		context.save();
		context.globalAlpha = this.alpha;
		context.scale(this.scale_x, this.scale_y);
		context.translate(this.rel_x + this.mid_x, this.rel_y + this.mid_y);
		context.rotate(this.angle);
		context.translate(-this.mid_x, -this.mid_y);
	});

	ooo.Scene.cleanup('draw', function (time, context)
	{
		context.restore();
	});

	//STAGE Scene with own canvas
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

	ooo.Stage.capture('draw', function (time, context)
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
				delete root.toload;
				root.loaded = true;
				root.trigger('show', [root, root]);
				root.trigger('resize', [root.width, root.height]);
			}
		}
	}

	/*EDIT FORM
	  	CLASS
		  type (name)
		PARAM
		  argv (je nach klasse; this.param = {name: ['size', 'color', 'assets'], type: [COUNT, OPTION, SWITCH, ARRAY] (corresponds to input types!)})
	  	LAYOUT
		  horizontal (Counter 0-100)
		  vertical (Counter 0-100)
		  width (Counter 1-parent.size) oder undefined
		  height (Counter 1-parent.size) oder undefined
		  left (0-parent.size-1)
		  right (0-parent.size-1)
		  top (0-parent.size-1)
		  bottom (0-parent.size-1)
	 	LISTENERS
		  "on mouse_click"
		  channel [[on], [capture, prepare, cleanup, bubble]]
		  type
		  func
		METHODS
		  "name1"
		    func
		  "name2"
		    func
		EXTEND
		  class
		  name
		  param {name, type}
		CLONE (provides possibility of having same class with different behaviour)
		  class
		  name
	 */

	//ROOT Stage to be embedded into html
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
		var toload = ooc.size(this.assets);

		if (toload > 0)
		{
			this.toload = toload;

			for (var name in this.assets)
			{
				var asset = this.assets[name];
				var image = new Image();
				image.onload = loaded(this, asset, image);
				image.src = asset.source;
				this.images[name] = image;
			}
		}
		else
		{
			this.loaded = true;
			this.trigger('show', [this, this]);
			this.trigger('resize', [this.width, this.height]);
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

	ooo.Root.capture('show', function (root, parent)
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
			down = true;
			down_x = event.clientX;
			down_y = event.clientY;
			that.trigger('mouse_down', [event.button, down_x, down_y], true);
		}

		function on_mousemove (event)
		{
			var move_x = event.clientX;
			var move_y = event.clientY;
			that.trigger('mouse_move', [move_x, move_y], true);

			if (down)
			{
				drag_x = move_x - down_x;
				drag_y = move_y - down_y;

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
				that.trigger('key_press', [event.timeStamp, null, event.keyCode, event.shiftKey], true);
				//console.log('down', event.keyCode);
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
				that.trigger('key_press', [event.timeStamp, String.fromCharCode(event.charCode), null, null], true);
				//console.log('press', String.fromCharCode(event.charCode));
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

	ooo.Root.capture('hide', function ()
	{
		var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame;
		cancel(this.request_id);

		/*this.canvas.removeEventListener('mousedown', on_mousedown);
		this.canvas.removeEventListener('mousemove', on_mousemove);
		this.canvas.removeEventListener('mouseup', on_mouseup);
		this.canvas.removeEventListener('mouseout', on_mouseout);
		window.removeEventListener('keydown', on_keydown);
		window.removeEventListener('keypress', on_keypress);
		window.removeEventListener('resize', on_resize);*/
	});

	/*ooo.Root.capture('key_press', function (time, char, key, shift)
	{
		console.log(time, char, key, shift);
	});*/

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
			that.trigger('socket_open');
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

			var type = 'message_' + data[0];
			that.trigger(type, data[1]);
		}

		this.sockjs.onclose = function (message)
		{
			that.connected = false;
			that.trigger('socket_close', [message.code]);
		}
	});

	ooo.Client.method('send', function (type, data)
	{
		this.sockjs.send(JSON.stringify(Array.prototype.slice.call(arguments)));
	});
})();
