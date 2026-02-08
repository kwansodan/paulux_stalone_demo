#!/bin/sh
set -e

echo "🔍 Checking Prisma files..."
ls -la prisma/ || echo "Warning: prisma directory not found"

echo "🚀 Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "✅ Migrations complete!"
echo "🌟 Starting Next.js application..."
exec node server.js
