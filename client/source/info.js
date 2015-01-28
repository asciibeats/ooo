'use strict';
var jup = {};

if (typeof module == 'object')
{
	module.exports = jup;
	var ooc = require('./ooc.js');
}

/*var jup.POWERS = 
['Attack/Strength/Destruction/Death (ROT)', 'Defense/Diplomacy/Healing/Life (BLAU)',
 'Sneak/Sly/Shadow/Illusion/Lying (GRAU)', 'Watch/Perception/Sense/Intelligence (WEISS)',
 'Metamorphose/Wachstum/Entwicklung/Evolution (GRÜN)', 'Gift/Psycho/Arkan/ (LILA)'];//grün/gelb/lila*/

/*var GROUPS = [];
GROUPS[0] = 'Tile';
GROUPS[1] = 'Spawns';
GROUPS[2] = 'Chars';
GROUPS[3] = 'Items';
GROUPS[4] = 'Events';*/

(function ()
{
	jup.infos = {};
	jup.cards = {};
	//var events = {};

	jup.addCost = function (a, b)
	{
		var cost = ooc.clone(a);

		for (var type in b)
		{
			if (type in cost)
			{
				cost[type] += b[type];
			}
			else
			{
				cost[type] = b[type];
			}
		}

		return cost;
	}

	jup.subtractCost = function (a, b)
	{
		var cost = ooc.clone(a);

		for (var type in b)
		{
			if (type in cost)
			{
				var amount = b[type];

				if (cost[type] > amount)
				{
					cost[type] -= amount;
				}
				else if (cost[type] == amount)
				{
					delete cost[type];
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

		return cost;
	}

	jup.matchCost = function (card, char)
	{
		for (var type in card)
		{
			if (char[type] < card[type])
			{
				return false;
			}
		}

		return true;
	}

	jup.matchChars = function (power, chars)
	{
		var match = {};

		for (var info_id in chars)
		{
			var char = chars[info_id];

			if (jup.matchCost(power, char.info.state[5]))
			{
				match[info_id] = char;
			}
		}

		return match;
	}

	/*jup.matchEvent = function (power)
	{
		return events[eventId(power)];
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
	}*/

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
		Info.call(this, 2, title, ['obscurity', 'obfuscation', 'range', 'insight', 'health', 'power', 'number_of_cards_in_hand', 'number_of_crowns'], state);
	});

	var Item = Info.extend(function (title, state)
	{
		Info.call(this, 3, title, ['obscurity', 'obfuscation', 'key'], state);
	});

	var Pool = Info.extend(function (title, state)
	{
		Info.call(this, 4, title, ['obscurity', 'obfuscation', 'power', 'time'], state);
	});

	var Lock = Info.extend(function (title, state)
	{
		Info.call(this, 5, title, ['obscurity', 'key'], state);
	});

	var Trap = Info.extend(function (title, state)
	{
		Info.call(this, 6, title, ['obscurity', 'obfuscation', 'power', 'time'], state);
	});

	/*var Event = ooc.Class.extend(function (title, info, block, time, tile_effect, char_effect)
	{
		ooc.Class.call(this);
		this.title = title;
		this.info = info;
		this.block = block;
		this.time = time;
		this.tile_effect = tile_effect;
		this.char_effect = char_effect;
	});*/

	var Card = ooc.Class.extend(function (title, description, cost, gain, condition, effect)
	{
		ooc.Class.call(this);
		this.title = title;
		this.description = description;
		this.cost = cost;//char needs to play
		this.gain = gain;//gain when blocked (burned?)
		this.condition = condition;//function (info1)
		this.effect = effect;//function (info2)
	});

	function regInfo (id, info)
	{
		info.id = id;
		jup.infos[id] = info;
	}

	function regCard (id, card)
	{
		card.id = id;
		jup.cards[id] = card;
	}

	/*function eventId (power)
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
	}*/

	//TILE EFFECTS
	/*function form (type)
	{
		return function (tile)
		{
			tile.data.info.type = jup.info[type];
			tile.data.info.state = ooc.clone(tile.data.info.type.state);
			//argv update?
			//children??
		}
	}

	function spawn (data)
	{
		return function (tile)
		{
			this.world.spawn(data, [tile.i]);
		}
	}

	//CHAR EFFECTS
	function gain (data)
	{
		return function (tile_i, char)
		{
			var info = this.world.spawn(data, [char.info.id]);
			ooc.push(info, char.inventory, info.type.id);
		}
	}

	function loose (type)
	{
		return function (tile_i, char)
		{
			console.log(Object.keys(char.inventory));
			//var info = ooc.pop(char.inventory, type);
			var info = char.inventory[type].pop();
			if (char.inventory[type].length == 0)
			{
				delete char.inventory[type];
			}
			console.log(info.type.title);
			this.world.unspawn(info);
		}
	}

	function boost (type, amount)
	{
		return function (tile_i, char)
		{
			char.info.state[type] += amount;
		}
	}

	function birth (data)
	{
		return function (tile_i, char)
		{
			this.world.birth(char.realm, tile_i, data);
		}
	}*/

	//NUR ZWEI GRUPPEN? ENTITY (obscurity, obfuscation) DATA ()
	////NEIN GRUPPEN JE NACH BEDARF AN MAP DIFFERENZIERUNG
	regInfo(0, new Tile('Farm', [0, 0, 9]));
	regInfo(4, new Tile('Cornfield', [0, 2, 2]));
	regInfo(1, new Tile('Plains', [0, 0, 1]));
	regInfo(2, new Tile('Forest', [0, 4, 3]));
	regInfo(3, new Tile('Campfire', [0, 0, 1]));
	regInfo(5, new Item('Corn', [1, 1]));
	regInfo(6, new Item('Blueberries', [1, 1]));
	regInfo(9, new Char('Hero', [1, 1, 10, 5, 20, {0: 9, 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9}, 4, 0]));
	regInfo(8, new Item('Apple', [1, 1]));
	regInfo(7, new Item('Ring', [1, 1]));
	regInfo(66, new Pool('Pool', [0, 0, {}, 0]));
	regInfo(42, new Lock('Mind', [0, 'xxx']));
	regInfo(23, new Data('Task', ['route', 'range', 'cost'], [[], 0, {}]));
	regInfo(33, new Data('Home', ['tile'], [0]));
	regInfo(73, new Data('Word', ['string'], ['rosebud']));//Codeword

	/*regEvt({}, new Event('Wanderlust', '###', false, 0, null, null));
	regEvt({0: 1}, new Event('Gatherer', '###', false, 0, null, gain([6])));
	regEvt({1: 1}, new Event('Eat', '###', false, 0, null, function (tile_i, char) { loose(6).call(this, tile_i, char); boost(2, 3).call(this, tile_i, char) }));
	regEvt({2: 1}, new Event('Rampage', '###', false, 1, null, null));
	regEvt({3: 1}, new Event('Militia', 'TRAP: Deal 2 DAMAGE to chars STEALING resources', false, 0, null, null));
	regEvt({4: 1}, new Event('Living of the Land', '###', false, 1, null, birth([9, [1, 1, 8, 5, 25, {5: 4}]])));
	regEvt({5: 1}, new Event('Plant Crops', '###', false, 0, spawn([4]), gain([5])));*/

	//conditions
	function in_group (id)
	{
		return function (info)
		{
			return (info.type.group == id);
		}
	}

	function is_type (id)
	{
		return function (info)
		{
			return (info.type.id == id);
		}
	}

	//effects
	function update(i, value)
	{
		return function (world, realm, char, info)
		{
			info.state[i] = value;
		}
	}

	function spawn(data)
	{
		return function (world, realm, char, info)
		{
			world.spawn(data, [info.id]);
		}
	}

	function gain(data)
	{
		return function (world, realm, char, info)
		{
			world.spawn(data, [char.info.id]);
		}
	}

	regCard(0, new Card('Wanderlust', '###', {0: 1}, {0: 1}, in_group(0), null));
	regCard(1, new Card('Jack Lumber', '###', {0: 1}, {0: 1}, is_type(2), gain([6])));

	//CARDTYPES
	////Traps: on tile, trigger on passing char(s)

	////Buildings: on tile
	////Professions
	////gibts passive gebäude?? bestimmt
	////manche gebäude spawnen

	////Development: on buildings
	////Knowledge: on chars/homes

	////Spells: on *
})();
