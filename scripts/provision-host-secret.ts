import { randomBytes } from "node:crypto";
import { hashHostPassword } from "../lib/server/host-auth";

function randomBase64(bytes: number): string {
  return randomBytes(bytes).toString("base64");
}

function randomPassword(): string {
  return randomBytes(18).toString("base64url");
}

const [, , providedPassword] = process.argv;
const password = providedPassword ?? randomPassword();

const responseEncryptionKey = randomBase64(32);
const hostSessionSecret = randomBase64(32);
const hostPasswordHash = hashHostPassword(password);

console.log("Generated host + encryption secrets.");
console.log("Store these in Vercel project settings (Production and Preview separately).");
console.log("Never commit them to the repository.\n");

if (!providedPassword) {
  console.log(`Host password — save this now, it will not be shown again: ${password}\n`);
}

console.log(`RESPONSE_ENCRYPTION_KEY=${responseEncryptionKey}`);
console.log(`HOST_SESSION_SECRET=${hostSessionSecret}`);
console.log(`HOST_PASSWORD_HASH=${hostPasswordHash}`);
