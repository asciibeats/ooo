(function ()
{
	var _COLOR = '#dddddd';
	var _HOST = 'http://' + window.location.hostname + ':11133';

	function connect (images)
	{
		PIX.open(images);
		socket.connect(_HOST);
	}

	function load ()
	{
		PIX.init({color: _COLOR, fullscreen: true});
		var assets = {hexbg: '/assets/hexbg.png'};
		util.preload(assets, connect);
	}

	function unload ()
	{
	}

	window.addEventListener('load', load);
	window.addEventListener('unload', unload);
})();
