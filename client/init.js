(function ()
{
	var COLOR = '#00ffdd';
	var URL = 'http://' + window.location.hostname + ':11133';
	var pixman = null;

	function preload (assets, callback)
	{
		var images = {};
		var toload = Object.keys(assets).length;
		var loaded = 0;

		for (var name in assets)
		{
			images[name] = new Image();

			images[name].onload = function()
			{
				loaded++;

				if (loaded == toload)
				{
					callback(images);
				}
			};

			images[name].src = assets[name];
		}
	}

	function init (images)
	{
		var ACTIONS = [[0, 1], [2, 3]];//building->[]
		var BUILD = 1;
		var EMPTY = 2;
		var BOTH = 3;
		var AMASK = [BUILD, EMPTY, BOTH, EMPTY];//available on builds or empty only or both???
		var ACOSTS = [1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1];
		var PCOSTS = [1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
		var COLORS = ['#bbbbbb', '#26294a', '#01545a', '#017351', '#03c383', '#aad962', '#fbbf45', '#ef6a32', '#ed0345', '#a12a5e', '#710162', '#110141'];
		var NMASK = [[[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]], [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]]];

		var HEX_H = 19;
		var HEX_2H = 2 * HEX_H;
		var HEX_3H = 3 * HEX_H;
		var HEX_4H = 4 * HEX_H;
		var HEX_W = Math.sqrt(3) * HEX_H;
		var HEX_2W = 2 * HEX_W;

		var HEX_D = Math.sqrt(HEX_W * HEX_W + HEX_3H * HEX_3H);
		var HEX_M = HEX_D / 2;
		var HEX_X = HEX_W / HEX_D;
		var HEX_Y = HEX_3H / HEX_D;

		//temp for path draw
		var HEX_H1 = HEX_H / 2;
		var HEX_W1 = HEX_W / 2;
		var HEX_H2 = HEX_4H - HEX_H1; 
		var HEX_W2 = HEX_2W - HEX_W1; 

		var Board = oO.Sprite.extend(function (size)
		{
			this.size = size;
			this.size_d = size << 1;
			this.size_h = size >>> 1;
			this.size_1h = size + this.size_h;
			this.patch_w = size * HEX_2W;
			this.patch_h = size * HEX_3H;
			//var centx = 0;
			//var centy = 0;
			this.drag_x = 0;
			this.drag_y = 0;
			//this.drop_x = -(window.innerWidth/2-centx*HEX_2W) + ((centx & 1) ? HEX_W : 0);
			//this.drop_y = -(window.innerHeight/2-centy*HEX_3H);
			this.drop_x = 0;
			this.drop_y = 0;
			this.down_x = 0;
			this.down_y = 0;
			//this.mark_x = 1;
			//this.mark_y = 0;
			this.index = [];
			this.tiles = [];
			//this.neigh = [];
			var i = 0;

			//generate empty board
			for (var y = 0; y < size; y++)
			{
				this.tiles[y] = [];

				for (var x = 0; x < size; x++, i++)
				{
					var tile = {};
					tile.i = i;
					tile.x = x - (y >> 1);
					tile.y = y;
					tile.z = - tile.x - y;
					tile.terrain = Math.round(Math.random()) + 1;
					var build = Math.round(Math.random() * 8);
					if (build < 2)
					{
						tile.building = build;
					}
					this.index[i] = tile;
					this.tiles[y][x] = tile;
				}
			}

			//building up neighbor connections
			for (var y = 0; y < size; y++)
			{
				var nmask = NMASK[y & 1];

				for (var x = 0; x < size; x++)
				{
					var steps = [];

					for (var i in nmask)
					{
						var nx = (x + nmask[i][0] + size) % size;
						var ny = (y + nmask[i][1] + size) % size;
						steps[i] = this.tiles[ny][nx];
					}

					this.tiles[y][x].steps = steps;
				}
			}

			this.on('size', function (data)
			{
				this.width = data.width;
				this.height = data.height;
			});

			this.on('drag', function (data)
			{
				this.drag_x = data.drag_x;
				this.drag_y = data.drag_y;
			});

			this.on('drop', function (data)
			{
				this.drop_x = ((this.drop_x - this.drag_x) + this.patch_w) % this.patch_w;
				this.drop_y = ((this.drop_y - this.drag_y) + this.patch_h) % this.patch_h;
				this.drag_x = 0;
				this.drag_y = 0;
			});

			this.on('click', function (data)
			{
				var raw_x = (this.drop_x + data.down_x) % this.patch_w;
				var raw_y = (this.drop_y + data.down_y) % this.patch_h;
				var rel_x = raw_x % HEX_W;
				var rel_y = raw_y % HEX_3H;
				var min_x = Math.round((raw_x - rel_x) / HEX_W);
				var min_y = Math.round((raw_y - rel_y) / HEX_3H);

				if ((min_x & 1) == (min_y & 1))
				{
					if ((rel_x * HEX_X + rel_y * HEX_Y) < HEX_M)
					{
						var tile_x = (min_x >> 1) % this.size;
						var tile_y = min_y % this.size;
					}
					else
					{
						var tile_x = ((min_x + 1) >> 1) % this.size;
						var tile_y = (min_y + 1) % this.size;
					}
				}
				else
				{
					if (((rel_x - HEX_W) * -HEX_X + rel_y * HEX_Y) < HEX_M)
					{
						var tile_x = ((min_x + 1) >> 1) % this.size;
						var tile_y = min_y % this.size;
					}
					else
					{
						var tile_x = (min_x >> 1) % this.size;
						var tile_y = (min_y + 1) % this.size;
					}
				}

				var target = this.tiles[tile_y][tile_x];
				this.onclick.call(this, target);
			});
		});

		Board.method('onClick', function (callback)
		{
			this.onclick = callback;
		});

		Board.method('findArea', function (target, cost)
		{
			var done = {};
			var open = [target.i];
			target.g = 0;

			do
			{
				var current = this.index[open.pop()];
				done[current.i] = current.g;
				//console.log('#', current.i);

				for (var i in current.steps)
				{
					var next = current.steps[i];

					if ((next.terrain == undefined) || (done[next.i] != undefined))
					{
						//console.log('1', next.i);
						continue;
					}

					var next_c = PCOSTS[next.terrain];

					if (!next_c)
					{
						//console.log('2', next.i);
						continue;
					}

					var next_g = current.g + next_c;

					if (next_g > cost)
					{
						//console.log('3', next.i);
						continue;
					}

					var tile_i = null;

					for (var i in open)
					{
						if (open[i] == next.i)
						{
							tile_i = next.i;
							break;
						}
					}

					if (tile_i === null)
					{
						next.g = next_g;
						open.splice(sorted_index(this.index, open, next, 'g'), 0, next.i);
						//console.log('4', next.i);
						continue;
					}

					var tile = this.index[tile_i];

					if (next_g < tile.g)
					{
						tile.g = next_g;
						//console.log('5', next.i);
						//continue;
					}
					
					//console.log('6', next.i);
				}
			}
			while (open.length)

			var options = {};
			var context = target.building ? BUILD : EMPTY;

			for (var i in done)
			{
				var origin = this.index[i];
				//origin.terrain = 6;
				var building = origin.building;

				if (building == undefined)
				{
					continue;
				}

				var origin_c = done[i];
				var actions = ACTIONS[building];

				for (var i in actions)
				{
					var action = actions[i];

					if (!(AMASK[action] & context))
					{
						continue;
					}

					var action_c = origin_c + ACOSTS[action];

					if (action_c > cost)
					{
						continue;
					}

					if (!options[action])
					{
						options[action] = [];
					}

					options[action].push({origin: origin, cost: action_c});
				}
			}

			return options;
		});

		Board.method('quadrant', function (dx, dy, dz)
		{
			var dist1 = Math.max(Math.abs(this.size_h + dx), this.size - dy, Math.abs(this.size_h + dz));
			var dist2 = Math.max(Math.abs(this.size_h - dx), this.size - dy, Math.abs(this.size_1h + dz));
			var dist3 = Math.max(Math.abs(this.size - dx), dy, Math.abs(this.size + dz));
			return Math.min(dist1, dist2, dist3);
		});

		Board.method('distance', function (a, b)
		{
			var dx = b.x - a.x;
			var dy = b.y - a.y;
			var dz = b.z - a.z;
			var dist = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));

			if (dist > this.size_h)
			{
				if (dy == 0 || dx == dz)
				{
					return (this.size - dist);
				}
				else if (dx > dz)//rechts
				{
					if (dy > 0)//unten
					{
						var quad = this.quadrant(dx, dy, dz);
					}
					else//oben
					{
						var quad = this.quadrant(-dz, -dy, -dx);
					}
				}
				else//links
				{
					if (dy > 0)//unten
					{
						var quad = this.quadrant(dz, dy, dx);
					}
					else//oben
					{
						var quad = this.quadrant(-dx, -dy, -dz);
					}
				}
			}

			return (dist > quad ? quad : dist);
		});

		function sorted_index (tiles, open, tile, compare)
		{
			var low = 0;
			var high = open.length;

			while (low < high)
			{
				var mid = (low + high) >>> 1;
				tiles[open[mid]][compare] > tile[compare] ? low = mid + 1 : high = mid;
			}

			return low;
		}

		Board.method('showPath', function (path)
		{
			console.log('PATH', path.target.i, JSON.stringify(path.steps));
			//add values to this.marks[];
		});

		Board.method('findPath', function (origin, target)
		{
			if (origin.i == target.i)
			{
				return {target: target, steps: [], cost: 0};
			}

			var done = {};
			var crumbs = {};
			var open = [origin.i];
			origin.g = 0;
			origin.f = this.distance(origin, target);

			do
			{
				var current = this.index[open.pop()];
				done[current.i] = true;

				for (var i = 0; i < 6; i++)
				{
					var next = current.steps[i];

					if ((next.terrain == undefined) || done[next.i])
					{
						continue;
					}

					var next_c = PCOSTS[next.terrain];

					if (!next_c)
					{
						continue;
					}

					var next_g = current.g + next_c;

					if (next.i == target.i)
					{
						var steps = [(i + 3) % 6];

						while (current.i != origin.i)
						{
							i = (crumbs[current.i] + 3) % 6;
							steps.push(i);
							current = current.steps[i];
						}

						return {target: target, steps: steps, cost: next_g};
					}

					var tile_i = null;

					for (var j in open)
					{
						if (open[j] == next.i)
						{
							tile_i = next.i;
							break;
						}
					}

					if (tile_i === null)
					{
						crumbs[next.i] = i;
						next.g = next_g;
						next.f = next_g + this.distance(next, target);
						open.splice(sorted_index(this.index, open, next, 'f'), 0, next.i);
						continue;
					}

					var tile = this.index[tile_i];

					if (next_g < tile.g)
					{
						crumbs[tile.i] = i;
						tile.g = next_g;
						tile.f = next_g + this.distance(tile, target);
					}
				}
			}
			while (open.length)
		});

		function pick (tile)
		{
			if (!tile.terrain)
			{
				return;
			}

			if (tile.building)
			{
				var options = ['develop'];
			}
			else
			{
				var options = ['occupy', 'asdf'];
			}

			var list = '';

			for (var i in options)
			{
				list += "(" + i + ") " + options[i] + "\n";
			}

			return parseInt(prompt(list));
		}

		Board.method('draw', function (elapsed, context)
		{
			//prepare board-drawing
			var shift_x = (this.drop_x - this.drag_x + this.patch_w) % this.patch_w;
			var shift_y = (this.drop_y - this.drag_y + this.patch_h) % this.patch_h;
			var start_x = Math.floor(shift_x / HEX_2W);
			var start_y = Math.floor(shift_y / HEX_3H);
			var end_x = start_x + Math.ceil(this.width / HEX_2W);
			var end_y = start_y + Math.ceil(this.height / HEX_3H);

			context.font = '12px Arial';
			context.textAlign = 'center';
			context.textBaseline = 'middle';

			//context.save();
			context.translate(-((shift_x % HEX_2W) + HEX_W), -((shift_y % HEX_3H) + HEX_2H));

			for (var y = start_y; y <= end_y; y++)
			{
				context.save();

				if (y & 1)
				{
					context.translate(HEX_W, 0);
				}

				for (var x = start_x; x <= end_x; x++)
				{
					var tile_x = x % this.size;
					var tile_y = y % this.size;
					var tile = this.tiles[tile_y][tile_x];

					context.beginPath();
					context.moveTo(HEX_W, 0);
					context.lineTo(HEX_2W, HEX_H);
					context.lineTo(HEX_2W, HEX_3H);
					context.lineTo(HEX_W, HEX_4H);
					context.lineTo(0, HEX_3H);
					context.lineTo(0, HEX_H);
					context.closePath();

					if (tile.terrain != undefined)
					{
						//context.drawImage(oO.images.tiles, (HEX_2W * this.tile[y % this.tile.length][x % this.tile[0].length]), 0, HEX_2W, HEX_4H, 0, 0, HEX_2W, HEX_4H);
						context.fillStyle = COLORS[tile.terrain + 1];
						context.fill();
					}
					else
					{
						//context.drawImage(oO.images.tiles, (HEX_2W * this.tile[y % this.tile.length][x % this.tile[0].length]), 0, HEX_2W, HEX_4H, 0, 0, HEX_2W, HEX_4H);
						context.fillStyle = COLORS[0];
						context.fill();
					}

					if (tile.building != undefined)
					{
						context.fillStyle = COLORS[tile.building];
						context.fillRect(30, 30, 10, 10);
					}

					if (tile.path != undefined)
					{
						context.strokeStyle = COLORS[7];
						context.lineWidth = 8;

						if (tile.path & 1)
						{
							context.beginPath();
							context.moveTo(HEX_W, HEX_2H);
							context.lineTo(HEX_W2, HEX_H1);
							context.stroke();
						}

						if (tile.path & 2)
						{
							context.beginPath();
							context.moveTo(HEX_W, HEX_2H);
							context.lineTo(HEX_2W, HEX_2H);
							context.stroke();
						}

						if (tile.path & 4)
						{
							context.beginPath();
							context.moveTo(HEX_W, HEX_2H);
							context.lineTo(HEX_W2, HEX_H2);
							context.stroke();
						}

						if (tile.path & 8)
						{
							context.beginPath();
							context.moveTo(HEX_W, HEX_2H);
							context.lineTo(HEX_W1, HEX_H2);
							context.stroke();
						}

						if (tile.path & 16)
						{
							context.beginPath();
							context.moveTo(HEX_W, HEX_2H);
							context.lineTo(0, HEX_2H);
							context.stroke();
						}

						if (tile.path & 32)
						{
							context.beginPath();
							context.moveTo(HEX_W, HEX_2H);
							context.lineTo(HEX_W1, HEX_H1);
							context.stroke();
						}
					}

					context.fillStyle = COLORS[9];
					context.fillText(tile.i, HEX_W, HEX_2H);
					context.translate(HEX_2W, 0);
				}

				context.restore();
				context.translate(0, HEX_3H);
			}

			//context.restore();
		});

		var Game = oO.Scene.extend(function (rules, names)
		{
			this.rules = rules;
			this.board = new Board(rules[1]);
			//this.time = 0;
			//this.intel = [];
			this.seats = {};

			for (var i in names)
			{
				this.seats[names[i]] = true;
			}

			this.on('size', function (data)
			{
				this.width = data.width;
				this.height = data.height;
			});

			this.show(this.board);
		});

		Game.method('join', function (name)
		{
			this.seats[name] = true;
		});

		Game.method('leave', function (name)
		{
			delete this.seats[name];
		});

		Game.method('reveal', function (types)
		{
			for (var i in types)
			{
				this.board.index[i].terrain = types[i];
			}
		});

		Game.method('build', function (buildings)
		{
			for (var i in buildings)
			{
				this.board.index[i].building = buildings[i];
			}
		});

		Game.method('progress', function (actions)
		{
			for (var i in actions)
			{
				var action = actions[i];
				var id = action[0];//player
				var time = action[1];
				var x = action[2];//target
				var y = action[3];//target
				var type = action[4];
				var path = action[5];//0-5,0-5...(path FROM target TO origin/border)
				var intel = this.intel[id];

				if (!intel.history[time])
				{
					intel.history[time] = {};
				}

				if (!intel.history[time][y])
				{
					intel.history[time][y] = {};
				}

				if (!intel.history[time][y][x])
				{
					intel.history[time][y][x] = [];
				}

				intel.history[time][y][x].push([type, path]);

				if (type == OCCUPY)
				{
					//intel.realm[target] = true;
				}
				else if (type == BUILD)
				{
				}
				/*else if (type == EFFECT)//"CARD"
				{
				}*/
			}

			//add to tile.intel[time][]
			//ORIGIN,to
			//PATH,from,to
			//PATH,from,to
			//PATH,from,to
			//TARGET,from
		});

		Game.method('start', function (me)
		{
			this.me = me;
			this.time = 1;
			this.intel = [];

			for (var name in this.seats)
			{
				this.intel.push({name: null, history: {}, realm: {}});//time leitet sich von actions ab(kein extra feld)
			}

			return;

			//assign startingpoint (and hero) to each player
			//separieren:was alle wissen(allgemeines)/spielerwissen/serverdata
			var id = 0;
			var x = 0;
			var y = 0;

			for (var name in this.slots)
			{
				var realm = {};
				realm.id = id;
				realm.x = x;
				realm.y = y;
				realm.name = 'Mordor';
				
				realm.population = {count: 10, stats: {anger: 0, health: 1}};
				realm.characters = [];
				realm.succession = [];

				realm.gain = 10;
				realm.affect = {};
				realm.affect[id] = 5;//rest geht in entdeckung?
				realm.coins = {};
				realm.coins[id] = 5;
				realm.discover = 5;
				this.realms[name] = realm;
				var neigh = this.neigh[y][x];

				for (var i in neigh)
				{
					neigh[i].realm = id;
				}

				id++;
			}
		});

		Game.method('tick', function (id, actions)
		{
			if (this.running && this.slots[id])
			{
				//this.slots[id].time++;
				return true;
			}
		});

		//SOCKMAN
		var CLOSE = -2;
		var OPEN = -1;
		var NULL = 0;

		var LOGIN = 1;
		var READY = 2;
		var HOST = 3;
		var JOIN = 4;
		var LOBBY = 5;
		var TICK = 6;
		var DENY = 7;
		var LEAVE = 8;
		var AWAY = 9;
		var BACK = 10;
		var START = 11;

		var RULESET = [[2, 2, 0]];

		var name = null;
		var id = null;
		var games = {};
		//var groups = {};
		pixman.open(images);
		var sockman = new oO.Sockman();
		var timeout = {};

		function ready (id, delay)
		{
			console.log('READY %d %d', id, delay);
			delay--;

			if (delay > 0)
			{
				timeout[id] = setTimeout(function () { ready(id, delay) }, 1000);
			}
			else
			{
				delete timeout[id];
			}
		}

		sockman.on(OPEN, [DENY, LOGIN], function ()
		{
			console.log('OPEN');

			pix.show_login(function ($name, pass)
			{
				name = $name;
				sockman.send([LOGIN, name, pass]);
			});
		});

		sockman.on(DENY, [DENY, LOGIN], function ()
		{
			console.log('DENY');

			pix.show_login(function ($name, pass)
			{
				name = $name;
				sockman.send([LOGIN, name, pass]);
			});
		});

		sockman.on(LOGIN, [LOBBY, JOIN], function (list)
		{
			console.log('LOGIN');

			if (name == 'a')
			{
				pix.show_rules(RULESET, function (rules)
				{
					sockman.send([HOST, rules]);
				});
			}
			else
			{
				pix.show_list(list, function (id)
				{
					sockman.send([JOIN, id]);
				});
			}
		});

		sockman.on(LOBBY, [JOIN, LEAVE, READY], function (id, rules, names)
		{
			console.log('LOBBY');
			var game = new Game(rules, names);
			games[id] = game;

			pix.show_lobby(id, game, function (id)
			{
				sockman.send([LEAVE, id]);
			});
		});

		sockman.on(JOIN, [JOIN, LEAVE, READY], function (id, name)
		{
			var game = games[id];

			if (game)
			{
				console.log('JOIN %d %s', id, name);
				game.join(name);
			}
		});

		sockman.on(LEAVE, [JOIN, LEAVE, READY], function (id, name)
		{
			var game = games[id];

			if (game)
			{
				console.log('LEAVE %d %s', id, name);
				game.leave(name);

				if (timeout[id])
				{
					clearTimeout(timeout[id]);
					delete timeout[id];
				}
			}
		});

		sockman.on(READY, [LEAVE, START], function (id, delay)
		{
			if (games[id])
			{
				ready(id, delay);
			}
		});

		sockman.on(START, [AWAY, BACK, TICK], function (id, me)
		{
			var game = games[id];

			if (game)
			{
				console.log('START %d %d', id, me);
				oO.hide();
				oO.show(game);
				game.start(me);
			}
		});

		sockman.on(AWAY, [AWAY, BACK, TICK], function (id, name)
		{
			console.log('AWAY %d %s', id, name);
		});

		sockman.on(BACK, [AWAY, BACK, TICK], function (id, name)
		{
			console.log('BACK %d %s', id, name);
		});

		sockman.on(TICK, [AWAY, BACK, TICK], function (id, actions)
		{
			console.log('BACK %d %s', id, actions);//actions={'a':[1,2,3],'b':[1,2]}
		});

		sockman.on(CLOSE, [], function (code)
		{
			console.log('CLOSE %d', code);
		});

		pixman.show(new oO.Box('#ff0000'));
		return;
		var game = new Game([2, 8], ['a', 'b']);

		game.board.onClick(function (target)
		{
			var options = this.findArea(target, 6);
			var actions = Object.keys(options);
			//return;
			//optimist trait

			var effects = [];
			effects[0] = function (origin, target)
			{
				//add a marker until server ack(next tick)
				target.building = 0;
			}

			if (actions.length)
			{
				//einzugsgebiet markieren!!!!!!!!!!!
				var choice = parseInt(prompt(JSON.stringify(actions)));
				var origins = options[choice];

				/*for (var i in origins)
				{
					var origin = origins[i].origin;
				}*/

				var path = this.findPath(origins[0].origin, target);
				this.showPath(path);
			}
		});

		oO.show(game);
		oO.open(images);
		//oO.fullscreen();
		game.start(0);
		//game.reveal({0:8,9:2,17:1});
		//game.progress([]);
		//game.build({9:0});
		//var path = game.board.path(game.board.tiles[1][1], game.board.tiles[5][3]);
		//console.log(path.cost);
		//sockman.connect(URL);
	}

	function load ()
	{
		document.body.style.margin = 0;
		document.body.style.overflow = 'hidden';
		pixman = new oO.Pixman(document.body, COLOR, window.innerWidth, window.innerHeight);
		var assets = {hexbg: 'assets/hexbg.png'};
		preload(assets, init);
	}

	function unload ()
	{
	}

	window.addEventListener('load', load);
	window.addEventListener('unload', unload);
})();
