import { filter } from "./filter.js";
import { chunker } from "./chunker.js";
import { cloneRepo } from "./cloner.js";
import { embedder } from "./embedder.js";

import { rm } from "node:fs/promises";

export const ingestionOrchestrator = async (repoURL) => {
  try {
    const cloneDir = await cloneRepo(repoURL);
    const filesPath = await filter(cloneDir);
    const chunks = [];
    for (const file of filesPath) {
      chunks.push(...(await chunker(file)));
    }
    console.log("files found:", filesPath.length);
    console.log("chunks found:", chunks.length);
    await rm(cloneDir, { recursive: true, force: true });
    await embedder(chunks);
  } catch (err) {
    throw err;
  }
};
