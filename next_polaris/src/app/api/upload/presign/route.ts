import { NextRequest, NextResponse } from "next/server";
import { minioClient, BUCKET_NAME, getFileUrl, toPublicUrl } from "@/lib/minio";
import { randomUUID } from "crypto";
import { requireRoleApi } from "@/app/_auth/require-role-api";

// SVG/HTML/script-bearing types are excluded — they can carry executable
// content and would enable stored XSS once served from the public bucket URL.
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export async function POST(request: NextRequest) {
    try {
        const auth = await requireRoleApi(["ADMIN"], "settings.view");
        if (!auth.ok) return auth.response;

        const { filename, fileType } = await request.json();

        if (!filename || !fileType) {
            return NextResponse.json(
                { error: "filename and fileType are required" },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.has(fileType)) {
            return NextResponse.json(
                { error: "Only PNG, JPEG, GIF or WEBP images are allowed" },
                { status: 400 }
            );
        }

        // Ensure bucket exists with a public-read policy (idempotent)
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

        const objectName = `${randomUUID()}_${filename.replace(/\s+/g, "-")}`;

        // Generate presigned PUT URL using the INTERNAL client.
        // The SDK connects to polaris_minio:9000 (internal Docker network) — no ETIMEDOUT.
        // The AWS Sig V4 signature includes Host: polaris_minio:9000.
        const internalUploadUrl = await minioClient.presignedPutObject(
            BUCKET_NAME,
            objectName,
            5 * 60  // 5 minute expiry
        );

        // Rewrite the internal origin to the public Caddy-proxied domain.
        // Caddy forwards /files/* to polaris_minio:9000 using Host: polaris_minio:9000,
        // so the signature Host header still matches what MinIO verifies against. ✓
        const uploadUrl = toPublicUrl(internalUploadUrl);

        // Permanent public URL (no signature needed — bucket is public-read)
        const publicUrl = getFileUrl(objectName);

        return NextResponse.json({ success: true, uploadUrl, publicUrl, objectName });
    } catch (error: any) {
        if (error instanceof NextResponse) return error
        console.error("Presign error:", error);
        return NextResponse.json(
            { error: "Failed to generate presigned URL", details: error.message },
            { status: 500 }
        );
    }
}
