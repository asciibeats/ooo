(function ()
{
	var _COLOR = '#ffffff';
	var _HOST = 'http://' + window.location.hostname + ':11133';

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
		//hide_socket.connect(_HOST);

		var assets =
		{
			lane: '/assets/lane.png'
		};

		preload(assets, init);
	};

	window.addEventListener('load', on_load);
	//window.addEventListener('unload', on_unload);
})();
