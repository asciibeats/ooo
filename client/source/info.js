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

	jup.rootsOf = function (info, group)
	{
		var roots = {};
		var open = [];

		do
		{
			if (info.type.group == group)
			{
				roots[info.id] = true;
			}
			else
			{
				for (var info_id in info.parents)
				{
					open.push(info.parents[info_id]);
				}
			}
		}
		while (info = open.pop())

		return roots;
	}

	jup.addPower = function (a, b)
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

	jup.subtractPower = function (a, b)
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

	jup.matchPower = function (card, char)
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

			if (jup.matchPower(power, char.info.state[3]))
			{
				match[info_id] = char;
			}
		}

		return match;
	}

	var Info = ooc.Class.extend(function (group, subgroup, obscurity, title, param, state)
	{
		this.group = group;
		this.subgroup = subgroup;
		this.obscurity = obscurity;
		this.title = title;
		this.param = param;
		this.state = state;
	});

	var Data = Info.extend(function (title, obscurity, param, state)
	{
		Info.call(this, 0, 0, obscurity, title, param, state);
	});

	var Tile = Info.extend(function (title, obscurity, range, state)
	{
		Info.call(this, 1, 0, obscurity, title, [], state);
		this.range = range;
	});

	var Char = Info.extend(function (title, obscurity, state)
	{
		Info.call(this, 2, 0, obscurity, title, ['range', 'insight', 'health', 'power', 'crowns', 'cards'], state);
	});

	var Item = Info.extend(function (title, obscurity, state)
	{
		Info.call(this, 3, 0, obscurity, title, [], state);
	});

	//special item
	var Lock = Info.extend(function (title, obscurity, state)
	{
		Info.call(this, 3, 1, obscurity, title, ['key'], state);
	});

	//special item
	var Key = Info.extend(function (title, obscurity, state)
	{
		Info.call(this, 3, 2, obscurity, title, ['key'], state);
	});

	var Card = ooc.Class.extend(function (title, description, power, condition, effect)
	{
		ooc.Class.call(this);
		this.title = title;
		this.description = description;
		this.power = power;//char needs to play
		this.condition = condition;//function (info1)
		this.effect = effect;//function (info2)
	});

	function regInfo (id, info)
	{
		info.id = id;
		ooc.put(info, jup.infos, 'by_id', id);
	}

	function regCard (id, group, card)
	{
		card.id = id;
		card.group = group;
		ooc.put(card, jup.cards, 'by_id', id);
		ooc.push(card, jup.cards, 'by_group', group);
	}

	//conditions
	function in_group (group)//subgroup
	{
		return function (info)
		{
			return (info.type.group == group);
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

	regInfo(0, new Tile('Grassland', 1, 1, []));
	regInfo(1, new Tile('Forest', 3, 3, []));
	regInfo(5, new Item('Corn', 1, []));
	regInfo(6, new Item('Blueberries', 1, []));
	regInfo(9, new Char('Hero', 1, [5, 5, 2, {0: 9, 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9}, 0, 1]));
	regInfo(8, new Item('Apple', 1, []));
	regInfo(7, new Item('Ring', 1, []));
	regInfo(42, new Data('Mind', 0, [], []));
	regInfo(33, new Data('Home', 0, ['tile'], [0]));
	regInfo(23, new Data('Task', 0, ['route', 'range', 'power'], [[], 0, {}]));
	regInfo(73, new Data('Word', 0, ['string'], ['rosebud']));//Codeword or sth that can be extract by torture

	regCard(0, 0, new Card('Wanderlust', '###', {0: 1}, in_group(1), null));
	regCard(2, 0, new Card('Jack Lumber', '###', {0: 1}, is_type(1), gain([6])));
	regCard(1, 1, new Card('Imperial Scout', '###', {1: 2}, is_type(0), null));
	regCard(3, 1, new Card('Imperial Guard', '###', {0: 2}, is_type(0), null));

	//CARDTYPES
	////Traps: on tile, trigger on passing char(s)

	////Buildings: on tile
	////Professions
	////gibts passive gebäude?? bestimmt
	////manche gebäude spawnen

	////Development: on buildings
	////Knowledge: on chars/homes

	////Spells: on *
	///////Special: hide/reveal (implemented in knowledge gathering functions)
	///////functions like a general lock/key!!!
	///////just put as char.info (with former char info as child)
	//////////HAS TO BE LIKE AN INVISIBLE LOCK!!

	////Treaties: change outcome of collisions (freely modify, add remove condition etc)
})();
