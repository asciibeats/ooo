socket = {};

(function ()
{
	//var _host;
	var _socket;
	var _name;
	var _pass;
	var _auth = false;//temp
	//var _time_sync = 0;

	//events
	function on_connect ()
	{
		this.on('disconnect', on_disconnect);

		if (_auth)//if credentials in local storage
		{
			oO('...geht weiter');
			//game.note_hide();
			_socket.emit('auth', _name, _pass, null, on_init);
		}
		else
		{
			pix.promptLogin();
		}
	}

	function on_init (state)
	{
		if (state)
		{
			_auth = true;
			//save credentials to local storage

			this.on('join', function (name) { game.join(name) });
			this.on('leave', function (name) { game.leave(name) });
			this.on('ready', function (delay) { game.ready(delay) });
			this.on('start', function (state) { game.start(state) });
			this.on('tick', function (time) { game.tick(time) });
			this.on('pool', function (x, y, type) { game.pool(x, y, type) });
			this.on('away', function (name) { game.away(name) });
			this.on('back', function (name) { game.back(name) });

			game.init(state);
		}
		else
		{
			oO('access denied');
			pix.promptLogin();
		}
	}

	function on_disconnect ()
	{
		oO('connection down, please wait...');
		//game.note_show('bla');
		_socket.removeAllListeners();
		_socket.on('connect', on_connect);
	}

	socket.connect = function (host)
	{
		oO('connecting', host);
		_socket = io.connect(host, {reconnect: false});//, {reconnect: false}
		_socket.on('connect', on_connect);
	}

	socket.emit_pool = function (x, y, type)
	{
		if (_name == 'tilla')
		{
			_socket.emit('pool', 0, 0, 0);
		}
		else
		{
			_socket.emit('pool', 1, 1, 1);
		}

		//_socket.emit('pool', x, y, type);
	}

	socket.emit_auth = function (name, pass, mail)
	{
		_name = name;
		_pass = pass;
		_socket.emit('auth', name, pass, mail, on_init);
	}

	socket.emit_ready = function ()
	{
		_socket.emit('ready');
	}

	socket.emit_turn = function (x, y)
	{
		_socket.emit('turn', x, y);
	}
})();
