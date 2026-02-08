# Database Migration Guide: Supabase → Hosted PostgreSQL

This guide walks you through migrating from Supabase to your own hosted PostgreSQL database.

## Prerequisites

- Docker and Docker Compose installed
- Your hosted database is running (via `docker-compose up db -d`)

## Migration Steps

### 1. Environment Configuration ✅

The database URLs have been updated in `next_polaris/.env`:

```bash
DATABASE_URL="postgresql://postgres:pol56!Ris@db:5432/polaris"
DIRECT_URL="postgresql://postgres:pol56!Ris@db:5432/polaris"
```

### 2. Start the Database Container

```bash
cd /home/joojo/Desktop/polaris
docker-compose up db -d
```

Wait for the database to be healthy:

```bash
docker-compose ps db
```

### 3. Initialize Prisma Migrations

Since you don't have a migrations folder yet, you need to create an initial migration from your schema:

```bash
cd next_polaris
npx prisma migrate dev --name init
```

This will:
- Create a `prisma/migrations` folder
- Generate the initial migration SQL from your schema
- Apply the migration to your database
- Generate the Prisma Client

> **Note**: If you get a prompt asking to reset the database, choose **Yes** since this is a fresh database.

### 4. Verify the Migration

Check that tables were created:

```bash
docker exec -it polaris_db psql -U postgres -d polaris -c "\dt"
```

You should see tables like:
- `users`
- `bookings`
- `services`
- `payments`
- `business_hours`
- `blocked_dates`
- `Session`

### 5. Seed the Database (Optional)

If you have seed data in `prisma/seed.ts`:

```bash
npx prisma db seed
```

### 6. Generate Prisma Client

Ensure the Prisma Client is generated for your application:

```bash
npx prisma generate
```

## Alternative: Deploy Migrations Only (Production)

If you're deploying to production and don't want the interactive prompts:

```bash
npx prisma migrate deploy
```

This applies pending migrations without prompts.

## Troubleshooting

### Connection Issues

If you can't connect to the database:

1. **Check if the database is running:**
   ```bash
   docker-compose ps db
   ```

2. **Check database logs:**
   ```bash
   docker-compose logs db
   ```

3. **Test connection manually:**
   ```bash
   docker exec -it polaris_db psql -U postgres -d polaris
   ```

### Migration Conflicts

If you have existing data in Supabase that you want to migrate:

1. **Export data from Supabase:**
   ```bash
   pg_dump -h aws-1-eu-west-1.pooler.supabase.com -U postgres -d postgres > supabase_backup.sql
   ```

2. **Import to hosted database:**
   ```bash
   docker exec -i polaris_db psql -U postgres -d polaris < supabase_backup.sql
   ```

3. **Then run:**
   ```bash
   npx prisma migrate resolve --applied init
   ```

## Next Steps

After migration:

1. **Rebuild your Next.js app:**
   ```bash
   docker-compose build app
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Check application logs:**
   ```bash
   docker-compose logs -f app
   ```

## Rollback (If Needed)

To revert to Supabase, restore the old URLs in `next_polaris/.env`:

```bash
DATABASE_URL="postgresql://postgres.llcuyxkdcswvmwmpygyr:pKxNSrOfboT9qIsx@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.llcuyxkdcswvmwmpygyr:pKxNSrOfboT9qIsx@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```
