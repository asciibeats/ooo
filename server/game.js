var _NMASK = [[[-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]], [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 0]]];

function Game (settings)
{
	//map size
	this.size = settings[0];
	//is it open to the public to join
	this.open = true;//temp->false

	//joined players
	//player objectreferences
	this.slots = {};
	//player stats
	this.stats = {};
	//private player knowledge
	this.realms = {};

	//number of ticks past overall
	this.time = 0;
	//hextile types (plain, forest, mountain...)
	this.board = [];
	this.neigh = [];
	//COMBINE BOARD & BUILD!!!! -> SO KNOWLEDGE OF BOARD IMPLIES KNOWLEDGE OF BUILD TO PLAYER
	//the objects on top of tiles (trees, buildings...)
	//this.build = [];
	this.id = util.fill(_games, this);
}

module.exports = Game;

Game.prototype.empty = function ()
{
	return (Object.keys(this.slots).length === 0);
}

Game.prototype.full = function ()
{
	return (Object.keys(this.slots).length === this.num_slots);
}

Game.prototype.join = function (id, power)
{
	if (this.open && !this.full() && !this.slots[id])
	{
		this.slots[id] = {};
		return true;
	}
}

Game.prototype.leave = function (id)
{
	if (this.open && this.slots[id])
	{
		delete this.slots[id];
		return true;
	}
}

Game.prototype.start = function ()
{
	this.open = false;
	this.time = 1;

	//generate random board
	for (var y = 0; y < _SIZE; y++)
	{
		this.board[y] = [];
		this.neigh[y] = [];

		for (var x = 0; x < _SIZE; x++)
		{
			var tile = {};
			tile.x = x;
			tile.y = y;
			tile.type = Math.floor(Math.random() * 4) + 1;
			this.board[y][x] = tile;
			this.neigh[y][x] = [];
		}
	}

	//build up neighbor connections
	for (var y = 0; y < _SIZE; y++)
	{
		var nmask = _NMASK[y & 1];

		for (var x = 0; x < _SIZE; x++)
		{
			var neigh = this.neigh[y][x];

			for (var i in nmask)
			{
				var nx = (x + nmask[i][0] + _SIZE) % _SIZE;
				var ny = (y + nmask[i][1] + _SIZE) % _SIZE;
				neigh[i] = this.board[ny][nx];
			}
		}
	}

	//generate random build
	/*var seeds = [];

	for (var i = 0; i < 5; i++)
	{
		seeds[i] = {x: Math.floor(Math.random() * _SIZE * 2), y: Math.floor(Math.random() * _SIZE * 2)};
	}

	for (var y = 0; y < _SIZE * 2; y++)
	{
		this.build[y] = [];

		for (var x = 0; x < _SIZE * 2; x++)
		{
			var type = Math.round(Math.random() * 12);

			if (type > 6)
			{
				this.build[y][x] = type - 6;
			}
			else
			{
				this.build[y][x] = 0;
			}
		}
	}*/

	//assign startingpoint (and hero) to each player
	//separieren:was alle wissen(allgemeines)/spielerwissen/serverdata
	var id = 0;
	var x = 0;
	var y = 0;

	for (var name in this.slots)
	{
		var realm = {};
		realm.id = id;
		realm.x = x;
		realm.y = y;
		realm.name = 'Mordor';
		
		realm.population = {count: 10, stats: {anger: 0, health: 1}};
		realm.characters = [];
		realm.succession = [];

		realm.gain = 10;
		realm.affect = {};
		realm.affect[id] = 5;//rest geht in entdeckung?
		realm.coins = {};
		realm.coins[id] = 5;
		realm.discover = 5;
		this.realms[name] = realm;
		var neigh = this.neigh[y][x];

		for (var i in neigh)
		{
			neigh[i].realm = id;
		}

		id++;
	}

}

Game.prototype.tick = function (id, actions)
{
	if (this.running && this.slots[id])
	{
		//this.slots[id].time++;
		return true;
	}
}

Game.prototype.tock = function ()
{
	if (this.running && this.slots[id])//wenn alle ticks da sind
	{
		//update game
		return true;
	}
}

Game.prototype.build = function (name, data)
{
	//verify consitency
	////if no build at that place und player darf da
	//raise updated-flag
	this.update.build.push(tile);
	//update game
	this.board[action.y][action.x].type = 7;
}

Game.prototype.reveal = function (name, x, y)
{
	util.add(this.realms[name].board, this.board[y][x], y, x);
}

Game.prototype.capture = function (name, x, y)
{
	this.board[y][x].realm = name;
}

Game.prototype.retreat = function (tile)
{
	delete this.board[y][x].realm;
}
