import { evalPrompt, reformulatePrompt } from "./agentPrompt.js";
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
        model: "openai/gpt-oss-120b",
        messages,
      });
    } catch (err) {
      throw err;
    }
  }
};

export const agent = async (query, sessionId) => {
  let searchQuery = query;
  let chunks = [];

  const MAX_ITERATIONS = 3;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    chunks = await retriever(searchQuery, sessionId);

    const evalMesages = [
      {
        role: "system",
        content: evalPrompt(chunks,query),
      },
      {
        role: "user",
        content: `Question: ${query}
        Do the chunks above contain enough information to answer this question? 

        Reply ONLY "YES" or "NO".`,
      },
    ];

    const evalResponse = await callAgent(evalMesages);

    const decision = evalResponse.choices[0].message.content
      .trim()
      .toUpperCase();

    if (decision === "YES") break;

    const reformulateMessage = [
      {
        role: "system",
        content: reformulatePrompt(query, chunks),
      },
      {
        role: "user",
        content: `Original question: ${query}`,
      },
    ];

    const reformulateResponse = await callAgent(reformulateMessage);

    searchQuery = reformulateResponse.choices[0].message.content.trim();

    console.log(`🔎 Retrieval iteration ${iteration + 1}`);
    console.log(`New search query: ${searchQuery}`);
  }

  const answerMessage = [
    {
      role: "system",
      content: answerPrompt(query, chunks),
    },
    {
      role: "user",
      content: `Query: ${query}`,
    },
  ];

  const response = await callAgent(answerMessage);

  return response.choices[0].message.content;
};
