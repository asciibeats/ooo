'use strict';
(function ()
{
	var Jupiter = oO.Game.extend(function (hook, url, assets, color)
	{
		oO.Game.call(this, hook, url, assets, color);
	});

	Jupiter.method('init', function (size, map_s)
	{
		oO.Game.prototype.init.call(this, size);
		this.map = new oO.TileMap(map_s, 96, 96, 'tiles');
		this.show(this.map);
		this.map.tiles[0][0].type = 1;
		this.map.tiles[1][7].type = 2;
		this.map.tiles[4][4].type = 4;
		this.map.tiles[5][4].type = 3;
	});

	Jupiter.on('start', function (time, world, seat, realm)
	{
		oO.Game.prototype.events.on.start.call(this, time, world, seat, realm);
	});

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var assets = {};
		assets['tiles'] = 'assets/tiles.png';
		var game = new Jupiter(hook, 'http://10.0.0.19:11133', assets, '#444444');
		var form = new oO.Form();
		var input = new oO.Input();
		var input2 = new oO.Input();
		form.show(input);
		form.show(input2);
		game.show(form, 10);
		input2.place(0,100);
		form.bubble('submit', function (data)
		{
			game.send('auth', data[0], data[1]);
		});
	});
})();
