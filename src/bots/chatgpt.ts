import { Configuration, OpenAIApi } from "openai";
import * as dotenv from "dotenv";
import { Puppeteer } from "../puppeteer";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
});
const openai = new OpenAIApi(configuration);

interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a helpful AI assistant.
Answer any questions the user poses to you using your vast knowledge and experience,
to the best of your ability.`;

async function* streamChatCompletion(messages) {
  const response = await openai.createChatCompletion(
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: "system", content: SYSTEM_PROMPT}, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true
    },
    {
      responseType: 'stream',
    },
  )

  for await (const chunk of response.data as any) {
    const lines = chunk
      .toString('utf8')
      .split('\n')
      .filter((line) => line.trim().startsWith('data: '))

    for (const line of lines) {
      const message = line.replace(/^data: /, '')
      if (message === '[DONE]') {
        return
      }

      const json = JSON.parse(message)
      const token = json.choices[0].delta.content
      if (token) {
        yield token
      }
    }
  }
}

const getMessages = (text: string): Message[] => {
  const splitted = text.split("\n");
  return splitted.map((content, i) => ({
    role: i % 2 === 0 ? "assistant" : "user",
    content,
  }));
};

let globals = {
  store: null
};

(async () => {
  globals.store = new Puppeteer();
  await globals.store.init();
})();

const startChat = async (userQuery: string) => {
  const store = globals.store;

  await store.insertContent(userQuery);
  const messages2 = getMessages(await store.getContent());

  await store.insertContent("");
  for await (const chunk of streamChatCompletion(messages2)) {
    store.insertContentChunk(chunk);
  }
};

const server = express();
server.use(bodyParser.json());
server.use(cors({
  origin: '*'
}));

server.post("/message", async (request, response) => {
  const message = request.body["message"];
  await startChat(message);
  response.send("Ok");
});

server.listen(5555);
