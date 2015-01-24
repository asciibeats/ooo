'use strict';
var jup = {};
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
	jup.info = {};
	var events = {};

	jup.matchEvent = function (power)
	{
		return events[eventId(power)];
	}

	jup.mergePower = function (a, b)
	{
		var power = ooc.clone(a);

		for (var type in b)
		{
			if (type in power)
			{
				power[type] += b[type];
			}
			else
			{
				power[type] = b[type];
			}
		}

		return power;
	}

	jup.cancelPower = function (a, b)
	{
		var power = ooc.clone(a);

		for (var type in b)
		{
			if (type in power)
			{
				var amount = b[type];

				if (power[type] > amount)
				{
					power[type] -= amount;
				}
				else if (power[type] == amount)
				{
					delete power[type];
				}
				else
				{
					throw 'asdfasdf cancel pow';
				}
			}
			else
			{
				throw 'asdf cancel pow';
			}
		}

		return power;
	}

	jup.mergePairs = function (power)
	{
		var merged = {};

		for (var type = 0; type < 8; type += 2)
		{
			var comp = type + 1;
			var a = (type in power) ? power[type] : 0;
			var b = (comp in power) ? power[comp] : 0;

			if (a > b)
			{
				merged[type] = a - b;
			}
			else if (b > a)
			{
				merged[comp] = b - a;
			}
		}

		return merged;
	}

	jup.poolPower = function (pools)
	{
		var power = {};

		for (var char_id in pools)
		{
			for (var signature in pools[char_id])
			{
				power = jup.mergePower(power, pools[char_id][signature]);
			}
		}

		return jup.mergePairs(power);
	}

	jup.charPower = function (char_pools)
	{
		var power = {};

		for (var signature in char_pools)
		{
			power = jup.mergePower(power, char_pools[signature]);
		}

		return power;
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

	var Data = Info.extend(function (title, param, state)
	{
		Info.call(this, 1, title, param, state);
	});

	var Char = Info.extend(function (title, state)
	{
		Info.call(this, 2, title, ['obscurity', 'obfuscation', 'range', 'insight', 'health', 'power'], state);
	});

	var Item = Info.extend(function (title, state, effect)
	{
		Info.call(this, 3, title, ['obscurity', 'obfuscation', 'key'], state);
		this.effect = effect;
	});

	var Pool = Info.extend(function (title, state)
	{
		Info.call(this, 4, title, ['obscurity', 'obfuscation', 'power', 'time'], state);
	});

	var Lock = Info.extend(function (title, state)
	{
		Info.call(this, 5, title, ['obscurity', 'key'], state);
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

	//NUR ZWEI GRUPPEN? ENTITY (obscurity, obfuscation) DATA ()
	////NEIN GRUPPEN JE NACH BEDARF AN MAP DIFFERENZIERUNG
	regInf(1, new Tile('Plains', [0, 0, 1]));
	regInf(2, new Tile('Forest', [0, 4, 3]));
	regInf(3, new Tile('Campfire', [0, 0, 1]));
	regInf(9, new Char('Hero', [1, 1, 10, 5, 20, {0: 2, 1: 1, 2: 4}]));
	regInf(8, new Item('Apple', [1, 1], function () { this.info.state[2] += 4 }));
	regInf(7, new Item('Ring', [1, 1], function () { this.info.state[3] += 3 }));
	regInf(66, new Pool('Pool', [0, 0, {}, 0]));
	regInf(42, new Lock('Mind', [0, 'xxx']));
	regInf(23, new Data('Task', ['route', 'range', 'power'], [[], 0, {}]));
	regInf(33, new Data('Home', ['tile'], [0]));
	regInf(73, new Data('Word', ['string'], ['rosebud']));//Codeword

	//regEvt({0: 1}, new Event('Gatherer', 0, null, gain([8])));
	regEvt({}, new Event('Nothing', 0, null, null));
	regEvt({0: 1}, new Event('Gatherer', 0, null, null));
	//regEvt({1: 1}, new Event('Explore', 1, build(3), birth([9])));
	regEvt({1: 1}, new Event('Explore', 1, null, null));
	regEvt({2: 1}, new Event('Rampage', 1, null, null));
})();
