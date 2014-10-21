'use strict';
////dreams depend on items&skills&node wichtig ist daß man wissen kann was kommen wird
//erst alle looks dann anderes? usw?
//home.items.chest.push();
//traum deuten/trigger one time events

//CHOOSE ABORT CONDITION FOR EVERY CHAR!!!!

(function ()
{
	var World = oui.TileMap.extend(function (size, tile_w, tile_h, type, layout)
	{
		oui.TileMap.call(this, size, tile_w, tile_h, type, layout);
	});

	World.method('Data', function (map, i, x, y)
	{
		this.type = 0;
	});

	World.method('drawTile', function (tile, time, context)
	{
		context.drawImage(this.image, this.coords[tile.data.type][0], this.coords[tile.data.type][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
	});

	World.method('reveal', function (info)
	{
		for (var i = 0; i < info.length; i++)
		{
			var node = new Node(info[i]);
			this.info[node.id] = node;
			this.info[node.parent].children[node.id] = node;
		}
	});

	World.method('spawn', function (argv)
	{
		var id = this.chars.length;
		this.chars[id] = new Char(id, argv[0], ooo.map(STATNAMES, argv[1]), this.index[argv[2]], argv[3], argv[4]);
	});

	var Login = oui.Form.extend(function (color, font, layout, align, baseline)
	{
		oui.Form.call(this, color, font, layout, align, baseline);
		this.show(new oui.Field('auth', {'top': 10, 'left': 10, 'right':10, 'height': 30}));
		this.show(new oui.Field('auth', {'top': 50, 'left': 10, 'right':10, 'height': 30}));
		this.show(new oui.Submit('login', '#a50', {'top': 90, 'left': 10, 'right':10, 'height': 30}));
	});

	Login.bubble('form:submit', function (type, data)
	{
		this.root.auth = data;
		this.root.send('login', data);
	});

	var Game = ooo.Class.extend(function (rules, names)
	{
		this.rules = rules;
		this.players = {};

		for (var i = 0; i < names.length; i++)
		{
			this.players[names[i]] = true;
		}

		//this.world = [];//common data
		//this.seats = {};
		//this.realms = [];
		this.time = 0;
		this.info = [];//0 ist aktuell
	});

	Game.method('join', function (player)
	{
	});

	Game.method('leave', function (player)
	{
	});

	Game.method('start', function ()
	{
	});

	Game.method('tock', function ()
	{
	});

	//bubble:type/capture:type
	//prepare:type/resolve:type

	var Client = ooo.Client.extend(function (url, hook, assets, color)
	{
		ooo.Client.call(this, url, hook, assets, color);
		this.forms = {};
		this.forms.login = new Login('#5a0', '30px sans-serif', {'width': 200, 'height': 130}).center(100, 65).rotate(-10);
		this.show(new ooo.Box('#a0a'));
	});

	Client.on('socket:open', function ()
	{
		var auth = ooo.getLocal('auth');

		if (auth)
		{
			this.auth = auth;
			this.send('login', auth);
		}
		else
		{
			this.show(this.forms.login);
		}
	});

	Client.on('socket:close', function (code)
	{
		console.log('CLOSED %s', code);
	});

	Client.on('message:deny', function ()
	{
		this.forms.login.reset();
	});

	Client.on('message:grant', function (games)
	{
		this.forms.login.hide();
		ooo.setLocal('auth', this.auth);

		if (ooo.size(games) > 0)
		{
			var id = parseInt(prompt('choose from: ' + JSON.stringify(games), '0'));
			var rules = games[id][0];
			var names = games[id][1];
			names.push(this.auth[0]);
			this.game = new Game(rules, names);
			this.send('join', [id]);
		}
		else
		{
			var rules = JSON.parse(prompt('type rules:', '[1,8]'));
			var names = [this.auth[0]];
			this.game = new Game(rules, names);
			this.send('host', [rules]);
		}
	});

	Client.on('message:join', function (name)
	{
		console.log('JOIN %s', name);
		this.game.players[name] = true;
	});

	Client.on('message:leave', function (name)
	{
		console.log('LEAVE %s', name);
		delete this.game.players[name];

		if (this.timeout)
		{
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	});

	Client.on('message:ready', function (delay)
	{
		console.log('READY %d', delay);
		delay--;

		if (delay > 0)
		{
			var that = this;
			this.timeout = setTimeout(function () { that.events.on['message:ready'].call(that, delay) }, 1000);
		}
		else
		{
			delete this.timeout;
		}
	});

	//Client
	function actionprompt ()
	{
		if (this.auth[0] == 'a')
		{
			var preset = [['tilla', [5, 8, 1], 0, 6, [[[], 2], [[]], [[], 2], [[]]]]];
		}
		else
		{
			var preset = [['pantra', [3, 7, 5], 43, 7, [[[], 3], [[]]]]];
		}

		var chars = prompt('do something:', JSON.stringify(preset));

		if (chars)
		{
			var other = [];
			this.send('tick', [JSON.parse(chars), other]);
		}
	}

	Client.on('message:start', function (info)
	{
		console.log('START %s', JSON.stringify(arguments));
		var realm = {};
		realm.time = 0;
		realm.info = info;
		realm.chars = [];
		this.game.realm = realm;
		this.world = new World(this.game.rules[1], 64, 64, 'steps');
		this.show(this.world);
		actionprompt.call(this);
	});

	Client.on('message:continue', function (rules, names, time, rtime, info, chars)
	{
		console.log('CONTINUE %s', JSON.stringify(arguments));
		this.forms.login.hide();
		ooo.setLocal('auth', this.auth);
		this.game = new Game(rules, names);
		this.game.time = time;
		var realm = {};
		realm.time = rtime;
		realm.info = info;
		realm.chars = chars;
		this.game.realm = realm;
		this.world = new World(this.game.rules[1], 64, 64, 'steps');
		this.show(this.world);

		if (time == rtime)
		{
			actionprompt.call(this);
		}
	});

	Client.on('message:away', function (name)
	{
		console.log('AWAY %s', name);
	});

	Client.on('message:back', function (name)
	{
		console.log('BACK %s', name);
	});

	Client.on('message:tock', function (info, chars)
	{
		console.log('TOCK');
		this.game.realm.time++;
		this.game.realm.info = info;
		this.game.realm.chars = chars;
		this.game.time++;
		actionprompt.call(this);
	});

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var assets = {};
		assets['steps'] = 'assets/steps.png';
		var jupiter = new Client('http://10.0.0.19:11133', hook, assets, '#444');
	});
})();
