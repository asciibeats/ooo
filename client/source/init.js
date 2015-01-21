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
	var MARKS = ['#942e39', '#651144', '#aaa', '#2f1d71'];//actions, paths, route, others
	var WAIT = 'PLEASE WAIT FOR %d OTHER PLAYERS';
	var MOVE = 'PLEASE MAKE A MOVE';

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

	//World
	function refreshTiles (char, realm)
	{
		for (var i = 0; i < this.index.length; i++)
		{
			if (i in realm.tiles)
			{
				var tile = realm.tiles[i];
				var data = {};
				data.groups = tile.groups;
				data.info = tile.info;
				data.type = MAPTILES[tile.info.type.id];

				if (i in char.actions)
				{
					data.mark = 0;
				}
				else if (i in char.route)
				{
					data.mark = 1;
				}
				else if ((2 in tile.groups) && !((ooc.size(tile.groups[2]) == 1) && (char.info.id in tile.groups[2])))
				{
					data.mark = 3;
				}
			}
			else if (i in realm.map)
			{
				var data = {type: MAPTILES[realm.map[i]]};
			}
			else
			{
				var data = {type: 0};
			}

			this.index[i].data = data;
		}

		var area = this.findArea(ooc.intkeys(char.route), char.info.state[2], function (data) { return (data.info ? data.info.state[2] : null) });

		for (var tile_i in area)
		{
			var tile = this.index[tile_i];
			var info = realm.tiles[tile_i].info;
			tile.data.type = TILES[info.type.id];
		}
	}

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

		if (data.mark != undefined)
		{
			context.globalAlpha = 0.4;
			context.fillStyle = MARKS[data.mark];
			context.fillRect(0, 0, 64, 64);
		}
	});

	World.on('update:data', function (chars, realm)
	{
		this.data_chars = chars;
		this.data_realm = realm;
	});

	World.on('focus:char', function (char)
	{
		this.focus_char = char;
		refreshTiles.call(this, char, this.data_realm);
	});

	World.on('pick:tile', function (tile, button)
	{
		if (!tile.data.info)
		{
			return;
		}

		var char = this.focus_char;

		if (tile.i in char.actions)
		{
			var action = char.actions[tile.i];
			jup.mergePower(char.info.state[5], action[3]);
			var tileb = char.home;
			var steps = action[2];

			for (var i = 0; i < steps.length; i++)
			{
				tileb = tileb.steps[steps[i]];
				char.route[tileb.i] -= 1;

				if (char.route[tileb.i] == 0)
				{
					delete char.route[tileb.i];
					char.info.state[2] += tileb.data.info.state[2];
				}
			}

			action = JSON.parse(prompt('Action?:', JSON.stringify(char.actions[tile.i])));
			delete char.actions[tile.i];
		}
		else
		{
			var path = this.findPath(this.focus_char.home, tile, function (data) { return (data.info ? data.info.state[2] : null) });
			var action = JSON.parse(prompt('Action?:', JSON.stringify([this.focus_char.info.id, tile.i, path.steps, {0: 1}])));
		}

		if (action)
		{
			char.actions[action[1]] = action;
			jup.cancelPower(char.info.state[5], action[3]);
			var tileb = char.home;
			var steps = action[2];

			for (var i = 0; i < steps.length; i++)
			{
				tileb = tileb.steps[steps[i]];

				if (char.route[tileb.i] != undefined)
				{
					char.route[tileb.i] += 1;
				}
				else
				{
					char.route[tileb.i] = 1;
					char.info.state[2] -= tileb.data.info.state[2];
				}
			}
		}

		refreshTiles.call(this, char, this.data_realm);
		this.root.trigger('refresh:stats');
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

	CharMenu.on('update:data', function (chars, realm)
	{
		this.data = [];

		for (var char_id in chars)
		{
			this.data.push(chars[char_id]);
		}
	});

	CharMenu.on('focus:char', function (char)
	{
		this.pick = {};

		for (var i = 0; i < this.data.length; i++)
		{
			if (this.data[i].info.id == char.info.id)
			{
				this.pick[i] = true;
				break;
			}
		}
	});

	CharMenu.on('pick:item', function (data, index)
	{
		this.root.trigger('focus:char', [data]);
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

	Inventory.on('focus:char', function (char)
	{
		this.data = [];

		for (var info_id in char.info.children)
		{
			var info = char.info.children[info_id];
			this.data.push(info.type);
		}
	});

	Inventory.on('pick:item', function (data, index)
	{
		console.log(data.title);
	});

	var TurnMenu = oui.Menu.extend(function (layout)
	{
		oui.Menu.call(this, 'buttons', layout);
		this.reset([7,1]);
	});

	TurnMenu.on('focus:char', function (char)
	{
		this.focus_char = char;
	});

	TurnMenu.on('pick:item', function (data, index)
	{
		if (index == 0)
		{
			var actions = [];

			for (var tile_i in this.focus_char.actions)
			{
				actions.push(this.focus_char.actions[tile_i]);
			}

			this.root.send('tock', [actions]);
		}
		else
		{
			//delete char.actions
		}
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

	TextBox.on('refresh:stats', function ()
	{
		var char = this.focus_char;
		this.string = JSON.stringify(ooc.map(char.info.type.param, char.info.state));
	});

	TextBox.on('focus:char', function (char)
	{
		this.focus_char = char;
		this.string = JSON.stringify(ooc.map(char.info.type.param, char.info.state));
	});

	//Game
	function initGame (rules, names)
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
	function startGame (time)
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

		//this.notemenu = new oui.Menu('steps', {width: 64, right: 0, top: 0, bottom: 128}, OUI_REVERSED | OUI_BOTTOM | OUI_VERTICAL).reset([1,1,1]);
		//this.show(this.notemenu, 1);

		this.turnmenu = new TurnMenu({left: 0, right: 0, top: 0, height: 64});
		this.show(this.turnmenu, 1);

		this.charstate = new TextBox({left: 10, right: 0, top: 74, height: 64}, '#fff', '12px sans-serif');
		this.show(this.charstate, 1);
	}

	//Game
	function countDown (delay)
	{
		console.log('starting in %d', delay);
		delay--;

		if (delay > 0)
		{
			var that = this;
			this.timeout = setTimeout(function () { countDown.call(that, delay) }, 1000);
		}
		else
		{
			delete this.timeout;
		}
	}

	function routeof (info)
	{
		var route = {};
		var open = [];

		do
		{
			if (ooc.size(info.parents))
			{
				for (var info_id in info.parents)
				{
					open.push(info.parents[info_id]);
				}
			}
			else
			{
				route[info.id] = true;
			}
		}
		while (info = open.pop())

		return route;
	}

	//Game
	function prepareTock (data, map)
	{
		var groups = {};
		var chars = {};
		var realm = {map: map, tiles: {}};
		var parents = {};
		var children = {};

		for (var char_id in data)
		{
			var home = data[char_id][0];
			var knowledge = data[char_id][1];
			var effort = data[char_id][2];
			var char = {};

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
							ooc.put(info, parents, child_id, info_id);
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
				ooc.put(info, groups, group_id, info_id);
				ooc.put(info, char, 'groups', group_id, info_id);
				//ooo.add(info, data.by_type, group, info.type, id);//for inventory with multiple items stacked
			}

			char.home = this.world.index[home];
			char.info = char.groups[2][char_id];
			char.actions = {};
			char.route = {};

			for (var i = 0; i < effort[0].length; i++)
			{
				char.route[effort[0][i]] = 1;
			}

			char.info.state[2] -= effort[1];
			chars[char_id] = char;
		}

		for (var group_id in groups)
		{
			for (var info_id in groups[group_id])
			{
				var info = groups[group_id][info_id];
				var route = routeof(info);

				for (var tile_i in route)
				{
					ooc.put(info, realm.tiles, tile_i, 'groups', group_id, info_id);
				}
			}
		}

		for (var tile_i in realm.tiles)
		{
			realm.tiles[tile_i].info = groups[0][tile_i];
		}

		this.trigger('update:data', [chars, realm]);
		var char = chars[ooc.minkey(chars)];
		this.trigger('focus:char', [char]);
	}

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
			initGame.call(this, rules, names);
			this.send('join', [id]);
		}
		else
		{
			var rules = JSON.parse(prompt('type rules:', '[1,32]'));
			var names = [this.auth_token[0]];
			initGame.call(this, rules, names);
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

	Game.on('message:ready', function (delay)
	{
		console.log('READY %d', delay);
		countDown.call(this, delay);
	});

	Game.on('message:continue', function (rules, names, time, data, map, wait)
	{
		console.log('CONTINUE', arguments);
		this.forms.login.hide();
		ooc.setLocal('auth_token', this.auth_token);
		initGame.call(this, rules, names);
		startGame.call(this, time);
		prepareTock.call(this, data, map);

		if (wait)
		{
			console.log(WAIT, wait);
		}
		else
		{
			console.log(MOVE);
		}
	});

	Game.on('message:tick', function (data, map)
	{
		console.log('TICK', arguments);

		if (!this.started)
		{
			startGame.call(this, 0);
		}
		else
		{
			this.time++;
		}

		prepareTock.call(this, data, map);
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

	Game.on('message:wait', function (wait)
	{
		console.log(WAIT, wait);
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
