var Autobot = function ()
{
	this.expect = [];
}

modules.exports = Autobot;
_behaviour = {};

function addOption(type, expect, func)
{
	_behaviour[type] = func;
	_expect = expect;
}

function next(context, type)
{
	if (_expected)
	{
		var args = Array.prototype.slice.call(arguments, 1);
		_behaviour[type].apply(context, args);
	}
}

function backup()
{
	//history back
}
