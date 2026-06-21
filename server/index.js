// const url = "https://github.com/username/my-project".split('/');
// console.log(url);

import { filter } from "./ingestion/filter.js";

const path = `D:/Python/Github Repository Asistant - Agentic RAG/server`;

console.log(await filter(path));