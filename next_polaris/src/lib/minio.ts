import * as Minio from 'minio';

// Internal endpoint — must match the Docker container name used by Caddy's reverse_proxy
// so the Host header embedded in signatures matches what Caddy forwards to MinIO.
const minioEndpoint = process.env.MINIO_ENDPOINT || 'polaris_minio';
const minioPort = parseInt(process.env.MINIO_PORT || '9000');
const minioAccessKey = process.env.MINIO_ACCESS_KEY || '';
const minioSecretKey = process.env.MINIO_SECRET_KEY || '';

// Single internal client — used for all server-side operations.
// Presigned URLs are generated here (against the internal endpoint),
// then the internal host is replaced with the public domain before returning to the browser.
export const minioClient = new Minio.Client({
    endPoint: minioEndpoint,
    port: minioPort,
    useSSL: false,
    accessKey: minioAccessKey,
    secretKey: minioSecretKey,
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'polaris-services';

// The public base path that Caddy proxies to MinIO.
// Caddy strips /files/ and forwards the rest to polaris_minio:9000.
const MINIO_PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT || 'https://polarisbeauty.biz/files';
const MINIO_INTERNAL_ORIGIN = `http://${minioEndpoint}:${minioPort}`;

/**
 * Rewrites an internally-generated MinIO URL to its public equivalent.
 * e.g. http://polaris_minio:9000/polaris-services/file.jpg
 *   → https://polarisbeauty.biz/files/polaris-services/file.jpg
 *
 * The AWS Sig V4 Host header stays valid because Caddy forwards the request
 * to polaris_minio:9000 using that same host — matching the signed header.
 */
export const toPublicUrl = (internalUrl: string): string => {
    return internalUrl.replace(MINIO_INTERNAL_ORIGIN, MINIO_PUBLIC_ENDPOINT);
};

/**
 * Returns the permanent public URL for a stored object (no expiry, no signature).
 * Works because the bucket has a public-read policy.
 */
export const getFileUrl = (objectName: string): string => {
    return `${MINIO_PUBLIC_ENDPOINT}/${BUCKET_NAME}/${objectName}`;
};
