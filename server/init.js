var socket = require('./socket.js');
var game = require('./game.js');

game.register('tilla', 'pass');
game.register('pantra', 'pass');
game.register('horst', 'pass');

socket.open(11133);
