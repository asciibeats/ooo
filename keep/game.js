'use strict';
var Game;

(function ()
{
	var CHARS = [];//order by range!!
	CHARS[0] = {};
	//kampfsystem basierend auf range  [2][1][0] <-> [0,0][][2] ???
	////special: (überaschungs)angriff von hinten?
	//var OPTIONS = [[], [], [], [], [], [5, 1, 2]];
	//var GROUNDS = [1, 2, 1, 1, 1, 1];
	//var PCOSTS = [5, 1, 3, 5, 5, 5, 5, 1, 1, 1, 1, 1, 1];
	var SKILLS = [[5, 7], [1, 2], [3]];//skill groups????jaaaaa!!!
	var QUESTS = [[], [], [], [], [], [0,1]];
	//var TARGETS = [[0], [1], [2], [1]];//types affected by skill (skill->types oder type->skills??? warum?)
	var GROUNDS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];//types affected by skill (skill->types oder type->skills??? warum?)
	//geheimnis system (verdeckung) alle quests haben nen geheim wert: 0=für alle sichtbar die sich im selben realm befinden
	//nicht genutzte ap automatisch verwenden (wofür? research? xp? new chars? luck?)!!!//wenn man in der ersten runde nichts macht, also alle aps so umwandelt muss das irgendne auswirkung haben (muss valide strategie sein!!!!)

	//terrain
	var GRASSLAND = 1;

	//actions
	var FIREPLACE = 5;
	var LUMBERJACK = 7;

	var ACTBOARD = [];

	//board function(cost&init/one time) && realm function(cost&effect/every turn)
	ACTBOARD[FIREPLACE] = function (origin, target, path)
	{
	}

	ACTBOARD[LUMBERJACK] = function (origin, target, path)
	{
	}

	//var COSTS = [];
	//COSTS[FIREPLACE] = {1:1};

	var SubmitButton = oO.Button.clone(50, 50, 'buttons', {'off': 5, 'submit': 8, 'confirm': 9, 'add': 10}, {right: 10, width: 50, bottom: 10, height: 50});
	var ResetButton = oO.Button.clone(50, 50, 'buttons', {'off': 5, 'undo': 7, 'backup': 6}, {right: 10, width: 50, bottom: 70, height: 50});
	//var OptionsButton = oO.Button.clone(50, 50, 'buttons', [1], {left: 10, width: 50, top: 10, height: 50});
	var FullButton = oO.Button.clone(50, 50, 'buttons', {'full': 11, 'win': 12}, {left: 10, width: 50, top: 10, height: 50});
	//var WatchButton = oO.Button.clone(50, 50, 'buttons', [1], {left: 70, width: 50, top: 10, height: 50});
	var ItemMenu = oO.MultiMenu.clone(50, 50, 'chars', {left: 10, right: 70, height: 50, bottom: 70}, false, true);
	var SkillMenu = oO.MultiMenu.clone(50, 50, 'items', {left: 10, right: 70, height: 50, bottom: 10}, false, true);
	var QuestMenu = oO.SingleMenu.clone(50, 50, 'skills', {width: 50, right: 10, top: 10, bottom: 130}, true, true);
	//var NoteMenu = oO.SingleMenu.clone(50, 50, 'buttons', {left: 10, width: 50, top: 70, bottom: 130}, true, false);
	//var WatchMenu = oO.SingleMenu.clone(50, 50, 'buttons', {left: 130, right: 70, top: 10, height: 50}, false, false);

	//PORTALE!!!!! gibts umsonst! einfach zu tile.steps hinzufügen :D
	//Wie realisier ich nen Hafen? tile muss beim pathfinding irgendwie die fähigkeit aktivieren wasser zu überqueren
	//gibt keine fahrzeuge oder reittiere oder so sondern tiles die fähigkeiten beim pathfinding aktivieren (hafen(enable water), stall(-cost/tile), taverne(+ap))
	//tiles können funktionen haben die beim pathfinding/überqueren ausgeführt werden???!!!!!!!!!!!!!!!!!!!!!JAAAAAAAAAAAAAAAAAAAAA
	//um ein pferd/stall zu benutzen muss man ein heu-item dabei haben (wird verbraucht)
	//taverne/refill-ap kostet nen taler(coin)
	//hafen/schiff kostet xy?
	//manche tiles haben eigene gruppe! extraterritorial!! (militärische tiles) dient der gruppentrennung
	////wenn miltitärisches tile gesetzt wird: for each nachbar mit gleichem basetype regroup!!
	////militärische tiles haben einen besitzer/besatzer!!! alle anderen nicht
	////type -seat == besitzer ist seat???

	///stall/bank(realm spezifische taler)
	
	var BASETYPES = [0,1,2,3,4,1];

	//Board
	function regroup (tile)
	{
		if (('group' in tile) && ('i' in tile.group))
		{
			this.groups.splice(tile.group.i, 1);
			delete tile.group.i;
		}

		var group = {};
		group.type = BASETYPES[tile.type];
		group.tiles = [tile.i];
		group.borders = {};//todo
		group.steps = [];//todo
		group.i = this.groups.length;
		this.groups.push(group);
		tile.group = group;

		var open = [tile];

		do
		{
			var current = open.pop();

			for (var i = 0; i < current.steps.length; i++)
			{
				var next = current.steps[i];

				if (BASETYPES[next.type] != group.type)
				{
					/*if ('group' in next)
					{
						if (next.group.i in group.borders)
						{
							group.borders[next.group.i]++;
						}
						else
						{
							group.borders[next.group.i] = 1;
							next.group.borders[next.group] = 1;
						}
					}*/
				}
				else if (next.group != group)
				{
					next.group = group;
					group.tiles.push(next.i);
					open.push(next);
				}
			}
		}
		while (open.length > 0)
	}

	var Board = oO.HexMap.extend(function (size, types, costs)
	{
		oO.HexMap.call(this, size, 52, 52, 'tiles');
		this.groups = [];

		for (var i = 0; i < this.index.length; i++)
		{
			var tile = this.index[i];
			tile.type = types[i];
			tile.chars = [];
			tile.items = [];
		}

		for (var i = 0; i < costs.length; i++)
		{
			this.costs[i] = costs[i];
		}

		for (var i = 0; i < this.index.length; i++)
		{
			var tile = this.index[i];

			if (!('group' in tile))
			{
				regroup.call(this, tile);
			}
		}
	});

	Board.method('findTargets', function (origin, range, skills, items)
	{
		var tiles = this.findArea(origin, range);
		var targets = [];

		for (var j = 0; j < skills.length; j++)
		{
			var skill = skills[j];
			targets[skill] = [];

			for (var i = 0; i < tiles.length; i++)
			{
				var tile = this.index[tiles[i]];

				if (GROUNDS[skill] == tile.type)
				{
					targets[skill].push(tile.i);
				}
			}
		}

		return targets;
	});

	var BriefScene = oO.Scene.extend(function ()
	{
		oO.Scene.call(this, {width: 280, height: 350});
		this.info = '';
	});

	BriefScene.on('frame', function (elapsed, context)
	{
		context.fillStyle = '#666';
		context.fillRect(0, 0, this.width, this.height);
		context.fillStyle = '#ddd';
		context.font = '11px Arial';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(this.info, this.width >>> 1, this.height >>> 1);
	});

	BriefScene.method('update', function (info)
	{
		this.info = info;
	});

	//helper
	function transfer (origin, target)
	{
		var diff = [];

		for (var i = 0, j = 0; i < origin.length; i++)
		{
			if (origin[i] != target[j])
			{
				diff.push(origin[i]);
			}
			else
			{
				j++;
			}
		}

		return diff;
	}

	//helper
	function template (size)
	{
		var actions = [];

		for (var seat = 0; seat < size; seat++)
		{
			actions[seat] = [];
		}

		return actions;
	}

	//private
	///////////keine chars mehr!!
	function execute (type, origin_i, path, items)
	{
		var origin = this.board.index[origin_i];

		//walk to target and sum up costs
		var target = origin;
		var cost = 0;//todo: cost = ACTIONCOST[i] (init with actioncost)
		var steps = [];

		for (var i = 0; i < path.length; i++)
		{
			target = target.steps[path[i]];
			steps[i] = target;
			cost += this.board.costs[target.type];//todo: include items
			//ACTPATH[target.type].apply();
		}

		//subtract cost from this.realm and/or items

		//transfer chars&rest of items from origin to tile
		/*origin.chars = transfer(origin.chars, chars);
		origin.items = transfer(origin.items, items);
		target.chars = target.chars.concat(chars).sort();
		target.items = target.items.concat(items).sort();*/
		target.type = type;

		//execute skill task specific funcs on board&realm
		ACTBOARD[type].call(this.board, origin, target, steps);//modify board (beeinflusst alle)
		//////brauch ich überhaupt boardfunktionen???? was könnten die machen ausser tiletypen verändern (das kann ich auch immer hier machen)????
		//ACTREALM[type].apply(this.realm, argv);//modify realm (per player)
	}

	//private
	function tick ()
	{
		this.iface.items.hide();
		this.iface.skills.hide();
		this.iface.quests.hide();
		this.iface.reset.hide();
		this.iface.submit.hide();

		this.board.reset();
		this.board.off('pick');
		console.log(JSON.stringify(this.quests[this.time][this.seat]));
		this.submit(this.quests[this.time][this.seat]);
	}

	//private
	function plan ()
	{
		this.show(this.iface.items);
		this.show(this.iface.skills);
		this.show(this.iface.quests);
		this.show(this.iface.reset);
		this.show(this.iface.submit);

		this.iface.items.reset();
		this.iface.skills.reset();
		this.iface.quests.reset();
		this.board.reset();
		this.iface.reset.style('off');//geht nicht bevor show!!! fixme!!!
		this.iface.reset.on('click', function () {return false});
		this.iface.submit.style('submit');

		var that = this;
		var quest = [];

		console.log('SELECT AN ORIGIN OR END TURN!');

		this.iface.submit.on('click', function ()
		{
			this.style('confirm');
			console.log('CLICK AGAIN TO CONFIRM!');

			this.on('click', function ()
			{
				console.log('WAIT FOR OTHER PLAYERS!');
				tick.call(that);
				return false;
			});

			return false;
		});

		this.board.on('pick', function (origin)
		{
			that.iface.reset.style('undo');
			that.iface.submit.style('off');
			that.iface.submit.on('click', function () {return false});
			that.board.mark([origin.i], 6);

			var stats = that.stats[origin.group.i] || [[], []];
			that.iface.skills.reset(stats[2]);
			that.iface.items.reset(stats[3]);

			var quests = QUESTS[origin.type];
			that.iface.quests.reset(quests);

			//single use items!!!!apple->one more quest step!!sausage->three more quest steps!!hay->use (unlock at stables) a horse to travel further
			quest[1] = origin.i;
			quest[3] = [];//items
			var targets = that.board.findTargets(origin, stats[1], quests, quest[3]);

			that.iface.reset.on('click', function ()
			{
				plan.call(that);
				return false;
			});

			that.iface.skills.on('pick', function (type)
			{
			});

			that.iface.items.on('pick', function (types)
			{
				quest[3] = types;
				targets = that.board.findTargets(origin, stats[1], quests, types);
			});

			that.iface.quests.on('pick', function (type)
			{
				quest[0] = type;
				that.board.mark(targets[type], 6);

				console.log('SELECT A TARGET!');

				that.board.on('pick', function (target)
				{
					if ('mark' in target)
					{
						var path = that.board.findPath(origin, target);
						that.iface.submit.style('add');
						that.board.mark(path.tiles, 6);
						quest[2] = path.steps;

						console.log('CLICK OK TO ADD QUEST!');

						that.iface.submit.on('click', function ()
						{
							execute.apply(that, quest);
							that.quests[that.time][that.seat].push(quest);
							plan.call(that);
							return false;
						});
					}
				});
			});
		});
	}

	Game = oO.Scene.extend(function (rules, names, terrain)
	{
		oO.Scene.call(this);
		this.rules = rules;
		this.seats = {};

		for (var i in names)
		{
			this.seats[names[i]] = true;
		}

		this.board = new Board(rules[1], terrain, [1,2,3,4]);//rules[i]//costs
		this.show(this.board, -1);

		this.iface = {};
		this.iface.full = new FullButton();
		this.iface.reset = new ResetButton();
		this.iface.submit = new SubmitButton();
		this.iface.items = new ItemMenu();
		this.iface.skills = new SkillMenu();
		this.iface.quests = new QuestMenu();
		this.iface.brief = new BriefScene();
		this.show(this.iface.full);
		var that = this;

		this.iface.brief.on('click', function ()
		{
			this.hide();
			plan.call(that);
			return false;
		});

		this.iface.full.on('click', function ()
		{
			this.root.toggle();

			if (this.root.full)
			{
				this.style('win');
			}
			else
			{
				this.style('full');
			}

			return false;
		});
	});

	Game.method('join', function (name)
	{
		this.seats[name] = true;
	});

	Game.method('leave', function (name)
	{
		delete this.seats[name];
	});

	Game.method('start', function (time, seat, realm, submit)
	{
		this.time = time;
		this.seat = seat;
		this.realm = realm;
		this.submit = submit;
		this.stats = realm[0];
		this.quests = realm[1];

		for (time = 0; time < this.quests.length; time++)
		{
			var quests = this.quests[time];

			for (var seat = 0; seat < quests.length; seat++)
			{
				for (var i = 0; i < quests[seat].length; i++)
				{
					execute.apply(this, quests[seat][i]);
				}
			}
		}

		if (time == 0)
		{
			console.log('CHOOSE YOUR STARTING POS!');
			var group_i = Object.keys(this.stats)[0];
			this.board.mark(this.board.groups[group_i].tiles, 6);
			var that = this;

			this.board.on('pick', function (target)
			{
				if ('mark' in target)
				{
					target.type = 5;
					that.board.reset();
					that.quests[time] = template(that.rules[0]);
					that.iface.brief.update('Time: ' + (time + 1));
					that.show(that.iface.brief);
				}
			});
		}
		else if (time > this.time)
		{
			console.log('WAIT FOR OTHER PLAYERS!');
		}
		else
		{
			this.quests[time] = template(this.rules[0]);
			this.iface.brief.update('Time: ' + (time + 1));
			this.show(this.iface.brief);
		}
	});

	Game.method('tock', function ()
	{
		this.time++;
		this.quests[this.time] = template(this.rules[0]);
		this.iface.brief.update('Time: ' + this.time);
		this.show(this.iface.brief);
	});

	//tiles(terrain)
	///spawn options: [5,1,2]
	///traverse cost: {0:2}//räuber nehmen zb nen goldstück oder so
	///(ground to build on: 0(sea/water))???????????????

	//building vars (tile based action)
	///spawn options: [5,1,2]//spawn events(origin miteinbeziehen!!!
	///traverse cost: {0:2}//räuber nehmen zb nen goldstück oder so
	///ground to build on: 1
	///build costs: {0:3,1:1}
	///description (unterteilt in build & effect)
	///build func
	///effect func

	//event vars (action without tile)
	///duration 0=permanent(campfire 1)
	///ground to happen: 1
	///build costs: {0:3,1:1}
	///description (unterteilt in build & effect)
	///build func
	///effect func???

	////KARTE/ACTION als object übergeben (zb für findTargets als origin)
	/////AN tiles anhängen!!!! tile.action.spawn = [1,2,3]??
	//////tile.action = ACTION[type]???

	///select origin/[select event(quest)&select party&select goods to take]/select target

	//1. select origin -> determines chars&goods
	//party = iface.listParty(origin)//list chars & goods
	//party = [chars, goods]
	//2. select chars&goods -> determines skills
	//skills = listQuests(origin, party)//onchange
	//3. select quest -> determines targets
	//targets = listTargets(origin, party, quest)
	//4. select target
	//5. select cancel/exec

	//automated/repeated quest is named a JOB
})();
