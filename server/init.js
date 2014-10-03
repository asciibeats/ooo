var oO = require('./oO.js');

var Jupiter = oO.Game.extend(function (size, tiles)
{
	oO.Game.apply(this, arguments);
	this.tiles = tiles;
});

Jupiter.method('start', function ()
{
	console.log('I am Jupiter King!');
	//init board
	//init cards
	//init seats
});

Jupiter.method('tick', function ()
{
	if (false)
	{
		throw 1248;
	}
});

Jupiter.method('tock', function ()
{
});

var room = new oO.Server(Jupiter, 11133, 3, 1);
room.allow('a', 'a');
room.allow('b', 'b');
room.players['a'].befriend(room.players['b']);
room.players['b'].befriend(room.players['a']);
