import re

from fastapi import FastAPI
from rank_bm25 import BM25Okapi

app = FastAPI()

indexes = {}


def token_code(text):
    text = text.lower()
    tokens = []

    dotted = re.findall(
        r"[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)+", text
    )

    tokens.extend(dotted)

    identifiers = re.findall(r"[a-zA-Z_$][a-zA-z0-9_$]*", text)

    tokens.extend(identifiers)

    return tokens


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/index")
def create_index(data: dict):
    session_id = data["sessionId"]
    docs = data["documents"]

    if not docs:
        indexes.pop(session_id, None)
        return {"status": "indexed", "sessionId": session_id, "documents": 0}

    tokenized_docs = [token_code(doc["text"]) for doc in docs]

    bm25 = BM25Okapi(tokenized_docs)

    indexes[session_id] = {"bm25": bm25, "documents": docs}

    return {"status": "indexed", "sessionId": session_id, "documents": len(docs)}


@app.post("/search")
def search(data: dict):
    query = data["query"]
    top_k = data.get("topK", 5)

    session_id = data["sessionId"]
    index = indexes.get(session_id)

    if index is None:
        return {"status": "error", "message": "no index found"}

    bm25 = index["bm25"]
    docs = index["documents"]

    tokenized_query = token_code(query)

    scores = bm25.get_scores(tokenized_query)

    ranked_results = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)

    results = []

    for docuement, score in ranked_results[:top_k]:
        results.append({**docuement, "score": float(score)})

    print("QUERY TOKENS:", tokenized_query)

    return {"query": query, "results": results}
