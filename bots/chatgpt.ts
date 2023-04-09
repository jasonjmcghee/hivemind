import { Configuration, OpenAIApi } from "openai";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const promptUser = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt + "\n", (input) => {
      resolve(input);
    });
  });
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
});
const openai = new OpenAIApi(configuration);

interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

const chat = async (messages: Message[]): Promise<Message> => {
  // try {
  const result = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  return result.data.choices[0]!.message!;

  // } catch (error) {
  //   if (error.response) {
  //     console.log(error.response.status);
  //     console.log(error.response.data);
  //   } else {
  //     console.log(error.message);
  //   }
  // }
};

const initalMessage: Message = {
  role: "system",
  content: "Hello, how can I help you?",
};
const startChat = async () => {
  const messages: Message[] = [initalMessage];
  while (true) {
    const input = await promptUser(messages[messages.length - 1]!.content);
    messages.push({ role: "user", content: input });
    const output = await chat(messages);
    messages.push(output);
  }
};

startChat();
