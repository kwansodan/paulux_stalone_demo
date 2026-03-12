import { NextRequest, NextResponse } from "next/server";
import { minioClient, BUCKET_NAME, getFileUrl } from "@/lib/minio";

export async function POST(request: NextRequest) {
    try {
        const { filename, fileType } = await request.json();

        if (!filename || !fileType) {
            return NextResponse.json(
                { error: "filename and fileType are required" },
                { status: 400 }
            );
        }

        // Ensure bucket exists
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
        if (!bucketExists) {
            await minioClient.makeBucket(BUCKET_NAME);

            // Set public read policy for the new bucket
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

        const objectName = `${Date.now()}-${filename.replace(/\s+/g, "-")}`;

        // Generate presigned PUT URL (expires in 5 minutes)
        const uploadUrl = await minioClient.presignedPutObject(
            BUCKET_NAME,
            objectName,
            5 * 60
        );

        // Generate the final public URL that the app will use
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
