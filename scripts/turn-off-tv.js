/**
 * Script to turn off an LG TV
 *
 * This script connects to an LG TV and sends the turn off command
 *
 * Usage: node scripts/turn-off-tv.js [TV_IP] [TV_KEY]
 */

require("dotenv").config();
const { connect, turnOff } = require("../dist/lgtv");

// Get TV IP and key from command line args or .env file
const tvIp = process.argv[2] || process.env.TV_IP;
const tvKey = process.argv[3] || process.env.TV_KEY;

if (!tvIp) {
  console.error("Error: TV IP address is required");
  console.error("Usage: node scripts/turn-off-tv.js [TV_IP] [TV_KEY]");
  console.error("Alternatively, set TV_IP and TV_KEY in your .env file");
  process.exit(1);
}

/**
 * Main function to turn off the TV
 */
async function main() {
  console.log(`
=================================================
LG TV CONTROL - TURN OFF
=================================================
TV IP: ${tvIp}
Client Key: ${tvKey ? "[PROVIDED]" : "[NOT PROVIDED]"}
=================================================
`);

  console.log("🔄 Connecting to TV...");

  console.log(tvIp, tvKey);
  try {
    // Connect to the TV
    const tvConnection = await connect({
      ip: tvIp,
      key: tvKey,
    });

    console.log("✅ Connected to TV. Sending turn off command...");

    // Turn off the TV
    await turnOff(tvConnection.connection);

    console.log("✅ TV turned off successfully");

    // Disconnect from the TV
    tvConnection.disconnect();
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);

    if (!tvKey) {
      console.error(`
No TV key provided. You may need to pair with the TV first.
Run the get-tv-key.js script to obtain a client key:
  node scripts/get-tv-key.js ${tvIp}
`);
    }

    process.exit(1);
  }
}

// Run the main function
main();
