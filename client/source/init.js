'use strict';
(function ()
{
	///TODO
	//menu (eins für alle daß on mouseover immer woanders auftaucht)
	///rechts unten 16*16 (klein)
	////1.button [+] to add child (default: Box('#aaa', {left: 10, right: 10, top: 10, bottom: 10}))
	////2.button [x] to delete
	////3.button [*(zahnrad)] to edit name, class, argv, layout (updates instantaneous!)
	//////edit menu ist global rechts (von oben bis unten; alles ausser schrift transparent)?!
	var core = {};
	core.title = '';
	core.templates = [['custom.Box', 'core.Box', 'asdf', [['String', 'color', '#faa'], ['Layout', 'layout', null]], 'Super.call(this, color, layout); this.item = 21354;', {test: ['a', 'b', 'return a + b;']}, {on: {mouse_click: ['button', 'down_x', 'down_y', 'this.color = "#af0"; console.log(this.instance.name, this.template.name);return false;']}}]];
	core.instances = [['JupBix', 'core.Box', ['#444']], ['JupBix', 'custom.Box', ['#a0f', {width: 100, height: 100}]], ['Bllaaa', 'core.Scene', [], [['Test', 'custom.Box', ['#f00', {left: 100, width:100, top:100,height: 100}]]]]];

	var menu = [['String', 'name', null], ['String', 'super', 'Cell'], ['String', 'info', '???'], ['Arguments', 'args', []]];

	//function buildMenu

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var root = new ooo.core.Root(hook, core);
		root.open();
	});
})();
