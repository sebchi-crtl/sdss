import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "24h";
  const since = new Date(Date.now() - 24*3600*1000);
  const { data, error } = await sb
    .from("sensor_readings")
    .select("ts,value")
    .gte("ts", since.toISOString())
    .order("ts", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ series: data });
}
