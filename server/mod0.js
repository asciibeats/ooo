var mod = {};
module.exports = mod;
//HOWTO PREVENT REQUIRE IN THIS FILE!!!! require(xy, false) in init??
//contain/restrict access only to necessary data (world,traps,pools,realms,??)
//GITHUB REPOSITORY MIT ALLEN MODS!!
mod.name = 'normal';//lowercase alphanumeric
mod.title = 'An unfancy Game of Jupiter Kings';
mod.description = 'longer text explaining the inner workings of this mod';
mod.author = 'Tilman Michael Jaeschke';
mod.contact = 'trulla@email.com';
//mod.rules = [];//cocks to tune by host (in host rules menu)

//return true if game should start
mod.ready = function (stats, rules, size)
{
	if (size == rules[0])
	{
		return true;
	}
}

//run every round after all events happened and before char knowledge is updated
mod.update = function (stats, rules, world, time)
{
	if (time == 0)
	{
		world.init(rules[1]);
		var forest = [133, 134, 135, 102, 166];

		for (var i = 0; i < forest.length; i++)
		{
			var tile = world.index[forest[i]];
			world.unspawn(tile.data.info);
			tile.data.info = world.spawn([2]);
		}

		for (var seat = 0; seat < world.realms.length; seat++)
		{
			var realm = world.realms[seat];

			if (seat == 0)
			{
				world.birth([9], 132, seat);
				world.birth([9], 234, seat);
			}
			else
			{
				world.birth([9], 202, seat);
			}

			realm.briefing.message = 'hello';
			realm.briefing.draw = 2;
		}
	}
	else
	{
		//request deck refill
		for (var seat = 0; seat < world.realms.length; seat++)
		{
			var realm = world.realms[seat];
			realm.briefing = {draw: 1};
		}

		//check win condition
	}
}

mod.draw = function (stats, rules, world, realm, time, type)
{
	var card_id = type;
	return card_id;
}
