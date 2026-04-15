import { NextRequest, NextResponse } from "next/server";
import { minioClient, BUCKET_NAME, getFileUrl } from "@/lib/minio";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
        }

        // 5 MB limit
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
        }

        const folder = request.nextUrl.searchParams.get("folder")
        const baseName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
        const objectName = folder ? `${folder}/${baseName}` : baseName;

        // Ensure bucket exists with a public-read policy
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

        // Convert the browser File/Blob to a Node.js Readable stream
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = Readable.from(buffer);

        await minioClient.putObject(BUCKET_NAME, objectName, stream, buffer.length, {
            "Content-Type": file.type,
        });

        const publicUrl = getFileUrl(objectName);

        return NextResponse.json({ success: true, publicUrl, objectName });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed", details: error.message },
            { status: 500 }
        );
    }
}
