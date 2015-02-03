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
	//core.instances = [['JupBix', 'core.Box', ['#444']], ['asfsdf', 'core.Sprite', ['editor', 0, {width: 64, height: 64}]], ['JupBix', 'custom.Box', ['#a0f', {width: 100, height: 100}]], ['Bllaaa', 'core.Scene', [], [['Test', 'custom.Box', ['#f00', {left: 100, width:100, top:100,height: 100}]]]]];
	core.instances = [['JupBix', 'core.Box', ['#444']]];

	//var form_args = [['String', 'name', []], ['String', 'super', ['Cell']], ['String', 'info', ['???']], ['Arguments', 'args', [[]]]];
	var form_args = [['String', ['name', 'my_name', {height: 18}]]];//

	//function buildMenu
	var EditMenu = ooo.Menu.clone();

	window.addEventListener('load', function ()
	{
		var hook = document.getElementById('hook');
		var root = new ooo.core.Root(hook, core);
		root.open();
		//root.edit_menu = new EditMenu('menu', {width: 192, height: 128});
		//root.edit_menu.reset(0, 1, 1, 1, 1, 1);
		//var edit_menu = new EditMenu('editor', {width: 192, height: 128});
		//edit_menu.reset([0, 1, 1, 1, 1, 1]);
		//root.show(edit_menu);
		//root.show(new ooo.core.Box('#f00', {top:10,width:40,left:10,height:40}));
		//root.show(new ooo.Menu('editor', [0,1,1,1], {width:128,height:128}));
		root.show(new ooo.core.Form(form_args, {width: 128, height: 64}));
	});
})();
