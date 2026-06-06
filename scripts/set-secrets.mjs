import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const SECRET_KEYS = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"];
const envPath = resolve(".env");

function loadEnvFile(path) {
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    vars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return vars;
}

function putSecret(name, value) {
  console.log(`Setting secret: ${name}`);
  const result = spawnSync("npx", ["wrangler", "secret", "put", name], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

let vars;
try {
  vars = loadEnvFile(envPath);
} catch {
  console.error("Could not read .env file. Create one with AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.");
  process.exit(1);
}

const missing = SECRET_KEYS.filter((key) => !vars[key]);
if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}

for (const key of SECRET_KEYS) {
  putSecret(key, vars[key]);
}

console.log("\nDone. Verify with: curl https://<your-worker>.workers.dev/health");
