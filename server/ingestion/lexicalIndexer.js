import axios from "axios";

const LEXICAL_SEARCH_URL =
  process.env.LEXICAL_SEARCH_URL || "http://127.0.0.1:8000";

export const indexLexicalChunks = async (sessionId, chunks) => {
  const response = await axios.post(
    `${LEXICAL_SEARCH_URL}/index`,
    {
      sessionId,
      documents: chunks,
    },
    {
      timeout: 120000,
    },
  );

  return response.data;
};
