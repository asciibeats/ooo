pix = {};

(function ()
{
	var _world;
	var _realms = {};

	pix.prompt_login = function ()
	{
		if (localStorage.name && localStorage.pass)
		{
			var name = localStorage.name;
			var pass = localStorage.pass;
		}
		else
		{
			var name = prompt('name?');
			var pass = prompt('pass?');
			//var mail = prompt('mail?');
		}

		socket.emit_auth(name, pass);
	}

	pix.prompt_main = function ()
	{
		var option = parseInt(prompt('(1)create game/(2)join random/(3)play with friends?'));
		var options = {};

		if (option == 1)
		{
			socket.emit_create(options);
		}
		else if (option == 2)
		{
			socket.emit_join(options);
		}
	}

	pix.show_lobby = function (stats)
	{
		oO('lobby', stats);
	}

	pix.show_world = function (size, realm)
	{
		_world = new World(size, realm);
		PIX.show(_world);
	}

	var _ISTATE_DEFAULT = 0;
	var _ISTATE_SETTLE = 1;
	var _ISTATE_QUEST_1 = 2;
	var _ISTATE_QUEST_2 = 3;

	var _BUILD_CAMP = 1;

	var _HEX_H = 16;
	var _HEX_2H = 2 * _HEX_H;
	var _HEX_3H = 3 * _HEX_H;
	var _HEX_4H = 4 * _HEX_H;
	var _HEX_W = Math.sqrt(3) * _HEX_H;
	var _HEX_2W = 2 * _HEX_W;

	var _HEX_D = Math.sqrt(_HEX_W * _HEX_W + _HEX_3H * _HEX_3H);
	var _HEX_M = _HEX_D / 2;
	var _HEX_X = _HEX_W / _HEX_D;
	var _HEX_Y = _HEX_3H / _HEX_D;

	var _OBJ_W = _HEX_W / 2;
	var _OBJ_2W = 2 * _OBJ_W;
	var _OBJ_H = _HEX_3H / 2;
	var _OBJ_S = 42;

	var _SIZE;
	var _SIZEH;
	var _SIZE2;

	var _BOARD_W;
	var _BOARD_H;

	var _BOARD = ['#bbbbbb', '#26294a', '#01545a', '#017351', '#03c383', '#aad962', '#fbbf45', '#ef6a32', '#ed0345', '#a12a5e', '#710162', '#110141'];
	var _COSTS = [6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
	var _BUILD = ['#017351', '#03c383', '#aad962', '#fbbf45', '#ef6a32', '#ed0345', '#a12a5e', '#710162', '#110141', '#fff'];
	var _NMASK = [[[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]], [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]]];

	function quadrant (dx, dy, dz)
	{
		var dist1 = Math.max(Math.abs(_SIZEH + dx), _SIZE - dy, Math.abs(_SIZEH + dz));
		var dist2 = Math.max(Math.abs(_SIZEH - dx), _SIZE - dy, Math.abs(_SIZE2 + dz));
		var dist3 = Math.max(Math.abs(_SIZE - dx), dy, Math.abs(_SIZE + dz));
		return Math.min(dist1, dist2, dist3);
	}

	function distance (a, b)
	{
		var dx = b.x - a.x;
		var dy = b.y - a.y;
		var dz = b.z - a.z;
		var dist = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));

		if (dist > _SIZEH)
		{
			if (dy == 0 || dx == dz)
			{
				return (_SIZE - dist);
			}
			else if (dx > dz)//rechts
			{
				if (dy > 0)//unten
				{
					var quad = quadrant(dx, dy, dz);
				}
				else//oben
				{
					var quad = quadrant(-dz, -dy, -dx);
				}
			}
			else//links
			{
				if (dy > 0)//unten
				{
					var quad = quadrant(dz, dy, dx);
				}
				else//oben
				{
					var quad = quadrant(-dx, -dy, -dz);
				}
			}
		}

		return (dist > quad ? quad : dist);
	}

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

	var World = PIX.Sprite.extend(function (board, realm)
	{
		_SIZE = util.size(board);
		_STUFF = _SIZE << 1;
		_SIZEH = _SIZE >>> 1;
		_SIZE2 = _SIZE + _SIZEH;
		_BOARD_W = _SIZE * _HEX_2W;
		_BOARD_H = _SIZE * _HEX_3H;

		var centx = 0;
		var centy = 0;

		//this.build = build;
		this.drag_x = 0;
		this.drag_y = 0;
		this.drop_x = -(window.innerWidth/2-centx*_HEX_2W) + ((centx & 1) ? _HEX_W : 0);
		this.drop_y = -(window.innerHeight/2-centy*_HEX_3H);
		this.down_x = 0;
		this.down_y = 0;
		this.mark_x = 1;
		this.mark_y = 0;

		this.board = board;
		var i = 0;

		//add client helper values to board
		for (var y = 0; y < _SIZE; y++)
		{
			if (!this.board[y])
			{
				this.board[y] = [];
			}

			for (var x = 0; x < _SIZE; x++)
			{
				this.board[y][x].id = i++;
			}
		}

		//build up neighbor connections
		for (var y = 0; y < _SIZE; y++)
		{
			var nmask = _NMASK[y & 1];

			for (var x = 0; x < _SIZE; x++)
			{
				var land = this.board[y][x];
				land.x = x - (y >> 1);
				land.y = y;
				land.z = - land.x - y;
				land.n = [];

				for (var i in nmask)
				{
					var nx = (x + nmask[i][0] + _SIZE) % _SIZE;
					var ny = (y + nmask[i][1] + _SIZE) % _SIZE;
					land.n[i] = this.board[ny][nx];
				}
			}
		}

		this.istate = _ISTATE_DEFAULT;

		this.on('drag', function (data)
		{
			this.drag_x = data.drag_x;
			this.drag_y = data.drag_y;
		});

		this.on('drop', function (data)
		{
			this.drop_x = ((this.drop_x - this.drag_x) + _BOARD_W) % _BOARD_W;
			this.drop_y = ((this.drop_y - this.drag_y) + _BOARD_H) % _BOARD_H;
			this.drag_x = 0;
			this.drag_y = 0;
		});

		this.on('click', function (data)
		{
			//get clicked board coordinates
			var raw_x = (this.drop_x + data.down_x) % _BOARD_W;
			var raw_y = (this.drop_y + data.down_y) % _BOARD_H;
			var rel_x = raw_x % _HEX_W;
			var rel_y = raw_y % _HEX_3H;
			var min_x = Math.round((raw_x - rel_x) / _HEX_W);
			var min_y = Math.round((raw_y - rel_y) / _HEX_3H);

			if ((min_x & 1) == (min_y & 1))
			{
				if ((rel_x * _HEX_X + rel_y * _HEX_Y) < _HEX_M)
				{
					var board_x = (min_x >> 1) % _SIZE;
					var board_y = min_y % _SIZE;
				}
				else
				{
					var board_x = ((min_x + 1) >> 1) % _SIZE;
					var board_y = (min_y + 1) % _SIZE;
				}
			}
			else
			{
				if (((rel_x - _HEX_W) * -_HEX_X + rel_y * _HEX_Y) < _HEX_M)
				{
					var board_x = ((min_x + 1) >> 1) % _SIZE;
					var board_y = min_y % _SIZE;
				}
				else
				{
					var board_x = (min_x >> 1) % _SIZE;
					var board_y = (min_y + 1) % _SIZE;
				}
			}

			//var build_x = (board_x << 1) + (board_y & 1);
			//var build_y = board_y << 1;
			var tile = this.board[board_y][board_x];

			//determine what to do depending on the current interface state
			if (this.istate == _ISTATE_DEFAULT)
			{
				if ((board_x == this.realm.ruler.x) && (board_y == this.realm.ruler.y))
				{
					oO('BOSS');
				}
				else if (tile.realm === this.realm.id)
				{
					oO('MINE');
				}
				else if (tile.type && (tile.realm === undefined))
				{
					oO('FREE');
					//determine relation (direct neighbor or over hops)
				}
				else if (tile.type && tile.realm)
				{
					oO('FOREIGN');
				}
				else
				{
					oO('FOG');
					//if has neigh.type
				}
				return;
				var owner = parseInt(prompt('Owner?'));
				this.reveal([{x:board_x,y:board_y,owner:owner,type:4}]);
				return;
				var tile = this.board[board_y][board_x];
				oO('tile', tile.type, tile.owner);
				return;

				/*avatar(owner == my_id && clickpos == charpos)
					//skilltree(s)
				own(owner == myid)
					//deploy units
				foreign(owner != 0 && owner != my_id)
					//deploy units
				free(type != 0 && type < WATER_TYPES && owner == 0)
					//deploy units
				water(type != 0 && type >= WATER_TYPES && owner == 0)
					//deploy units
				hidden(type == 0)
					//deploy units*/

				//determine path to tile (direct neighbor; neighbor of neighbor etc)
				//relation tree!!!!! made serverside? list of owner: direct_neigh[]
				//if i clicked one of my pools
				if (game.state.pools[board_y] && game.state.pools[board_y][board_x])
				{
					oO('CLICK AGAIN TO QUEST');
					this.mark_x = board_x;
					this.mark_y = board_y;
					this.istate = _ISTATE_QUEST;
				}
				else if (game.state.build[build_y][build_x] == 0)//todo: if (has no ruler or ruler allows to settle here)
				{
					oO('CLICK AGAIN TO SETTLE');
					this.mark_x = board_x;
					this.mark_y = board_y;
					this.istate = _ISTATE_SETTLE;
				}
			}
			else if (this.istate == _ISTATE_QUEST)
			{
				if ((board_x == this.mark_x) && (board_y == this.mark_y))
				{
					//this.build[board_y][board_x] = _BUILD_CAMP;
					game.quest(board_x, board_y);
				}

				this.istate = _ISTATE_DEFAULT;
			}
			else if (this.istate == _ISTATE_SETTLE)
			{
				if ((board_x == this.mark_x) && (board_y == this.mark_y))
				{
					oO('NEW POOL AT', board_x, board_y);
					game.pool(board_x, board_y);
				}

				this.istate = _ISTATE_DEFAULT;
			}

			/*var a = this.board[this.down_y][this.down_x];
			var b = this.board[down_y][down_x];
			oO('B', b.x, b.y, b.z);
			var path = this.path(a, b);
			oO('COST', path.cost);

			for (var i in path.steps)
			{
				path.steps[i].type = 9;
			}*/
		});

		this.on('size', function (data)
		{
			//this.width = data.width;
			//this.height = data.height;
			//this.parent.width;
			this.width = this.parent.width;
			this.height = this.parent.height;
		});
	});

	World.method('reveal', function (tiles)
	{
		for (var i in tiles)
		{
			var tile = tiles[i];
			var board = this.board[tile.y][tile.x];
			board.type = tile.type;

			if (tile.realm)
			{
				board.realm = tile.realm;
			}
		}
	});

	World.method('path', function (a, b)
	{
		var tiles = {};
		var done = {};
		var move = {};

		a.g = 0;
		a.f = distance(a, b);
		tiles[a.id] = a;

		var open = [a.id];

		do
		{
			var current = tiles[open.pop()];
			done[current.id] = true;

			for (var i in current.n)
			{
				var next = current.n[i];

				if (done[next.id])
				{
					continue;
				}

				var next_c = _COSTS[next.type];

				if (!next_c)
				{
					continue;
				}

				var next_g = current.g + next_c;

				if (next.id == b.id)
				{
					var steps = [next];
					next = current;

					while (move[next.id] != undefined)
					{
						steps.push(next);
						next = tiles[move[next.id]];
					}

					steps.push(a);
					//steps.reverse();
					return {steps: steps, cost: next_g};
				}

				var tile_id = null;

				for (var i in open)
				{
					if (open[i] == next.id)
					{
						tile_id = next.id;
						break;
					}
				}

				if (tile_id === null)
				{
					move[next.id] = current.id;
					next.g = next_g;
					next.f = next_g + distance(next, b);
					tiles[next.id] = next;
					open.splice(sorted_index(tiles, open, next, 'f'), 0, next.id);
					continue;
				}

				var tile = tiles[tile_id];

				if (next_g < tile.g)
				{
					move[tile.id] = current.id;
					tile.g = next_g;
					tile.f = next_g + distance(tile, b);
				}
			}
		}
		while (open.length > 0)

		return null;
	});

	World.method('draw', function (elapsed, context)
	{
		//prepare board-drawing
		var shift_x = (this.drop_x - this.drag_x + _BOARD_W) % _BOARD_W;
		var shift_y = (this.drop_y - this.drag_y + _BOARD_H) % _BOARD_H;
		var start_x = Math.floor(shift_x / _HEX_2W);
		var start_y = Math.floor(shift_y / _HEX_3H);
		var end_x = start_x + Math.ceil(this.width / _HEX_2W);
		var end_y = start_y + Math.ceil(this.height / _HEX_3H);

		context.save();
		context.translate(-((shift_x % _HEX_2W) + _HEX_W), -((shift_y % _HEX_3H) + _HEX_2H));

		//draw board
		for (var y = start_y; y <= end_y; y++)
		{
			context.save();
			context.font = '12px Arial';
			context.textAlign = 'center';
			context.textBaseline = 'middle';

			if (y & 1)
			{
				context.translate(_HEX_W, 0);
			}

			for (var x = start_x; x <= end_x; x++)
			{
				var board_x = x % _SIZE;
				var board_y = y % _SIZE;
				var land = this.board[board_y][board_x];
				var type = land.type;

				context.beginPath();
				context.moveTo(_HEX_W, 0);
				context.lineTo(_HEX_2W, _HEX_H);
				context.lineTo(_HEX_2W, _HEX_3H);
				context.lineTo(_HEX_W, _HEX_4H);
				context.lineTo(0, _HEX_3H);
				context.lineTo(0, _HEX_H);
				context.closePath();
				//context.drawImage(PIX.images.hexbg, (_HEX_2W * this.board[y % this.board.length][x % this.board[0].length]), 0, _HEX_2W, _HEX_4H, 0, 0, _HEX_2W, _HEX_4H);
				context.fillStyle = _BOARD[type];
				//context.fillStyle = _BOARD[land.group];
				context.fill();

				/*if (land.type)
				{
					context.strokeStyle = '#000';
					context.stroke();
				}*/
				//context.fillText(land.type + '/' + land.owner + '/' + land.group, _HEX_W, _HEX_2H);

				//draw selection marker
				if ((this.istate == _ISTATE_SETTLE) && (board_x == this.mark_x) && (board_y == this.mark_y))
				{
					context.strokeStyle = '#f00';
					context.stroke();
				}

				context.translate(_HEX_2W, 0);
			}

			context.restore();
			context.translate(0, _HEX_3H);
		}

		context.restore();
		return;

		//prepare back and foreground-drawing
		context.save();
		context.translate(-((shift_x % _OBJ_2W) + _OBJ_W), _HORIZON);

		context.save();
		context.clip();

		var overHorizon = Math.floor(_OBJ_S / _OBJ_H);
		context.translate(0, (shift_y % _OBJ_H) + overHorizon * _OBJ_H);
		start_x = Math.floor(shift_x / _OBJ_2W);
		start_y = (Math.floor(shift_y / _OBJ_H) + _STUFF - overHorizon) % _STUFF;
		end_x = start_x + Math.ceil(this.width / _OBJ_2W) + 2;
		end_y = start_y + Math.ceil(this.height / _OBJ_H) + 3 + overHorizon;

		//draw background
		for (var y = start_y; y < start_y+1+overHorizon; y++)
		{
			context.save();

			if (y & 1)
			{
				context.translate(_OBJ_W, 0);
			}

			for (var x = start_x; x < end_x; x++)
			{
				var type = this.build[y % _STUFF][x % _STUFF];

				if (type > 0)
				{
					context.beginPath();
					context.moveTo(0, 0);
					context.lineTo(_OBJ_2W, 0);
					context.lineTo(_OBJ_W, -_OBJ_S);
					context.closePath();
					context.fillStyle = _BUILD[type];
					context.fill();
				}

				context.translate(_OBJ_2W, 0);
			}

			context.restore();
			context.translate(0, -_OBJ_H);
		}

		context.restore();
		context.translate(0, _OBJ_H - (shift_y % _OBJ_H));

		//draw foreground
		for (; y < end_y; y++)
		{
			context.save();

			if (y & 1)
			{
				context.translate(_OBJ_W, 0);
			}

			for (var x = start_x; x < end_x; x++)
			{
				var type = this.build[y % this.build.length][x % this.build[0].length];

				if (type > 0)
				{
					context.beginPath();
					context.moveTo(0, 0);
					context.lineTo(_OBJ_2W, 0);
					context.lineTo(_OBJ_W, -_OBJ_S);
					context.closePath();
					context.fillStyle = _BUILD[type];
					context.fill();
				}

				context.translate(_OBJ_2W, 0);
			}

			context.restore();
			context.translate(0, _OBJ_H);
		}

		context.restore();
	});
})();
