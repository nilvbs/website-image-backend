import { writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";

const SECRET_KEYS = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"];
const secretsFile = ".deploy-secrets.env";

const missing = SECRET_KEYS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `Missing build secrets: ${missing.join(", ")}.\n` +
      "Add them in Cloudflare → Workers → Settings → Build → Build variables and secrets."
  );
  process.exit(1);
}

const content = SECRET_KEYS.map((key) => `${key}=${process.env[key]}`).join("\n");

try {
  writeFileSync(secretsFile, content, "utf8");
  execSync(`npx wrangler deploy --secrets-file ${secretsFile}`, { stdio: "inherit" });
} finally {
  try {
    unlinkSync(secretsFile);
  } catch {
    // ignore cleanup errors
  }
}
