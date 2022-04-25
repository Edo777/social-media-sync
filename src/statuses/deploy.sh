#!/usr/bin/env bash
cd ./$(dirname "$0")

# Install node modules
npm install

# migrate database
npm run migrate

# Set configs
ENVIRONMENT_MODE=$1
PM2_NAMESPACE="$ENVIRONMENT_MODE"
PROC_NAME_APP="crons-status-sync-${PM2_NAMESPACE}"
MAX_CPU_APP=1

# Start or restart pm2
if [[ "$(pm2 id "$PROC_NAME_APP")" == "[]" ]]; then
  pm2 start --namespace "$PM2_NAMESPACE" ./bin/jobs --name $PROC_NAME_APP -i $MAX_CPU_APP
else
  pm2 restart $PROC_NAME_APP
fi