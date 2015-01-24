'use strict';
//power menu drawButton funktion mit werten
//button klasse (zwischen sumbmit und input; input mit label)
//rules_prompt
//browser_prompt
//ein job pro charlevel!!??
//ein job ist aktion die jede runde wiederholt wird
//holzfäller (+x holz)
//alle item spawner sind jobs??

(function ()
{
	var HOST = 'http://' + window.location.hostname + ':11133';
	var TILES = [0, 3, 5, 4, 3, 2, 1, 3, 0, 3, 9, 10, 11];
	var MAPTILES = [0, 12, 10, 11, 3, 2, 1, 3, 0, 3, 9, 10, 11];
	var ITEMS = [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
	var BORDER = 24;
	var MARKS = ['#942e39', '#651144', '#aaa', '#2f1d71', '#fff', '#f44'];//actions, paths, route, others
	var WAIT = 'PLEASE WAIT FOR %d OTHER PLAYERS';
	var MOVE = 'PLEASE MAKE A MOVE';

	//WorldMap
	function refreshArea (char, path)
	{
		if (path)
		{
			var steps = ooc.hash(path.tiles);
			var open = ooc.intkeys(char.route).concat(path.tiles);
			var range = char.info.state[2] - path.cost;
			var target = path.tiles[path.tiles.length - 1];
		}
		else
		{
			var steps = {};
			var open = ooc.intkeys(char.route);
			var range = char.info.state[2];
		}

		this.range = this.findArea(open, range, function (data) { return (data.info ? data.info.state[2] : null) });

		for (var i in this.realm.tiles)
		{
			var data = this.index[i].data;

			if (i in this.range)
			{
				data.type = TILES[data.info.type.id];
			}
			else
			{
				data.type = MAPTILES[data.info.type.id];
			}

			if (i == target)
			{
				data.mark = 5;
			}
			else if (i in steps)
			{
				data.mark = 4;
			}
			else if (i in char.actions)
			{
				data.mark = 0;
			}
			else if (4 in data.groups)
			{
				data.mark = 2;
			}
			else if (i in char.route)
			{
				data.mark = 1;
			}
			else if ((2 in data.groups) && !((ooc.size(data.groups[2]) == 1) && (char.info.id in data.groups[2])))
			{
				data.mark = 3;
			}
			else
			{
				delete data.mark;
			}
		}
	}

	var WorldMap = oui.TileMap.extend(function (size, asset, layout)
	{
		oui.TileMap.call(this, size, asset, layout);
		this.tile_mask = 0;
	});

	WorldMap.method('Data', function (map, i, x, y)
	{
		this.type = 0;
	});

	WorldMap.method('drawTile', function (tile, data, time, context)
	{
		context.drawImage(this.image, this.image.tile_x[data.type], this.image.tile_y[data.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);

		if (data.mark != undefined)
		{
			context.globalAlpha = 0.8;
			context.fillStyle = MARKS[data.mark];
			context.fillRect(0, 0, 64, 64);
		}
	});

	WorldMap.on('update_data', function (chars, realm)
	{
		this.realm = realm;

		for (var i = 0; i < this.index.length; i++)
		{
			if (i in realm.tiles)
			{
				var data = realm.tiles[i];
				data.type = TILES[data.info.type.id];
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
	});

	WorldMap.on('focus:char', function (char)
	{
		this.char = char;
		var open = ooc.intkeys(char.route);
		var range = char.info.state[2];
		refreshArea.call(this, char);
	});

	WorldMap.on('pick_tile', function (tile, button)
	{
		if (!(tile.i in this.range))
		{
			return;
		}

		if (this.path && (this.path.tiles[this.path.tiles.length - 1] == tile.i))
		{
			this.root.default_prompt.hide();
			this.root.show(this.root.power_prompt);
			this.root.trigger('prompt:power', [this.char, this.path]);
			delete this.path;
		}
		else
		{
			var that = this;
			this.path = this.findPath(this.char.home, tile, function (data) { return (data.info ? ((data.info.id in that.char.route) ? 0 : data.info.state[2]) : null) });
			refreshArea.call(this, this.char, this.path);
		}

		return;
		var action = [char.id, tile.i, path.steps, {}];
		//this.root.trigger('prompt:power', [tile, char, info]);
		this.root.trigger('prompt:power', [tile, char, info]);
		return;

		if (tile.i in char.actions)
		{
			var action = char.actions[tile.i];
			char.info.state[5] = jup.mergePower(char.info.state[5], action[3]);
			var tileb = char.home;
			var steps = action[2];

			for (var i = 0; i < steps.length; i++)
			{
				tileb = tileb.steps[steps[i]];

				if (char.route[tileb.i] == 1)
				{
					delete char.route[tileb.i];
					char.info.state[2] += tileb.data.info.state[2];
				}
				else
				{
					char.route[tileb.i] -= 1;
				}
			}

			action = JSON.parse(prompt('Action?:', JSON.stringify(char.actions[tile.i])));
			delete char.actions[tile.i];
		}
		else
		{
			var path = this.findPath(this.focus_char.home, tile, function (data) { return (data.info ? ((data.info.id in char.route) ? 0 : data.info.state[2]) : null) });//if in char.route cost=0!!!
			var action = JSON.parse(prompt('Action?:', JSON.stringify([this.focus_char.info.id, tile.i, path.steps, {0: 1}])));
		}

		if (action)
		{
			char.actions[action[1]] = action;
			char.info.state[5] = jup.cancelPower(char.info.state[5], action[3]);
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

	WorldMap.on('add_action', function (action)
	{
		console.log(JSON.stringify(action));
		var char = this.char;
		char.actions[action[1]] = action;
		char.info.state[5] = jup.cancelPower(char.info.state[5], action[3]);
		var tile = char.home;
		var steps = action[2];

		for (var i = 0; i < steps.length; i++)
		{
			tile = tile.steps[steps[i]];

			if (char.route[tile.i] != undefined)
			{
				char.route[tile.i] += 1;
			}
			else
			{
				char.route[tile.i] = 1;
				char.info.state[2] -= tile.data.info.state[2];
			}
		}

		refreshArea.call(this, this.char);
		//this.root.trigger('refresh:stats');
		console.log('ZZZZZZZZZZZZZZZZZZZZZ');
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

	CharMenu.on('update_data', function (chars, realm)
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

	var TextBox = ooo.Text.extend(function (layout, color, font, alignment, baseline)
	{
		ooo.Text.call(this, layout, color, font, alignment, baseline);
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

	var DefaultPrompt = ooo.Scene.extend(function (map_size, layout)
	{
		ooo.Scene.call(this, layout);
		this.world_map = new WorldMap(map_size, 'steps');
		this.show(this.world_map, -1);

		this.show(new ooo.Box('#4d3932', {bottom: BORDER, top: BORDER, width: 148, right: BORDER}));
		this.char_menu = new CharMenu('chars', {bottom: BORDER+10, top: BORDER+10, width: 64, right: BORDER+10}, OUI_VERTICAL | OUI_BOTTOM);
		this.show(this.char_menu, 1);
		this.inventory = new Inventory('items', {bottom: BORDER+10, top: BORDER+10, width: 64, right: BORDER+74}, OUI_VERTICAL | OUI_BOTTOM);
		this.show(this.inventory, 1);

		//this.notemenu = new oui.Menu('steps', {width: 64, right: BORDER, top: BORDER, bottom: 128}, OUI_REVERSED | OUI_BOTTOM | OUI_VERTICAL).reset([1,1,1]);
		//this.show(this.notemenu, 1);

		//this.turnmenu = new TurnMenu({left: BORDER, right: BORDER, top: BORDER, height: 64});
		//this.show(this.turnmenu, 1);

		this.charstate = new TextBox({left: BORDER, right: BORDER, top: BORDER, height: 64}, '#fff', '12px sans-serif');
		this.show(this.charstate, 1);
	});

	var PowerMenu = oui.Menu.extend(function (asset, layout, style)
	{
		oui.Menu.call(this, asset, layout, style);
	});

	PowerMenu.method('drawButton', function (time, context, data, pick)
	{
		context.drawImage(this.image, this.image.tile_x[data], this.image.tile_y[data], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
		context.fillStyle = '#555';
		context.font = '32px sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText((data in this.parent.power) ? this.parent.power[data] : 0, 32, 32);
	});

	PowerMenu.on('pick:item', function (type)
	{
		if (type in this.parent.power)
		{
			this.parent.power[type]++;
		}
		else
		{
			this.parent.power[type] = 1;
		}

		//jup.mergePower(this.parent.char_power, this.parent.diff_power);
		this.parent.power = jup.mergePairs(this.parent.power);
		var temp_power = jup.mergePower(this.parent.pool_power, this.parent.power);
		temp_power = jup.mergePairs(temp_power);

		var event = jup.matchEvent(temp_power);
		this.parent.eventtext.string = (event ? event.title : '???') + ' (' + this.parent.time + ') ' + JSON.stringify(temp_power);
	});

	var PowerSubmit = oui.Menu.extend(function (asset, layout, style)
	{
		oui.Menu.call(this, asset, layout, style);
		this.reset([7, 0, 1]);
	});

	PowerSubmit.on('pick:item', function (data, index)
	{
		if ((index == 0) && ooc.size(this.parent.power))
		{
			var action = [this.parent.char.info.id, this.parent.tile.i, this.parent.steps, this.parent.power];
			this.parent.hide();
			this.root.show(this.root.default_prompt);
			this.root.trigger('add_action', [action]);
		}
		else if (index == 1)
		{
		}
		else
		{
			this.root.show(this.root.default_prompt);
			this.parent.hide();
		}
	});

	var PowerPrompt = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		this.show(new ooo.Box('#777'));
		this.show(new ooo.Box('#666', {bottom: BORDER, height: 276, width: 148, right: BORDER}));

		this.power_menu = new PowerMenu('powers', {bottom: BORDER+10, height: 256, width: 128, right: BORDER+10}, OUI_VERTICAL).reset([0, 2, 4, 6, 1, 3, 5, 7]);
		this.show(this.power_menu);

		this.eventinfo = new ooo.Box('#666', {left: BORDER, width: 212, height: 256, bottom: BORDER});
		this.show(this.eventinfo);

		this.eventtext = new TextBox({left: BORDER+10, width: 256, height: 246, bottom: BORDER+0}, '#000', '18px sans-serif');
		this.show(this.eventtext, 1);

		this.power_submit = new PowerSubmit('buttons', {left: BORDER+10, width: 192, height: 64, bottom: BORDER+10});
		this.show(this.power_submit, 1);
	});

	PowerPrompt.on('prompt:power', function (char, path)
	{
		var tile_i = path.tiles[path.tiles.length - 1];
		var tile = this.root.default_prompt.world_map.index[tile_i];
		var pools = tile.data.groups[4];
		var info = pools ? pools[ooc.minkey(pools)] : null;

		if (info)
		{
			var pools = info.state[2];
			this.pool_power = jup.poolPower(pools);
			this.char_power = jup.charPower(pools[char.info.id]);
			this.time = info.state[3];
		}
		else
		{
			this.pool_power = {};
			this.char_power = {};
			this.time = 0;
		}

		this.char = char;
		this.tile = tile;
		this.steps = path.steps;
		this.power = {};

		var event = jup.matchEvent(this.pool_power);
		this.eventtext.string = (event ? event.title : '???') + ' (' + this.time + ') ' + JSON.stringify(this.pool_power);
	});

	var LoginForm = oui.Form.extend(function (color, font, layout, align, baseline)
	{
		oui.Form.call(this, color, font, layout, align, baseline);
		this.show(new oui.Field('auth_token', {top: 10, left: 10, right:10, height: 30}));
		this.show(new oui.Field('auth_token', {top: 50, left: 10, right:10, height: 30}));
		this.show(new oui.Submit('login', '#a50', {top: 90, left: 10, right: 10, height: 30}));
	});

	LoginForm.bubble('form:submit', function (type, data)
	{
		this.root.auth_token = data;
		this.root.send('login', data);
		this.root.login_prompt.hide();
		this.root.show(this.root.logo_prompt);//change for load_screen
	});

	var LoginPrompt = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		this.show(new ooo.Box('#444'), -1);
		this.form = new LoginForm('#a50', '30px sans-serif', {horizontal: 50, width: 150, vertical: 50, height: 130});
		this.show(this.form);
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

		this.default_prompt = new DefaultPrompt(rules[1]);
		this.power_prompt = new PowerPrompt();
	}

	//Game
	function startGame (time)
	{
		//this.update = false;
		//this.once = true;
		this.time = time;
		this.started = true;
		this.show(this.default_prompt);
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
			if (info.type.group == 0)
			{
				route[info.id] = true;
			}
			else
			{
				for (var info_id in info.parents)
				{
					open.push(info.parents[info_id]);
				}
			}
		}
		while (info = open.pop())

		return route;
	}

	//Game
	function prepareTock (data, map)
	{
		var groups = {};
		var types = {};
		var chars = {};
		var realm = {map: map, tiles: {}};
		var parents = {};
		var children = {};

		for (var char_id in data)
		{
			var knowledge = data[char_id];
			var char = {};

			for (var info_id in knowledge)
			{
				var argv = knowledge[info_id];
				var info = {};
				info.id = parseInt(info_id);
				info.type = jup.info[argv[0]];
				//info.insight = argv[1];
				info.parents = {};
				info.children = {};

				if (argv[1])
				{
					info.state = argv[1];
				}

				if (argv[2])
				{
					//link to children
					for (var i = 0; i < argv[2].length; i++)
					{
						var child_id = argv[2][i];
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
				ooc.put(info, types, group_id, info.type.id, info_id);
				ooc.put(info, char, 'groups', group_id, info_id);
				ooc.put(info, char, 'types', group_id, info.type.id, info_id);
			}

			var home = ooc.minKeyValue(char.types[1][33]).state[0];
			char.home = this.default_prompt.world_map.index[home];
			char.info = char.groups[2][char_id];
			char.actions = {};

			var task = ooc.minKeyValue(char.types[1][23]);
			task = ooc.map(task.type.param, task.state);
			char.route = {};

			for (var i = 0; i < task.route.length; i++)
			{
				char.route[task.route[i]] = 1;
			}

			char.info.state[2] -= task.range;
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

		this.trigger('update_data', [chars, realm]);
		var char = ooc.minKeyValue(chars);
		this.trigger('focus:char', [char]);
	}

	var Game = ooo.Client.extend(function (hook, color)
	{
		ooo.Client.call(this, hook, color);
		this.players = {};
		this.started = false;
		this.logo_prompt = new ooo.Box('#222');
		//get time for min logo show
		this.login_prompt = new LoginPrompt();
		this.show(this.logo_prompt);
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
			this.logo_prompt.hide();
			this.show(this.login_prompt);
		}
	});

	Game.on('socket:close', function (code)
	{
		console.log('CLOSED %s', code);
	});

	Game.on('message:deny', function ()
	{
		this.login_prompt.form.reset();
		this.show(this.login_prompt);
	});

	Game.on('message:grant', function (games)
	{
		this.login_prompt.hide();
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
		this.login_prompt.hide();
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
		//delete localStorage['auth_token'];
		var hook = document.getElementById('hook');
		var jupiter = new Game(hook, '#444');
		jupiter.load('steps', 'assets/steps.png', 64, 64);
		jupiter.load('chars', 'assets/chars.png', 64, 64);
		jupiter.load('items', 'assets/items.png', 64, 64);
		jupiter.load('path', 'assets/path.png', 64, 64);
		jupiter.load('options', 'assets/options.png', 64, 64);
		jupiter.load('buttons', 'assets/buttons.png', 64, 64);
		jupiter.load('powers', 'assets/powers.png', 64, 64);
		jupiter.open(HOST);
	});
})();
