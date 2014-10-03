'use strict';
////dreams depend on items&skills&node wichtig ist daß man wissen kann was kommen wird
//erst alle looks dann anderes? usw?
//home.items.chest.push();
//traum deuten/trigger one time events

//CHOOSE ABORT CONDITION FOR EVERY CHAR!!!!

(function ()
{
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

	var ACTIONS = {};

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

	ACTIONS['move'] = function (direction)
	{
		this.location.type = 1;
		this.location = this.location.steps[direction];
		this.location.type = 2;
		//create knowledge around location based on awareness
		//console.log(JSON.stringify(this.location.node));
		return 1;
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

	var COOLDOWN = {move: 1, look: 1};

	var World = oO.TileMap.extend(function (info, size, tile_w, tile_h, type, layout)
	{
		oO.TileMap.call(this, size, tile_w, tile_h, type, layout);
		this.info = info;
		this.time = 0;
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
		//make a case!: gather related infos(or generate relations)

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
		//mark info as original truth if unchanged since spawn (mit ring of truth erkennen ob info original true ist)
		//info hat step counter (how many intermediaries to original info/info creation)
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

		//in gesprächen themen beschränken können -> info knoten bestimmen -> darüberhinaus schweigen
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
		//informationen nicht
	});

	World.method('focus', function (ids)
	{
		for (var i = 0; i < this.index.length; i++)
		{
			var tile = this.index[i];
			tile.type = 0;
		}

		for (var id = 0; id < ids.length; id++)
		{
			var char = this.chars[id];

			for (var i = 0; i < this.index.length; i++)
			{
				var tile = this.index[i];

				if (tile.type != 0)
				{
					continue;
				}

				if (char.info[1][i] != undefined)
				{
					tile.type = char.info[1][i][0];
				}
			}
		}
	});

	World.method('spawn', function (home, wake, name)//wake modifies charstats (nachts sneeky etc)//only full hours?
	{
		var id = this.chars.length;
		var char = {};
		char.id = id;
		char.home = home;
		char.wake = wake;
		char.name = name;
		char.sheet = {stamina: 10, health: 10, awareness: 16};
		char.actions = [];
		this.chars[id] = char;
		return id;
	});

	World.method('put', function (path, type)
	{
		var node = this.info;

		for (var i = 0; i < path.length; i++)
		{
			node = node[1][path[i]];
		}

		node[1].push([type, []]);
	});

	var SUBTICKS = 1440;

	World.method('exec', function (id, name, param)
	{
		var char = this.chars[id];
		char.actions.push([name, param]);

		if (char.step == undefined)
		{
			char.step = 0;
			char.cooldown = COOLDOWN[name];
			char.asleep = true;
		}
	});

	World.method('tick', function ()//state changes? oder bricht das spiel dann? changes? oder bricht das spiel dann? (oder verändert zuviel?)
	{
		//if you do not return you loose a day???
		//[0,1,2]//action type
		//[[],[],[]]//action args
		//[120, 3, 4]//action duration in minutes
		//INIT COPY OF INFO

		for (var id = 0; id < this.chars.length; id++)
		{
			//create initial knowledge tree
			var char = this.chars[id];
			char.state = {};

			for (var name in char.sheet)
			{
				char.state[name] = char.sheet[name];
			}
		}

		for (var time = 0; time < SUBTICKS; time++)
		{
			var collisions = [];

			//collect actions
			for (var id = 0; id < this.chars.length; id++)
			{
				var char = this.chars[id];

				if (char.asleep && (char.wakeup != time))
				{
					continue;
				}
				
				char.asleep = false;
				console.log('#' + char.id + ' ' + Math.floor(time / 60) + ':' + (time % 60));
				ACTIONS[char.actions[char.step][0]].apply(char.state, char.actions[char.step][1]);

				if (char.cooldown == 1)
				{
					char.step++;
					var action = char.actions[char.step];

					if (action)
					{
						char.cooldown = COOLDOWN[action[0]];
					}
					else
					{
						char.step = 0;
						char.cooldown = COOLDOWN[char.actions[0][0]];
						char.asleep = true;
					}
				}
				else
				{
					char.cooldown--;
				}
			}

			//resolve collisions
			for (var i = 0; i < collisions.length; i++)
			{
			}
		}

		/*/walk/one tile
		//run/two tiles
		//drive/four tiles with items(only on roads)
		//ride/four tiles

		if (action_is_movement)
		{
			//gather info depending on movement style
			//time+=movetime
			//moving = true;
			//x+=1
			//y+=1
		}
		else
		{
			//execute action
			//moving = false;
			//time+=actiontime
		}

		char.time++;
		//info(action)
		/*/
		//for all chars progress in time; execute action/change world/create info (sneak,walk,run,schlendern,talk,look,climb,jump)
		//modules??(param:knowledge,action)INFO/ITEMS/CHARS

		//INFO kümmert sich um den info tree
		//ITEMS manipulate items

		//infotypes person/item/default
		//type dertermines listing in tree
		//tiles->[people,poi->[poi]]//poi can be item

		//sehen/hören/riechen/schmecken/tasten(alles unter wahrnehmung!)

		//baum:knowledgeroot[tiles[],inventory[],quests[],people[nearby,by look,by],actions[]]
		//you can use aliases for your chars (auto gen?)
		//charbloodline choose on trait, one random all, one random parents oder so

		//for all chars: tick (move/card)//waiting is a card mit awareness+x//'nothing': awareness=0(eigentlich schlecht aber dreimal nacheinander passiert irgendwass)
		//if card
		//for all tiles: apply effects (order by charid/age, highest first) (including watch & talk actions)
		//for all chars: gather info based on awareness level and noticeability level of infos

		//god
	});

	var Root = oO.Root.extend(function (hook, assets, color)
	{
		oO.Root.call(this, hook, assets, color);
	});

	//use/pick/look/move/talk
	////shortcuts
	/////head->info center

	Root.on('show', function (root, parent)
	{
		oO.Root.prototype.events.on.show.call(this, root, parent);
		var world = new World([0, []], 8, 64, 64, 'steps');//size, tile_w, tile_h, type, layout
		this.show(world);

		world.put([16], 5);
		world.put([16, 0], 6);
		world.put([16, 0], 6);
		world.put([16, 0], 8);

		world.spawn(0, 360, 'tilla');
		world.exec(0, 'move', [2]);
		world.exec(0, 'move', [2]);
		world.exec(0, 'look', [[]]);
		//world.exec(0, 'look', [[0]]);
		world.exec(0, 'move', [1]);
		world.exec(0, 'move', [1]);

		world.spawn(3, 363, 'pantra');
		world.exec(1, 'move', [0]);
		world.exec(1, 'move', [3]);
		world.exec(1, 'move', [0]);
		world.exec(1, 'move', [3]);

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
