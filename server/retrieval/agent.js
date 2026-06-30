import { evalPrompt } from "./agentPrompt.js";
import { answerPrompt } from "./resultPrompt.js";
import { retriever } from "./retriever.js";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const callAgent = async (messages, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
      });
    } catch (err) {
      throw err;
    }
  }
};

export const agent = async (query) => {
  const chunks = await retriever(query);

  let iterations = 0;
  const MAX_ITERATIONS = 3;
  while (iterations < MAX_ITERATIONS) {
    try {
      const messages = [
        { role: "system", content: evalPrompt(chunks) },
        {
          role: "user",
          content: `Question: ${query}\n\nDo the chunks above contain enough information to answer this question? Reply ONLY "YES" or "NO".`,
        },
      ];
      const response = await callAgent(messages);
      const message = response.choices[0].message;
      // console.log(message.content);
      if (message.content == "YES") break;
      iterations++;
    } catch (err) {
      throw err;
    }
  }
  const messages = [
    { role: "system", content: answerPrompt(query, chunks) },
    {
      role: "user",
      content: `Query: ${query} `,
    },
  ];
  const response = await callAgent(messages);
  const message = response.choices[0].message;
  return message.content;
};
