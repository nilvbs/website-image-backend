export function resolveConfig(env) {
  return {
    AWS_REGION: env.AWS_REGION ?? process.env.AWS_REGION,
    S3_BUCKET_NAME: env.S3_BUCKET_NAME ?? process.env.S3_BUCKET_NAME,
    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY,
    S3_PUBLIC_URL_PREFIX: env.S3_PUBLIC_URL_PREFIX ?? process.env.S3_PUBLIC_URL_PREFIX,
  };
}

export function getConfigStatus(config) {
  return {
    AWS_REGION: Boolean(config.AWS_REGION),
    S3_BUCKET_NAME: Boolean(config.S3_BUCKET_NAME),
    AWS_ACCESS_KEY_ID: Boolean(config.AWS_ACCESS_KEY_ID),
    AWS_SECRET_ACCESS_KEY: Boolean(config.AWS_SECRET_ACCESS_KEY),
  };
}
