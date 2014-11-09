'use strict';

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
var ITEMTILES = [0, 3, 5, 4, 3, 3, 3, 3, 9, 3, 9, 10, 11];
var ITEMTILES2 = [0, 3, 5, 4, 3, 2, 1, 3, 0, 3, 9, 10, 11];
var CHARTILES = [0, 3, 5, 4, 3, 2, 1, 3, 0, 0, 9, 10, 11];

var GROUPS = [];
GROUPS[0] = 'Terrain';
GROUPS[1] = 'Characters';
GROUPS[2] = 'Items';

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

	/*/World
	function mark_tile (tile, direction)
	{
		if (this.marks[tile.i] != undefined)
		{
			this.marks[tile.i] |= direction;
		}
		else
		{
			this.marks[tile.i] = direction;
		}
	}

	//World
	function mark_path (char, id)
	{
		var tile = this.index[char[4]];
		mark_tile.call(this, tile, 16);

		for (var i = 0; i < char[5].length; i++)
		{
			var direction = char[5][i][1];

			if (direction != undefined)
			{
				var bit = POW2[direction];
				mark_tile.call(this, tile, bit);
				tile = tile.steps[direction];
				var bit = POW2[(direction + 2) % 4];
				mark_tile.call(this, tile, bit);
				//mark_tile.call(this, tile, (bit << 2));
			}
		}
	}*/

	var ItemPool = oui.SingleMenu.clone(64, 64, 'items', {left: 10, width: 64, top: 10, bottom: 10}, true);

	ItemPool.on('select', function (option, i)
	{
		console.log('ItemMenu', option, i);
	});

	ItemPool.method('reset', function (items)
	{
		delete this.picked;
		this.options = [];

		for (var id in items)
		{
			this.options.push(items[id]);
		}

		return this;
	});

	ItemPool.method('drawButton', function (time, context, data, picked)
	{
		if (false && picked)
		{
			context.fillStyle = '#f00';
			context.fillRect(0, 0, this.button_w, this.button_h);
		}
		else
		{
			var type = ITEMTILES2[data.type];
			context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
		}
	});

	ItemPool.on('draw', function (time, context)
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

	var World = oui.TileMap.extend(function (size, info, chars, tile_w, tile_h, type, layout)
	{
		oui.TileMap.call(this, size, tile_w, tile_h, type, layout);
		this.chars = {};
		this.reset(info, chars);
	});

	World.method('Data', function (map, i, x, y)
	{
		this.type = 0;
	});

	World.method('drawTile', function (tile, time, context)
	{
		context.drawImage(this.image, this.coords[tile.data.type][0], this.coords[tile.data.type][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
		var mark = this.marks[tile.i];

		if (mark != undefined)
		{
			context.drawImage(this.root.images['path'], this.coords[mark][0], this.coords[mark][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
		}

		if (this.landmark == tile.i)
		{
			context.fillStyle = '#fff';
			context.fillRect(10, 10, 44, 44);
		}
	});

	function rootof (info)
	{
		while (info.parent)
		{
			info = info.parent;
		}

		return info;
	}

	World.method('reset', function (history, chars)
	{
		this.landmark = 132;//focus on leader
		this.marks = {};
		this.picks = [];
		this.info = {};
		this.list = {};
		this.menu = {};
		this.mode = 'overview';

		var times = ooo.intkeys(history);
		times = times.sort(function (a, b) { return (a > b) });

		//build base info tree
		for (var i = 0; i < times.length; i++)
		{
			var time = times[i];
			var parents = {};
			var children = {};
			this.info[time] = {};

			for (var id in history[time])
			{
				var info = {};
				info.id = id;
				info.type = history[time][id][0];
				info.insight = history[time][id][1];
				//info.data = ['hallo'];//zb text auf blatt papier
				info.children = {};
				this.info[time][id] = info;
				ooo.add(this.list, info, ITEMS[info.type].group, id, time);
				ooo.add(this.menu, info, ITEMS[info.type].group, info.type, id, time);
				var childr = history[time][id][2];

				for (var j = 0; j < childr.length; j++)
				{
					var cid = childr[j];
					var child = children[cid];

					if (child)
					{
						info.children[cid] = child;
						child.parent = info;
					}
					else
					{
						parents[cid] = info;
					}
				}

				var parent = parents[id];

				if (parent)
				{
					parent.children[id] = info;
					info.parent = parent;
				}
				else
				{
					children[id] = info;
				}
			}
		}

		//build terrain/map
		for (var i = 0; i < this.index.length; i++)
		{
			var tile = this.index[i];
			var terrain = this.list[0];

			if (terrain[i])
			{
				var last = Math.max.apply(null, ooo.intkeys(terrain[i]));
				var info = terrain[i][last];
				tile.data.type = ITEMTILES[info.type];
				tile.data.info = info;
				tile.data.list = {};
			}
			else
			{
				tile.data.type = 0;
			}
		}

		//build tile lists and mark hero paths
		for (var group in this.list)
		{
			for (var id in this.list[group])
			{
				var steps = {};

				//use times array for ordered iteration!!!!
				for (var time in this.list[group][id])
				{
					var info = this.list[group][id][time];
					var root = rootof(info);
					var tile = this.index[root.id];
					ooo.add(tile.data.list, info, group, id, time);

					//ITEMS array bei info init verlinken???
					if (ITEMS[info.type].group == 1)
					{
						ooo.add(steps, tile, id, time);
						var origin = steps[id][time - 1];

						if (origin)
						{
							if (tile != origin)
							{
								for (var direction in origin.steps)
								{
									if (origin.steps[direction] == tile)
									{
										break;
									}
								}

								direction = parseInt(direction);
								this.marks[origin.i] |= POW2[direction];
								direction = (direction + 2) % 4;//only for squares!!! portals break here!!!!!!!!??????

								if (this.marks[tile.i] != undefined)
								{
									this.marks[tile.i] |= POW2[direction];
								}
								else
								{
									this.marks[tile.i] = POW2[direction];
								}
							}
						}
						else
						{
							if (this.marks[tile.i] != undefined)
							{
								this.marks[tile.i] |= 16;
							}
							else
							{
								this.marks[tile.i] = 16;
							}
						}
					}
				}
			}
		}

		//update chars
		for (var id in chars)
		{
			if (chars[id])
			{
				this.chars[id] = chars[id];
			}
			else
			{
				delete this.chars[id];
			}
		}

		console.log('CHARS %s', JSON.stringify(ooo.intkeys(this.list[1])));
		console.log('ITEMS %s', JSON.stringify(ooo.intkeys(this.list[2])));
	});

	//var EVENTS = ['discover', 'transform', 'appear', 'vanish'];

	//World
	function overview (tile)
	{
		console.log('### OVERVIEW ###');

		for (var group in tile.data.list)
		{
			console.log(GROUPS[group]);

			for (var id in tile.data.list[group])
			{
				for (var time in tile.data.list[group][id])
				{
					var info = tile.data.list[group][id][time];
					console.log('(%d@%d) %s', id, time, ITEMS[info.type].title);
				}
			}
		}
	}

	function inventory (chars)
	{
		console.log('INVENTORY');

		for (var id in chars)
		{
			var char = chars[id];
			console.log('(%d) %s', id, char[0]);

			for (var j = 0; j < char[2][1].length; j++)
			{
				console.log(ITEMS[char[2][1][j][0]].title);
			}
		}
	}

	//take chars of the board when you want but cooldown or spawncost
	//mark the changes!!!! diffs between times
	World.on('input:pick', function (tile, button)
	{
		if (this.landmark == tile.i)
		{
			//switch to frontal view
			console.log('frontal');
			this.root.show(this.root.land);
			this.hide();
		}
		else
		{
			this.landmark = tile.i;
		}
		return;
		if (this.mode == 'delete')
		{
			if (this.marks[tile.i])
			{
				var id = parseInt(prompt(JSON.stringify(this.marks[tile.i])));
				var chars = {};
				chars[id] = null;
				delete this.chars[id];
				this.root.send('tick', [chars]);
			}
		}
		else if (this.mode == 'newchar')
		{
			if ((button != 2) && this.marks[tile.i])
			{
				var when = parseInt(prompt('WHEN??:'));
				var action = JSON.parse(prompt('ACTION??:'));
				this.steps[when][0].push(action);
			}
			else
			{
				if (button == 2)
				{
					this.picks.pop();
				}
				else
				{
					this.picks.push(tile);
				}

				if (this.picks.length == 1)
				{
					this.wake = 7;
					this.home = this.picks[0].i;
					this.actions = {};
					this.steps = [[[]]];
					this.marks = {};
					this.marks[this.home] = 0;
				}
				else if (this.picks.length > 1)
				{
					this.steps = [[[]]];
					this.marks = {};
					this.marks[this.home] = 0;
				}
				else
				{
					this.steps = [];
					this.marks = {};
				}

				for (var i = 1; i < this.picks.length; i++)
				{
					////keine ticks mehr!!!jaaaaa
					////alles wird durch resourcen gewinnung getimed
					//name: tale of beast (beast bekomment man nie zu gesicht!!!beast ist das reine böse)
					//weite transporte mit fliegenden einheiten
					//tiles für mitspieler markieren z.b. hierhin bitte 2 holz liefern, ich gebe dafür x (und/oder y ...)
					//auch markieren ich biete hier etwas an (markt oder wo auch immer; markt ist da wo straßen sich kreuzen;
					//   markte bringen geld in die stadtkasse; geld erst später? am anfang nur waren?) :)! kosten dafür werden eingefroren(pseudo verbraucht)!!
					//picks in echtzeit!!!!!
					//pick kombo mit mehr wert wird bevorzugt
					//ansonsten der erste?
					//bei streitigkeiten verhandlung(auktion?)
					//wenn ein versorgungsast im kampf abgebrochen wird bekommt der angreifer irgendwas
					//kann in kampf ausarten!!!
					//secret actions
					//sneak->get telatively early (t-x) to other somehow disrupted players
					var path = this.findPath(this.picks[i - 1], this.picks[i]);

					for (var j = 0; j < path.steps.length; j++)
					{
						var direction = path.steps[j];
						this.steps.push([[], direction]);
						//else this.steps.unshift([[]]);
						this.marks[path.tiles[j]] = Math.pow(2, direction);
						this.marks[path.tiles[j]] = Math.pow(2, direction);
					}
				}
			}
		}
		else if (this.mode == 'overview')
		{
			overview.call(this, tile);
		}
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
				var chars = JSON.parse(prompt('Char?:', JSON.stringify([['tilla', [5, 8, 2], [9, [[6, []]]], 10, this.home, this.steps]])));
				this.root.send('tick', [chars]);
			}
		}
	});

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

	var CharMenu = oui.SingleMenu.clone(64, 64, 'steps', {left: 10, right: 10, height: 64, bottom: 84}, false, true);

	CharMenu.on('select', function (option, i)
	{
		console.log('CharMenu', option, i);
	});

	var MarkMenu = oui.SingleMenu.clone(64, 64, 'steps', {left: 10, right: 10, height: 64, bottom: 84}, false, true);

	MarkMenu.on('select', function (option, i)
	{
		console.log('MarkMenu', option, i);
	});

	var MainMenu = oui.SingleMenu.clone(64, 64, 'options', {left: 10, right: 10, height: 64, bottom: 10}, false, true);

	MainMenu.on('select', function (option, i)
	{
		console.log('MainMenu', option, i);
	});

	var TaskMenu = oui.SingleMenu.clone(64, 64, 'options', {left: 10, right: 10, height: 64, bottom: 158}, false, true);

	TaskMenu.on('select', function (option, i)
	{
		console.log('TaskMenu', option, i);
	});

	var ItemMenu = oui.SingleMenu.clone(64, 64, 'items', {left: 0, right: 10, height: 64, bottom: 74}, false, true);

	ItemMenu.on('select', function (option, i)
	{
		console.log('ItemMenu', option, i);
	});

	ItemMenu.method('reset', function (items)
	{
		delete this.picked;
		this.options = [];

		for (var type in items)
		{
			//split into multiple entries if item changed state!!!!!!
			//var last = Math.max.apply(null, ooo.intkeys(items[id]));
			//var info = items[id][last];
			this.options.push([ITEMTILES2[type], ooo.size(items[type])]);
		}

		return this;
	});

	ItemMenu.method('drawButton', function (time, context, data, picked)
	{
		if (picked)
		{
			context.fillStyle = '#f00';
			context.fillRect(0, 0, this.button_w, this.button_h);
		}
		else
		{
			var type = data[0];
			context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
		}
	});

	ItemMenu.on('draw', function (time, context)
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

	var CharMenu = oui.SingleMenu.clone(64, 64, 'chars', {left: 64, width: 64, top: 0, bottom: 0}, true, false);

	CharMenu.on('select', function (option, i)
	{
		console.log('ItemMenu', option, i);
	});

	CharMenu.method('reset', function (chars)
	{
		delete this.picked;
		this.options = [];

		for (var id in chars)
		{
			//split into multiple entries if item changed state!!!!!!
			var last = Math.max.apply(null, ooo.intkeys(chars[id]));
			var info = chars[id][last];
			this.options.push(info);
		}

		return this;
	});

	CharMenu.on('draw', function (time, context)
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
			if (this.picked == i)
			{
				context.fillStyle = '#f00';
				context.fillRect(0, 0, this.button_w, this.button_h);
			}
			else
			{
				var info = this.options[i];
				var type = CHARTILES[info.type];
				context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);

				if (info.insight < ITEMS[info.type].obscurity)
				{
					context.fillStyle = '#fff';
					context.fillText('' + info.insight + '/' + ITEMS[info.type].obscurity, 10, 54);
				}
			}

			context.translate(this.offset_x, this.offset_y);
		}
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
		this.game.players[name] = true;
	});

	Client.on('message:leave', function (name)
	{
		console.log('LEAVE %s', name);
		delete this.game.players[name];

		if (this.timeout)
		{
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	});

	Client.on('message:ready', function (delay)
	{
		console.log('READY %d', delay);
		delay--;

		if (delay > 0)
		{
			var that = this;
			this.timeout = setTimeout(function () { that.events.on['message:ready'].call(that, delay) }, 1000);
		}
		else
		{
			delete this.timeout;
		}
	});

	//wie behandle ich doppelte infos (diff insight) //diff insight verhindern? vereinfachen?
	function convert_history (history)
	{
		var times = ooo.intkeys(history).sort(function (a, b) { return (a > b) });
		var by_time = {};
		var by_id = {};
		var by_type = {};
		var by_root = {};

		//build base info tree
		for (var i = 0; i < times.length; i++)
		{
			var time = times[i];
			var parents = {};
			var children = {};

			for (var char in history[time])
			{
				for (var id in history[time][char])
				{
					var info = {};
					info.id = id;
					info.type = history[time][char][id][0];
					info.insight = history[time][char][id][1];
					//info.data = ['hallo'];//zb text auf blatt papier
					info.children = {};
					var childr = history[time][char][id][2];

					for (var j = 0; j < childr.length; j++)
					{
						var cid = childr[j];
						var child = children[cid];

						if (child)
						{
							info.children[cid] = child;
							child.parent = info;
						}
						else
						{
							parents[cid] = info;
						}
					}

					var parent = parents[id];

					if (parent)
					{
						parent.children[id] = info;
						info.parent = parent;
					}
					else
					{
						children[id] = info;
					}

					var group = ITEMS[info.type].group;
					ooo.add(by_time, info, group, time, id);
					ooo.add(by_id, info, group, id, time);
					ooo.add(by_type, info, group, info.type, id, time);
				}
			}
		}

		for (var group in by_id)
		{
			for (var id in by_id[group])
			{
				for (var time in by_id[group][id])
				{
					var info = by_id[group][id][time];
					var root = rootof(info);
					ooo.add(by_root, info, root.id, group, time, id);
				}
			}
		}

		return {by_time: by_time, by_id: by_id, by_type: by_type, by_root: by_root};
	}

	Client.on('message:start', function (time, history, chars)
	{
		console.log('START', arguments);
		//this.root.update = false;
		//this.root.once = true;
		this.game.time = time;
		//this.world = new World(this.game.rules[1], info, chars, 64, 64, 'steps');
		//this.show(this.world);
		//this.landmark = 132;//focus on leader
		this.data = {};
		this.data.info = convert_history(history);
		this.data.chars = chars;
		this.scenes = {};
		this.scenes.land = new Land(this.data.info);
		this.scenes.land.reset(132, ooo.maxkey(this.data.info.by_id[1][132]));
		this.show(this.scenes.land);

		this.menus = {};
		/*this.menus.chars = new CharMenu();
		this.menus.chars.reset([2,1,2]);
		this.show(this.menus.chars, 1);
		this.menus.marks = new MarkMenu();
		this.menus.marks.reset([1,2,1]);
		this.show(this.menus.marks, 1);*/
		/*this.menus.items = new ItemMenu();
		this.menus.items.reset(this.info.group[2]);
		this.show(this.menus.items, 1);*/
		/*this.menus.chars = new CharMenu();
		this.menus.chars.reset(this.info.group[1]);
		this.show(this.menus.chars, 1);*/
	});

	Client.on('message:continue', function (rules, names, time, history, chars, waiting)
	{
		console.log('CONTINUE', arguments);
		this.forms.login.hide();
		ooo.setLocal('auth', this.auth);
		this.game = new Game(rules, names);
		this.game.time = time;
		//this.world = new World(this.game.rules[1], info, chars, 64, 64, 'steps');
		//this.land = new Land();
		//this.show(this.land);
		//this.show(this.world);
		this.data = {};
		this.data.info = convert_history(history);
		this.data.chars = chars;
		this.scenes = {};
		this.scenes.land = new Land(this.data.info);
		this.scenes.land.reset(132, ooo.maxkey(this.data.info.by_id[0][132]));
		this.show(this.scenes.land);

		console.log('CHARS %s', JSON.stringify(ooo.intkeys(this.data.info.by_id[1])));
		console.log('ITEMS %s', JSON.stringify(ooo.intkeys(this.data.info.by_id[2])));
		var time = ooo.maxkey(this.data.info.by_id[0][133]);
		console.log('@133 %s', JSON.stringify(ooo.intkeys(this.data.info.by_id[0][133][time].children)));

		this.menus = {};
		/*this.menus.chars = new CharMenu();
		this.menus.chars.reset([2,1,2]);
		this.show(this.menus.chars, 1);*/

		/*this.menus.marks = new MarkMenu();
		this.menus.marks.reset([1,2,1]);
		this.show(this.menus.marks, 1);*/

		/*this.menus.main = new MainMenu();
		this.menus.main.reset([0,1]);
		this.show(this.menus.main, 1);*/

		/*this.menus.items = new ItemMenu();
		this.menus.items.reset(this.info.type[2]);
		this.show(this.menus.items, 1);*/

		/*this.menus.chars = new CharMenu();
		this.menus.chars.reset(this.world.list[1]);
		this.show(this.menus.chars, 1);*/
		//var that = this;

		/*this.world.on('input:pick', function (tile, x, y)
		{
			this.diffs[til
			that.menu.reset([tile.data.type]);
		});*/
		//this.land = new Site();
		//this.show(this.land);

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
