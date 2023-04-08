import express, {response} from "express";
import expressWebsockets from "express-ws";
import cors from "cors";
import {onChangePayload, Server} from "@hocuspocus/server";
import * as path from "path";
import {SQLite} from "@hocuspocus/extension-sqlite";
import {Logger} from "@hocuspocus/extension-logger";
import {fromUint8Array} from "js-base64";

// Configure Hocuspocus
const server = Server.configure({
  name: "hivemind",
  port: 1234,
  timeout: 30000,
  debounce: 5000,
  maxDebounce: 30000,
  quiet: true,

  async onChange(data: onChangePayload) {
    try {
      const base64String = fromUint8Array(data.update)
      const jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
      const jsonObject = JSON.parse(jsonString);
      console.log(jsonObject);
    } catch (e) {
      console.log(e);
    }
    return true;
  },

  extensions: [
    new SQLite({
      database: "data/mind.db"
    }),
    new Logger(),
  ]
});

// Setup your express instance using the express-ws extension
const { app } = expressWebsockets(express());

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: 'http://192.168.5.*'
}))

// A basic http route
app.get("/hello", (request, response) => {
  response.send("Hello World!");
});

// Add a websocket route for Hocuspocus
// Note: make sure to include a parameter for the document name.
// You can set any contextual data like in the onConnect hook
// and pass it to the handleConnection method.
app.ws("/collaboration/:documentName", (websocket, request) => {
  const context = {
    user: {
      id: 1234,
      name: "Jane",
    },
  };

  server.handleConnection(websocket, request, context);
});

app.get("/append", (request, response) => {

});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(1234, '0.0.0.0', () => console.log("Listening on http://127.0.0.1:1234"));