import { evalPrompt, reformulatePrompt } from "./agentPrompt.js";
import { answerPrompt } from "./resultPrompt.js";
import { hybridRetriever } from "./hybridRetriever.js";
import Groq from "groq-sdk";
import PQueue from "p-queue";

const groqQueue = new PQueue({
  concurrency: 1,
  intervalCap: 1,
  interval: 8000,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const callAgent = async (messages, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await groqQueue.add(() =>
        groq.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages,
        }),
      );
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

/*
 * Give the evaluator the most relevant retrieved chunks.
 * Preserve the complete text of each selected chunk.
 */

const getEvaluatorChunks = (chunks) => {
  const MAX_CHUNKS = 4;
  const MAX_CHARS_PER_CHUNK = 1200;

  return chunks.slice(-MAX_CHUNKS).map((chunk) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      text: chunk.metadata.text?.slice(0, MAX_CHARS_PER_CHUNK),
    },
  }));
};

/*
 * Limit how much actual code reaches the final answer model.
 */
const trimChunks = (chunks) => {
  const MAX_CHARS_PER_CHUNK = 1500;

  return chunks.map((chunk) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      text: chunk.metadata.text?.slice(0, MAX_CHARS_PER_CHUNK),
    },
  }));
};

const addUniqueChunks = (existing, newChunks) => {
  const seen = new Set(
    existing.map(
      (c) =>
        `${c.metadata.filePath}:${c.metadata.startLine}-${c.metadata.endLine}`,
    ),
  );

  for (const chunk of newChunks) {
    const key = `${chunk.metadata.filePath}:${chunk.metadata.startLine}-${chunk.metadata.endLine}`;

    if (!seen.has(key)) {
      existing.push(chunk);
      seen.add(key);
    }
  }
};

export const agent = async (query, sessionId) => {
  let searchQuery = query;
  let chunks = [];

  const MAX_ITERATIONS = 3;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const { results } = await hybridRetriever(searchQuery, sessionId);

    const newChunks = results;

    console.log("\n========== MERGED CHUNKS ==========");

    newChunks.forEach((chunk, i) => {
      const metadata = chunk.metadata ?? chunk;

      console.log({
        rank: i + 1,
        filePath: metadata.filePath,
        name: metadata.name,
        startLine: metadata.startLine,
        endLine: metadata.endLine,
        score: chunk.score,
        textPreview: metadata.text?.slice(0, 150),
      });
    });

    console.log("===================================\n");

    // Add new chunks to existing context
    addUniqueChunks(chunks, newChunks);

    const evalMessages = [
      {
        role: "system",
        content: evalPrompt(getEvaluatorChunks(chunks), query),
      },
      {
        role: "user",
        content: `Question: ${query}`,
      },
    ];

    const evalResponse = await callAgent(evalMessages);

    const evaluation = JSON.parse(
      evalResponse.choices[0].message.content.trim(),
    );

    console.log("\n========== EVALUATION ==========");
    console.log(evaluation);
    console.log("================================\n");

    if (evaluation.sufficient) {
      break;
    }

    searchQuery = evaluation.searchQuery;

    console.log("🔎 Missing:", evaluation.missing);
    console.log("🔎 Next search:", searchQuery);
  }

  // Answer using ALL retrieved context
  const answerMessage = [
    {
      role: "system",
      content: answerPrompt(query, trimChunks(chunks).slice(-3)),
    },
    {
      role: "user",
      content: `Query: ${query}`,
    },
  ];

  const response = await callAgent(answerMessage);
  return response.choices[0].message.content;
};
