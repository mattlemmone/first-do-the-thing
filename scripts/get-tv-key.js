/**
 * Script to fetch a client key from an LG TV
 *
 * This script connects to an LG TV and retrieves a client key
 * which can be used for future connections without requiring
 * pairing approval each time.
 *
 * Usage: node scripts/get-tv-key.js [TV_IP]
 */

require("dotenv").config();
const { connect } = require("../dist/lgtv");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Get TV IP from command line args or .env file
const tvIp = process.argv[2] || process.env.TV_IP;

if (!tvIp) {
  console.error("Error: TV IP address is required");
  console.error("Usage: node scripts/get-tv-key.js [TV_IP]");
  console.error("Alternatively, set TV_IP in your .env file");
  process.exit(1);
}

/**
 * Main function to get the client key
 */
async function main() {
  console.log(`
=================================================
LG TV PAIRING SCRIPT
=================================================
Attempting to connect to LG TV at ${tvIp}
IMPORTANT: 
1. Make sure your TV is turned ON
2. When prompted, ACCEPT the connection on your TV
3. The client key will be displayed for you to save
=================================================
`);

  console.log("🔄 Connecting to TV...");

  try {
    // Connect to the TV without a key to initiate pairing
    const tvConnection = await connect({ ip: tvIp });

    // Check if we received a client key
    if (tvConnection.clientKey) {
      console.log(`
✅ SUCCESS! Received client key from TV:
=================================================
${tvConnection.clientKey}
=================================================

To use this key in your application:
1. Add it to your .env file as TV_KEY=${tvConnection.clientKey}
2. Or use it directly in your code or command line

This key allows you to connect to your TV without
requiring pairing approval each time.
`);
    } else {
      console.log(`
❌ No client key was received. 
Make sure you accepted the pairing request on your TV.
Try running the script again.
`);
    }

    // Disconnect from the TV
    tvConnection.disconnect();
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
