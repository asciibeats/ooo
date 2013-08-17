var hide_socket = {};

(function ()
{
	//var _host;
	var _socket;
	var _name;
	var _pass;
	var _auth = false;//temp
	//var _time_sync = 0;

	//helper

	//events
	function on_connect ()
	{
		this.on('disconnect', on_disconnect);

		if (_auth)//if credentials in local storage
		{
			oO('...geht weiter');
			//hide_game.note_hide();
			_socket.emit('auth', _name, _pass, null, on_init);
		}
		else
		{
			hide_pix.show_login();
		}
	};

	function on_init (state)
	{
		if (state)
		{
			_auth = true;
			//save credentials to local storage

			this.on('join', on_join);
			this.on('leave', on_leave);
			this.on('ready', on_ready);
			this.on('start', on_start);
			this.on('turn', on_turn);
			this.on('away', on_away);
			this.on('back', on_back);

			hide_game.init(state);
		}
		else
		{
			oO('access denied');
			hide_pix.show_login();
		}
	};

	function on_join (name)
	{
		
		hide_game.join(name);
	};

	function on_leave (name)
	{
		oO('leave', name);
		hide_game.leave(name);
	};

	function on_ready (delay)
	{
		oO('ready');
		hide_game.ready(delay);
	};

	function on_start (players, board, turn, card)
	{
		oO('start');
		hide_game.start(players, board, turn, card);
	};

	function on_turn (x, y, turn, card)
	{
		oO('turn');
		hide_game.turn(x, y, turn, card);
	};

	function on_away (name)
	{
		oO('waiting for', name);
		hide_game.away(name);
	};

	function on_back (name)
	{
		oO('player is back', name);
		hide_game.back(name);
	};

	function on_disconnect ()
	{
		oO('connection down, please wait...');
		//hide_game.note_show('bla');
		_socket.removeAllListeners();
		_socket.on('connect', on_connect);
	};

	hide_socket.connect = function (host)
	{
		oO('connecting', host);
		oO('test');
		_socket = io.connect(host, {reconnect: false});//, {reconnect: false}
		_socket.on('connect', on_connect);
	};

	hide_socket.emit_auth = function (name, pass, mail)
	{
		_name = name;
		_pass = pass;
		_socket.emit('auth', name, pass, mail, on_init);
	};

	hide_socket.emit_ready = function ()
	{

		_socket.emit('ready');
	};

	hide_socket.emit_turn = function (x, y)
	{

		_socket.emit('turn', x, y);
	};
})();
