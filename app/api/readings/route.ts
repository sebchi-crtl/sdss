import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "24h";
  const sensorType = searchParams.get("type");
  
  const sb = supabaseAdmin();
  
  // Calculate time range
  const now = new Date();
  let startTime: Date;
  
  switch (range) {
    case "1h":
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "24h":
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  try {
    let query = sb
      .from("sensor_readings")
      .select(`
        id,
        ts,
        value,
        status,
        sensors!inner(
          id,
          name,
          type
        )
      `)
      .gte("ts", startTime.toISOString())
      .order("ts", { ascending: true });
    
    if (sensorType) {
      query = query.eq("sensors.type", sensorType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Group by sensor and format for charts
    const series = data?.reduce((acc: any, reading: any) => {
      const sensorName = reading.sensors.name;
      if (!acc[sensorName]) {
        acc[sensorName] = {
          name: sensorName,
          type: reading.sensors.type,
          data: []
        };
      }
      
      acc[sensorName].data.push({
        ts: reading.ts,
        value: reading.value,
        status: reading.status
      });
      
      return acc;
    }, {}) || {};
    
    return NextResponse.json({
      series: Object.values(series),
      total: data?.length || 0,
      range,
      startTime: startTime.toISOString(),
      endTime: now.toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}