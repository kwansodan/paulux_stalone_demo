# Traefik Deployment Quick Reference

## Deploy to Production

```bash
# 1. SSH into production server
ssh user@your-server

# 2. Navigate to project
cd /path/to/polaris

# 3. Pull latest changes
git pull origin main

# 4. Deploy with Traefik
docker-compose down
docker-compose up -d --build

# 5. Monitor certificate acquisition
docker logs -f polaris_traefik
```

## Verify Deployment

1. **HTTP → HTTPS Redirect**: Visit `http://polarisbeauty.biz` (should redirect to HTTPS)
2. **SSL Certificate**: Check padlock icon in browser
3. **Application**: Test at `https://polarisbeauty.biz`
4. **Dashboard**: Access at `https://traefik.polarisbeauty.biz`

## Troubleshooting

```bash
# Check container status
docker ps | grep polaris

# View Traefik logs
docker logs polaris_traefik

# View app logs
docker logs polaris_app

# Restart Traefik
docker-compose restart traefik
```

## Important Notes

- **Port 80 Required**: Must be accessible from internet for Let's Encrypt
- **DNS**: Ensure `polarisbeauty.biz` points to your server IP
- **Auto-Renewal**: Certificates renew automatically 30 days before expiration
- **Rate Limits**: Let's Encrypt allows 50 certs/domain/week

## Files Changed

- ✅ `traefik.yml` - Traefik configuration
- ✅ `docker-compose.yml` - Added Traefik service, updated app routing
- ✅ `.gitignore` - Added Traefik files
