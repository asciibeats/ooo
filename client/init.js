'use strict';
(function ()
{
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
	});

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var assets = {};
		assets['tiles'] = 'assets/tiles.png';

		var table = new oO.Table(Jupiter, hook, 'http://10.0.0.19:11133', assets, '#444444');
	});
})();
