import { uploadImage } from "./services/s3.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      const configured = {
        AWS_REGION: Boolean(env.AWS_REGION),
        S3_BUCKET_NAME: Boolean(env.S3_BUCKET_NAME),
        AWS_ACCESS_KEY_ID: Boolean(env.AWS_ACCESS_KEY_ID),
        AWS_SECRET_ACCESS_KEY: Boolean(env.AWS_SECRET_ACCESS_KEY),
      };

      const response = { status: "ok", configured };

      if (!configured.AWS_ACCESS_KEY_ID || !configured.AWS_SECRET_ACCESS_KEY) {
        response.hint =
          "Set deploy command to: npm run deploy. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY under Settings → Build → Build variables and secrets.";
      }

      return jsonResponse(response);
    }

    if (url.pathname === "/api/upload" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("image");

        if (!file || typeof file === "string") {
          return jsonResponse(
            { error: "No image file provided. Use field name 'image'." },
            400
          );
        }

        if (!ALLOWED_MIME_TYPES.has(file.type)) {
          return jsonResponse(
            { error: "Only image files are allowed (jpeg, png, gif, webp, svg, avif)" },
            400
          );
        }

        if (file.size > MAX_FILE_SIZE) {
          return jsonResponse({ error: "File too large. Maximum size is 10 MB." }, 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadImage(
          {
            buffer,
            originalname: file.name,
            mimetype: file.type,
            size: file.size,
          },
          env
        );

        return jsonResponse(
          {
            url: result.url,
            key: result.key,
            contentType: result.contentType,
            size: result.size,
          },
          201
        );
      } catch (err) {
        console.error("Upload failed:", err);

        if (err.message?.startsWith("Missing configuration:")) {
          return jsonResponse({ error: err.message }, 500);
        }

        if (err.name === "CredentialsProviderError" || err.message?.includes("credential")) {
          return jsonResponse(
            { error: "AWS credentials are invalid or not configured in Cloudflare secrets." },
            500
          );
        }

        if (err.name === "AccessDenied" || err.Code === "AccessDenied") {
          return jsonResponse(
            { error: "AWS access denied. Check IAM permissions for s3:PutObject on the bucket." },
            500
          );
        }

        return jsonResponse({ error: "Failed to upload image" }, 500);
      }
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};
