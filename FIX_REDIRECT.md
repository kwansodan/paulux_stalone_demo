# Fix for Domain Redirect Issue

The browser is redirecting to `https://51.210.183.70/` instead of staying on `https://polarisbeauty.biz`.

## Root Cause

Your Next.js app or NextAuth is detecting the request's host as the IP address instead of the domain name. This happens because nginx-proxy forwards requests but the app doesn't know to trust the proxy headers.

## Solution

On your VPS server, check and update the `.env` file:

```bash
# SSH into VPS
ssh ubuntu@your-vps

# Navigate to project
cd ~/polaris

# Edit .env file
nano .env

# Make sure these are set correctly:
NEXTAUTH_URL=https://polarisbeauty.biz
NEXT_PUBLIC_APP_URL=https://polarisbeauty.biz

# Save and exit (Ctrl+X, Y, Enter)

# Restart the app
docker-compose restart app

# Wait 10 seconds
sleep 10

# Test
curl -L https://polarisbeauty.biz | head -20
```

## If That Doesn't Work

The issue might be in NextAuth configuration. Check if you have a `pages/api/auth/[...nextauth].ts` file and ensure it has:

```typescript
export default NextAuth({
  // ... other config
  trustHost: true,  // Add this line
})
```

## Alternative: Clear Browser Cache

Sometimes the browser caches the redirect. Try:
1. Open browser in **Incognito/Private mode**
2. Visit `https://polarisbeauty.biz`
3. If it works in incognito, clear your browser cache

## Quick Commands for VPS

```bash
# Check current environment variables in container
docker exec polaris_app env | grep -E "NEXTAUTH_URL|NEXT_PUBLIC_APP_URL"

# View app logs for any redirect messages
docker logs polaris_app --tail 50

# Restart everything
docker-compose down && docker-compose up -d
```
