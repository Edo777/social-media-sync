#!/usr/bin/env bash
cd ./$(dirname "$0")

# Install node modules
npm install

# Update google sdk
npm run update:google:sdk