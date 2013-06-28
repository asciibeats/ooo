hide_pix = {};

(function ()
{
	var _images;
	var _name;
	var _game;

	var Game = PIX.Stage.extend(function (state)
	{
		this.size(300, 300);
		this.state = state;
		var box = new PIX.Box('#eeeeee').size(300, 300);
		this.show(box);
		this.board = new Board(state).size(300, 300);
		this.show(this.board);
	});

	Game.method('next', function ()
	{
		if (this.state.players[_name].turn === this.state.turn)
		{
			oO('YOUR TURN!');

			this.on('down', function (data)
			{
				var x = Math.floor((data.down_x - this.board.relative_x) / 33);
				var y = Math.floor((data.down_y - this.board.relative_y) / 33);
				oO('build', x, y);
				this.off('down');

				hide_socket.emit_turn(x, y);
			});
		}
	});

	var Board = PIX.Actor.extend(function (state)
	{
		this.state = state;
		this.drag_x = 0;
		this.drag_y = 0;

		this.on('drag', function (data)
		{
			this.drag_x = data.drag_x;
			this.drag_y = data.drag_y;
		});

		this.on('drop', function (data)
		{
			this.relative_x += this.drag_x;
			this.relative_y += this.drag_y;
			this.drag_x = 0;
			this.drag_y = 0;
		});
	});

	Board.method('draw', function (elapsed, context)
	{
		context.save();
		context.translate(this.drag_x, this.drag_y);

		for (var y in this.state.board)
		{
			for (var x in this.state.board[y])
			{
				var card = this.state.board[y][x];
				context.fillStyle = '#ff0000';
				context.fillRect(x*33, y*33, 30, 30);
			}
		}

		context.restore();
	});

	hide_pix.init = function (color)
	{

		PIX.init(color);
	};

	hide_pix.open = function (images)
	{
		_images = images;
		PIX.open();
	};

	hide_pix.show_login = function ()
	{
		_name = prompt('name?');
		var _pass = prompt('pass?');
		
		hide_socket.emit_auth(_name, _pass);
	};

	hide_pix.show_lobby = function (state)
	{

		oO('lobby', state.players);
	};

	hide_pix.show_game = function (state)
	{
		_game = new Game(state);
		PIX.show(_game);
		_game.next();
	};

	hide_pix.next_turn = function ()
	{

		_game.next();
	};

	hide_pix.join = function (name)
	{

		oO('join', name);
	};

	hide_pix.leave = function (name)
	{

		oO('leave', name);
	};
})();