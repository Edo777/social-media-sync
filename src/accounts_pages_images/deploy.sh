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

cd ./$(dirname "$0")

# Install node modules
npm install

# migrate database
npm run migrate

# Set configs
PM2_NAMESPACE="$ENVIRONMENT_MODE"
PROC_NAME_APP="crons-load-account-pages-${PM2_NAMESPACE}"
MAX_CPU_APP=1

# Start or restart pm2
if [[ "$(pm2 id "$PROC_NAME_APP")" == "[]" ]]; then
  pm2 start --namespace "$PM2_NAMESPACE" ./bin/jobs --name $PROC_NAME_APP -i $MAX_CPU_APP
else
  pm2 restart $PROC_NAME_APP
fi