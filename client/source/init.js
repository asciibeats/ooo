'use strict';
(function ()
{
	var COSTS = [1, 5, null];

	var core = {};
	core.title = '';
	core.assets = [['buttons', 'assets/buttons.png', 96, 96], ['hints', 'assets/hints.png', 300, 50], ['tiles', 'assets/tiles.png', 96, 96]];
	//core.templates = [['custom.Box', 'core.Box', 'asdf', [['String', 'color', '#faa'], ['Layout', 'layout', []]], 'Super.call(this, color, layout); this.item = 21354;', {test: ['a', 'b', 'return a + b;']}, {on: {mouse_click: ['button', 'down_x', 'down_y', 'this.color = "#af0"; console.log(this.instance.name, this.template.name);return false;']}}]];
	core.templates = [];
	//var form_args = [['Integer', ['count', 0, 10, 5, {top: 0, height: 18}]], ['String', ['name', 'my_name', {top: 18, height: 18}]], ['Options', ['option', [16, 32, 64], 1, {top: 36, height: 18}]], ['Options', ['do it', [0, 1], 0, {top: 54, height: 18}]]];
	core.instances = [['Background', 'core.Box', ['#333']]];//, ['MyForm', 'core.Form', [form_args, null]]

	var WorldMap = ooo.extra.TileMap.extend(function (size, terrain, home, spawns)
	{
		ooo.extra.TileMap.call(this, size, 'tiles');
		this.home = this.tiles[home];
		this.spawns = spawns;
		this.marks = {};
		this.steps = {};

		for (var i = 0; i < terrain.length; i++)
		{
			this.tiles[i].data.type = terrain[i];
		}

		this.refresh();
	});

	WorldMap.method('calcCost', function (data)
	{
		return COSTS[data.type];
	});

	//WorldMap
	function renderTile (context, type)
	{
		context.drawImage(this.image, this.image.tile_x[type], this.image.tile_y[type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	}

	WorldMap.method('drawTile', function (tile, data, time, context)
	{
		renderTile.call(this, context, tile.data.type);

		if (tile == this.home)
		{
			renderTile.call(this, context, 3);
		}
		else if (tile.i in this.steps)
		{
			renderTile.call(this, context, 4);
		}
		else if (tile.i in this.marks)
		{
			renderTile.call(this, context, 5);
		}
	});

	WorldMap.method('refresh', function ()
	{
		this.marks = {};

		for (var id in this.spawns)
		{
			this.marks[this.spawns[id]] = true;
		}
	});

	WorldMap.method('move', function ()
	{
		this.home = this.tiles[this.path.tiles[this.path.tiles.length - 1]];
		delete this.path;
		this.steps = {};
		this.viewTile(this.home);
	});

	WorldMap.on('pick_tile', function (tile, button)
	{
		if (tile.data.type == 2)
		{
			console.log('cannot walk on water');
			return;
		}

		var path = this.findPath(this.home, tile);
		this.steps = {};

		for (var i = 0; i < path.tiles.length; i++)
		{
			this.steps[path.tiles[i]] = true;
		}

		this.path = path;
		this.root.trigger('show_move');
	});

	var TurnButton = ooo.core.Sprite.extend(function ()
	{
		ooo.core.Sprite.call(this, 'buttons', 0, {right: 20, width: 64, bottom: 20, height: 64});
	});

	TurnButton.on('mouse_click', function (button, down_x, down_y)
	{
		this.root.world.move();
		this.root.send('move', [this.root.world.home.i]);
		this.root.trigger('show_target');
		return false;
	});

	var Game = ooo.core.Client.extend(function (hook, core, fill_style)
	{
		ooo.core.Client.call(this, hook, core, fill_style);
		this.button = new TurnButton();
	});

	Game.capture('message_world', function (size, terrain, home, spawns)
	{
		console.log('WORLD %d %s %d %s', size, JSON.stringify(terrain), home, JSON.stringify(spawns));
		this.world = new WorldMap(size, terrain, home, spawns);
		this.show(this.world, 0);
		this.world.viewTile(this.world.home);
		this.trigger('show_target');
	});

	Game.capture('message_spawn', function (id, home)
	{
		console.log('SPAWN %d %d', id, home);
		this.world.spawns[id] = home;
		this.world.refresh();
	});

	Game.capture('message_vanish', function (id)
	{
		console.log('VANISH %d', id);
		delete this.world.spawns[id];
		this.world.refresh();
	});

	Game.capture('socket_close', function (message)
	{
		console.log('CLOSED %s', message);
	});

	Game.capture('show_target', function ()
	{
		this.button.hide();
		this.show(new ooo.core.Sprite('hints', 0, {width: 300, height: 50, bottom: 50}), 2);
	});

	Game.capture('show_move', function ()
	{
		this.show(this.button, 1);
		this.show(new ooo.core.Sprite('hints', 1, {width: 300, height: 50, bottom: 50}), 2);
	});

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var root = new Game(hook, core);
		console.log(window.location.hostname);
		//root.open('http://' + window.location.hostname + ':11133');
		root.open('http://192.168.178.35:11133');
	});
})();
