hide_pix = {};

(function ()
{
	var _images;
	var _name;
	var _game;

	var Lane = PIX.Stage.extend(function ()
	{
		this.size(800, 350);
		this.show(new PIX.Sprite(_images.lane, 0, 0, 800, 350));
		/*this.context.beginPath();
		this.context.moveTo(100, 100);
		this.context.lineTo(200, 200);
		this.context.stroke();*/
	});

	hide_pix.init = function (color)
	{
		PIX.init(color);
	};

	hide_pix.open = function (images)
	{
		_images = images;
		PIX.open();
		var lane = new Lane();
		PIX.show(lane);
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
