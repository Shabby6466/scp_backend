#!/bin/bash

# Configuration
PROJECT_NAME="scp"
DOCKER_COMPOSE_FILE="docker-compose.yaml"

# Change to the script's directory
cd "$(dirname "$0")"

echo "🚀 Starting deployment for $PROJECT_NAME..."

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start services
echo "📦 Building and starting containers..."
docker-compose -p $PROJECT_NAME -f $DOCKER_COMPOSE_FILE up --build -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to initialize..."
MAX_RETRIES=30
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
    if docker logs scp_backend 2>&1 | grep -q "Nest application successfully started"; then
        echo "✅ Backend is UP and running!"
        break
    fi
    sleep 2
    COUNT=$((COUNT+1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "⚠️ Warning: Backend initialization timed out or failed to start. Check logs with 'docker logs scp_backend'."
fi

# Optional: Run database seed if it's the first time
# echo "🌱 Running database seeds..."
# docker exec -it scp_backend npm run db:seed

echo "✨ Deployment finished!"
echo "🌐 Frontend available at: http://localhost:8091"
echo "🔗 API Proxy available at: http://localhost:8091/api"
echo "📊 Database (Postgres) available at: localhost:5435"
