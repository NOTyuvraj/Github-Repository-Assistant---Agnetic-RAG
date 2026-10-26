import path from "node:path";
import { jsChunker } from "./subChunker/jsChunker.js";
import { mdChunker } from "./subChunker/mdChunker.js";
import { jsonChunker } from "./subChunker/jsonChunker.js";

const MAX_CHUNK_CHARS = 30000;

const splitLargeChunks = (chunks) =>
  chunks.flatMap((chunk) => {
    if (chunk.text.length <= MAX_CHUNK_CHARS) return [chunk];

    const parts = [];
    const lines = chunk.text.split("\n");
    let text = "";
    let startLine = chunk.startLine ?? 1;

    for (const line of lines) {
      const next = text ? `${text}\n${line}` : line;

      if (next.length > MAX_CHUNK_CHARS && text) {
        parts.push({
          ...chunk,
          name: `${chunk.name ?? "chunk"} (part ${parts.length + 1})`,
          text,
          startLine,
          endLine: startLine + text.split("\n").length - 1,
        });

        startLine += text.split("\n").length;
        text = line;
      } else {
        text = next;
      }
    }

    if (text) {
      parts.push({
        ...chunk,
        name: `${chunk.name ?? "chunk"} (part ${parts.length + 1})`,
        text,
        startLine,
        endLine: startLine + text.split("\n").length - 1,
      });
    }

    return parts;
  });

export const chunker = async (filePath) => {
  const extensionName = path.extname(filePath);
  let chunks = [];

  switch (extensionName) {
    case ".js":
    case ".ts":
      chunks = await jsChunker(filePath);
      break;
    case ".md":
      chunks = await mdChunker(filePath);
      break;
    case ".json":
      chunks = await jsonChunker(filePath);
      break;
    default:
      return [];
  }

  const finalChunks = splitLargeChunks(chunks);

  // DEBUG: inspect chunks for lib/application.js
  if (filePath.endsWith("lib/application.js")) {
    console.log("\n========== APPLICATION.JS CHUNKS ==========");

    finalChunks.forEach((chunk, i) => {
      console.log(`\n--- CHUNK ${i + 1} ---`);
      console.log("Name:", chunk.name);
      console.log("Start:", chunk.startLine);
      console.log("End:", chunk.endLine);
      console.log("Length:", chunk.text.length);
      console.log("Contains app.use:", chunk.text.includes("app.use"));
      console.log(chunk.text);
    });

    console.log("===========================================\n");
  }

  return finalChunks;
};
