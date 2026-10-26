// import { Pinecone } from "@pinecone-database/pinecone";
// import { VoyageAIClient } from "voyageai";
// import { createHash } from "node:crypto";

// export const embedder = async (chunks, sessionId) => {
//   try {
//     if (chunks.length === 0) return;
//     const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
//     const result = await client.embed({
//       input: chunks.map((chunk) => chunk.text),
//       model: "voyage-code-2",
//     });
//     const pc = new Pinecone({
//       apiKey: process.env.PINECONE_API_KEY,
//     });

//     const index = pc.index(process.env.PINECONE_INDEX);

//     const upsertArr = [];
//     for (let i = 0; i < chunks.length; i++) {
//       upsertArr.push({
//         id: createHash("sha256")
//           .update(
//             `${chunks[i].filePath}:${chunks[i].name ?? ""}:${
//               chunks[i].startLine ?? -1
//             }:${chunks[i].endLine ?? -1}:${chunks[i].text}`,
//           )
//           .digest("hex"),
//         values: result.data[i].embedding,
//         metadata: {
//           filePath: chunks[i].filePath,
//           name: chunks[i].name,
//           startLine: chunks[i].startLine ?? -1,
//           endLine: chunks[i].endLine ?? -1,
//           text: chunks[i].text,
//         },
//       });
//     }
//     const namespacedIndex = index.namespace(sessionId);
//     await namespacedIndex.upsert({ records: upsertArr });
//   } catch (err) {
//     throw err;
//   }
// };

import { Pinecone } from "@pinecone-database/pinecone";
import { VoyageAIClient } from "voyageai";
import { createHash } from "node:crypto";

export const embedder = async (chunks, sessionId) => {
  try {
    if (chunks.length === 0) return;

    const client = new VoyageAIClient({
      apiKey: process.env.VOYAGE_API_KEY,
    });

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index = pc.index(process.env.PINECONE_INDEX);
    const namespacedIndex = index.namespace(sessionId);

    const BATCH_SIZE = 50;

    for (let start = 0; start < chunks.length; start += BATCH_SIZE) {
      const batch = chunks.slice(start, start + BATCH_SIZE);

      console.log(
        `Embedding chunks ${start + 1}-${start + batch.length} of ${chunks.length}`,
      );

      const result = await client.embed({
        input: batch.map((chunk) => chunk.text),
        model: "voyage-code-2",
      });

      const upsertArr = batch.map((chunk, i) => ({
        id: createHash("sha256")
          .update(
            `${chunk.filePath}:${chunk.name ?? ""}:${
              chunk.startLine ?? -1
            }:${chunk.endLine ?? -1}:${chunk.text}`,
          )
          .digest("hex"),

        values: result.data[i].embedding,

        metadata: {
          filePath: chunk.filePath,
          name: chunk.name,
          startLine: chunk.startLine ?? -1,
          endLine: chunk.endLine ?? -1,
          text: chunk.text,
        },
      }));

      await namespacedIndex.upsert({
        records: upsertArr,
      });
    }
  } catch (err) {
    throw err;
  }
};
