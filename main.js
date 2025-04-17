// Load environment variables
require('dotenv').config();

// Imports
const express = require('express');
const pool = require('./config/database');
const mqttService = require('./services/mqtt');
const cipService = require('./services/cip');
const tcpService = require('./services/tcp');
const { startOpcUA } = require('./services/opcua.client');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Start services
mqttService.startMQTT();
cipService.startCIP();
tcpService.startTCP();

// Start OPC UA client with optional browse depth
startOpcUA({ maxDepth: 2 })  // You can change this value as needed
  .then(() => console.log('OPC UA client running'))
  .catch(err => console.error('Failed to start OPC UA client:', err));

// Optional: API routes
app.use('/api', apiRoutes);

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log("Shutting down server...");
  process.exit();
});