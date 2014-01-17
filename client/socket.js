socket = {};

(function ()
{
	var _socket;
	var _name;
	var _pass;
	var _timer;
	var _options;

	//callbacks
	function cb_name (value)
	{
		if (value)
		{
			oO('name is valid');
		}
		else
		{
			oO('choose another name');
		}
	}

	function cb_auth (board, realm)
	{
		if (board)
		{
			localStorage.name = _name;
			localStorage.pass = _pass;

			if (realm)
			{
				oO('continue', realm);
				pix.show_world(board, realm);
			}
			else
			{
				oO('granted');
				pix.prompt_main();
			}
		}
		else
		{
			oO('denied');
			delete localStorage.name;
			delete localStorage.pass;
			pix.prompt_login();
		}
	}

	function cb_lobby (players)
	{
		pix.show_lobby(players);
	}

	//inbound
	function on_connect ()
	{
		this.on('disconnect', on_disconnect);
		this.on('join', on_join);
		this.on('leave', on_leave);
		this.on('ready', on_ready);
		this.on('start', on_start);
		this.on('tick', on_tick);
		this.on('away', on_away);
		this.on('back', on_back);
		pix.prompt_login();
	}

	function on_disconnect ()
	{
		oO('connection down, please wait...');
		_socket.removeAllListeners();
		_socket.on('connect', on_connect);
	}

	function on_join (name)
	{
		oO('join', name);
		_players[name] = {};
	}

	function on_leave (name)
	{
		if (_timer)
		{
			clearTimeout(_timer);
			_timer = null;
		}

		delete _players[name];
		oO('leave', name);
	}

	function on_ready (delay)
	{
		function step ()
		{
			oO(delay);
			delay--;

			if (delay > 0)
			{
				_timer = setTimeout(step, 1000);
			}
		}

		step();
	}

	function on_start (board, realm)
	{
		oO('start', realm);
		pix.show_world(board, realm);
	}

	function on_tick (time)
	{
		//oO('tick', time);
	}

	function on_away (name)
	{
		oO('away', name);
	}

	function on_back (name)
	{
		oO('back', name);
	}

	//outbound
	socket.connect = function (host)
	{
		oO('connecting', host);
		_socket = io.connect(host, {reconnect: false});
		_socket.on('connect', on_connect);
	}

	socket.emit_name = function (name)
	{
		_socket.emit('name', name, cb_name);
	}

	socket.emit_auth = function (name, pass, mail)
	{
		_name = name;
		_pass = pass;
		_socket.emit('auth', name, pass, mail, cb_auth);
	}

	socket.emit_create = function (options)
	{
		_socket.emit('create', options, cb_lobby);
	}

	socket.emit_join = function (options)
	{
		_socket.emit('join', options, cb_lobby);
	}

	socket.emit_ready = function ()
	{
		_socket.emit('ready');
	}
})();
