'use strict';
var OUI_BOTTOM = 1;
var OUI_REVERSED = 2;
var OUI_VERTICAL = 4;
var oui = {};
//reset blink on input field tab jump
//optimize findPath to use multiple origins

(function ()
{
	var SQR_NMASK = [[0, -1], [1, 0], [0, 1], [-1, 0]];
	var HEX_NMASK = [[[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]], [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]]];

	oui.Form = ooo.Scene.extend(function (color, font, layout, align, baseline)
	{
		ooo.Scene.call(this, layout);
		this.color = color || '#f00';
		this.font = font || '24px sans-serif';
		this.align = align || 'start';
		this.baseline = baseline || 'top';
	});

	oui.Form.method('show', function (actor, index)
	{
		ooo.Scene.prototype.show.call(this, actor, index);

		//focus on first input added
		if ((this.focus == undefined) && (actor instanceof oui.Input))
		{
			this.focus = actor;
			console.log(actor.index);
			//actor.toggle();
		}

		return this;
	});

	oui.Form.method('reset', function ()
	{
		//this.focus.toggle();
		delete this.focus;

		for (var index = 0; index < this.children.length; index++)
		{
			var actor = this.children[index];

			if ((actor != undefined) && (actor instanceof oui.Input))
			{
				this.focus = actor;
				//actor.toggle();
				break;
			}
		}

		this.trigger('form_reset');
	});

	oui.Form.capture('input_press', function (time, char, key, shift)
	{
		if (key == 13)//tab
		{
			this.trigger('form_submit', [null, {}]);
			return false;
		}
		else if (key == 9)//tab
		{
			//this.focus.toggle();
			var index = this.focus.index;
			var length = this.children.length;

			do
			{
				index = ooc.wrap(shift ? index - 1 : index + 1, length);
				this.focus = this.children[index];
			}
			while (!(this.focus instanceof oui.Input))

			//this.focus.toggle();
			return false;
		}
	});

	oui.Form.capture('draw', function (time, context)//erzeugt komischen glitch (in firefox) beim öffnen der js-konsole (F12) (verschwindet wenn context.font auskommentiert wird
	//oui.Form.prepare('draw', function (time, context)
	{
		//ooo.Scene.prototype.events.prepare.draw.call(this, time, context);//
		context.fillStyle = this.color;
		context.font = this.font;
		context.textAlign = this.align;
		context.textBaseline = this.baseline;
	});

	oui.Form.prepare('input_press', function (time, char, key, shift)
	{
		if (this.parent.focus != this)
		{
			return false;
		}
	});

	oui.Form.bubble('form_submit', function (type, data)
	{
		console.log('submit %s %s', type, JSON.stringify(data));
	});

	oui.Input = ooo.Cell.extend(function (name, layout)//alphabet
	{
		ooo.Cell.call(this, layout);
		this.name = name;
		this.focus = false;
	});

	/*oui.Input.method('toggle', function ()
	{
		this.focus = !this.focus;
	});*/

	oui.Input.on('mouse_click', function (button, down_x, down_y)
	{
		//this.parent.focus.toggle();
		this.parent.focus = this;
		//this.toggle();
	});

	oui.Button = oui.Input.extend(function (name, asset, type, layout)
	{
		oui.Input.call(this, name, layout);
		this.asset = asset;
		this.type = type;
	});

	oui.Button.on('show', function (root, parent)
	{
		oui.Input.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
	});

	oui.Button.on('draw', function (time, context)
	{
		if (this.focus)
		{
			context.drawImage(this.image, this.image.tile_x[this.type], this.image.tile_y[this.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
		}
		else
		{
			context.drawImage(this.image, this.image.tile_x[this.type], this.image.tile_y[this.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
		}
	});

	oui.Submit = oui.Button.extend(function (name, asset, type, layout)
	{
		oui.Button.call(this, name, asset, type, layout);
	});

	oui.Submit.on('mouse_click', function (button, down_x, down_y)
	{
		oui.Button.prototype.events.on.mouse_click.call(this, button, down_x, down_y);
		this.parent.trigger('form_submit', [this.name, {}]);
		return false;
	});

	oui.Submit.on('input_press', function (time, char, key, shift)
	{
		if (key == 13)//enter
		{
			this.parent.trigger('form_submit', [this.name, {}]);
			return false;
		}
	});

	oui.Field = oui.Input.extend(function (name, layout)//alphabet
	{
		oui.Input.call(this, name, layout);
		oui.Field.prototype.events.on.form_reset.call(this);
	});

	oui.Field.on('form_reset', function ()
	{
		this.chars = [];
		this.caret = 0;
		this.string = '';
		this.substr = '';
	});

	oui.Field.on('form_submit', function (name, data)
	{
		ooc.push(this.string, data, this.name);
	});

	oui.Field.on('input_press', function (time, char, key, shift)
	{
		if (key == 8)//backspace
		{
			if (this.caret > 0)
			{
				this.caret--;
				this.chars.splice(this.caret, 1);
			}
		}
		else if (key == 46)//delete
		{
			if (this.caret < this.chars.length)
			{
				this.chars.splice(this.caret, 1);
			}
		}
		else if (key == 37)//left
		{
			if (this.caret > 0)
			{
				this.caret--;
			}
		}
		else if (key == 39)//right
		{
			if (this.caret < this.chars.length)
			{
				this.caret++;
			}
		}
		else if (char)
		{
			this.chars.splice(this.caret, 0, char);
			this.caret++;
		}
		else
		{
			return;
		}

		this.string = this.chars.join('');
		this.substr = this.string.substr(0, this.caret);
	});

	oui.Field.on('draw', function (time, context)
	{
		context.fillText(this.string, 0, 0);

		if (this.focus && ((time % 2000) < 1300))//caret blink
		{
			context.fillRect(context.measureText(this.substr).width, 0, this.height >>> 3, this.height);
		}
	});

	oui.Counter = oui.Input.extend(function (name, min, max, init, layout)
	{
		oui.Input.call(this, name, layout);
		this.min = min;
		this.max = max;
		this.init = init;
		oui.Counter.prototype.events.on.form_reset.call(this);
	});

	oui.Counter.on('form_reset', function ()
	{
		this.count = this.init;
	});

	oui.Counter.on('form_submit', function (name, data)
	{
		ooc.push(this.count, data, this.name);
	});

	oui.Counter.on('mouse_click', function (button, down_x, down_y)
	{
		oui.Input.prototype.events.on.mouse_click.call(this, button, down_x, down_y);

		if (down_x < (this.width >>> 1))
		{
			if (this.count > this.min)
			{
		 		this.count--;
			}
			else
			{
		 		this.count = this.max;
			}
		}
		else
		{
			if (this.count < this.max)
			{
		 		this.count++;
			}
			else
			{
		 		this.count = this.min;
			}
		}
	});

	oui.Counter.on('draw', function (time, context)
	{
		context.fillText(this.count, 0, 0);
	});

	oui.Options = oui.Input.extend(function (name, options, init, layout)
	{
		oui.Input.call(this, name, layout);
		this.options = options;
		this.init = init;
		oui.Options.prototype.events.on.form_reset.call(this);
	});

	oui.Options.on('form_reset', function ()
	{
		this.pick = this.init;
	});

	oui.Options.on('form_submit', function (type, data)
	{
		ooc.push(this.pick, data, this.name);
	});

	oui.Options.on('mouse_click', function (button, down_x, down_y)
	{
		oui.Input.prototype.events.on.mouse_click.call(this, button, down_x, down_y);

		if (down_x < (this.width >>> 1))
		{
			this.pick--;
		}
		else
		{
			this.pick++;
		}

		this.pick = ooc.wrap(this.pick, this.options.length);
	});

	oui.Options.on('draw', function (time, context)
	{
		context.fillText(this.options[this.pick], 0, 0);
	});

	oui.Switch = oui.Input.extend(function (name, init, layout)
	{
		oui.Input.call(this, name, layout);
		this.init = init;
		oui.Switch.prototype.events.on.form_reset.call(this);
	});

	oui.Switch.method('reset', function ()
	{
		this.state = this.init;
	});

	oui.Switch.on('form_submit', function (name, data)
	{
		ooc.push(this.state, data, this.name);
	});

	oui.Switch.on('mouse_click', function (button, down_x, down_y)
	{
		oui.Input.prototype.events.on.mouse_click.call(this, button, down_x, down_y);
		this.state = this.state ? 0 : 1;
	});

	oui.Switch.on('draw', function (time, context)
	{
		//context.drawImage(this.image, this.img_x, this.img_y, this.width, this.height, 0, 0, this.width, this.height);
		context.fillText(this.state, 0, 0);
	});

	//MENUS
	oui.Menu = ooo.Cell.extend(function (asset, layout, style)//switch to oui.Button.extend
	{
		ooo.Cell.call(this, layout);
		this.asset = asset;
		this.style = style || 0;
		this.data = [];
		this.pick = {};
	});

	oui.Menu.method('reset', function (data, pick)
	{
		this.data = data || [];
		this.pick = {};

		if (pick)
		{
			for (var i = 0; i < pick.length; i++)
			{
				this.pick[i] = true;
			}
		}

		return this;
	});

	oui.Menu.method('drawButton', function (time, context, data, pick)
	{
		if (pick)
		{
			context.fillStyle = '#f00';
			context.fillRect(0, 0, this.image.tile_w, this.image.tile_h);
		}
		else
		{
			context.drawImage(this.image, this.image.tile_x[data], this.image.tile_y[data], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
		}
	});

	oui.Menu.method('preparePick', function (data, index)
	{
		return [data, index];
	});

	oui.Menu.on('show', function (root, parent)
	{
		ooo.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
	});

	oui.Menu.on('resize', function (width, height)
	{
		ooo.Cell.prototype.events.on.resize.call(this, width, height);
		this.cols = Math.floor(this.width / this.image.tile_w);
		this.rows = Math.floor(this.height / this.image.tile_h);

		if (this.style & OUI_VERTICAL)
		{
			this.shift_x = 0;
			this.break_y = 0;
			this.line_br = this.rows;

			if (this.style & OUI_REVERSED)
			{
				this.init_x = this.width - this.image.tile_w;
				this.break_x = -this.image.tile_w;
			}
			else
			{
				this.init_x = 0;
				this.break_x = this.image.tile_w;
			}

			if (this.style & OUI_BOTTOM)
			{
				this.init_y = this.height - this.image.tile_h;
				this.shift_y = -this.image.tile_h;
			}
			else
			{
				this.init_y = 0;
				this.shift_y = this.image.tile_h;
			}
		}
		else
		{
			this.shift_y = 0;
			this.break_x = 0;
			this.line_br = this.cols;

			if (this.style & OUI_REVERSED)
			{
				this.init_x = this.width - this.image.tile_w;
				this.shift_x = -this.image.tile_w;
			}
			else
			{
				this.init_x = 0;
				this.shift_x = this.image.tile_w;
			}

			if (this.style & OUI_BOTTOM)
			{
				this.init_y = this.height - this.image.tile_h;
				this.break_y = -this.image.tile_h;
			}
			else
			{
				this.init_y = 0;
				this.break_y = this.image.tile_h;
			}
		}
	});

	//max_lines bestimmen und bei überschreitung neue seite oder so!!!???
	oui.Menu.on('draw', function (time, context)
	{
		context.translate(this.init_x, this.init_y);
		context.save();

		for (var i = 0; i < this.data.length;)
		{
			context.save();
			this.drawButton(time, context, this.data[i], this.pick[i]);
			context.restore();
			context.translate(this.shift_x, this.shift_y);
			i++;

			if ((i % this.line_br) == 0)
			{
				context.restore();
				context.translate(this.break_x, this.break_y);
				context.save();
			}
		}
		
		context.restore();
	});

	oui.Menu.on('mouse_click', function (button, down_x, down_y)
	{
		if (this.style & OUI_BOTTOM)
		{
			var row = Math.floor((this.height - down_y) / this.image.tile_h);
		}
		else
		{
			var row = Math.floor(down_y / this.image.tile_h);
		}

		if (this.style & OUI_REVERSED)
		{
			var col = Math.floor((this.width - down_x) / this.image.tile_w);
		}
		else
		{
			var col = Math.floor(down_x / this.image.tile_w);
		}

		if (this.style & OUI_VERTICAL)
		{
			var index = col * this.rows + row;
		}
		else
		{
			var index = row * this.cols + col;
		}

		if ((this.data[index] != undefined) && (col < this.cols) && (row < this.rows))
		{
			var argv = this.preparePick(this.data[index], index);
			this.trigger('pick_item', argv);
			return false;
		}
	});

	oui.SingleMenu = oui.Menu.extend(function (asset, layout, style)
	{
		oui.Menu.call(this, asset, layout, style);
	});

	oui.SingleMenu.method('preparePick', function (data, index)
	{
		this.pick = {};
		this.pick[index] = true;
		return [data, index];
	});

	oui.MultiMenu = oui.Menu.extend(function (asset, layout, style)
	{
		oui.Menu.call(this, asset, layout, style);
	});

	oui.MultiMenu.method('preparePick', function (data, index)
	{
		if (this.pick[index])
		{
			delete this.pick[index];
		}
		else
		{
			this.pick[index] = true;
		}

		var select = [];

		for (var i in this.pick)
		{
			select.push(this.data[i]);
		}

		return [select, data, index];
	});

	var TabMenu = oui.SingleMenu.extend(function (asset, layout, style)
	{
		oui.Menu.call(this, asset, layout, style);
	});

	TabMenu.on('pick_item', function (data, index)
	{
		this.parent.front.mask('draw');
		this.parent.front.mask('mouse_click');
		this.parent.front = this.parent.tabs[index];
		this.parent.front.unmask('draw');
		this.parent.front.unmask('mouse_click');
	});

	oui.Tabbed = ooo.Scene.extend(function (layout, asset, menu_layout, style)
	{
		ooo.Scene.call(this, layout);
		this.menu = new TabMenu(asset, menu_layout, style);
		this.tabs = [];
		this.show(this.menu, 1);
	});

	oui.Tabbed.method('open', function (type, actor)
	{
		if (this.tabs.length == 0)
		{
			this.menu.pick[0] = true;
			this.front = actor;
		}
		else
		{
			actor.mask('draw');
			actor.mask('mouse_click');
		}

		this.menu.data.push(type);
		this.tabs.push(actor);
		this.show(actor);
	});

	oui.TileMap = ooo.Cell.extend(function (size, asset, layout)
	{
		ooo.Cell.call(this, layout);
		this.ignore('mouse_drag', 'mouse_drop');
		this.size = size;
		this.asset = asset;
		this.drag_x = 0;
		this.drag_y = 0;
		this.drop_x = 0;
		this.drop_y = 0;
		this.coords = [];
		this.tiles = [];

		//create tiles
		for (var y = 0, i = 0; y < size; y++)
		{
			this.coords[y] = [];

			for (var x = 0; x < size; x++, i++)
			{
				var tile = {};
				tile.map = this;
				tile.i = i;
				tile.x = x;
				tile.y = y;
				tile.data = this.initData(i, x, y);
				this.coords[y][x] = tile;
				this.tiles[i] = tile;
			}
		}

		//connect neighbors
		for (var y = 0; y < size; y++)
		{
			for (var x = 0; x < size; x++)
			{
				var steps = [];

				for (var i in SQR_NMASK)
				{
					var nx = (x + SQR_NMASK[i][0] + size) % size;
					var ny = (y + SQR_NMASK[i][1] + size) % size;
					steps[i] = this.coords[ny][nx];
				}

				this.coords[y][x].steps = steps;
			}
		}
	});

	oui.TileMap.method('initData', function (i, x, y)
	{
		return {type: 0};
	});

	oui.TileMap.method('calcCost', function (data)
	{
		return 1;
	});

	oui.TileMap.method('drawTile', function (tile, time, context)
	{
		context.drawImage(this.image, this.image.tile_x[tile.data.type], this.image.tile_y[tile.data.type], this.image.tile_w, this.image.tile_h, 0, 0, this.image.tile_w, this.image.tile_h);
	});

	oui.TileMap.method('calcDistance', function (a, b)
	{
		if (a.x < b.x)
		{
			var min_x = Math.min(b.x - a.x, a.x - (b.x - this.size));
		}
		else
		{
			var min_x = Math.min(a.x - b.x, (b.x + this.size) - a.x);
		}

		if (a.y < b.y)
		{
			var min_y = Math.min(b.y - a.y, a.y - (b.y - this.size));
		}
		else
		{
			var min_y = Math.min(a.y - b.y , (b.y + this.size) - a.y);
		}

		return (min_x + min_y);
	});

	oui.TileMap.method('findArea', function (open, range)
	{
		if (open.length == 0)
		{
			throw 'No tiles to go from';
		}

		//var g = {};

		for (var i = 0; i < open.length; i++)
		{
			open[i] = this.tiles[open[i]];
			open[i].g = 0;
		}

		var done = [];//sparse array

		do
		{
			var current = open.pop();
			done[current.i] = current.g;//muss das evtl geupdated werden falls billiger geht?

			for (var i = 0; i < current.steps.length; i++)
			{
				var next = current.steps[i];

				if (next.i in done)
				{
					continue;
				}

				var next_c = this.calcCost.call(this, next.data);

				if (next_c == null)
				{
					continue;
				}

				var next_g = current.g + next_c;

				if (next_g > range)
				{
					continue;
				}

				var tile = null;

				for (var j in open)
				{
					if (open[j] == next)
					{
						tile = next;
						break;
					}
				}

				if (tile == null)
				{
					next.g = next_g;
					open.splice(ooc.sorted_index(open, next, 'g'), 0, next);
					continue;
				}

				if (next_g < tile.g)
				{
					tile.g = next_g;
				}
			}
		}
		while (open.length)

		return done;
	});

	oui.TileMap.method('findPath', function (origin, target)
	{
		if (origin.i == target.i)
		{
			return {tiles: [], steps: [], cost: 0};
		}

		var done = [];
		var crumbs = [];
		var open = [origin];
		origin.g = 0;
		origin.f = this.calcDistance.call(this, origin, target);

		do
		{
			var current = open.pop();
			done[current.i] = current.g;//muss das evtl geupdated werden falls billiger geht?

			for (var i = 0; i < current.steps.length; i++)
			{
				var next = current.steps[i];

				if (next.i in done)
				{
					continue;
				}

				var next_c = this.calcCost.call(this, next.data);

				if (next_c == null)
				{
					continue;
				}

				var next_g = current.g + next_c;

				if (next == target)
				{
					var tiles = [next.i];
					var steps = [i];

					while (current != origin)
					{
						tiles.push(current.i);
						steps.push(crumbs[current.i][0]);
						current = crumbs[current.i][1];
					}

					//rückgabewert prüfen/kann ich hier was mit done[] machen?
					return {tiles: tiles.reverse(), steps: steps.reverse(), cost: next_g};
				}

				var tile = null;

				for (var j in open)
				{
					if (open[j] == next)
					{
						tile = next;
						break;
					}
				}

				if (tile == null)
				{
					next.g = next_g;
					next.f = next_g + this.calcDistance.call(this, next, target);
					open.splice(ooc.sorted_index(open, next, 'f'), 0, next);
					crumbs[next.i] = [i, current];
					continue;
				}

				if (next_g < tile.g)
				{
					tile.g = next_g;
					tile.f = next_g + this.calcDistance.call(this, tile, target);
					crumbs[tile.i] = [i, current];
				}
			}
		}
		while (open.length)
	});

	oui.TileMap.method('getTileAt', function (down_x, down_y)
	{
		var tile_x = Math.floor(ooc.wrap(this.drop_x - this.mid_x + down_x, this.patch_w) / this.image.tile_w);
		var tile_y = Math.floor(ooc.wrap(this.drop_y - this.mid_y + down_y, this.patch_h) / this.image.tile_h);
		return this.coords[tile_y][tile_x];
	});

	oui.TileMap.method('viewTile', function (tile)
	{
		this.drop_x = (tile.x * this.image.tile_w) + (this.image.tile_w >>> 1);
		this.drop_y = (tile.y * this.image.tile_h) + (this.image.tile_h >>> 1);
	});

	oui.TileMap.on('show', function (root, parent)
	{
		ooo.Cell.prototype.events.on.show.call(this, root, parent);
		this.image = root.images[this.asset];
		this.patch_w = this.size * this.image.tile_w;
		this.patch_h = this.size * this.image.tile_h;
	});

	oui.TileMap.on('resize', function (width, height)
	{
		ooo.Cell.prototype.events.on.resize.call(this, width, height);
		this.mid_x = this.width >>> 1;
		this.mid_y = this.height >>> 1;
	});

	oui.TileMap.on('draw', function (time, context)
	{
		var drop_x = ooc.wrap(this.drop_x - this.drag_x - this.mid_x, this.patch_w);
		var drop_y = ooc.wrap(this.drop_y - this.drag_y - this.mid_y, this.patch_h);
		var start_x = Math.floor(drop_x / this.image.tile_w);
		var start_y = Math.floor(drop_y / this.image.tile_h);
		var end_x = start_x + Math.ceil(this.width / this.image.tile_w);
		var end_y = start_y + Math.ceil(this.height / this.image.tile_h);

		context.translate(-(drop_x % this.image.tile_w), -(drop_y % this.image.tile_h));

		for (var y = start_y; y <= end_y; y++)
		{
			var tile_y = y % this.size;
			context.save();

			for (var x = start_x; x <= end_x; x++)
			{
				var tile_x = x % this.size;
				var tile = this.coords[tile_y][tile_x];
				context.save();
				this.drawTile(tile, tile.data, time, context);
				context.restore();
				context.translate(this.image.tile_w, 0);
			}

			context.restore();
			context.translate(0, this.image.tile_h);
		}
	});

	oui.TileMap.on('mouse_grab', function (button, down_x, down_y, drag_x, drag_y)
	{
		this.listen('mouse_drag', 'mouse_drop');
		this.drag_x = drag_x;
		this.drag_y = drag_y;
		return false;
	});

	oui.TileMap.on('mouse_drag', function (drag_x, drag_y)
	{
		this.drag_x = drag_x;
		this.drag_y = drag_y;
		return false;
	});

	oui.TileMap.on('mouse_drop', function (drop_x, drop_y)
	{
		this.ignore('mouse_drag', 'mouse_drop');
		this.drop_x = ooc.wrap(this.drop_x - this.drag_x, this.patch_w);
		this.drop_y = ooc.wrap(this.drop_y - this.drag_y, this.patch_h);
		this.drag_x = 0;
		this.drag_y = 0;
		return false;
	});

	oui.TileMap.on('mouse_click', function (button, down_x, down_y)
	{
		var tile = this.getTileAt(down_x, down_y);
		this.trigger('pick_tile', [tile, button]);
		return false;
	});

	oui.HexMap = oui.TileMap.extend(function (size, tile_w, tile_h, type, layout)
	{
		oui.TileMap.apply(this, arguments);
		this.tile_w2 = tile_w >>> 1;
		this.tile_h2 = tile_h >>> 1;
		this.tile_h4 = tile_h >>> 2;
		this.tile_3h4 = this.tile_h2 + this.tile_h4;
		this.patch_h = size * this.tile_3h4;
		var hex_d = Math.sqrt(this.tile_w2 * this.tile_w2 + this.tile_3h4 * this.tile_3h4);//hex diagonale
		this.hex_r = hex_d / 2;//radius
		this.hex_x = this.tile_w2 / hex_d;
		this.hex_y = this.tile_3h4 / hex_d;
		this.size2 = size >>> 1;
		this.size32 = size + this.size2;
		this.coords = [];
		this.tiles = [];

		//create tiles
		for (var y = 0, i = 0; y < size; y++)
		{
			this.coords[y] = [];

			for (var x = 0; x < size; x++, i++)
			{
				var tile = {};
				tile.i = i;
				tile.x = x - (y >> 1);
				tile.y = y;
				tile.z = -tile.x - y;
				tile.type = 0;
				this.coords[y][x] = tile;
				this.tiles[i] = tile;
			}
		}

		//connect neighbors
		for (var y = 0; y < size; y++)
		{
			var nmask = HEX_NMASK[y & 1];

			for (var x = 0; x < size; x++)
			{
				var steps = [];

				for (var i = 0; i < nmask.length; i++)
				{
					var nx = (x + nmask[i][0] + size) % size;
					var ny = (y + nmask[i][1] + size) % size;
					steps[i] = this.coords[ny][nx];
				}

				this.coords[y][x].steps = steps;
			}
		}
	});

	//private HexMap
	function wrapDist (dx, dy, dz)
	{
		var dist1 = Math.max(Math.abs(this.size2 + dx), this.size - dy, Math.abs(this.size2 + dz));
		var dist2 = Math.max(Math.abs(this.size2 - dx), this.size - dy, Math.abs(this.size32 + dz));
		var dist3 = Math.max(Math.abs(this.size - dx), dy, Math.abs(this.size + dz));
		return Math.min(dist1, dist2, dist3);
	}

	oui.HexMap.method('calcDistance', function (a, b)
	{
		var dx = b.x - a.x;
		var dy = b.y - a.y;
		var dz = b.z - a.z;
		var dist = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));

		if (dist > this.size2)
		{
			if (dy == 0 || dx == dz)
			{
				return (this.size - dist);
			}
			else if (dx > dz)//rechts
			{
				if (dy > 0)//unten
				{
					var quad = wrapDist.call(this, dx, dy, dz);
				}
				else//oben
				{
					var quad = wrapDist.call(this, -dz, -dy, -dx);
				}
			}
			else//links
			{
				if (dy > 0)//unten
				{
					var quad = wrapDist.call(this, dz, dy, dx);
				}
				else//oben
				{
					var quad = wrapDist.call(this, -dx, -dy, -dz);
				}
			}
		}

		return (dist > quad ? quad : dist);
	});

	oui.HexMap.on('mouse_click', function (button, down_x, down_y)
	{
		var raw_x = (this.drop_x + down_x) % this.patch_w;
		var raw_y = (this.drop_y + down_y) % this.patch_h;
		var rel_x = raw_x % this.tile_w2;
		var rel_y = raw_y % this.tile_3h4;
		var min_x = Math.round((raw_x - rel_x) / this.tile_w2);
		var min_y = Math.round((raw_y - rel_y) / this.tile_3h4);

		if ((min_x & 1) == (min_y & 1))
		{
			if ((rel_x * this.hex_x + rel_y * this.hex_y) < this.hex_r)
			{
				var tile_x = (min_x >> 1) % this.size;
				var tile_y = min_y % this.size;
			}
			else
			{
				var tile_x = ((min_x + 1) >> 1) % this.size;
				var tile_y = (min_y + 1) % this.size;
			}
		}
		else
		{
			if (((rel_x - this.tile_w2) * -this.hex_x + rel_y * this.hex_y) < this.hex_r)
			{
				var tile_x = ((min_x + 1) >> 1) % this.size;
				var tile_y = min_y % this.size;
			}
			else
			{
				var tile_x = (min_x >> 1) % this.size;
				var tile_y = (min_y + 1) % this.size;
			}
		}

		this.trigger('input_pick', [this.coords[tile_y][tile_x], button, tile_x, tile_y]);
		return false;
	});

	oui.HexMap.on('draw', function (time, context)
	{
		var drop_x = ooc.wrap(this.drop_x - this.drag_x, this.patch_w);
		var drop_y = ooc.wrap(this.drop_y - this.drag_y, this.patch_h);
		var start_x = Math.floor(drop_x / this.tile_w);
		var start_y = Math.floor(drop_y / this.tile_3h4);
		var end_x = start_x + Math.ceil(this.width / this.tile_w) + 1;//besser berechnen als + 1 (width + tile_w2??)
		var end_y = start_y + Math.ceil(this.height / this.tile_3h4) + 1;

		context.translate(-((drop_x % this.tile_w) + this.tile_w2), -((drop_y % this.tile_3h4) + this.tile_h2));
		//context.translate(-((drop_x % this.tile_w)), -((drop_y % this.tile_3h4)));

		for (var y = start_y; y <= end_y; y++)
		{
			var tile_y = y % this.size;
			context.save();

			if (y & 1)
			{
				context.translate(this.tile_w2, 0);
			}

			for (var x = start_x; x <= end_x; x++)
			{
				var tile_x = x % this.size;
				var tile = this.coords[tile_y][tile_x];
				context.drawImage(this.image, this.coords[tile.type][0], this.coords[tile.type][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);

				if ('mark' in tile)
				{
					context.drawImage(this.image, this.coords[tile.mark][0], this.coords[tile.mark][1], this.tile_w, this.tile_h, 0, 0, this.tile_w, this.tile_h);
				}

				//context.fillText(tile.group.i, 10, 10);
				context.translate(this.tile_w, 0);
			}

			context.restore();
			context.translate(0, this.tile_3h4);
		}
	});
})();
