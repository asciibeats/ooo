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

  ooc.resolve = function (object, address)
  {
    var steps = address.split('.');

    for (var i = 0; i < steps.length; i++)
    {
      object = object[steps[i]];

      if (object == undefined)
      {
        break;
      }
    }

    return object;
  }

  //ooc.count = function (array)
  ooc.hash = function (array)
  {
    var object = {};

    for (var i = 0; i < array.length; i++)
    {
      var key = array[i];

      if (key in object)
      {
        object[key]++;
      }
      else
      {
        object[key] = 1;
      }
    }

    return object;
  }

  ooc.addCount = function (a, b)
  {
    var count = ooc.clone(a);

    for (var type in b)
    {
      if (type in count)
      {
        if (count[type] == -b[type])
        {
          delete count[type];
        }
        else
        {
          count[type] += b[type];
        }
      }
      else
      {
        count[type] = b[type];
      }
    }

    return count;
  }

  ooc.subtractCount = function (a, b)
  {
    var count = ooc.clone(a);

    for (var type in b)
    {
      if (type in count)
      {
        if (count[type] == b[type])
        {
          delete count[type];
        }
        else
        {
          count[type] -= b[type];
        }
      }
      else
      {
        count[type] = -b[type];
      }
    }

    return count;
  }

  ooc.matchCount = function (a, b)
  {
    for (var type in a)
    {
      if (b[type] < a[type])
      {
        return false;
      }
    }

    return true;
  }

  ooc.pos = function (value)
  {
    return value > 0 ? value : 0;
  }
  
  //ooc.hash = function (string)
  ooc.hashString = function (string)
  {
    var hash = 0;

    for (var i = 0; i < string.length; i++)
    {
      var char = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;//Convert to 32 bit integer
    }

    return hash;
  }

  ooc.modify = function (func)
  {
    return function (value, object)
    {
      var pointer = object;
      var loops = arguments.length - 1;
      var key = null;

      for (var i = 2; i < loops; i++)
      {
        key = arguments[i];

        if (!(key in pointer))
        {
          pointer[key] = {};
        }

        pointer = pointer[key];
      }

      return func(pointer, arguments[i], value);
    }
  }

  ooc.put = ooc.modify(function (object, key, value)
  {
    object[key] = value;
  });

  ooc.add = ooc.modify(function (object, key, value)
  {
    if (key in object)
    {
      object[key] += value;
    }
    else
    {
      object[key] = value;
    }
  });

  /*ooc.invert = function (object)
  {
    var array = [];

    for (var key in object)
    {
      array[object[key]] = key;
    }

    return array;
  }*/

  ooc.total = function (object)
  {
    var sum = 0;

    for (var key in object)
    {
      sum += object[key];
    }

    return sum;
  }

  ooc.delete = function (object)
  {
    var objects = [object];

    for (var i = 1; i < arguments.length; i++)
    {
      objects[i] = objects[i - 1][arguments[i]];
    }

    do
    {
      i--;
      delete objects[i - 1][arguments[i]];
    }
    while (Object.keys(objects[i - 1]).length == 0)
  }

  ooc.push = ooc.modify(function (object, key, value)
  {
    if (key in object)
    {
      object[key].push(value);
    }
    else
    {
      object[key] = [value];
    }

    return object[key].length - 1;
  });

  ooc.pop = function (object)
  {
    var objects = [object];

    for (var i = 1; i < arguments.length; i++)
    {
      objects[i] = objects[i - 1][arguments[i]];
    }

    i--;
    var array = objects[i];
    var value = array.pop();

    if (array.length == 0)
    {
      do
      {
        delete objects[i - 1][arguments[i]];
        i--;
      }
      while ((i > 0) && (Object.keys(objects[i]).length == 0))
    }

    return value;
  }

  ooc.map = function (keys, values)
  {
    var object = {};

    for (var i = 0; i < keys.length; i++)
    {
      object[keys[i]] = ooc.clone(values[i]);
    }

    return object;
  }

  ooc.index = function (keys, object)
  {
    var array = [];

    for (var i = 0; i < keys.length; i++)
    {
      array[i] = object[keys[i]];
    }

    return array;
  }

  ooc.clone = function (object)
  {
    if (typeof object != 'object')
    {
      return object;
    }

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

  //array für löcher (nicht immer wieder iterieren müssen!!) array in closure!!!:)
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

  ooc.minKeyValue = function (object)
  {
    return object[Math.min.apply(null, ooc.intkeys(object))];
  }

  ooc.propArray = function (objects, name)
  {
    var values = {};

    for (var id in objects)
    {
      if (name in objects[id])
      {
        values[id] = objects[id][name];
      }
    }

    return values;
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

  ooc.sorted_index = function (array, object, key)
  {
    var low = 0;
    var high = array.length;

    while (low < high)
    {
      var mid = (low + high) >>> 1;

      if (object[key] > array[mid][key])
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

  ooc.addEvent = function (channel)
  {
    return function (types, func)
    {
      if (!Array.isArray(types))
      {
        types = [types];
      }

      for (var i = 0; i < types.length; i++)
      {
        ooc.put(func, this.prototype, 'events', channel, types[i]);
      }
    }
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
      Child.prototype.events = ooc.clone(Parent.prototype.events);
    }
  }

  ooc.Class = function ()
  {
    this.ignores = {};
  }

  ooc.Class.on = ooc.addEvent('on');

  ooc.Class.extend = function (func)
  {
    var Parent = this;

    var Child = function ()
    {
      if (func != null)
      {
        func.apply(this, arguments);
      }
      else
      {
        Parent.apply(this, arguments);
      }
    }

    inherit(Child, Parent);
    return Child;
  }

  ooc.Class.method = function (name, func)
  {
    this.prototype[name] = func;
  }

  ooc.Class.method('ignore', function ()
  {
    for (var i in arguments)
    {
      this.ignores[arguments[i]] = true;
    }

    return this;
  });

  ooc.Class.method('listen', function ()
  {
    for (var i in arguments)
    {
      delete this.ignores[arguments[i]];
    }

    return this;
  });

  ooc.Class.method('trigger', function (type, argv)
  {
    if (this.events && this.events.on && this.events.on[type])
    {
      try
      {
        this.events.on[type].apply(this, argv);
      }
      catch (e)
      {
        console.log('EXCEPTION "%s"', e.toString());
      }
    }
  });
})();
