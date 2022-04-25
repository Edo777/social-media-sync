#!/usr/bin/env bash

# Clear terminal
clear
echo ""

ENVIRONMENT_MODE=$1
if [[ "dev" != $ENVIRONMENT_MODE && "dev2" != $ENVIRONMENT_MODE && "prod" != $ENVIRONMENT_MODE ]]; then
  echo -e " \033[0;31mPlease specify build environment, it must be one of followings:\033[0m"
  echo -e "   \033[0;33m* dev \033[0m - for development environment."
  echo -e "   \033[0;33m* dev2\033[0m - for dev2-test environment."
  echo -e "   \033[0;33m* prod\033[0m - for production environment."

  echo ""
  exit
fi

for MODULE in $(ls ./src/); do
    scriptToExecute="./src/${MODULE}/deploy.sh"

    if [ -f "$scriptToExecute" ]; then
      bash "$scriptToExecute" "$ENVIRONMENT_MODE"
    else
      echo "DEPLOY FILE DOESNT EXISTS IN MODULE => ${MODULE}"
    fi
done