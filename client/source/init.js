'use strict';
//fabricate claims!!!
//history group->type!->id->time
//andere realms anerkennen!!!!
//chars "follow" other chars
////these leading chars pose laws
////laws are enforced only by ingame power projection (no game mechanic prevents anything)
//x char slots
//if char is put in prison or something the slot is blocked
//number of followers determine your level

////dreams depend on items&skills&node wichtig ist daß man wissen kann was kommen wird
//erst alle looks dann anderes? usw?
//home.items.chest.push();
//traum deuten/trigger one time events
//CHOOSE ABORT CONDITION FOR EVERY CHAR!? or x health or sth
//WORLDSIZE: sqrt(playernum) * size
var STATNAMES = ['insight', 'stamina', 'vision'];
var POW2 = [1, 2, 4, 8];
var ITEMTILES = [0, 3, 5, 4, 3, 2, 1, 3, 0, 3, 9, 10, 11];
var CHARTILES = [0, 3, 5, 4, 3, 2, 1, 3, 0, 0, 9, 10, 11];
var SPAWNSLOTS = [0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var MOVE = 'MAKE A MOVE';
var WAIT = 'WAIT FOR OTHER PLAYERS';

var GROUPS = [];
GROUPS[0] = 'Terrain';
GROUPS[1] = 'Spawns';
GROUPS[2] = 'Characters';
GROUPS[3] = 'Items';
GROUPS[4] = 'Events';

var ITEMS = [];
ITEMS[0] = {title: 'World', group: 0, obscurity: 0, visibility: 0};
ITEMS[1] = {title: 'Grass', group: 0, obscurity: 1, visibility: 0};
ITEMS[2] = {title: 'Forest', group: 0, obscurity: 3, visibility: 0};
ITEMS[3] = {title: 'Campfire', group: 0, obscurity: 1, visibility: 1};
ITEMS[4] = {title: 'Fishmonster', group: 2, obscurity: 2, visibility: 1};
ITEMS[5] = {title: 'Basket', group: 3, obscurity: 3, visibility: 1};
ITEMS[6] = {title: 'Apple', group: 3, obscurity: 1, visibility: 1};
ITEMS[7] = {title: 'Tree', group: 3, obscurity: 9, visibility: 0};
ITEMS[8] = {title: 'Ring', group: 3, obscurity: 9, visibility: 1};
ITEMS[9] = {title: 'Hero', group: 2, obscurity: 5, visibility: 1};
ITEMS[10] = {title: 'Spawn', group: 1, obscurity: 1, visibility: 1};
ITEMS[11] = {title: 'Build', group: 4, obscurity: 1, visibility: 1};

//second hand information (maps,rumors,traded info,etc) is drawn in map colors
/*ITEMS[10] = {title: 'MapGrass', obscurity: 9, visibility: 0};
ITEMS[11] = {title: 'MapForest', obscurity: 9, visibility: 1};
ITEMS[12] = {title: 'MapCampfire', obscurity: 4, visibility: 1};*/

//at the beginning choose x cards to get initial resources/items nstuff

//spawn shadow at some time/tile on a way
//char hat max energy & regen; if you use more than regen a day you loose the diff from your energy
//if you use less you fill up until max energy
//routine-meter: wiederholung eines jobs erhöht level (0 bis max routine; pro wiederholung +1)
//arbeitskraft in 1er schritten verteilen können: haus dauert 18 char baut über drei tage mit je 6ticks a x energy (oder 1 tag mit 7 chars mit je 2ticks a x energy und einem mit 4 etc)
//spawn needs 1 food
//wenn char schläft belegt er einen platz in home
//häuser immer separat von anderen gebäuden!
//kann man ja daneben bauen
//not moving (waiting) costs 1 energy

(function ()
{
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

	/*var Site = ooo.Stage.extend(function ()
	{
		ooo.Stage.call(this);
		this.update = false;
	});

	Site.on('show', function (root, parent)
	{
		this.once = true;
	});

	Site.on('resize', function (width, height)
	{
		ooo.Stage.
		this.once = true;
	});

	Site.on('draw', function (time, context)
	{
		if (this.update || this.once)
		{
			context = this.context;
			context.fillStyle = '#0f0';
			//context.fillRect(0, 0, this.width, this.height);
			context.fillRect(0, 0, 100, 100);
			console.log('UPDATE');

			//draw background
			this.once = false;
			return [time, this.context];
		}
		else
		{
			return false;
		}
	});*/

	/*function add_event (events, parent, time, id, type)
	{
		if (!events[parent])
		{
			events[parent] = {};
		}

		if (!events[parent][time])
		{
			events[parent][time] = {};
		}

		events[parent][time][id] = type;
	}*/

	/*var CharStack = oui.SingleMenu.clone(64, 64, 'items', {left: 84, right: 10, top: 10, bottom: 10});

	CharStack.method('reset', function (chars)
	{
		delete this.picked;
		this.options = [];

		for (var id in chars)
		{
			this.options.push(chars[id]);
		}

		return this;
	});

	CharStack.method('drawButton', function (time, context, data, picked)
	{
		if (true || picked)
		{
			context.fillStyle = '#fff';
			context.fillRect(0, 0, this.button_w, this.button_h);
		}
		else
		{
			
			//var type = ITEMTILES2[data.type];
			//context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
		}
	});

	CharStack.on('draw', function (time, context)
	{
		if (this.reversed)
		{
			if (this.vertical)
			{
				context.translate(0, this.height - this.button_h);
			}
			else
			{
				context.translate(this.width - this.button_w, 0);
			}
		}

		for (var i = 0; i < this.options.length; i++)
		{
			this.drawButton(time, context, this.options[i], this.picked == i);
			context.translate(this.offset_x, this.offset_y);
		}
	});

	var Land = ooo.Scene.extend(function (info)
	{
		ooo.Scene.call(this);
		this.data = {};
		this.data.info = info;
		this.menu = {};
		this.menu.pool = new ItemTypes();
		this.show(this.menu.pool);
		this.menu.stack = new CharStack();
		this.show(this.menu.stack);
	});

	Land.method('reset', function (id, time)
	{
		this.menu.pool.reset(this.data.info.by_tile[id][2][time]);
		this.menu.stack.reset(this.data.info.by_tile[id][1][time]);
	});*/

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
				tile.data.type = ITEMTILES[info.type];
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
		var path = this.findPath(this.focus_home, tile, function (data) { return ((data.type == 1) ? 1 : 3); });
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
		oui.Menu.call(this, 'chars', {left: 138, right: 0, top: 0, bottom: 0});
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
				var argv = history[char_id][1][info_id];
				var info = {};
				info.id = parseInt(info_id);
				info.type = argv[0];
				info.insight = argv[1];
				info.parents = {};
				info.children = {};

				if (argv[2])
				{
					info.argv = argv[2];
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

				var group_id = ITEMS[info.type].group;
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

	//Game
	/*function process_chars (chars)
	{
		var data = {};

		for (var id in chars)
		{
			var argv = chars[id];
			var char = {};
			char.id = parseInt(id);
			char.argv = argv;
			//char.home = argv[0];
			//char.slot = argv[1];
			char.name = argv[0];
			char.stats = ooo.map(STATNAMES, argv[1]);
			char.path = argv[2];
			char.info = this.data.info.by_id[2][id];
			char.groups = this.data.info.by_char[id];
			data[id] = char;
		}

		//data.focus.tile = data.info.by_tile[0];
		//data.focus.char = data.chars(ooo.minkey(data.chars));
		return data;
	}*/

	Game.on('message:continue', function (rules, names, time, info, move)
	{
		console.log('CONTINUE', arguments);
		this.forms.login.hide();
		ooo.setLocal('auth_token', this.auth_token);

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
