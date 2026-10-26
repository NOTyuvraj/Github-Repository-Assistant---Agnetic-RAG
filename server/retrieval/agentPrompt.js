export const evalPrompt = (chunks, query) => `
You are a strict evidence sufficiency evaluator for a code repository RAG system.

USER QUESTION:
${query}

RETRIEVED CODE CHUNKS:
${chunks
  .map(
    (c) => `File: ${c.metadata.filePath}
Lines: ${c.metadata.startLine}-${c.metadata.endLine}
Code:
${c.metadata.text}`,
  )
  .join("\n\n---\n\n")}

TASK:
Determine whether the retrieved chunks contain enough direct evidence
to answer the user's question accurately.

EVALUATION PROCEDURE:
1. Identify the specific facts or code behavior required to answer the question.
2. Check each required fact against the retrieved chunks.
3. Treat a fact as supported when the relevant code or explicit evidence
   is present in the chunks. Do not require the same information to be
   repeated in multiple chunks.
4. Do not mark evidence as missing merely because the chunks do not
   contain a complete source file. Relevant functions or code sections
   can be sufficient.
5. Mark the result sufficient only when the retrieved evidence supports
   the complete answer without guessing.
6. If evidence is missing, identify only the missing facts and generate
   ONE targeted search query to retrieve them.
7. Do not request code that is already present in the retrieved chunks.
8. Do not use outside knowledge or invent repository behavior.

OUTPUT RULES:
- Return ONLY valid JSON.
- Do not answer the user's question.
- "sufficient" must be a boolean.
- If sufficient is true, "missing" and "searchQuery" must be empty strings.
- If sufficient is false, both "missing" and "searchQuery" must be non-empty strings.

Return exactly this structure:

{
  "sufficient": true,
  "missing": "",
  "searchQuery": ""
}

OR:

{
  "sufficient": false,
  "missing": "Describe only the evidence that is missing",
  "searchQuery": "One targeted repository search query"
}


When requesting missing evidence, do not assume which file should contain
the implementation. Search for the exact symbol or operation mentioned
in the missing evidence.

For Express response-prototype questions, look for:
- var res = require('./response')
- app.response = Object.create(res, ...)

These statements are in lib/express.js, not lib/application.js.
Do not request evidence that is already present in the retrieved chunks.

`;

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
    (c) => `File: ${c.filePath}
Name: ${c.name}
Lines: ${c.startLine}-${c.endLine}`,
  )
  .join("\n\n---\n\n")}`;
