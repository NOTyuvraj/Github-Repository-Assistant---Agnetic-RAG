export const answerPrompt = (query, chunks) => `You are a code analysis assistant. Answer the user's question using ONLY the provided code chunks.

Rules:
1. Answer only using information from the provided chunks — never use outside knowledge
2. Cite every claim with the format: filename:startLine-endLine
3. If the chunks don't contain enough information to fully answer, say so explicitly instead of guessing

Question: ${query}

Retrieved chunks:
${chunks.map(c => `File: ${c.metadata.filePath}\nLines: ${c.metadata.startLine}-${c.metadata.endLine}\n${c.metadata.text}`).join('\n\n---\n\n')}`;