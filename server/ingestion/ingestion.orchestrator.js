import { createHash } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { Pinecone } from "@pinecone-database/pinecone";
import { chunker } from "./chunker.js";
import { cloneRepoBranch } from "./cloner.js";
import { embedder } from "./embedder.js";
import { filter } from "./filter.js";
import { getIndexMetadata, saveIndexMetadata } from "./indexMetadata.store.js";
import { indexLexicalChunks } from "./lexicalIndexer.js";

const refreshLocks = new Map();

const normaliseRepositoryUrl = (repoURL) => {
  const parsed = new URL(repoURL);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("repoURL must be an HTTP(S) Git repository URL");
  }

  return `${parsed.protocol}//${parsed.host}${parsed.pathname
    .replace(/\/$/, "")
    .replace(/\.git$/, "")}`;
};

const withRefreshLock = async (key, operation) => {
  const previous = refreshLocks.get(key) ?? Promise.resolve();

  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });

  const queued = previous.then(() => gate);
  refreshLocks.set(key, queued);

  await previous;

  try {
    return await operation();
  } finally {
    release();
    if (refreshLocks.get(key) === queued) refreshLocks.delete(key);
  }
};

const namespaceFor = (identity) =>
  `repo-${createHash("sha256").update(identity).digest("hex").slice(0, 48)}`;

const replaceNamespace = async (sessionId, chunks) => {
  const index = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  }).index(process.env.PINECONE_INDEX);

  try {
    await index.namespace(sessionId).deleteAll();
  } catch (error) {
    // First ingestion: the stable namespace does not exist yet.
    if (!error.message.includes("HTTP status 404")) {
      throw error;
    }
  }

  if (chunks.length > 0) {
    await embedder(chunks, sessionId);
  }
};

export const ingestionOrchestrator = async (repoURL, branch) => {
  const normalisedRepoURL = normaliseRepositoryUrl(repoURL);

  // Lock by repository because the default branch is not known yet.
  return withRefreshLock(normalisedRepoURL, async () => {
    let cloneDir;

    try {
      // Clone first so we know the actual branch.
      const clone = await cloneRepoBranch(normalisedRepoURL, branch);
      cloneDir = clone.cloneDir;

      const actualBranch = clone.branch;
      const identity = `${normalisedRepoURL}#${actualBranch}`;
      const sessionId = namespaceFor(identity);

      const previous = await getIndexMetadata(identity);

      if (previous?.commitSha === clone.commitSha) {
        const files = await filter(cloneDir);
        const chunks = [];

        for (const file of files) {
          chunks.push(...(await chunker(file)));
        }

        for (const chunk of chunks) {
          chunk.filePath = path.relative(cloneDir, chunk.filePath);
        }

        await indexLexicalChunks(sessionId, chunks);

        return {
          sessionId,
          branch: actualBranch,
          commitSha: clone.commitSha,
          updated: false,
          chunksIndexed: previous.chunksIndexed ?? chunks.length,
        };
      }

      const files = await filter(cloneDir);
      const chunks = [];

      for (const file of files) {
        chunks.push(...(await chunker(file)));
      }

      for (const chunk of chunks) {
        chunk.filePath = path.relative(cloneDir, chunk.filePath);
      }

      await replaceNamespace(sessionId, chunks);
      await indexLexicalChunks(sessionId, chunks);

      const metadata = {
        repoURL: normalisedRepoURL,
        branch: actualBranch,
        sessionId,
        commitSha: clone.commitSha,
        chunksIndexed: chunks.length,
        indexedAt: new Date().toISOString(),
      };

      await saveIndexMetadata(identity, metadata);

      return { ...metadata, updated: true };
    } finally {
      if (cloneDir) {
        await rm(cloneDir, { recursive: true, force: true });
      }
    }
  });
};
