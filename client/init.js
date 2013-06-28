(function ()
{
	var _COLOR = '#ffff00';
	//var _HOST = 'http://localhost:11133';
	var _HOST = 'http://93.208.48.97:11133';

	function init (images)
	{
		
		hide_pix.open(images);
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
		hide_pix.init(_COLOR);
		hide_socket.connect(_HOST);
		
		var assets =
		{
			/*anafi: 'assets/anafi.jpg',
			velika: 'assets/velika.jpg',
			tiles: 'assets/tileset.png',
			builds: 'assets/buildings.png',
			options: 'assets/options.png',*/
			buttons: '/assets/buttons.png'
		};

		preload(assets, init);
	};

	window.addEventListener('load', on_load);
	//window.addEventListener('unload', on_unload);
})();
