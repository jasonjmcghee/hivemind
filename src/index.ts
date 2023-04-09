import express, {response} from "express";
import expressWebsockets from "express-ws";
import cors from "cors";
import {onChangePayload, Server} from "@hocuspocus/server";
import {TiptapTransformer} from "@hocuspocus/transformer";
import * as path from "path";
import {selectQuery, SQLite} from "@hocuspocus/extension-sqlite";
import {Logger} from "@hocuspocus/extension-logger";
import * as Y from "yjs";

const sqlite = new SQLite({
  database: "data/mind.db"
});

// Configure Hocuspocus
const server = Server.configure({
  name: "hivemind",
  port: 1234,
  timeout: 30000,
  debounce: 5000,
  maxDebounce: 30000,
  quiet: true,

  // async onChange(data: onChangePayload) {
  //   try {
  //     const map = Y.decodeUpdate(data.update);
  //     console.log(map);
  //   } catch (e) {
  //     console.log(e);
  //   }
  //   return true;
  // },

  extensions: [
    sqlite,
    new Logger(),
  ]
});

// Setup your express instance using the express-ws extension
const {app} = expressWebsockets(express());

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: 'http://192.168.7.*'
}));

// A basic http route
app.get("/hello", (request, response) => {
  response.send("Hello World!");
});

app.get("/document/:documentName", async (request, response) => {
  const documentName = request.params.documentName;
  await sqlite.db?.get(selectQuery, {
    $name: documentName,
  }, (error, row) => {
    if (error) {
      response.send(error);
      return;
    }

    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, (row as any)?.data);
    const json = ydoc.getXmlFragment('default').toJSON();
    // const tt = TiptapTransformer.fromYdoc(ydoc);
    // tt.default.content.push({
    //   type: "paragraph",
    //   attrs: {textAlign: "left"},
    //   content: [{ type: "text", text: "Hello!" }]
    // })
    response.send(json);
  });
});

const paragraph = {
  type: "paragraph",
  attrs: {textAlign: "left"},
  content: [{ type: "text", text: "Hello!" }]
};

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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(1234, '0.0.0.0', () => console.log("Listening on http://127.0.0.1:1234"));