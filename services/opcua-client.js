const { OPCUAClient, AttributeIds, NodeClass } = require('node-opcua');
const config = require('../config/opcua.config');

/**
 * Start an OPC UA client that:
 * 1. Connects to the server
 * 2. Optionally browses the Objects folder
 * 3. Polls a dynamic list of NodeIds and logs their values
 *
 * @param {{ nodes: string[], pollSec: number }} options
 */
async function startOpcUA({ nodes = [], pollSec = 2 }) {
  const client = OPCUAClient.create({ endpointMustExist: false });
  try {
    console.log('Connecting to OPC UA at', config.endpoint);
    await client.connect(config.endpoint);
    const session = await client.createSession();
    console.log('Session created:', session.sessionName.toString());

    // Optional: browse root ObjectsFolder
    const browseResult = await session.browse('ObjectsFolder');
    console.log('\nObjectsFolder:');
    browseResult.references.forEach(ref => {
      console.log(`- ${ref.browseName.toString()} (${ref.nodeId.toString()})`);
    });

    // Polling loop
    setInterval(async () => {
      const readings = {};
      for (const nodeId of nodes) {
        try {
          const dv = await session.read({ nodeId, attributeId: AttributeIds.Value });
          readings[nodeId] = dv.value.value;
        } catch (err) {
          readings[nodeId] = `ERROR: ${err.message}`;
        }
      }
      const timestamp = new Date().toISOString();
      console.log({ timestamp, readings });
      // TODO: forward readings to your pipeline (e.g., via insertData or HTTP)
    }, pollSec * 1000);

  } catch (err) {
    console.error('OPC UA error:', err);
  }
}

module.exports = { startOpcUA };