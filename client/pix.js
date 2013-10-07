pix = {};

(function ()
{
	var _HEX_H = 16;
	var _HEX_2H = 2*_HEX_H;
	var _HEX_3H = 3 * _HEX_H;
	var _HEX_4H = 4 * _HEX_H;
	//var _HEX_W = Math.round(Math.sqrt(3) * _HEX_H);
	var _HEX_W = 28;
	var _HEX_2W = 2 * _HEX_W;

	/*var _OBJ_W = 7;
	var _OBJ_2W = 2 * _OBJ_W;
	var _OBJ_H = 8;
	var _OBJ_S = 16;*/
	var _OBJ_W = 14;
	var _OBJ_2W = 2 * _OBJ_W;
	var _OBJ_H = 24;
	var _OBJ_S = 42;

	var _MAX_X;
	var _MAX_Y;

	var _HORIZON = 90;

	var _BOARD = ['#1a1334', '#26294a', '#01545a', '#017351', '#03c383', '#aad962', '#fbbf45', '#ef6a32', '#ed0345', '#a12a5e', '#710162', '#110141'];
	var _BUILD = ['#017351', '#03c383', '#aad962', '#fbbf45', '#ef6a32', '#ed0345', '#a12a5e', '#710162', '#110141'];

	var _name;

	var Map = PIX.Sprite.extend(function ()
	{
		this.board = game.state.board;
		this.build = game.state.build;
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
			var down_y = Math.floor((this.drop_y + data.down_y - _HORIZON + _HEX_H) / _HEX_3H) % _MAX_Y;

			if (down_y & 1)
			{
				var down_x = Math.floor((this.drop_x + data.down_x) / _HEX_2W) % _MAX_X;
			}
			else
			{
				var down_x = Math.round((this.drop_x + data.down_x) / _HEX_2W) % _MAX_X;
			}

			oO('CLICK', down_x, down_y);

			this.board[down_y][down_x] = (this.board[down_y][down_x] + 1) % _BOARD.length;
		});

		this.on('size', function (data)
		{
			//this.width = data.width;
			//this.height = data.height;
			//this.parent.width
			this.width = this.parent.width;
			this.height = this.parent.height - _HORIZON;
		});
	});

	Map.method('draw', function (elapsed, context)
	{
		var shift_x = (this.drop_x - this.drag_x + this.board_w) % this.board_w;
		var shift_y = (this.drop_y - this.drag_y + this.board_h) % this.board_h;
		var start_x = Math.floor(shift_x / _HEX_2W);
		var start_y = Math.floor(shift_y / _HEX_3H);
		var end_x = start_x + Math.ceil(this.width / _HEX_2W) + 2;
		var end_y = start_y + Math.ceil(this.height / _HEX_3H) + 2;//<<<<<< minimize offscreen rendering!!!!!!!!!!!!!!!!!!!!!genauer bestimmen was nicht gerendert werden muss

		context.save();
		context.translate(-((shift_x % _HEX_2W) + _HEX_W), _HORIZON - ((shift_y % _HEX_3H) + _HEX_2H));

		for (var y = start_y; y < end_y; y++)
		{
			context.save();

			if (y & 1)
			{
				context.translate(_HEX_W, 0);
			}

			for (var x = start_x; x < end_x; x++)
			{
				var type = this.board[y % this.board.length][x % this.board[0].length];

				context.beginPath();
				context.moveTo(_HEX_W, 0);
				context.lineTo(_HEX_2W, _HEX_H);
				context.lineTo(_HEX_2W, _HEX_3H);
				context.lineTo(_HEX_W, _HEX_4H);
				context.lineTo(0, _HEX_3H);
				context.lineTo(0, _HEX_H);
				context.closePath();
				//context.drawImage(PIX.images.hexbg, (_HEX_2W * this.board[y % this.board.length][x % this.board[0].length]), 0, _HEX_2W, _HEX_4H, 0, 0, _HEX_2W, _HEX_4H);
				//context.fillStyle = _BOARD[this.board[y % _MAX_Y][x % _MAX_X]];
				context.fillStyle = _BOARD[type];
				context.fill();
				//context.strokeStyle = '#f00';
				//context.stroke();

				/*if (this.pools[y % _MAX_Y] && this.pools[y % _MAX_Y][x % _MAX_X])
				{
					context.beginPath();
					context.moveTo(0, _HEX_H);
					context.lineTo(_HEX_2W, _HEX_3H);
					context.moveTo(_HEX_2W, _HEX_H);
					context.lineTo(0, _HEX_3H);
					context.lineWidth = 1;
					context.strokeStyle = '#f00';
					context.stroke();
				}*/

				context.translate(_HEX_2W, 0);
			}

			context.restore();
			context.translate(0, _HEX_3H);
		}
		
		context.restore();

		//draw sky
		context.rect(0, 0, this.width, _HORIZON);
		context.fillStyle = '#000';
		context.fill();
		//return;

		start_x = Math.floor(shift_x / _OBJ_2W);
		start_y = Math.floor(shift_y / _OBJ_H);

		context.save();
		context.translate(-((shift_x % _OBJ_2W) + _OBJ_W), _HORIZON);

		context.save();
		context.clip();

		var overHorizon = Math.floor(_OBJ_S / _OBJ_H);
		context.translate(0, (shift_y % _OBJ_H) + overHorizon * _OBJ_H);
		start_y = (start_y + this.build.length - overHorizon) % this.build.length;
		end_x = start_x + Math.ceil(this.width / _OBJ_2W) + 2;
		end_y = start_y + Math.ceil(this.height / _OBJ_H) + 3 + overHorizon;

		for (var y = start_y; y < start_y+1+overHorizon; y++)
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
			context.translate(0, -_OBJ_H);
		}

		context.restore();
		context.translate(0, _OBJ_H - (shift_y % _OBJ_H));

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

	pix.showLobby = function (state)
	{
		oO('lobby', state.players);
	};

	pix.showMap = function ()
	{
		var map = new Map();
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
