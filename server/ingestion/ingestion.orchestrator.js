import { filter } from "./filter.js";
import { chunker } from "./chunker.js";
import { cloneRepo } from "./cloner.js";
import { embedder } from "./embedder.js";

import { rm } from "node:fs/promises";
import path from "node:path";
import { Pinecone } from "@pinecone-database/pinecone";

export const ingestionOrchestrator = async (repoURL) => {
  try {
    const cloneDir = await cloneRepo(repoURL);
    const filesPath = await filter(cloneDir);
    const chunks = [];
    for (const file of filesPath) {
      chunks.push(...(await chunker(file)));
    }

    chunks.forEach(chunk => {
      chunk.filePath = path.relative(cloneDir, chunk.filePath);
    })

    await rm(cloneDir, { recursive: true, force: true });

    const index = new Pinecone({apiKey: process.env.PINECONE_API_KEY}).index(process.env.PINECONE_INDEX , process.env.PINECONE_HOST);

    await index.deleteAll();

    await embedder(chunks);
  } catch (err) {
    throw err;
  }
};
