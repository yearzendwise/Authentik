#!/bin/bash

# Email Tracking Go Server Startup Script

echo "🚀 Starting Email Tracking Go Server..."

# Set default environment variables if not provided
export JWT_SECRET=${JWT_SECRET:-"your-secret-key"}
export TEMPORAL_HOST=${TEMPORAL_HOST:-"10.100.0.2:7233"}
export PORT=${PORT:-"8080"}

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