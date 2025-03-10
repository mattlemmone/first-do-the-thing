/**
 * LG TV API - Real implementation using WebSocket
 * Based on the lgtv2 package functionality
 */

import logger from './utils/logger';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import https from 'https';

// Define types for the LG TV API
interface LGTVHandshakePayload {
  forcePairing: boolean;
  manifest: {
    appVersion: string;
    manifestVersion: number;
    permissions: string[];
    signatures: {
      signature: string;
      signatureVersion: number;
    }[];
  };
  'client-key'?: string;
}

interface LGTVMessage {
  id: string;
  type: string;
  payload?: any;
  error?: string;
  uri?: string;
}

export interface LGTVConnectionConfig {
  ip: string;
  port?: number;
  key?: string;
}

export interface LGTVConnection {
  connection: any;
  disconnect: () => void;
  clientKey?: string;
}

/**
 * Connect to the LG TV
 * @param config TV configuration
 * @returns Promise that resolves with the connection when connected
 */
export function connect(config: LGTVConnectionConfig): Promise<LGTVConnection> {
  return new Promise((resolve, reject) => {
    const { ip, port = 3001, key } = config;

    if (!ip) {
      return reject(new Error('TV IP address is required'));
    }

    logger.info(`Connecting to LG TV at ${ip}:${port}`);

    // Create WebSocket connection with secure WebSocket and no certificate check
    // This is equivalent to wscat -c wss://IP:PORT --no-check
    const ws = new WebSocket(`wss://${ip}:${port}`, {
      rejectUnauthorized: false,
      handshakeTimeout: 10000,
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    // Create event emitter for handling responses
    const eventEmitter = new EventEmitter();
    
    // Store client key if received during handshake
    let clientKey: string | undefined = key;
    
    // Track registered callbacks by command ID
    const callbacks: Record<string, (err: Error | null, data?: any) => void> = {};
    
    // Message counter for generating unique command IDs
    let messageId = 0;

    ws.on('error', (error: Error) => {
      logger.error(`LG TV connection error: ${error.message}`);
      reject(error);
    });

    ws.on('open', () => {
      logger.info('WebSocket connection established');
      
      // Handle registration/handshake - using the exact same payload that works with wscat
      const handshakePayload = {
        id: "register_0",
        type: "register",
        payload: {
          forcePairing: false,
          manifest: {
            appVersion: "1.0",
            manifestVersion: 1,
            permissions: [
              "control.audio",
              "control.power",
              "control.display",
              "control.input.media",
              "control.input.tv",
              "control.playback",
              "control.recording",
              "control.tv",
              "read.appdata",
              "read.input.device",
              "read.notifications",
              "read.settings",
              "read.tvchannel",
              "write.appdata",
              "write.notifications",
              "write.settings"
            ],
            signatures: [
              {
                signature: "dummy_signature",
                signatureVersion: 1
              }
            ]
          }
        }
      };
      
      // If we have a client key, include it in the handshake
      if (clientKey) {
        (handshakePayload.payload as any)["client-key"] = clientKey;
      }
      
      // Send handshake
      logger.info('Sending registration payload');
      ws.send(JSON.stringify(handshakePayload));
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString()) as LGTVMessage;
        logger.info(`Received message: ${JSON.stringify(message)}`);
        
        // Handle registration response
        if (message.type === 'registered') {
          logger.info('Registered with LG TV');
          
          // Save the client key if provided
          if (message.payload && message.payload['client-key']) {
            clientKey = message.payload['client-key'];
            logger.info(`Received client key from TV`);
          }
          
          // Create connection interface
          const connection = {
            request: (command: string, callback: (err: Error | null, data?: any) => void) => {
              const id = `command_${messageId++}`;
              
              // Parse URI from command (e.g., 'ssap://system/turnOff')
              const uri = command;
              
              // Store callback for this command
              callbacks[id] = callback;
              
              // Send command
              const commandPayload = {
                id,
                type: 'request',
                uri,
                payload: {}
              };
              
              logger.info(`Sending command to TV: ${uri}`);
              ws.send(JSON.stringify(commandPayload));
            }
          };
          
          // Resolve with connection interface
          resolve({
            connection,
            disconnect: () => {
              ws.close();
              logger.info('Disconnected from LG TV');
            },
            clientKey
          });
        }
        // Handle command responses
        else if (message.type === 'response' && callbacks[message.id]) {
          const callback = callbacks[message.id];
          delete callbacks[message.id];
          
          if (message.error) {
            callback(new Error(message.error));
          } else {
            callback(null, message.payload);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error parsing message: ${errorMessage}`);
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket connection closed');
    });
  });
}

/**
 * Turn off the TV
 * @param connection The TV connection
 * @returns Promise that resolves when the TV is turned off
 */
export function turnOff(connection: any): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!connection) {
      return reject(new Error('Not connected to TV'));
    }

    logger.info('Sending turn off command to TV');
    
    connection.request('ssap://system/turnOff', (err: Error | null) => {
      if (err) {
        logger.error(`Failed to turn off TV: ${err.message}`);
        return reject(err);
      }
      
      logger.info('TV turned off successfully');
      resolve();
    });
  });
} 