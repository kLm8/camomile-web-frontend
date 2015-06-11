#!/bin/bash


######################################################################################
#
# 	update-and-restart.sh
# 	---------------------
#
# Version 1.0
#
# update-and-restart.sh is an automated bash script for Unix based operating systems.
#
# It allows the user to update the Docker image camomile-web-frontend and restart
# the Docker container.
#
# Just run :
# 	
#	update-and-restart.sh LOGIN PASSWORD
#
# update-and-restart.sh takes only two arguments :
# 	- LOGIN 	Login for Camomile server
# 	- PASSWORD 	Password for Camomile server
#
######################################################################################


# ----------------------------------------------------------------------------------------------------- #

###################################################################################
# 
# Colors
#
###################################################################################

NORMAL="\\033[0;39m"
RED="\\033[1;31m"
GREEN="\\033[1;32m"
YELLOW="\\033[1;33m"
BLUE="\\033[1;34m"
CYAN="\\033[1;36m"


# ----------------------------------------------------------------------------------------------------- #

###################################################################################
# 
# Checking arguments
#
###################################################################################

if [ $# -ne 2 ]; then
	echo -e "$RED" "\nWrong number of arguments\n\n" "$NORMAL"
	exit
fi

clear


# ----------------------------------------------------------------------------------------------------- #

###################################################################################
# 
# Starting the script
#
###################################################################################

echo -e "$CYAN" "\n\tPulling latest image of camomile-web-frontend...\n" "$NORMAL"
docker pull klm8/camomile-web-frontend

echo -e "$CYAN" "\n\tStopping the running container...\n" "$NORMAL"
docker stop web

echo -e "$CYAN" "\n\tRemoving the old container...\n" "$NORMAL"
docker rm web

echo -e "$CYAN" "\n\tRunning the new container\n""$NORMAL"
docker run 	-d -p 8070:8070 -v $CMML_MEDIA:/media:ro \
			-e CAMOMILE_API=http://vmjoker:32773 \
			-e CAMOMILE_LOGIN=$1 \
			-e CAMOMILE_PASSWORD=$2 \
			--name web \
			klm8/camomile-web-frontend


# ----------------------------------------------------------------------------------------------------- #

###################################################################################
# 
# Everything went well, safely exit
#
###################################################################################

exit

