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
  
  try {
    // First, ensure the sensor exists in the sensors table
    const { data: existingSensor, error: selectError } = await sb
      .from("sensors")
      .select("id")
      .eq("id", sensor_id)
      .single();

    if (!existingSensor && selectError?.code === 'PGRST116') {
      // Sensor doesn't exist, create it
      const sensorType = getSensorTypeFromId(sensor_id);
      const { error: sensorError } = await sb
        .from("sensors")
        .insert({
          id: sensor_id,
          name: `Sensor ${sensor_id.slice(-4)}`,
          type: sensorType,
          lat: lat || 9.0,
          lon: lon || 7.3,
          elevation: 100 // Default elevation
        });

      if (sensorError) {
        // If it's a duplicate key error, that's okay - another process created it
        if (sensorError.code === '23505') {
          console.log(`Sensor ${sensor_id} already exists (created by another process)`);
        } else {
          console.warn("Failed to create sensor:", sensorError);
          return NextResponse.json({ error: `Failed to create sensor: ${sensorError.message}` }, { status: 500 });
        }
      } else {
        console.log(`Created new sensor: ${sensor_id} (${sensorType})`);
      }
    } else if (selectError && selectError.code !== 'PGRST116') {
      console.warn("Error checking for existing sensor:", selectError);
      return NextResponse.json({ error: `Database error: ${selectError.message}` }, { status: 500 });
    }

    // Now insert the sensor reading with retry logic
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      const { data, error } = await sb
        .from("sensor_readings")
        .insert({ sensor_id, ts, value, status, raw, lat, lon })
        .select()
        .single();

      if (!error) {
        return NextResponse.json({ ok: true, id: data.id });
      }
      
      // If it's a foreign key constraint error, wait a bit and retry
      if (error.code === '23503' && retries > 1) {
        console.log(`Foreign key constraint error for sensor ${sensor_id}, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        retries--;
        lastError = error;
        continue;
      }
      
      lastError = error;
      break;
    }
    
    return NextResponse.json({ error: lastError?.message || "Failed to insert sensor reading" }, { status: 500 });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to determine sensor type from ID
function getSensorTypeFromId(sensorId: string): string {
  // Map sensor IDs to types based on the MQTT simulator configuration
  const sensorTypeMap: { [key: string]: string } = {
    "550e8400-e29b-41d4-a716-446655440001": "RAIN",
    "550e8400-e29b-41d4-a716-446655440002": "RAIN", 
    "550e8400-e29b-41d4-a716-446655440003": "RIVER",
    "550e8400-e29b-41d4-a716-446655440004": "WATER_LEVEL",
    "550e8400-e29b-41d4-a716-446655440005": "TEMP",
    "550e8400-e29b-41d4-a716-446655440006": "HUMIDITY"
  };
  
  return sensorTypeMap[sensorId] || "UNKNOWN";
}
