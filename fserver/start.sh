#!/bin/bash

echo "Starting Form Frontend Server..."

# Start the backend API server
echo "Starting backend server on port 3001..."
NODE_ENV=development npx --yes tsx index.ts &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start the frontend development server
echo "Starting frontend server on port 3002..."
npm run dev:client &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Backend API: http://localhost:3001/api"
echo "Frontend: http://localhost:3002"
echo ""
echo "Access forms at: http://localhost:3002/form/[FORM_ID]"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for either process to exit
wait