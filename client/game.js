//player = {};
game = {};

(function ()
{
	var _timer;

	game.init = function (state)//on lobby join or game reconnect
	{
		this.state = state;

		if (state.time)
		{
			pix.showMap(state);
		}
		else
		{
			pix.showLobby(state);
		}

		oO('init', state);
	};

	game.join = function (name)//join lobby
	{
		this.state.players[name] = 0;
		oO('join', name);
		//pix.join(name);
	};

	game.leave = function (name)//leave lobby/game
	{
		if (_timer)
		{
			clearTimeout(_timer);
			_timer = null;
		}

		delete this.state.players[name];
		oO('leave', name);
		//pix.leave(name);
	};

	game.ready = function (delay)//lobby countdown
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
	};

	game.start = function (state)
	{
		oO('START', state);
		_timer = null;
		this.state = state;

		pix.showMap(this.state);
		var origin = pix.promptPool(this.state.origins);
		socket.emit_origin(origin);
	};

	game.tick = function (time)
	{
		oO('TICK', time);
		/*if (!this.state.board[y])
		{
			this.state.board[y] = {};
		}

		this.state.board[y][x] = this.state.card;
		this.state.turn = turn;
		this.state.card = card;

		pix.next();*/
	};

	game.spawn = function (x, y, origin)
	{
		oO('ORIGIN', origin);

		if (!this.state.origins[y])
		{
			this.state.origins[y] = {};
		}

		this.state.origins[y][x] = origin;
	};

	game.away = function (name)
	{
	};

	game.back = function (name)
	{
	};
})();
