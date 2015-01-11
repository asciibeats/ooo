'use strict';
//ein job pro charlevel!!
//ein job ist aktion die jede runde wiederholt wird
//holzfäller (+x holz)
//alle item spawner sind jobs??
(function ()
{
	var TILES = [0, 3, 5, 4, 3, 2, 1, 3, 0, 3, 9, 10, 11];
	var MOVE = 'MAKE A MOVE';
	var WAIT = 'WAIT FOR OTHER PLAYERS';

	var Login = oui.Form.extend(function (color, font, layout, align, baseline)
	{
		oui.Form.call(this, color, font, layout, align, baseline);
		this.show(new oui.Field('auth_token', {'top': 10, 'left': 10, 'right':10, 'height': 30}));
		this.show(new oui.Field('auth_token', {'top': 50, 'left': 10, 'right':10, 'height': 30}));
		this.show(new oui.Submit('login', '#a50', {'top': 90, 'left': 10, 'right':10, 'height': 30}));
	});

	Login.bubble('form:submit', function (type, data)
	{
		this.root.auth_token = data;
		this.root.send('login', data);
	});

	var World = oui.TileMap.extend(function (size, asset)
	{
		oui.TileMap.call(this, size, asset);
		this.tile_mask = 0;
	});

	World.method('Data', function (map, i, x, y)
	{
		this.type = 0;
	});

	World.method('drawTile', function (tile, data, time, context)
	{
		context.drawImage(this.image, this.image.tile_x[data.type], this.image.tile_y[data.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);

		if (data.mask && data.mask[this.tile_mask])
		{
			context.globalAlpha = 0.4;
			context.fillStyle = '#00f';
			context.fillRect(0, 0, 64, 64);
		}
	});

	World.on('update:data', function (terrain, tiles, homes)
	{
		for (var i = 0; i < this.index.length; i++)
		{
			var tile = this.index[i];
			var info = terrain[i];

			if (info)
			{
				var groups = tiles[i];
				tile.data.type = TILES[info.type.id];
				tile.data.info = info;
				tile.data.mask = [];
				tile.data.mask[0] = groups[2] ? 1 : 0;
			}
			else
			{
				tile.data = {type: 0};
			}
		}
	});

	World.on('update:focus', function (char, home, tile)
	{
		this.focus_char = char;
		this.focus_home = this.index[home];
		this.focus_tile = tile;
	});

	World.on('pick:tile', function (tile, button)
	{
		if (!tile.data.info)
		{
			return;
		}

		//console.log(JSON.stringify(this.focus_char.state));
		var path = this.findPath(this.focus_home, tile, function (data) { return (data.info ? data.info.state[2] : null) });
		var action = JSON.parse(prompt('Action?:', JSON.stringify([path.steps, [11, [], []]])));//path;type;param(could be targets,extra card+param, ...)

		if (action)
		{
			this.root.trigger('put:action', [this.focus_char, tile.i, action]);
		}
	});

	var CharMenu = oui.SingleMenu.extend(function (asset, layout, style)
	{
		oui.SingleMenu.call(this, asset, layout, style);
	});

	CharMenu.method('drawButton', function (time, context, data, pick)
	{
		if (pick)
		{
			var type = 1;
		}
		else
		{
			var type = 0;
		}

		context.drawImage(this.image, this.image.tile_x[type], this.image.tile_y[type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	CharMenu.on('update:data', function (terrain, tiles, homes)
	{
		this.data = [];
		this.picked = {};

		for (var char_id in homes)
		{
			this.data.push(homes[char_id]);
		}
	});

	/*CharMenu.on('update:focus', function (char_id, home_i, tile_i)
	{
		this.pick = {};

		for (var i = 0; i < this.data.length; i++)
		{
			if (data.id == this.data[i].id)
			{
				this.pick[i] = true;
				break;
			}
		}
	});*/

	CharMenu.on('pick:item', function (data, index)
	{
		//this.root.trigger('update:focus', []);
	});

	///////////////////////////TURN_MENU
	var TurnOptions = oui.Menu.extend(function ()
	{
		oui.Menu.call(this, 'buttons', {left: 0, width: 128, top: 0, bottom: 0});
		this.reset([7,1]);
	});

	TurnOptions.on('pick:item', function (data, index)
	{
		if (index == 0)
		{
			this.root.send('tock', [this.parent.actionlist.data]);
			console.log(WAIT);
		}

		this.parent.actionlist.data = [];
	});

	var ActionList = oui.Menu.extend(function ()
	{
		oui.Menu.call(this, 'chars', {left: 128, right: 0, top: 0, bottom: 0});
	});

	ActionList.method('drawButton', function (time, context, data, pick)
	{
		var type = 1;
		context.drawImage(this.image, this.image.tile_x[type], this.image.tile_y[type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	ActionList.on('put:action', function (char_id, tile_i, action)
	{
		this.data.push([char_id, tile_i, action]);
	});

	ActionList.on('update:actions', function (data)
	{
		this.data = data;
	});

	ActionList.on('pick:item', function (data, index)
	{
		var action = JSON.parse(prompt('Action?:', JSON.stringify(data[2])));

		if (action)
		{
			data[2] = action;
		}
		else
		{
			this.data.splice(index, 1);
		}
	});

	var TurnMenu = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		this.options = new TurnOptions();
		this.actionlist = new ActionList();
		this.show(this.options, 1);
		this.show(this.actionlist, 1);
	});

	var Game = ooo.Client.extend(function (hook, color)
	{
		ooo.Client.call(this, hook, color);
		this.started = false;
		this.forms = {};
		this.forms.login = new Login('#5a0', '30px sans-serif', {'width': 200, 'height': 130}).center(100, 65).rotate(-10);
		//this.show(new ooo.Box('#a0a'));
	});

	Game.on('socket:open', function ()
	{
		var auth_token = ooc.getLocal('auth_token');

		if (auth_token)
		{
			this.auth_token = auth_token;
			this.send('login', auth_token);
		}
		else
		{
			this.show(this.forms.login);
		}
	});

	Game.on('socket:close', function (code)
	{
		console.log('CLOSED %s', code);
	});

	Game.on('message:deny', function ()
	{
		this.forms.login.reset();
		this.show(this.forms.login);
	});

	//Game
	function init_game (rules, names)
	{
		this.rules = rules;
		this.players = {};

		for (var i = 0; i < names.length; i++)
		{
			this.players[names[i]] = true;
		}

		this.world = new World(rules[1], 'steps');
	}

	//Game
	function start_game (time, info)//, chars
	{
		//this.update = false;
		//this.once = true;
		this.started = true;
		this.show(this.world);

		this.charmenu = new CharMenu('chars', {left: 0, right: 0, height: 64, bottom: 0}, OUI_REVERSED | OUI_BOTTOM);
		this.show(this.charmenu, 1);

		this.notemenu = new oui.Menu('steps', {width: 64, right: 0, top: 0, bottom: 64}, OUI_REVERSED | OUI_BOTTOM | OUI_VERTICAL).reset([1,1,1]);
		this.show(this.notemenu, 1);

		this.turnmenu = new TurnMenu({left: 0, right: 0, top: 0, height: 64});
		this.show(this.turnmenu, 1);

		/*this.chartabs = new oui.Tabbed({left: 0, right: 0, top: 0, bottom: 64}, 'buttons', {left: 0, right: 0, top: 0, height: 64}, OUI_REVERSED | OUI_BOTTOM);
		this.chartabs.open(5, new Inventory('items', {left: 0, right: 0, top: 64, bottom: 0}, OUI_REVERSED | OUI_BOTTOM));
		this.chartabs.open(6, new CharSheet('#333', {left: 0, right: 0, top: 64, bottom: 0}));
		this.chartabs.open(7, new PickAction('#333', {left: 0, right: 0, top: 64, bottom: 0}));

		this.tiletabs = new oui.Tabbed({left: 0, right: 0, top: 0, bottom: 64}, 'buttons', {left: 0, right: 0, top: 0, height: 64}, OUI_REVERSED | OUI_BOTTOM);
		this.tiletabs.open(5, new ItemPool('items', {left: 0, right: 0, top: 64, bottom: 0}, OUI_REVERSED | OUI_BOTTOM));
		this.tiletabs.open(6, new SpawnSlots('chars', {left: 0, right: 0, top: 64, bottom: 0}, OUI_REVERSED | OUI_BOTTOM));

		this.mainmenu = new oui.Tabbed({width: 320, right: 0, top: 0, bottom: 0}, 'options', {left: 0, right: 0, height: 64, bottom: 0}, OUI_REVERSED | OUI_BOTTOM | OUI_VERTICAL);
		this.mainmenu.show(new ooo.Box('#555'));
		this.mainmenu.open(1, this.chartabs);
		this.mainmenu.open(2, this.tiletabs);
		this.show(this.mainmenu, 1);*/

		this.data.time = time;
		process_tick.call(this, info);
		//this.trigger('put:action', [[]]);//fill with repeated actions
	}

	Game.on('message:grant', function (games)
	{
		this.forms.login.hide();
		ooc.setLocal('auth_token', this.auth_token);

		if (ooc.size(games) > 0)
		{
			var id = parseInt(prompt('choose from: ' + JSON.stringify(games), '0'));
			var rules = games[id][0];
			var names = games[id][1];
			names.push(this.auth_token[0]);
			init_game.call(this, rules, names);
			this.send('join', [id]);
		}
		else
		{
			var rules = JSON.parse(prompt('type rules:', '[1,32]'));
			var names = [this.auth_token[0]];
			init_game.call(this, rules, names);
			this.send('host', [rules]);
		}
	});

	Game.on('message:join', function (name)
	{
		console.log('JOIN %s', name);
		this.updatez(true, 'players', name);
	});

	Game.on('message:leave', function (name)
	{
		console.log('LEAVE %s', name);
		this.deletez('players', name);

		if (this.timeout)
		{
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	});

	//Game
	function count_down (delay)
	{
		console.log('starting in %d', delay);
		delay--;

		if (delay > 0)
		{
			var that = this;
			this.timeout = setTimeout(function () { count_down.call(that, delay) }, 1000);
		}
		else
		{
			delete this.timeout;
		}
	}

	Game.on('message:ready', function (delay)
	{
		console.log('READY %d', delay);
		count_down.call(this, delay);
	});

	function terrainof (info)
	{
		var tiles = [];

		if (ooc.size(info.parents))
		{
			for (var id in info.parents)
			{
				tiles = tiles.concat(terrainof(info.parents[id]));
			}
		}
		else
		{
			tiles.push(info);
		}

		return tiles;
	}

	//Game
	function process_tick (history)
	{
		var groups = {};
		var tiles = {};
		var homes = {};
		var parents = {};
		var children = {};

		for (var char_id in history)
		{
			homes[char_id] = history[char_id][0];
			//var know = history[char_id][1];
			//var jobs = history[char_id][2];

			for (var info_id in history[char_id][1])
			{
				var data = history[char_id][1][info_id];
				var info = {};
				info.id = parseInt(info_id);
				info.type = INFO[data[0]];
				info.insight = data[1];
				info.parents = {};
				info.children = {};

				if (data[2])
				{
					info.state = data[2];
				}

				if (data[3])
				{
					//link to children
					for (var i = 0; i < data[3].length; i++)
					{
						var child_id = data[3][i];
						var child = children[child_id];

						if (child)
						{
							info.children[child_id] = child;
							child.parents[info_id] = info;
						}
						else
						{
							ooc.add(info, parents, child_id, info_id);
						}
					}
				}

				//link to parents
				if (info_id in parents)
				{
					for (var parent_id in parents[info_id])
					{
						var parent = parents[info_id][parent_id];
						parent.children[info_id] = info;
						info.parents[parent_id] = parent;
					}
				}
				else
				{
					children[info_id] = info;
				}

				var group_id = info.type.group;
				ooc.add(info, groups, group_id, info_id);
				//ooo.add(info, data.by_id, group, id);
				//ooo.add(info, data.by_type, group, info.type, id);
				//ooo.add(info, data.by_char, char, group, id);
			}
		}

		for (var group_id in groups)
		{
			for (var info_id in groups[group_id])
			{
				var info = groups[group_id][info_id];
				var terrain = terrainof(info);

				for (var i = 0; i < terrain.length; i++)
				{
					ooc.add(info, tiles, terrain[i].id, group_id, info_id);
				}
			}
		}

		this.trigger('update:data', [groups[0], tiles, homes]);
		var char_id = ooc.minkey(homes);
		var home = homes[char_id];
		var tile = null;
		this.trigger('update:focus', [char_id, home, tile]);
		this.trigger('update:actions', [[]]);
	}

	Game.on('message:continue', function (rules, names, time, info, move)
	{
		console.log('CONTINUE', arguments);
		this.forms.login.hide();
		ooc.setLocal('auth_token', this.auth_token);

		init_game.call(this, rules, names);
		start_game.call(this, time, info);
		console.log(move ? MOVE : WAIT);
	});

	Game.on('message:tick', function (info)
	{
		console.log('TICK', arguments);

		if (!this.started)
		{
			start_game.call(this, 0, info);
		}

		this.data.time++;
		process_tick.call(this, info);
		console.log(MOVE);
	});

	Game.on('message:away', function (name)
	{
		console.log('AWAY %s', name);
	});

	Game.on('message:back', function (name)
	{
		console.log('BACK %s', name);
	});

	Game.on('message:wait', function (left)
	{
		console.log('WAIT %d', left);
	});

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var jupiter = new Game(hook, '#444');
		jupiter.load('steps', 'assets/steps.png', 64, 64);
		jupiter.load('chars', 'assets/chars.png', 64, 64);
		jupiter.load('items', 'assets/items.png', 64, 64);
		jupiter.load('path', 'assets/path.png', 64, 64);
		jupiter.load('options', 'assets/options.png', 64, 64);
		jupiter.load('buttons', 'assets/buttons.png', 64, 64);
		jupiter.open('http://10.0.0.19:11133');
	});
})();
