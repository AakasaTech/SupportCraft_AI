import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

/** Uploads a file to R2 and returns its public URL (bucket must have a public dev URL or custom domain configured). */
export async function uploadFile(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string
): Promise<{ url: string; key: string }> {
  await r2Client.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
  );
  return { url: `${process.env.R2_PUBLIC_URL}/${key}`, key };
}

/** Downloads a file from R2 — for buckets kept private and served through an authenticated route. */
export async function downloadFile(key: string): Promise<{ buffer: Buffer; contentType?: string }> {
  const result = await r2Client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const buffer = Buffer.from(await result.Body!.transformToByteArray());
  return { buffer, contentType: result.ContentType };
}

export async function deleteFile(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
