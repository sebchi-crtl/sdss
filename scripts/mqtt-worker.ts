import mqtt from "mqtt";

const url = process.env.MQTT_URL || "mqtt://localhost:1883";
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
    const res = await fetch("http://localhost:3000/api/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(msg)
    });
    if (!res.ok) console.error("Ingest failed", await res.text());
  } catch (e) {
    console.error("Message handling error", e);
  }
});
