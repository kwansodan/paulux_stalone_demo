# MinIO File Storage Guide

MinIO is an S3-compatible object storage service that runs in your Docker environment. It's perfect for storing user uploads, profile images, and other media files.

## 🚀 Quick Start

### Access MinIO Console

Once your Docker containers are running:

1. **Console UI**: http://localhost:9001
2. **API Endpoint**: http://localhost:9000

**Default Credentials:**
- Username: `minioadmin`
- Password: `minioadmin123`

> ⚠️ **Important**: Change these credentials in production!

## 📦 What's Included

### Docker Service
- **MinIO Server** - Object storage service (port 9000)
- **MinIO Console** - Web UI for management (port 9001)
- **Persistent Storage** - Data stored in Docker volume `minio_data`

### Code Utilities
- **[next_paulux/src/lib/minio.ts](file:///home/joojo/Desktop/paulux/next_paulux/src/lib/minio.ts)** - Ready-to-use MinIO client with helper functions

## 🔧 Configuration

### Environment Variables

```bash
# MinIO Admin Credentials
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# Connection Settings
MINIO_ENDPOINT=minio              # Use 'localhost' if accessing outside Docker
MINIO_PORT=9000
MINIO_USE_SSL=false               # Set to 'true' in production with SSL

# Bucket Configuration
MINIO_BUCKET_NAME=paulux-uploads
```

### Production Settings

For production, update your `.env`:

```bash
# Strong credentials
MINIO_ROOT_USER=your_secure_username
MINIO_ROOT_PASSWORD=your_very_secure_password_min_8_chars

# Enable SSL
MINIO_USE_SSL=true

# Use custom domain (optional)
MINIO_ENDPOINT=files.yourdomain.com
```

## 💻 Usage Examples

### 1. Install MinIO Client Package

```bash
npm install minio
# or
yarn add minio
```

### 2. Upload a File (API Route Example)

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/minio';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to MinIO
    const fileName = `${Date.now()}-${file.name}`;
    const fileUrl = await uploadFile(buffer, fileName, 'uploads');

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### 3. Upload Profile Image

```typescript
import { uploadFile, deleteFile } from '@/lib/minio';

async function updateUserAvatar(userId: string, file: File) {
  // Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload with organized folder structure
  const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;
  const avatarUrl = await uploadFile(buffer, fileName, 'avatars');

  // Delete old avatar if exists
  // await deleteFile(`avatars/${oldFileName}`);

  return avatarUrl;
}
```

### 4. Get Presigned URL (Private Files)

```typescript
import { getPresignedUrl } from '@/lib/minio';

// Generate temporary URL for private files (expires in 1 hour)
const privateUrl = await getPresignedUrl('private/document.pdf', 3600);
```

### 5. List Files in Folder

```typescript
import { listFiles } from '@/lib/minio';

// Get all avatars
const avatars = await listFiles('avatars/');
console.log(avatars); // ['avatars/user1.jpg', 'avatars/user2.png', ...]
```

## 🗂️ Recommended Folder Structure

Organize your files with a clear folder structure:

```
paulux-uploads/
├── avatars/          # User profile images
├── posts/            # Post images/videos
├── services/         # Service-related images
├── documents/        # PDF, documents
├── temp/             # Temporary uploads
└── public/           # Publicly accessible files
```

## 🔒 Security Best Practices

### 1. File Validation

```typescript
// Validate file type and size
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }
}
```

### 2. Sanitize File Names

```typescript
function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-');
}
```

### 3. Set Bucket Policies

Use the MinIO Console or CLI to set appropriate bucket policies:

```bash
# Make bucket private (default)
mc anonymous set none myminio/paulux-uploads

# Make specific folder public
mc anonymous set download myminio/paulux-uploads/public
```

## 🌐 Production Deployment

### Option 1: Nginx Reverse Proxy

Update `nginx/nginx.conf` to proxy MinIO:

```nginx
# MinIO API
location /minio/ {
    proxy_pass http://minio:9000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# MinIO Console
location /minio-console/ {
    proxy_pass http://minio:9001/;
    proxy_set_header Host $host;
}
```

### Option 2: Custom Domain

Point a subdomain to your server:
- `files.yourdomain.com` → MinIO API (port 9000)
- `console.yourdomain.com` → MinIO Console (port 9001)

Update `.env`:
```bash
MINIO_ENDPOINT=files.yourdomain.com
MINIO_USE_SSL=true
```

## 🔍 Monitoring & Maintenance

### Check MinIO Status

```bash
# View MinIO logs
docker compose logs minio -f

# Check MinIO health
curl http://localhost:9000/minio/health/live
```

### Backup MinIO Data

```bash
# Backup MinIO data volume
docker run --rm \
  -v paulux_minio_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz /data
```

### Restore MinIO Data

```bash
# Restore from backup
docker run --rm \
  -v paulux_minio_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/minio-backup-20260122.tar.gz -C /
```

## 📊 Storage Limits

MinIO has no hard limits, but consider:

- **Disk Space**: Monitor your server's available storage
- **Object Size**: Default max is 5TB per object
- **Performance**: Scales well with proper hardware

### Monitor Storage Usage

```bash
# Check volume size
docker system df -v | grep minio_data

# Check bucket size via MinIO Console
# Or use MinIO client:
mc du myminio/paulux-uploads
```

## 🛠️ Troubleshooting

### Connection Refused

```bash
# Check if MinIO is running
docker compose ps minio

# Check MinIO logs
docker compose logs minio

# Restart MinIO
docker compose restart minio
```

### Bucket Not Found

```bash
# Create bucket manually
docker compose exec minio \
  mc mb /data/paulux-uploads
```

### Permission Denied

```bash
# Check volume permissions
docker compose exec minio ls -la /data

# Fix permissions
docker compose exec minio chown -R minio:minio /data
```

## 📚 Additional Resources

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [MinIO JavaScript Client](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)
- [S3 API Compatibility](https://min.io/docs/minio/linux/developers/s3-compatible.html)

## 🎯 Next Steps

1. **Install MinIO client package**: `npm install minio`
2. **Start Docker services**: `docker compose up -d`
3. **Access MinIO Console**: http://localhost:9001
4. **Create your first bucket** using the console or the provided utility
5. **Test file upload** using the example API route
