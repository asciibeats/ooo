'use strict';
//Items? wie sind die im spiel integriert?
//NEXT: HandMenu (keine Actors mehr per Card! so wie ActionMenu && MouseOver und Info)
//THEN: KartenInfoDrawn (InfoAnsicht;Bild;Count;Gain;Title;Description)
//THEN: aktionsmanagement (path modifikation; aktion verschieben)
//THEN: ActionMenu (hand to menu; tile to menu; menu to menu)

//NO REALM STATS!!! only char stats!!! (das heisst alles ist angreifbar/vergänglich)

//TODO
///ActionModifikation

///Drag Actions from
//////Hand to Tile (create Action) DONE
//////Hand to Action (create Action)
//////Tile to Tile
//////Tile to Action
//////Action to Tile
//////Action to Action
//////Tile to Hand (revert to Card)
//////Action to Hand (revert to Card)

//rules_prompt
//browser_prompt

///Karten erstellen

///////LATER
///Sound (erstmal beim Kartenablegen)
///Animation (kleines Ausrollbanner)
///Transitions (zwischen Stages)

////////////////////////////////////////////////////////////
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

//fremde charpaths werden durch avatar dargestellt der immer hin und her läuft (kann auch doppelt vorkommen)
///mouseover hält den char an und zeigt pfad

(function ()
{
	var HOST = 'http://' + window.location.hostname + ':11133';
	var ITEMS = [0, 0, 0, 0, 0, 3, 4, 0, 1, 0, 5, 0, 0, 0];
	var BORDER = 24;
	var MARKS = ['#fff', '#777', '#eaa', '#2f1d71', '#fff', '#f44'];//actions, paths, route, others
	var WAIT = 'PLEASE WAIT FOR %d OTHER PLAYERS';
	var MOVE = 'PLEASE MAKE A MOVE';

	var LogoPrompt = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		this.show(new ooo.Box('#474'), 0);
		this.show(new ooo.Box('#eee', {width: 200, height: 200}), 1);
	});

	var LoginForm = oui.Form.extend(function (color, font, layout, align, baseline)
	{
		oui.Form.call(this, color, font, layout, align, baseline);
		this.show(new ooo.Box('#777'), 0);
		this.show(new oui.Field('token', {top: 10, left: 10, right:10, height: 30}), 1);
		this.show(new oui.Field('token', {top: 50, left: 10, right:10, height: 30}), 2);
		this.show(new oui.Submit('login', 'login', 0, {top: 90, left: 10, right: 10, height: 30}), 3);
	});

	LoginForm.bubble('form_submit', function (name, data)
	{
		this.root.data.token = data.token;
		this.root.send('login', data.token);
		this.root.trigger('show_load');
	});

	var LoginPrompt = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		this.show(new ooo.Box('#444'), 0);
		this.show(new LoginForm('#a50', '30px sans-serif', {horizontal: 50, width: 150, vertical: 50, height: 130}), 1);
	});

	var LoadPrompt = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		this.show(new ooo.Box('#227'), 0);
		this.show(new ooo.Box('#aaa', {width: 300, height: 100}), 1);
	});

	var WorldMap = oui.TileMap.extend(function (size, asset, layout)
	{
		oui.TileMap.call(this, size, asset, layout);
		this._name = 'world';
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
			context.globalAlpha = 1.0;
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

		if (!tile.data.info)
		{
			throw 'target is out of reach';
		}

		if (!card.condition(tile.data.info))//temp: later nor necessarily tile info
		{
			throw 'target does not meet cards condition';
		}

		var chars = {};

		for (var info_id in this.root.data.chars)
		{
			var char = this.root.data.chars[info_id];

			if (ooc.matchCount(card.power, char.info.state[3]))
			{
				chars[info_id] = char;
			}
		}

		if (ooc.size(chars) == 0)
		{
			throw 'no char with these powers';
		}

		var paths = {};
		var quirks = {};

		for (var info_id in chars)
		{
			var char = chars[info_id];
			var path = this.findPath(char.home, tile);

			if ((path == null) || ((char.info.state[0] - char.temp.range) < path.cost))
			{
				continue;
			}

			paths[info_id] = path;
			quirks[info_id] = {};

			if ((min_char == undefined) || (path.cost < paths[min_char.info.id].cost))
			{
				var min_char = char;
			}
		}

		if (min_char == undefined)
		{
			throw 'not reachable by matching chars';
		}

		return {char: min_char, paths: paths, card: card, tile: tile, quirks: quirks};
	});

	WorldMap.on('update_terrain', function (terrain)
	{
		for (var i = 0; i < this.tiles.length; i++)
		{
			var tile = this.tiles[i];

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
			var area = this.findArea(ooc.clone(char.temp.route), char.info.state[0] - char.temp.range);

			for (var tile_i in area)
			{
				realm[tile_i] = true;
			}
		}

		for (var i = 0; i < this.tiles.length; i++)
		{
			var tile = this.tiles[i];

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

	WorldMap.on('edit_action', function (action)
	{
		this.action = action;
		var focus_id = action.char.info.id;

		for (var info_id in action.paths)
		{
			var tiles = action.paths[info_id].tiles;

			for (var i = 0; i < tiles.length; i++)
			{
				this.marks[tiles[i]] = (info_id == focus_id) ? 0 : 1;
			}
		}

		this.marks[action.tile.i] = 2;
	});

	WorldMap.on('pick_tile', function (tile, button)
	{
		if (this.action)//in edit mode
		{
			var info_id = this.action.char.info.id;
			var quirks = this.action.quirks[info_id];

			if (this.marks[tile.i] == 0)
			{
				//avoid tile
				if (tile.i in quirks)
				{
					delete quirks[tile.i];
				}
				else
				{
					quirks[tile.i] = false;
				}
			}
			else
			{
				//pass by tile
				if (tile.i in quirks)
				{
					delete quirks[tile.i];
				}
				else
				{
					quirks[tile.i] = true;
				}
			}
		}
	});

	WorldMap.on(['end_edit', 'update_actions', 'show_wait'], function ()
	{
		delete this.action;
		this.marks = {};
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

	/////////////////PLAY PROMPT
	var TurnButton = oui.Button.extend(function (asset, type, layout)
	{
		oui.Button.call(this, 'foo', asset, type, layout);
		this.type = 1;
	});

	TurnButton.on('mouse_click', function (button, down_x, down_y)
	{
		if (this.type == 2)
		{
			this.type = 0;
			var actions = this.root.data.actions;
			var data = {};

			for (var tile_i in actions)
			{
				for (var i = 0; i < actions[tile_i].length; i++)
				{
					var action = actions[tile_i][i];
					var info_id = action.char.info.id;
					var steps = action.paths[info_id].steps;
					var card_id = action.card.id;
					//tile_i in array[1] is temp: has to be the target info_id
					ooc.push([card_id, tile_i, steps], data, info_id, tile_i);
				}
			}

			this.root.send('tock', [data]);
			this.root.trigger('show_wait');
		}
		else if (this.type == 0)
		{
			this.root.trigger('end_edit');
		}

		this.type++;
		return false;
	});

	TurnButton.on('edit_action', function (action)
	{
		this.type = 0;
	});

	var HandMenu = ooo.Cell.extend(function (asset)
	{
		ooo.Cell.call(this);
		this.ignore('mouse_drag', 'mouse_drop');
		//////IGNORE BY DEFAULT!!!!!!!!!!!!
		this.asset = asset;
		this.stacks = [];
	});

	HandMenu.on('show', function (root, parent)
	{
		ooo.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
	});

	HandMenu.on('draw', function (time, context)
	{
		var tile_w = this.image.tile_w;
		var tile_h = this.image.tile_h;

		for (var i = 0; i < this.stacks.length; i++)
		{
			var stack = this.stacks[i];
			context.drawImage(this.image, this.image.tile_x[stack.card.id], this.image.tile_y[stack.card.id], tile_w, tile_h, 0, 0, tile_w, tile_h);
			context.translate(0, tile_h);
		}
	});

	HandMenu.on('update_hand', function (hand)
	{
		this.stacks = [];

		if (hand)
		{
			console.log('update_hand');
			//sort hand by power
			for (var card_id in hand)
			{
				this.stacks.push({card: jup.cards.by_id[card_id], count: hand[card_id]});
				//prepare/render stage
			}

			this.arrange({left: BORDER, width: this.image.tile_w, vertical: 50, height: ooc.size(hand) * this.image.tile_h});
		}
		else
		{
			console.log('delete_hand');
		}
	});

	HandMenu.on('mouse_click', function (button, down_x, down_y)
	{
		var index = Math.floor(down_y / this.image.tile_h);
		console.log(this.stacks[index].card.title);
		return false;
	});

	HandMenu.on('mouse_grab', function (button, down_x, down_y)
	{
		this.listen('mouse_drag', 'mouse_drop');
		var index = Math.floor(down_y / this.image.tile_h);
		this.drag_stack = this.stacks[index];
		return false;
	});

	HandMenu.on('mouse_drag', function (drag_x, drag_y)
	{
		//this.rel_x = this.down_x + drag_x;
		//this.rel_y = this.down_y + drag_y;
		return false;
	});

	HandMenu.on('mouse_drop', function (drop_x, drop_y)
	{
		this.ignore('mouse_drag', 'mouse_drop');

		try
		{
			var action = this.root.world_map.findAction(drop_x, drop_y, this.drag_stack.card);
			this.root.push(action, 'actions', action.tile.i);
			this.root.trigger('edit_action', [action]);

			if (this.drag_stack.count == 1)
			{
				this.root.delete('hand', this.drag_stack.card.id);
			}
			else
			{
				this.root.add(-1, 'hand', this.drag_stack.card.id);
			}
		}
		catch (e)
		{
			console.log('CARD EXCEPTION');
			console.log(e);
			alert(e);
		}

		delete this.drag_card;
		return false;
	});

	/*HandMenu.on('mouse_over', function ()
	{
		console.log('asdfasdf');
	});*/

	var ActionMenu = ooo.Cell.extend(function (asset)
	{
		ooo.Cell.call(this);
		this.asset = asset;
		this.actions = [];
	});

	ActionMenu.on('show', function (root, parent)
	{
		ooo.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
	});

	ActionMenu.on('draw', function (time, context)
	{
		var tile_w = this.image.tile_w;
		var tile_h = this.image.tile_h;

		for (var x = 0; x < this.actions.length; x++)
		{
			context.save();

			for (var y = 0; y < this.actions[x].length; y++)
			{
				var action = this.actions[x][y];
				context.drawImage(this.image, this.image.tile_x[action.card.id], this.image.tile_y[action.card.id], tile_w, tile_h, 0, 0, tile_w, tile_h);
				context.translate(0, tile_h);
			}

			context.restore();
			context.translate(tile_w, 0);
		}
	});

	ActionMenu.on('update_actions', function (actions)
	{
		this.actions = [];

		if (actions)
		{
			console.log('update_actions');
			var x = 0;
			var y = 0;
			var max_y = 0;

			for (var tile_i in actions)
			{
				this.actions[x] = [];

				for (var i = 0; i < actions[tile_i].length; i++)
				{
					var action = actions[tile_i][i];
					this.actions[x][y] = action;
					y++;

					if (y > max_y)
					{
						max_y = y;
					}
				}

				x++;
				y = 0;
			}

			this.arrange({horizontal: 50, width: (x * this.image.tile_w), top: BORDER, height: (max_y * this.image.tile_h)});
		}
		else
		{
			console.log('delete_actions');
		}
	});

	ActionMenu.on('mouse_click', function (button, down_x, down_y)
	{
		var x = Math.floor(down_x / this.image.tile_w);
		var y = Math.floor(down_y / this.image.tile_h);

		if ((x in this.actions) && (y in this.actions[x]))
		{
			console.log(this.actions[x][y].card.type.title);
			return false;
		}
	});

	var PathMenu = oui.Menu.extend(function ()
	{
		oui.Menu.call(this, 'chars');
	});

	PathMenu.method('drawButton', function (time, context, data, pick)
	{
		context.drawImage(this.image, this.image.tile_x[0], this.image.tile_y[0], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	PathMenu.on('edit_action', function (action)
	{
		this.action = action;
		var info_ids = Object.keys(action.paths);
		var width = info_ids.length * this.image.tile_w;
		this.arrange({horizontal: 50, width: width, bottom: BORDER, height: this.image.tile_h});
		this.reset(info_ids);
	});

	PathMenu.on('pick_item', function (info_id)
	{
		this.action.char = this.root.data.chars[info_id];
		this.root.put(this.root.data.actions, 'actions');
		this.root.world_map.trigger('edit_action', [this.action]);
	});

	var PlayPrompt = ooo.Scene.extend(function (layout)
	{
		ooo.Scene.call(this, layout);
		//this.show(new TurnButton('items', 0, {right: BORDER, width: 64, top: BORDER, height: 64}), 0);
		this.hand_menu = new HandMenu('items');
		this.action_menu = new ActionMenu('items');
		this.path_menu = new PathMenu();
	});

	PlayPrompt.capture('update_hand', function (hand)
	{
		if (hand && ooc.size(hand))
		{
			console.log('show_hand');
			this.show(this.hand_menu, 1);
		}
		else
		{
			console.log('hide_hand');
			this.hand_menu.hide();
		}
	});

	PlayPrompt.capture('update_actions', function (actions)
	{
		if (actions && ooc.size(actions))
		{
			console.log('show_actions');
			this.show(this.action_menu, 2);
		}
		else
		{
			console.log('hide_actions');
			this.action_menu.hide();
		}
	});

	PlayPrompt.capture('edit_action', function (action)
	{
		this.show(this.path_menu, 3);
	});

	/////////////DRAW PROMPT
	var CardExpose = ooo.Box.extend(function (color, layout)
	{
		ooo.Box.call(this, color, layout);
		this.card = null;
	});

	CardExpose.on('mouse_click', function (button, down_x, down_y)
	{
		this.parent.card_stacks.listen('mouse_click');
		this.parent.count--;

		if (this.parent.count == 0)
		{
			this.root.trigger('show_play');
		}

		console.log('asdf');
		this.hide();
		return false;
	});

	var CardStack = ooo.Box.extend(function (type, color, layout)
	{
		ooo.Box.call(this, color, layout);
		console.log(this);
		this._name = 'stack';
		this.type = type;
	});

	CardStack.on('mouse_click', function (button, down_x, down_y)
	{
		this.parent.ignore('mouse_click');
		this.root.send('draw', [this.type]);
		return false;
	});

	var DrawPrompt = ooo.Scene.extend(function ()
	{
		ooo.Scene.call(this);
		this._name = 'draw';
		this.count = 0;

		this.card_stacks = new ooo.Scene({horizontal: 50, width: 400, vertical:50, height: 150});
		this.card_stacks._name = 'stacks';
		this.card_stacks.show(new CardStack(0, '#440', {left: 0, width: 150, top: 0, height: 150}), 0);
		this.card_stacks.show(new CardStack(1, '#044', {right: 0, width: 150, top: 0, height: 150}), 1);
		this.show(this.card_stacks, 0);

		this.card_expose = new CardExpose('#444', {horizontal: 50, width: 200, vertical:50, height: 200});
	});

	DrawPrompt.capture('message_card', function (card)
	{
		this.card_expose.card = card;
		this.show(this.card_expose, 1);
	});

	DrawPrompt.bubble('mouse_grab', function (button, down_x, down_y, drag_x, drag_y)
	{
		return false;
	});

	DrawPrompt.bubble('mouse_click', function (button, down_x, down_y)
	{
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

		this.world_map = new WorldMap(rules[1], 'steps');
		this.show(this.world_map, 0);
		this.draw_prompt = new DrawPrompt();
		this.play_prompt = new PlayPrompt();//mode integration bez rule semantik
	}

	//Game
	function startGame (time)
	{
		this.time = time;
		this.started = true;
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
			char.home = this.world_map.tiles[tile_i];
			var task = char.knowledge[0][23][0];
			char.task = ooc.map(task.type.param, task.state);
			//char.temp = ooc.clone(char.task);
			chars[info_id] = char;
		}

		this.data.chars = chars;
		this.world_map.viewTile(ooc.minKeyValue(chars).home);
		this.put({}, 'actions');
		//results in update_chars!
		//this.put(chars, 'chars');
		//hand = ooc.hash(hand);
		this.put(hand, 'hand');
		//update char_menu (stats & items & portraits)
		///////////stats oben, items rechts, portraits unten
		//update hand_menu
		//this.play_prompt.hand_menu.bubba();
		//update mode_menu (progression stats(persistant stats))

		if (briefing.init)
		{
			this.trigger('show_init', [briefing.init]);
		}
		else if (briefing.draw)
		{
			this.trigger('show_draw', [briefing.draw]);
		}
		else
		{
			this.trigger('show_play');
		}
	}

	var Game = ooo.Client.extend(function (hook, color)
	{
		ooo.Client.call(this, hook, color);
		this.players = {};
		this.started = false;
		this.trigger('show_logo');
	});

	Game.capture('socket_open', function ()
	{
		var token = ooc.getLocal('token');

		if (token)
		{
			this.data.token = token;
			this.send('login', token);
		}
		else
		{
			this.trigger('show_login');
		}
	});

	Game.capture('socket_close', function (code)
	{
		console.log('CLOSED %s', code);
	});

	Game.capture('message_grant', function (games)
	{
		ooc.setLocal('token', this.data.token);

		if (ooc.size(games) > 0)
		{
			var id = parseInt(prompt('choose from: ' + JSON.stringify(games), '0'));
			var mode = games[id][0];
			var rules = games[id][1];
			var names = games[id][2];
			names.push(this.data.token[0]);
			initGame.call(this, mode, rules, names);
			this.send('join', [id]);
		}
		else
		{
			var mode = prompt('mode?', 'normal');
			var rules = JSON.parse(prompt('rules?', '[1, 32]'));
			var names = [this.data.token[0]];
			initGame.call(this, mode, rules, names);
			this.send('host', [mode, rules]);
		}
	});

	Game.capture('message_join', function (name)
	{
		console.log('JOIN %s', name);
		this.players[name] = true;
	});

	Game.capture('message_leave', function (name)
	{
		console.log('LEAVE %s', name);
		delete this.players[name];

		if (this.timeout)
		{
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	});

	Game.capture('message_ready', function (delay)
	{
		console.log('READY %d', delay);
		countDown.call(this, delay);
	});

	Game.capture('message_continue', function (mode, rules, names, time, hand, chars, knowledge, terrain, briefing, wait)
	{
		console.log('CONTINUE', arguments);
		console.log(briefing.message);
		ooc.setLocal('token', this.data.token);
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

	Game.capture('message_tick', function (hand, chars, knowledge, terrain, briefing)
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

	Game.capture('message_card', function (card_id)
	{
		var card = jup.cards.by_id[card_id];
		console.log('CARD \'%s\'', card.title);
		this.add(1, 'hand', card_id);
		return [card];
	});

	Game.capture('message_away', function (name)
	{
		console.log('AWAY %s', name);
	});

	Game.capture('message_back', function (name)
	{
		console.log('BACK %s', name);
	});

	Game.capture('message_wait', function (wait)
	{
		console.log(WAIT, wait);
	});

	Game.capture('update_actions', function (actions)
	{
		for (var info_id in this.data.chars)
		{
			var char = this.data.chars[info_id];
			char.temp = ooc.clone(char.task);
		}

		if (actions)
		{
			//add up task estimates
			for (var tile_i in actions)
			{
				for (var i = 0; i < actions[tile_i].length; i++)
				{
					var action = actions[tile_i][i];
					var char = action.char;
					var path = action.paths[char.info.id];
					char.temp.range += path.cost;
					char.temp.power = ooc.addCount(char.temp.power, action.card.power);

					if (false)//Card is Job
					{
						var route = ooc.hash(char.temp.route);

						for (var i = 0; i < path.tiles.length; i++)
						{
							route[path.tiles[i]] = true;
						}

						char.temp.route = ooc.intkeys(route);
					}
				}
			}
		}

		this.put(this.data.chars, 'chars');
	});

	Game.capture('show_wait', function ()
	{
		//this.show(this.wait_prompt, 1);
	});

	Game.capture('show_play', function ()
	{
		this.show(this.play_prompt, 1);
	});

	Game.capture('show_draw', function (count)
	{
		this.draw_prompt.count = count;
		this.show(this.draw_prompt, 1);
	});

	Game.capture('show_init', function (stats)
	{
		//this.init_prompt.stats = stats;
		//this.show(this.init_prompt, 1);
	});

	Game.capture('show_load', function ()
	{
		this.load_prompt = new LoadPrompt();
		this.show(this.load_prompt, 1);
		delete this.login_prompt;
	});

	Game.capture(['show_login', 'message_deny'], function ()
	{
		this.login_prompt = new LoginPrompt();
		this.show(this.login_prompt, 1);
		delete this.logo_prompt;
	});

	Game.capture('show_logo', function ()
	{
		//getTime() for min logo show
		this.logo_prompt = new LogoPrompt();
		this.show(this.logo_prompt, 1);
	});

	window.addEventListener('load', function ()
	{
		//delete localStorage['token'];
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
