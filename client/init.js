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

	var Back = oO.Cell.extend(function (color, layout)
	{
		oO.Cell.call(this, layout);
		this.color = color;
	});

	Back.on('frame', function (elapsed, context)
	{
		context.fillStyle = this.color;
		context.fillRect(0, 0, this.width, this.height);
	});

	var Login = oO.Form.extend(function (layout)
	{
		oO.Form.call(this, layout);
		this.show(new Back('#666'));
		this.show(new oO.Field('#5a0').arrange({'top': 10, 'left': 10, 'right':10, 'height': 30}));
		this.show(new oO.Field('#5a0').arrange({'top': 50, 'left': 10, 'right':10, 'height': 30}));
		this.show(new oO.Submit('#5a0', {'top': 90, 'left': 10, 'right':10, 'height': 30}));
	});

	Login.bubble('submit', function (data)
	{
		this.root.send('auth', data[0], data[1]);
	});

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var assets = {};
		assets['tiles'] = 'assets/tiles.png';
		var game = new Jupiter(hook, 'http://10.0.0.19:11133', assets, '#444444');
		game.show(new Back('#a0a'));
		game.show(new Login({'width': 200, 'height': 130}));
	});
})();
