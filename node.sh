#!/bin/sh
BASEDIR=$(dirname $0)

while true
do
	node $BASEDIR/server/init.js
	echo -e "\npress ENTER to restart"
	read
	clear
done
