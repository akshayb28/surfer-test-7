import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

function client() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf",
};

/** Validate an upload before it ever reaches R2. Throws on invalid input. */
export function validateUpload(buffer: Buffer, contentType: string) {
  if (buffer.length === 0 || buffer.length > MAX_SIZE) throw new Error("File must be between 1 byte and 5 MB");
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) throw new Error("Only JPG, PNG, WebP or PDF files are allowed");
  return ext;
}

export async function uploadPrivate(key: string, buffer: Buffer, contentType: string) {
  validateUpload(buffer, contentType);
  await client().send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_PRIVATE, Key: key, Body: buffer, ContentType: contentType,
  }));
  return key;
}

export async function uploadPublic(key: string, buffer: Buffer, contentType: string) {
  validateUpload(buffer, contentType);
  await client().send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_PUBLIC, Key: key, Body: buffer, ContentType: contentType,
  }));
  return key;
}

/** Short-lived signed URL for private docs (KYC). Only callable after a server-side role check. */
export async function signedPrivateUrl(key: string, expiresSeconds = 120) {
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: process.env.R2_BUCKET_PRIVATE, Key: key }), { expiresIn: expiresSeconds });
}

export function newObjectKey(prefix: string, ext: string) {
  return `${prefix}/${crypto.randomUUID()}${ext}`;
}
