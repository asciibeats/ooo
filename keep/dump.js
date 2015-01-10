
//var COOLDOWN = [1, 0];
//var SUBTICKS = 24;
//var MAXSKILL = 9;
//var STATNAMES = ['insight', 'stamina', 'vision'];
//var MAPTYPES = [0, 10, 11, 12];
//var POW2 = [1, 2, 4, 8];

//randomize (only some?) research: ingredients change

//gather item effects (tile/char)
//gather card effects (tile/char)
//armor +=
//health +=
//damage +=

//apply effects to chars/tiles
//health = health - ooo.pos(damage - armor)
//health = health + apple??

//costs is a function on effects[char_id]
////before diff,multi,func

//letter of ownership: "garantees" ownership by some laws (cost per argv(item?card?))
//murals law: ownership is private; zuwiederhandlung resultiert in func
//sarg vergraben: effect: terrain to darkness (cost: item type sarg + körper)

//spielidee basierend auf ftl universum karte aber in rasterform//auch verfolgt von irgendwas

var ITEMS = [];
ITEMS[0] = {title: 'World', group: 0, obscurity: 0, visibility: 0};
ITEMS[1] = {title: 'Grass', group: 0, obscurity: 1, visibility: 0};
ITEMS[2] = {title: 'Forest', group: 0, obscurity: 1, visibility: 0};
ITEMS[3] = {title: 'Campfire', group: 0, obscurity: 1, visibility: 1};
ITEMS[4] = {title: 'Fishmonster', group: 1, obscurity: 2, visibility: 1};
ITEMS[9] = {title: 'Hero', group: 1, obscurity: 5, visibility: 1};
ITEMS[5] = {title: 'Basket', group: 2, obscurity: 3, visibility: 1};
ITEMS[6] = {title: 'Apple', group: 2, obscurity: 1, visibility: 1};
ITEMS[7] = {title: 'Tree', group: 2, obscurity: 9, visibility: 0};
ITEMS[8] = {title: 'Ring', group: 2, obscurity: 9, visibility: 1};
ITEMS[10] = {title: 'Spawn', group: 3, obscurity: 1, visibility: 1};
ITEMS[11] = {title: 'Build', group: 4, obscurity: 1, visibility: 1};
ITEMS[12] = {title: 'Step', group: 5, obscurity: 1, visibility: 1};

//action over time
var EFFECTS = [];
EFFECTS[0] = {};
EFFECTS[0].title = 'Fire';
EFFECTS[0].obscurity = 1;
EFFECTS[0].visibility = 1;
EFFECTS[0].update = {};
//effect on terrain(group 0)
EFFECTS[0].update[0] = function ()
{
}

var CHARS = [];
CHARS[0] = {};
CHARS[0].title = 'Tilla';
CHARS[0].obscurity = 1;
CHARS[0].visibility = 1;
CHARS[0].stats = [1, 1, 1];
//CHARS[0].history = {};
/*CHARS[0].effects = {};
//effect on terrain(group 0)
CHARS[0].effects[0] = function ()
{
}*/

var TILES = [];
TILES[0] = {};
TILES[0].title = 'Grass';
TILES[0].obscurity = 1;
TILES[0].visibility = 1;
TILES[0].stats = [1, 3, 5];
/*TILES[0].effects = {};
//effect on terrain(group 0)
TILES[0].effects[0] = function ()
{
}*/

var DURATION = [1,1,1,1,1,3,1,1,1];

var CARDS = [];
CARDS[0] = {};
CARDS[0].title = 'Build House';
//CARDS[0].group = 4;//Actions(only ones with effect functions?)
CARDS[0].obscurity = 1;
CARDS[0].visibility = 1;
CARDS[0].duration = 3;
CARDS[0].routine = 3;
CARDS[0].main = function ()
{
	//this = world
}

CARDS[0].effects = {};
//effect on terrain(group 0)
CARDS[0].effects[0] = function ()
{
	//this = info.state
	if ((this.ready != 0) || (this.build != 0))
	{
		//wenn verheriges gebäude nocht nicht fertig ist
		//oder gebäude net passt (schon gebäude steht)
		throw ACTION_NOT_PERMITTED_ERROR;
	}

	if (this.ready)
	{
		//if already in build process progress one step
		this.ready--;
	}
	else
	{
		//init build process
		this.build = 1;
		this.ready = 3;
	}
}

//routine levels for endless actions!!! after x rounds +1 wood gathering!?

/*var GROUPS = [];
GROUPS[0] = 'Terrain';
GROUPS[1] = 'Spawns';
GROUPS[2] = 'Characters';
GROUPS[3] = 'Items';
GROUPS[4] = 'Events';*/

STATE_KEYS = [];
STATE_KEYS[0] = ['building'];
STATE_KEYS[1] = [];
STATE_KEYS[2] = ['insight', 'stamina', 'vision', 'health', 'armor'];
STATE_KEYS[3] = [];
STATE_KEYS[4] = [];

STATE_FUNC = [];

//Terrain
STATE_FUNC[0] = function (building)
{
	this.building = building || 0;
}

//Spawns
STATE_FUNC[1] = function ()
{
}

//Characters
STATE_FUNC[2] = function (insight, stamina, vision, health, armor)
{
	this.insight = insight;
	this.stamina = stamina;
	this.vision = vision;
	this.health = health;
	this.armor = armor;
}

//Items
STATE_FUNC[3] = function ()
{
}

//Events
STATE_FUNC[4] = function ()
{
}

//char.state
function examine_old (info, insight)//////immer schon den nächsten sehen (remove visibility!!)
{
	var item = ITEMS[info.type];
	insight -= item.obscurity;

	if (insight >= 0)
	{
		for (var id in info.children)
		{
			var child = info.children[id];
			var item = ITEMS[child.type];

			if (this.info[id])
			{
				if (insight > this.info[id][1])
				{
					this.info[id][1] = insight;
				}
			}
			else
			{
				this.info[id] = [child.type, insight, child.argv, []];
			}

			this.info[info.id][3].push(id);
			examine.call(this, child, insight);
		}
	}
}

var ACTIONS = {};

//examine
ACTIONS[0] = function (id)
{
	console.log('%s (%d): examine %d', this.name, this.info.id, id);
	var world = this.home.map;
	var info = world.info[id];
	examine.call(this.state, info, this.state.stats.insight);
}

//spawn
ACTIONS[1] = function (id, info)
{
	console.log('%s (%d): spawn %d %s', this.name, this.info.id, id, JSON.stringify(info));
	var world = this.home.map;
	world.spawn(info, id);
}

//transfer
ACTIONS[2] = function (id, target)
{
	console.log('%s (%d): transfer %d >> %d', this.name, this.info.id, id, target);
	var world = this.home.map;
	var info = world.info[id];
	var parent = world.info[target];
	delete info.parent.children[id];
	parent.children[id] = info;
	info.parent = parent;
}

//process
ACTIONS[3] = function (id, type)
{
	console.log('%s (%d): process %d >> %d', this.name, this.info.id, id, type);
	var world = this.home.map;
	var info = world.info[id];
	info.type = type;
}

//gather
ACTIONS[4] = function (id)
{
	//spawn copy in inventory
	//tranform id back to origin
	console.log('%s (%d): gather %d', this.name, this.info.id, id);
	var world = this.home.map;
	var info = world.info[id];
	info.type = BASETYPES[info.type];
}

ACTIONS[11] = {};

//Terrain
ACTIONS[11][0] = function ()
{
	console.log('BUILD %s %s', JSON.stringify(this), Array.prototype.slice.call(arguments));
	this.building = 7;
}
	return;

	//null state per info (derive from group default?)
	////erst init wenn == undefined
	//var events = {};
	//tiles auf state

	//chars auf state
	//items auf state
	//cards auf state

	//info = func(info, state)

	//chars gather info (paths)
	return;

	//for all chars.items
	///////modify base infos

	//for all chars.actions
	///////





	//var states = {};
	var effects = {};

	//0) load char-states
	/*for (var id in this.chars)
	{
		//var char = this.chars[id];
		states[id] = {};
		//state.id = char.info.id;
		//state.items = char.info.children;
		//states[id].stats = ooo.clone(char.stats);
		//state.tile = char.home;
		states[id].info = {};
	}*/

	//1) gather (& mark) effects
	for (var id in this.chars)
	{
		var char = this.chars[id];

		for (var target in char.actions)
		{
			var actions = char.actions[target];
			var action = actions.stack[actions.tick];
			var card = CARDS[action.type];
			card.main.apply(this.world, action.argv);

			for (var i = 0; i < action.ids.length; i++)
			{
				var info = this.world.info[action.ids[i]];
				var item = ITEMS[info.type];

				if (!effects[info.id])
				{
					effects[info.id] = ooo.clone(info.state);
				}

				card.effects[item.group].apply(effects[info.id], action.argv);
			}

			if (actions.time == DURATION[action.type])
			{
				actions.time = 0;
				actions.tick = (actions.tick + 1) % actions.stack.length;
				this.world.erase(actions.info);
				var action = actions.stack[actions.tick];
				actions.info = this.world.spawn([action.type, action.argv, []], action.ids);
			}
			else
			{
				actions.time++;
			}
		}
	}

	//2) apply effects (to chars & tiles)
	for (var id in effects)
	{
		var info = this.world.info[id];

		/*for (var id in effects[target])
		{
		}*/
	}

	//3) examine patharea (gather paths & effects & other info)
	for (var id in this.chars)
	{
		var char = this.chars[id];
		var state = states[id];

		for (var i in char.steps)
		{
			var tile = char.steps[i];
			var area = this.world.findArea(tile, state.stats.vision, function (data) { return 1 });
			//var area = this.world.findArea(state.tile, state.stats.vision, function (data) { return ITEMS[data.info.type].obscurity });

			for (var j in area)
			{
				var info = this.world.info[j];
				state.info[j] = [info.type, state.stats.insight, [], []];
				examine.call(state, info, state.stats.insight);
				//ACTIONS[0].call(char, id);//examine
			}
		}
	}

	//4) return area & effects info and save char-states
	for (var id in this.chars)
	{
		var char = this.chars[id];
		//var realm = this.realms[char.seat];
		var state = states[id];
		char.realm.info[this.time][char.info.id] = state.info;
		char.realm.chars[char.info.id][1] = [state.stats.insight, state.stats.stamina, state.stats.vision];
		char.realm.chars[char.info.id][2] = stack_info(char.info);
	}

	//sort encounters by step-time (earliest first)
	this.time++;
	return;
	this.tocks = 0;

	for (var time = 0; time < SUBTICKS; time++)
	{
		console.log('TIME %d', time);
		var steps = {};

		//collect actions
		for (var id in this.chars)
		{
			var char = this.chars[id];

			if (!char.state)
			{
				if (char.wake == time)
				{
					var state = {};
					state.id = char.info.id;
					state.items = char.info.children;
					state.stats = ooo.clone(char.stats);
					state.tile = char.home;
					state.info = {};

					char.state = state;
					char.step = 0;
					char.info.parent = char.home.data.info;
					char.info.parent.children[char.info.id] = char.info;
				}
				else
				{
					continue;
				}
			}

			if (!steps[char.state.tile.i])
			{
				steps[char.state.tile.i] = [];
			}

			steps[char.state.tile.i].push(char);
		}

		//move onto tile
		for (var i in steps)
		{
			for (var j = 0; j < steps[i].length; j++)
			{
				var char = steps[i][j];
				var step = char.steps[char.step];

				//move if direction is given
				if (step[1] != undefined)
				{
					this.world.move(char, step[1]);
				}
			}
		}

		//trigger events
		for (var i = 0; i < this.world.events[time]; i++)
		{
			var event = this.world.events[time][i];
			ACTIONS[event[1]].apply(event[0], event[2]);
		}

		//check out the area
		for (var i in steps)
		{
			for (var j = 0; j < steps[i].length; j++)
			{
				var char = steps[i][j];
				var step = char.steps[char.step];
				var state = char.state;
				var area = this.world.findArea(state.tile, state.stats.vision, function (data) { return 1 });
				//var area = this.world.findArea(state.tile, state.stats.vision, function (data) { return ITEMS[data.info.type].obscurity });

				for (var id in area)
				{
					var info = this.world.info[id];
					state.info[id] = [info.type, char.stats.insight, []];
					ACTIONS[0].call(char, id);
				}
			}
		}

		//apply actions
		for (var i in steps)
		{
			//sort actions[i]? how?

			for (var j = 0; j < steps[i].length; j++)
			{
				var char = steps[i][j];
				var step = char.steps[char.step];
				var state = char.state;

				//execute actions and accumulate effects
				for (var k = 0; k < step[0].length; k++)
				{
					ACTIONS[step[0][k][0]].apply(char, step[0][k][1]);
				}

				char.step++;
			}
		}

		//remember info
		for (var i in steps)
		{
			for (var j = 0; j < steps[i].length; j++)
			{
				var char = steps[i][j];
				var realm = char.realm;//this.realms[char.seat];
				
				if (!realm.info[this.time][time])
				{
					realm.info[this.time][time] = {};
				}
				
				realm.info[this.time][time][char.info.id] = char.state.info;
				char.state.info = {};

				if (char.step == char.steps.length)
				{
					realm.chars[char.info.id][1] = [char.stats.insight, char.stats.stamina, char.stats.vision];
					realm.chars[char.info.id][2] = stack_info(char.info);
					delete char.info.parent.children[char.info.id];
					delete char.info.parent;
					delete char.step;
					delete char.state;
				}
			}
		}
	}

	this.time++;

function stack_info (info)
{
	var stack = [info.type, []];

	for (var id in info.children)
	{
		var child = info.children[id];
		stack[1].push(stack_info(child));
	}

	return stack;
}
	//event grundrauschen? damit man nicht genau wissen kann ob ein event von einem mitspieler getriggert wurde
	///oder reicht es wenn mehrere mitspieler dabei sind und man sich etwas geschickt anstellen muss?
	////event beispiel: du siehst eine attraktive frau und bist abgelenkt. -x insight for next y steps

	//take chars of the board when you want but cooldown or spawncost?????
	//mark the changes!!!! diffs between times

	//NEXT char items array for inventory
	////inventory generalisieren? sind die wirklich gleich? NEIN charinv hat equip (siloutte) (für char inv und tile inv)
	////spawn char + task + action (build)

	///OPTIONS(TABS)
	/////default: itemtypes; spawnpoints; other chars;
	/////charinfo: stats; inventory(char);
	/////tileinfo: inventory(tile); spawnslots; other/my chars;

	//Overwatch (XCOM) like mechanic (trigger autoresponse)
	//Competitive/Tournament/Ladder mode (max 45min games) (1v1;2v2 etc symmetric maps)

	//vision entfernen!!! pathfinding nur mit costs!!! low energy char hat kleineres areal!!!!

	//build singleplayer scenarios/puzzles like: assassinate the king in x turns

	////////////////// SIDE_OVERVIEW
	var ItemTypes = oui.Menu.extend(function (data)
	{
		oui.Menu.call(this, 64, 64, 'items', {left: 10, right: 10, top: 10, bottom: 84}, true, OUI_BOTTOM | OUI_REVERSED);
		this.data = data;
		this.reset();
	});

	ItemTypes.method('drawButton', function (time, context, option, picked)
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

	ItemTypes.method('reset', function ()
	{
		this.options = [];
		this.picked = {};

		for (var type in this.data.info.by_type[3])
		{
			this.options.push(parseInt(type));
		}

		return this;
	});

	ItemTypes.on('pick:item', function (option, i)
	{
		console.log('ITEM_TYPE', option);
	});

	var Overview = ooo.Scene.extend(function (game, data)
	{
		ooo.Scene.call(this);
		this.options = new oui.Menu(64, 64, 'buttons', {left: 10, right: 10, height: 64, bottom: 10}, false, OUI_BOTTOM).reset([0,0,0,4]);
		this.itemtypes = new ItemTypes(data);
		this.show(new ooo.Box('#c02515'));
		this.show(this.options, 1);
		this.upfront = this.itemtypes;
		this.show(this.upfront, 1);
	});

	////////////////// SIDE_TILEINFO
	var ItemPool = oui.Menu.extend(function (asset, layout, style)
	{
		oui.Menu.call(this, asset, layout, style);
	});

	ItemPool.method('drawButton', function (time, context, data, pick)
	{
		var type = ITEMTILES[data.type];
		context.drawImage(this.image, this.image.tile_x[type], this.image.tile_y[type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	ItemPool.on('update:focus_tile', function (tile)
	{
		this.data = [];
		this.pick = {};

		for (var id in tile.data.groups[3])
		{
			var info = tile.data.groups[3][id];
			this.data.push(info);
		}
	});

	ItemPool.on('pick:item', function (data, i)
	{
		console.log('ITEM_ID', data.id);
	});

	//SPAWN where(tile)->which(slot)->what(info)->ACCEPT

	var SpawnSlots = oui.Menu.extend(function (asset, layout, style)
	{
		oui.Menu.call(this, asset, layout, style);
	});

	SpawnSlots.on('update:focus_tile', function (tile)
	{
		this.focus_tile = tile;
		this.data = [];

		for (var i = 0; i < SPAWNSLOTS[tile.data.info.type]; i++)
		{
			if (tile.data.slots[i])
			{
				this.data.push(0);
			}
			else
			{
				this.data.push(1);
			}
		}
	});

	SpawnSlots.method('drawButton', function (time, context, data, picked)
	{
		var type = data;
		context.drawImage(this.image, this.image.tile_x[type], this.image.tile_y[type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	SpawnSlots.on('pick:item', function (data, index)
	{
		if (data != 0)
		{
			var argv = JSON.parse(prompt('Char?:', JSON.stringify([9, [5, 8, 2, 10, 0], [[6, [], []]]])));

			if (argv)
			{
				var tile_i = this.focus_tile.i;
				var spawns = this.root.data.turn.spawns;
				ooo.add(argv, spawns, tile_i);
				this.root.updatez(spawns, 'turn', 'spawns');
			}
		}
	});

	////////////////// SIDE_CHARINFO
	var Inventory = oui.Menu.extend(function (asset, layout, style)
	{
		oui.Menu.call(this, asset, layout, style);
	});

	Inventory.method('drawButton', function (time, context, data, pick)
	{
		var type = ITEMTILES[data.type];
		context.drawImage(this.image, this.image.tile_x[type], this.image.tile_y[type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	Inventory.on('pick:item', function (data, i)
	{
		console.log('ITEM_ID', data.id);
	});

	Inventory.on('update:focus_char', function (data)
	{
		this.data = [];

		for (var id in data.groups[3])
		{
			this.data.push(data.groups[3][id]);
		}
	});

	var CharSheet = ooo.Box.extend(function (color, layout)
	{
		ooo.Box.call(this, color, layout);
	});

	CharSheet.on('input:click', function ()
	{
		var char = this.root.data.focus.char;
		var path = JSON.parse(prompt('Path?:', JSON.stringify(char.path)));

		if (path)
		{
			var paths = this.root.data.turn.paths;
			ooo.add(path, paths, char.id);
			this.root.updatez(paths, 'turn', 'paths');
			//this.root.updatez(path, 'turn', 'paths', char.id);//implement event type wildcard or sth "on('update:turn_path*' ..."
		}

		return false;
	});

	var PickAction = ooo.Box.extend(function (color, layout)
	{
		ooo.Box.call(this, color, layout);
	});

	PickAction.on('input:click', function ()
	{
		var action = JSON.parse(prompt('Action?:', JSON.stringify([[], [11, [], []]])));//path;type;param(could be targets,extra card+param, ...)

		if (action)
		{
			var char = this.root.data.focus.char;
			var tile = this.root.data.focus.tile;
			var actions = this.root.data.turn.actions;
			ooo.push(action, actions, char.id, tile.i);
			this.root.updatez(actions, 'turn', 'actions');
		}

		return false;
	});

	////////////////////////////////////////////////////////////////
		/*this.marks = {};
		this.marks.steps = {};
		this.marks.steps.focus = {};
		this.marks.steps.owner = {};
		this.marks.steps.other = {};*/


	//World
	/*function mark_path (marks, id, shift)
	{
		for (var i in this.char_steps[id])
		{
			var tile = this.char_steps[id][i];

			if (marks[i] == undefined)
			{
				marks[i] = shift;
			}

			for (var j = 0; j < tile.steps.length; j++)
			{
				var next = tile.steps[j];

				if (next.i in this.char_steps[id])
				{
					marks[i] |= POW2[j];
				}
			}
		}
	}

	//World
	function mark_paths (char)
	{
		this.marks.steps = {};
		this.marks.steps.focus = {};
		this.marks.steps.owner = {};
		this.marks.steps.other = {};

		for (var id in this.char_steps)
		{
			if (char.id == id)
			{
				mark_path.call(this, this.marks.steps.focus, id, 0);
			}
			else if (id in this.root.data.chars)
			{
				mark_path.call(this, this.marks.steps.owner, id, 16);
			}
			else
			{
				mark_path.call(this, this.marks.steps.other, id, 32);
			}
		}
	}*/
		/*if (tile.i in this.focus_hero.parents)
		{
			context.globalAlpha = 0.4;
			context.fillStyle = '#f44';
			context.fillRect(0, 0, 64, 64);
		}*/

		/*var image = this.root.images['path'];
		var other = this.marks.steps.other[tile.i];
		var owner = this.marks.steps.owner[tile.i];
		var focus = this.marks.steps.focus[tile.i];

		if (other != undefined)
		{
			context.drawImage(image, image.tile_x[other], image.tile_y[other], image.tile_w, image.tile_h, 0, 0, image.tile_w, image.tile_h);
		}

		if (owner != undefined)
		{
			context.drawImage(image, image.tile_x[owner], image.tile_y[owner], image.tile_w, image.tile_h, 0, 0, image.tile_w, image.tile_h);
		}

		if (focus != undefined)
		{
			context.drawImage(image, image.tile_x[focus], image.tile_y[focus], image.tile_w, image.tile_h, 0, 0, image.tile_w, image.tile_h);
		}

		if (this.focus_tile && this.focus_tile.i == tile.i)
		{
			context.globalAlpha = 0.3;
			context.fillStyle = '#fff';
			context.fillRect(0, 0, 64, 64);
		}*/

			if (!this.cards[tile_i])
			{
				var stack = {};
				stack.time = 0;
				stack.cards = [card];
			}
			else
			{
				ooo.push(card, this.cards, tile_i, char_id, 'stack');
			}

			for (var i = 0; i < turn.cards[char_id][tile_i].length; i++)
			{
				/*return;

				if (!char.actions[target])
				{
					//parent depends on ids (affected info)
					var info = this.world.spawn([action.type, action.argv, []], action.ids);
					char.actions[target] = {stack: [], time: 0, tick: 0, info: info};
				}

				var actions = char.actions[target];
				actions.stack.push(action);*/
			}

	//update existing chars
	/*for (var id in update)
	{
		if (!realm.chars[id])
		{
			throw 'not your char';
		}
		else if (update[id])
		{
			var argv = update[id];
			this.chars[id] = chars[id];
			realm.chars[char.info.id] = argv;
		}
		else
		{
			delete this.chars[id];
		}
	}*/

	//update info
	/*for (var id in realm.chars)
	{
		var char = this.chars[id];
		var tile = this.world.index[char.home];
		ooo.add(POW2[char.steps[i]], steps, tile.i, char.info.id);

		for (var i = 1; i < char.steps.length; i++)
		{
			tile = tile.steps[char.steps[i - 1]];
			ooo.add(POW2[(char.steps[i - 1] + 2) % 2] | POW2[char.steps[i]], steps, tile.i, char.info.id);
		}
	}*/

//home, path, task
//spawn hero with footsteps that have hero as child!!!!!

//Game
/*function change_path (realm, id, path)
{
	if (!(id in realm.chars))
	{
		throw 'not your char';
	}

	var argv = realm.chars[id];
	var tile = this.world.index[argv[0]];
	var char = this.chars[id];
	char.time = 0;
	char.actions = [];
	char.steps = [tile];
	var parents = [tile.i];

	for (var i = 0; i < path.length; i++)
	{
		tile = tile.steps[path[i]];
		char.steps.push(tile);
		parents.push(tile.i);
	}

	this.world.relink(id, parents);
	argv[4] = path;
}*/

//carddecks + draws
//geld um karten zu kaufen? (nur für items?)
//krönen für besondere karten?
//progression durch hinzufügen von kronenkarten
//kronenkarten bilden ein weltdeck

//items und cards/consumables, spawns, tiles, chars, familiars?

//kein extra char array beim übertragen?
//realm array???

//action -> tilestats + charstats


//erst alle effekte auf infos sammeln

//dann per gruppe/korellation auswerten

//zwei arten von interaktionen mit anderen chars: disrupting (normal task will not be executed until resolved) and ignorable

//erst tilefuncs für path (oder am ende? jaaa!!!)
//erst stat addition dann mult dann funcs

//spawns & cards

//spawn, cost(add steps),diff,mult,specialfunc,path+update

//kollisionen auflösen durch suqeunz von vergleichen: macht (asdf, + strength)

//function für collect & resolve
function add_card (origin, target, type)//, stats_diff, stats_mult
{
	//possibly spawn event info if type has event_spawn_func
	////adds 

	if (!events[target])
	{
		events[target] = DEFAULT_STATS;//func(info.stats, group.stats, main.stats)
	}
}

function exec_effects (events, origin, target, type)//, stats_diff, stats_mult
{
	if (!events[target])
	{
		events[target] = func(info.stats, group.stats, main.stats);
	}
}

//Game
function tick ()
{
	//remove obsolete info
	if (var decay = this.decay.shift())
	{
		for (var i = 0; i < decay.length; i++)
		{
			var info = decay[i];
			this.world.erase(info);
		}
	}

	//subtract cost and create path
	for (var tile_i in actions)
	{
		var tile = this.world.index[tile_i];

		for (var char_id in actions[tile_i])
		{
			var char = this.chars[char_id];

			for (var i = 0; i < actions[tile_i][char_id].length; i++)
			{
				var action = actions[tile_i][char_id][i];
				char.state.ap -= info[action.type].cost;

				//create footprint & mark sightings along path (direction-bit-marks)

				//spawn info
			}
		}
	}

	//collect diffs, mults and specials
	for (all current actions)
	{
		diffs[info_id] += diff;
		mults[info_id] += diff;
		//specials
	}

	for (all chars)
	{
		//update info along pathmask
	}

	//check out the area
	for (var i in steps)
	{
		for (var j = 0; j < steps[i].length; j++)
		{
			var char = steps[i][j];
			var step = char.steps[char.step];
			var state = char.state;
			var area = this.world.findArea(state.tile, state.stats.vision, function (data) { return 1 });
			//var area = this.world.findArea(state.tile, state.stats.vision, function (data) { return ITEMS[data.info.type].obscurity });

			for (var id in area)
			{
				var info = this.world.info[id];
				state.info[id] = [info.type, char.stats.insight, []];
				ACTIONS[0].call(char, id);
			}
		}
	}
}

//Game
function progress (actions)
{
	//3. diff
	//4. mult
	//5. special
}

function update (chars)
{
	//6. path
}
