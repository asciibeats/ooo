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

		var SPAWN = 1;
		var SYNC = 2;
		var HOST = 3;
		var JOIN = 4;
		var LOBBY = 5;
		var TICK = 6;
		var DENY = 7;

		var SETUP = [1,2];
		var player = null;
		//PIX.open(images);
		var sockman = new t1l.Sockman();

		sockman.on(OPEN, [DENY, SYNC], function ()
		{
			console.log('OPEN');
			player = new cmn.Player();
			pix.show_login(player, this.pack(SPAWN))
		});

		sockman.on(CLOSE, [], function (code)
		{
			console.log('CLOSE %d', code);
		});

		sockman.on(SYNC, [LOBBY, TICK], function (state, setup, list)
		{
			console.log('SYNC');
			player.load(state);

			if (player.name == 'a')
			{
				pix.show_setup(setup, this.pack(HOST));
			}
			else
			{
				pix.show_lobby(list, this.pack(JOIN));
			}
		});

		sockman.on(DENY, [DENY, SYNC], function ()
		{
			console.log('DENIED');
			pix.show_login(player, this.pack(SPAWN))
		});

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
