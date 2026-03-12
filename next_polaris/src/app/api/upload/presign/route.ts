import { NextRequest, NextResponse } from "next/server";
import { minioClient, minioClientPublic, BUCKET_NAME, getFileUrl } from "@/lib/minio";

export async function POST(request: NextRequest) {
    try {
        const { filename, fileType } = await request.json();

        if (!filename || !fileType) {
            return NextResponse.json(
                { error: "filename and fileType are required" },
                { status: 400 }
            );
        }

        // 1. Ensure bucket exists and has public read policy
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
        if (!bucketExists) {
            await minioClient.makeBucket(BUCKET_NAME);

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
        }

        // 2. Configure CORS on the bucket for direct browser uploads
        // This allows your domain to perform PUT/OPTIONS requests
        const corsConfig = {
            CORSRules: [
                {
                    AllowedOrigins: ["https://polarisbeauty.biz"],
                    AllowedMethods: ["PUT", "GET", "HEAD", "POST"],
                    AllowedHeaders: ["*"],
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3000
                }
            ]
        };
        // setBucketCors is not directly available in standard minio node sdk via simple call 
        // but we can use the internal client for this if needed. 
        // For now, most MinIO instances allow CORS by default if configured via console,
        // but let's ensure we generate the URL correctly first.

        const objectName = `${Date.now()}-${filename.replace(/\s+/g, "-")}`;

        // 3. Generate presigned PUT URL using the PUBLIC client
        // This will generate a URL starting with https://polarisbeauty.biz/
        let uploadUrl = await minioClientPublic.presignedPutObject(
            BUCKET_NAME,
            objectName,
            5 * 60
        );

        // Rewrite the presigned URL to always use the public HTTPS endpoint.
        // The SDK may generate urls with the internal Docker hostname (e.g. http://minio:9000)
        // or the public host without the /files/ prefix that Caddy expects.
        // Strip whatever origin was produced and replace with the correct public base.
        uploadUrl = uploadUrl.replace(/^https?:\/\/[^/]+\//, 'https://polarisbeauty.biz/files/');

        const publicUrl = getFileUrl(objectName);

        return NextResponse.json({
            success: true,
            uploadUrl,
            publicUrl,
            objectName,
        });
    } catch (error: any) {
        console.error("Presign error:", error);
        return NextResponse.json(
            { error: "Failed to generate presigned URL", details: error.message },
            { status: 500 }
        );
    }
}
