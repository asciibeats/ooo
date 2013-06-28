hide_game = {};

(function ()
{
	var _name;
	var _state;
	var _timer;

	hide_game.init = function (state)//on lobby join or game reconnect
	{
		_state = state;
		oO('state', state);

		if (state.running)
		{
			hide_pix.show_game(state);
		}
		else
		{
			hide_pix.show_lobby(state);
		}
	};

	hide_game.join = function (name)//join lobby
	{
		_state.players[name] = 0;
		hide_pix.join(name);
	};

	hide_game.leave = function (name)//leave lobby/game
	{
		if (_timer)
		{
			clearTimeout(_timer);
			_timer = null;
		}

		delete _state.players[name];
		hide_pix.leave(name);
	};

	hide_game.ready = function (delay)//lobby countdown
	{
		function step ()
		{
			oO(delay);//(((TICK/PING)))
			delay--;

			if (delay > 0)
			{
				_timer = setTimeout(step, 1000);
			}
		}

		step();
	};

	hide_game.start = function (players, board, turn, card)
	{
		_timer = null;
		_state.running = true;
		_state.players = players;
		_state.board = board;
		_state.turn = turn;
		_state.card = card;

		hide_pix.show_game(_state);
	};

	hide_game.turn = function (x, y, turn, card)
	{
		if (!_state.board[y])
		{
			_state.board[y] = {};
		}

		_state.board[y][x] = _state.card;
		_state.turn = turn;
		_state.card = card;

		hide_pix.next_turn();
	};

	hide_game.away = function (name)
	{
	};

	hide_game.back = function (name)
	{
	};
})();