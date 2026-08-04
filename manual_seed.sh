#!/bin/bash
set -e

echo "Starting database seeding process..."

# Ensure we are in the correct directory (optional check)
# cd /home/ubuntu/paulux

# Check if the app container is running
if [ "$(docker ps -q -f name=paulux_app)" ]; then
    echo "Container 'paulux_app' is running."
    
    # Exec into the container and run the seed command
    # Using -T to avoid TTY issues in non-interactive shells, but script is interactive usually.
    # If running manually, we can omit -T or keep it.
    echo "Running 'npm run prisma-seed' inside the container..."
    docker compose exec app npm run prisma-seed
    
    echo "Seeding completed successfully."
else
    echo "Error: Container 'paulux_app' is not running."
    echo "Please start the containers with 'docker compose up -d' first."
    exit 1
fi
