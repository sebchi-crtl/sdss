import { supabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";
import { NextResponse } from "next/server";

const payloadSchema = z.object({
  sensor_id: z.string(),
  ts: z.string().datetime(),
  value: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  status: z.enum(["OK", "WARN", "CRIT"]).optional(),
  raw: z.any().optional()
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parse = payloadSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  const { sensor_id, ts, value, lat, lon, status, raw } = parse.data;

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("sensor_readings")
    .insert({ sensor_id, ts, value, status, raw, lat, lon })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
