'use strict';
var ooc = {};

if (typeof module == 'object')
{
	module.exports = ooc;
}

(function ()
{
	ooc.Wrap = function (Func, argv)
	{
		return Func.bind.apply(Func, [Func].concat(argv));
	}

	ooc.pos = function (value)
	{
		return value > 0 ? value : 0;
	}

	ooc.hash = function (array)
	{
		var hash = {};

		for (var i = 0; i < array.length; i++)
		{
			var key = array[i];

			if (key in hash)
			{
				hash[key]++;
			}
			else
			{
				hash[key] = 1;
			}
		}

		return hash;
	}

	ooc.inc = function (value, object)
	{
		var pointer = object;
		var loops = arguments.length - 1;
		var key = null;

		for (var i = 2; i < loops; i++)
		{
			key = arguments[i];

			if (!pointer[key])
			{
				pointer[key] = {};
			}

			pointer = pointer[key];
		}
		
		key = arguments[i];

		if (pointer[key])
		{
			pointer[key] += value;
		}
		else
		{
			pointer[key] = value;
		}
	}

	ooc.push = function (value, object)
	{
		var pointer = object;
		var loops = arguments.length - 1;
		var key = null;

		for (var i = 2; i < loops; i++)
		{
			key = arguments[i];

			if (!pointer[key])
			{
				pointer[key] = {};
			}

			pointer = pointer[key];
		}
		
		key = arguments[i];

		if (pointer[key])
		{
			var index = pointer[key].length;
			pointer[key].push(value);
		}
		else
		{
			var index = 0;
			pointer[key] = [value];
		}

		return index;
	}

	ooc.add = function (value, object)
	{
		var pointer = object;
		var loops = arguments.length - 1;
		var key = null;

		for (var i = 2; i < loops; i++)
		{
			key = arguments[i];

			if (!pointer[key])
			{
				pointer[key] = {};
			}

			pointer = pointer[key];
		}
		
		pointer[arguments[i]] = value;
	}

	ooc.remove = function (object)
	{
		var pointers = [object];
		var loops = arguments.length - 1;

		for (var i = 1; i < loops; i++)
		{
			pointers[i] = pointers[i - 1][arguments[i]];
		}

		//besser lösen?
		if (!pointers[i - 1])
		{
			return;
		}

		delete pointers[i - 1][arguments[i]];

		for (i--; i > 0; i--)
		{
		    if (Object.keys(pointers[i]).length === 0)
		    {
		        delete pointers[i - 1][arguments[i]];
		    }
		}
	}

	ooc.map = function (keys, values)
	{
		var object = {};

		for (var i = 0; i < keys.length; i++)
		{
			object[keys[i]] = values[i];
		}

		return object;
	}

	ooc.clone = function (object)
	{
		var clone = Array.isArray(object) ? [] : {};

		for (var key in object)
		{
			if (typeof object[key] == 'object')
			{
				clone[key] = ooc.clone(object[key]);
			}
			else
			{
				clone[key] = object[key];
			}
		}

		return clone;
	}

	ooc.wrap = function (index, size)
	{
		return ((index % size) + size) % size;
	}

	ooc.size = function (object)
	{
		return Object.keys(object).length;
	}

	ooc.matrix = function (width, height, value)
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

	//array für löcher (nicht immer wieder iterieren müssen!!)
	ooc.fill = function (value, object)
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

	ooc.maxkey = function (object)
	{
		return Math.max.apply(null, ooc.intkeys(object));
	}

	ooc.minkey = function (object)
	{
		return Math.min.apply(null, ooc.intkeys(object));
	}

	ooc.intkeys = function (object)
	{
		var keys = [];

		for (var key in object)
		{
			keys.push(parseInt(key));
		}

		return keys;
	}

	ooc.preload = function (assets, callback)
	{
		var images = {};
		var toload = ooc.size(assets);
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

	ooc.merge = function (keep, add)
	{
		for (var key in add)
		{
			var value = add[key];

			if (keep[key] && (typeof value == 'object'))
			{
				ooc.merge(keep[key], value);
			}
			else
			{
				keep[key] = value;
			}
		}
	}

	ooc.values = function (object)
	{
		var array = [];

		for (var key in object)
		{
			array.push(object[key]);
		}

		return array;
	}

	ooc.setLocal = function (name, object)
	{
		localStorage[name] = JSON.stringify(object);
	}

	ooc.getLocal = function (name)
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

	ooc.sorted_index = function (open, tile, prop)
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

	ooc.Class = function ()
	{
	}

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

			for (var type in Parent.prototype.events)
			{
				events[type] = Parent.prototype.events[type];
			}

			Child.prototype.events = events;
		}
	}

	ooc.Class.clone = function ()
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

	ooc.Class.extend = function (func)
	{
		var Parent = this;

		var Child = function ()
		{
			func.apply(this, arguments);
		}

		inherit(Child, Parent);
		return Child;
	}

	ooc.Class.on = function (type, func)
	{
		if (!this.prototype.events)
		{
			this.prototype.events = {};
		}

		this.prototype.events[type] = func;
	}

	ooc.Class.method = function (name, func)
	{
		this.prototype[name] = func;
	}

	ooc.Class.method('attach', function (child)
	{
		//this.children.push(child);
	});

	ooc.Class.method('detach', function (child)
	{
	});

	ooc.Class.method('trigger', function (type, argv)
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
})();
