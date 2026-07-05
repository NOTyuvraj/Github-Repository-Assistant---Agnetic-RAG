// import dotenv from "dotenv/config"
// import { agent } from "./retrieval/agent.js";
// import {ingestionOrchestrator} from "./ingestion/ingestion.orchestrator.js";
// const repoUrl = 'https://github.com/NOTyuvraj/research-agent';
// await ingestionOrchestrator(repoUrl);
// const query = "how does scrapeUrl works ?"
// console.log(await agent(query));

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
  const { repoURL } = req.body;
  if (!repoURL) return res.status(400).json({ error: "url is required" });

  try {
    await ingestionOrchestrator(repoURL);
    return res.json({ success: true });
  } catch (err) {
    console.error("Orchestrator error: ", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/ask", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });

  try {
    res.send(await agent(query));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
