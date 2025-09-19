import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  const sb = supabaseAdmin();
  
  try {
    // Get active sensors count
    const { count: activeSensors } = await sb
      .from("sensors")
      .select("*", { count: "exact", head: true });
    
    // Get open alerts count (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { count: openAlerts } = await sb
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday.toISOString());
    
    // Get 24h readings count
    const { count: readings24h } = await sb
      .from("sensor_readings")
      .select("*", { count: "exact", head: true })
      .gte("ts", yesterday.toISOString());
    
    // Get latest readings for each sensor type
    const { data: latestReadings } = await sb
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
      .order("ts", { ascending: false })
      .limit(20);
    
    // Get sensor status summary
    const statusSummary = latestReadings?.reduce((acc: any, reading: any) => {
      const status = reading.status || "OK";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // Get recent alerts
    const { data: recentAlerts } = await sb
      .from("alerts")
      .select("id, type, level, message, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    
    // Get sensor type distribution
    const { data: sensorTypes } = await sb
      .from("sensors")
      .select("type")
      .order("type");
    
    const typeDistribution = sensorTypes?.reduce((acc: any, sensor: any) => {
      acc[sensor.type] = (acc[sensor.type] || 0) + 1;
      return acc;
    }, {}) || {};
    
    return NextResponse.json({
      activeSensors: activeSensors || 0,
      openAlerts: openAlerts || 0,
      readings24h: readings24h || 0,
      statusSummary,
      recentAlerts: recentAlerts || [],
      typeDistribution,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
