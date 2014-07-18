'use strict';
var Board;

//MARSTECH//INTRUDER schicken/folge von bits/uplevel/pick loadout

(function ()
{
	var TIME = 0;

	//states
	var NULL = 0;
	var ORIGIN = 1;
	var ACTION = 2;
	var TARGET = 3;
	var CONFIRM = 4;

	var OPTIONS = [[], [], [], [], [], [5, 1, 2]];
	var GROUNDS = [1, 2, 1, 1, 1, 1];

	var ACOSTS = [1, 2, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1];
	var PCOSTS = [5, 1, 3, 5, 5, 5, 5, 1, 1, 1, 1, 1, 1];
	//var COLORS = ['#bbbbbb', '#555555', '#01545a', '#017351', '#03c383', '#aad962', '#fbbf45', '#ef6a32', '#ed0345', '#a12a5e', '#710162', '#110141'];
	//var COLORS = ['#000', '#111', '#222', '#333', '#444', '#555', '#666', '#777', '#888', '#999', '#aaa', '#bbb', '#ccc', '#ddd', '#eee', '#fff'];
	var COLORS = ['#556ca9', '#98c83f', '#60834d', '#968f85', '#eff0f1', '#ff0000'];
	var NMASK = [[[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]], [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]]];

	var HEX_H = 13;
	var HEX_2H = 2 * HEX_H;
	var HEX_3H = 3 * HEX_H;
	var HEX_4H = 4 * HEX_H;
	//var HEX_W = Math.round(Math.sqrt(3) * HEX_H);
	var HEX_W = 26;
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

	function distance (a, b)
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
					var quad = quadrant.call(this, dx, dy, dz);
				}
				else//oben
				{
					var quad = quadrant.call(this, -dz, -dy, -dx);
				}
			}
			else//links
			{
				if (dy > 0)//unten
				{
					var quad = quadrant.call(this, dz, dy, dx);
				}
				else//oben
				{
					var quad = quadrant.call(this, -dx, -dy, -dz);
				}
			}
		}

		return (dist > quad ? quad : dist);
	}

	function quadrant (dx, dy, dz)
	{
		var dist1 = Math.max(Math.abs(this.size_h + dx), this.size - dy, Math.abs(this.size_h + dz));
		var dist2 = Math.max(Math.abs(this.size_h - dx), this.size - dy, Math.abs(this.size_1h + dz));
		var dist3 = Math.max(Math.abs(this.size - dx), dy, Math.abs(this.size + dz));
		return Math.min(dist1, dist2, dist3);
	}

	function regroup (tile, group)
	{
		if (tile.group == undefined)
		{
			this.groups[group] = tile.type;
			tile.group = group;

			for (var i = 0; i < 6; i++)
			{
				var next = tile.steps[i];

				if (next.type == tile.type)
				{
					regroup.call(this, next, group);
				}
			}
		}
	}

	function pick_tile (down_x, down_y)
	{
		var raw_x = (this.drop_x + down_x) % this.patch_w;
		var raw_y = (this.drop_y + down_y) % this.patch_h;
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

		return this.tiles[tile_y][tile_x];
	}

	Board = oO.Actor.extend(function (size, types)
	{
		oO.Actor.call(this);
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
		//this.down_x = 0;
		//this.down_y = 0;

		this.index = [];
		this.tiles = [];
		this.groups = [];

		//fill board
		for (var y = 0, i = 0; y < size; y++)
		{
			this.tiles[y] = [];

			for (var x = 0; x < size; x++, i++)
			{
				var tile = {};
				tile.i = i;
				tile.x = x - (y >> 1);
				tile.y = y;
				tile.z = - tile.x - y;
				tile.type = types[i];
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

		//separate groups
		for (var i = 0, j = this.index.length; i < j; i++)
		{
			regroup.call(this, this.index[i], this.groups.length);
		}

		this.tile_coords = [];

		var cols = Math.floor(tiles_img.width / 52);
		var rows = Math.floor(tiles_img.height / 62);

		for (var y = 0; y < rows; y++)
		{
			for (var x = 0; x < cols; x++)
			{
				this.tile_coords.push([x * 52, y * 62]);
			}
		}
	});

	Board.on('resize', function (width, height)
	{
		this.resize(width, height);
	});

	Board.on('draw', function (elapsed, context)
	{
		var shift_x = ((this.drop_x - this.drag_x) + this.patch_w) % this.patch_w;
		var shift_y = ((this.drop_y - this.drag_y) + this.patch_h) % this.patch_h;
		var start_x = Math.floor(shift_x / HEX_2W);
		var start_y = Math.floor(shift_y / HEX_3H);
		var end_x = start_x + Math.ceil(this.width / HEX_2W);
		var end_y = start_y + Math.ceil(this.height / HEX_3H);

		//context.lineWidth = 5;
		context.strokeStyle = '#000';
		context.font = '9px Arial';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
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

				/*context.beginPath();
				context.moveTo(HEX_W, 0);
				context.lineTo(HEX_2W, HEX_H);
				context.lineTo(HEX_2W, HEX_3H);
				context.lineTo(HEX_W, HEX_4H);
				context.lineTo(0, HEX_3H);
				context.lineTo(0, HEX_H);
				context.closePath();*/

				context.save();
				context.translate(0, -10);
				context.drawImage(tiles_img, this.tile_coords[tile.type][0], this.tile_coords[tile.type][1], 52, 62, 0, 0, 52, 62);
				context.restore();
				//context.fillStyle = COLORS[tile.type];
				//context.fill();

				/*if (tile.path != undefined)
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
				}*/

				if ((this.option != null) && this.targets[this.option] && this.targets[this.option][tile.i])
				{
					context.strokeStyle = '#000';
					context.stroke();
				}

				/*else if (tile.mark == ORIGIN)
				{
					context.strokeStyle = '#00f';
					context.stroke();
				}*/

				//context.fillStyle = '#333';
				//context.fillText(tile.group, HEX_W, HEX_2H);
				//context.fillText(tile.i, HEX_W, HEX_2H);

				context.translate(HEX_2W, 0);
			}

			context.restore();
			context.translate(0, HEX_3H);
		}
	});

	Board.on('click', function (down_x, down_y)
	{
		var origin = pick_tile.call(this, down_x, down_y);
		console.log(origin.i);
		//this.parent.initQuest(origin);
		//this.listen();
	});

	/*Board.on('click', TARGET, function (root)
	{
	});*/

	Board.method('findTargets', function (origin, types, goods)
	{
		//get all tiles reachable in time
		var done = {};
		var open = [origin.i];
		origin.g = 0;

		do
		{
			var current = this.index[open.pop()];
			done[current.i] = current.g;

			for (var i in current.steps)
			{
				var next = current.steps[i];

				if ((next.type == undefined) || (done[next.i] != undefined))
				{
					continue;
				}

				var next_c = PCOSTS[next.type];

				if (!next_c)
				{
					continue;
				}

				var next_g = current.g + next_c;

				if (next_g > goods[TIME])
				{
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
					continue;
				}

				var tile = this.index[tile_i];

				if (next_g < tile.g)
				{
					tile.g = next_g;
				}
			}
		}
		while (open.length)

		//filter out unwanted
		var options = OPTIONS[this.origin.type];
		var targets = {};

		for (var k = 0, l = options.length; k < l; k++)
		{
			var action = options[k];
			var costs = {};
			var hastarget = false;

			for (var i in done)
			{
				if (this.index[i].type != GROUNDS[action])
				{
					continue;
				}

				//var action_c = done[i] + ACOSTS[action];
				var action_c = done[i];

				if (action_c > goods[TIME])
				{
					continue;
				}

				costs[i] = action_c;
				hastarget = true;
			}

			if (hastarget)
			{
				targets[action] = costs;
			}
		}

		this.targets = targets;
		console.log(JSON.stringify(targets));
	});

	Board.method('markTargets', function (option)
	{
		this.option = option;
	});

	Board.method('pickTarget', function (down_x, down_y)
	{
		var target = pick.call(this, down_x, down_y);

		if ((this.option != undefined) && (this.targets[this.option][target.i] != undefined))
		{
			return [this.option, [target.i, []]];
		}
	});

	Board.method('reset', function (down_x, down_y)
	{
		delete this.origin;
		delete this.option;
		delete this.targets;
	});

	/*Board.method('showPath', function (path)
	{
		console.log('PATH', path.target.i, JSON.stringify(path.steps));
		//add values to this.marks[];
	});*/

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
		origin.f = distance.call(this, origin, target);

		do
		{
			var current = this.index[open.pop()];
			done[current.i] = true;

			for (var i = 0; i < 6; i++)
			{
				var next = current.steps[i];

				if ((next.type == undefined) || done[next.i])
				{
					continue;
				}

				var next_c = PCOSTS[next.type];

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
					next.f = next_g + distance.call(this, next, target);
					open.splice(sorted_index(this.index, open, next, 'f'), 0, next.i);
					continue;
				}

				var tile = this.index[tile_i];

				if (next_g < tile.g)
				{
					crumbs[tile.i] = i;
					tile.g = next_g;
					tile.f = next_g + distance.call(this, tile, target);
				}
			}
		}
		while (open.length)
	});
})();
