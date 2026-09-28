import { useState } from "react";
import axios from "axios";

export default function App() {
  const [repoURL, setRepoURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const handleIngest = async () => {
    if (!repoURL.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      const response = await axios.post(
        "https://github-repository-assistant-agnetic-rag.onrender.com/ingest",
        // "http://localhost:1010/ingest",
        {
          repoURL,
          branch:"main"
        },
      );

      if (response.data.success) setSuccess(true);
      setSessionId(response.data.sessionId);
    } catch (err) {
      setError(`Error: ${err.response?.data?.error ?? err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      setError("Please enter a question.");
      return;
    }

    setError("");
    setAskLoading(true);

    try {
      const response = await axios.post(
        "https://github-repository-assistant-agnetic-rag.onrender.com/ask",
        // "http://localhost:1010/ask",
        {
          query,
          sessionId,
        },
      );

      setAnswer(response.data);
    } catch (err) {
      setError(`Error: ${err.response?.data?.error ?? err.message}`);
    } finally {
      setAskLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">
            GitHub Repository Assistant
          </h1>

          <p className="text-zinc-500 text-lg">
            Ingest any GitHub repository and chat with its codebase.
          </p>
        </div>

        {/* Repository Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition">
          <h2 className="text-2xl font-semibold mb-6">Repository</h2>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Paste GitHub repository URL..."
              value={repoURL}
              onChange={(e) => setRepoURL(e.target.value)}
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-5 py-3 placeholder:text-zinc-600 outline-none focus:border-white transition"
            />

            <button
              onClick={handleIngest}
              className="bg-white text-black font-semibold rounded-xl px-7 py-3 hover:bg-zinc-200 active:scale-95 transition"
            >
              Ingest
            </button>
          </div>

          {loading && (
            <p className="mt-5 text-zinc-400">Indexing repository...</p>
          )}

          {success && (
            <p className="mt-5 text-green-400">
              ✓ Repository indexed successfully.
            </p>
          )}
        </div>

        {/* Chat Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition">
          <h2 className="text-2xl font-semibold mb-6">Ask Questions</h2>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Ask anything about the repository..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-5 py-3 placeholder:text-zinc-600 outline-none focus:border-white transition"
            />

            <button
              onClick={handleQuery}
              className="bg-white text-black font-semibold rounded-xl px-7 py-3 hover:bg-zinc-200 active:scale-95 transition"
            >
              Ask
            </button>
          </div>

          {askLoading && <p className="mt-6 text-zinc-400">Thinking...</p>}

          {answer && (
            <div className="mt-8 border border-zinc-800 rounded-xl bg-black p-6 ">
              <div className="text-sm uppercase tracking-widest text-zinc-500 mb-4">
                Answer
              </div>

              <p className="whitespace-pre-wrap leading-8 text-zinc-200">
                {answer}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950/30 p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
