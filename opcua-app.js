const { OPCUAClient, AttributeIds, NodeClass } = require('node-opcua');
const fs = require('fs');

// Global error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  console.log('\nPress Enter to exit...');
  process.stdin.once('data', () => process.exit(1));
});

async function exploreOpcUA() {
  // Hardcoded configuration
  const endpoint = 'opc.tcp://192.168.1.50:4840';
  const maxDepth = 2;
  const connectionTimeout = 30000; // 30 seconds

  console.log('Starting OPC UA exploration...');
  const client = OPCUAClient.create({ endpointMustExist: false });
  let session;

  // Connect with timeout
  async function connect() {
    const startTime = Date.now();
    while (Date.now() - startTime < connectionTimeout) {
      try {
        console.log(`Connecting to OPC UA at ${endpoint}`);
        await client.connect(endpoint);
        session = await client.createSession();
        console.log('Session created:', session.sessionName.toString());
        return session;
      } catch (err) {
        console.error('Connection attempt failed:', err.message);
        console.log('Retrying in 5s...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    throw new Error('Connection timed out after 30 seconds');
  }

  try {
    session = await connect();

    // Browse nodes recursively
    const output = [];
    async function browseNode(nodeId, depth = 0, indent = '') {
      if (depth > maxDepth) return;

      try {
        const browseResult = await session.browse(nodeId);
        const nodeInfo = `${indent}Node: ${nodeId} (Depth: ${depth})`;
        console.log(nodeInfo);
        output.push(nodeInfo);

        for (const ref of browseResult.references) {
          const { nodeId, browseName, nodeClass } = ref;
          const refInfo = `${indent}  - ${browseName} (${nodeId}, ${NodeClass[nodeClass]})`;
          console.log(refInfo);
          output.push(refInfo);

          if (nodeClass === NodeClass.Variable) {
            try {
              const dataValue = await session.read({ nodeId: nodeId.toString(), attributeId: AttributeIds.Value });
              const value = dataValue.value ? dataValue.value.value : 'No value';
              const valueInfo = `${indent}    Value: ${value}`;
              console.log(valueInfo);
              output.push(valueInfo);
            } catch (readErr) {
              const errorInfo = `${indent}    Value: ERROR - ${readErr.message}`;
              console.log(errorInfo);
              output.push(errorInfo);
            }
          }

          if (nodeClass === NodeClass.Object || nodeClass === NodeClass.Variable) {
            await browseNode(nodeId.toString(), depth + 1, indent + '  ');
          }
        }
      } catch (browseErr) {
        const errorInfo = `${indent}  Browse error for ${nodeId}: ${browseErr.message}`;
        console.error(errorInfo);
        output.push(errorInfo);
      }
    }

    console.log('\nBrowsing ObjectsFolder:');
    output.push('\nBrowsing ObjectsFolder:');
    await browseNode('ObjectsFolder', 0, '');

    // Save output to file
    try {
      fs.writeFileSync('nodes.txt', output.join('\n'));
      console.log('Output saved to nodes.txt');
    } catch (fsErr) {
      console.error('Failed to write nodes.txt:', fsErr.message);
    }

    // Keep console open
    console.log('\nPress Enter to exit...');
    process.stdin.once('data', async () => {
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
    console.error('OPC UA error:', err.message);
    console.error(err.stack);
    try {
      await client.disconnect();
    } catch (disconnectErr) {
      console.error('Error disconnecting client:', disconnectErr.message);
    }
    console.log('\nPress Enter to exit...');
    process.stdin.once('data', () => process.exit(1));
  }
}

exploreOpcUA();