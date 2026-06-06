const REQUIRED_KEYS = [
  "AWS_REGION",
  "S3_BUCKET_NAME",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
];

/** Cloudflare Worker: credentials arrive only via the env binding. */
export function resolveWorkerConfig(env) {
  return {
    AWS_REGION: env.AWS_REGION,
    S3_BUCKET_NAME: env.S3_BUCKET_NAME,
    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
    S3_PUBLIC_URL_PREFIX: env.S3_PUBLIC_URL_PREFIX,
  };
}

/** Local Express server only — uses Node process.env / .env file. */
export function resolveNodeConfig() {
  return {
    AWS_REGION: process.env.AWS_REGION,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_PUBLIC_URL_PREFIX: process.env.S3_PUBLIC_URL_PREFIX,
  };
}

export function getConfigStatus(config) {
  return Object.fromEntries(
    REQUIRED_KEYS.map((key) => [key, Boolean(config[key])])
  );
}

export function getMissingKeys(config) {
  return REQUIRED_KEYS.filter((key) => !config[key]);
}
