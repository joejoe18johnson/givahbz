import { NextResponse } from "next/server";

/**
 * GET /api/firebase-check
 * Call this on your Vercel URL to see if Firebase env vars are set.
 * Example: https://givahbz.vercel.app/api/firebase-check
 */
export async function GET() {
  const vars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missing = Object.entries(vars)
    .filter(([, v]) => v == null || String(v).trim() === "" || v === "your-api-key" || v === "your-project-id")
    .map(([k]) => k);

  const configured = missing.length === 0;

  return NextResponse.json(
    {
      firebase: configured ? "connected" : "not_connected",
      message: configured
        ? "All Firebase env vars are set. Your app can connect to Firebase."
        : "Missing or invalid Firebase env vars in Vercel.",
      missing,
      hint: configured
        ? null
        : "In Vercel: Project → Settings → Environment Variables → Add each missing variable → Redeploy (Deployments → ⋯ → Redeploy).",
    },
    { status: configured ? 200 : 503 }
  );
}
