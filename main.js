// Import required modules
require('dotenv').config();
const express = require('express');
const pool = require('./config/database');  // Database connection
const mqttService = require('./services/mqtt'); // MQTT handler
const cipService = require('./services/cip');   // CIP handler
const tcpService = require('./services/tcp');   // TCP server
const apiRoutes = require('./routes/api');      // API routes (optional)

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (if needed)
app.use(express.json());

// Start the services
mqttService.startMQTT();
cipService.startCIP();
tcpService.startTCP();

// Optional: API routes (for debugging or web dashboards)
app.use('/api', apiRoutes);

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log("Shutting down server...");
    process.exit();
});
