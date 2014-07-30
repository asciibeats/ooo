
		<script type="text/javascript" src="client/jquery-2.1.1.js"></script>
		<script type="text/template" id="login">
			<header>LOGIN</header>
			<label>Name: <input type="text"></label>
			<label>Password: <input type="password"></label>
			<input type="submit" value="log in">
		</script>
		<script type="text/template" id="browse">
			<header>BROWSE</header>
			<ul><% for (var i = 0; i < arguments[0].length; i++) { %><li><% arguments[0][i] %></li><% } %></ul>
			<input type="submit" value="host new game">
		</script>
		<script type="text/template" id="rules">
			<header>RULES</header>
			<input type="submit" value="goto lobby">
		</script>
		<script type="text/template" id="lobby">
			<header>LOBBY</header>
			<ul><% for (var name in this.game.players) { %><li><% name %></li><% } %></ul>
		</script>
		<script type="text/template" id="play">
			<header>PLAY</header>
		</script>


	oO.Root.method('augment', function (name)
	{
		var template = this.templates[name];

		if (template)
		{
			var argv = Array.prototype.slice.call(arguments);
			argv[0] = template.string;
			template.element.innerHTML = parse.apply(this, argv);
			template.root = this;
			this.hook.replaceChild(template.element, this.face);
			this.face = template.element;

			for (var selector in template.events)
			{
				var type = template.events[selector][0];
				var func = template.events[selector][1];
				$(selector).on(type, {'root': this}, func); 
			}
		}
	});
	oO.Template = function (selector)
	{
		this.string = $(selector).html();
		this.element = document.createElement('div');
		this.element.style.position = 'relative';
	}

	oO.Template.extend = function (func)
	{
		var Parent = this;

		var Child = function ()
		{
			func.apply(this, arguments);
		}

		Child.prototype = Object.create(Parent.prototype);
		Child.prototype.constructor = Child;

		if (Child.prototype.events != undefined)
		{
			var events = {};

			for (var type in Child.prototype.events)
			{
				events[type] = Child.prototype.events[type];
			}

			Child.prototype.events = events;
		}

		var names = Object.keys(Parent);

		for (var i = 0; i < names.length; i++)
		{
			var name = names[i];
			Child[name] = Parent[name];
		}

		return Child;
	}

	oO.Template.clone = function ()
	{
		var argv = arguments;
		var Parent = this;

		var Child = function ()
		{
			Parent.apply(this, argv);
		}

		Child.prototype = Object.create(Parent.prototype);
		Child.prototype.constructor = Child;

		if (Child.prototype.events != undefined)
		{
			var events = {};

			for (var type in Child.prototype.events)
			{
				events[type] = Child.prototype.events[type];
			}

			Child.prototype.events = events;
		}

		var names = Object.keys(Parent);

		for (var i = 0; i < names.length; i++)
		{
			var name = names[i];
			Child[name] = Parent[name];
		}

		return Child;
	}

	oO.Template.on = function (selector, type, func)
	{
		if (!this.prototype.events)
		{
			this.prototype.events = {};
		}

		this.prototype.events[selector] = [type, func];
		return this;
	}
	/*oO.Raster = oO.Stage.extend(function (cell_w, cell_h, border)
	{
		this.cell_w = cell_w;
		this.cell_h = cell_h;
		this.border = border;
		this.cols = 0;
		this.rows = 0;
		this.cells = {};
	});

	function showButton (raster, button)
	{
		var rst_x = button.align_x ? (raster.cols - 1) - button.rst_x : button.rst_x;
		var rst_y = button.align_y ? (raster.rows - 1) - button.rst_y : button.rst_y;

		button.place(rst_x, rst_y);

		for (var y in button.cells)
		{
			var cell_y = rst_y + parseInt(y);

			for (var x in button.cells[y])
			{
				var cell_x = rst_x + parseInt(x);

				if (raster.cells[cell_y] == undefined)
				{
					raster.cells[cell_y] = {};
				}

				raster.cells[cell_y][cell_x] = button;
			}
		}
	}

	oO.Raster.on('resize', function (width, height)
	{
		this.resize(width, height);
		return [this.cols, this.rows, this.cell_w, this.cell_h];
	});

	oO.Raster.on('click', function (down_x, down_y)
	{
		var x = Math.floor(down_x / this.cell_w);
		var y = Math.floor(down_y / this.cell_h);

		if ((x < 0) || (y < 0) || (x >= this.cols) || (y >= this.rows))
		{
			return;
		}

		if (this.cells[y] && this.cells[y][x])
		{
			var button = this.cells[y][x];
			var rst_x = button.align_x ? (this.cols - 1) - button.rst_x : button.rst_x;
			var rst_y = button.align_y ? (this.rows - 1) - button.rst_y : button.rst_y;
			button.trigger('pick', [x - rst_x, y - rst_y]);
			return false;
		}
	});

	oO.Raster.method('resize', function (width, height)
	{
		this.cols = Math.floor((width - (this.border << 1)) / this.cell_w);
		this.rows = Math.floor((height - (this.border << 1)) / this.cell_h);

		oO.Stage.prototype.resize.call(this, this.cols * this.cell_w, this.rows * this.cell_h);

		this.rel_x = (width - this.width) >> 1;
		this.rel_y = (height - this.height) >> 1;
		this.cells = {};

		for (var id in this.children[0])
		{
			var button = this.children[0][id];
			showButton(this, button);
		}
	});

	oO.Raster.method('show', function (button)
	{
		showActor(this, button, 0);
		button.trigger('resize', [this.cols, this.rows, this.cell_w, this.cell_h]);
		showButton(this, button);
	});

	oO.Button = oO.Actor.extend(function (rst_x, rst_y, cells, image, align_x, align_y)
	{
		this.rst_x = rst_x;
		this.rst_y = rst_y;
		this.cells = cells;
		this.image = image;
		this.align_x = align_x || false;
		this.align_y = align_y || false;
	});

	oO.Button.on('resize', function (cols, rows, cell_w, cell_h)
	{
		this.resize(cols, rows, cell_w, cell_h);
	});

	oO.Button.on('draw', function (elapsed, context)
	{
		for (var y in this.cells)
		{
			var cell_y = y * this.cell_h;

			for (var x in this.cells[y])
			{
				var cell_x = x * this.cell_w;
				var i = this.cells[y][x];
				context.drawImage(this.image, this.tiles[i][0], this.tiles[i][0], this.cell_w, this.cell_h, cell_x, cell_y, this.cell_w, this.cell_h);
			}
		}
	});

	oO.Button.on('pick', function (cell_x, cell_y)
	{
		console.log('PICK %d %d %d', this.id, cell_x, cell_y);
	});

	oO.Button.method('resize', function (cols, rows, cell_w, cell_h)
	{
		this.cell_w = cell_w;
		this.cell_h = cell_h;
		var rst_x = this.align_x ? (cols - 1) - this.rst_x : this.rst_x;
		var rst_y = this.align_y ? (rows - 1) - this.rst_y : this.rst_y;
		this.rel_x = rst_x * cell_w;
		this.rel_y = rst_y * cell_h;
		this.tiles = [];

		var img_cols = Math.floor(this.image.width / cell_w);
		var img_rows = Math.floor(this.image.height / cell_h);

		for (var y = 0; y < img_rows; y++)
		{
			for (var x = 0; x < img_cols; x++)
			{
				this.tiles.push([x * cell_w, y * cell_h]);
			}
		}

		return this;
	});

	oO.Button.method('place', function (rst_x, rst_y)
	{
		this.rel_x = rst_x * this.cell_w;
		this.rel_y = rst_y * this.cell_h;
		return this;
	});

	oO.Button.method('update', function (options)
	{
		this.options = options;
		return this;
	});*/
