#!/bin/bash
BASEDIR=$(dirname $0)
xterm -title wmtag_1 -e vim $BASEDIR/client/game.js &
xterm -title wmtag_1 -e vim $BASEDIR/client/pix.js &
xterm -title wmtag_1 -e vim $BASEDIR/client/socket.js &
xterm -title wmtag_2 -e vim $BASEDIR/server/game.js &
xterm -title wmtag_2 -e vim $BASEDIR/server/socket.js &
xterm -e node $BASEDIR/server/init.js &
/usr/bin/mongoose -r $BASEDIR/client -p 11155
