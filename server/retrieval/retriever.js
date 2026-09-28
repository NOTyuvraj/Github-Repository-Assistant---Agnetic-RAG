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
        vector:result.data[0].embedding,
        topK:5,
        includeMetadata:true,
    })

    return queryResponse.matches;

  } catch (err) {
    throw err;
  }
};
