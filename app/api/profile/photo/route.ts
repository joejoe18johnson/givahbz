import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { uploadProfilePhotoSupabase } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST - upload profile photo. Returns { url }. */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  try {
    const supabase = getSupabaseAdmin()!;
    const url = await uploadProfilePhotoSupabase(supabase, user.id, file);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
