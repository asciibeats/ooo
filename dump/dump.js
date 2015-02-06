var InstanceTab = ooo.core.Form.extend();

//InstanceTab.method('

var Editor = ooo.core.Scene.extend(function ()
{
	ooo.core.Scene.call(this);
	this.show(new ooo.core.Box('#0fa'), 0);
	var tab_menu = new ooo.extra.TabMenu(this, 1, 'editor', OOO_TOP, {width: 256, bottom: 16, height: 64});
	this.instance_tab = new InstanceTab([]);
	tab_menu.open(0, this.instance_tab);
	//tab_menu.open(1, new ooo.core.Box('#af0'));
	//tab_menu.open(2, new ooo.core.Box('#0fa'));
	//tab_menu.open(3, new ooo.core.Box('#a0f'));
	this.show(tab_menu, 2);
});

Editor.method('update', function (instance)
{
	this.instance_tab.content(instance.template[3]);
});
