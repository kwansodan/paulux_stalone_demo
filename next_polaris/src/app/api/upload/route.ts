import { NextRequest, NextResponse } from "next/server";
import { minioClient, BUCKET_NAME, getFileUrl } from "@/lib/minio";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

        // Ensure bucket exists
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
        if (!bucketExists) {
            await minioClient.makeBucket(BUCKET_NAME);
            // Set public read policy for the bucket
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

        await minioClient.putObject(BUCKET_NAME, fileName, buffer, file.size, {
            "Content-Type": file.type,
        });

        const url = getFileUrl(fileName);

        return NextResponse.json({
            success: true,
            url,
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed", details: error.message },
            { status: 500 }
        );
    }
}
