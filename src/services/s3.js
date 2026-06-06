const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function getPublicUrl(key) {
  const prefix = process.env.S3_PUBLIC_URL_PREFIX;
  if (prefix) {
    return `${prefix.replace(/\/$/, "")}/${key}`;
  }

  const region = process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET_NAME;

  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function buildObjectKey(originalName, mimetype) {
  const ext = path.extname(originalName).toLowerCase();
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

async function uploadImage(file) {
  const bucket = process.env.S3_BUCKET_NAME;
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
    url: getPublicUrl(key),
    contentType: file.mimetype,
    size: file.size,
  };
}

module.exports = { uploadImage, getPublicUrl };
