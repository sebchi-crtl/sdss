import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Simple alert evaluator: threshold per type for last hour aggregation
export async function POST() {
  const sb = supabaseAdmin();
  // Fetch rules
  const { data: rules, error: rerr } = await sb.from("alert_rules").select("*");
  if (rerr) return NextResponse.json({ error: rerr.message }, { status: 500 });

  const now = new Date();
  const since = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  let created = 0;
  for (const rule of rules ?? []) {
    const { data, error } = await sb
      .from("sensor_readings")
      .select("value")
      .eq("status", rule.status ?? "OK")
      .gte("ts", since)
      .order("ts", { ascending: false })
      .limit(1000);
    if (error) continue;
    const agg = (data ?? []).reduce((acc, x: any) => acc + Number(x.value || 0), 0);
    if (agg >= (rule.threshold ?? 0)) {
      const { error: aerr } = await sb.from("alerts").insert({
        type: rule.alert_type || "SYSTEM",
        level: rule.level || "INFO",
        message: rule.message || `Rule exceeded: ${rule.name}`
      });
      if (!aerr) created++;
    }
  }

  return NextResponse.json({ ok: true, created });
}
