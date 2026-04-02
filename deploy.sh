#!/bin/bash

set -e  

# 1. Cargar variables desde el archivo .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: Archivo .env no encontrado."
    exit 1
fi

if [ -z "$SERVER_NAME" ] || [ -z "$REMOTE_PATH" ]; then
    echo "Error: SERVER_NAME o REMOTE_PATH no están definidos en el .env"
    exit 1
fi

echo "Building..."
npm run build

echo "Deploying to $SERVER_NAME..."

# 3. Usar las variables en el comando rsync
rsync -rvz --chmod=D755,F644 --delete _site/ "$SERVER_NAME:$REMOTE_PATH/"

echo "Deployed!"
