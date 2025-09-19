import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Enhanced alert evaluator with sensor type matching and better logic
export async function POST() {
  const sb = supabaseAdmin();
  
  try {
    // Fetch rules
    const { data: rules, error: rerr } = await sb.from("alert_rules").select("*");
    if (rerr) return NextResponse.json({ error: rerr.message }, { status: 500 });

    if (!rules || rules.length === 0) {
      return NextResponse.json({ message: "No alert rules configured", created: 0 });
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    let created = 0;
    const alerts = [];

    for (const rule of rules) {
      let shouldAlert = false;
      let alertMessage = rule.message || `Alert threshold exceeded: ${rule.name}`;
      let currentValue = 0;

      // Get relevant sensor readings based on alert type
      let sensorType = "RAIN"; // default
      let timeWindow = oneHourAgo;
      
      switch (rule.alert_type) {
        case "RAIN":
          sensorType = "RAIN";
          timeWindow = twentyFourHoursAgo; // 24h for rainfall
          break;
        case "RIVER_RISE":
          sensorType = "RIVER";
          timeWindow = oneHourAgo;
          break;
        case "SYSTEM":
          sensorType = "RAIN"; // Check any sensor type for system issues
          timeWindow = oneHourAgo;
          break;
      }

      const { data: readings, error: readingsError } = await sb
        .from("sensor_readings")
        .select(`
          value,
          status,
          ts,
          sensors!inner(
            type,
            name
          )
        `)
        .eq("sensors.type", sensorType)
        .gte("ts", timeWindow)
        .order("ts", { ascending: false })
        .limit(1000);

      if (readingsError || !readings || readings.length === 0) {
        continue;
      }

      // Evaluate based on rule type
      switch (rule.alert_type) {
        case "RAIN":
          // Sum rainfall over time window
          currentValue = readings.reduce((sum, r) => sum + Number(r.value || 0), 0);
          shouldAlert = currentValue > rule.threshold;
          alertMessage = `Heavy rainfall detected: ${currentValue.toFixed(1)}mm in 24h (threshold: ${rule.threshold}mm)`;
          break;

        case "RIVER_RISE":
          // Check current river level
          currentValue = readings[0]?.value || 0;
          shouldAlert = currentValue > rule.threshold;
          alertMessage = `River level critical: ${currentValue.toFixed(2)}m (threshold: ${rule.threshold}m)`;
          break;

        case "SYSTEM":
          // Check for system issues (sensors offline, critical status)
          const criticalSensors = readings.filter(r => r.status === "CRIT").length;
          const warnSensors = readings.filter(r => r.status === "WARN").length;
          currentValue = criticalSensors;
          shouldAlert = criticalSensors > 0 || warnSensors > 2;
          alertMessage = `System issues detected: ${criticalSensors} critical, ${warnSensors} warning sensors`;
          break;
      }

      if (shouldAlert) {
        // Check if similar alert already exists in last hour to avoid spam
        const { data: existingAlerts } = await sb
          .from("alerts")
          .select("id")
          .eq("type", rule.alert_type)
          .eq("level", rule.level)
          .gte("created_at", oneHourAgo)
          .limit(1);

        if (!existingAlerts || existingAlerts.length === 0) {
          const { data: newAlert, error: alertError } = await sb
            .from("alerts")
            .insert({
              type: rule.alert_type,
              level: rule.level,
              message: alertMessage
            })
            .select()
            .single();

          if (alertError) {
            console.error("Error creating alert:", alertError);
          } else {
            created++;
            alerts.push({
              id: newAlert.id,
              type: newAlert.type,
              level: newAlert.level,
              message: newAlert.message
            });
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      alerts,
      evaluated_rules: rules.length,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error("Error in alert evaluation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
