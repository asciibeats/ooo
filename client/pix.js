pix = {};

(function ()
{
	var _HEX_H = 25;
	var _HEX_3H = 3 * _HEX_H;
	var _HEX_4H = 4 * _HEX_H;
	var _HEX_W = Math.sqrt(3) * _HEX_H;
	var _HEX_2W = _HEX_W << 1;

	var _images;
	var _name;

	var _hex_image_x = [0, _HEX_2W, 2*_HEX_2W, 3*_HEX_2W];
	var _hex_image_y = [0, 0, 0, 0];

	var Map = PIX.Sprite.extend(function (board)
	{
		this.tiles = board;
	});

	Map.method('draw', function (elapsed, context)
	{
		/*context.beginPath();
		context.moveTo(_HEX_W, 0);
		context.lineTo(_HEX_2W, _HEX_H);
		context.lineTo(_HEX_2W, _HEX_3H);
		context.lineTo(_HEX_W, _HEX_4H);
		context.lineTo(0, _HEX_3H);
		context.lineTo(0, _HEX_H);
		context.closePath();
		context.strokeStyle = '#000000';
		context.translate(200, 200);*/

		for (var y in this.tiles)
		{
			context.save();

			if (y & 1)
			{
				context.translate(_HEX_W, 0);
			}

			for (var x in this.tiles[y])
			{
				var type = this.tiles[y][x];
				context.drawImage(_images.hexbg, _hex_image_x[type], _hex_image_y[type], _HEX_2W, _HEX_4H, 0, 0, _HEX_2W, _HEX_4H);
				context.translate(_HEX_2W, 0);
			}

			context.restore();
			context.translate(0, _HEX_3H);
		}
	});

	var Lane = PIX.Stage.extend(function ()
	{
		this.size(800, 350);
		this.show(new PIX.Sprite(_images.lane, 0, 0, 800, 350));
		/*this.context.beginPath();
		this.context.moveTo(100, 100);
		this.context.lineTo(200, 200);
		this.context.stroke();*/
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
		var lane = new Map(state.board);
		PIX.show(lane);
	};

	pix.tick = function ()
	{
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
