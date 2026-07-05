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
        { repoURL },
      );

      if (response.data.success) setSuccess(true);
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      setError("Enter a question.");
      return;
    }

    setError("");
    setAskLoading(true);

    try {
      const response = await axios.post(
        "https://github-repository-assistant-agnetic-rag.onrender.com/ask",
        { query },
      );

      setAnswer(response.data);
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setAskLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            GitHub Repository Assistant
          </h1>

          <p className="text-slate-400 mt-3">
            Ingest any GitHub repository and ask questions about its codebase.
          </p>
        </div>

        {/* Ingest Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6">Repository Ingestion</h2>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              value={repoURL}
              onChange={(e) => setRepoURL(e.target.value)}
              placeholder="https://github.com/user/repository"
              className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-violet-500 transition"
            />

            <button
              onClick={handleIngest}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition font-medium"
            >
              Ingest Repository
            </button>
          </div>

          {loading && (
            <p className="mt-5 text-violet-400">⏳ Ingesting repository...</p>
          )}

          {success && (
            <p className="mt-5 text-green-400">
              ✓ Repository indexed successfully
            </p>
          )}

          {error && <p className="mt-5 text-red-400">{error}</p>}
        </div>

        {/* Chat Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6">Ask Questions</h2>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="How does authentication work?"
              className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-violet-500 transition"
            />

            <button
              onClick={handleQuery}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition font-medium"
            >
              Ask
            </button>
          </div>

          {askLoading && <p className="mt-5 text-violet-400">🤖 Thinking...</p>}

          {answer && (
            <div className="mt-6 rounded-xl bg-slate-950 border border-slate-800 p-5">
              <h3 className="text-lg font-semibold mb-3 text-violet-400">
                Answer
              </h3>

              <p className="text-slate-300 whitespace-pre-wrap leading-7">
                {answer}
              </p>
            </div>
          )}

          {error && <p className="mt-5 text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
