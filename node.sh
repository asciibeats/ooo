#!/bin/sh
BASEDIR=$(dirname $0)

while true
do
	node $BASEDIR/server/init.js
	echo -e "\npress any key to restart"
	read
	clear
done
