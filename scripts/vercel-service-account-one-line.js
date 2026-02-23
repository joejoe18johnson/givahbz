#!/usr/bin/env node
/**
 * Outputs firebase-service-account.json for pasting into Vercel or .env:
 * - FIREBASE_SERVICE_ACCOUNT_JSON (one-line JSON)
 * - FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 (recommended: no quoting issues)
 *
 * Run from project root: node scripts/vercel-service-account-one-line.js
 */

const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "firebase-service-account.json");
if (!fs.existsSync(filePath)) {
  console.error("File not found: firebase-service-account.json");
  process.exit(1);
}

const content = fs.readFileSync(filePath, "utf8");
let parsed;
try {
  parsed = JSON.parse(content);
} catch (e) {
  console.error("Invalid JSON in firebase-service-account.json:", e.message);
  process.exit(1);
}

if (!parsed.private_key || !parsed.client_email) {
  console.error("JSON must contain private_key and client_email.");
  process.exit(1);
}

const oneLine = JSON.stringify(parsed);
const base64 = Buffer.from(oneLine, "utf8").toString("base64");

console.log("--- Option A: FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 (recommended for .env / Vercel) ---");
console.log("Paste this as the value for FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 (no quoting issues):\n");
console.log(base64);
console.log("\n--- Option B: FIREBASE_SERVICE_ACCOUNT_JSON (one line) ---");
console.log("Copy the line below into FIREBASE_SERVICE_ACCOUNT_JSON (no extra quotes):\n");
console.log(oneLine);
