gui = {};

(function ()
{
	//var _timer;
	gui.init = function (state)//on lobby join or gui reconnect
	{
		this.state = state;

		if (state.time)
		{
		}
		else
		{
			pix.showLobby(state);
		}

		//oO('init', state.players);
		oO('init', state);
	}

	gui.join = function (name)//join lobby
	{
		this.state.players[name] = 0;
		oO('join', name);
		//pix.join(name);
	}

	gui.leave = function (name)//leave lobby/gui
	{
		if (_timer)
		{
			clearTimeout(_timer);
			_timer = null;
		}

		delete this.state.players[name];
		oO('leave', name);
		//pix.leave(name);
	}

	gui.ready = function (delay)//lobby countdown
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

	gui.start = function (info)
	{
		oO('START', info);
		_timer = null;
		this.info = info;

		pix.showMap(this.info);
	}

	gui.tick = function (time)
	{
		//oO('TICK', time);
		/*if (!this.state.board[y])
		{
			this.state.board[y] = {};
		}

		this.state.board[y][x] = this.state.card;
		this.state.turn = turn;
		this.state.card = card;

		pix.next();*/
	}

	gui.away = function (name)
	{
	}

	gui.back = function (name)
	{
	}

	gui.build = function (x, y, type)
	{
		this.state.build[y][x] = type;
	}

	gui.pool = function (x, y)
	{
		if (!this.state.pool[y])
		{
			this.state.pool[y] = {};
		}

		this.state.pool[y][x] = {};
		this.state.build[y][x] = _BUILD_CAMP;
		socket.emitPool(board_x, board_y);
	}
})();
