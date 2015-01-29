var mod = {};
module.exports = mod;
var jup = require('../client/source/info.js');
//HOWTO PREVENT REQUIRE IN THIS FILE!!!! require(xy, false) in init??
//contain/restrict access only to necessary data (world,traps,pools,realms,??)
//GITHUB REPOSITORY MIT ALLEN MODS!!
mod.name = 'normal';//lowercase alphanumeric
mod.title = 'An unfancy Game of Jupiter Kings';
mod.description = 'longer text explaining the inner workings of this mod';
mod.author = 'Tilman Michael Jaeschke';
mod.contact = 'trulla@email.com';
//mod.rules = [];//cocks to tune by host (in host rules menu)

//return the size of the world to start!!!
mod.ready = function (stats, rules, size)
{
	if (size == rules[0])
	{
		return rules[1];
	}
}

mod.start = function (stats, rules, world)
{
	var forest = [133, 134, 135, 102, 166];

	for (var i = 0; i < forest.length; i++)
	{
		world.transform(forest[i], 1);
	}

	for (var seat = 0; seat < world.realms.length; seat++)
	{
		var realm = world.realms[seat];

		if (seat == 0)
		{
			realm.join(world.deliver([9], 132));
			//realm.join(world.deliver([9], 234));
		}
		else
		{
			realm.join(world.deliver([9], 202));
		}

		realm.briefing.message = 'Welcome Sire';
		realm.briefing.draw = 0;

		for (var info_id in realm.chars)
		{
			var char = realm.chars[info_id];
			realm.briefing.draw += char.info.state[5];
		}
	}
}

//run every round after all events happened and before char knowledge is updated
mod.update = function (stats, rules, world, time)
{
	if (time > 0)
	{
		for (var seat = 0; seat < world.realms.length; seat++)
		{
			var realm = world.realms[seat];
			realm.briefing.message = 'Round ' + (time + 1);
			var draw = 0;

			for (var info_id in realm.chars)
			{
				var char = realm.chars[info_id];
				draw += char.info.state[5];
			}

			realm.briefing.draw = draw - realm.hand.length;
		}

		//check win condition
	}
}

mod.draw = function (stats, rules, world, realm, time, group)
{
	var cards = jup.cards.by_group[group];
	var card = cards[Math.floor(Math.random() * cards.length)];
	return card.id;
}
