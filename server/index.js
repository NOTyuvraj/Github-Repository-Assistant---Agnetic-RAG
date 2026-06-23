// const url = "https://github.com/username/my-project".split('/');
// console.log(url);

// import { filter } from "./ingestion/filter.js";
// const path = `D:/Python/Github Repository Asistant - Agentic RAG/server`;
// console.log(await filter(path));


import { chunker } from "./ingestion/chunker.js";
const filePath = 'D:\\Python\\Github Repository Asistant - Agentic RAG\\server\\ingestion\\filter.js';
// console.log(chunker(filePath));
console.log(await chunker(filePath));