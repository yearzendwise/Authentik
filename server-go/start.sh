#!/bin/bash

# Email Tracking Go Server Startup Script

echo "🚀 Starting Email Tracking Go Server..."

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set default environment variables if not provided
export JWT_SECRET=${JWT_SECRET:-"Cvgii9bYKF1HtfD8TODRyZFTmFP4vu70oR59YrjGVpS2fXzQ41O3UPRaR8u9uAqNhwK5ZxZPbX5rAOlMrqe8ag=="}
export TEMPORAL_HOST=${TEMPORAL_HOST:-"172.72.0.9:7233"}
export PORT=${PORT:-"8095"}

echo "📋 Configuration:"
echo "   PORT: $PORT"
echo "   TEMPORAL_HOST: $TEMPORAL_HOST"
echo "   JWT_SECRET: [HIDDEN]"

# Build and run the Go server
echo "🔨 Building Go server..."
go build -o email-tracking-server main.go

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    echo "🏃 Running server..."
    ./email-tracking-server
else
    echo "❌ Build failed"
    exit 1
fi