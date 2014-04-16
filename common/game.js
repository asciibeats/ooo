//manager: assign input tape to function & check in if/then map (if send type x then answer type y/z) function(user, game?, json)
//socket: establish connection and send receive json
//init: main; combine parts



//Wertesystem(~Moralarray;lineare Multiplikatoren;bei Tod eines Soldaten+1Punkte für Endwertung)
//Wertesystem wie drückt sich das konkret in multiplatoren von welchen aspekten 
//////aus?)kann als Karte gespielt werden und Modifiziert dann das 
//////fangt mit allen werten = 0 an. dann spielt man zb +1 auf ernten (1 power pro ernte)
////////andere karten auch mit minuswerten (immer in kombination mit pluswerten
////////gleicher größe)
////////zb -1 auf
////Endergebnis
//Bei X punkten schluss(voll geilo? bei ende metagame verhandlung um 
////fortsetzung des spieles x bis y punkte, oder irgendwelche bedingungen
//kartenmatrix der möglichen karten(mouse over anzeigen ermöglicht/braucht)
////das spiel ist wie n skilltreeweg nach dem anderen zu beschreiten

////ANGRIFF: jede runde +x offensive; offensive points can be used for layed offensive capabilties

///einfluss/power
////bekommt man für was?->zb wenn jemand untertan geworden ist)
///powerfluss: +x pro runde in local power wert
////wenn man karte in anderem land auspielt kostet die karte x 
////mult anzahlt der hops
////wenn man den seiner macht für ein land überschreitet is es eine bitte
////sonst ein befehl
////befehle nicht zu befolgen kostet irgendwass/hat eine auswirkung
////für erfüllte bitten gibts einfluss
////die kosten bezahlt immer nur der auspielende
////sind karten entweder bitte oder befehl oder kann man jede karte entweder oder
////ausspielen?
////wer eine bitte erfüllt bekommt einfluss(je nachdem man einen diplomaten hat
/////oder sowas mehr oder weniger?wieder modifikatorkarte?)
////karten können vor einsicht der beteiligten geschützt werden durch 
////modifikator karten(spion)
////zeitwert und power 1:1
////vor gesamtzeit auspielen "early" danach "late" genau "now?"
////earlier: mods werden bei späteren aktionen anderer spieler miteinbezogen
//////boost für early?
//////irgendwas spezielles für now!!
///////early:defensivbonus
///////late:offensivbonus
///////karten können entweder off oder def sein (oder beides)?
///////(auf jeden fall eins, inkl now)
/////////anschlag gelingt zb nur wenn man den nächsten now wert trifft?
/////////es zählt immer der nächste now wert für die entscheidung ob die
/////////gerade gespielten karten als offensiv oder defensiv gelten
//////bei now anfangen gibt nochmal nen boost
//////defensiv mit zeitwert anfang
//////offensiv mit zeitwert ende
//////counterespionage&diplomacy&building/espoinage&intrigue&warfare
//////early/late
//////defensive/offensiv
//////konstruktiv/destruktiv!!!
//////max aktionszeit = 5??? muss so sein daß man now nicht zu oft
//////zufällig trifft
//////karte: eine botschaft in fremdem gebiet bauen (keine roaming kosten?)

//////ALLE PERMANENTEN EFFEKTE MÜSSEN AUF MAP PRESENT SEIN ALS TILEOVERLAY
//////EIN GEBÄUDE/ETC PRO HEXFELD

//turnier von x xp bis y xp?
//freeforall bahalte xp vom letzen spiel falls du net gestorben bist
/////freeforall spieler mit höchster startxp kriegt x1 modifikator niedrigster kriegt xY "max Bonus/Handicap"
///militär is nur dazu da grund zu gewinnen(einfluss kommt anderwo her)
/////oder vielleicht behalte dein land für x power

////ein eigener powerwert für jeden gegner
//////

//SPIEL:1.Wertesystem erhöhen um Punkte generieren zu können
////////2.Aktion legen die zu triggern des wertesystemaspeskts führen
/////Wertesystem kann zu einmaligen boni oder pro runde führen?

/////es gibt karten die können (zunächst) nicht dem ausspieler zugeodnet werden
///////aber mit gegenspionage?
var common = {};
if (typeof module === 'object') module.exports = common;

// winning condition POWER (money and military translate to POWER; means game does not need a war or something)
//	var _types = {0: 0, 1: 0, 344: 3};
//	var _actions = [[0, ['hallo']], [1, ['welt']]];
//	var _mode = [[344, [[1, [2, 3]], [5, [5, 3]]]], [23, [1, 7]]];
//	var _rules = [new Rule(),,,];
//var game = require('./game.js');
//socket (this) provide socket functions/messages
(function ()
{
	common.Game = function (settings)
	{
		this.slots = settings[0];//{name,position,realm,etc.}(all player data)
		this.board = settings[1];
		this.rules = settings[2];
		//this.size = options.size || 16;
		//is it open to the public to join
		this.open = true;//temp->false

		//player stats
		//this.stats = {};
		//private player knowledge
		this.realms = {};

		//number of ticks past overall
		this.time = 0;
		//hextile types (plain, forest, mountain...)
		this.neigh = [];
		//COMBINE BOARD & BUILD!!!! -> SO KNOWLEDGE OF BOARD IMPLIES KNOWLEDGE OF BUILD TO PLAYER
		//the objects on top of tiles (trees, buildings...)
		//this.build = [];
		//this.id = util.fill(_games, this);
	}

	common.Game.prototype.join = function (stats)
	{
		if (this.open && !this.timeout && (this.number_of_players() < _MAX_PLAYERS))
		{
			console.log('JOIN %d %s', this.id, player.name);
			//replace name with some id
			this.slots[id] = player;
			player.game = this;
			socket.emit_join(player);

			if (this.number_of_players() === _MAX_PLAYERS)
			{
				this.ready();
			}

			return true;
		}
	}

	common.Game.prototype.leave = function (player)
	{
		console.log('LEAVE %d %s', this.id, player.name);

		if (this.timeout)
		{
			clearTimeout(this.timeout);
			delete this.timeout;
		}

		delete this.slots[player.name];
		delete this.stats[player.name];

		if (this.number_of_players() > 0)
		{
			socket.emit_leave(player);
		}
		else
		{
			delete _games[this.id];
		}

		player.socket.leave(this.id);
		player.game = null;
	}

	common.Game.prototype.ready = function ()
	{
		if (!this.timeout && (this.number_of_players() >= _MIN_PLAYERS))
		{
			console.log('READY %d', this.id);
			socket.emit_ready(this, _START_DELAY);
			var that = this;
			this.timeout = setTimeout(function () { that.start() }, _START_DELAY * 1000);
		}
	}

	common.Game.prototype.start = function ()
	{
		console.log('START %d', this.id);
		this.open = false;
		this.time = 1;
		delete this.timeout;

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

		socket.emit_start(this);
		var that = this;
		this.interval = setInterval(function () { that.tick() }, _TICK_LENGTH * 1000);
	}


	//difference action rule?rule = counteraction?
	////a rule does not change game data
	////an action does
	common.Game.prototype.apply = function (player, action)
	{
		this.history[this.time][player.id] = action;
		var type = action[0];
		var data = action[1];

		//validate
		//update state

		//if all players applied then run tick()
	}

	common.Game.prototype.tick = function ()
	{
		this.time++;
		console.log('TICK %d %d', this.id, this.time);

		//calc changes
		//return;
		/*for (var name in this.realms)
		{
			var realm = this.realms[name];

			while (var action = realm.actions.pop())
			{
				if (action.type == _ACTION_BUILD)
				{
					this.build(name, action.data);
				}
				else if (action.type == _ACTION_CAPTURE)
				{
				}
			}
		}*/

		socket.emit_tick(this);
	}

	var Rule = function (argv)//function(action)
	{
		this.method = rulefunc[argv[0]](argv[1]);
	}

	var Action = function (argv)//function(world)
	{
		this.method = actionfunc[argv[0]](argv[1]);
	}

	var Rulebook = function (rules)
	{
		this.rules = [];

		for (var i in rules)
		{
			this.rules.push(new Rule(rules[i]));
		}
	}

	Rulebook.add = function (i, rule)
	{
		this.rules.splice(i, 0, new Rule(rule));
	}

	Rulebook.validate = function (actions)
	{
		var result = [];

		for (var i in actions)
		{
			var action = new Action(actions[i]);
			result[i] = [];

			for (var j in this.rules)
			{
				var rule = this.rules[j];
				result[i][j] = rule.method(action);
			}
		}
	}
})();
