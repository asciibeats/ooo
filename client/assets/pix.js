//TODO
//update/listen (prevent drawing/clicking)
//animation (bezier)
//draw order checken!!!! (object sorted??? oder nur in chrome?)

Function.prototype.method = function (name, func)
{
	this.prototype[name] = func;
};

Function.prototype.extend = function (func)
{
	var that = this;

	var Child = function ()
	{
		that.call(this);
		func.apply(this, arguments);
	};

	Child.prototype = new that();
	Child.prototype.constructor = Child;

	Child.prototype.super = function (name)
	{
		var args = Array.prototype.slice.call(arguments, 1);
		that.prototype[name].apply(this, args);
	};

	return Child;
};

var PIX = {};

(function ()
{
	var _root;
	var _unique = 0;
	var _execs = [];
	var _time;
	var _elapsed;
	var _drag_event;

	var _events = {};
	_events['down'] = {id: 'mousedown', data: data_down};
	_events['up'] = {id: 'mouseup', data: data_down};
	_events['move'] = {id: 'mousemove', data: data_down};
	_events['drag'] = {id: 'customdrag', data: data_drag};
	_events['drop'] = {id: 'mouseup', data: data_drop};
	_events['click'] = {id: 'dblclick', data: data_down};
	_events['out'] = {id: 'mouseout', data: data_down};
	_events['size'] = {id: 'resize', data: data_down};

	function data_down (event)
	{

		return {down_x: event.clientX, down_y: event.clientY};
	}

	function data_drag (event)
	{

		return {down_x: event.downX, down_y: event.downY, drag_x: event.dragX, drag_y: event.dragY};
	}

	function data_drop (event)
	{
		
		return {down_x: event.downX, down_y: event.downY, drag_x: event.dragX, drag_y: event.dragY, up_x: event.clientX, up_y: event.clientY};
	}

	//var _CLICK_MARGIN = 5;
	//var _DRAG_MARGIN = 5;

	//helper

	//events
	function on_resize (event)
	{
		_root.size(window.innerWidth, window.innerHeight);
		_root.draw(0);
	};
	
	function on_down (event)
	{
		_drag_event.downX = event.clientX;
		_drag_event.downY = event.clientY;
		window.addEventListener('mousemove', on_drag);
	};
			
	function on_drag (event)
	{
		_drag_event.dragX = event.clientX - _drag_event.downX;
		_drag_event.dragY = event.clientY - _drag_event.downY;

		//if ((_drag_event.drag_x > _CLICK_MARGIN) && (_drag_event.drag_y > _CLICK_MARGIN))
		//{
		_root.canvas.dispatchEvent(_drag_event);
		//}
	};

	function on_up (event)
	{

		window.removeEventListener('mousemove', on_drag);
	};

	/*function on_out (event)
	{
		window.removeEventListener('mousemove', on_drag);
		_root.emit('up', true, {x: event.clientX, y: event.clientY});
	};*/

	function frame (func)
	{
		//window.webkitRequestAnimationFrame(func);
		window.mozRequestAnimationFrame(func);
	}

	//private
	function loop (time)
	{
		frame(loop);
		_elapsed = _time ? (time - _time) : 0;
		_time = time;

		for (var i in _execs)
		{
			var exec = _execs[i];
			var data = exec.method(_elapsed);

			if (data)
			{
				_execs.splice(i, 1);

				if (exec.callback)
				{
					exec.callback(data);
				}
			}
		}

		_root.context.save();
		_root.context.globalAlpha = _root.alpha;
		_root.context.translate(_root.relative_x, _root.relative_y);

		_root.draw(_elapsed);

		_root.context.restore();
	};

	//public
	PIX.init = function (color)
	{
		_drag_event = new CustomEvent('customdrag');
		_root = new Stage();/*.on('size', function (data)
		{
			this.size(window.innerWidth, window.innerHeight);
			this.draw(0);
		});*/

		window.addEventListener('resize', on_resize);
		on_resize();//ersetzen durch dispatchEvent()!!! damit auch alle anderen listener das kriegen

		_root.context.fillStyle = color;
		_root.context.fillRect(0, 0, _root.width, _root.height);

		document.body.style.margin = 0;
		//document.body.style.backgroundColor = '#dddddd';
		document.body.style.overflow = 'hidden';
		document.body.appendChild(_root.canvas);
		return this;
	};

	PIX.open = function ()
	{
		window.addEventListener('mousedown', on_down);
		window.addEventListener('mouseup', on_up);
		//window.addEventListener('mouseout', on_out);
		frame(loop);
		return this;
	};

	PIX.show = function (actor)
	{
		_root.show(actor);
		return this;
	};

	PIX.hide = function (actor)
	{
		_root.hide(actor);
		return this;
	};

	PIX.clear = function ()
	{
		_root.clear();
		return this;
	};

	/*PIX.emit = function (name, capture, data)
	{

		_root.emit(name, capture, data);
	};*/

	PIX.gear = function (method, callback)//, update, trigger
	{
		_execs.push({method: method, callback: callback});
		return this;
	};

	//Actor Baseclass
	function Actor ()
	{
		this.id = _unique++;
		this.parent = null;
		this.relative_x = 0;
		this.relative_y = 0;
		this.origin_x = 0;
		this.origin_y = 0;
		this.depth = 0;
		this.width = 0;
		this.height = 0;
		this.alpha = 1;
		this.angle = 0;
		this.listeners = {};
	};

	//ON SIZE
	Actor.method('center', function (x, y)//position
	{
		this.on('size', function (event)
		{
			if (x)
			{
				this.relative_x = ((this.parent.width * x) / 100) - (this.width >>> 1);

				if (this.relative_x < 0)
				{
					this.relative_x = 0;
				}
				else if (this.relative_x > (this.parent.width - this.width))
				{
					this.relative_x = (this.parent.width - this.width);
				}
			}

			if (y)
			{
				this.relative_y = ((this.parent.height * y) / 100) - (this.height >>> 1);

				if (this.relative_y < 0)
				{
					this.relative_y = 0;
				}
				else if (this.relative_y > (this.parent.height - this.height))
				{
					this.relative_y = (this.parent.height - this.height);
				}
			}
		});

		return this;
	});

	Actor.method('fill', function (x, y)//size
	{
		this.on('size', function (data)
		{
			if (x)
			{
				this.width = (this.parent.width * x) / 100;
			}

			if (y)
			{
				this.height = (this.parent.height * y) / 100;
			}
		});

		return this;
	});

	Actor.method('at', function (x, y)//position
	{
		this.relative_x = x;
		this.relative_y = y;
		return this;
	});

	Actor.method('size', function (width, height)
	{
		this.width = width;
		this.height = height;
		return this;
	});

	Actor.method('origin', function (x, y)
	{
		this.origin_x = x;
		this.origin_y = y;
		return this;
	});

	Actor.method('layer', function (depth)
	{
		this.depth = depth;
		return this;
	});

	Actor.method('move', function (x, y)
	{
		this.relative_x += x;
		this.relative_y += y;
		return this;
	});

	Actor.method('rotate', function (angle)
	{
		this.angle += angle;
		return this;
	});

	Actor.method('bounds', function (data)//später rotation mitbetrachten
	{
		var min_x = this.relative_x - this.origin_x;
		var min_y = this.relative_y - this.origin_y;
		var max_x = min_x + this.width;
		var max_y = min_y + this.height;
		return {min_x: min_x, min_y: min_y, max_x: max_x, max_y: max_y};
	});

	Actor.method('hit', function (data)
	{
		var abs_x = this.relative_x - this.origin_x;
		var abs_y = this.relative_y - this.origin_y;
		var actor = this.parent;

		while (actor)
		{
			abs_x += actor.relative_x;
			abs_y += actor.relative_y;
			actor = actor.parent;
		}

		if ((data.x < abs_x) || (data.y < abs_y))
		{
			return false;
		}

		if ((data.x < (abs_x + this.width)) && (data.y < (abs_y + this.height)))
		{
			return true;
		}

		return false;
	});

	/*Actor.method('trigger', function (name, data)
	{
		if (this.listen[name])
		{
			var listen = this.listen[name];

			for (var i = 0; i < listen.length; i++)
			{
				if (listen[i].call(this, data))
				{
					return true;
				}
			}
		}
	});*/

	Actor.method('on', function (name, func)
	{
		var that = this;

		if (this.listeners[name])
		{
			this.off(name);
		}

		this.listeners[name] = function (event)
		{
			func.call(that, _events[name].data(event));
		};

		_root.canvas.addEventListener(_events[name].id, this.listeners[name]);

		return this;
	});

	Actor.method('off', function (name)//lookupobject für functions?
	{
		_root.canvas.removeEventListener(_events[name].id, this.listeners[name]);
		delete this.listeners[name];
		
		return this;
	});

	//Just for testing
	var Box = Actor.extend(function (color)
	{

		this.color = color;
	});

	Box.method('draw', function (elapsed, context)
	{
		context.fillStyle = this.color;
		context.fillRect(0, 0, this.width, this.height);
	});

	//Actor with Image
	var Sprite = Actor.extend(function (image, image_x, image_y, width, height)
	{
		this.image = image;
		this.image_x = image_x;
		this.image_y = image_y;
		this.width = width;
		this.height = height;
	});

	Sprite.method('draw', function (elapsed, context)
	{

		context.drawImage(this.image, this.image_x, this.image_y, this.width, this.height, 0, 0, this.width, this.height);
	});

	//Scene is a container for Actors
	var Scene = Actor.extend(function (width, height)
	{
		this.width = width;
		this.height = height;
		this.actors = {};
		//this.padding = 0;
	});

	Scene.method('show', function (actor)
	{
		actor.parent = this;
		//actor.trigger('size');
		oO.add(this.actors, actor, actor.depth, actor.id);
		return this;
	});

	Scene.method('hide', function (actor)
	{
		if (actor)
		{
			oO.remove(this.actors, actor.depth, actor.id);
		}
		else
		{
			this.actors = {};
		}

		return this;
	});

	Scene.method('draw', function (elapsed, context)
	{
		oO.each2d(this.actors, function (actor)
		{
			context.save();
			context.globalAlpha = actor.alpha;
			context.translate(actor.relative_x, actor.relative_y);
			context.rotate(actor.angle);
			context.translate(-actor.origin_x, -actor.origin_y);

			actor.draw(elapsed, context);

			context.restore();
		});
	});

	//Scene with Canvas (BaseActor)
	var Stage = Scene.extend(function ()
	{
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		this.update = true;
		this.once = false;
	});

	Stage.method('size', function (width, height)
	{
		this.width = this.canvas.width = width;
		this.height = this.canvas.height = height;
		return this;
	});

	Stage.method('draw', function (elapsed, context)
	{
		if (this.update || this.once)
		{
			Scene.prototype.draw.call(this, elapsed, this.context);
			this.once = false;
		}

		if (context)
		{
			context.drawImage(this.canvas, 0, 0);
		}
	});

	Stage.method('clear', function ()
	{

		this.canvas.width = this.canvas.width;
	});

	//vertical List
	var List = Scene.extend(function (width, height, spacing)
	{
		this.width = width;
		this.height = height;
		this.spacing = spacing;
	});

	List.method('draw', function (elapsed, context)
	{
		var offset_y = 0;

		oO.each2d(this.actors, function (actor)
		{
			actor.relative_y = offset_y;
			offset_y += actor.height + this.spacing;

			context.save();
			context.globalAlpha = actor.alpha;
			context.translate(actor.relative_x, actor.relative_y);
			context.rotate(actor.angle);
			context.translate(-actor.origin_x, -actor.origin_y);

			actor.draw(elapsed, context);

			context.restore();
		}, this);
	});

	PIX.Actor = Actor;
	PIX.Box = Box;
	PIX.Sprite = Sprite;
	PIX.Scene = Scene;
	PIX.Stage = Stage;
	PIX.List = List;
})();
