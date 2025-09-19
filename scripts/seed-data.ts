// Seed the database with sample sensors and data
import { supabaseAdmin } from "../lib/supabase-admin";

const sampleSensors = [
  {
    name: "Rain Gauge North",
    type: "RAIN" as const,
    lat: 9.05,
    lon: 7.32,
    elevation: 120
  },
  {
    name: "Rain Gauge South",
    type: "RAIN" as const,
    lat: 8.95,
    lon: 7.28,
    elevation: 95
  },
  {
    name: "River Gauge Main",
    type: "RIVER" as const,
    lat: 9.02,
    lon: 7.35,
    elevation: 85
  },
  {
    name: "Water Level Sensor A",
    type: "WATER_LEVEL" as const,
    lat: 8.98,
    lon: 7.31,
    elevation: 90
  },
  {
    name: "Weather Station Central",
    type: "TEMP" as const,
    lat: 9.0,
    lon: 7.33,
    elevation: 110
  },
  {
    name: "Humidity Monitor",
    type: "HUMIDITY" as const,
    lat: 9.01,
    lon: 7.29,
    elevation: 105
  }
];

const sampleAlertRules = [
  {
    name: "Heavy Rainfall Alert",
    alert_type: "RAIN" as const,
    level: "WARNING" as const,
    threshold: 25.0,
    message: "Heavy rainfall detected - potential flood risk"
  },
  {
    name: "River Level Critical",
    alert_type: "RIVER_RISE" as const,
    level: "EMERGENCY" as const,
    threshold: 4.5,
    message: "River level critical - immediate evacuation may be required"
  },
  {
    name: "System Health Check",
    alert_type: "SYSTEM" as const,
    level: "INFO" as const,
    threshold: 0,
    message: "System operating normally"
  }
];

async function seedSensors() {
  const sb = supabaseAdmin();
  
  console.log("Seeding sensors...");
  for (const sensor of sampleSensors) {
    const { data, error } = await sb
      .from("sensors")
      .insert(sensor)
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting sensor:", error);
    } else {
      console.log("Inserted sensor:", data.name);
    }
  }
}

async function seedAlertRules() {
  const sb = supabaseAdmin();
  
  console.log("Seeding alert rules...");
  for (const rule of sampleAlertRules) {
    const { data, error } = await sb
      .from("alert_rules")
      .insert(rule)
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting alert rule:", error);
    } else {
      console.log("Inserted alert rule:", data.name);
    }
  }
}

async function generateSampleReadings() {
  const sb = supabaseAdmin();
  
  // Get all sensors
  const { data: sensors, error: sensorsError } = await sb
    .from("sensors")
    .select("id, type");
  
  if (sensorsError || !sensors) {
    console.error("Error fetching sensors:", sensorsError);
    return;
  }
  
  console.log("Generating sample readings...");
  
  // Generate readings for the last 7 days
  const now = new Date();
  const readings = [];
  
  for (let i = 0; i < 168; i++) { // 7 days * 24 hours
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    for (const sensor of sensors) {
      let value: number;
      let status: "OK" | "WARN" | "CRIT" = "OK";
      
      switch (sensor.type) {
        case "RAIN":
          value = Math.random() * 15; // 0-15mm
          if (value > 10) status = "WARN";
          if (value > 20) status = "CRIT";
          break;
        case "RIVER":
          value = 2 + Math.random() * 3; // 2-5m
          if (value > 4) status = "WARN";
          if (value > 4.5) status = "CRIT";
          break;
        case "WATER_LEVEL":
          value = 1 + Math.random() * 2; // 1-3m
          if (value > 2.5) status = "WARN";
          if (value > 3) status = "CRIT";
          break;
        case "TEMP":
          value = 20 + Math.random() * 15; // 20-35°C
          if (value > 32) status = "WARN";
          if (value > 35) status = "CRIT";
          break;
        case "HUMIDITY":
          value = 40 + Math.random() * 40; // 40-80%
          if (value > 75) status = "WARN";
          if (value > 85) status = "CRIT";
          break;
        default:
          value = Math.random() * 100;
      }
      
      readings.push({
        sensor_id: sensor.id,
        ts: timestamp.toISOString(),
        value: Math.round(value * 100) / 100,
        status,
        raw: {
          battery: 3.5 + Math.random() * 0.5,
          signal_strength: Math.floor(Math.random() * 5) + 1
        }
      });
    }
  }
  
  // Insert readings in batches
  const batchSize = 100;
  for (let i = 0; i < readings.length; i += batchSize) {
    const batch = readings.slice(i, i + batchSize);
    const { error } = await sb
      .from("sensor_readings")
      .insert(batch);
    
    if (error) {
      console.error("Error inserting readings batch:", error);
    } else {
      console.log(`Inserted readings batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(readings.length / batchSize)}`);
    }
  }
}

async function main() {
  try {
    await seedSensors();
    await seedAlertRules();
    await generateSampleReadings();
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
  }
}

if (require.main === module) {
  main();
}
