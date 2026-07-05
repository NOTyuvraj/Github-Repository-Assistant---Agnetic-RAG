# GitHub Repository Assistant — Agentic RAG

An AI assistant that ingests any GitHub repository and answers questions about the codebase with exact file and line citations.

**Live:** https://github-repository-assistant-agnetic.vercel.app/

---

## What it does

Paste a GitHub URL → the system ingests the entire codebase → ask questions in plain English → get answers citing the exact file and line (e.g. `server/tools/scraper.js:4-18`).

No hallucinations about your code. Every claim is grounded in actual retrieved chunks.

---

## How it works

### Ingestion Pipeline

1. **Clone** — clones the repo to a temp directory using `simple-git`
2. **Filter** — recursively walks the file tree, skipping `node_modules`, `.git`, lock files, and binary files
3. **Chunk** — splits files by semantic unit, not token count:
   - `.js` / `.ts` — Babel AST parser extracts individual functions and arrow functions with their exact line ranges
   - `.md` — split by headings (`##`)
   - `.json` — split by top-level keys
4. **Embed** — sends chunk text to Voyage AI (`voyage-code-2`, a code-specific embedding model)
5. **Store** — vectors + metadata (filePath, startLine, endLine, name, text) stored in Pinecone under a unique session namespace

### Retrieval & Generation (Agentic Loop)

1. User asks a question
2. Question is embedded with `voyage-code-2`
3. Pinecone returns top-5 most semantically similar chunks
4. LLM (Llama-3.3-70b via Groq) evaluates: "is this enough context to answer?" → YES or NO
5. If NO → LLM reformulates a better search query → retrieves again (max 3 iterations)
6. Once sufficient context is found → generates a final answer with file:line citations

### Multi-User Isolation

Each ingestion generates a unique `sessionId` (UUID). Vectors are stored in a Pinecone namespace scoped to that session. Users don't share or overwrite each other's data.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express.js |
| Frontend | React, Vite, Tailwind CSS |
| Embeddings | Voyage AI — `voyage-code-2` |
| Vector DB | Pinecone (serverless) |
| LLM | Groq SDK — Llama-3.3-70b |
| AST Parsing | `@babel/parser` |
| Repo Cloning | `simple-git` |
| Deployment | Render (backend), Vercel (frontend) |

---

## Project Structure

```
server/
├── index.js                  # Express routes
├── ingestion/
│   ├── cloner.js             # Git clone to temp dir
│   ├── filter.js             # Recursive file walker
│   ├── chunker.js            # Routes to correct chunker
│   ├── embedder.js           # Voyage AI + Pinecone upsert
│   ├── ingestion.orchestrator.js
│   └── subChunker/
│       ├── jsChunker.js      # Babel AST function extraction
│       ├── mdChunker.js      # Heading-based markdown chunking
│       └── jsonChunker.js    # Top-level key chunking
└── retrieval/
    ├── retriever.js          # Embed query + Pinecone search
    ├── agent.js              # Agentic retrieval loop
    ├── agentPrompt.js        # Eval prompt (YES/NO)
    └── resultPrompt.js       # Final answer prompt

client/
└── src/
    └── App.jsx               # Ingest + chat UI
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Pinecone account (free tier works)
- Voyage AI account
- Groq API key

### Backend

```bash
cd server
npm install
```

Create `.env`:
```
GROQ_API_KEY=your_key
VOYAGE_API_KEY=your_key
PINECONE_API_KEY=your_key
PINECONE_INDEX=your_index_name
PINECONE_HOST=your_pinecone_host_url
```

```bash
node index.js
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Update the API base URL in `App.jsx` to `http://localhost:1010` for local development.

---

## Known Limitations

- Re-ingestion required if the repo is updated — no automatic sync
- JS chunker handles exported functions and function declarations; some edge cases (class methods, default exports) may be skipped
- Only `.js`, `.ts`, `.md`, and `.json` files are ingested. Other types (`.py`, `.go`, `.tsx`, `.css`, etc.) are skipped — answers about those files won't be available
- Pinecone free tier has vector limits — large repos may hit the ceiling

---

## What I learned building this

Fixed-size token chunking breaks code context. A function split across two chunks loses its signature in one and its return value in the other — the LLM can't reason about either half correctly. AST-based chunking was the only real solution, and it required understanding how Babel represents the JS syntax tree.

The agentic loop also matters more than it seems. A single retrieval pass often misses context that a reformulated query catches on the second attempt.