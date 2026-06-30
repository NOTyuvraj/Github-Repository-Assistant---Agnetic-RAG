export const evalPrompt = (chunks) => `You are evaluating whether retrieved code chunks are sufficient to answer a user's question.

RULES:
- Respond with ONLY the single word YES or NO
- Do NOT explain your reasoning
- Do NOT answer the user's question
- Your entire response must be exactly "YES" or exactly "NO"

Retrieved chunks:
${chunks.map(c => `File: ${c.metadata.filePath}\nLines: ${c.metadata.startLine}-${c.metadata.endLine}\n${c.metadata.text}`).join('\n\n---\n\n')}`;