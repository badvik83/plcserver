require('dotenv').config();

// Validate endpoint
if (!process.env.OPCUA_ENDPOINT) {
  throw new Error('OPCUA_ENDPOINT is not defined in .env file');
}

module.exports = {
  endpoint: process.env.OPCUA_ENDPOINT
};