import dotenv from "dotenv/config"
// const url = "https://github.com/username/my-project".split('/');
// console.log(url);

// import { filter } from "./ingestion/filter.js";
// const path = `D:/Python/Github Repository Asistant - Agentic RAG/server`;
// console.log(await filter(path));


// import { chunker } from "./ingestion/chunker.js";
// const filePath = 'D:/Python/Github Repository Asistant - Agentic RAG/server/package.json';
// // console.log(chunker(filePath));
// console.log(await chunker(filePath));


// import {ingestionOrchestrator} from "./ingestion/ingestion.orchestrator.js";
// const repoUrl = 'https://github.com/NOTyuvraj/research-agent';
// console.log( await ingestionOrchestrator(repoUrl));

// import { retriever } from "./retrieval/retriever.js";
// const ques = "how does the scrapeURL function work?";
// await retriever(ques);

import { agent } from "./retrieval/agent.js";
console.log(await agent("how does scrapeURL work?"));