const mqtt = require('mqtt');
const insertProduction = require('./insertData');
require('dotenv').config();

const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://localhost";
const client = mqtt.connect(MQTT_BROKER);

function startMQTT() {
    client.on('connect', () => {
        console.log("MQTT Connected");
        client.subscribe('Factory/+/+'); // Subscribe to all machine topics
    });

    client.on('message', async (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());
            console.log(`MQTT Received [${topic}]:`, payload);

            // Extract Data
            const machine = payload.Machine || null;
            const produced = payload.Produced || null;
            const state = payload.state !== undefined ? payload.state : null;
            const timestamp = payload.timestamp || null; // Optional timestamp

            // Validate Data
            if (!machine || produced === null) {
                console.warn("Invalid MQTT Data Received:", payload);
                return;
            }

            // Insert into Database
            await insertProduction(machine, produced, state, timestamp);
        } catch (err) {
            console.error("MQTT Parsing Error:", err);
        }
    });

    client.on('error', (err) => console.error("MQTT Connection Error:", err));
}

module.exports = { startMQTT };