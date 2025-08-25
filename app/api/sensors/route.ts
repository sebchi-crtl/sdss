import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("sensors").select("*").order("installed_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(["RAIN","RIVER","WATER_LEVEL","WIND","TEMP","HUMIDITY"]),
  lat: z.number(),
  lon: z.number()
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("sensors").insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
