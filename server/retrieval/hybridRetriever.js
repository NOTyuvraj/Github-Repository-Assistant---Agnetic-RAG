import axios from "axios";
import { retriever } from "./retriever.js";

const LEXICAL_SEARCH_URL =
  process.env.LEXICAL_SEARCH_URL || "http://127.0.0.1:8000";

const RRF_K = 60;
const TOP_K = 5;

const getChunkKey = (metadata) =>
  `${metadata.filePath?.replace(/\\/g, "/")}:${metadata.startLine}-${metadata.endLine}`;

export const hybridRetriever = async (query, sessionId) => {
  const [semanticResults, lexicalResponse] = await Promise.all([
    retriever(query, sessionId),
    axios.post(`${LEXICAL_SEARCH_URL}/search`, {
      query,
      sessionId,
      topK: TOP_K,
    }),
  ]);

  const lexicalData = lexicalResponse.data;
  const lexicalResults = lexicalData?.results;

  if (!Array.isArray(semanticResults)) {
    throw new Error("Semantic retriever did not return an array.");
  }

  if (!Array.isArray(lexicalResults)) {
    console.error("Unexpected lexical search response:", lexicalData);
    console.error("Session ID:", sessionId);

    throw new Error(
      `Lexical search response has no results array. ` +
        `Response: ${JSON.stringify(lexicalData)}`,
    );
  }

  const fused = new Map();

  const addResults = (results, source) => {
    results.forEach((result, index) => {
      const metadata = result.metadata ?? result;
      const key = getChunkKey(metadata);

      if (!fused.has(key)) {
        fused.set(key, {
          metadata,
          score: 0,
          semanticRank: null,
          lexicalRank: null,
        });
      }

      const item = fused.get(key);

      item.score += 1 / (RRF_K + index + 1);
      item[source] = index + 1;

      // Prefer the semantic result's metadata when a chunk
      // appears in both lists.
      if (source === "semanticRank") {
        item.metadata = metadata;
      }
    });
  };

  addResults(semanticResults, "semanticRank");
  addResults(lexicalResults, "lexicalRank");

  const results = [...fused.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  console.log("\n========== RRF RESULTS ==========");
  results.forEach((result, index) => {
    console.log({
      rank: index + 1,
      filePath: result.metadata.filePath,
      name: result.metadata.name,
      lines: `${result.metadata.startLine}-${result.metadata.endLine}`,
      rrfScore: result.score.toFixed(4),
      semanticRank: result.semanticRank,
      lexicalRank: result.lexicalRank,
    });
  });
  console.log("=================================\n");

  return { results };
};
