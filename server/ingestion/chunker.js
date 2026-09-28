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

  return splitLargeChunks(chunks);
};
