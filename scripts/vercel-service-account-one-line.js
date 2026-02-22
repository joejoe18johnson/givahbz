#!/usr/bin/env node
/**
 * Outputs firebase-service-account.json as a single line for pasting into
 * Vercel → Settings → Environment Variables → FIREBASE_SERVICE_ACCOUNT_JSON.
 *
 * Run from project root: node scripts/vercel-service-account-one-line.js
 * Then copy the printed line (no quotes) into Vercel's value field.
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

// One-line JSON (no newlines; private_key keeps escaped \n)
const oneLine = JSON.stringify(parsed);
console.log("Copy the line below into Vercel → FIREBASE_SERVICE_ACCOUNT_JSON (no extra quotes):\n");
console.log(oneLine);
