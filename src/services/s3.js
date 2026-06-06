import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

function getExtension(filename) {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

function getS3Client(env) {
  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function getPublicUrl(key, env) {
  const prefix = env.S3_PUBLIC_URL_PREFIX;
  if (prefix) {
    return `${prefix.replace(/\/$/, "")}/${key}`;
  }

  const region = env.AWS_REGION;
  const bucket = env.S3_BUCKET_NAME;

  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function buildObjectKey(originalName, mimetype) {
  const ext = getExtension(originalName);
  const safeExt = ext || mimeToExtension(mimetype);
  return `website-image/${uuidv4()}${safeExt}`;
}

function mimeToExtension(mimetype) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
  };
  return map[mimetype] || "";
}

async function uploadImage(file, env) {
  const s3Client = getS3Client(env);
  const bucket = env.S3_BUCKET_NAME;
  const key = buildObjectKey(file.originalname, file.mimetype);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: "public, max-age=31536000",
    })
  );

  return {
    key,
    url: getPublicUrl(key, env),
    contentType: file.mimetype,
    size: file.size,
  };
}

export { uploadImage, getPublicUrl };
