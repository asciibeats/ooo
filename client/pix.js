pix = {};

(function ()
{
	var _HEX_H = 16;
	var _HEX_3H = 3 * _HEX_H;
	var _HEX_4H = 4 * _HEX_H;
	var _HEX_W = Math.round(Math.sqrt(3) * _HEX_H);
	var _HEX_2W = 2 * _HEX_W;
	var _MAX_X;
	var _MAX_Y;
	var _COLORS = ['#111111', '#aaaaaa', '#cc0000', '#eeeeee'];
	var _COLORS = ['#1a1334', '#26294a', '#01545a', '#017351', '#03c383', '#aad962', '#fbbf45', '#ef6a32', '#ed0345', '#a12a5e', '#710162', '#110141'];
	var _HORIZON = 90;

	var _name;

	var Map = PIX.Sprite.extend(function ()
	{
		this.board = game.state.board;
		this.pools = game.state.pools;
		_MAX_X = this.board[0].length;
		_MAX_Y = this.board.length;
		this.board_w = _MAX_X * _HEX_2W;
		this.board_h = _MAX_Y * _HEX_3H;
		this.drag_x = 0;
		this.drag_y = 0;
		this.drop_x = 0;
		this.drop_y = 0;

		this.on('drag', function (data)
		{
			this.drag_x = data.drag_x;
			this.drag_y = data.drag_y;
		});

		this.on('drop', function (data)
		{
			this.drop_x = ((this.drop_x - this.drag_x) + this.board_w) % this.board_w;
			this.drop_y = ((this.drop_y - this.drag_y) + this.board_h) % this.board_h;
			this.drag_x = 0;
			this.drag_y = 0;
		});

		this.on('click', function (data)
		{
			var down_y = Math.floor((this.drop_y + data.down_y) / _HEX_3H) % _MAX_Y;

			if (down_y & 1)
			{
				var down_x = Math.floor((this.drop_x + data.down_x) / _HEX_2W) % _MAX_X;
			}
			else
			{
				var down_x = Math.round((this.drop_x + data.down_x) / _HEX_2W) % _MAX_X;
			}

			this.board[down_y][down_x] = (this.board[down_y][down_x] + 1) % _COLORS.length;
		});
	});

	Map.method('draw', function (elapsed, context)
	{
		var shift_x = (this.drop_x - this.drag_x + this.board_w) % this.board_w;
		var shift_y = (this.drop_y - this.drag_y + this.board_h) % this.board_h;
		var start_x = Math.floor(shift_x / _HEX_2W);
		var start_y = Math.floor(shift_y / _HEX_3H);

		context.translate(-((shift_x % _HEX_2W) + _HEX_W), -((shift_y % _HEX_3H) + _HEX_H));

		for (var y = start_y; y < start_y + 14; y++)
		{
			context.save();

			if (y & 1)
			{
				context.translate(_HEX_W, 0);
			}

			for (var x = start_x; x < start_x + 14; x++)
			{
				context.beginPath();
				context.moveTo(_HEX_W, 0);
				context.lineTo(_HEX_2W, _HEX_H);
				context.lineTo(_HEX_2W, _HEX_3H);
				context.lineTo(_HEX_W, _HEX_4H);
				context.lineTo(0, _HEX_3H);
				context.lineTo(0, _HEX_H);
				context.closePath();
				//context.drawImage(PIX.images.hexbg, (_HEX_2W * this.board[y % this.board.length][x % this.board[0].length]), 0, _HEX_2W, _HEX_4H, 0, 0, _HEX_2W, _HEX_4H);
				//context.fillStyle = _COLORS[this.board[y % _MAX_Y][x % _MAX_X]];
				context.fillStyle = _COLORS[3];
				context.fill();
				context.lineWidth = 3;
				context.strokeStyle = _COLORS[5];
				context.stroke();

				if (game.state.pools[y % _MAX_Y] && game.state.pools[y % _MAX_Y][x % _MAX_X])
				{
					context.beginPath();
					context.moveTo(0, _HEX_H);
					context.lineTo(_HEX_2W, _HEX_3H);
					context.moveTo(_HEX_2W, _HEX_H);
					context.lineTo(0, _HEX_3H);
					context.lineWidth = 1;
					context.strokeStyle = _COLORS[4];
					context.stroke();
				}

				context.translate(_HEX_2W, 0);
			}

			context.restore();
			context.translate(0, _HEX_3H);
		}
		
		context.restore();
		context.save();

		context.beginPath();
		context.moveTo(0, 0);
		context.lineTo(700, 0);
		context.lineTo(700, _HORIZON);
		context.lineTo(0, _HORIZON);
		context.closePath();
		context.fillStyle = _COLORS[2];
		context.fill();
	});

	pix.init = function (color)
	{
		PIX.init(color);
	};

	pix.open = function (images)
	{
		PIX.open(images);
	};

	pix.showLobby = function (state)
	{
		oO('lobby', state.players);
	};

	pix.showMap = function ()
	{
		var map = new Map();
		map.relative_y = _HORIZON;
		PIX.show(map);

		/*
		if (Object.keys(player.pools).length > 0)
		{
			oO('please choose a quest target...');
		}
		*/
	};

	pix.promptLogin = function ()
	{
		//_name = prompt('name?');
		//var _pass = prompt('pass?');

		if (!localStorage.login)
		{
			localStorage.login = 0;
		}

		var _users = [['tilla','pass'],['pantra','pass']];
		var user = _users[localStorage.login % _users.length];
		localStorage.login++;

		_name = user[0];
		var _pass = user[1];

		socket.emit_auth(_name, _pass);
	};

	pix.promptPool = function (origins)
	{
		//var types = new PIX.Sprite(PIX.images.type);
		var selection = 0;
		return selection;
	};

	/*pix.noteTick = function ()
	{
	};

	pix.noteJoin = function (name)
	{
		oO('join', name);
	};

	pix.noteLeave = function (name)
	{
		oO('leave', name);
	};*/
})();
