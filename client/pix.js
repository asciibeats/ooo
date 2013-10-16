pix = {};

(function ()
{
	var _HEX_H = 16
	var _HEX_2H = 2*_HEX_H
	var _HEX_3H = 3 * _HEX_H
	var _HEX_4H = 4 * _HEX_H
	//var _HEX_W = Math.sqrt(3) * _HEX_H
	var _HEX_W = 28
	var _HEX_2W = 2 * _HEX_W

	var _HEX_D = Math.sqrt(_HEX_W * _HEX_W + _HEX_3H * _HEX_3H)
	var _HEX_M = _HEX_D / 2
	var _HEX_X = _HEX_W / _HEX_D
	var _HEX_Y = _HEX_3H / _HEX_D
	oO('NORM', _HEX_X, _HEX_Y)

	/*var _OBJ_W = 7
	var _OBJ_2W = 2 * _OBJ_W
	var _OBJ_H = 8
	var _OBJ_S = 16*/
	var _OBJ_W = _HEX_W / 2
	var _OBJ_2W = 2 * _OBJ_W
	var _OBJ_H = _HEX_3H / 2
	var _OBJ_S = 42

	var _SIZE

	var _HORIZON = 0

	var _BOARD = ['#1a1334', '#26294a', '#01545a', '#017351', '#03c383', '#aad962', '#fbbf45', '#ef6a32', '#ed0345', '#a12a5e', '#710162', '#110141']
	var _BUILD = ['#017351', '#03c383', '#aad962', '#fbbf45', '#ef6a32', '#ed0345', '#a12a5e', '#710162', '#110141', '#fff']
	var _NMASK = [[[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]], [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]]]

	var _name

	function path_cost (a, b)
	{
		//oO('B2', b.x + _SIZE, b.y, b.z - _SIZE)
		var dx = b.x - a.x
		var dy = b.y - a.y
		var dz = b.z - a.z
		oO('DIFF', dx, dy, dz)
		dx = Math.abs(dx)
		dy = Math.abs(dy)
		dz = Math.abs(dz)
		var max = Math.max(dx, dy, dz)
		var min = Math.min(dx, dy, dz)
		oO('COST', max, (_SIZE - max) + min)
		//oO('COST', _SIZE - max + min)
		return
		dx = Math.min(12 - dx, dx)
		dy = Math.min(8 - dy, dy)
		dz = Math.min(12 - dz, dz)
		oO('DIFF', dx, dy, dz)
		var cost = ((dx + dy + dz) >> 1)
		oO('COST', cost)
		dx2 = Math.abs(dx2)
		dz2 = Math.abs(dz2)
		//oO('DIFF', dx, dy, dz)
		//var cost = (Math.min(dx, dx + 12) + Math.min(dy, _SIZE - dy) + Math.max(dz, dz + 12)) >> 1
		var cost2 = ((dx2 + dy + dz2) >> 1)
		var costs = cost - _SIZE;
		var costs2 = costs - (_SIZE >> 1);
		//oO('COST', cost, costs, costs2, Math.abs(cost) + Math.abs(costs) + Math.abs(costs2))
		//oO('COST', cost % ((_SIZE + (_SIZE >> 1)) >> 1))
		//oO('COST', cost, Math.abs(cost - Math.abs(_SIZE + dy)), dy)
		return cost
	}

	function sorted_index (tiles, open, tile, compare)
	{
		var low = 0
		var high = open.length

		while (low < high)
		{
			var mid = (low + high) >>> 1
			tiles[open[mid]][compare] > tile[compare] ? low = mid + 1 : high = mid
		}

		return low
	}

	var Map = PIX.Sprite.extend(function (board, pools, build)
	{
		_SIZE = board.length

		this.build = build
		_BOARD_W = _SIZE * _HEX_2W
		_BOARD_H = _SIZE * _HEX_3H
		this.drag_x = 0
		this.drag_y = 0
		this.drop_x = 0
		this.drop_y = 0
		this.down_x = 0
		this.down_y = 0

		this.board = []
		var i = 0

		for (var y = 0; y < _SIZE; y++)
		{
			this.board[y] = []

			for (var x = 0; x < _SIZE; x++)
			{
				var p = pools[y] ? pools[y][x] : null;
				this.board[y][x] = { id: i++, type: board[y][x], pool: p ? p : 0 }
			}
		}

		for (var y = 0; y < _SIZE; y++)
		{
			var nmask = _NMASK[y & 1]

			for (var x = 0; x < _SIZE; x++)
			{
				var land = this.board[y][x]
				land.x = x - (y >> 1)
				land.y = y
				land.z = - land.x - y
				land.n = []

				for (var i in nmask)
				{
					var nx = (x + nmask[i][0] + _SIZE) % _SIZE
					var ny = (y + nmask[i][1] + _SIZE) % _SIZE
					land.n[i] = this.board[ny][nx]
				}
			}
		}

		this.board[0][0].type = 8
		this.cmode = 7

		this.on('drag', function (data)
		{
			this.drag_x = data.drag_x
			this.drag_y = data.drag_y
		})

		this.on('drop', function (data)
		{
			this.drop_x = ((this.drop_x - this.drag_x) + _BOARD_W) % _BOARD_W
			this.drop_y = ((this.drop_y - this.drag_y) + _BOARD_H) % _BOARD_H
			this.drag_x = 0
			this.drag_y = 0
		})

		this.on('click', function (data)
		{
			var raw_x = (this.drop_x + data.down_x) % _BOARD_W
			var raw_y = (this.drop_y + data.down_y - _HORIZON) % _BOARD_H
			var rel_x = raw_x % _HEX_W
			var rel_y = raw_y % _HEX_3H
			var min_x = (raw_x - rel_x) / _HEX_W
			var min_y = (raw_y - rel_y) / _HEX_3H

			if ((min_x & 1) == (min_y & 1))
			{
				if ((rel_x * _HEX_X + rel_y * _HEX_Y) < _HEX_M)
				{
					var down_x = (min_x >> 1) % _SIZE
					var down_y = min_y % _SIZE
				}
				else
				{
					var down_x = ((min_x + 1) >> 1) % _SIZE
					var down_y = (min_y + 1) % _SIZE
				}
			}
			else
			{
				if (((rel_x - _HEX_W) * -_HEX_X + rel_y * _HEX_Y) < _HEX_M)
				{
					var down_x = ((min_x + 1) >> 1) % _SIZE
					var down_y = min_y % _SIZE
				}
				else
				{
					var down_x = (min_x >> 1) % _SIZE
					var down_y = (min_y + 1) % _SIZE
				}
			}

			if (this.cmode == 7)
			{
				this.down_x = down_x
				this.down_y = down_y
				var a = this.board[1][1];
				var b = this.board[down_y][down_x];
				oO('#####################')
				oO('A', a.x, a.y, a.z)
				oO('B', b.x, b.y, b.z)
				path_cost(a, this.board[down_y][down_x])
			}
			else if (this.cmode == 8)
			{
				var a = this.board[down_y][down_x];
				oO('2', a.x, a.y, a.z)
				path_cost(this.board[this.down_y][this.down_x], this.board[down_y][down_x])
				this.cmode = 7
				return
				var path = this.path(this.board[this.down_y][this.down_x], this.board[down_y][down_x])
				oO('TOTAL', path.cost)

				for (var i in path.steps)
				{
					path.steps[i].type = 9	
				}
			}

			return

			var build_x = this.down_x * 2
			var build_y = this.down_y * 2

			if (this.down_y & 1)
			{
				build_x++
			}

			if (this.build[build_y][build_x] == 9)
			{
				this.cmode = 2
				oO('click again to quest...')
			}
			else if (this.cmode == 0)
			{
				this.cmode = 1
				this.board[this.down_y][this.down_x] = 8
				oO('click again to build...')
			}
			else if (this.cmode == 1)
			{
				this.cmode = 0
				this.board[this.down_y][this.down_x] = 1
				this.build[build_y][build_x] = 9
				oO('building at', this.down_y, this.down_x)
			}
			else if (this.cmode == 2)
			{
				this.cmode = 0
				oO('quest at', this.down_y, this.down_x)
			}
		})

		this.on('size', function (data)
		{
			//this.width = data.width
			//this.height = data.height
			//this.parent.width
			this.width = this.parent.width
			this.height = this.parent.height - _HORIZON
		})
	});

	Map.method('path', function (a, b)
	{
		var tiles = {}
		var done = {}
		var move = {}

		a.g = 0
		a.f = path_cost(a, b)
		tiles[a.id] = a

		var open = [a.id]

		do
		{
			var current = tiles[open.pop()]
			done[current.id] = true

			for (var i in current.n)
			{
				var next = current.n[i]

				if (done[next.id])
				{
					continue
				}

				//next.c = _costs[_terrain[next.y][next.x]]
				next.c = 1

				if (!next.c)
				{
					continue
				}

				var next_g = current.g + next.c

				if (next.id == b.id)
				{
					var steps = [next]
					next = current

					while (move[next.id] != undefined)
					{
						steps.push(next)
						next = tiles[move[next.id]]
					}

					steps.push(a)
					//steps.reverse()
					return {steps: steps, cost: next_g}
				}

				var tile_id = null

				for (var i in open)
				{
					if (open[i] == next.id)
					{
						tile_id = next.id
						break
					}
				}

				if (tile_id === null)
				{
					move[next.id] = current.id
					next.g = next_g
					next.f = next_g + path_cost(next, b)
					tiles[next.id] = next
					open.splice(sorted_index(tiles, open, next, 'f'), 0, next.id)
					continue
				}

				var tile = tiles[tile_id]

				if (next_g < tile.g)
				{
					move[tile.id] = current.id
					tile.g = next_g
					tile.f = next_g + path_cost(tile, b)
				}
			}
		}
		while (open.length > 0)

		return null
	});

	Map.method('draw', function (elapsed, context)
	{
		var shift_x = (this.drop_x - this.drag_x + _BOARD_W) % _BOARD_W
		var shift_y = (this.drop_y - this.drag_y + _BOARD_H) % _BOARD_H
		var start_x = Math.floor(shift_x / _HEX_2W)
		var start_y = Math.floor(shift_y / _HEX_3H)
		var end_x = start_x + Math.ceil(this.width / _HEX_2W) + 2
		var end_y = start_y + Math.ceil(this.height / _HEX_3H) + 2//<<<<<< minimize offscreen rendering!!!!!!!!!!!!!!!!!!!!!genauer bestimmen was nicht gerendert werden muss
		var colstep = 256 / _SIZE

		context.save()
		context.translate(-((shift_x % _HEX_2W) + _HEX_W), _HORIZON - ((shift_y % _HEX_3H) + _HEX_2H))

		for (var y = start_y; y < end_y; y++)
		{
			context.save()

			if (y & 1)
			{
				context.translate(_HEX_W, 0)
			}

			for (var x = start_x; x < end_x; x++)
			{
				var lx = x % _SIZE
				var ly = y % _SIZE
				var land = this.board[ly][lx]
				var type = land.type

				context.beginPath()
				context.moveTo(_HEX_W, 0)
				context.lineTo(_HEX_2W, _HEX_H)
				context.lineTo(_HEX_2W, _HEX_3H)
				context.lineTo(_HEX_W, _HEX_4H)
				context.lineTo(0, _HEX_3H)
				context.lineTo(0, _HEX_H)
				context.closePath()
				//context.drawImage(PIX.images.hexbg, (_HEX_2W * this.board[y % this.board.length][x % this.board[0].length]), 0, _HEX_2W, _HEX_4H, 0, 0, _HEX_2W, _HEX_4H)
				//context.fillStyle = _BOARD[this.board[y % _SIZE][x % _SIZE]]
				//context.fillStyle = _BOARD[type]
				//context.fill()

				if (lx == 1 && ly == 1)
				{
					context.fillStyle = '#e44'
				}
				else if (lx == this.down_x && ly == this.down_y)
				{
					context.fillStyle = '#44c'
				}
				else
				{
					var col = (lx*colstep+ly*colstep)>>>1
					context.fillStyle = 'rgb('+col+','+col+','+col+')'
				}

				context.fill()
				context.strokeStyle = '#333'
				context.stroke()

				/*if ((y % _SIZE) == 0 && (x % _SIZE) == 0)
				{
					context.moveTo(0, _HEX_2H)
					context.beginPath()
					context.lineTo(0, _HEX_2H)
					context.strokeStyle = '#f00'
					context.stroke()

					context.beginPath()
					context.lineTo(_HEX_W, -_HEX_2H)
					context.strokeStyle = '#0fe'
					context.stroke()

					context.beginPath()
					context.lineTo(-_HEX_W, -_HEX_2H)
					context.strokeStyle = '#00f'
					context.stroke()
				}*/

				/*if (this.pools[y % _SIZE] && this.pools[y % _SIZE][x % _SIZE])
				{
					context.beginPath()
					context.moveTo(0, _HEX_H)
					context.lineTo(_HEX_2W, _HEX_3H)
					context.moveTo(_HEX_2W, _HEX_H)
					context.lineTo(0, _HEX_3H)
					context.lineWidth = 1
					context.strokeStyle = '#f00'
					context.stroke()
				}*/

				context.translate(_HEX_2W, 0)
			}

			context.restore()
			context.translate(0, _HEX_3H)
		}
		
		context.restore()

		//draw sky
		context.rect(0, 0, this.width, _HORIZON)
		context.fillStyle = '#000'
		context.fill()
		return

		start_x = Math.floor(shift_x / _OBJ_2W)
		start_y = Math.floor(shift_y / _OBJ_H)

		context.save()
		context.translate(-((shift_x % _OBJ_2W) + _OBJ_W), _HORIZON)

		context.save()
		context.clip()

		var overHorizon = Math.floor(_OBJ_S / _OBJ_H)
		context.translate(0, (shift_y % _OBJ_H) + overHorizon * _OBJ_H)
		start_y = (start_y + this.build.length - overHorizon) % this.build.length
		end_x = start_x + Math.ceil(this.width / _OBJ_2W) + 2
		end_y = start_y + Math.ceil(this.height / _OBJ_H) + 3 + overHorizon

		for (var y = start_y; y < start_y+1+overHorizon; y++)
		{
			context.save()

			if (y & 1)
			{
				context.translate(_OBJ_W, 0)
			}

			for (var x = start_x; x < end_x; x++)
			{
				var type = this.build[y % this.build.length][x % this.build[0].length]

				if (type > 0)
				{
					context.beginPath()
					context.moveTo(0, 0)
					context.lineTo(_OBJ_2W, 0)
					context.lineTo(_OBJ_W, -_OBJ_S)
					context.closePath()
					context.fillStyle = _BUILD[type]
					context.fill()
				}

				context.translate(_OBJ_2W, 0)
			}

			context.restore()
			context.translate(0, -_OBJ_H)
		}

		context.restore()
		context.translate(0, _OBJ_H - (shift_y % _OBJ_H))

		for (; y < end_y; y++)
		{
			context.save()

			if (y & 1)
			{
				context.translate(_OBJ_W, 0)
			}

			for (var x = start_x; x < end_x; x++)
			{
				var type = this.build[y % this.build.length][x % this.build[0].length]

				if (type > 0)
				{
					context.beginPath()
					context.moveTo(0, 0)
					context.lineTo(_OBJ_2W, 0)
					context.lineTo(_OBJ_W, -_OBJ_S)
					context.closePath()
					context.fillStyle = _BUILD[type]
					context.fill()
				}

				context.translate(_OBJ_2W, 0)
			}

			context.restore()
			context.translate(0, _OBJ_H)
		}

		context.restore()
	});

	pix.showLobby = function (state)
	{
		oO('lobby', state.players)
	}

	pix.showMap = function ()
	{
		var map = new Map(game.state.board, game.state.pools, game.state.build)
		PIX.show(map)

		/*
		if (Object.keys(player.pools).length > 0)
		{
			oO('please choose a quest target...')
		}
		*/
	}

	pix.promptLogin = function ()
	{
		//_name = prompt('name?')
		//var _pass = prompt('pass?')

		if (!localStorage.login)
		{
			localStorage.login = 0
		}

		var _users = [['tilla','pass'],['pantra','pass']]
		var user = _users[localStorage.login % _users.length]
		localStorage.login++

		_name = user[0]
		var _pass = user[1]

		socket.emit_auth(_name, _pass)
	}

	pix.promptPool = function (origins)
	{
		//var types = new PIX.Sprite(PIX.images.type)
		var selection = 0
		return selection
	}

	/*pix.noteTick = function ()
	{
	}

	pix.noteJoin = function (name)
	{
		oO('join', name)
	}

	pix.noteLeave = function (name)
	{
		oO('leave', name)
	}*/
})()
