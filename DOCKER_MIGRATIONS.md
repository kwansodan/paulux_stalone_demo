# Running Migrations in Docker Container

## ✅ Automatic Migrations (Recommended - Already Configured)

I've updated your setup to run migrations automatically when the container starts:

**Files modified:**
- `docker-entrypoint.sh` - Runs migrations before starting the app
- `Dockerfile.prod` - Includes Prisma CLI and uses the entrypoint script

**How it works:**
Every time you start the app container, it will:
1. Run `npx prisma migrate deploy`
2. Start the Next.js application

**Usage:**
```bash
docker-compose up -d
# Migrations run automatically!
```

---

## Manual Migration Options

### Option 1: Run in App Container (One-time)

```bash
# If container is running
docker exec -it paulux_app npx prisma migrate deploy

# Or run as a one-off command
docker-compose run --rm app npx prisma migrate deploy
```

### Option 2: Generate New Migration

```bash
# Create a new migration
docker-compose run --rm app npx prisma migrate dev --name your_migration_name

# Or exec into running container
docker exec -it paulux_app npx prisma migrate dev --name your_migration_name
```

### Option 3: Reset Database (Development Only)

```bash
docker-compose run --rm app npx prisma migrate reset
```

### Option 4: Check Migration Status

```bash
docker exec -it paulux_app npx prisma migrate status
```

---

## Complete Deployment Workflow

```bash
# 1. Pull latest code
git pull origin main

# 2. Start database
docker-compose up db -d

# 3. Build and start app (migrations run automatically)
docker-compose up app -d

# 4. Check logs to verify migrations ran
docker-compose logs -f app
```

You should see output like:
```
Running database migrations...
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "paulux"

1 migration found in prisma/migrations

Applying migration `20260208_init`

The following migration(s) have been applied:

migrations/
  └─ 20260208_init/
    └─ migration.sql

All migrations have been successfully applied.
Starting Next.js application...
```

---

## Troubleshooting

### Migration Fails

Check the database connection:
```bash
docker exec -it paulux_db psql -U postgres -d paulux -c "SELECT version();"
```

### View Migration Logs

```bash
docker-compose logs app | grep -i migration
```

### Force Rebuild

```bash
docker-compose build --no-cache app
docker-compose up -d
```

### Manual Database Access

```bash
docker exec -it paulux_db psql -U postgres -d paulux
```

---

## Environment Variables

Make sure these are set in `next_paulux/.env`:

```bash
DATABASE_URL="postgresql://postgres:pol56!Ris@db:5432/paulux"
DIRECT_URL="postgresql://postgres:pol56!Ris@db:5432/paulux"
```

---

## Next Steps

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Add automatic migrations to Docker"
   git push
   ```

2. **Deploy on VPS:**
   ```bash
   git pull
   docker-compose build app
   docker-compose up -d
   ```

Migrations will now run automatically every time the container starts! 🚀
