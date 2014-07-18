'use strict';
var Inter;

(function ()
{
	Inter = oO.Scene.extend(function ()
	{
	});

	Inter.method('show_login', function (callback)
	{
		//je nach player power (median aller lebenden chars) geile flammen links u rechts vom namen oder so. so decals drumrum halt:oder fpr besondere achievements
		//upleveln kann man nur durch untergebene (chars die weniger power haben und irgendwelche beziehungen haben; diplomat?)
		//hexbauten schalten karten frei->deckbuilding
		//karten haben rechargetime(manche bestimmt auch net!?=0)
		//rule: symmetric map(achse=diagonale;andere achsen braucht man nicht)
		//rule: hidden map: u dont see anything at first
		var name = prompt('name?');
		var pass = prompt('pass?');
		//var mail = prompt('mail?');
		callback(name, pass);
	});

	Inter.method('show_rules', function (ruleset, callback)
	{
		console.log('### RULES ###');
		console.log(JSON.stringify(ruleset));
		callback(ruleset[0]);
	});

	Inter.method('show_list', function (list, callback)
	{
		console.log('### LIST ###');
		console.log(JSON.stringify(list));
		callback(parseInt(prompt('id?')));
	});

	Inter.method('show_lobby', function (id, game, callback)
	{
		console.log('### LOBBY ###');
		console.log(id, JSON.stringify(game.rules));
		//callback(parseInt(prompt('id?')));
	});
})();
