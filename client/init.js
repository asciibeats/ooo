(function ()
{
	var COLOR = '#00ffdd';
	var URL = 'http://' + window.location.hostname + ':11133';

	function preload (assets, callback)
	{
		var images = {};
		var toload = Object.keys(assets).length;
		var loaded = 0;

		for (var name in assets)
		{
			images[name] = new Image();

			images[name].onload = function()
			{
				loaded++;

				if (loaded == toload)
				{
					callback(images);
				}
			};

			images[name].src = assets[name];
		}
	}

	function init (images)
	{
		var CLOSE = -2;
		var OPEN = -1;
		var NULL = 0;

		var LOGIN = 1;
		var READY = 2;
		var HOST = 3;
		var JOIN = 4;
		var LOBBY = 5;
		var TICK = 6;
		var DENY = 7;
		var LEAVE = 8;
		var AWAY = 9;
		var BACK = 10;
		var START = 11;

		var RULESET = [[2, 2, 0]];

		var name = null;
		var id = null;
		var games = {};
		//var groups = {};
		var sockman = new T1L.Sockman();
		var timeout = {};

		function ready (id, delay)
		{
			console.log('READY %d %d', id, delay);
			delay--;

			if (delay > 0)
			{
				timeout[id] = setTimeout(function () { ready(id, delay) }, 1000);
			}
			else
			{
				delete timeout[id];
			}
		}

		sockman.on(OPEN, [DENY, LOGIN], function ()
		{
			console.log('OPEN');

			pix.show_login(function ($name, pass)
			{
				name = $name;
				sockman.send([LOGIN, name, pass]);
			});
		});

		sockman.on(DENY, [DENY, LOGIN], function ()
		{
			console.log('DENY');

			pix.show_login(function ($name, pass)
			{
				name = $name;
				sockman.send([LOGIN, name, pass]);
			});
		});

		sockman.on(LOGIN, [LOBBY, JOIN], function (list)
		{
			console.log('LOGIN');

			if (name == 'a')
			{
				pix.show_rules(RULESET, function (rules)
				{
					sockman.send([HOST, rules]);
				});
			}
			else
			{
				pix.show_list(list, function (id)
				{
					sockman.send([JOIN, id]);
				});
			}
		});

		sockman.on(LOBBY, [JOIN, LEAVE, READY], function (id, rules, names)
		{
			console.log('LOBBY');
			var game = new T1L.Game(rules, names);
			games[id] = game;

			pix.show_lobby(id, game, function (id)
			{
				sockman.send([LEAVE, id]);
			});
		});

		sockman.on(JOIN, [JOIN, LEAVE, READY], function (id, name)
		{
			var game = games[id];

			if (game)
			{
				console.log('JOIN %d %s', id, name);
				game.join(name);
			}
		});

		sockman.on(LEAVE, [JOIN, LEAVE, READY], function (id, name)
		{
			var game = games[id];

			if (game)
			{
				console.log('LEAVE %d %s', id, name);
				game.leave(name);

				if (timeout[id])
				{
					clearTimeout(timeout[id]);
					delete timeout[id];
				}
			}
		});

		sockman.on(READY, [LEAVE, START], function (id, delay)
		{
			if (games[id])
			{
				ready(id, delay);
			}
		});

		sockman.on(START, [AWAY, BACK, TICK], function (id, me)
		{
			var game = games[id];

			if (game)
			{
				console.log('START %d %d', id, me);
				PIX.hide();
				PIX.show(game);
				game.start(me);
			}
		});

		sockman.on(AWAY, [AWAY, BACK, TICK], function (id, name)
		{
			console.log('AWAY %d %s', id, name);
		});

		sockman.on(BACK, [AWAY, BACK, TICK], function (id, name)
		{
			console.log('BACK %d %s', id, name);
		});

		sockman.on(TICK, [AWAY, BACK, TICK], function (id, actions)
		{
			console.log('BACK %d %s', id, actions);//actions={'a':[1,2,3],'b':[1,2]}
		});

		sockman.on(CLOSE, [], function (code)
		{
			console.log('CLOSE %d', code);
		});

		//PIX.show(new T1L.Intro('#ff0000'));
		var game = new T1L.Game([2, 8], ['a', 'b']);
		PIX.show(game);
		PIX.open(images);
		game.start(0);
		game.reveal({0:{0:8},5:{1:2,2:2,3:2},1:{1:2,2:2},3:{1:2,2:2},4:{1:2,2:1,3:1},2:{1:1,2:1,3:2}});
		//game.progress([]);
		game.build({1:{1:0},2:{2:1}});
		//var path = game.board.path(game.board.tiles[1][1], game.board.tiles[5][3]);
		//console.log(path.cost);
		//sockman.connect(URL);
	}

	function load ()
	{
		PIX.init({color: COLOR, fullscreen: true});
		var assets = {hexbg: 'assets/hexbg.png'};
		preload(assets, init);
	}

	function unload ()
	{
	}

	window.addEventListener('load', load);
	window.addEventListener('unload', unload);
})();
