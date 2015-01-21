'use strict';
var jup = {};
jup.info = {};
/*var jup.POWERS = 
['Attack/Strength/Destruction/Death (ROT)', 'Defense/Diplomacy/Healing/Life (BLAU)',
 'Sneak/Sly/Shadow/Illusion/Lying (GRAU)', 'Watch/Perception/Sense/Intelligence (WEISS)',
 'Metamorphose/Wachstum/Entwicklung/Evolution (GRÜN)', 'Gift/Psycho/Arkan/ (LILA)'];//grün/gelb/lila*/

if (typeof module == 'object')
{
	module.exports = jup;
	var ooc = require('./ooc.js');
}

/*var GROUPS = [];
GROUPS[0] = 'Tile';
GROUPS[1] = 'Spawns';
GROUPS[2] = 'Chars';
GROUPS[3] = 'Items';
GROUPS[4] = 'Events';*/

(function ()
{
	var events = {};

	jup.matchEvent = function (power)
	{
		return events[eventId(power)];
	}

	jup.cancelPower = function (keep, add)
	{
		for (var key in add)
		{
			var value = add[key];

			if (key in keep)
			{
				if (keep[key] > value)
				{
					keep[key] -= value;
				}
				else if (keep[key] == value)
				{
					delete keep[key];
				}
				else
				{
					throw 'asdfasdf';
				}
			}
			else
			{
				throw 'asdf';
			}
		}
	}

	jup.mergePower = function (keep, add)
	{
		for (var key in add)
		{
			var value = add[key];

			if (key in keep)
			{
				keep[key] += value;
			}
			else
			{
				keep[key] = value;
			}
		}
	}

	var Info = ooc.Class.extend(function (group, title, param, state)
	{
		this.group = group;
		this.title = title;
		this.param = param;
		this.state = state;
	});

	var Tile = Info.extend(function (title, state)
	{
		Info.call(this, 0, title, ['obscurity', 'obfuscation', 'obstruction'], state);
	});

	var Char = Info.extend(function (title, state)
	{
		Info.call(this, 2, title, ['obscurity', 'obfuscation', 'range', 'insight', 'health', 'power'], state);
	});

	var Item = Info.extend(function (title, state, effect)
	{
		Info.call(this, 3, title, ['obscurity', 'obfuscation'], state);
		this.effect = effect;
	});

	var Event = ooc.Class.extend(function (title, time, tile_effect, char_effect)
	{
		ooc.Class.call(this);
		this.title = title;
		this.time = time;
		this.tile_effect = tile_effect;
		this.char_effect = char_effect;
	});

	function regInf (id, info)
	{
		info.id = id;
		jup.info[id] = info;
	}

	function eventId (power)
	{
		var id = [];

		for (var type in power)
		{
			id.push(type + ':' + power[type]);
		}

		return id.join('/');
	}

	function regEvt (power, event)
	{
		event.power = power;
		events[eventId(power)] = event;
	}

	//TILE EFFECTS
	function build (id)
	{
		return function (tile)
		{
			tile.data.info.type = jup.info[id];
			tile.data.info.state = ooc.clone(tile.data.info.type.state);
			//argv update?
			//children??
		}
	}

	//CHAR EFFECTS
	function gain (data)
	{
		return function (tile, char)
		{
			this.world.spawn(data, [char.info.id]);
		}
	}

	function birth (data)
	{
		return function (tile, char)
		{
			this.world.birth(char.realm, tile, data);
		}
	}

	regInf(1, new Tile('Plains', [0, 0, 1]));
	regInf(2, new Tile('Forest', [0, 4, 3]));
	regInf(3, new Tile('Campfire', [0, 0, 1]));
	regInf(9, new Char('Hero', [1, 1, 10, 5, 20, {0: 2, 1: 1, 2: 4}]));
	regInf(8, new Item('Apple', [1, 1], function () { this.info.state[2] += 4 }));
	regInf(7, new Item('Ring', [1, 1], function () { this.info.state[3] += 3 }));

	//regEvt({0: 1}, new Event('Gatherer', 0, null, gain([8])));
	regEvt({0: 1}, new Event('Gatherer', 0, null, null));
	//regEvt({1: 1}, new Event('Explore', 1, build(3), birth([9])));
	regEvt({1: 1}, new Event('Explore', 1, null, null));
})();
