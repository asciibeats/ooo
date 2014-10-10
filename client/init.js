'use strict';
////dreams depend on items&skills&node wichtig ist daß man wissen kann was kommen wird
//erst alle looks dann anderes? usw?
//home.items.chest.push();
//traum deuten/trigger one time events

//CHOOSE ABORT CONDITION FOR EVERY CHAR!!!!

(function ()
{
	var COOLDOWN = [1, 0];
	var SUBTICKS = 100;
	var STATNAMES = ['stamina', 'health'];

	var ACTIONS = {};

	ACTIONS[0] = function (direction)
	{
		this.tile.type++;
		this.tile = this.tile.steps[direction];
	}

	ACTIONS[1] = function (duration)
	{
		this.cooldown += duration;
	}

	ACTIONS['look'] = function (world, path)
	{
		var worldnode = this.worldnode;
		var charnode = this.charnode;

		for (var i = 0; i < path.length; i++)
		{
			node = node[1][path[i]];
		}

		var news = look(node, this.awareness);
		show([0, news], '0');
	}

	ACTIONS['pick'] = function (entity)
	{
		//update knowledge
		return 1;
	}

	ACTIONS['use'] = function (entity)
	{
		Array.prototype.shift.call(arguments);
		USES[entity.name].apply(this, arguments);
		//update knowledge
		return 1;
	}

	ACTIONS['equip'] = function (entity)
	{
		Array.prototype.shift.call(arguments);
		USES[entity.name].apply(this, arguments);
		//update knowledge
		return 1;
	}

	function move ()
	{
		char.tile.type = 1;
		char.tile = char.tile.steps[direction];
		char.tile.type = 2;
	}

	//ITEMS
	var ITEMS = [];
	ITEMS[0] = {name: 'World', description: '', type: 1, obscurity: 0, visibility: 0};//eatable,wearable,
	ITEMS[1] = {name: 'Grass', description: 'Just grass...', type: 1, obscurity: 1, visibility: 0};//eatable,wearable,
	ITEMS[5] = {name: 'Basket', description: 'Delicious green apple', type: 1, obscurity: 2, visibility: 1};
	ITEMS[6] = {name: 'Apple', description: 'Delicious green apple', type: 1, obscurity: 9, visibility: 2};
	ITEMS[8] = {name: 'Ring', description: 'Delicious green apple', type: 1, obscurity: 9, visibility: 12};
	ITEMS[7] = {name: 'Tree', description: 'Maple tree', type: 1, obscurity: 9, visibility: 0};

	/*/TREE//body&world
	var entity = {, content: [], links: []};

	//item effects
	var EFFECTS = [];

	EFFECTS[0] = {};

	EFFECTS[0]['equip'] = function ()
	{
	}

	EFFECTS[0]['unequip'] = function ()
	{
	}

	var ITEMS = [];

	ITEMS['head'] = [];*/

	function show (node, prefix)
	{
		console.log(prefix + ' ' + ITEMS[node[0]].name);

		for (var i = 0; i < node[1].length; i++)
		{
			show(node[1][i], prefix + '>' + i);
		}
	}

	function transfer (worldnode, charnode, awareness)
	{
		awareness -= ITEMS[worldnode[0]].obscurity;

		if (awareness >= 0)
		{
			for (var i = 0; i < worldnode[1].length; i++)
			{
				var type = worldnode[1][i][0];
				var item = ITEMS[type];

				if (item.visibility <= awareness)
				{
					charnode[1][i] = [type, []];
					look(worldnode[1][i], charnode[1][i], awareness - item.visibility);
				}
			}
		}
	}

	function look (node, awareness)
	{
		awareness -= ITEMS[node[0]].obscurity;
		var news = [];

		if (awareness >= 0)
		{
			for (var i = 0; i < node[1].length; i++)
			{
				var type = node[1][i][0];
				var subitem = ITEMS[type];

				if (subitem.visibility <= awareness)
				{
					news.push([type, look(node[1][i], awareness - subitem.visibility)]);
				}
			}
		}

		return news;
	}

	var Tree = function ()
	{
	}

	var Char = function (id, name, stats, tile, wake, actions)
	{
		this.id = id;
		this.name = name;
		this.stats = stats;
		this.tile = tile;
		this.wake = wake;
		this.actions = actions;
		this.asleep = true;
	}

	Char.prototype.init = function ()
	{
		this.state = {};
		this.state.name = this.name;
		this.state.stats = oO.clone(this.stats);
		this.state.tile = this.tile;
		this.step = 0;
		this.cooldown = COOLDOWN[this.actions[0][0]];
		this.asleep = false;
	}

	Char.prototype.resolve = function ()
	{
		this.asleep = true;
	}

	var World = oO.TileMap.extend(function (reality, size, tile_w, tile_h, type, layout)
	{
		oO.TileMap.call(this, size, tile_w, tile_h, type, layout);
		this.reality = reality;
		this.date = 0;
		this.chars = [];
		//doors and walls only between tiles!!!!!
		/*
		   [[type, [[type, children[]]]]]
		*/

		//start mit lagerfeuer und stockpile
		//plan day of char before spawn (has to have continuum!)

		//reden (halten) leute werden beinflusst. textbausteine mir wirkung

		//on detection certain action fixed to unit
		//this.knowledge = [[],[],[]];//chars[time[places, people[[name, orders, health, skills, items]]//wissen aus sicht aller eigener chars
		//this.time = 0;
		//time relativ zu jetzt=0
		//'a few days ago'->'a few'(2-10)'some'(2-30)'days'(24*60ticks)'ago'(*-1)'from now'(*1)'noon''midnight'etc//zukunft negativ? oder vergangenheit? t-x?
		//set/get functions in knowledge tree->'a few days ago' mapping to times +/-? 2->9*24*60
		//verfallsdauer bei krassen ereignissen größer gegenüber alltäglichem
		//make a case!: gather related realitys(or generate relations)

		//example:you find a bloody deggar; you investigate via knowtree and find a strange engraving some language you dont understand
		//'String' entries for names and items and actions

		//when making a case you convert generic item names to custom titles (dagger->'bloody Dagger')
		//making a case/connect dots!!!!!!
		//dagger > (inspect)bloody dagger > (inspect)dagger.blood > dagger.blood.fresh (fresh->0-15min) ODER dagger.blood.age
		//die autogenerierte sprache darf nicht zu konsistent sein in der wortwahl aber formal absolut! damit man sich auch in gesprächen nicht sofort als spieler entlarvt aber mal den von mir gewählten formalien folgt :D
		//rezepte werden über spiele hinweg gespeichert oder semirandom (jedes spiel anders!!!aber gleiche kocharten)???
		//father/mother/siblings links in tree!
		//close a case? mark some kind of result??

		//spiele sind wiederentdeckte geschichten aus büchern die erzählt werden
		//mark reality as original truth if unchanged since spawn (mit ring of truth erkennen ob reality original true ist)
		//reality hat step counter (how many intermediaries to original reality/reality creation)
		//stepcounter hoch -> wahrscheinlicher daß char nichts mit der erschaffung der nachricht/evtl lüge zu tun hat und einfach nur sagt was er weiss
		//stepcounter nur vom server sichtbar?
		//"seiten" des buches entstehen indirekt
		//orakel,prophet,haben elemente die zukünftige seiten des buches sehen können

		//einziger startaspekt ist der verteilung der chars an lagerfeuern
		//WHEN YOU DIE YOU LOOSE ALL YOUR KNOWLEDGE (take care before you die that your power goes over to on of your own chars)(not written down) items can maybe reclaimed by last will oder just taking or etc)
		//there is no item owner//its yours if its under your control

		//folklore/history system
		//enthält algor zur mapgenerierung
		//ahnenforschung

		//event wenn sich wissen verändert (gegenüber vorheriger minute)
		//keine doppelten namen!!!

		//in gesprächen themen beschränken können -> reality knoten bestimmen -> darüberhinaus schweigen
		//gut für geheimhaltung

		//kein naturlicher tod? wäre das nur lästig?ist aber wichtig für erbfoldesystem... streit?:)
		//genpool node?

		//:) wenn man jemandes asche inne rakete pack mit anderen zutaten kann man die gene irgendwie transformieren sodass sie die zukunft beeinflussen können
		//mit samen vergraben :)
		//in "normales grab"
		//in gruft
		//irgendwo
		//leichen verschwinden nicht einfach!!!!
		//seuchen entstehen!!!!!hoher anreiz leichen zu entsorgen

		//awareness levels (default 0)
		//man bekommt alles mit daß awerness/peculiarity/noticability<=char.awareness
		//es gibt kein ereignis mit noticeability=0
		//raise default level with predetermined charskills
		//char personality skills are just fixed cards/actions
		//char personality action use free? or always on (or both? manche kosten manche always on))
		//movement is also controlled by cards? autorepeat if no other card

		//char[tiles[visibilitytree],people[name],quests];//(quest ist gedanke/notiz/fall/order?)
		//look[here,north,south,east,west]
		//realityrmationen nicht
	});

	World.method('spawn', function (char_data)//wake modifies charstats (nachts sneeky etc)//only full hours?
	{
		var id = this.chars.length;
		this.chars[id] = new Char(id, char_data[0], oO.map(STATNAMES, char_data[1]), this.index[char_data[2]], char_data[3], char_data[4]);
	});

	World.method('put', function (path, type)
	{
		var node = this.reality;

		for (var i = 0; i < path.length; i++)
		{
			node = node[1][path[i]];
		}

		node[1].push([type, []]);
	});

	//EFFECTS[]
	////viral,radius

	//connect savespots!!
	////savespots finalize round and give progress for player in some way (xp/items...?)
	////adhoc save spot: campfire

	//howto define savespots
	//ablauf???

	World.method('tick', function ()
	{
		console.log();
		console.log('DAY ' + this.date);

		for (var time = 0; time < SUBTICKS; time++)
		{
			var actions = {};

			//collect actions
			for (var id = 0; id < this.chars.length; id++)
			{
				var char = this.chars[id];

				if (char.asleep)
				{
					if (char.wake == time)
					{
						char.init();
					}

					continue;
				}

				char.cooldown--;

				if (char.cooldown > 0)
				{
					continue;
				}

				if (!actions[char.tile.i])
				{
					actions[char.tile.i] = [];
				}

				actions[char.tile.i].push(char);
			}

			//resolve actions
			for (var i in actions)
			{
				console.log(time + ':' + i);

				for (var j = 0; j < actions[i].length; j++)
				{
					var char = actions[i][j];
					console.log(char.name);
					var action = char.actions[char.step];
					ACTIONS[action[0]].apply(char.state, action[1]);
					char.step++;

					if (char.step == char.actions.length)
					{
						char.resolve();
					}
					else
					{
						char.cooldown = COOLDOWN[char.actions[char.step][0]];
					}
				}
			}
		}

		this.date++;
	});

	var Root = oO.Root.extend(function (hook, assets, color)
	{
		oO.Root.call(this, hook, assets, color);
	});

	//use/pick/look/move/talk
	////shortcuts
	/////head->reality center

	Root.on('show', function (root, parent)
	{
		oO.Root.prototype.events.on.show.call(this, root, parent);
		var world = new World([0, []], 8, 64, 64, 'steps');//size, tile_w, tile_h, type, layout
		this.show(world);
		/*world.put([16], 5);
		world.put([16, 0], 6);
		world.put([16, 0], 6);
		world.put([16, 0], 8);*/

		world.spawn(['tilla', [5, 8], 0, 97, [[0, [2]], [0, [2]], [0, [1]], [0, [1]], [0, [1]], [0, [1]]]]);
		world.spawn(['pantra', [3, 11], 43, 10, [[0, [3]], [0, [0]], [0, [0]], [0, [0]], [0, [0]]]]);

		world.tick();
		world.tick();
		world.tick();
	});

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var assets = {};
		assets['steps'] = 'assets/steps.png';
		//var game = new Jupiter(hook, 'http://10.0.0.19:11133', assets, '#444444');
		var root = new Root(hook, assets, '#444');
	});

	/*var Jupiter = oO.Client.extend(function (hook, url, assets, color)
	{
		oO.Client.call(this, hook, url, assets, color);
	});

	Jupiter.method('init', function (size, map_s)
	{
		//oO.Client.prototype.init.call(this, size);
		this.map = new oO.TileMap(map_s, 96, 96, 'tiles');
		this.show(this.map);
		this.map.tiles[0][0].type = 1;
		this.map.tiles[1][7].type = 2;
		this.map.tiles[4][4].type = 4;
		this.map.tiles[5][4].type = 3;
	});

	Jupiter.on('start', function (time, world, seat, realm)
	{
		oO.Client.prototype.events.on.start.call(this, time, world, seat, realm);
	});*/
})();
