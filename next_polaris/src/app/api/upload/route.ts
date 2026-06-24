import { NextRequest, NextResponse } from "next/server";
import { minioClient, BUCKET_NAME, getFileUrl } from "@/lib/minio";
import { Readable } from "stream";
import { requireRoleApi } from "@/app/_auth/require-role-api";

// Allowed image signatures (magic bytes) — checked against actual file content,
// not the client-supplied Content-Type header, which is trivially spoofable.
// SVG is deliberately excluded: it can embed <script> and would enable stored XSS
// once served back from the public bucket URL.
function isAllowedImage(buffer: Buffer): boolean {
    if (buffer.length < 12) return false
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true
    // GIF
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true
    // WEBP (RIFF....WEBP)
    if (
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) return true
    return false
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireRoleApi(["ADMIN"]);
        if (!auth.ok) return auth.response;

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 5 MB limit
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate actual file content, not the spoofable Content-Type header.
        if (!isAllowedImage(buffer)) {
            return NextResponse.json({ error: "Only PNG, JPEG, GIF or WEBP images are allowed" }, { status: 400 });
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

        const stream = Readable.from(buffer);

        await minioClient.putObject(BUCKET_NAME, objectName, stream, buffer.length, {
            "Content-Type": file.type,
        });

        const publicUrl = getFileUrl(objectName);

        return NextResponse.json({ success: true, publicUrl, objectName });
    } catch (error: any) {
        if (error instanceof NextResponse) return error
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed", details: error.message },
            { status: 500 }
        );
    }
}
