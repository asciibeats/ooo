var hide_socket = require('./socket');
var hide_game = require('./game');

hide_game.register('tilla', 'pass');
hide_game.register('pantra', 'pass');
hide_game.register('horst', 'pass');

hide_socket.open(11133);
