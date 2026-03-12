import * as Minio from 'minio';

const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = parseInt(process.env.MINIO_PORT || '9000');
const minioAccessKey = process.env.MINIO_ACCESS_KEY || '';
const minioSecretKey = process.env.MINIO_SECRET_KEY || '';
const minioUseSSL = process.env.MINIO_USE_SSL === 'true';

export const minioClient = new Minio.Client({
    endPoint: minioEndpoint.replace('http://', '').replace('https://', ''),
    port: minioPort,
    useSSL: minioUseSSL,
    accessKey: minioAccessKey,
    secretKey: minioSecretKey,
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'polaris-services';

export const getFileUrl = (fileName: string) => {
    return `https://polarisbeauty.biz/files/${BUCKET_NAME}/${fileName}`;
};
