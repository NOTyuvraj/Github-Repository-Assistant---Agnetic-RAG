import { Pinecone } from "@pinecone-database/pinecone";
import { log } from "node:console";
import { VoyageAIClient } from "voyageai";

export const retriever = async (query) => {
  try {
    const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
    const result = await client.embed({
      input: query,
      model: "voyage-code-2",
    });
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index = pc.index({ host: process.env.PINECONE_HOST });

    const queryResponse = await index.query({
        vector:result.data[0].embedding,
        topK:5,
        includeMetadata:true,
    })

    // console.log(queryResponse.matches);
    return queryResponse.matches;

  } catch (err) {
    throw err;
  }
};
