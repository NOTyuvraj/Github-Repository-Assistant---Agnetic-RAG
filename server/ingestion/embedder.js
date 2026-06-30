import { Pinecone } from "@pinecone-database/pinecone";
import { VoyageAIClient } from "voyageai";

export const embedder = async (chunks) => {
  try {
    const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

    const result = await client.embed({
      input: chunks.map((chunk) => chunk.text),
      model: "voyage-code-2",
    });
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index = pc.index({host:process.env.PINECONE_HOST});

    const upsertArr = [];
    for (let i = 0; i < chunks.length; i++) {
      upsertArr.push({
        id: `chunk-${i}-${Date.now()}`,
        values: result.data[i].embedding,
        metadata: {
          filePath: chunks[i].filePath,
          name: chunks[i].name,
          startLine: chunks[i].startLine ?? -1,
          endLine: chunks[i].endLine ?? -1,
          text: chunks[i].text,
        },
      });
    }
    await index.upsert({records:upsertArr});
  } catch (err) {
    throw err;
  }
};
