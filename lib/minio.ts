import { Client } from 'minio';

// MinIO client configuration
const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'polaris-uploads';

/**
 * Initialize MinIO bucket
 * Creates the bucket if it doesn't exist
 */
export async function initializeBucket() {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            console.log(`Bucket '${BUCKET_NAME}' created successfully`);
        }
    } catch (error) {
        console.error('Error initializing MinIO bucket:', error);
        throw error;
    }
}

/**
 * Upload a file to MinIO
 * @param file - File buffer or stream
 * @param fileName - Name to save the file as
 * @param folder - Optional folder path (e.g., 'avatars', 'posts')
 * @returns Object URL of the uploaded file
 */
export async function uploadFile(
    file: Buffer | NodeJS.ReadableStream,
    fileName: string,
    folder?: string
): Promise<string> {
    try {
        const objectName = folder ? `${folder}/${fileName}` : fileName;

        if (Buffer.isBuffer(file)) {
            await minioClient.putObject(BUCKET_NAME, objectName, file);
        } else {
            await minioClient.putObject(BUCKET_NAME, objectName, file);
        }

        // Generate public URL
        const url = await getFileUrl(objectName);
        return url;
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
        return await minioClient.presignedGetObject(
            BUCKET_NAME,
            objectName,
            expirySeconds
        );
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw error;
    }
}

/**
 * Get public URL for a file
 * @param objectName - Name of the object in MinIO
 * @returns Public URL
 */
export async function getFileUrl(objectName: string): Promise<string> {
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const endpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'localhost';
    const port = process.env.NEXT_PUBLIC_MINIO_PORT || '9005';

    // For production, you might want to use a custom domain or reverse proxy
    return `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${objectName}`;
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

export { minioClient, BUCKET_NAME };
