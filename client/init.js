(function ()
{
	var _COLOR = '#dddddd';
	var _HOST = 'http://' + window.location.hostname + ':11133';

	function init (images)
	{
		pix.open(images);
	};

	function preload (assets, callback)
	{
		var images = {};
		var toload = oO.size(assets);
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
	};

	function on_load ()
	{
		pix.init(_COLOR);
		socket.connect(_HOST);

		var assets =
		{
			hexbg: '/assets/hexbg.png'
		};

		preload(assets, init);
	};

	function on_unload ()
	{
	}

	window.addEventListener('load', on_load);
	window.addEventListener('unload', on_unload);
})();
