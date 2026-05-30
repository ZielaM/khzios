#!/bin/sh
set -e

echo "Running database migrations..."
pnpm prisma migrate deploy

echo "Seeding database..."
pnpm db:seed

echo "Starting application..."
exec "$@"
