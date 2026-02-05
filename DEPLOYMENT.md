# Deployment Guide

This guide covers deploying the Polaris application to a Linux server using Docker Compose and GitHub Actions.

## Prerequisites

### On Your Linux Server

1. **Docker & Docker Compose**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Add your user to docker group
   sudo usermod -aG docker $USER
   
   # Install Docker Compose
   sudo apt-get update
   sudo apt-get install docker-compose-plugin
   ```

2. **SSH Access**
   - Ensure SSH is enabled on your server
   - Have your SSH private key ready for GitHub Actions

3. **Firewall Configuration**
   ```bash
   # Allow HTTP, HTTPS, and SSH
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

### On GitHub

Set up the following **Repository Secrets** (Settings → Secrets and variables → Actions):

#### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERVER_HOST` | Your server IP or domain | `123.45.67.89` or `server.example.com` |
| `SERVER_USERNAME` | SSH username | `ubuntu` or `root` |
| `SSH_PRIVATE_KEY` | Your SSH private key | Contents of `~/.ssh/id_rsa` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@db:5432/polaris` |
| `DATABASE_PASSWORD` | Database password | `your_secure_password` |
| `DB_USER` | Database username | `postgres` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | `sk_live_...` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_live_...` |
| `NEXT_PUBLIC_APP_URL` | Your app URL | `https://yourdomain.com` |
| `RESEND_API_KEY` | Resend API key | `re_...` |
| `NEXTAUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) | Random 32-char string |
| `NEXTAUTH_URL` | NextAuth URL (same as APP_URL) | `https://yourdomain.com` |
| `MINIO_ROOT_USER` | MinIO admin username | `minioadmin` |
| `MINIO_ROOT_PASSWORD` | MinIO admin password | `secure_password_123` |
| `MINIO_ENDPOINT` | MinIO endpoint | `minio` |
| `MINIO_PORT` | MinIO port | `9000` |
| `MINIO_USE_SSL` | Use SSL for MinIO | `false` |
| `MINIO_BUCKET_NAME` | MinIO bucket name | `polaris-uploads` |

#### Optional Secrets

| Secret Name | Description | Default |
|-------------|-------------|---------|
| `SERVER_PORT` | SSH port | `22` |
| `DEPLOY_PATH` | Deployment directory on server | `~/polaris` |
| `DOCKERHUB_USERNAME` | Docker Hub username (if using) | - |
| `DOCKERHUB_TOKEN` | Docker Hub token (if using) | - |

## Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd polaris
   ```

2. **Set up environment variables**
   ```bash
   cp example.env .env
   # Edit .env with your local values
   ```

3. **Update Next.js configuration**
   
   Add to `next.config.js`:
   ```javascript
   module.exports = {
     output: 'standalone', // Required for Docker
     // ... other config
   }
   ```

4. **Run with Docker Compose**
   ```bash
   docker compose up -d
   ```

5. **Access the application**
   - App: http://localhost:3000
   - Database: localhost:5432
   - MinIO Console: http://localhost:9001
   - MinIO API: http://localhost:9000

## Production Deployment

### Initial Setup

1. **Prepare your server**
   ```bash
   # SSH into your server
   ssh user@your-server
   
   # Create deployment directory
   mkdir -p ~/polaris
   ```

2. **Generate SSH key for GitHub Actions** (if you don't have one)
   ```bash
   # On your local machine
   ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
   
   # Copy public key to server
   ssh-copy-id -i ~/.ssh/github_actions.pub user@your-server
   
   # Copy private key content to GitHub secret SSH_PRIVATE_KEY
   cat ~/.ssh/github_actions
   ```

3. **Configure GitHub Secrets**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add all required secrets listed above

### Automated Deployment

Every push to the `main` branch will automatically:
1. Build the Docker images
2. Copy files to your server
3. Deploy using Docker Compose
4. Run health checks

### Manual Deployment

You can also trigger deployment manually:
1. Go to Actions tab in GitHub
2. Select "Deploy to Production" workflow
3. Click "Run workflow"

## Production Domain Setup: nginx-proxy

You are running a shared `nginx-proxy` on your server. To expose this app:

1.  **Identify Network**:
    Ensure your server has the `nginx-proxy` network (check `docker network ls`).
    If it's named differently, update `docker-compose.yml` -> `networks` -> `proxy_network` -> `name`.

2.  **Deploy**:
    ```bash
    docker compose up -d
    ```

3.  **Verification**:
    The `nginx-proxy` container will automatically detect the new container, generate certificates via `acme-companion`, and route `polarisbeauty.biz` to your app.
    - Check usage: `docker logs nginx-proxy`


---



## Monitoring & Maintenance

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f db
docker compose logs -f caddy
```

### Check Service Status
```bash
docker compose ps
```

### Database Backup
```bash
# Create backup
docker compose exec db pg_dump -U postgres polaris > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose exec -T db psql -U postgres polaris < backup_20260122.sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose up -d --build
```

### Cleanup
```bash
# Remove old images
docker image prune -f

# Remove old containers
docker container prune -f

# Remove old volumes (CAUTION: This deletes data)
# docker volume prune -f
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs app

# Check environment variables
docker compose exec app env

# Restart services
docker compose restart
```

### Database connection issues
```bash
# Test database connection
docker compose exec db pg_isready -U postgres

# Access database
docker compose exec db psql -U postgres polaris
```

### Port already in use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

## Security Checklist

- [ ] Change default database password
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Use production Paystack keys
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable database backups
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Review CORS settings
- [ ] Keep Docker images updated

## Performance Optimization

1. **Enable caching in Nginx** (already configured)
2. **Use CDN for static assets** (Cloudflare, AWS CloudFront)
3. **Optimize Next.js build**
   - Enable image optimization
   - Use static generation where possible
4. **Database optimization**
   - Add indexes for frequently queried fields
   - Regular VACUUM operations
5. **Monitor resource usage**
   ```bash
   docker stats
   ```

## Support

For issues or questions:
- Check logs: `docker compose logs`
- Review GitHub Actions workflow runs
- Check server resources: `htop`, `df -h`
