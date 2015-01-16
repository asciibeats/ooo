'use strict';
var jup = {};
jup.info = {};
jup.events = {};
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
GROUPS[0] = 'Terrain';
GROUPS[1] = 'Spawns';
GROUPS[2] = 'Characters';
GROUPS[3] = 'Items';
GROUPS[4] = 'Events';*/

(function ()
{
	jup.eventId = function (combo)
	{
		var id = 0;

		for (var type = 0; type < 8; type++)
		{
			if (type in combo)
			{
				id |= combo[type];
			}

			id <<= 4;
		}

		return id;
	}

	var Info = ooc.Class.extend(function (group, title, param, state)
	{
		this.group = group;
		this.title = title;
		this.param = param;
		this.state = state;
	});

	var Terrain = Info.extend(function (title, state)
	{
		Info.call(this, 0, title, ['obscurity', 'obfuscation', 'obstruction'], state);
	});

	var Character = Info.extend(function (title, state)
	{
		Info.call(this, 2, title, ['obscurity', 'obfuscation', 'range', 'insight', 'health', 'elems'], state);
	});

	var Item = Info.extend(function (title, state)
	{
		Info.call(this, 3, title, ['obscurity', 'obfuscation'], state);
	});

	var Event = ooc.Class.extend(function (title, tile_effect, char_effect)
	{
		ooc.Class.call(this);
		this.title = title;
		this.tile_effect = tile_effect;
		this.char_effect = char_effect;
	});

	function reginf (id, info)
	{
		info.id = id;
		jup.info[id] = info;
	}

	function regevt (combo, event)
	{
		event.combo = combo;
		var id = jup.eventId(combo);
		jup.events[id] = event;
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

	reginf(1, new Terrain('Plains', [0, 0, 1]));
	reginf(2, new Terrain('Forest', [0, 4, 3]));
	reginf(3, new Terrain('Campfire', [0, 0, 1]));
	reginf(9, new Character('Hero', [1, 1, 10, 5, 20, {0: 2, 1: 1, 2: 4}]));
	reginf(8, new Item('Apple', [1, 1]));
	reginf(7, new Item('Ring', [1, 1]));

	regevt({0: 1}, new Event('Gatherer', null, gain([8])));
	regevt({1: 1}, new Event('Explore', build(3), birth([9])));
})();
