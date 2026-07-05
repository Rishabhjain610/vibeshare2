import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client using environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  try {
    // 1. Get FormData and check file presence
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 2. Read file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create unique file key
    const fileExtension = file.name.split(".").pop() || "";
    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, "") // remove extension
      .replace(/[^a-zA-Z0-9]/g, "-") // sanitize characters
      .toLowerCase();

    // Parse upload type (e.g. ?type=profile or ?type=post) to organize S3 directories
    const { searchParams } = new URL(request.url);
    const uploadType = searchParams.get("type") || "general";

    let folder = "general";
    if (uploadType === "profile") {
      folder = "profile-images";
    } else if (uploadType === "post") {
      folder = "post-media";
    } else if (uploadType === "reel") {
      folder = "reels";
    }

    const key = `${folder}/${Date.now()}-${cleanFileName}.${fileExtension}`;

    // 3. Upload to AWS S3 Bucket
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || "",
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // 4. Construct S3 Public URL (direct download from S3)
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    console.log(`[S3 Upload] Successfully uploaded profile photo: ${s3Url}`);
    return NextResponse.json({ url: s3Url });
  } catch (error: any) {
    console.error("[S3 Upload] Error uploading file to S3:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image to S3" },
      { status: 500 }
    );
  }
}
