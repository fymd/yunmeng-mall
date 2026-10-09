#!/bin/bash
# One-click deploy / update on cloud host
set -e
echo "==> Pulling latest code..."
git pull

echo "==> Building and starting containers..."
docker compose up -d --build

echo "==> Waiting for health..."
sleep 5
curl -sf http://localhost:3000/api/health && echo " OK" || echo " Health check failed (app may still be starting)"

echo "==> Deploy finished."
docker compose ps
