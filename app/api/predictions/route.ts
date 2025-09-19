import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const url = process.env.MODEL_URL || "http://localhost:8200/predict";

  try {
    // Get current sensor data for more accurate predictions
    const sb = supabaseAdmin();
    const { data: recentReadings } = await sb
      .from("sensor_readings")
      .select(`
        value,
        sensors!inner(type, lat, lon)
      `)
      .gte("ts", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("ts", { ascending: false })
      .limit(100);

    // Build current conditions from recent sensor data
    const currentConditions: any = {
      rainfall_24h: 0,
      rainfall_7d: 0,
      river_level: 2.0,
      soil_moisture: 0.5,
      temperature: 25,
      humidity: 65,
      pressure: 1013,
      wind_speed: 3,
      wind_direction: 180
    };

    // Aggregate sensor data by type
    if (recentReadings) {
      const sensorData = recentReadings.reduce((acc: any, reading: any) => {
        const type = reading.sensors.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(reading.value);
        return acc;
      }, {});

      // Update conditions based on available sensor data
      if (sensorData.RAIN) {
        currentConditions.rainfall_24h = Math.max(...sensorData.RAIN);
        currentConditions.rainfall_7d = sensorData.RAIN.reduce((a: number, b: number) => a + b, 0);
      }
      if (sensorData.RIVER) {
        currentConditions.river_level = Math.max(...sensorData.RIVER);
      }
      if (sensorData.WATER_LEVEL) {
        currentConditions.river_level = Math.max(...sensorData.WATER_LEVEL);
      }
      if (sensorData.TEMP) {
        currentConditions.temperature = sensorData.TEMP[sensorData.TEMP.length - 1]; // Latest reading
      }
      if (sensorData.HUMIDITY) {
        currentConditions.humidity = sensorData.HUMIDITY[sensorData.HUMIDITY.length - 1];
      }
    }

    // Get predictions from Python ML backend
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ 
        horizon_hours: [1, 6, 24, 48, 72],
        current_conditions: currentConditions
      })
    });
    
    if (!r.ok) {
      throw new Error(`ML API error: ${r.status}`);
    }
    
    const predictions = await r.json();
    
    // Store prediction results in database for historical tracking
    try {
      await sb.from("predictions").insert({
        horizon_hours: predictions.horizon,
        risk_scores: predictions.risk,
        confidence_scores: predictions.confidence,
        factors: predictions.factors,
        recommendations: predictions.recommendations,
        created_at: new Date().toISOString()
      });
    } catch (dbError) {
      console.warn("Failed to store predictions in database:", dbError);
    }

    return NextResponse.json({
      ...predictions,
      current_conditions,
      data_source: "real_sensors",
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error("Prediction error:", e);
    return NextResponse.json({ 
      error: String(e),
      fallback: true,
      message: "Using fallback prediction data"
    }, { status: 500 });
  }
}
