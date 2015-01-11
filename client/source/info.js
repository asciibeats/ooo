'use strict';
var INFO = {};

if (typeof module == 'object')
{
	module.exports = INFO;
	var ooc = require('./ooc.js');
}

/*var GROUPS = [];
GROUPS[0] = 'Terrain';
GROUPS[1] = 'Spawns';
GROUPS[2] = 'Characters';
GROUPS[3] = 'Items';
GROUPS[4] = 'Events';*/

(function ()
{
	var Info = ooc.Class.extend(function (id, group, title, param, state)
	{
		this.id = id;
		this.group = group;
		this.title = title;
		this.param = param;
		this.state = state;
	});

	var Terrain = Info.extend(function (id, title, state)
	{
		Info.call(this, id, 0, title, ['visibility', 'obfuscation', 'obstruction'], state);
	});

	var Character = Info.extend(function (id, title, state)
	{
		Info.call(this, id, 2, title, ['visibility', 'obfuscation', 'range', 'insight'], state);
	});

	var Item = Info.extend(function (id, title, state)
	{
		Info.call(this, id, 3, title, ['visibility', 'obfuscation'], state);
	});

	var Action = Info.extend(function (id, title, state, cost)
	{
		Info.call(this, id, 4, title, ['visibility', 'obfuscation'], state);
		this.cost = cost;
	});

	INFO[1] = new Terrain(1, 'Grassland', [0, 0, 1]);
	INFO[2] = new Terrain(2, 'Forest', [0, 4, 3]);
	INFO[9] = new Character(9, 'Hero', [1, 1, 10, 5]);
	INFO[8] = new Item(8, 'Apple', [1, 1]);
	INFO[11] = new Action(11, 'Fireplace', [1, 1], {0: 1});
})();
