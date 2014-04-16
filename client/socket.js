royal = {};

royal.Socketman = function (state)
{
	this.state = state;
	this.events = {};
	this.sockjs = null;
}

royal.Socketman.prototype.connect = function (url)
{
	this.sockjs = new SockJS(url);
	var that = this;

	this.sockjs.onopen = function ()
	{
		that.send(_HELLO);
		console.log('OPEN');
	}

	this.sockjs.onmessage = function (string)
	{
		var data = JSON.parse(string);
		var type = data.shift();
		console.log('DATA[' + type + ']');
		that.act(type, data);
	}

	this.sockjs.onclose = function ()
	{
		console.log('CLOSE');
	}
}

royal.Socketman.prototype.send = function ()
{
	this.sockjs.send(JSON.stringify(arguments));
}

royal.Socketman.prototype.on = function (Number type, Array expect, Object action)
{
	this.events[type] = {};
	this.events[type].action = action;
	this.events[type].expect = {};

	for (var i in expect)
	{
		this.events[type].expect[expect[i]] = true;
	}
}

royal.Socketman.prototype.trigger = function (type, data)
{
	if (this.events[this.state].expect[type])
	{
		this.events[type].action.apply(this, data);
		this.state = type;
	}
}

(function ()
{
	var _NULL = 0;
	var _SPAWN = 1;
	var _ACCEPT = 2;
	var _ACTION = 3;
	var _TICK = 4;
	var _TOCK = 5;

	socket.on(_SPAWN, [_INIT], function (token, games)
	{
	});

	socket.on(_INIT, [_JOIN, _HOST], function (token, games)
	{
	});

	socket.on(_JOIN, [_LOBBY], function (token, games)
	{
	});


	//var _socket;
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
			pix.show_login();
		}
	}

	function cb_lobby (players)
	{
		pix.show_lobby(players);
	}

	//inbound
	function on_open ()
	{
		console.log('open');
		_socket.send('muddi');
	}

	function on_message (message)
	{
		console.log(JSON.stringify(message));
	}

	function on_close ()
	{
		console.log('close');
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
