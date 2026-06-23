import path from "node:path";
import { jsChunker } from "./subChunker/jsChunker.js";
import {mdChunker} from "./subChunker/mdChunker.js";
import {jsonChunker} from "./subChunker/jsonChunker.js";

export const chunker = async (filePath) => {
  const extensionName = path.extname(filePath);

  switch (extensionName) {
    case ".js":
    case ".ts":
      return await jsChunker(filePath);

    case ".md":
      return await mdChunker(filePath);

    case ".json":
        return await jsonChunker(filePath);

    default:
        return [];
  }

};
