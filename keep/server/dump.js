

var _actions = {};
var _expect = {};
var _expect[_PLAYER] = {};
var _expect[_GAME] = {};

_recv[_INIT] = function (game, )
{
	//data validieren!!!
	var game = _games[game];
	game.options = [];//no options, just wait
	game.expect = [_HOST, _JOIN, _WATCH];//wait for
	return [_HELLO];//antwort
}

_recv[_HELLO] = function (player, data)
{
	//data validieren!!!
	player.options = [_HOST, _JOIN, _WATCH];//prompt for select
	player.expect = [];//host is just waiting
	return null;
}

socket.send(time, type, data);
socket.recv(time, type, data);

function recv (player, type, data)
{
	_recv[type](player, data)
}

_recv[_HOST] = function (player, data)
{
	//data validieren!!!
	player.focus = player.games.length;
	player.games.push(new Game(data, true));
	player.expect = [_JOIN, _WATCH];
	return null;
}

_recv[_JOIN] = function (player, data)
{
	//data validieren!!!
	player.focus = player.join.length;
	player.games.push(new Game(data));
	player.expect = [_READY];
	return null;
}

_recv[_WATCH] = function (player, settings)
{
	player.focus = player.join.length;
	player.join.push(new Game(settings));
	return [_READY];
}

_recv[_LEAVE] = function (player, settings)
{
	player.focus = player.join.length;
	player.join.push(new Game(settings));
	return [_READY];
}

_recv[_READY] = function (game, data)
{
	player.options = [_START];//no options, just wait
	player.expect = [_HOST, _JOIN, _WATCH];//wait for
	return [_READY];
}

_recv[_START] = function (player, args)
{
	var game = new Game(data);
	_games[id] = game;
	player.games.push(new Game(data, true));
	return [_HOST, _JOIN];
}

_recv[_TICK] = function (player, data)
{
	player.options = [_TOCK];//no options, just wait
	player.expect = [_TICK];//wait for
	return [_READY];
}

_recv[_TOCK] = function (player, data)
{
	player.options = [_START];//no options, just wait
	player.expect = [_HOST, _JOIN, _WATCH];//wait for
	return [_READY];
}

var _admin = {};

_admin[_HOST] = function (settings)
{
	console.log('HOST %s', settings.toString());
	return this.game.host(settings);
}

_admin[_JOIN] = function (host)
{
	console.log('HOST %s', settings.toString());
	var game = _players[host].game;
	return game.join(stats);
}

_admin[_TICK] = function (host, actions)
{
	console.log('HOST %s', settings.toString());
	var game = _players[host].game;
	return game.tick(this.id, actions);
}

function step(type, expect, impact)
{
	_actions[type] = {};
	_actions[type].expect = {};

	for (var i in expect)
	{
		_actions[type].expect[expect[i]] = true;
	}

	_actions[type].impact = impact;
}

function next(player, type, data)
{
	if (_expect[player.id][type])
	{
		_actions[type].impact(player, data);
		_expect[player] = _actions[type].expect;
	}
	else
	{
		console.log('UNEXPECTED %s', player.id);
	}
}

function last()
{
	//history back
}

