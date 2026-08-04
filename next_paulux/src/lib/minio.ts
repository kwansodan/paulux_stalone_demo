import * as Minio from 'minio';
import { Readable } from 'stream';

// Internal endpoint — the Compose service name. When a reverse proxy sits in
// front of MinIO it must forward this same Host header, or the Host embedded in
// presigned signatures won't match what MinIO receives.
const minioEndpoint = process.env.MINIO_ENDPOINT || 'minio';
const minioPort = parseInt(process.env.MINIO_PORT || '9000');
const minioAccessKey = process.env.MINIO_ACCESS_KEY || '';
const minioSecretKey = process.env.MINIO_SECRET_KEY || '';
const useSSL = process.env.MINIO_USE_SSL === 'true';

// Single internal client — used for all server-side operations.
// Presigned URLs are generated here (against the internal endpoint),
// then the internal host is replaced with the public domain before returning to the browser.
export const minioClient = new Minio.Client({
    endPoint: minioEndpoint,
    port: minioPort,
    useSSL: useSSL,
    accessKey: minioAccessKey,
    secretKey: minioSecretKey,
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'paulux-uploads';

// Public origin uploaded files are served from. MUST be set in the environment:
// the fallback only suits a deployment sitting behind a proxy that maps /files/
// to this MinIO, and is wrong everywhere else.
const MINIO_PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT || 'https://pauluxbooking.com/files';
const MINIO_INTERNAL_ORIGIN = `http://${minioEndpoint}:${minioPort}`;

/**
 * Initialize MinIO bucket
 * Creates the bucket if it doesn't exist and sets public-read policy
 */
export async function initializeBucket() {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            const policy = {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: { AWS: ["*"] },
                        Action: ["s3:GetObject"],
                        Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
                    },
                ],
            };
            await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
            console.log(`Bucket '${BUCKET_NAME}' created successfully with public-read policy`);
        }
    } catch (error) {
        console.error('Error initializing MinIO bucket:', error);
        throw error;
    }
}

/**
 * Rewrites an internally-generated MinIO URL to its public equivalent.
 * e.g. http://paulux_minio:9000/paulux-uploads/file.jpg
 *   → https://pauluxbooking.com/files/paulux-uploads/file.jpg
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

/**
 * Upload a file to MinIO
 * @param file - File buffer or stream
 * @param fileName - Name to save the file as
 * @param folder - Optional folder path (e.g., 'avatars', 'posts')
 * @param contentType - Optional content type
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
    file: Buffer | Readable,
    fileName: string,
    folder?: string,
    contentType?: string
): Promise<string> {
    try {
        const objectName = folder ? `${folder}/${fileName}` : fileName;
        const metaData = contentType ? { 'Content-Type': contentType } : {};

        if (Buffer.isBuffer(file)) {
            await minioClient.putObject(BUCKET_NAME, objectName, file, file.length, metaData);
        } else {
            // For streams, we might not know the exact length, but minio client handles it if omitted 
            // or we can pass -1 if unknown? Actually, it's better to provide size if known.
            await minioClient.putObject(BUCKET_NAME, objectName, file, undefined, metaData);
        }

        return getFileUrl(objectName);
    } catch (error) {
        console.error('Error uploading file to MinIO:', error);
        throw error;
    }
}

/**
 * Get a presigned URL for a file (for private files)
 * @param objectName - Name of the object in MinIO
 * @param expirySeconds - URL expiry time in seconds (default: 24 hours)
 * @returns Presigned URL
 */
export async function getPresignedUrl(
    objectName: string,
    expirySeconds: number = 24 * 60 * 60
): Promise<string> {
    try {
        const internalUrl = await minioClient.presignedGetObject(
            BUCKET_NAME,
            objectName,
            expirySeconds
        );
        return toPublicUrl(internalUrl);
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw error;
    }
}

/**
 * Delete a file from MinIO
 * @param objectName - Name of the object to delete
 */
export async function deleteFile(objectName: string): Promise<void> {
    try {
        await minioClient.removeObject(BUCKET_NAME, objectName);
    } catch (error) {
        console.error('Error deleting file from MinIO:', error);
        throw error;
    }
}

/**
 * List all files in a folder
 * @param prefix - Folder prefix (e.g., 'avatars/')
 * @returns Array of file names
 */
export async function listFiles(prefix?: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const files: string[] = [];
        const stream = minioClient.listObjects(BUCKET_NAME, prefix, true);

        stream.on('data', (obj) => {
            if (obj.name) {
                files.push(obj.name);
            }
        });

        stream.on('error', (err) => {
            reject(err);
        });

        stream.on('end', () => {
            resolve(files);
        });
    });
}
