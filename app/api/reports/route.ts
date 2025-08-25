import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const sb = supabaseAdmin();
  const form = await req.formData();
  const description = String(form.get("description") || "");
  const lat = Number(form.get("lat"));
  const lon = Number(form.get("lon"));
  const photo = form.get("photo") as File | null;

  let photo_url: string | null = null;
  if (photo && photo.size > 0) {
    const arrbuf = await photo.arrayBuffer();
    const filePath = `reports/${Date.now()}-${photo.name}`;
    const upload = await sb.storage.from("sdss").upload(filePath, arrbuf, {
      contentType: photo.type, upsert: false
    });
    if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 500 });
    const { data } = sb.storage.from("sdss").getPublicUrl(filePath);
    photo_url = data.publicUrl;
  }

  const { data, error } = await sb.from("reports").insert({ description, lat, lon, photo_url }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
