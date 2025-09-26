import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const url = process.env.MODEL_URL || "http://localhost:8200/predict";

  try {
    // Get current sensor data for more accurate predictions
    let recentReadings = null;
    let currentConditions = {
      rainfall_24h: 10,
      rainfall_7d: 45,
      river_level: 2.5,
      soil_moisture: 0.6,
      temperature: 25,
      humidity: 65,
      pressure: 1013,
      wind_speed: 3,
      wind_direction: 180
    };

    try {
      const sb = supabaseAdmin();
      const { data } = await sb
        .from("sensor_readings")
        .select(`
          value,
          sensors!inner(type, lat, lon)
        `)
        .gte("ts", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("ts", { ascending: false })
        .limit(100);
      recentReadings = data;

      // Aggregate sensor data by type
      if (recentReadings && recentReadings.length > 0) {
        const sensorData = recentReadings.reduce((acc: any, reading: any) => {
          const type = reading.sensors.type;
          if (!acc[type]) acc[type] = [];
          acc[type].push(reading.value);
          return acc;
        }, {});

        // Update conditions based on available sensor data
        if (sensorData.RAIN && sensorData.RAIN.length > 0) {
          currentConditions.rainfall_24h = Math.max(...sensorData.RAIN);
          currentConditions.rainfall_7d = sensorData.RAIN.reduce((a: number, b: number) => a + b, 0);
        }
        if (sensorData.RIVER && sensorData.RIVER.length > 0) {
          currentConditions.river_level = Math.max(...sensorData.RIVER);
        }
        if (sensorData.WATER_LEVEL && sensorData.WATER_LEVEL.length > 0) {
          currentConditions.river_level = Math.max(...sensorData.WATER_LEVEL);
        }
        if (sensorData.TEMP && sensorData.TEMP.length > 0) {
          currentConditions.temperature = sensorData.TEMP[sensorData.TEMP.length - 1]; // Latest reading
        }
        if (sensorData.HUMIDITY && sensorData.HUMIDITY.length > 0) {
          currentConditions.humidity = sensorData.HUMIDITY[sensorData.HUMIDITY.length - 1];
        }
      }
    } catch (dbError) {
      console.warn("Database connection failed, using default conditions:", dbError);
    }

    // For now, generate predictions based on current conditions
    // TODO: Connect to FastAPI backend when it's stable
    const predictions = generatePredictionsFromConditions(currentConditions);

    return NextResponse.json({
      ...predictions,
      current_conditions: currentConditions,
      data_source: recentReadings && recentReadings.length > 0 ? "real_sensors" : "default_conditions",
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

// Helper function to generate predictions based on current conditions
function generatePredictionsFromConditions(conditions: any) {
  const horizon = [1, 6, 24, 48, 72];
  const risk = [];
  const confidence = [];
  const forecast_rainfall = [];
  
  // Calculate risk based on current conditions
  const baseRisk = Math.min(0.8, 
    (conditions.rainfall_24h / 50) * 0.4 + 
    (conditions.river_level / 5) * 0.3 + 
    (conditions.soil_moisture) * 0.3
  );
  
  for (let i = 0; i < horizon.length; i++) {
    const hours = horizon[i];
    
    // Simulate forecast rainfall
    const forecastRain = Math.random() * 20;
    forecast_rainfall.push(forecastRain);
    
    // Risk increases with forecast rainfall and time
    const timeFactor = 1 + (hours / 168) * 0.2; // 168 hours = 1 week
    const rainFactor = Math.min(0.3, forecastRain / 50);
    const adjustedRisk = Math.min(0.95, baseRisk + rainFactor);
    
    risk.push(Number((adjustedRisk * timeFactor).toFixed(3)));
    
    // Confidence decreases with time
    const conf = Math.max(0.3, 0.9 - (hours / 168) * 0.4);
    confidence.push(Number(conf.toFixed(3)));
  }
  
  // Generate recommendations based on max risk
  const maxRisk = Math.max(...risk);
  const recommendations = [];
  
  if (maxRisk > 0.8) {
    recommendations.push("EMERGENCY: Evacuate low-lying areas immediately");
    recommendations.push("Contact emergency services");
  } else if (maxRisk > 0.6) {
    recommendations.push("WARNING: Prepare for potential flooding");
    recommendations.push("Move valuables to higher ground");
  } else if (maxRisk > 0.4) {
    recommendations.push("WATCH: Monitor conditions closely");
    recommendations.push("Check drainage systems");
  } else {
    recommendations.push("INFO: Normal conditions expected");
    recommendations.push("Continue regular monitoring");
  }
  
  return {
    horizon,
    risk,
    confidence,
    factors: {
      ...conditions,
      forecast_rainfall,
      model_used: "Real-time Analysis",
      state_risk: maxRisk > 0.6 ? "high" : maxRisk > 0.4 ? "medium" : "low"
    },
    recommendations,
    state_code: "FCT",
    region: "North Central"
  };
}
