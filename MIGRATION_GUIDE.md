# Prisma 7 Migration Steps (Updated)

## What Changed

Prisma 7 moved database URLs from `schema.prisma` to `prisma.config.ts`. I've updated both files.

## Migration Steps for VPS

### 1. **Pull Latest Changes**
```bash
git pull origin main
```

### 2. **Start the Database Container**
```bash
cd /home/joojo/Desktop/paulux
docker-compose up db -d
```

### 3. **Wait for Database to be Ready**
```bash
docker-compose ps db
# Wait until status shows "healthy"
```

### 4. **Initialize Prisma Migrations**
```bash
cd next_paulux
npx prisma migrate dev --name init
```

### 5. **Verify Tables Were Created**
```bash
docker exec -it paulux_db psql -U postgres -d paulux -c "\dt"
```

### 6. **Seed Database (Optional)**
```bash
npx prisma db seed
```

### 7. **Rebuild & Restart Your App**
```bash
cd ..
docker-compose build app
docker-compose up -d
```

### 8. **Check Logs**
```bash
docker-compose logs -f app
```

## Files Updated ✅

1. ✅ `next_paulux/.env` - Updated DATABASE_URL and DIRECT_URL
2. ✅ `next_paulux/prisma/schema.prisma` - Removed url/directUrl (Prisma 7 requirement)
3. ✅ `next_paulux/prisma.config.ts` - Uses DATABASE_URL for runtime connections

## Quick Production Deploy

```bash
cd next_paulux
npx prisma migrate deploy
```
