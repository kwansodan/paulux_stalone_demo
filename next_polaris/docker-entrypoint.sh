#!/bin/sh
set -e

echo "🔍 Checking Prisma files..."
ls -la prisma/ || echo "Warning: prisma directory not found"

echo "🚀 Pushing database schema..."
prisma db push --accept-data-loss --schema=./prisma/schema.prisma --datasource-url="$DATABASE_URL"

echo "✅ Schema updated!"
echo "🌟 Starting Next.js application..."
exec node server.js
