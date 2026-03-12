import * as Minio from 'minio';

const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = parseInt(process.env.MINIO_PORT || '9000');
const minioAccessKey = process.env.MINIO_ACCESS_KEY || '';
const minioSecretKey = process.env.MINIO_SECRET_KEY || '';
const minioUseSSL = process.env.MINIO_USE_SSL === 'true';

// For server-to-server communication inside Docker, we use the internal endpoint
// For generating URLs for the client, we use the public VPS_IP or the proxied domain
const vpsIp = process.env.VPS_IP || 'http://localhost';

export const minioClient = new Minio.Client({
    endPoint: minioEndpoint.replace('http://', '').replace('https://', ''),
    port: minioPort,
    useSSL: minioUseSSL,
    accessKey: minioAccessKey,
    secretKey: minioSecretKey,
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'polaris-services';

export const getFileUrl = (fileName: string) => {
    // If we're on the main domain in production, use the Caddy proxy path
    if (vpsIp.includes('polarisbeauty.biz')) {
        return `https://polarisbeauty.biz/files/${BUCKET_NAME}/${fileName}`;
    }

    // Fallback to direct IP with port (may trigger mixed content warnings on HTTPS sites)
    const protocol = minioUseSSL ? 'https' : 'http';
    const minioPublicEndpoint = vpsIp.replace('http://', '').replace('https://', '');
    const minioPublicPort = parseInt(process.env.NEXT_PUBLIC_MINIO_PORT || '9005');

    return `${protocol}://${minioPublicEndpoint}:${minioPublicPort}/${BUCKET_NAME}/${fileName}`;
};
