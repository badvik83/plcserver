// services/opcua.client.js
const { OPCUAClient, AttributeIds, NodeClass } = require('node-opcua');
const config = require('../config/opcua.config');

/**
 * Explore an OPC UA server by:
 * 1. Connecting to the server
 * 2. Browsing the Objects folder (and optionally deeper levels)
 * 3. Reading values for Variable nodes
 *
 * @param {{ maxDepth?: number }} options - Max browse depth (default: 1)
 * @throws {Error} If options are invalid
 */
async function startOpcUA({ maxDepth = 1 } = {}) {
  // Validate inputs
  if (typeof maxDepth !== 'number' || maxDepth < 0) {
    throw new Error('maxDepth must be a non-negative number');
  }

  const client = OPCUAClient.create({ endpointMustExist: false });
  const nodeIdStr = nodeId.toString();
  let session;

  // Reconnection logic
  async function connect() {
    try {
      console.log('Connecting to OPC UA at', config.endpoint);
      await client.connect(config.endpoint);
      session = await client.createSession();
      console.log('Session created:', session.sessionName.toString());
      return session;
    } catch (err) {
      console.error('Connection failed, retrying in 5s:', err.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connect();
    }
  }

  try {
    // Connect to server
    session = await connect();

    // Browse nodes recursively
    async function browseNode(nodeId, depth = 0, indent = '') {
      if (depth > maxDepth) return;

      try {
        const browseResult = await session.browse(nodeId);
        console.log(`${indent}Node: ${nodeId} (Depth: ${depth})`);

        for (const ref of browseResult.references) {
          const { nodeId, browseName, nodeClass } = ref;
          console.log(`${indent}  - ${browseName} (${nodeId}, ${NodeClass[nodeClass]})`);

          // Try reading value if it's a Variable node
          if (nodeClass === NodeClass.Variable) {
            try {
              const dataValue = await session.read({ nodeId: nodeIdStr, attributeId: AttributeIds.Value });
              const value = dataValue.value ? dataValue.value.value : 'No value';
              console.log(`${indent}    Value: ${value}`);
            } catch (readErr) {
              console.log(`${indent}    Value: ERROR - ${readErr.message}`);
            }
          }

          // Recurse into child nodes
          if (nodeClass === NodeClass.Object || nodeClass === NodeClass.Variable) {
            await browseNode(nodeIdStr, depth + 1, indent + '  ');
          }
        }
      } catch (browseErr) {
        console.error(`${indent}  Browse error for ${nodeId}: ${browseErr.message}`);
      }
    }

    // Start browsing from ObjectsFolder
    console.log('\nBrowsing ObjectsFolder:');
    await browseNode('ObjectsFolder', 0, '');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Closing OPC UA session and client...');
      try {
        await session.close();
        await client.disconnect();
      } catch (err) {
        console.error('Error during shutdown:', err.message);
      }
      process.exit(0);
    });

  } catch (err) {
    console.error('OPC UA error:', err);
    try {
      await client.disconnect();
    } catch (disconnectErr) {
      console.error('Error disconnecting client:', disconnectErr.message);
    }
    throw err;
  }
}

module.exports = { startOpcUA };