'use strict';
(function ()
{
	if (!localStorage.users)
	{
		localStorage.users = JSON.stringify({});
	}

	var COLOR = '#444444';
	//var URL = 'http://' + window.location.hostname + ':11133';
	var URL = 'http://10.0.0.19:11133';
	var root;

	//SOCKMAN
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
	var TOCK = 12;
	var CONTINUE = 13;

	var RULESET = [[2, 16, 0]];

	var localname;
	var localpass;
	var games = {};
	//var groups = {};
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

	function init (images)
	{
		root.open(images);
		var socket = new oO.Socket(URL);
		var inter = new Inter();

		socket.on(OPEN, [DENY, LOGIN, CONTINUE], function ()
		{
			console.log('OPEN');

			var users = JSON.parse(localStorage.users);

			for (var name in users)
			{
				var user = users[name];

				if (user.offline)
				{
					console.log('LOCAL %s %s', name, user.pass);
					socket.send([LOGIN, name, user.pass]);
					localname = name;
					localpass = user.pass;
					return;
				}
			}

			inter.show_login(function (name, pass)
			{
				console.log('PROMPT %s %s', name, pass);
				socket.send([LOGIN, name, pass]);
				localname = name;
				localpass = pass;
			});
		});

		socket.on(DENY, [DENY, LOGIN, CONTINUE], function ()
		{
			console.log('DENY');

			inter.show_login(function ($name, pass)
			{
				name = $name;
				socket.send([LOGIN, name, pass]);
			});
		});

		socket.on(LOGIN, [LOBBY, JOIN], function (list)
		{
			var users = JSON.parse(localStorage.users);
			users[localname] = {pass: localpass, offline: false};
			localStorage.users = JSON.stringify(users);
			var host = confirm("HOST?");

			if (host)
			{
				inter.show_rules(RULESET, function (rules)
				{
					socket.send([HOST, rules]);
				});
			}
			else
			{
				inter.show_list(list, function (id)
				{
					socket.send([JOIN, id]);
				});
			}
		});

		socket.on(LOBBY, [JOIN, LEAVE, READY], function (id, rules, names, terrain)
		{
			console.log('LOBBY %s %s', JSON.stringify(rules), JSON.stringify(names));
			var game = new Game(rules, names, terrain);
			games[id] = game;
			root.show(game);

			inter.show_lobby(id, game, function (id)
			{
				socket.send([LEAVE, id]);
			});
		});

		socket.on(JOIN, [JOIN, LEAVE, READY], function (id, name)
		{
			var game = games[id];

			if (game)
			{
				console.log('JOIN %d %s', id, name);
				game.join(name);
			}
		});

		socket.on(LEAVE, [JOIN, LEAVE, READY], function (id, name)
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

		socket.on(READY, [LEAVE, START], function (id, delay)
		{
			if (games[id])
			{
				ready(id, delay);
			}
		});

		socket.on(START, [AWAY, BACK, TOCK], function (id, time, seat, realm)
		{
			var game = games[id];

			if (game)
			{
				console.log('START %d %d %d %s', id, time, seat, JSON.stringify(realm));

				game.start(time, seat, realm, function (quests)
				{
					socket.send([TICK, id, quests]);
				});
			}
		});

		socket.on(CONTINUE, [AWAY, BACK, TOCK], function (id, rules, names, terrain, time, seat, realm)
		{
			var users = JSON.parse(localStorage.users);
			users[localname] = {pass: localpass, offline: false};
			localStorage.users = JSON.stringify(users);

			console.log('CONTINUE %d %d %d %s', id, time, seat, JSON.stringify(realm));
			var game = new Game(rules, names, terrain);
			games[id] = game;
			root.show(game);

			game.start(time, seat, realm, function (quests)
			{
				socket.send([TICK, id, quests]);
			});
		});

		socket.on(AWAY, [AWAY, BACK, TOCK], function (id, name)
		{
			console.log('AWAY %d %s', id, name);
		});

		socket.on(BACK, [AWAY, BACK, TOCK], function (id, name)
		{
			console.log('BACK %d %s', id, name);
		});

		socket.on(TOCK, [AWAY, BACK, TOCK], function (id)
		{
			var game = games[id];

			if (game)
			{
				game.tock();
				console.log('TOCK %d %d', id, game.time);
			}
		});

		socket.on(CLOSE, [], function (code)
		{
			console.log('CLOSE %d', code);
		});
	}

	function load ()
	{
		console.log('USERS %s', JSON.stringify(localStorage.users));
		var hook = document.getElementById('hook');
		root = new oO.Root(hook, COLOR);
		var assets = {tiles: 'assets/tiles.png', hexbg: 'assets/hexbg.png', chars: 'assets/chars.png', items: 'assets/items.png', skills: 'assets/skills.png', buttons: 'assets/buttons.png'};
		preload(assets, init);
	}

	function unload ()
	{
		var users = JSON.parse(localStorage.users);

		if (users[localname])
		{
			users[localname].offline = true;
			localStorage.users = JSON.stringify(users);
		}
	}

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
			}

			images[name].src = assets[name];
		}
	}

	window.addEventListener('load', load);
	window.addEventListener('unload', unload);
})();
