#!/bin/bash
# deploy.sh — build y subida a siyuan.es
# Uso: ./deploy.sh

set -e  # para si hay cualquier error

SERVER="servername"
REMOTE_PATH="remotepath"

echo "Building..."
npm run build

echo "Deploying to $SERVER..."

rsync -rvz --chmod=D755,F644 --delete _site/ "$SERVER:$REMOTE_PATH/"

echo "Deployed!"
