'use strict';
var ooo = {};
//////TODO
//removeEvents in root.hide()
//reset blink on input field tab jump (and on char input)
//besseres exception handling?
//root load with xmlhttprequests (load based on fileext?? if not recognized load as binary)
//block events globally
//ignore mouse_drag, mouse_drop by default and automatically listen on mouse_grab
///ignore again on mouse_drop
//functionality for STAGE: transition between multiple children stages (one inner mask + other outer mask -> mask expand/shrink)
//Textumbruch in ooo.Text()
//system vars von user vars trennen (underscore für sysvars???? this._rel_x)!!! (passiert zu oft daß man wichtige classvars pberschreibet weil man nicht dran denkt daß die schon existiert (und ich habs geschrieben!!!))
//////user vars in data objekt??
//svg parser!!!!!!! ooo.Vector ooo.SVG ??
//aufräumen!!!
//keyboard input eingrenzen (keyset = {})
//retrieve constructor name on error
var OOO_BOTTOM = 1;
var OOO_REVERSED = 2;
var OOO_VERTICAL = 4;

var OOO_ENTER = 13;
var OOO_TAB = 9;
var OOO_BACKSPACE = 8;
var OOO_CTRL = 17;
var OOO_ALT = 18;
var OOO_SPACE = 32;
var OOO_LEFT = 37;
var OOO_RIGHT = 39;
var OOO_DELETE = 46;

(function ()
{
	var DRAG_OFF = 3;

	ooo.core = {};
	ooo.input = {};
	ooo.extra = {};
	//ooo.custom = {};

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
	ooo.core.Actor = ooc.Class.extend(function ()
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

	ooo.core.Actor.method('place', function (rel_x, rel_y)
	{
		this.rel_x = rel_x;
		this.rel_y = rel_y;
		return this;
	});

	ooo.core.Actor.method('resize', function (width, height)
	{
		this.width = width;
		this.height = height;
		return this;
	});

	ooo.core.Actor.method('center', function (mid_x, mid_y)
	{
		this.mid_x = mid_x;
		this.mid_y = mid_y;
		return this;
	});

	ooo.core.Actor.method('rotate', function (angle)
	{
		this.angle = angle / 180 * Math.PI;
		return this;
	});

	/*ooo.core.Actor.method('rebase', function (parent_x, parent_y)
	{
		var shift_x = parent_x - this.rel_x - this.mid_x;
		var shift_y = parent_y - this.rel_y - this.mid_y;
		var angle = -this.angle;
		var object = {};
		object.rel_x = (shift_x * Math.cos(angle) - shift_y * Math.sin(angle)) + this.mid_x;
		object.rel_y = (shift_x * Math.sin(angle) + shift_y * Math.cos(angle)) + this.mid_y;
		return object;
	});*/

	ooo.core.Actor.method('trigger', function (type, argv)
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

	ooo.core.Actor.method('hide', function ()
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

	ooo.core.Actor.on('show', function (root, parent)
	{
		this.root = root;
	});

	//Autoadjusting Actor
	ooo.core.Cell = ooo.core.Actor.extend(function (layout)
	{
		ooo.core.Actor.call(this);
		this.layout = layout || {left: 0, right: 0, top: 0, bottom: 0};
	});

	ooo.core.Cell.method('arrange', function (layout)
	{
		this.layout = layout || {left: 0, right: 0, top: 0, bottom: 0};

		//if (this.root && this.root.loaded)
		if (this.parent)
		{
			this.trigger('resize', [this.parent.width, this.parent.height]);
		}

		return this;
	});

	ooo.core.Cell.on('resize', function (width, height)
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
	ooo.core.Box = ooo.core.Cell.extend(function (color, layout)
	{
		ooo.core.Cell.call(this, layout);
		this.color = color;
	});

	ooo.core.Box.on('draw', function (time, context)
	{
		context.fillStyle = this.color;
		context.fillRect(0, 0, this.width, this.height);
	});

	//Simple image
	ooo.core.Sprite = ooo.core.Cell.extend(function (asset, type, layout)
	{
		ooo.core.Cell.call(this, layout);
		this.asset = asset;
		this.type = type;
	});

	ooo.core.Sprite.on('show', function (root, parent)
	{
		ooo.core.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
	});

	ooo.core.Sprite.on('draw', function (time, context)
	{
		context.drawImage(this.image, this.image.tile_x[this.type], this.image.tile_y[this.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	//Simple Textbox
	ooo.core.Text = ooo.core.Cell.extend(function (layout, color, font, alignment, baseline)//switch to ooo.core.Button.extend
	{
		ooo.core.Cell.call(this, layout);
		this.color = color || '#f00';
		this.font = font || '10px sans-serif';
		this.alignment = alignment || 'start';//"start", "end", "left", "right", "center"
		this.baseline = baseline || 'top';//"top", "hanging", "middle", "alphabetic", "ideographic", "bottom"
		this.string = "abc123";
	});

	ooo.core.Text.on('draw', function (time, context)
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

		if ((retv != false) && (retv != true))
		{
			if (retv == null)
			{
				retv = argv;
			}

			retv = actor.trigger(type, retv, topdown);
		}

		if ((triggerActor.call(this, actor, 'cleanup', type, argv) == false) || (retv == false))
		{
			return false;
		}
	}

	//Container for other actors
	ooo.core.Scene = ooo.core.Cell.extend(function (layout)
	{
		ooo.core.Cell.call(this, layout);
		this.children = [];
		this.data = {};
	});

	delete ooo.core.Scene.on;
	ooo.core.Scene.capture = ooc.addEvent('capture');
	ooo.core.Scene.prepare = ooc.addEvent('prepare');
	ooo.core.Scene.cleanup = ooc.addEvent('cleanup');
	ooo.core.Scene.bubble = ooc.addEvent('bubble');

	ooo.core.Scene.method('put', function (value, key)
	{
		Array.prototype.splice.call(arguments, 1, 0, this.data);
		ooc.put.apply(null, arguments);
		this.trigger('update_' + key, [this.data[key]]);
	});

	ooo.core.Scene.method('add', function (value, key)
	{
		Array.prototype.splice.call(arguments, 1, 0, this.data);
		ooc.add.apply(null, arguments);
		this.trigger('update_' + key, [this.data[key]]);
	});

	ooo.core.Scene.method('push', function (value, key)
	{
		Array.prototype.splice.call(arguments, 1, 0, this.data);
		ooc.push.apply(null, arguments);
		this.trigger('update_' + key, [this.data[key]]);
	});

	ooo.core.Scene.method('delete', function (key)
	{
		Array.prototype.unshift.call(arguments, this.data);
		ooc.delete.apply(null, arguments);
		this.trigger('update_' + key, [this.data[key]]);
	});

	ooo.core.Scene.method('pop', function (key)
	{
		Array.prototype.unshift.call(arguments, this.data);
		ooc.pop.apply(null, arguments);
		this.trigger('update_' + key, [this.data[key]]);
	});

	ooo.core.Scene.method('empty', function ()
	{
		for (var i = 0; i < this.children.length; i++)
		{
			this.children[i].hide();
		}

		this.children = [];
		return this;
	});

	ooo.core.Scene.method('show', function (actor, index)
	{
		if (actor.parent != undefined)
		{
			actor.hide();
		}

		if (index == null)
		{
			index = this.children.length;
		}
		else if (this.children[index])
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

	ooo.core.Scene.method('trigger', function (type, argv, topdown)
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

	ooo.core.Scene.capture('show', function (root, parent)
	{
		ooo.core.Cell.prototype.events.on.show.call(this, root, parent);
		return [root, this];
	});

	ooo.core.Scene.capture('resize', function (width, height)
	{
		ooo.core.Cell.prototype.events.on.resize.call(this, width, height);
		return [this.width, this.height];
	});

	ooo.core.Scene.prepare('draw', function (time, context)
	{
		context.save();
		context.globalAlpha = this.alpha;
		context.scale(this.scale_x, this.scale_y);
		context.translate(this.rel_x + this.mid_x, this.rel_y + this.mid_y);
		context.rotate(this.angle);
		context.translate(-this.mid_x, -this.mid_y);
		context.save();
	});

	ooo.core.Scene.prepare('mouse_move', function (down_x, down_y)
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

	/*ooo.core.Scene.prepare('mouse_down', function (button, down_x, down_y)
	{
		var shift_x = down_x - this.rel_x - this.mid_x;
		var shift_y = down_y - this.rel_y - this.mid_y;
		var angle = -this.angle;
		down_x = (shift_x * Math.cos(angle) - shift_y * Math.sin(angle)) + this.mid_x;
		down_y = (shift_x * Math.sin(angle) + shift_y * Math.cos(angle)) + this.mid_y;

		if ((down_x < 0) || (down_y < 0) || (down_x >= this.width) || (down_y >= this.height))
		{
			return true;
		}
		else
		{
			return [button, down_x, down_y];
		}
	});*/

	ooo.core.Scene.prepare('mouse_grab', function (button, down_x, down_y, drag_x, drag_y)
	{
		var shift_x = down_x - this.rel_x - this.mid_x;
		var shift_y = down_y - this.rel_y - this.mid_y;
		var angle = -this.angle;
		down_x = (shift_x * Math.cos(angle) - shift_y * Math.sin(angle)) + this.mid_x;
		down_y = (shift_x * Math.sin(angle) + shift_y * Math.cos(angle)) + this.mid_y;

		if ((down_x < 0) || (down_y < 0) || (down_x >= this.width) || (down_y >= this.height))
		{
			return true;
		}
		else
		{
			return [button, down_x, down_y, drag_x, drag_y];
		}
	});

	ooo.core.Scene.prepare('mouse_click', function (button, down_x, down_y)
	{
		var shift_x = down_x - this.rel_x - this.mid_x;
		var shift_y = down_y - this.rel_y - this.mid_y;
		var angle = -this.angle;
		down_x = (shift_x * Math.cos(angle) - shift_y * Math.sin(angle)) + this.mid_x;
		down_y = (shift_x * Math.sin(angle) + shift_y * Math.cos(angle)) + this.mid_y;

		if ((down_x < 0) || (down_y < 0) || (down_x >= this.width) || (down_y >= this.height))
		{
			return true;
		}
		else if (this.root.modify)
		{
			//this.root.show(this.root.edit_menu);
			console.log('MENU_MAIN');
			return false;
		}
		else
		{
			return [button, down_x, down_y];
		}
	});

	ooo.core.Scene.cleanup('draw', function (time, context)
	{
		context.restore();

		if (this.root.modify)
		{
			/*if (this.over)
			{
				context.strokeStyle = '#f00';
			}*/

			context.strokeRect(0, 0, this.width, this.height);
		}

		context.restore();
	});

	//Scene with own canvas to draw on
	ooo.core.Stage = ooo.core.Scene.extend(function (fill_style, layout)
	{
		ooo.core.Scene.call(this, layout);
		this.fill_style = fill_style || '#444';
		this.stroke_style = '#ccc';
		this.line_width = 2;
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		this.update = true;
		this.once = false;
	});

	ooo.core.Stage.method('resize', function (width, height)
	{
		this.width = this.canvas.width = width;
		this.height = this.canvas.height = height;
		this.context.fillStyle = this.fill_style;
		this.context.strokeStyle = this.stroke_style;
		this.context.lineWidth = this.line_width;
		return this;
	});

	ooo.core.Stage.method('clear', function ()
	{
		//just one method to clear the canvas (there are others)
		this.canvas.width = this.canvas.width;
		this.context.fillStyle = this.fill_style;
		this.context.strokeStyle = this.stroke_style;
		this.context.lineWidth = this.line_width;
		return this;
	});

	ooo.core.Stage.method('refresh', function ()
	{
		this.update = false;
		this.once = true;
		return this;
	});

	ooo.core.Stage.method('fill', function (color)
	{
		this.context.save();
		this.context.fillStyle = color;
		this.context.fillRect(0, 0, this.width, this.height);
		this.context.restore();
	});

	ooo.core.Stage.capture('draw', function (time, context)
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

	ooo.core.Stage.bubble('draw', function (time, context)
	{
		if (context)
		{
			context.drawImage(this.canvas, 0, 0);
		}
	});

	var TMPL_PARAM = ['name', 'super', 'info', 'args', 'init', 'methods', 'events'];
	var INST_PARAM = ['name', 'template', 'argv', 'children'];

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

	function extendActor (template)//als actor method? oder sogar ooc.Class? (das ist nichts Actor spezifisches)
	{
		var Parent = ooc.resolve(ooo, template.super);
		var argv = template.args.map(function (value) { return value[1] });
		argv.push(template.init.replace('Super', 'ooo.' + template.super));
		var init = new (ooc.Wrap(Function, argv));

		var Child = Parent.extend(function ()
		{
			init.apply(this, arguments);
		});

		for (var name in template.methods)
		{
			Child.method(name, new (ooc.Wrap(Function, template.methods[name])));
		}

		for (var channel in template.events)
		{
			for (var type in template.events[channel])
			{
				Child[channel](type, new (ooc.Wrap(Function, template.events[channel][type])));
			}
		}

		Child.prototype.template = template;
		var argv = template.name.split('.');
		argv.unshift(Child, ooo);
		ooc.put.apply(null, argv);
	}

	function cloneActor (template)
	{
	}

	function showActors (parent, instances)
	{
		for (var i = 0; i < instances.length; i++)
		{
			var instance = ooc.map(INST_PARAM, instances[i]);
			var func = ooc.resolve(ooo, instance.template);
			var actor = new (ooc.Wrap(func, instance.argv));
			actor.instance = instance;
			parent.show(actor, i);

			if (instance.children != undefined)
			{
				showActors(actor, instance.children);
			}
		}
	}

	//Stage to be embedded into html
	ooo.core.Root = ooo.core.Stage.extend(function (hook, core, fill_style)
	{
		ooo.core.Stage.call(this, fill_style);
		this.fullscreen = false;
		this.loaded = false;
		this.modify = false;
		this.assets = {};
		this.images = {};
		this.root = this;
		this.canvas.style.position = 'absolute';
		this.canvas.focus();
		this.hook = hook;
		this.hook.style.overflow = 'hidden';
		this.hook.appendChild(this.canvas);
		this.resize(hook.clientWidth, hook.clientHeight);
		this.context.setLineDash([7, 7]);
		this.context.strokeStyle = '#aaa';
		this.context.fillStyle = this.color;
		this.context.fillRect(0, 0, this.width, this.height);

		for (var i = 0; i < core.assets.length; i++)
		{
			this.load.apply(this, core.assets[i]);
		}

		for (var i = 0; i < core.templates.length; i++)
		{
			var template = ooc.map(TMPL_PARAM, core.templates[i]);
			extendActor(template);
		}

		showActors(this, core.instances);
	});

	ooo.core.Root.method('load', function (name, source, width, height)
	{
		this.assets[name] = {source: source, width: width, height: height};
	});

	ooo.core.Root.method('open', function ()
	{
		var toload = ooc.size(this.assets);

		if (toload > 0)
		{
			this.toload = toload;

			if (true)
			{
				for (var name in this.assets)
				{
					var asset = this.assets[name];
					var image = new Image();
					image.onload = loaded(this, asset, image);
					image.src = asset.source;
					this.images[name] = image;
				}
			}
			else if (false)
			{
				for (var name in this.assets)
				{
					var asset = this.assets[name];
					var request = new XMLHttpRequest();
					request.onload = loadedText(this, asset);
					//request.responseType = "arraybuffer";//'json', 'text'
					request.open('get', asset.source, true);
					request.send();
				}
			}
		}
		else
		{
			this.loaded = true;
			this.trigger('show', [this, this]);
			this.trigger('resize', [this.width, this.height]);
		}
	});

	ooo.core.Root.method('toggle', function ()
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

	ooo.core.Root.capture('show', function (root, parent)
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
			that.trigger('mouse_up', [event.button, event.clientX, event.clientY], true);

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
				//console.log('down', event.keyCode)
				event.preventDefault();
				that.trigger('key_press', [event.timeStamp, null, event.keyCode, event.shiftKey], true);
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
				//console.log('press', String.fromCharCode(event.charCode));
				that.trigger('key_press', [event.timeStamp, String.fromCharCode(event.charCode), null, null], true);
			}
		}

		function on_keyup (event)
		{
			if (event.keyCode < 48)
			{
				event.preventDefault();
				that.trigger('key_release', [event.timeStamp, null, event.keyCode, event.shiftKey], true);
				//console.log('down', event.keyCode);
			}

			/*if (event.keyCode == 8 || event.keyCode == 9)
			{
				event.preventDefault();
			}*/
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
		window.addEventListener('keyup', on_keyup);
		window.addEventListener('resize', on_resize);
		this.request_id = requestFrame(on_draw);
	});

	ooo.core.Root.capture('hide', function ()
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

	ooo.core.Root.capture('key_press', function (time, char, key, shift)
	{
		if (key == OOO_CTRL)
		{
			this.modify = true;
		}
	});

	ooo.core.Root.capture('key_release', function (time, char, key, shift)
	{
		if (key == OOO_CTRL)
		{
			this.modify = false;
		}
	});

	ooo.core.Client = ooo.core.Root.extend(function (hook, color)
	{
		ooo.core.Root.call(this, hook, color);
		this.connected = false;
	});

	ooo.core.Client.method('open', function (url)
	{
		ooo.core.Root.prototype.open.call(this);
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

	ooo.core.Client.method('send', function (type, data)
	{
		this.sockjs.send(JSON.stringify(Array.prototype.slice.call(arguments)));
	});

	ooo.core.Menu = ooo.core.Cell.extend(function (asset, data, layout, style)
	{
		ooo.core.Cell.call(this, layout);
		this.asset = asset;
		this.data = data;
		this.style = style || 0;
		this.pick = {};
	});

	ooo.core.Menu.method('reset', function (data, pick)
	{
		this.data = data;
		this.pick = {};

		if (pick)
		{
			for (var i = 0; i < pick.length; i++)
			{
				this.pick[i] = true;
			}
		}

		return this;
	});

	ooo.core.Menu.method('drawButton', function (time, context, data, pick)
	{
		if (pick)
		{
			context.fillStyle = '#f00';
			context.fillRect(0, 0, this.image.tile_w, this.image.tile_h);
		}
		else
		{
			context.drawImage(this.image, this.image.tile_x[data], this.image.tile_y[data], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
		}
	});

	ooo.core.Menu.method('preparePick', function (data, index)
	{
		return [data, index];
	});

	ooo.core.Menu.on('show', function (root, parent)
	{
		ooo.core.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
	});

	ooo.core.Menu.on('resize', function (width, height)
	{
		ooo.core.Cell.prototype.events.on.resize.call(this, width, height);
		this.cols = Math.floor(this.width / this.image.tile_w);
		this.rows = Math.floor(this.height / this.image.tile_h);

		if (this.style & OOO_VERTICAL)
		{
			this.shift_x = 0;
			this.break_y = 0;
			this.line_br = this.rows;

			if (this.style & OOO_REVERSED)
			{
				this.init_x = this.width - this.image.tile_w;
				this.break_x = -this.image.tile_w;
			}
			else
			{
				this.init_x = 0;
				this.break_x = this.image.tile_w;
			}

			if (this.style & OOO_BOTTOM)
			{
				this.init_y = this.height - this.image.tile_h;
				this.shift_y = -this.image.tile_h;
			}
			else
			{
				this.init_y = 0;
				this.shift_y = this.image.tile_h;
			}
		}
		else
		{
			this.shift_y = 0;
			this.break_x = 0;
			this.line_br = this.cols;

			if (this.style & OOO_REVERSED)
			{
				this.init_x = this.width - this.image.tile_w;
				this.shift_x = -this.image.tile_w;
			}
			else
			{
				this.init_x = 0;
				this.shift_x = this.image.tile_w;
			}

			if (this.style & OOO_BOTTOM)
			{
				this.init_y = this.height - this.image.tile_h;
				this.break_y = -this.image.tile_h;
			}
			else
			{
				this.init_y = 0;
				this.break_y = this.image.tile_h;
			}
		}
	});

	//max_lines bestimmen und bei überschreitung neue seite oder so!!!???
	ooo.core.Menu.on('draw', function (time, context)
	{
		context.translate(this.init_x, this.init_y);
		context.save();

		for (var i = 0; i < this.data.length;)
		{
			context.save();
			this.drawButton(time, context, this.data[i], this.pick[i]);
			context.restore();
			context.translate(this.shift_x, this.shift_y);
			i++;

			if ((i % this.line_br) == 0)
			{
				context.restore();
				context.translate(this.break_x, this.break_y);
				context.save();
			}
		}
		
		context.restore();
	});

	ooo.core.Menu.on('mouse_click', function (button, down_x, down_y)
	{
		if (this.style & OOO_BOTTOM)
		{
			var row = Math.floor((this.height - down_y) / this.image.tile_h);
		}
		else
		{
			var row = Math.floor(down_y / this.image.tile_h);
		}

		if (this.style & OOO_REVERSED)
		{
			var col = Math.floor((this.width - down_x) / this.image.tile_w);
		}
		else
		{
			var col = Math.floor(down_x / this.image.tile_w);
		}

		if (this.style & OOO_VERTICAL)
		{
			var index = col * this.rows + row;
		}
		else
		{
			var index = row * this.cols + col;
		}

		if ((this.data[index] != undefined) && (col < this.cols) && (row < this.rows))
		{
			var argv = this.preparePick(this.data[index], index);
			this.trigger('pick_item', argv);
			return false;
		}
	});

	ooo.core.Form = ooo.core.Scene.extend(function (args, layout, color, font, align, baseline)
	{
		ooo.core.Scene.call(this, layout);
		this.color = color || ['#f00', '#377'];
		this.font = font || '18px sans-serif';
		this.align = align || 'start';
		this.baseline = baseline || 'top';

		for (var i = 0; i < args.length; i++)
		{
			var actor = new (ooc.Wrap(ooo.input[args[i][0]], args[i][1]));
			this.show(actor);
		}
	});

	ooo.core.Form.method('show', function (actor, index)
	{
		ooo.core.Scene.prototype.show.call(this, actor, index);

		//focus on first input added
		if ((this.focus == undefined) && (actor instanceof ooo.core.Input))
		{
			this.focus = actor;
			actor.trigger('form_focus', [true]);
		}

		return this;
	});

	ooo.core.Form.method('reset', function ()
	{
		this.focus.trigger('form_focus', [false]);
		delete this.focus;

		for (var index = 0; index < this.children.length; index++)
		{
			var actor = this.children[index];

			if ((actor != undefined) && (actor instanceof ooo.core.Input))
			{
				this.focus = actor;
				actor.trigger('form_focus', [true]);
				break;
			}
		}

		this.trigger('form_reset');
	});

	ooo.core.Form.capture('draw', function (time, context)//erzeugt komischen glitch (in firefox) beim öffnen der js-konsole (F12) (verschwindet wenn context.font auskommentiert wird
	{
		context.font = this.font;
		context.textAlign = this.align;
		context.textBaseline = this.baseline;
	});

	ooo.core.Form.capture('key_press', function (time, char, key, shift)
	{
		if (key == OOO_ENTER)
		{
			this.trigger('form_submit', [null, {}]);
			return false;
		}
		else if (key == OOO_TAB)
		{
			this.focus.trigger('form_focus', [false]);
			var index = this.focus.index;
			var length = this.children.length;

			do
			{
				index = ooc.wrap(shift ? index - 1 : index + 1, length);
				this.focus = this.children[index];
			}
			while (!(this.focus instanceof ooo.core.Input))

			this.focus.trigger('form_focus', [true]);
			return false;
		}
	});

	ooo.core.Form.prepare('draw', function (time, context)
	{
		ooo.core.Scene.prototype.events.prepare.draw.call(this, time, context);
		context.fillStyle = this.parent.color[this.focused ? 1 : 0];
	});

	ooo.core.Form.prepare('key_press', function (time, char, key, shift)
	{
		if (this.parent.focus != this)
		{
			return true;
		}
	});

	ooo.core.Form.bubble('form_submit', function (type, data)
	{
		console.log('EVENT: form_submit %s %s', type, JSON.stringify(data));
	});

	ooo.core.Input = ooo.core.Cell.extend(function (name, layout)
	{
		ooo.core.Cell.call(this, layout);
		this.name = name;
		this.focused = false;
	});

	ooo.core.Input.on('mouse_click', function (button, down_x, down_y)
	{
		this.parent.focus.trigger('form_focus', [false]);
		this.parent.focus = this;
		this.trigger('form_focus', [true]);
	});

	ooo.core.Input.on('form_focus', function (focused)
	{
		this.focused = focused;
	});

	ooo.input.Button = ooo.core.Input.extend(function (name, asset, type, layout)
	{
		ooo.core.Input.call(this, name, layout);
		this.asset = asset;
		this.type = type;
	});

	ooo.input.Button.on('show', function (root, parent)
	{
		ooo.core.Input.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
	});

	ooo.input.Button.on('draw', function (time, context)
	{
		if (this.focused)
		{
			context.drawImage(this.image, this.image.tile_x[this.type], this.image.tile_y[this.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
		}
		else
		{
			context.drawImage(this.image, this.image.tile_x[this.type], this.image.tile_y[this.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
		}
	});

	ooo.input.Reset = ooo.input.Button.clone();

	ooo.input.Reset.on('mouse_click', function (button, down_x, down_y)
	{
		ooo.input.Button.prototype.events.on.mouse_click.call(this, button, down_x, down_y);
		this.parent.trigger('form_reset', [this.name]);
		return false;
	});

	ooo.input.Submit = ooo.input.Button.clone();

	ooo.input.Submit.on('mouse_click', function (button, down_x, down_y)
	{
		ooo.input.Button.prototype.events.on.mouse_click.call(this, button, down_x, down_y);
		this.parent.trigger('form_submit', [this.name, {}]);
		return false;
	});

	ooo.input.String = ooo.core.Input.extend(function (name, init, layout)//alphabet
	{
		ooo.core.Input.call(this, name, layout);
		this.init = init;
		ooo.input.String.prototype.events.on.form_reset.call(this);
	});

	/*ooo.input.String.on('form_focus', function (focused)
	{
		ooo.core.Input.prototype.events.on.form_focus.call(this, focused);
	});*/

	ooo.input.String.on('form_reset', function ()
	{
		this.string = this.init;
		this.caret = this.string.length;
		this.chars = this.string.split('');
		this.substr = this.string.substr(0, this.caret);
	});

	ooo.input.String.on('form_submit', function (name, data)
	{
		ooc.push(this.string, data, this.name);
	});

	ooo.input.String.on('key_press', function (time, char, key, shift)
	{
		if (key == OOO_BACKSPACE)
		{
			if (this.caret > 0)
			{
				this.caret--;
				this.chars.splice(this.caret, 1);
			}
		}
		else if (key == OOO_DELETE)
		{
			if (this.caret < this.chars.length)
			{
				this.chars.splice(this.caret, 1);
			}
		}
		else if (key == OOO_LEFT)
		{
			if (this.caret > 0)
			{
				this.caret--;
			}
		}
		else if (key == OOO_RIGHT)
		{
			if (this.caret < this.chars.length)
			{
				this.caret++;
			}
		}
		else if (key == OOO_SPACE)
		{
			this.chars.splice(this.caret, 0, ' ');
			this.caret++;
		}
		else if (char)
		{
			this.chars.splice(this.caret, 0, char);
			this.caret++;
		}
		else
		{
			return;
		}

		this.string = this.chars.join('');
		this.substr = this.string.substr(0, this.caret);
		this.blink = time;
	});

	ooo.input.String.on('draw', function (time, context)
	{
		context.fillText(this.string, 0, 0);

		if (this.focused && ((time % 2000) < 1300))//caret blink
		{
			context.fillRect(context.measureText(this.substr).width, 0, this.height >>> 3, this.height);
		}
	});

	ooo.input.Integer = ooo.core.Input.extend(function (name, min, max, init, layout)
	{
		ooo.core.Input.call(this, name, layout);
		this.min = min;
		this.max = max;
		this.init = init;
		ooo.input.Integer.prototype.events.on.form_reset.call(this);
	});

	ooo.input.Integer.on('form_reset', function ()
	{
		this.value = this.init;
	});

	ooo.input.Integer.on('form_submit', function (name, data)
	{
		ooc.push(this.value, data, this.name);
	});

	ooo.input.Integer.on('mouse_click', function (button, down_x, down_y)
	{
		ooo.core.Input.prototype.events.on.mouse_click.call(this, button, down_x, down_y);

		if (down_x < (this.width >>> 1))
		{
			if (this.value > this.min)
			{
		 		this.value--;
			}
			else
			{
		 		this.value = this.max;
			}
		}
		else
		{
			if (this.value < this.max)
			{
		 		this.value++;
			}
			else
			{
		 		this.value = this.min;
			}
		}
	});

	ooo.input.Integer.on('key_press', function (time, char, key, shift)
	{
		if (key == OOO_LEFT)
		{
			if (this.value > this.min)
			{
		 		this.value--;
			}
			else
			{
		 		this.value = this.max;
			}
		}
		else if (key == OOO_RIGHT)
		{
			if (this.value < this.max)
			{
		 		this.value++;
			}
			else
			{
		 		this.value = this.min;
			}
		}
	});

	ooo.input.Integer.on('draw', function (time, context)
	{
		context.fillText(this.value, 0, 0);
	});

	ooo.input.Options = ooo.core.Input.extend(function (name, options, init, layout)
	{
		ooo.core.Input.call(this, name, layout);
		this.options = options;
		this.init = init;
		ooo.input.Options.prototype.events.on.form_reset.call(this);
	});

	ooo.input.Options.on('form_reset', function ()
	{
		this.pick = this.init;
	});

	ooo.input.Options.on('form_submit', function (type, data)
	{
		ooc.push(this.options[this.pick], data, this.name);
	});

	ooo.input.Options.on('mouse_click', function (button, down_x, down_y)
	{
		ooo.core.Input.prototype.events.on.mouse_click.call(this, button, down_x, down_y);

		if (down_x < (this.width >>> 1))
		{
			this.pick--;
		}
		else
		{
			this.pick++;
		}

		this.pick = ooc.wrap(this.pick, this.options.length);
	});

	ooo.input.Options.on('key_press', function (time, char, key, shift)
	{
		if (key == OOO_LEFT)
		{
			this.pick--;
		}
		else if ((key == OOO_RIGHT) || (key == OOO_SPACE))
		{
			this.pick++;
		}

		this.pick = ooc.wrap(this.pick, this.options.length);
	});

	ooo.input.Options.on('draw', function (time, context)
	{
		context.fillText(this.options[this.pick], 0, 0);
	});

	/*ooo.input.Layout = ooo.core.Input.extend(function (name, options, init, layout)
	{
		ooo.core.Input.call(this, name, layout);
		this.options = options;
		this.init = init;
		ooo.input.Layout.prototype.events.on.form_reset.call(this);
	});

	ooo.input.Layout.on('form_reset', function ()
	{
		this.pick = this.init;
	});

	ooo.input.Layout.on('form_submit', function (type, data)
	{
		ooc.push(this.options[this.pick], data, this.name);
	});

	ooo.input.Layout.on('mouse_click', function (button, down_x, down_y)
	{
		ooo.core.Input.prototype.events.on.mouse_click.call(this, button, down_x, down_y);

		if (down_x < (this.width >>> 1))
		{
			this.pick--;
		}
		else
		{
			this.pick++;
		}

		this.pick = ooc.wrap(this.pick, this.options.length);
	});

	ooo.input.Layout.on('key_press', function (time, char, key, shift)
	{
		if (key == OOO_LEFT)
		{
			this.pick--;
		}
		else if (key == OOO_RIGHT)
		{
			this.pick++;
		}

		this.pick = ooc.wrap(this.pick, this.options.length);
	});

	ooo.input.Layout.on('draw', function (time, context)
	{
		context.fillText(this.options[this.pick], 0, 0);
	});*/

	/*ooo.SingleMenu = ooo.Menu.extend(function (asset, layout, style)
	{
		ooo.Menu.call(this, asset, layout, style);
	});

	ooo.SingleMenu.method('preparePick', function (data, index)
	{
		this.pick = {};
		this.pick[index] = true;
		return [data, index];
	});

	ooo.MultiMenu = ooo.Menu.extend(function (asset, layout, style)
	{
		ooo.Menu.call(this, asset, layout, style);
	});

	ooo.MultiMenu.method('preparePick', function (data, index)
	{
		if (this.pick[index])
		{
			delete this.pick[index];
		}
		else
		{
			this.pick[index] = true;
		}

		var select = [];

		for (var i in this.pick)
		{
			select.push(this.data[i]);
		}

		return [select, data, index];
	});

	var TabMenu = ooo.SingleMenu.extend(function (asset, layout, style)
	{
		ooo.Menu.call(this, asset, layout, style);
	});

	TabMenu.on('pick_item', function (data, index)
	{
		this.parent.front.mask('draw');
		this.parent.front.mask('mouse_click');
		this.parent.front = this.parent.tabs[index];
		this.parent.front.unmask('draw');
		this.parent.front.unmask('mouse_click');
	});

	ooo.Tabbed = ooo.core.Scene.extend(function (layout, asset, menu_layout, style)
	{
		ooo.core.Scene.call(this, layout);
		this.menu = new TabMenu(asset, menu_layout, style);
		this.tabs = [];
		this.show(this.menu, 1);
	});

	ooo.Tabbed.method('open', function (type, actor)
	{
		if (this.tabs.length == 0)
		{
			this.menu.pick[0] = true;
			this.front = actor;
		}
		else
		{
			actor.mask('draw');
			actor.mask('mouse_click');
		}

		this.menu.data.push(type);
		this.tabs.push(actor);
		this.show(actor);
	});*/

	var SQR_NMASK = [[0, -1], [1, 0], [0, 1], [-1, 0]];

	ooo.extra.TileMap = ooo.core.Cell.extend(function (size, asset, layout)
	{
		ooo.core.Cell.call(this, layout);
		this.ignore('mouse_drag', 'mouse_drop');
		this.size = size;
		this.asset = asset;
		this.drag_x = 0;
		this.drag_y = 0;
		this.drop_x = 0;
		this.drop_y = 0;
		this.coords = [];
		this.tiles = [];

		//create tiles
		for (var y = 0, i = 0; y < size; y++)
		{
			this.coords[y] = [];

			for (var x = 0; x < size; x++, i++)
			{
				var tile = {};
				tile.map = this;
				tile.i = i;
				tile.x = x;
				tile.y = y;
				tile.data = this.initData(i, x, y);
				this.coords[y][x] = tile;
				this.tiles[i] = tile;
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
					steps[i] = this.coords[ny][nx];
				}

				this.coords[y][x].steps = steps;
			}
		}
	});

	ooo.extra.TileMap.method('initData', function (i, x, y)
	{
		return {type: 0};
	});

	ooo.extra.TileMap.method('calcCost', function (data)
	{
		return 1;
	});

	ooo.extra.TileMap.method('drawTile', function (tile, time, context)
	{
		context.drawImage(this.image, this.image.tile_x[tile.data.type], this.image.tile_y[tile.data.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	ooo.extra.TileMap.method('calcDistance', function (a, b)
	{
		if (a.x < b.x)
		{
			var min_x = Math.min(b.x - a.x, a.x - (b.x - this.size));
		}
		else
		{
			var min_x = Math.min(a.x - b.x, (b.x + this.size) - a.x);
		}

		if (a.y < b.y)
		{
			var min_y = Math.min(b.y - a.y, a.y - (b.y - this.size));
		}
		else
		{
			var min_y = Math.min(a.y - b.y , (b.y + this.size) - a.y);
		}

		return (min_x + min_y);
	});

	ooo.extra.TileMap.method('findArea', function (open, range)
	{
		if (open.length == 0)
		{
			throw 'No tiles to go from';
		}

		//var g = {};

		for (var i = 0; i < open.length; i++)
		{
			open[i] = this.tiles[open[i]];
			open[i].g = 0;
		}

		var done = [];//sparse array

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

				var next_c = this.calcCost.call(this, next.data);

				if (next_c == null)
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
					open.splice(ooc.sorted_index(open, next, 'g'), 0, next);
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

	ooo.extra.TileMap.method('findPath', function (origin, target)
	{
		if (origin.i == target.i)
		{
			return {tiles: [], steps: [], cost: 0};
		}

		var done = [];
		var crumbs = [];
		var open = [origin];
		origin.g = 0;
		origin.f = this.calcDistance.call(this, origin, target);

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

				var next_c = this.calcCost.call(this, next.data);

				if (next_c == null)
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
					next.f = next_g + this.calcDistance.call(this, next, target);
					open.splice(ooc.sorted_index(open, next, 'f'), 0, next);
					crumbs[next.i] = [i, current];
					continue;
				}

				if (next_g < tile.g)
				{
					tile.g = next_g;
					tile.f = next_g + this.calcDistance.call(this, tile, target);
					crumbs[tile.i] = [i, current];
				}
			}
		}
		while (open.length)
	});

	ooo.extra.TileMap.method('getTileAt', function (down_x, down_y)
	{
		var tile_x = Math.floor(ooc.wrap(this.drop_x - this.mid_x + down_x, this.patch_w) / this.image.tile_w);
		var tile_y = Math.floor(ooc.wrap(this.drop_y - this.mid_y + down_y, this.patch_h) / this.image.tile_h);
		return this.coords[tile_y][tile_x];
	});

	ooo.extra.TileMap.method('viewTile', function (tile)
	{
		this.drop_x = (tile.x * this.image.tile_w) + (this.image.tile_w >>> 1);
		this.drop_y = (tile.y * this.image.tile_h) + (this.image.tile_h >>> 1);
	});

	ooo.extra.TileMap.on('show', function (root, parent)
	{
		ooo.core.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
		this.patch_w = this.size * this.image.tile_w;
		this.patch_h = this.size * this.image.tile_h;
	});

	ooo.extra.TileMap.on('resize', function (width, height)
	{
		ooo.core.Cell.prototype.events.on.resize.call(this, width, height);
		this.mid_x = this.width >>> 1;
		this.mid_y = this.height >>> 1;
	});

	ooo.extra.TileMap.on('draw', function (time, context)
	{
		var drop_x = ooc.wrap(this.drop_x - this.drag_x - this.mid_x, this.patch_w);
		var drop_y = ooc.wrap(this.drop_y - this.drag_y - this.mid_y, this.patch_h);
		var start_x = Math.floor(drop_x / this.image.tile_w);
		var start_y = Math.floor(drop_y / this.image.tile_h);
		var end_x = start_x + Math.ceil(this.width / this.image.tile_w);
		var end_y = start_y + Math.ceil(this.height / this.image.tile_h);

		context.translate(-(drop_x % this.image.tile_w), -(drop_y % this.image.tile_h));

		for (var y = start_y; y <= end_y; y++)
		{
			var tile_y = y % this.size;
			context.save();

			for (var x = start_x; x <= end_x; x++)
			{
				var tile_x = x % this.size;
				var tile = this.coords[tile_y][tile_x];
				context.save();
				this.drawTile(tile, tile.data, time, context);
				context.restore();
				context.translate(this.image.tile_w, 0);
			}

			context.restore();
			context.translate(0, this.image.tile_h);
		}
	});

	ooo.extra.TileMap.on('mouse_grab', function (button, down_x, down_y, drag_x, drag_y)
	{
		this.listen('mouse_drag', 'mouse_drop');
		this.drag_x = drag_x;
		this.drag_y = drag_y;
		return false;
	});

	ooo.extra.TileMap.on('mouse_drag', function (drag_x, drag_y)
	{
		this.drag_x = drag_x;
		this.drag_y = drag_y;
		return false;
	});

	ooo.extra.TileMap.on('mouse_drop', function (drop_x, drop_y)
	{
		this.ignore('mouse_drag', 'mouse_drop');
		this.drop_x = ooc.wrap(this.drop_x - this.drag_x, this.patch_w);
		this.drop_y = ooc.wrap(this.drop_y - this.drag_y, this.patch_h);
		this.drag_x = 0;
		this.drag_y = 0;
		return false;
	});

	ooo.extra.TileMap.on('mouse_click', function (button, down_x, down_y)
	{
		var tile = this.getTileAt(down_x, down_y);
		this.trigger('pick_tile', [tile, button]);
		return false;
	});

	var HEX_NMASK = [[[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]], [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]]];

	//HexMap
	function wrapDist (dx, dy, dz)
	{
		var dist1 = Math.max(Math.abs(this.size2 + dx), this.size - dy, Math.abs(this.size2 + dz));
		var dist2 = Math.max(Math.abs(this.size2 - dx), this.size - dy, Math.abs(this.size32 + dz));
		var dist3 = Math.max(Math.abs(this.size - dx), dy, Math.abs(this.size + dz));
		return Math.min(dist1, dist2, dist3);
	}

	ooo.extra.HexMap = ooo.extra.TileMap.extend(function (size, tile_w, tile_h, type, layout)
	{
		ooo.extra.TileMap.apply(this, arguments);
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
		this.coords = [];
		this.tiles = [];

		//create tiles
		for (var y = 0, i = 0; y < size; y++)
		{
			this.coords[y] = [];

			for (var x = 0; x < size; x++, i++)
			{
				var tile = {};
				tile.i = i;
				tile.x = x - (y >> 1);
				tile.y = y;
				tile.z = -tile.x - y;
				tile.type = 0;
				this.coords[y][x] = tile;
				this.tiles[i] = tile;
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
					steps[i] = this.coords[ny][nx];
				}

				this.coords[y][x].steps = steps;
			}
		}
	});

	ooo.extra.HexMap.method('calcDistance', function (a, b)
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

	ooo.extra.HexMap.on('mouse_click', function (button, down_x, down_y)
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

		this.trigger('pick_tile', [this.coords[tile_y][tile_x], button, tile_x, tile_y]);
		return false;
	});

	ooo.extra.HexMap.on('draw', function (time, context)
	{
		var drop_x = ooc.wrap(this.drop_x - this.drag_x, this.patch_w);
		var drop_y = ooc.wrap(this.drop_y - this.drag_y, this.patch_h);
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
				var tile = this.coords[tile_y][tile_x];
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
})();
