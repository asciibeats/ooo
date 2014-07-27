var oO = require('./oO.js');

var Jupiter = oO.Game.extend(function (size)
{
	oO.Game.call(this, size);
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

var room = new oO.Room(Jupiter, 11133, 3, 1);
room.allow('a', 'a');
room.allow('b', 'b');
