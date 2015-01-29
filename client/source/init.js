'use strict';
//PROBLEM
///wenn man state erst erkennt ab obfuscation gibt es die situation
////daß man weiss es ist ein wlad aber nicht wieviel es kostet durchzugehn!!!

//TODO
///Kollisionen (erstmal nur mit Schwerten und Schilden)
///Random Draw (erstmal; später evtl DeckBuilding)
///MouseOver (HandMenu)
///Karten (InfoAnsicht;Bild;Power;Gain;Title;Description)
///Karten erstellen
///Sound (erstmal beim Kartenablegen)
///Animation (kleines Ausrollbanner)
///Transitions (zwischen Stages)

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
	var ITEMS = [0, 0, 0, 0, 0, 3, 4, 0, 1, 0, 0, 0, 0, 0];
	var BORDER = 24;
	var MARKS = ['#942e39', '#651144', '#aaa', '#2f1d71', '#fff', '#f44'];//actions, paths, route, others
	var WAIT = 'PLEASE WAIT FOR %d OTHER PLAYERS';
	var MOVE = 'PLEASE MAKE A MOVE';

	var LoginForm = oui.Form.extend(function (color, font, layout, align, baseline)
	{
		oui.Form.call(this, color, font, layout, align, baseline);
		this.show(new ooo.Box('#777'), -1);
		this.show(new oui.Field('auth_token', {top: 10, left: 10, right:10, height: 30}));
		this.show(new oui.Field('auth_token', {top: 50, left: 10, right:10, height: 30}));
		this.show(new oui.Submit('login', 0, {top: 90, left: 10, right: 10, height: 30}));
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

	//fremde charpaths werden durch avatar dargestellt der immer hin und her läuft (kann auch doppelt vorkommen)
	///mouseover hält den char an und zeigt pfad

	//WorldMap

	var WorldMap = oui.TileMap.extend(function (size, asset, layout)
	{
		oui.TileMap.call(this, size, asset, layout);
		this.route = {};
		this.marks = {};
	});

	WorldMap.method('calcCost', function (data)
	{
		if (data.info)
		{
			if (data.info.id in this.route)
			{
				return 0;
			}
			else
			{
				return data.info.type.range;
			}
		}
	});

	WorldMap.method('drawTile', function (tile, data, time, context)
	{
		context.drawImage(this.image, this.image.tile_x[data.type], this.image.tile_y[data.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);

		if (tile.i in this.marks)
		{
			context.globalAlpha = 0.8;
			context.fillStyle = MARKS[this.marks[tile.i]];
			context.fillRect(6, 6, 84, 84);
		}
		else if (data.mark != undefined)
		{
			context.globalAlpha = 0.8;
			context.fillStyle = MARKS[data.mark];
			context.fillRect(16, 16, 64, 64);
		}
	});

	WorldMap.method('findAction', function (drop_x, drop_y, card)
	{
		var tile = this.getTileAt(drop_x, drop_y);

		if (!card.type.condition(tile.data.info))//temp: later nor necessarily tile info
		{
			throw 'target is incompatible with card';
		}

		var chars = jup.matchChars(card.type.power, this.root.data.chars);

		if (ooc.size(chars) == 0)
		{
			throw 'no char with these powers';
		}

		var paths = [];

		for (var info_id in chars)
		{
			var char = chars[info_id];
			var path = this.findPath(char.home, tile);

			if (char.info.state[0] < path.cost)
			{
				continue;
			}

			paths[info_id] = path;

			if ((min_char == undefined) || (path.cost < paths[min_char.info.id].cost))
			{
				var min_char = char;
			}
		}

		if (min_char == undefined)
		{
			throw 'not reachable by matching chars';
		}

		return {char: min_char, paths: paths, card: card, tile: tile};
	});

	WorldMap.method('update_actions', function (drop_x, drop_y, card)
	{
		var action = [min_char.info.id, paths];
		var min_path = paths[min_char.info.id];
		var action = [min_char.info.id, min_path.steps, card.type.id];
		console.log(JSON.stringify(Object.keys(paths)), JSON.stringify(action));

		//show path selector on world_map
		for (var info_id in paths)
		{
			var path = paths[info_id];

			for (var i = 0; i < path.tiles.length; i++)
			{
				var tile_i = path.tiles[i];
				this.marks[tile_i] = (info_id == min_char.info.id) ? 1 : 0;
			}
		}
	});

	WorldMap.on('update_terrain', function (terrain)
	{
		for (var i = 0; i < this.index.length; i++)
		{
			var tile = this.index[i];

			if (i in terrain)
			{
				tile.data = terrain[i];
			}
			else
			{
				tile.data = {type: 0};
			}
		}
	});

	WorldMap.on('update_chars', function (chars)
	{
		var realm = {};

		for (var info_id in chars)
		{
			var char = chars[info_id];
			var area = this.findArea(ooc.clone(char.task.route), char.info.state[0] - char.task.range);

			for (var tile_i in area)
			{
				realm[tile_i] = true;
			}
		}

		for (var i = 0; i < this.index.length; i++)
		{
			var tile = this.index[i];

			if (i in realm)
			{
				tile.data.type = (tile.data.info.type.id << 1) + 2;
			}
			else if (tile.data.info)
			{
				tile.data.type = (tile.data.info.type.id << 1) + 3;
			}
		}
	});

	WorldMap.on('pick_tile', function (tile, button)
	{
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

	/*CharMenu.on('update_data', function (chars, realm)
	{
		this.data = [];

		for (var char_id in chars)
		{
			this.data.push(chars[char_id]);
		}
	});*/

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

	var Inventory = oui.Menu.extend(function (asset, layout, style)
	{
		oui.Menu.call(this, asset, layout, style);
	});

	Inventory.method('drawButton', function (time, context, data, pick)
	{
		var type = ITEMS[data[0]];
		context.drawImage(this.image, this.image.tile_x[type], this.image.tile_y[type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
		context.fillStyle = '#fff';
		context.font = '12px sans-serif';
		context.textAlign = 'right';
		context.textBaseline = 'bottom';
		context.fillText(data[1].length, 60, 60);
	});

	Inventory.on('focus:char', function (char)
	{
		this.data = [];

		for (var type_id in char.inventory)
		{
			this.data.push([type_id, char.inventory[type_id]]);
		}
	});

	Inventory.on('pick:item', function (data, index)
	{
		var info = ooc.minKeyValue(data[1]);
		console.log(info.type.title);
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

	var ReadyButton = ooo.Box.extend(function (color, layout)
	{
		ooo.Box.call(this, color, layout);
	});

	ReadyButton.on('mouse_click', function (button, down_x, down_y)
	{
		var actions = this.root.data.actions;
		var data = {};

		for (var tile_i in actions)
		{
			for (var i = 0; i < actions[tile_i].length; i++)
			{
				var action = actions[tile_i][i];
				var info_id = action.char.info.id;
				var steps = action.paths[info_id].steps;
				var card_id = action.card.type.id;
				//tile_i in array[1] is temp: has to be the target info_id
				ooc.push([card_id, tile_i, steps], data, info_id, tile_i);
			}
		}

		this.root.send('tock', [data]);
		this.root.delete('actions');
	});

	var ActionMenu = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		this.ready_button = new ReadyButton('#faa', {left: 0, width: 50, top: 0, height: 50});
	});

	ActionMenu.on('update_actions', function (actions)
	{
		this.hideChildren();

		if (actions)
		{
			/*var rel_x = 0;

			for (var tile_i in actions)
			{
				for (var i = 0; i < actions[tile_i].length; i++)
				{
					var action = actions[tile_i][i];
					action.card.place(rel_x, i * 40);//.resize(64, 64);
					this.show(action.card);
					console.log(rel_x, i * 40, 64, 64);
				}

				rel_x += 48;
			}*/

			this.show(this.ready_button);
		}
		else
		{
		}
	});

	var TextBox = ooo.Text.extend(function (layout, color, font, alignment, baseline)
	{
		ooo.Text.call(this, layout, color, font, alignment, baseline);
	});

	TextBox.on('update_stats', function (stats)
	{
		//ooc.map(char.info.type.param, char.info.state)
		this.string = JSON.stringify(stats);
	});

	var Card = ooo.Sprite.extend(function (card_id, count)
	{
		ooo.Sprite.call(this, 'cards', card_id);
		this.type = jup.cards.by_id[card_id];
		this.count = count;
		this.ignore('mouse_drag', 'mouse_drop');
	});

	/*Card.method('shrink', function ()
	{
	});

	Card.on('show', function (root, parent)
	{
		ooo.Actor.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
	});*/

	Card.on('mouse_down', function (button, down_x, down_y)
	{
		this.down_x = this.rel_x;
		this.down_y = this.rel_y;
		this.listen('mouse_drag', 'mouse_drop');
		return false;
	});

	Card.on('mouse_drag', function (drag_x, drag_y)
	{
		this.rel_x = this.down_x + drag_x;
		this.rel_y = this.down_y + drag_y;
		return false;
	});

	Card.on('mouse_drop', function (drop_x, drop_y)
	{
		try
		{
			var action = this.root.play_prompt.world_map.findAction(drop_x, drop_y, this);

			this.root.push(action, 'actions', action.tile.i);
			var actions = this.root.data.actions;

			for (var tile_i in actions)
			{
				for (var i = 0; i < actions[tile_i].length; i++)
				{
					var action = actions[tile_i][i];
					var char = action.char;
					var path = action.paths[char.info.id];
					char.task.range += path.cost;
					char.task.power = jup.addPower(char.task.power, action.card.type.power);

					if (false)//Card is Job
					{
						var route = ooc.hash(char.task.route);

						for (var i = 0; i < path.tiles.length; i++)
						{
							route[path.tiles[i]] = true;
						}

						char.task.route = ooc.intkeys(route);
					}
				}
			}

			this.root.put(this.root.data.chars, 'chars');

			if (this.count == 1)
			{
				this.root.delete('hand', this.type.id);
			}
			else
			{
				this.count--;
			}
		}
		catch (e)
		{
			console.log('CARD EXCEPTION');
			console.log(e.toString());

			if (e.stack)
			{
				console.log(e.stack);
			}
		}

		this.rel_x = this.down_x;
		this.rel_y = this.down_y;
		this.ignore('mouse_drag', 'mouse_drop');
	});

	var HandMenu = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
	});

	/*HandMenu.on('mouse_over', function ()
	{
		console.log('asdfasdf');
	});*/

	HandMenu.on('update_hand', function (hand)
	{
		this.hideChildren();

		if (hand)
		{
			var rel_y = 0;
			var z_index = 0;

			for (var card_id in hand)
			{
				var card = hand[card_id];
				card.place(-98, rel_y);
				this.show(card);//, z_index--
				rel_y += 30;
			}
		}
	});

	var PlayPrompt = ooo.Scene.extend(function (map_size, layout)
	{
		//battle(red),diplomacy(blue),shady(gray),development(yellow),nature(green),magic(purple)
		ooo.Scene.call(this, layout);
		this.world_map = new WorldMap(map_size, 'steps');
		this.show(this.world_map);

		/*this.show(new ooo.Box('#4d3932', {bottom: BORDER, top: BORDER, width: 148, right: BORDER}));
		this.char_menu = new CharMenu('chars', {bottom: BORDER+10, top: BORDER+10, width: 64, right: BORDER+10}, OUI_VERTICAL | OUI_BOTTOM);
		this.show(this.char_menu, 1);
		this.inventory = new Inventory('items', {bottom: BORDER+10, top: BORDER+10, width: 64, right: BORDER+74}, OUI_VERTICAL | OUI_BOTTOM);
		this.show(this.inventory, 1);*/

		//this.notemenu = new oui.Menu('steps', {width: 64, right: BORDER, top: BORDER, bottom: 128}, OUI_REVERSED | OUI_BOTTOM | OUI_VERTICAL).reset([1,1,1]);
		//this.show(this.notemenu, 1);

		//this.turnmenu = new TurnMenu({left: BORDER, right: BORDER, top: BORDER, height: 64});
		//this.show(this.turnmenu, 1);

		this.action_menu = new ActionMenu({horizontal: 50, width: 250, top: BORDER, height: 200});
		this.show(this.action_menu, 1);

		this.hand_menu = new HandMenu({left: 0, width: 98, vertical: 50, height: 350});
		this.show(this.hand_menu, 2);
	});

	var CardStack = ooo.Box.extend(function (type, color, layout)
	{
		ooo.Box.call(this, color, layout);
		this.type = type;
	});

	CardStack.on('mouse_click', function (button, down_x, down_y)
	{
		//block until answer!!!!!!!!!!!!!!
		this.root.send('draw', [this.type]);
		return false;
	});

	var DrawPrompt = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		this.count = 0;
		this.show(new CardStack(0, '#440', {left: 0, width: 150, top: 0, height: 150}));
		this.show(new CardStack(1, '#044', {right: 0, width: 150, top: 0, height: 150}));
	});

	var CardPrompt = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		this.card = null;
		this.show(new ooo.Box('#444', {horizontal: 50, width: 200, vertical:50, height: 200}));
	});

	CardPrompt.on('mouse_click', function (button, down_x, down_y)
	{
		this.root.put(this.card, 'hand', this.card.type.id);
		//this.root.put(this.root.data.hand, 'hand');
		this.root.draw_prompt.count--;

		if (this.root.draw_prompt.count == 0)
		{
			this.root.draw_prompt.hide();
		}

		this.hide();
		return false;
	});

	//Game
	function initGame (mode, rules, names)
	{
		this.mode = mode;
		this.rules = rules;
		this.players = {};

		for (var i = 0; i < names.length; i++)
		{
			this.players[names[i]] = true;
		}

		this.draw_prompt = new DrawPrompt({horizontal: 50, width: 380, vertical: 50, height: 150});
		this.card_prompt = new CardPrompt();
		this.play_prompt = new PlayPrompt(rules[1]);//mode integration bez rule semantik
	}

	//Game
	function startGame (time)
	{
		//this.update = false;
		//this.once = true;
		this.time = time;
		this.started = true;
		this.show(this.play_prompt);
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

	function rootsOf (info, group)
	{
		var roots = {};
		var open = [];

		do
		{
			if (info.type.group == group)
			{
				roots[info.id] = true;
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

		return roots;
	}

	//Königsmacher nicht vergessen!!! einer kriegt ne krone der andere schutz/allianz
	//Karten sind per Realm und Items per Char!!!!!
	//Passive Karten blockieren die HandMenu!!! auto balance!!! :D
	//devel konsole triggern per / und eingabe per eval (this=root) (inkl history+localStore)

	//TODO DATENFORMAT UND VERARBEITUNG!!!!

	//JOBS KOSTEN WEDER POWER NOCH RANGE oder nur power oder so, aber wenn man sie abbricht verliert man die kosten permanent
	///führt dazu daß stabilität besonders wichtig und man fur weitsicht belohnt wird

	////jobs sind immer durch tile augmentations (gebäude) gekennzeichnet????
	////aber nicht alle gebäude sind jobs

	////HOWTO Synergys forcieren zwischen chars

	//Game
	function prepareTock (hand, chars, knowledge, terrain, briefing)//stats
	{
		var parents = {};
		var children = {};
		var by_group = {};
		var by_tile = {};
		var by_char = {};

		for (var info_id in knowledge)
		{
			var data = knowledge[info_id];
			var info = {};
			info.id = parseInt(info_id);
			info.type = jup.infos.by_id[data[0]];
			info.state = data[1];
			info.parents = {};
			info.children = {};

			if (data[2])
			{
				//link to children
				for (var i = 0; i < data[2].length; i++)
				{
					var child_id = data[2][i];
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
					info.parents[parent_id] = parent;
					parent.children[info_id] = info;
				}

				delete parents[info_id];
			}
			else
			{
				children[info_id] = info;
			}

			knowledge[info_id] = info;
			var group_id = info.type.group;
			ooc.put(info, by_group, group_id, info_id);
		}

		for (var group_id in by_group)
		{
			for (var info_id in by_group[group_id])
			{
				var info = by_group[group_id][info_id];
				var root_tiles = rootsOf(info, 1);
				var root_chars = rootsOf(info, 2);

				for (var info_id in root_tiles)
				{
					ooc.push(info, by_tile, info_id, group_id, info.type.id);
				}

				for (var info_id in root_chars)
				{
					ooc.push(info, by_char, info_id, group_id, info.type.id);
				}
			}
		}
		//no realm stats!!! only char stats!!! (das heisst alles ist angreifbar/vergänglich)

		for (var tile_i in terrain)
		{
			if (tile_i in by_group[1])
			{
				var info = by_group[1][tile_i];
				var data = {};
				data.info = info;
				data.knowledge = by_tile[tile_i];
				data.type = (info.type.id << 1) + 2;

				/*if (2 in data.knowledge)
				{
					data.mark = 2;
				}*/
			}
			else
			{
				var data = {type: (terrain[tile_i] << 1) + 3};
			}

			terrain[tile_i] = data;
		}

		this.put(terrain, 'terrain');
		chars = ooc.hash(chars);

		for (var info_id in chars)
		{
			var char = {};
			char.info = knowledge[info_id];
			char.knowledge = by_char[info_id];
			var tile_i = char.knowledge[0][33][0].state[0];
			char.home = this.play_prompt.world_map.index[tile_i];
			var task = char.knowledge[0][23][0];
			char.task = ooc.map(task.type.param, task.state);
			chars[info_id] = char;
		}

		this.put(chars, 'chars');
		hand = ooc.hash(hand);

		for (var card_id in hand)
		{
			hand[card_id] = new Card(card_id, hand[card_id]);
		}

		this.put(hand, 'hand');
		//update char_menu (stats & items & portraits)
		///////////stats oben, items rechts, portraits unten
		//update hand_menu
		//this.play_prompt.hand_menu.bubba();
		//update mode_menu (progression stats(persistant stats))

		if (briefing.init)
		{
			this.showInit(briefing.init);
		}

		if (briefing.draw)
		{
			this.showDraw(briefing.draw);
		}
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

	Game.method('showInit', function (stats)
	{
		//this.init_prompt.count = briefing.draw;
		this.show(this.init_prompt, 1);
	});

	Game.method('showDraw', function (count)
	{
		this.draw_prompt.count = count;
		this.show(this.draw_prompt, 1);
	});

	Game.method('showCard', function (card)
	{
		this.card_prompt.card = card;
		this.show(this.card_prompt, 2);
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
			var mode = games[id][0];
			var rules = games[id][1];
			var names = games[id][2];
			names.push(this.auth_token[0]);
			initGame.call(this, mode, rules, names);
			this.send('join', [id]);
		}
		else
		{
			var mode = prompt('mode?', 'normal');
			var rules = JSON.parse(prompt('rules?', '[1, 32]'));
			var names = [this.auth_token[0]];
			initGame.call(this, mode, rules, names);
			this.send('host', [mode, rules]);
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

	Game.on('message:continue', function (mode, rules, names, time, hand, chars, knowledge, terrain, briefing, wait)
	{
		console.log('CONTINUE', arguments);
		console.log(briefing.message);
		this.login_prompt.hide();
		ooc.setLocal('auth_token', this.auth_token);
		initGame.call(this, mode, rules, names);
		startGame.call(this, time);
		prepareTock.call(this, hand, chars, knowledge, terrain, briefing);

		if (wait)
		{
			console.log(WAIT, wait);
		}
		else
		{
			console.log(MOVE);
		}
	});

	Game.on('message:tick', function (hand, chars, knowledge, terrain, briefing)
	{
		console.log('TICK', arguments);
		console.log(briefing.message);

		if (!this.started)
		{
			startGame.call(this, 0);
		}
		else
		{
			this.time++;
		}

		prepareTock.call(this, hand, chars, knowledge, terrain, briefing);
		console.log(MOVE);
	});

	Game.on('message:card', function (card_id)
	{
		console.log('CARD "%s"', jup.cards.by_id[card_id].title);

		if (card_id in this.data.hand)
		{
			var card = this.data.hand[card_id];
			card.count++;
		}
		else
		{
			var card = new Card(card_id, 1);
			//this.data.hand[card_id] = card;
		}

		this.showCard(card);
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
		var client = new Game(hook, '#444');
		client.load('steps', 'assets/steps.png', 96, 96);
		client.load('chars', 'assets/chars.png', 64, 64);
		client.load('items', 'assets/items.png', 64, 64);
		client.load('path', 'assets/path.png', 64, 64);
		client.load('options', 'assets/options.png', 64, 64);
		client.load('buttons', 'assets/buttons.png', 64, 64);
		client.load('powers', 'assets/powers.png', 64, 64);
		client.load('login', 'assets/login.png', 130, 30);
		client.load('cards', 'assets/cards.png', 196, 196);
		client.open(HOST);
	});
})();
