var Rule = function (argv)//function(action)
{
	this.method = rulefunc[argv[0]](argv[1]);
}

var Action = function (argv)//function(world)
{
	this.method = actionfunc[argv[0]](argv[1]);
}

var Rulebook = function (rules)
{
	this.rules = [];

	for (var i in rules)
	{
		this.rules.push(new Rule(rules[i]));
	}
}

Rulebook.add = function (i, rule)
{
	this.rules.splice(i, 0, new Rule(rule));
}

Rulebook.validate = function (actions)
{
	var result = [];

	for (var i in actions)
	{
		var action = new Action(actions[i]);
		result[i] = [];

		for (var j in this.rules)
		{
			var rule = this.rules[j];
			result[i][j] = rule.method(action);
		}
	}
}

//difference action rule?rule = counteraction?
////a rule does not change game data
////an action does
var World = function ()
{
}

World.apply = function (action)
{
}

var Game = function (slots, tiles, rules)
{
}

//TODO: server/client aufräumen und obiges integrieren

var _types = {0: 0, 1: 0, 344: 3};
var _actions = [[0, ['hallo']], [1, ['welt']]];
var _mode = [[344, [[1, [2, 3]], [5, [5, 3]]]], [23, [1, 7]]];
var _rules = [new Rule(),,,];
