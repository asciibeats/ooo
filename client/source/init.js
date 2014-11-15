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
var POW2 = [1, 2, 4, 8];
var ITEMTILES = [0, 3, 5, 4, 3, 2, 1, 3, 0, 3, 9, 10, 11];
var CHARTILES = [0, 3, 5, 4, 3, 2, 1, 3, 0, 0, 9, 10, 11];

var GROUPS = [];
GROUPS[0] = 'Terrain';
GROUPS[1] = 'Characters';
GROUPS[2] = 'Items';
GROUPS[3] = 'Attributes';

var ITEMS = [];
ITEMS[0] = {title: 'World', group: 0, obscurity: 0, visibility: 0};
ITEMS[1] = {title: 'Grass', group: 0, obscurity: 1, visibility: 0};
ITEMS[2] = {title: 'Forest', group: 0, obscurity: 3, visibility: 0};
ITEMS[3] = {title: 'Campfire', group: 0, obscurity: 1, visibility: 1};
ITEMS[4] = {title: 'Fishmonster', group: 1, obscurity: 2, visibility: 1};
ITEMS[5] = {title: 'Basket', group: 2, obscurity: 3, visibility: 1};
ITEMS[6] = {title: 'Apple', group: 2, obscurity: 1, visibility: 1};
ITEMS[7] = {title: 'Tree', group: 2, obscurity: 9, visibility: 0};
ITEMS[8] = {title: 'Ring', group: 2, obscurity: 9, visibility: 1};
ITEMS[9] = {title: 'Hero', group: 1, obscurity: 5, visibility: 1};

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
		this.show(new oui.Field('auth', {'top': 10, 'left': 10, 'right':10, 'height': 30}));
		this.show(new oui.Field('auth', {'top': 50, 'left': 10, 'right':10, 'height': 30}));
		this.show(new oui.Submit('login', '#a50', {'top': 90, 'left': 10, 'right':10, 'height': 30}));
	});

	Login.bubble('form:submit', function (type, data)
	{
		this.root.auth = data;
		this.root.send('login', data);
	});

	var Game = ooo.Class.extend(function (rules, names)
	{
		this.rules = rules;
		this.time = 0;
		this.players = {};

		for (var i = 0; i < names.length; i++)
		{
			this.players[names[i]] = true;
		}
	});

	Game.method('join', function (name)
	{
		this.players[name] = true;
	});

	Game.method('leave', function (name)
	{
		delete this.players[name];
	});

	Game.method('start', function (time)
	{
		this.time = time;
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

	/*function get_hash (array)
	{
		var hash = {};

		for (var i = 0; i < array.length; i++)
		{
			hash[array[i]] = true;
		}

		return hash;
	}

	function add_event (events, parent, time, id, type)
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

	var CharStack = oui.SingleMenu.clone(64, 64, 'items', {left: 84, right: 10, top: 10, bottom: 10});

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
		this.menu.pool = new ItemPool();
		this.show(this.menu.pool);
		this.menu.stack = new CharStack();
		this.show(this.menu.stack);
	});

	Land.method('reset', function (id, time)
	{
		this.menu.pool.reset(this.data.info.by_root[id][2][time]);
		this.menu.stack.reset(this.data.info.by_root[id][1][time]);
	});

	var World = oui.TileMap.extend(function (size, data)
	{
		oui.TileMap.call(this, size, 64, 64, 'steps');
		this.data = data;
		this.reset();
	});

	World.method('Data', function (map, i, x, y)
	{
		this.type = 0;
	});

	World.method('drawTile', function (tile, time, context)
	{
		if (this.focus_id != null)
		{
			if (tile.data.type == 0)
			{
				context.drawImage(this.image, this.coords[tile.data.type][0], this.coords[tile.data.type][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
			}
			else if (tile.i in this.data.info.by_char[this.focus_id][0])
			{
				context.drawImage(this.image, this.coords[tile.data.type][0], this.coords[tile.data.type][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
			}
			else
			{
				context.drawImage(this.image, this.coords[1][0], this.coords[1][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
			}
		}
		else
		{
			context.drawImage(this.image, this.coords[tile.data.type][0], this.coords[tile.data.type][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
		}

		var other = this.marks.steps.other[tile.i];
		var owner = this.marks.steps.owner[tile.i];
		var focus = this.marks.steps.focus[tile.i];

		if (other != undefined)
		{
			context.drawImage(this.root.images['path'], this.coords[other][0], this.coords[other][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
		}

		if (owner != undefined)
		{
			context.drawImage(this.root.images['path'], this.coords[owner][0], this.coords[owner][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
		}

		if (focus != undefined)
		{
			context.drawImage(this.root.images['path'], this.coords[focus][0], this.coords[focus][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
		}

		/*if (this.landmark == tile.i)
		{
			context.fillStyle = '#fff';
			context.fillRect(10, 10, 44, 44);
		}*/
	});

	function rootsof (info)
	{
		var roots = [];

		if (ooo.size(info.parents))
		{
			for (var id in info.parents)
			{
				roots = roots.concat(rootsof(info.parents[id]));
			}
		}
		else
		{
			roots.push(info);
		}

		return roots;
	}

	//World
	function mark_path (marks, id, shift)
	{
		for (var i in this.steps[id])
		{
			var tile = this.steps[id][i];

			if (marks[i] == undefined)
			{
				marks[i] = shift;
			}

			for (var j = 0; j < tile.steps.length; j++)
			{
				var next = tile.steps[j];

				if (next.i in this.steps[id])
				{
					marks[i] |= POW2[j];
				}
			}
		}
	}

	//World
	function mark_paths ()
	{
		var focus = {};
		var owner = {};
		var other = {};

		for (var id in this.steps)
		{
			if (this.focus_id && (this.focus_id == id))
			{
				mark_path.call(this, focus, id, 0);
			}
			else if (id in this.data.chars)
			{
				mark_path.call(this, owner, id, 16);
			}
			else
			{
				mark_path.call(this, other, id, 32);
			}
		}

		this.marks.steps = {focus: focus, owner: owner, other: other};
	}

	World.method('reset', function (focus_id)
	{
		this.focus_id = focus_id;
		this.steps = {};
		this.marks = {};

		//build terrain/map
		for (var i = 0; i < this.index.length; i++)
		{
			var tile = this.index[i];
			var info = this.data.info.by_id[0][i];

			if (info)
			{
				tile.data.type = ITEMTILES[info.type];
				tile.data.info = info;
				var chars = this.data.info.by_root[i][1];

				for (var id in chars)
				{
					ooo.add(tile, this.steps, id, i);
				}
			}
			else
			{
				tile.data.type = 0;
			}
		}

		mark_paths.call(this);
	});

	//World
	function overview (tile)
	{
		console.log('### OVERVIEW ###');
		var by_root = this.data.info.by_root[tile.i];

		for (var group in by_root)
		{
			console.log(GROUPS[group]);

			for (var id in by_root[group])
			{
				var info = by_root[group][id];
				console.log('(%d) %s', id, ITEMS[info.type].title);
			}
		}
	}

	//event grundrauschen? damit man nicht genau wissen kann ob ein event von einem mitspieler getriggert wurde
	///oder reicht es wenn mehrere mitspieler dabei sind und man sich etwas geschickt anstellen muss?
	////event beispiel: du siehst eine attraktive frau und bist abgelenkt. -x insight for next y steps

	//take chars of the board when you want but cooldown or spawncost?????
	//mark the changes!!!! diffs between times
	World.on('pick:tile', function (tile, button)
	{
		//overview.call(this, tile);
		//MARK TILE!!!!
		//this.root.scenes.main.world.reset(option.id);
		this.root.scenes.main.chars.picked = {};
		this.reset();
		this.root.scenes.side.showTileInfo(tile);
	});

	World.on('input:press', function (time, char, key, shift)
	{
		if (char == 'n')
		{
			this.mode = 'newchar';
			console.log('NEWCHAR MODE!!!');
		}
		else if (char == 'i')
		{
			this.mode = 'overview';
			console.log('OVERVIEW MODE!!!');
		}
		else if (char == 'd')
		{
			this.mode = 'delete';
			console.log('DELETE MODE!!!');
		}
		else if (this.steps && key)
		{
			if (key == 13)
			{
				var chars = JSON.parse(prompt('Char?:', JSON.stringify([['tilla', [5, 8, 2], [9, [[6, []]]], this.home, this.steps]])));
				this.root.send('tick', [chars]);
			}
		}
	});

	//Overwatch (XCOM) like mechanic (trigger autoresponse)
	//Competitive/Tournament/Ladder mode (max 45min games) (1v1;2v2 etc symmetric maps)

	var CharMenu = oui.Menu.extend(function (data)
	{
		oui.Menu.call(this, 64, 64, 'chars', {left: 10, right: 10, top: 84, bottom: 10}, true, OUI_BOTTOM | OUI_REVERSED | OUI_VERTICAL);
		this.data = data;
		this.reset();
	});

	CharMenu.method('drawButton', function (time, context, option, picked)
	{
		if (picked)
		{
			context.fillStyle = '#f00';
			context.fillRect(0, 0, this.button_w, this.button_h);
		}
		else
		{
			//var type = CHARTILES[info.type];
			var type = 0;
			context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
		}
	});

	CharMenu.method('reset', function ()
	{
		this.options = [];
		this.picked = {};

		for (var id in this.data.chars)
		{
			var info = this.data.info.by_id[1][id];
			this.options.push(info);
		}

		return this;
	});

	CharMenu.on('menu:pick', function (option, i)
	{
		this.picked = {};
		this.picked[i] = true;
		this.root.scenes.main.world.reset(option.id);
		this.root.scenes.side.showCharInfo(option);
	});

	var MainScene = ooo.Scene.extend(function (game, data)
	{
		ooo.Scene.call(this, {left: 0, right: 276, top: 0, bottom: 0});
		this.world = new World(game.rules[1], data);
		this.notes = new oui.Menu(64, 64, 'steps', {left: 10, right: 10, top: 10, height: 64}, false, OUI_REVERSED).reset([1,1,1]);
		this.chars = new CharMenu(data);
		this.show(this.world);
		this.show(this.notes, 1);
		this.show(this.chars, 1);
	});

	var ItemPool = oui.Menu.extend(function (data)
	{
		oui.Menu.call(this, 64, 64, 'items', {left: 10, right: 10, top: 10, bottom: 74}, true, OUI_BOTTOM | OUI_REVERSED);
		this.data = data;
		this.reset();
	});

	ItemPool.method('drawButton', function (time, context, option, picked)
	{
		if (picked)
		{
			context.fillStyle = '#f00';
			context.fillRect(0, 0, this.button_w, this.button_h);
		}
		else
		{
			var type = ITEMTILES[option];
			context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
		}
	});

	ItemPool.method('reset', function ()
	{
		this.options = [];
		this.picked = {};

		for (var type in this.data.info.by_type[2])
		{
			this.options.push(parseInt(type));
		}

		return this;
	});

	ItemPool.on('menu:pick', function (option, i)
	{
		console.log('ITEM_TYPE', option);
	});

	var Overview = ooo.Scene.extend(function (game, data)
	{
		ooo.Scene.call(this);
		this.items = new ItemPool(data);
		this.options = new oui.Menu(64, 64, 'steps', {left: 10, right: 10, height: 64, bottom: 10}, false, OUI_BOTTOM).reset([0,2,1,2]);
		this.show(new ooo.Box('#c02515'));
		this.show(this.items, 1);
		this.show(this.options, 1);
	});

	var Stuff = oui.Menu.extend(function (data)
	{
		oui.Menu.call(this, 64, 64, 'items', {left: 10, right: 10, top: 10, bottom: 74}, true, OUI_BOTTOM | OUI_REVERSED);
		this.data = data;
		//this.reset();
	});

	Stuff.method('drawButton', function (time, context, option, picked)
	{
		if (picked)
		{
			context.fillStyle = '#f00';
			context.fillRect(0, 0, this.button_w, this.button_h);
		}
		else
		{
			var type = ITEMTILES[option.type];
			context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
		}
	});

	Stuff.method('reset', function (tile)
	{
		this.options = [];
		this.picked = {};

		for (var id in this.data.info.by_root[tile.i][2])
		{
			var info = this.data.info.by_root[tile.i][2][id];
			this.options.push(info);
		}

		return this;
	});

	Stuff.on('menu:pick', function (option, i)
	{
		console.log('ITEM_ID', option.id);
	});

	var TileOptions = oui.Menu.extend(function ()
	{
		oui.Menu.call(this, 64, 64, 'steps', {left: 10, right: 10, height: 64, bottom: 10}, false, OUI_BOTTOM);
		this.reset([1,0,2,1]);
	});

	TileOptions.on('menu:pick', function (option, i)
	{
		//this.root.scenes.main.chars.picked = {};
		this.root.scenes.main.world.reset();
		this.root.scenes.side.showOverview();
	});

	var TileInfo = ooo.Scene.extend(function (data)
	{
		ooo.Scene.call(this);
		this.stuff = new Stuff(data);
		this.options = new TileOptions();
		this.show(new ooo.Box('#792e8c'));
		this.show(this.stuff, 1);
		this.show(this.options, 1);
	});

	var Inventory = oui.Menu.extend(function (data)
	{
		oui.Menu.call(this, 64, 64, 'items', {left: 10, right: 10, top: 10, bottom: 74}, true, OUI_BOTTOM | OUI_REVERSED);
		this.data = data;
		//this.reset();
	});

	Inventory.method('drawButton', function (time, context, option, picked)
	{
		if (picked)
		{
			context.fillStyle = '#f00';
			context.fillRect(0, 0, this.button_w, this.button_h);
		}
		else
		{
			var type = ITEMTILES[option.type];
			context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
		}
	});

	Inventory.method('reset', function (char_info)
	{
		this.options = [];
		this.picked = {};

		for (var id in this.data.info.by_char[char_info.id][2])
		{
			var info = this.data.info.by_char[char_info.id][2][id];
			this.options.push(info);
		}

		return this;
	});

	Inventory.on('menu:pick', function (option, i)
	{
		console.log('ITEM_ID', option.id);
	});

	var CharOptions = oui.Menu.extend(function ()
	{
		oui.Menu.call(this, 64, 64, 'steps', {left: 10, right: 10, height: 64, bottom: 10}, false, OUI_BOTTOM);
		this.reset([0,2,1,2]);
	});

	CharOptions.on('menu:pick', function (option, i)
	{
		this.root.scenes.main.chars.picked = {};
		this.root.scenes.main.world.reset();
		this.root.scenes.side.showOverview();
	});

	var CharInfo = ooo.Scene.extend(function (data)
	{
		ooo.Scene.call(this);
		this.inventory = new Inventory(data);
		this.options = new CharOptions();
		this.show(new ooo.Box('#2e588c'));
		this.show(this.inventory, 1);
		this.show(this.options, 1);
	});

	var SideScene = ooo.Scene.extend(function (game, data)
	{
		ooo.Scene.call(this, {width: 276, right: 0, top: 0, bottom: 0});
		this.scenes = {};
		this.scenes.overview = new Overview(game, data);
		this.scenes.tileinfo = new TileInfo(data);
		this.scenes.charinfo = new CharInfo(data);
		this.upfront = this.scenes.overview;
		this.show(this.upfront);
	});

	SideScene.method('showTileInfo', function (tile)
	{
		console.log('showTileInfo', tile.i);
		this.upfront.hide();
		this.upfront = this.scenes.tileinfo;
		this.upfront.stuff.reset(tile);
		this.show(this.upfront);
	});

	SideScene.method('showCharInfo', function (info)
	{
		console.log('showCharInfo', info.id);
		this.upfront.hide();
		this.upfront = this.scenes.charinfo;
		this.upfront.inventory.reset(info);
		this.show(this.upfront);
	});

	SideScene.method('showOverview', function ()
	{
		this.upfront.hide();
		this.upfront = this.scenes.overview;
		this.show(this.upfront);
	});

	var Client = ooo.Client.extend(function (url, hook, assets, color)
	{
		ooo.Client.call(this, url, hook, assets, color);
		//this.update = false;
		//this.once = true;
		this.forms = {};
		this.forms.login = new Login('#5a0', '30px sans-serif', {'width': 200, 'height': 130}).center(100, 65).rotate(-10);
		this.show(new ooo.Box('#a0a'));
	});

	Client.on('socket:open', function ()
	{
		var auth = ooo.getLocal('auth');

		if (auth)
		{
			this.auth = auth;
			this.send('login', auth);
		}
		else
		{
			this.show(this.forms.login);
		}
	});

	Client.on('socket:close', function (code)
	{
		console.log('CLOSED %s', code);
	});

	Client.on('message:deny', function ()
	{
		this.forms.login.reset();
		this.show(this.forms.login);
	});

	Client.on('message:grant', function (games)
	{
		this.forms.login.hide();
		ooo.setLocal('auth', this.auth);

		if (ooo.size(games) > 0)
		{
			var id = parseInt(prompt('choose from: ' + JSON.stringify(games), '0'));
			var rules = games[id][0];
			var names = games[id][1];
			names.push(this.auth[0]);
			this.game = new Game(rules, names);
			this.send('join', [id]);
		}
		else
		{
			var rules = JSON.parse(prompt('type rules:', '[1,32]'));
			var names = [this.auth[0]];
			this.game = new Game(rules, names);
			this.send('host', [rules]);
		}
	});

	Client.on('message:join', function (name)
	{
		console.log('JOIN %s', name);
		this.game.join(name);
	});

	Client.on('message:leave', function (name)
	{
		console.log('LEAVE %s', name);
		this.game.leave(name);

		if (this.timeout)
		{
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	});

	//Client
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

	Client.on('message:ready', function (delay)
	{
		console.log('READY %d', delay);
		count_down.call(this, delay);
	});

	function convert_history (history)
	{
		var by_id = {};
		var by_type = {};
		var by_char = {};
		var by_root = {};

		//build base info tree
		var has_parents = {};
		var has_children = {};

		for (var char in history)
		{
			for (var id in history[char])
			{
				var argv = history[char][id];
				var info = {};
				info.id = parseInt(id);
				info.type = argv[0];
				info.insight = argv[1];
				//info.data = ['hallo'];//zb text auf blatt papier
				info.parents = {};
				info.children = {};

				var group = ITEMS[info.type].group;
				ooo.add(info, by_id, group, id);
				ooo.add(info, by_type, group, info.type, id);
				ooo.add(info, by_char, char, group, id);

				//link to children
				for (var j = 0; j < argv[2].length; j++)
				{
					var cid = argv[2][j];
					var child = has_children[cid];

					if (child)
					{
						info.children[cid] = child;
						child.parents[id] = info;
					}
					else
					{
						ooo.add(info, has_parents, cid, id);
					}
				}

				//link to parents
				if (id in has_parents)
				{
					for (var asdf in has_parents[id])
					{
						var parent = has_parents[id][asdf];
						parent.children[id] = info;
						info.parents[asdf] = parent;
					}
				}
				else
				{
					has_children[id] = info;
				}
			}
		}

		for (var group in by_id)
		{
			for (var id in by_id[group])
			{
				var info = by_id[group][id];
				var roots = rootsof(info);

				for (var i = 0; i < roots.length; i++)
				{
					ooo.add(info, by_root, roots[i].id, group, id);
				}
			}
		}

		return {by_id: by_id, by_type: by_type, by_char: by_char, by_root: by_root};
	}

	//vision entfernen!!! pathfinding nur mit costs!!! low energy char hat kleineres areal!!!!

	//Client
	function start_game (time, history, chars)
	{
		this.game.start(time);

		this.data = {};
		this.data.info = convert_history(history);
		this.data.chars = chars;

		this.scenes = {};
		this.scenes.main = new MainScene(this.game, this.data);
		this.scenes.side = new SideScene(this.game, this.data);

		this.show(this.scenes.main);
		this.show(this.scenes.side);
	}

	Client.on('message:start', function (time, history, chars)
	{
		//this.root.update = false;
		//this.root.once = true;
		console.log('START', arguments);
		start_game.call(this, time, history, chars);
		console.log('MAKE A MOVE');
	});

	Client.on('message:continue', function (rules, names, time, history, chars, waiting)
	{
		console.log('CONTINUE', arguments);
		this.forms.login.hide();
		ooo.setLocal('auth', this.auth);

		this.game = new Game(rules, names);
		start_game.call(this, time, history, chars);

		if (waiting)
		{
			console.log('MAKE A MOVE');
		}
	});

	Client.on('message:away', function (name)
	{
		console.log('AWAY %s', name);
	});

	Client.on('message:back', function (name)
	{
		console.log('BACK %s', name);
	});

	Client.on('message:tock', function (info, chars)
	{
		console.log('TOCK', arguments);
		this.game.time++;
		this.world.reset(info, chars);
	});

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var assets = {};
		assets['steps'] = 'assets/steps.png';
		assets['chars'] = 'assets/chars.png';
		assets['items'] = 'assets/items.png';
		assets['path'] = 'assets/path.png';
		assets['options'] = 'assets/options.png';
		var jupiter = new Client('http://10.0.0.19:11133', hook, assets, '#444');
	});
})();
