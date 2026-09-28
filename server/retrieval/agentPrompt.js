export const evalPrompt = (
  chunks,query
) => `You are evaluating whether retrieved code chunks are sufficient to answer a user's question.

USER QUESTION:
${query}

RULES:
- Respond with ONLY the single word YES or NO
- Do NOT explain your reasoning
- Do NOT answer the user's question
- Your entire response must be exactly "YES" or exactly "NO"

Retrieved chunks:
${chunks.map((c) => `File: ${c.metadata.filePath}\nLines: ${c.metadata.startLine}-${c.metadata.endLine}\n${c.metadata.text}`).join("\n\n---\n\n")}`;

export const reformulatePrompt = (
  query,
  chunks,
) => `You are a search query reformulation assistant for a codebase.

The user's original question is:
${query}

The retrieved code chunks were not sufficient.

Create ONE better search query that is more likely to retrieve the missing code.

Rules:
- Return ONLY the new search query
- Do not answer the question
- Do not explain your reasoning
- Preserve important function names, class names, variables, filenames, APIs, or technical terms
- Make the query specific to the codebase

Retrieved chunks:
${chunks
  .map(
    (c) => `File: ${c.metadata.filePath}
Lines: ${c.metadata.startLine}-${c.metadata.endLine}
${c.metadata.text}`,
  )
  .join("\n\n---\n\n")}`;
