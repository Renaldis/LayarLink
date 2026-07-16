import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;

if (!accountId || !bucket || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error("R2 storage environment variables are required.");
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }
});

export function createVideoKey(userId: string, mimeType: string) {
  const extension = mimeType === "video/mp4" ? "mp4" : "webm";
  return `videos/${userId}/${crypto.randomUUID()}.${extension}`;
}

export async function createUploadUrl(input: { key: string; mimeType: string; byteSize: number }) {
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: input.key, ContentType: input.mimeType, ContentLength: input.byteSize }), { expiresIn: 15 * 60 });
}

export async function createPlaybackUrl(key: string) {
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 60 * 60 });
}

export async function verifyUploadedObject(key: string, expectedByteSize: number) {
  const object = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return object.ContentLength === expectedByteSize;
}
