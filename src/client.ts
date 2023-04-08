import { WebSocket } from "ws";
import * as Y from 'yjs';
import * as readline from "readline";

const ydoc = new Y.Doc();

// Create a new WebSocket client
const ws = new WebSocket('ws://192.168.5.154:1234/collaboration/hello');
ws.binaryType = 'arraybuffer';

// Handle connection open event
ws.on('open', () => {
  console.log('Connected to server');

  // Send a message to the server
  ws.send('Hello, server!');
});

// Handle message received event
ws.on('message', (message) => {
  console.log(`Received message: ${message}`);
});

// Handle connection close event
ws.on('close', () => {
  console.log('Disconnected from server');
});

// Handle error event
ws.on('error', (error) => {
  console.error(`WebSocket error: ${error}`);
});

// Create a readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define the function to ask the user for input and echo it back
const askForInput = () => {
  rl.question('Enter some text: ', (text) => {
    ws.send(text);

    // Ask for input again
    askForInput();
  });
};

// Start asking for input
askForInput();