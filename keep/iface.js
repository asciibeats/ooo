'use strict';
var Iface;

(function ()
{
	var WIDTH = 50;
	var BORDER = 10;

	//click states
	var ORIGIN = 0;
	var ACTION = 1;
	var TARGET = 2;
	
	function selected (array)
	{
		var masked = [];

		for (var i = 0; i < array.length; i++)
		{
			if (array[i][1])
			{
				masked.push(array[i][0]);
			}
		}

		return masked;
	}

	Iface = oO.Stage.extend(function ()
	{
		this.points = [12, 9, 3];
		this.goods = [];
		this.chars = [];
		this.quests = [];
		this.mails = [1,1,1,1];
	});

	Iface.on('resize', function (width, height)
	{
		this.width = width;
		this.height = height;
	});

	Iface.on('draw', function (elapsed, context)
	{
		context.fillStyle = '#000';
		context.fillText(Math.round(1000 / elapsed), 5, 15);

		context.translate(BORDER, BORDER);
		context.save();
		context.fillStyle = '#fff';
		context.fillRect(5, 5, 40, 40);
		context.translate(WIDTH, 0);
		context.fillRect(5, 5, 40, 40);
		context.fillStyle = '#0f0';

		for (var i = 0, j = this.points.length; i < j; i++)
		{
			context.translate(WIDTH, 0);
			context.fillRect(5, 5, 40, 40);
		}

		context.restore();
		context.fillStyle = '#0ff';

		for (var i = 0, j = this.mails.length; i < j; i++)
		{
			context.translate(0, WIDTH);
			context.fillRect(5, 5, 40, 40);
		}

		context.restore();
		context.translate(this.width - WIDTH - BORDER, this.height - WIDTH - BORDER);
		context.fillStyle = '#fff';
		context.fillRect(5, 5, 40, 40);
		context.save();

		for (var i = 0, j = this.goods.length; i < j; i++)
		{
			context.translate(-WIDTH, 0);

			if (this.goods[i][1])
			{
				context.fillStyle = '#0ff';
				context.fillRect(5, 5, 40, 40);
			}
			else
			{
				context.fillStyle = '#0aa';
				context.fillRect(5, 5, 40, 40);
			}
		}

		context.restore();
		context.translate(0, -WIDTH);
		context.fillStyle = '#fff';
		context.fillRect(5, 5, 40, 40);
		context.save();

		for (var i = 0, j = this.chars.length; i < j; i++)
		{
			context.translate(-WIDTH, 0);

			if (this.chars[i][1])
			{
				context.fillStyle = '#ff0';
				context.fillRect(5, 5, 40, 40);
			}
			else
			{
				context.fillStyle = '#aa0';
				context.fillRect(5, 5, 40, 40);
			}
		}

		context.restore();
		context.fillStyle = '#f0f';

		for (var i = 0, j = this.quests.length; i < j; i++)
		{
			context.translate(0, -WIDTH);
			context.fillRect(5, 5, 40, 40);
		}
	});

	Iface.on('click', function (down_x, down_y)
	{
		//from top left
		var x = Math.floor((root.down_x - BORDER) / WIDTH);
		var y = Math.floor((root.down_y - BORDER) / WIDTH);

		if (y == 0)
		{
			if (x == 0)
			{
				console.log('MENU 0');
			}
			else if (x == 1)
			{
				console.log('MENU 1');
			}
			else if (x == 2)
			{
				console.log('MENU 2');
			}
		}

		//from bottom right
		var x = Math.floor((this.width - root.down_x - BORDER) / WIDTH);
		var y = Math.floor((this.height - root.down_y - BORDER) / WIDTH);

		if (x == 0)
		{
			if (y == 0)
			{
				//submit
				console.log('SUBMIT');
				this.parent.submitQuest();
				return false;
			}
			else if (y == 1)
			{
				//cancel
				this.points = [1];
				this.mails = [1,1];
				this.chars = [];
				this.goods = [];
				this.quests = [];
				this.parent.cancelQuest();
				return false;
			}
			else
			{
				//quests
				var i = y - 2;
				//this.parent.trigger('quest', i);
			}
		}
		else if (y < 2)
		{
			if (y == 0)
			{
				var options = this.goods;
			}
			else
			{
				var options = this.chars;
			}

			var option = options[x - 1];
			
			if (option)
			{
				option[1] = !option[1];
				var chars = selected(this.chars);
				var goods = selected(this.goods);
				this.parent.updateQuest(chars, goods);
				return false;
			}
		}
	});

	Iface.method('updateParty', function (chars, goods)
	{
		this.chars = [];

		for (var i = 0, j = chars.length; i < j; i++)
		{
			this.chars[i] = [chars[i], false];
		}

		this.goods = [];

		for (var i = 0, j = goods.length; i < j; i++)
		{
			this.goods[i] = [goods[i], false];
		}
	});

	Iface.method('updateQuests', function (quests)
	{
		this.quests = quests;
	});
})();
