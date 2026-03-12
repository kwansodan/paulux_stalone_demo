import * as Minio from 'minio';

const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = parseInt(process.env.MINIO_PORT || '9000');
const minioAccessKey = process.env.MINIO_ACCESS_KEY || '';
const minioSecretKey = process.env.MINIO_SECRET_KEY || '';
const minioUseSSL = process.env.MINIO_USE_SSL === 'true';

// Internal client for server-side operations (makeBucket, etc.)
export const minioClient = new Minio.Client({
    endPoint: minioEndpoint.replace('http://', '').replace('https://', ''),
    port: minioPort,
    useSSL: minioUseSSL,
    accessKey: minioAccessKey,
    secretKey: minioSecretKey,
});

// External client for generating presigned URLs that the browser can visit
// We use the proxied domain but treat it as the "endpoint" for URL generation
export const minioClientPublic = new Minio.Client({
    endPoint: 'polarisbeauty.biz',
    port: 443,
    useSSL: true,
    accessKey: minioAccessKey,
    secretKey: minioSecretKey,
    pathStyle: true // Important: uses /bucket/file instead of bucket.domain
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'polaris-services';

export const getFileUrl = (fileName: string) => {
    return `https://polarisbeauty.biz/files/${BUCKET_NAME}/${fileName}`;
};
