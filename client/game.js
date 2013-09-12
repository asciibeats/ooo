game = {};

(function ()
{
	var _timer;

	game.init = function (state)//on lobby join or game reconnect
	{
		this.state = state;
		oO('state', state);

		if (state.running)
		{
			pix.game(state);
		}
		else
		{
			pix.lobby(state);
		}
	};

	game.join = function (name)//join lobby
	{
		this.state.players[name] = 0;
		pix.join(name);
	};

	game.leave = function (name)//leave lobby/game
	{
		if (_timer)
		{
			clearTimeout(_timer);
			_timer = null;
		}

		delete this.state.players[name];
		pix.leave(name);
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

	game.start = function (players, board)
	{
		oO('state', this.state);
		_timer = null;
		this.state.running = true;
		this.state.players = players;
		this.state.board = board;

		pix.game(this.state);
	};

	game.tick = function (actions, quests)
	{
		if (!this.state.board[y])
		{
			this.state.board[y] = {};
		}

		this.state.board[y][x] = this.state.card;
		this.state.turn = turn;
		this.state.card = card;

		pix.next();
	};

	game.away = function (name)
	{
	};

	game.back = function (name)
	{
	};
})();
