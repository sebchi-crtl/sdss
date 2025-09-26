// Enhanced MQTT sensor simulator with realistic data patterns
import mqtt from "mqtt";

const url = process.env.MQTT_URL || "mqtt://broker.hivemq.com:1883";
const base = "sdss/sensors";

// Realistic sensor configurations with proper UUIDs
const sensors = [
  { id: "550e8400-e29b-41d4-a716-446655440001", type: "RAIN", lat: 9.05, lon: 7.32, elevation: 120 },
  { id: "550e8400-e29b-41d4-a716-446655440002", type: "RAIN", lat: 8.95, lon: 7.28, elevation: 95 },
  { id: "550e8400-e29b-41d4-a716-446655440003", type: "RIVER", lat: 9.02, lon: 7.35, elevation: 85 },
  { id: "550e8400-e29b-41d4-a716-446655440004", type: "WATER_LEVEL", lat: 8.98, lon: 7.31, elevation: 90 },
  { id: "550e8400-e29b-41d4-a716-446655440005", type: "TEMP", lat: 9.0, lon: 7.33, elevation: 110 },
  { id: "550e8400-e29b-41d4-a716-446655440006", type: "HUMIDITY", lat: 9.01, lon: 7.29, elevation: 105 }
];

// State tracking for realistic patterns
const sensorState = new Map();

function initializeSensorState(sensorId: string, type: string) {
  switch (type) {
    case "RAIN":
      return { baseValue: 0, trend: 0, lastRain: 0 };
    case "RIVER":
      return { baseValue: 2.5, trend: 0, lastChange: 0 };
    case "WATER_LEVEL":
      return { baseValue: 1.2, trend: 0, lastChange: 0 };
    case "TEMP":
      return { baseValue: 25, trend: 0, dailyCycle: 0 };
    case "HUMIDITY":
      return { baseValue: 60, trend: 0, dailyCycle: 0 };
    default:
      return { baseValue: 0, trend: 0 };
  }
}

function generateRealisticValue(sensor: any, state: any): { value: number; status: string } {
  const now = new Date();
  const hour = now.getHours();
  
  switch (sensor.type) {
    case "RAIN":
      // Simulate rainfall patterns (more likely during certain hours)
      const rainProbability = hour >= 2 && hour <= 6 ? 0.3 : 0.1;
      if (Math.random() < rainProbability) {
        const rainfall = Math.random() * 5; // 0-5mm
        state.lastRain = rainfall;
        return { 
          value: rainfall, 
          status: rainfall > 3 ? "WARN" : "OK" 
        };
      }
      return { value: 0, status: "OK" };
      
    case "RIVER":
      // River levels change slowly with some variation
      const riverChange = (Math.random() - 0.5) * 0.1;
      state.baseValue += riverChange;
      state.baseValue = Math.max(1.5, Math.min(5.0, state.baseValue));
      return { 
        value: Math.round(state.baseValue * 100) / 100, 
        status: state.baseValue > 4 ? "WARN" : state.baseValue > 4.5 ? "CRIT" : "OK" 
      };
      
    case "WATER_LEVEL":
      // Water level similar to river but different range
      const waterChange = (Math.random() - 0.5) * 0.05;
      state.baseValue += waterChange;
      state.baseValue = Math.max(0.5, Math.min(3.0, state.baseValue));
      return { 
        value: Math.round(state.baseValue * 100) / 100, 
        status: state.baseValue > 2.5 ? "WARN" : state.baseValue > 2.8 ? "CRIT" : "OK" 
      };
      
    case "TEMP":
      // Temperature with daily cycle
      const dailyVariation = Math.sin((hour - 6) * Math.PI / 12) * 8;
      const temp = state.baseValue + dailyVariation + (Math.random() - 0.5) * 2;
      return { 
        value: Math.round(temp * 10) / 10, 
        status: temp > 35 ? "WARN" : temp > 40 ? "CRIT" : "OK" 
      };
      
    case "HUMIDITY":
      // Humidity with daily cycle (higher at night)
      const humidityVariation = Math.sin((hour - 6) * Math.PI / 12) * 15;
      const humidity = state.baseValue + humidityVariation + (Math.random() - 0.5) * 10;
      const clampedHumidity = Math.max(20, Math.min(95, humidity));
      return { 
        value: Math.round(clampedHumidity), 
        status: clampedHumidity > 85 ? "WARN" : clampedHumidity > 90 ? "CRIT" : "OK" 
      };
      
    default:
      return { value: Math.random() * 100, status: "OK" };
  }
}

const client = mqtt.connect(url, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});

client.on("connect", () => {
  console.log("MQTT Simulator connected to", url);
  console.log("Simulating", sensors.length, "sensors");
  
  // Initialize sensor states
  sensors.forEach(sensor => {
    sensorState.set(sensor.id, initializeSensorState(sensor.id, sensor.type));
  });
  
  // Publish readings every 30 seconds
  setInterval(() => {
    sensors.forEach(sensor => {
      const state = sensorState.get(sensor.id);
      const { value, status } = generateRealisticValue(sensor, state);
      
      const payload = {
        sensor_id: sensor.id,
        ts: new Date().toISOString(),
        value,
        lat: sensor.lat + (Math.random() - 0.5) * 0.001, // Small GPS variation
        lon: sensor.lon + (Math.random() - 0.5) * 0.001,
        status,
        raw: {
          battery: +(3.5 + Math.random() * 0.5).toFixed(2),
          signal_strength: Math.floor(Math.random() * 5) + 1,
          temperature: sensor.type === "TEMP" ? value : +(20 + Math.random() * 15).toFixed(1)
        }
      };
      
      const topic = `${base}/${sensor.id}/readings`;
      client.publish(topic, JSON.stringify(payload));
      
      console.log(`Published ${sensor.type} reading: ${value} (${status}) from ${sensor.id}`);
    });
  }, 30000); // 30 seconds
  
  // Also publish some readings immediately
  setTimeout(() => {
    sensors.forEach(sensor => {
      const state = sensorState.get(sensor.id);
      const { value, status } = generateRealisticValue(sensor, state);
      
      const payload = {
        sensor_id: sensor.id,
        ts: new Date().toISOString(),
        value,
        lat: sensor.lat,
        lon: sensor.lon,
        status,
        raw: {
          battery: +(3.5 + Math.random() * 0.5).toFixed(2),
          signal_strength: Math.floor(Math.random() * 5) + 1
        }
      };
      
      const topic = `${base}/${sensor.id}/readings`;
      client.publish(topic, JSON.stringify(payload));
    });
  }, 1000);
});

client.on("error", (err) => {
  console.error("MQTT connection error:", err);
});

client.on("disconnect", () => {
  console.log("MQTT disconnected");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down MQTT simulator...");
  client.end();
  process.exit(0);
});
