import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

function getExtension(filename) {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

function getS3Client(config) {
  return new S3Client({
    region: config.AWS_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function getPublicUrl(key, config) {
  const prefix = config.S3_PUBLIC_URL_PREFIX;
  if (prefix) {
    return `${prefix.replace(/\/$/, "")}/${key}`;
  }

  const region = config.AWS_REGION;
  const bucket = config.S3_BUCKET_NAME;

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

function validateConfig(config) {
  const required = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "S3_BUCKET_NAME",
  ];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing configuration: ${missing.join(", ")}`);
  }
}

async function uploadImage(file, config) {
  validateConfig(config);

  const s3Client = getS3Client(config);
  const bucket = config.S3_BUCKET_NAME;
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
    url: getPublicUrl(key, config),
    contentType: file.mimetype,
    size: file.size,
  };
}

export { uploadImage, getPublicUrl };
