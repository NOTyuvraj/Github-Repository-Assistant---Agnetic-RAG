

import dotenv from "dotenv/config";

import express from "express";
import cors from "cors";
import { agent } from "./retrieval/agent.js";
import { ingestionOrchestrator } from "./ingestion/ingestion.orchestrator.js";

const PORT = process.env.PORT || 1010;

const app = express();
app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());

app.post("/ingest", async (req, res) => {
  const { repoURL, branch = "main" } = req.body;
  if (!repoURL) return res.status(400).json({ error: "url is required" });

  try {
    const result = await ingestionOrchestrator(repoURL, branch);
    return res.json({ success: true, ...result });
  } catch (err) {
  console.error("Orchestrator error:");
  console.error(err);
  return res.status(500).json({ error: err.message });
}
});

app.post("/refresh", async (req, res) => {
  const { repoURL, branch = "main" } = req.body;
  if (!repoURL) {
    return res.status(400).json({ error: "repoURL is required" });
  }

  try {
    const result = await ingestionOrchestrator(repoURL, branch);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("Refresh error: ", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/ask", async (req, res) => {
  const { query , sessionId} = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });

  try {
    res.send(await agent(query , sessionId));
  }  catch (err) {
  console.error("Ask error:", err);
  res.status(500).json({ error: err.message });
}
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// {
//     "success": true,
//     "sessionId": "repo-5a07825d4db611435d20109fc7f6a9a168e6b28d37caf6cb",
//     "branch": "master",
//     "commitSha": "f6423e0a226c22f0e671b160bef11d1952702b54",
//     "updated": false,
//     "chunksIndexed": 97
// }