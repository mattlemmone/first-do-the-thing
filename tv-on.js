/**
 * LG TV Turn On Utility
 * 
 * A simple utility to test turning on the LG TV using Wake-on-LAN.
 * Uses the configuration from the .env file.
 */

const lgtv = require('lgtv2');
const path = require('path');
const wol = require('wake_on_lan');
require('dotenv').config();

// Get TV configuration from .env
const TV_IP = process.env.TV_IP;
const TV_PORT = process.env.TV_PORT || 3001;
const TV_KEY = process.env.TV_KEY;
// Extract MAC address from TV info (if available)
const TV_MAC = process.env.TV_MAC || '00:00:00:00:00:00'; // Fallback placeholder MAC address

console.log(`
=================================================
LG TV TURN ON UTILITY
=================================================
TV IP: ${TV_IP}
TV Port: ${TV_PORT}
TV MAC: ${TV_MAC}
=================================================
`);

// Send Wake-on-LAN packet to turn on the TV
console.log('Sending Wake-on-LAN packet to turn on the TV...');
wol.wake(TV_MAC, (error) => {
  if (error) {
    console.error('Error sending Wake-on-LAN packet:', error);
    process.exit(1);
  } else {
    console.log('Wake-on-LAN packet sent successfully');
    console.log('The TV should turn on shortly if Wake-on-LAN is enabled');
    
    // Try to connect to the TV after a delay
    console.log('Waiting 10 seconds for the TV to boot up...');
    setTimeout(checkTVStatus, 10000);
  }
});

function checkTVStatus() {
  console.log('Attempting to connect to the TV...');
  
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
    console.log('The TV might still be booting up or Wake-on-LAN might not be enabled');
    process.exit(1);
  });
  
  connection.on('connecting', () => {
    console.log('Connecting to TV...');
  });
  
  connection.on('connect', () => {
    console.log('✅ Connected to TV successfully! The TV is now on.');
    
    // Get TV info to verify connection
    connection.request('ssap://com.webos.service.update/getCurrentSWInformation', (err, res) => {
      if (err) {
        console.error('Error getting TV info:', err);
      } else {
        console.log('\nTV Information:');
        console.log(JSON.stringify(res, null, 2));
      }
      
      // Disconnect after getting info
      setTimeout(() => {
        connection.disconnect();
        console.log('\nTest completed!');
        process.exit(0);
      }, 1000);
    });
  });
  
  // Set a timeout for the connection attempt
  setTimeout(() => {
    console.error('\nConnection timed out after 15 seconds');
    console.log('The TV might still be booting up or Wake-on-LAN might not be enabled');
    if (connection) {
      connection.disconnect();
    }
    process.exit(1);
  }, 15000);
} 