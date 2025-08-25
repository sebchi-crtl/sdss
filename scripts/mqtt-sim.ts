// Simulate random sensor messages over MQTT
import mqtt from "mqtt";

const url = process.env.MQTT_URL || "mqtt://localhost:1883";
const base = "sdss/sensors";

const client = mqtt.connect(url);
client.on("connect", () => {
  console.log("Sim connected");
  setInterval(() => {
    const sensor_id = "rain-" + (1 + Math.floor(Math.random() * 3));
    const payload = {
      sensor_id,
      ts: new Date().toISOString(),
      value: +(Math.random() * 10).toFixed(2),
      lat: 9 + (Math.random() - 0.5) * 0.3,
      lon: 7.3 + (Math.random() - 0.5) * 0.3,
      status: "OK",
      raw: { battery: +(3.7 + Math.random() * 0.4).toFixed(2) }
    };
    const topic = `${base}/${sensor_id}/readings`;
    client.publish(topic, JSON.stringify(payload));
  }, 2000);
});
