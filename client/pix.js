pix = {};

(function ()
{
	var _HEX_H = 16;
	var _HEX_3H = 3 * _HEX_H;
	var _HEX_4H = 4 * _HEX_H;
	var _HEX_W = Math.round(Math.sqrt(3) * _HEX_H);
	var _HEX_2W = 2 * _HEX_W;

	var _COLORS = ['#000000', '#aaaaaa', '#44cccc', '#eeeeee'];

	var _images;
	var _name;

	var Map = PIX.Sprite.extend(function (board)
	{
		this.board = board;
		this.board_w = board[0].length * _HEX_2W;
		this.board_h = board.length * _HEX_3H;
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

		this.on('down', function (data)
		{
			var down_x = Math.floor((this.drop_x + data.down_x) / _HEX_2W) % this.board[0].length;
			var down_y = Math.floor((this.drop_y + data.down_y) / _HEX_3H) % this.board.length;
			this.board[down_y][down_x]++;
		});
	});

	Map.method('draw', function (elapsed, context)
	{
		var shift_x = (this.drop_x - this.drag_x + this.board_w) % this.board_w;
		var shift_y = (this.drop_y - this.drag_y + this.board_h) % this.board_h;
		var start_x = Math.floor(shift_x / _HEX_2W);
		var start_y = Math.floor(shift_y / _HEX_3H);

		context.translate(-((shift_x % _HEX_2W)+_HEX_W), -((shift_y % _HEX_3H)+_HEX_H));

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
				//context.drawImage(_images.hexbg, (_HEX_2W * this.board[y % this.board.length][x % this.board[0].length]), 0, _HEX_2W, _HEX_4H, 0, 0, _HEX_2W, _HEX_4H);
				context.fillStyle = _COLORS[this.board[y % this.board.length][x % this.board[0].length]];
				context.fill();
				context.strokeStyle = '#ffffff';
				context.stroke();
				context.translate(_HEX_2W, 0);
			}

			context.restore();
			context.translate(0, _HEX_3H);
		}
	});

	pix.init = function (color)
	{
		PIX.init(color);
	};

	pix.open = function (images)
	{
		_images = images;
		PIX.open();
	};

	pix.login = function ()
	{
		//_name = prompt('name?');
		//var _pass = prompt('pass?');

		_name = 'tilla';
		var _pass = 'pass';

		socket.emit_auth(_name, _pass);
	};

	pix.lobby = function (state)
	{
		oO('lobby', state.players);
	};

	pix.game = function (state)
	{
		oO('game', state);
		var lane = new Map(state.board);
		PIX.show(lane);
	};

	pix.tick = function ()
	{
		oO('tick');
	};

	pix.join = function (name)
	{
		oO('join', name);
	};

	pix.leave = function (name)
	{
		oO('leave', name);
	};
})();
