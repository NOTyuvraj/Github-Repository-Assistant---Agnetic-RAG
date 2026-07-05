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
      const response = await axios.post("http://localhost:1010/ingest", {
        repoURL,
      });
      if (response.data.success) setSuccess(true);
    } catch (err) {
      setError(`Error : ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async() => {
    if(!query.trim()) {
      setError("Enter Question to ask ?")
      return;
    }

    setError("");
    setAskLoading(true);

    try{
      const response = await axios.post("http://localhost:1010/ask", {query});
      setAnswer(response.data);
    }catch(err){
      setError(`Error : ${err}`)
    }finally{
      setAskLoading(false);
    }
  }

  return (
    <div>
      <div className="ingest">
        <h1>Github Repository Assistant</h1>

        <input value={repoURL} onChange={(e) => setRepoURL(e.target.value)} />
        <button onClick={handleIngest}>Ingest Repository</button>

        {loading && <p>Ingesting Repository...</p>}
        {success && <p>Repository indexed successfully</p>}
        {error && <p>{error}</p>}
      </div>

      <div className="chat">
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
        <button onClick={handleQuery}>Ask ?</button>
        {askLoading && <p>Generating Answers...</p>}
        {answer && <p>{answer}</p>}
        {error && <p>{error}</p>}
      </div>
    </div>
  );
}
