'use strict';
//ein job pro charlevel!!
//ein job ist aktion die jede runde wiederholt wird
//holzfäller (+x holz)
//alle item spawner sind jobs??
(function ()
{
	var HOST = 'http://' + window.location.hostname + ':11133';
	var TILES = [0, 3, 5, 4, 3, 2, 1, 3, 0, 3, 9, 10, 11];
	var MAPTILES = [0, 12, 10, 11, 3, 2, 1, 3, 0, 3, 9, 10, 11];
	var ITEMS = [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
	var WAIT = 'WAIT FOR OTHER PLAYERS';
	var MOVE = 'MAKE A MOVE';

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
			context.fillStyle = '#fa0';
			context.fillRect(0, 0, 64, 64);
		}
	});

	World.on('update:data', function (groups, tiles, chars, homes, map)
	{
		this.data_chars = chars;
		this.data_tiles = tiles;
		this.data_map = map;
	});

	World.on('focus:char', function (char, home)
	{
		this.focus_char = char;
		this.focus_home = home;

		for (var i = 0; i < this.index.length; i++)
		{
			var tile = this.index[i];
			var info = this.data_chars[char.id][0][i];

			if (info)
			{
				tile.data.type = TILES[info.type.id];
				tile.data.info = info;
				tile.data.mask = [];
				tile.data.mask[0] = this.data_tiles[i][2] ? 1 : 0;
			}
			else
			{
				var type = (i in this.data_map) ? MAPTILES[this.data_map[i]] : 0;
				tile.data = {type: type};
			}
		}
	});

	World.on('focus:tile', function (tile)
	{
		this.focus_tile = tile;
	});

	World.on('pick:tile', function (tile, button)
	{
		if (!tile.data.info)
		{
			return;
		}

		var path = this.findPath(this.focus_home, tile, function (data) { return (data.info ? data.info.state[2] : null) });
		var action = JSON.parse(prompt('Action?:', JSON.stringify([this.focus_char.id, tile.i, path.steps, {0: 1}])));

		if (action)
		{
			this.root.trigger('put:action', [action]);
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

	CharMenu.on('update:data', function (groups, tiles, chars, homes, map)
	{
		this.data = [];

		for (var char_id in homes)
		{
			this.data.push([groups[2][char_id], homes[char_id]]);
		}
	});

	CharMenu.on('focus:char', function (char, home)
	{
		this.pick = {};

		for (var i = 0; i < this.data.length; i++)
		{
			if (this.data[i][0].id == char.id)
			{
				this.pick[i] = true;
				break;
			}
		}
	});

	CharMenu.on('pick:item', function (data, index)
	{
		this.root.trigger('focus:char', data);
	});

	var Inventory = oui.SingleMenu.extend(function (asset, layout, style)
	{
		oui.SingleMenu.call(this, asset, layout, style);
	});

	Inventory.method('drawButton', function (time, context, data, pick)
	{
		var type = ITEMS[data.id];
		context.drawImage(this.image, this.image.tile_x[type], this.image.tile_y[type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	Inventory.on('focus:char', function (char, home)
	{
		this.data = [];

		for (var info_id in char.children)
		{
			var info = char.children[info_id];
			this.data.push(info.type);
		}
	});

	Inventory.on('pick:item', function (data, index)
	{
		console.log(data.title);
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
			var actions = this.parent.actionlist.data;
			this.root.send('tock', [actions]);
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

	ActionList.on('put:action', function (data)
	{
		this.data.push(data);
	});

	ActionList.on('update:actions', function (data)
	{
		this.data = data;
	});

	ActionList.on('pick:item', function (data, index)
	{
		var action = JSON.parse(prompt('Action?:', JSON.stringify(data)));

		if (action)
		{
			this.data[index] = action;
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

	var TextBox = ooo.Cell.extend(function (layout, color, font, align, baseline)//switch to oui.Button.extend
	{
		ooo.Cell.call(this, layout);
		this.color = color || '#f00';
		this.font = font || '24px sans-serif';
		this.align = align || 'start';
		this.baseline = baseline || 'top';
		this.string = "abc123";
	});

	TextBox.on('draw', function (time, context)
	{
		context.fillStyle = this.color;
		context.font = this.font;
		context.textAlign = this.align;
		context.textBaseline = this.baseline;
		context.fillText(this.string, 0, 0);
	});

	TextBox.on('focus:char', function (char, home)
	{
		this.string = JSON.stringify(ooc.map(char.type.param, char.state));
	});

	var Game = ooo.Client.extend(function (hook, color)
	{
		ooo.Client.call(this, hook, color);
		this.players = {};
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
	function start_game (time)
	{
		//this.update = false;
		//this.once = true;
		this.time = time;
		this.started = true;
		this.show(this.world);

		this.charmenu = new CharMenu('chars', {left: 0, right: 0, height: 64, bottom: 0}, OUI_REVERSED | OUI_BOTTOM);
		this.show(this.charmenu, 1);

		this.inventory = new Inventory('items', {left: 0, right: 0, height: 64, bottom: 64}, OUI_REVERSED | OUI_BOTTOM);
		this.show(this.inventory, 1);

		this.notemenu = new oui.Menu('steps', {width: 64, right: 0, top: 0, bottom: 128}, OUI_REVERSED | OUI_BOTTOM | OUI_VERTICAL).reset([1,1,1]);
		this.show(this.notemenu, 1);

		this.turnmenu = new TurnMenu({left: 0, right: 0, top: 0, height: 64});
		this.show(this.turnmenu, 1);

		this.charstate = new TextBox({left: 10, right: 0, top: 74, height: 64}, '#fff', '12px sans-serif');
		this.show(this.charstate, 1);
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
		this.players[name] = true;
	});

	Game.on('message:leave', function (name)
	{
		console.log('LEAVE %s', name);
		delete this.players[name];

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
	function process_tick (data, map)
	{
		var groups = {};
		var tiles = {};
		var chars = {};
		var homes = {};
		var parents = {};
		var children = {};

		for (var char_id in data)
		{
			homes[char_id] = this.world.index[data[char_id][0]];
			var knowledge = data[char_id][1];

			for (var info_id in knowledge)
			{
				var argv = knowledge[info_id];
				var info = {};
				info.id = parseInt(info_id);
				info.type = jup.info[argv[0]];
				info.insight = argv[1];
				info.parents = {};
				info.children = {};

				if (argv[2])
				{
					info.state = argv[2];
				}

				if (argv[3])
				{
					//link to children
					for (var i = 0; i < argv[3].length; i++)
					{
						var child_id = argv[3][i];
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
				ooc.add(info, chars, char_id, group_id, info_id);
				//ooo.add(info, data.by_type, group, info.type, id);//for inventory with multiple items stacked
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

		this.trigger('update:data', [groups, tiles, chars, homes, map]);
		var char = groups[2][ooc.minkey(homes)];
		var home = homes[char.id];
		this.trigger('focus:char', [char, home]);
		var tile = null;
		this.trigger('focus:tile', [tile]);
		this.trigger('update:actions', [[]]);
	}

	Game.on('message:continue', function (rules, names, time, data, map, move)
	{
		console.log('CONTINUE', arguments);
		this.forms.login.hide();
		ooc.setLocal('auth_token', this.auth_token);
		init_game.call(this, rules, names);
		start_game.call(this, time, data);
		process_tick.call(this, data, map);
		console.log(move ? MOVE : WAIT);
	});

	Game.on('message:tick', function (data, map)
	{
		console.log('TICK', arguments);

		if (!this.started)
		{
			start_game.call(this, 0);
		}
		else
		{
			this.time++;
		}

		process_tick.call(this, data, map);
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
		jupiter.open(HOST);
	});
})();
