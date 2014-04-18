(function ()
{
	var COLOR = '#dddddd';
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

	function connect (images)
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

		var player = null;
		//var games = null;
		var sockman = new t1l.Sockman();
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
			player = new t1l.Player();
			pix.show_login(player, this.pack(LOGIN))
		});

		sockman.on(LOGIN, [LOBBY, JOIN], function (state, rules, list)
		{
			console.log('LOGIN');
			//player.load(state);
			//rule: symmetric map(achse=diagonale;andere achsen braucht man nicht)
			//rule: hidden map: u dont see anything at first

			if (player.name == 'a')
			{
				pix.show_rules(rules, this.pack(HOST));
			}
			else
			{
				pix.show_list(list, this.pack(JOIN));
			}
		});

		sockman.on(DENY, [DENY, LOGIN], function ()
		{
			console.log('DENIED');
			pix.show_login(player, this.pack(LOGIN))
		});

		sockman.on(LOBBY, [JOIN, LEAVE, READY], function (id, rules, map)
		{
			console.log('LOBBY');
			//games[id] = new Game(rules, map);
			pix.show_lobby(id, rules, map, this.pack(LEAVE));
		});

		sockman.on(JOIN, [JOIN, LEAVE, READY], function (id, name)
		{
			console.log('JOIN %d %s', id, name);
			//games[id].join(name);
		});

		sockman.on(LEAVE, [JOIN, LEAVE, READY], function (id, name)
		{
			console.log('LEAVE %d %s', id, name);
			//games[id].leave(name);

			if (timeout[id])
			{
				clearTimeout(timeout[id]);
				delete timeout[id];
			}
		});

		sockman.on(READY, [LEAVE, START], function (id, delay)
		{
			ready(id, delay);
		});

		sockman.on(START, [AWAY, BACK, TICK], function (id)
		{
			console.log('START %d', id);
			//pix.show_start(id, this.pack(TICK));
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

		//PIX.open(images);
		sockman.connect(URL);
	}

	function load ()
	{
		PIX.init({color: COLOR, fullscreen: true});
		var assets = {hexbg: 'assets/hexbg.png'};
		preload(assets, connect);
	}

	function unload ()
	{
	}

	window.addEventListener('load', load);
	window.addEventListener('unload', unload);
})();
