
	oO.Button = oO.Cell.extend(function (button_w, button_h, source, styles, layout)
	{
		oO.Cell.call(this, layout);
		this.button_w = button_w;
		this.button_h = button_h;
		this.source = source;
		this.styles = styles;
	});

	oO.Button.on('show', function (root, parent)
	{
		this.image = root.images[this.source];
		this.tiles = [];

		var cols = Math.floor(this.image.width / this.button_w);
		var rows = Math.floor(this.image.height / this.button_h);
		var name = Object.keys(this.styles)[0];

		this.tile_x = (this.styles[name] % cols) * this.button_w;
		this.tile_y = Math.floor(this.styles[name] / rows) * this.button_h;
	});

	oO.Button.on('frame', function (elapsed, context)
	{
		context.drawImage(this.image, this.tile_x, this.tile_y, this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
	});

	oO.Button.method('style', function (name)
	{
		var cols = Math.floor(this.image.width / this.button_w);
		var rows = Math.floor(this.image.height / this.button_h);

		this.tile_x = (this.styles[name] % cols) * this.button_w;
		this.tile_y = Math.floor(this.styles[name] / rows) * this.button_h;
	});

	oO.Input = oO.Cell.extend(function (color, font, align, baseline, layout)
	{
		oO.Cell.call(this, layout);
		this.color = color || '#000';
		this.font = font || '10px sans-serif';
		this.align = align || 'start';
		this.baseline = baseline || 'top';
		this.chars = [];
		this.caret = 0;
		this.text = '';
		this.sub = '';
	});

	oO.Input.on('text', function (time, char, key, shift)
	{
		if (key == 8)
		{
			if (this.caret > 0)
			{
				this.caret--;
				this.chars.splice(this.caret, 1);
			}
		}
		else if (key == 46)
		{
			if (this.caret < this.chars.length)
			{
				this.chars.splice(this.caret, 1);
			}
		}
		else if (key == 37)
		{
			if (this.caret > 0)
			{
				this.caret--;
			}
		}
		else if (key == 39)
		{
			if (this.caret < this.chars.length)
			{
				this.caret++;
			}
		}
		else
		{
			this.chars.splice(this.caret, 0, String.fromCharCode(char));
			this.caret++;
		}

		this.text = this.chars.join('');
		this.sub = this.text.substr(0, this.caret);
	});

	oO.Input.on('frame', function (elapsed, context)
	{
		context.translate(10, 100);
		context.fillStyle = this.color;
		context.font = this.font;
		context.textAlign = this.align;
		context.textBaseline = this.baseline;
		context.fillText(this.text, 0, 0);

		if ((elapsed % 1300) < 800)//caret blink
		{
			context.fillStyle = '#000';
			context.fillRect(context.measureText(this.sub).width, 0, 4, 40);
		}
	});

	oO.Menu = oO.Cell.extend(function (button_w, button_h, type, layout, vertical, reversed)
	{
		oO.Cell.call(this, layout);
		this.button_w = button_w;
		this.button_h = button_h;
		this.type = type;
		this.vertical = vertical;
		this.reversed = reversed;
		this.offset_x = vertical ? 0 : reversed ? -button_w : button_w;
		this.offset_y = vertical ? reversed ? -button_h : button_h : 0;
		this.options = [];
	});

	oO.Menu.on('show', function (root, parent)
	{
		this.image = root.images[this.type];
		this.tiles = [];

		var cols = Math.floor(this.image.width / this.button_w);
		var rows = Math.floor(this.image.height / this.button_h);

		for (var y = 0; y < rows; y++)
		{
			for (var x = 0; x < cols; x++)
			{
				this.tiles.push([x * this.button_w, y * this.button_h]);
			}
		}
	});

	oO.Menu.on('frame', function (elapsed, context)
	{
		if (this.reversed)
		{
			if (this.vertical)
			{
				context.translate(0, this.height - this.button_h);
			}
			else
			{
				context.translate(this.width - this.button_w, 0);
			}
		}

		for (var i = 0; i < this.options.length; i++)
		{
			var index = this.options[i];
			context.drawImage(this.image, this.tiles[index][0], this.tiles[index][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
			context.translate(this.offset_x, this.offset_y);
		}
	});

	oO.Menu.on('click', function (down_x, down_y)
	{
		if (this.vertical)
		{
			if (this.reversed)
			{
				var i = Math.floor((this.height - down_y) / this.button_h);
			}
			else
			{
				var i = Math.floor(down_y / this.button_h);
			}
		}
		else
		{
			if (this.reversed)
			{
				var i = Math.floor((this.width - down_x) / this.button_w);
			}
			else
			{
				var i = Math.floor(down_x / this.button_w);
			}
		}

		if (this.options[i] != undefined)
		{
			this.trigger('pick', [this.options[i], i]);
			return false;
		}
	});

	oO.Menu.method('reset', function (options)
	{
		this.options = options || [];
		return this;
	});

	oO.SingleMenu = oO.Menu.extend(function (button_w, button_h, image, layout, vertical, reversed)
	{
		oO.Menu.apply(this, arguments);
	});

	oO.SingleMenu.on('frame', function (elapsed, context)
	{
		if (this.reversed)
		{
			if (this.vertical)
			{
				context.translate(0, this.height - this.button_h);
			}
			else
			{
				context.translate(this.width - this.button_w, 0);
			}
		}

		for (var i = 0; i < this.options.length; i++)
		{
			if (this.picked == i)
			{
				context.fillStyle = '#f00';
				context.fillRect(0, 0, this.button_w, this.button_h);
			}
			else
			{
				var type = this.options[i];
				context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
			}

			context.translate(this.offset_x, this.offset_y);
		}
	});

	oO.SingleMenu.on('click', function (down_x, down_y)
	{
		if (this.vertical)
		{
			if (this.reversed)
			{
				var i = Math.floor((this.height - down_y) / this.button_h);
			}
			else
			{
				var i = Math.floor(down_y / this.button_h);
			}
		}
		else
		{
			if (this.reversed)
			{
				var i = Math.floor((this.width - down_x) / this.button_w);
			}
			else
			{
				var i = Math.floor(down_x / this.button_w);
			}
		}

		if (this.options[i] != undefined)
		{
			this.picked = i;
			this.trigger('pick', [this.options[i], i]);
			return false;
		}
	});

	oO.SingleMenu.method('reset', function (options)
	{
		this.options = options || [];
		delete this.picked;
		return this;
	});

	oO.MultiMenu = oO.Menu.extend(function (button_w, button_h, image, layout)
	{
		oO.Menu.apply(this, arguments);
	});

	oO.MultiMenu.on('frame', function (elapsed, context)
	{
		if (this.reversed)
		{
			if (this.vertical)
			{
				context.translate(0, this.height - this.button_h);
			}
			else
			{
				context.translate(this.width - this.button_w, 0);
			}
		}

		for (var i = 0; i < this.options.length; i++)
		{
			if (this.picked[i])
			{
				context.fillStyle = '#f00';
				context.fillRect(0, 0, this.button_w, this.button_h);
			}
			else
			{
				var type = this.options[i];
				context.drawImage(this.image, this.tiles[type][0], this.tiles[type][1], this.button_w, this.button_h, 0, 0, this.button_w, this.button_h);
			}

			context.translate(this.offset_x, this.offset_y);
		}
	});

	oO.MultiMenu.on('click', function (down_x, down_y)
	{
		if (this.vertical)
		{
			if (this.reversed)
			{
				var i = Math.floor((this.height - down_y) / this.button_h);
			}
			else
			{
				var i = Math.floor(down_y / this.button_h);
			}
		}
		else
		{
			if (this.reversed)
			{
				var i = Math.floor((this.width - down_x) / this.button_w);
			}
			else
			{
				var i = Math.floor(down_x / this.button_w);
			}
		}

		if (this.options[i] != undefined)
		{
			this.picked[i] = !this.picked[i];
			var selection = [];

			for (var j = 0; j < this.options.length; j++)
			{
				if (this.picked[j])
				{
					selection.push(this.options[j]);
				}
			}

			this.trigger('pick', [selection, this.options[i], i]);
			return false;
		}
	});

	oO.MultiMenu.method('reset', function (options)
	{
		this.options = options || [];
		this.picked = [];

		for (var i = 0; i < this.options.length; i++)
		{
			this.picked[i] = false;
		}

		return this;
	});
