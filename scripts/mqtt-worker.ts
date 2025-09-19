import mqtt from "mqtt";

const url = process.env.MQTT_URL || "mqtt://broker.hivemq.com:1883";
const topic = process.env.MQTT_TOPIC || "sdss/sensors/+/readings";
console.log("MQTT worker starting", { url, topic });

const client = mqtt.connect(url, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});

client.on("connect", () => {
  console.log("Connected to MQTT");
  client.subscribe(topic, (err) => { if (err) console.error("Subscribe error", err); });
});

client.on("message", async (_topic, payload) => {
  try {
    const msg = JSON.parse(payload.toString());
    
    // Send to Next.js API for database storage
    const nextjsRes = await fetch("http://localhost:3000/api/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(msg)
    });
    if (!nextjsRes.ok) console.error("Next.js ingest failed", await nextjsRes.text());
    
    // Also send to Python ML backend for real-time processing
    const pythonRes = await fetch("http://localhost:8200/process-sensor-data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(msg)
    });
    if (!pythonRes.ok) console.error("Python ML processing failed", await pythonRes.text());
    
    console.log(`Processed sensor data from ${msg.sensor_id}: ${msg.value}`);
  } catch (e) {
    console.error("Message handling error", e);
  }
});
