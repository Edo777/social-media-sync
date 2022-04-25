#!/usr/bin/env bash
ENVIRONMENT_MODE=$1

for MODULE in $(ls ./src/); do
    scriptToExecute="./src/${MODULE}/deploy.sh"

    if [ -f "$scriptToExecute" ]; then
      bash "$scriptToExecute" "$ENVIRONMENT_MODE"
    else
      echo "DEPLOY FILE DOESNT EXISTS IN MODULE => ${MODULE}"
    fi
done