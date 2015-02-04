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
	core.assets = [['editor', 'assets/editor.png', 64, 64]];
	core.templates = [['custom.Box', 'core.Box', 'asdf', [['String', 'color', '#faa'], ['Layout', 'layout', []]], 'Super.call(this, color, layout); this.item = 21354;', {test: ['a', 'b', 'return a + b;']}, {on: {mouse_click: ['button', 'down_x', 'down_y', 'this.color = "#af0"; console.log(this.instance.name, this.template.name);return false;']}}]];
	var form_args = [['Integer', ['count', 0, 10, 5, {top: 0, height: 18}]], ['String', ['name', 'my_name', {top: 18, height: 18}]], ['Options', ['option', [16, 32, 64], 1, {top: 36, height: 18}]], ['Options', ['do it', [0, 1], 0, {top: 54, height: 18}]]];
	core.instances = [['JupBix', 'core.Box', ['#444']], ['MyForm', 'core.Form', [form_args, null]]];

	var EditMenu = ooo.core.Menu.clone();

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var root = new ooo.core.Root(hook, core);
		root.open();
	});
})();
