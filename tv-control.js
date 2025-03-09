/**
 * LG TV Control Utility
 * 
 * A simple utility to test LG TV control functionality.
 * Uses the configuration from the .env file.
 */

const lgtv = require('lgtv2');
const path = require('path');
require('dotenv').config();

// Get TV configuration from .env
const TV_IP = process.env.TV_IP;
const TV_PORT = process.env.TV_PORT || 3001;
const TV_KEY = process.env.TV_KEY;

console.log(`
=================================================
LG TV CONTROL UTILITY
=================================================
TV IP: ${TV_IP}
TV Port: ${TV_PORT}
Client Key: [HIDDEN]
=================================================
`);

// Create a temporary key file path
const keyFilePath = path.join(__dirname, 'tv-key.txt');

// Create connection with the client key and WebSocket options
const connection = lgtv({
  url: `wss://${TV_IP}:${TV_PORT}`,
  timeout: 10000,
  reconnect: 0,
  clientKey: TV_KEY,
  // Provide a custom key file path and save function
  keyFile: keyFilePath,
  saveKey: (key) => {
    console.log(`Received new client key (hidden for security)`);
    // We don't need to save it since we already have it in .env
  },
  // Add WebSocket configuration to bypass security checks
  wsconfig: {
    rejectUnauthorized: false, // This is equivalent to --no-check
    tlsOptions: {
      rejectUnauthorized: false
    }
  }
});

// Handle connection events
connection.on('error', (err) => {
  console.error(`Error: ${err.message}`);
});

connection.on('connecting', () => {
  console.log('Connecting to TV...');
});

connection.on('connect', () => {
  console.log('✅ Connected to TV successfully!');
  
  // Get TV info to verify connection
  connection.request('ssap://com.webos.service.update/getCurrentSWInformation', (err, res) => {
    if (err) {
      console.error('Error getting TV info:', err);
    } else {
      console.log('\nTV Information:');
      console.log(JSON.stringify(res, null, 2));
    }
    
    // Try to turn off the TV
    console.log('\nSending turn off command...');
    connection.request('ssap://system/turnOff', (err, res) => {
      if (err) {
        console.error('Failed to turn off TV:', err);
      } else {
        console.log('TV turn off command sent successfully:', res);
      }
      
      // Disconnect after command
      setTimeout(() => {
        connection.disconnect();
        console.log('\nTest completed!');
        process.exit(0);
      }, 1000);
    });
  });
});

// Set a timeout for the entire process
setTimeout(() => {
  console.error('\nConnection timed out after 15 seconds');
  if (connection) {
    connection.disconnect();
  }
  process.exit(1);
}, 15000); 