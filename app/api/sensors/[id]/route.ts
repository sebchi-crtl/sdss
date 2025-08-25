import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("sensors").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  name: z.string().optional(),
  type: z.enum(["RAIN","RIVER","WATER_LEVEL","WIND","TEMP","HUMIDITY"]).optional(),
  lat: z.number().optional(),
  lon: z.number().optional()
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseAdmin();
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { data, error } = await sb.from("sensors").update(parsed.data).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
