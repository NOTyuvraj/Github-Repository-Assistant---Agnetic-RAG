import { Pinecone } from "@pinecone-database/pinecone";
import { VoyageAIClient } from "voyageai";

export const retriever = async (query, sessionId) => {
  try {
    const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
    const result = await client.embed({
      input: query,
      model: "voyage-code-2",
    });
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index = pc.index(process.env.PINECONE_INDEX);

    const queryResponse = await index.namespace(sessionId).query({
      vector: result.data[0].embedding,
      topK: 5,
      includeMetadata: true,
    });

    console.log("\n================ RETRIEVAL ================");
    console.log("Query:", query);

    queryResponse.matches.forEach((match, i) => {
      console.log(`\n#${i + 1}`);
      console.log("Score:", match.score);
      console.log("File:", match.metadata?.filePath);
      console.log("Name:", match.metadata?.name);
      console.log(
        "Lines:",
        `${match.metadata?.startLine}-${match.metadata?.endLine}`,
      );
      console.log("Text:", match.metadata?.text?.slice(0, 300));
    });

    console.log("============================================\n");

    return queryResponse.matches;
  } catch (err) {
    throw err;
  }
};
