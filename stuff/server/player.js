function Player (id, pass)//child of Layer
{
	this.id = id;//unique
	this.pass = pass;
	//this.mail = mail;
	this.socket = null;
	this.games = [];
	//this.options = [_INIT];
	//this.expect = [];
	//this.friends = {};
	//this.played = 1;//number of games
	//this.seeked = 1;//times played as seeker(ones because division by zero stuff)
}

module.exports = Player;

Player.prototype.login = function (socket)
{
	this.socket = socket;

	if (this.game)
	{
		console.log('BACK %d %s', this.game.id, this.name);
		this.socket.join(this.game.id);
		socket.emit_back(this);
		return this.game;
	}
}

Player.prototype.stats = function ()
{
	return {};
}

Player.prototype.create_game = function (options)
{
	var game = new Game(options);
	console.log('CREATE %d %s', game.id, this.name);
	game.join(this);
	return game;
}

Player.prototype.join_game = function (options)
{
	for (var id in _games)
	{
		if (_games[id].join(this))
		{
			return this.game;
		}
	}

	return this.create_game();
}

/*Player.prototype.ratio = function ()
{
	return (this.played / this.seeked);
};*/

Player.prototype.logout = function ()
{
	if (this.game)
	{
		if (this.game.time)
		{
			console.log('AWAY %d %s', this.game.id, this.name);
			socket.emit_away(this);
		}
		else
		{
			this.game.leave(this);
		}
	}

	this.socket = null;
}
