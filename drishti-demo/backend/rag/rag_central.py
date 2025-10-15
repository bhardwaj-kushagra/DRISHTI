"""Central RAG microservice

Features:
- Load documents from ../data/
- Chunk documents into overlapping chunks
- Simple TF-based retrieval to find top chunks for a query
- /query endpoint: accepts JSON {query, top_k, use_gemini}
- Calls a Gemini-like Generative HTTP wrapper (configurable via env)
- Performs a safety filter on query and generated answer

Environment variables:
- GEMINI_API_URL : URL of the generative HTTP wrapper (POST)
- GEMINI_API_KEY : API key for authorization (optional)

This file is intentionally dependency-light (only uses requests, flask, nltk,
and numpy which are listed in requirements). It implements a lightweight
retriever rather than embeddings/FAISS so it works without heavy deps.
"""

from __future__ import annotations
import google.generativeai as genai
import os
import json
import math
import re
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()
from typing import List, Dict, Tuple, Any

from flask import Flask, request, jsonify, make_response, Response
import requests
import numpy as np
import nltk
from flask import Flask, request, jsonify
from flask_cors import CORS  # <--- import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# CORS(app)  
# nltk.download('punkt_tab')
nltk.download('punkt')

# Simple CORS support for browser requests (adds Access-Control-Allow-* headers
# and handles preflight OPTIONS requests). We prefer using Flask-CORS but this
# avoids an extra dependency.
# @app.after_request
# def _add_cors_headers(response: Response):
 
#     return response


@app.route('/query', methods=['OPTIONS'])
def _query_options():
    # Respond to preflight requests for /query
    resp = make_response('', 204)
    resp.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin') or '*'
    resp.headers['Access-Control-Allow-Methods'] = 'POST,OPTIONS'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    resp.headers['Access-Control-Allow-Credentials'] = 'true'
    return resp

try:
    import nltk
    nltk.data.find("tokenizers/punkt")
except Exception:
    # attempt to download punkt when missing
    try:
        import nltk

        nltk.download("punkt_tab")
    except Exception:
        pass

from nltk.tokenize import sent_tokenize


DATA_DIR = Path(__file__).resolve().parents[1] / "data"

# chunking params
CHUNK_WORDS = int(os.environ.get("RAG_CHUNK_WORDS", "200"))
CHUNK_OVERLAP = int(os.environ.get("RAG_CHUNK_OVERLAP", "40"))

# Gemini / generative wrapper config
# GEMINI_API_URL = os.environ.get("GEMINI_API_URL", "https://generativelanguage.googleapis.com/v1/models")
GEMINI_API_URL = os.environ.get(
    "GEMINI_API_URL",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
)
# Do not default to a literal 'process.env...' string; use empty string when not provided
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

# Simple safety patterns (expand as needed)
DEFAULT_BLOCKED_PATTERNS = [
    r"\b(malware|virus|ddos|exploit|exploit-kit|ransomware)\b",
    r"\b(kill|assassin|attack|terrorist)\b",
    r"\b(passwords?|private key|secret)\b",
]


def extract_text_from_json(obj: Any) -> str:
    """Recursively extract text/plain from JSON values."""
    if obj is None:
        return ""
    if isinstance(obj, str):
        return obj
    if isinstance(obj, (int, float, bool)):
        return str(obj)
    if isinstance(obj, list):
        return "\n".join(extract_text_from_json(x) for x in obj)
    if isinstance(obj, dict):
        return "\n".join(extract_text_from_json(v) for v in obj.values())
    return ""


def load_documents(data_dir: Path) -> List[Dict[str, Any]]:
    """Load all files in data_dir and return list of documents with metadata.

    Each document is a dict {id, source, text}.
    """
    docs = []
    for p in sorted(data_dir.iterdir()):
        if p.is_dir():
            continue
        try:
            if p.suffix.lower() in {".json"}:
                with p.open("r", encoding="utf-8") as fh:
                    data = json.load(fh)
                text = extract_text_from_json(data)
                doc_url = data.get("doc_url") or data.get("url") or ""
                cvss = data.get("doc_cvss") or data.get("cvss") or None
            else:
                # treat as plain text or xml
                with p.open("r", encoding="utf-8", errors="ignore") as fh:
                    text = fh.read()
        except Exception as e:
            print(f"Failed to load {p}: {e}")
            continue

        if not text or not text.strip():
            continue

        docs.append({"id": str(p.name), "source": str(p), "text": text, "doc_url": data.get("doc_url") or data.get("url") or "",
        "cvss": data.get("cvss"),})
    return docs


def chunk_text(text: str, chunk_words: int = CHUNK_WORDS, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Chunk text into overlapping word chunks.

    We try to respect sentence boundaries by using nltk.sent_tokenize, then
    assemble sentences until chunk size reached.
    """
    sents = sent_tokenize(text)
    chunks: List[str] = []
    cur_words: List[str] = []
    cur_count = 0

    def flush():
        nonlocal cur_words, cur_count
        if cur_words:
            chunks.append(" ".join(cur_words).strip())
            cur_words = []
            cur_count = 0

    for sent in sents:
        words = sent.split()
        if cur_count + len(words) <= chunk_words:
            cur_words.extend(words)
            cur_count += len(words)
        else:
            # flush
            flush()
            # start new chunk with this sentence
            cur_words = words.copy()
            cur_count = len(words)

    flush()

    # add overlap by merging windows
    if overlap <= 0:
        return chunks

    merged: List[str] = []
    for i, chunk in enumerate(chunks):
        # take last `overlap` words from previous chunk if available
        merged.append(chunk)
    # If chunks are large and we want overlap at word level, create overlapping windows
    if len(chunks) > 1 and overlap > 0:
        overlapped: List[str] = []
        for i in range(len(chunks)):
            words = chunks[i].split()
            # prepend overlap from previous chunk
            if i > 0:
                prev_words = chunks[i - 1].split()
                ov = prev_words[-overlap:] if len(prev_words) >= overlap else prev_words
                words = ov + words
            overlapped.append(" ".join(words))
        return overlapped

    return merged


def build_corpus_chunks(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return list of chunk dicts: {id, source, text, doc_id}.
    """
    chunks = []
    for doc in docs:
        doc_id = doc["id"]
        text = doc["text"]
        doc_url = doc.get("doc_url") or doc.get("url") or ""
        cvss =  doc["cvss"]
        cks = chunk_text(text)
        for i, c in enumerate(cks):
            chunks.append({"id": f"{doc_id}__{i}", "doc_id": doc_id, "source": doc["source"], "text": c, "doc_url": doc_url,
            "cvss": cvss,})
    return chunks


def tokenize_simple(text: str) -> List[str]:
    # lowercase, split on non-word
    toks = re.findall(r"\w+", text.lower())
    return toks


def vectorize_tf(docs_tokens: List[List[str]], query_tokens: List[str]) -> Tuple[np.ndarray, np.ndarray]:
    """Build simple TF vectors for docs and query using combined vocab.

    Returns (doc_matrix, query_vector)
    """
    vocab = {}
    idx = 0
    for toks in docs_tokens:
        for t in toks:
            if t not in vocab:
                vocab[t] = idx
                idx += 1
    for t in query_tokens:
        if t not in vocab:
            vocab[t] = idx
            idx += 1

    D = len(docs_tokens)
    V = len(vocab)
    doc_mat = np.zeros((D, V), dtype=float)
    for i, toks in enumerate(docs_tokens):
        for t in toks:
            doc_mat[i, vocab[t]] += 1.0
        # L2 normalize
        norm = np.linalg.norm(doc_mat[i])
        if norm > 0:
            doc_mat[i] /= norm

    q = np.zeros((V,), dtype=float)
    for t in query_tokens:
        q[vocab[t]] += 1.0
    qnorm = np.linalg.norm(q)
    if qnorm > 0:
        q /= qnorm

    return doc_mat, q


def retrieve_top_k(chunks: List[Dict[str, Any]], query: str, k: int = 3) -> List[Tuple[Dict[str, Any], float]]:
    toks = [tokenize_simple(c["text"]) for c in chunks]
    q_toks = tokenize_simple(query)
    if not any(toks) or not q_toks:
        return [(c, 0.0) for c in chunks[:k]]

    doc_mat, qv = vectorize_tf(toks, q_toks)
    # compute cosine similarity
    sims = doc_mat.dot(qv)
    idxs = np.argsort(-sims)[:k]
    results = []
    for i in idxs:
        results.append((chunks[int(i)], float(sims[int(i)])))
    return results


def call_gemini(prompt: str, model: str = GEMINI_MODEL, api_url: str = GEMINI_API_URL, api_key: str = GEMINI_API_KEY) -> Tuple[bool, str, dict]:
    """Call an external generative HTTP wrapper for Gemini-like model.

    Returns (success, text, raw_response_dict)
    """
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    try:
        resp = requests.post(api_url, headers=headers, json=payload, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        # Try common shapes: {"text": ".."} or {"output": {"text": ".."}} or {"choices":[{"text":..}]}
        text = ""
        if isinstance(data, dict):
            if "text" in data and isinstance(data["text"], str):
                text = data["text"]
            elif "output" in data and isinstance(data["output"], dict) and "text" in data["output"]:
                text = data["output"]["text"]
            elif "choices" in data and isinstance(data["choices"], list) and data["choices"]:
                ch = data["choices"][0]
                if isinstance(ch, dict) and "text" in ch:
                    text = ch["text"]
        if not text and isinstance(data, str):
            text = data

        # fallback to full resp text
        if not text:
            text = resp.text

        return True, text, data
    except Exception as e:
        return False, f"Error calling generative API: {e}", {"error": str(e)}


def local_summarize(top_chunks: List[Dict[str, Any]], max_chars: int = 600) -> str:
    """Create a simple extractive summary from top chunks when generative API is unavailable.

    This concatenates the top chunk texts and returns the first max_chars characters.
    """
    if not top_chunks:
        return "No relevant top chunk found."
    combined = "\n\n".join(tc.get("text", "") for tc in top_chunks)
    if not combined:
        return "No relevant context found."
    # simple trim to sentence boundary if possible
    s = combined.strip()
    if len(s) <= max_chars:
        return s
    # try to cut at last sentence end before max_chars
    cut = s.rfind(".", 0, max_chars)
    if cut != -1 and cut > max_chars // 2:
        return s[: cut + 1]
    return s[:max_chars] + "..."


def safety_check(text: str, extra_patterns: List[str] | None = None) -> Tuple[bool, List[str]]:
    """Return (is_safe, matches) where matches are the regex patterns matched."""
    patterns = DEFAULT_BLOCKED_PATTERNS.copy()
    if extra_patterns:
        patterns.extend(extra_patterns)
    matches = []
    for pat in patterns:
        if re.search(pat, text, flags=re.IGNORECASE):
            matches.append(pat)
    return (len(matches) == 0, matches)


# app = Flask(__name__)

# load corpus at startup
DOCS = load_documents(DATA_DIR) if DATA_DIR.exists() else []


def load_indexed_chunks(data_dir: Path) -> List[Dict[str, Any]]:
    """Load precomputed chunk metadata (if present) and return as chunks list.

    This file is useful when you already built an index (e.g. vulnerability_index_metadata.json)
    that contains per-chunk doc_url, doc_cvss, doc_title, publishedDate, etc.
    """
    idx_file = data_dir / "vulnerability_index_metadata.json"
    if not idx_file.exists():
        return []
    try:
        with idx_file.open("r", encoding="utf-8") as fh:
            arr = json.load(fh)
        chunks = []
        for item in arr:
            chunks.append({
                "id": item.get("id"),
                "doc_id": item.get("doc_id"),
                "source": item.get("doc_source") or str(idx_file),
                "text": item.get("text", ""),
                "doc_url": item.get("doc_url") or item.get("url") or "",
                "doc_cvss": item.get("doc_cvss") or item.get("doc_cvss") or None,
                "doc_title": item.get("doc_title") or None,
                "publishedDate": item.get("publishedDate") or None,
                "doc_source": item.get("doc_source") or None,
            })
        return chunks
    except Exception as e:
        print(f"Failed to load index file {idx_file}: {e}")
        return []


PRECOMPUTED_CHUNKS = load_indexed_chunks(DATA_DIR) if DATA_DIR.exists() else []
if PRECOMPUTED_CHUNKS:
    CHUNKS = PRECOMPUTED_CHUNKS
else:
    CHUNKS = build_corpus_chunks(DOCS) if DOCS else []


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "docs": len(DOCS), "chunks": len(CHUNKS)})


@app.route("/query", methods=["POST"])
def query():
    payload = request.get_json(force=True)
    query_text = payload.get("query") if isinstance(payload, dict) else None
    if not query_text:
        return jsonify({"error": "missing 'query' in JSON body"}), 400

    top_k = int(payload.get("top_k", 3))
    use_gemini = bool(payload.get("use_gemini", False))
    print("Received query:", query_text)
    print("Use Gemini:", use_gemini)
    # safety check on query
    ok_q, q_matches = safety_check(query_text)
    if not ok_q:
        return jsonify({"error": "query blocked by safety filter", "matches": q_matches}), 400

    top = retrieve_top_k(CHUNKS, query_text, k=top_k)
    # top_chunks = [
    #     {"id": c["id"], "source": c["source"], "text": c["text"], "score": score,  "cvss": c["cvss"], "url": 
    #      c.get("doc_url"),}
    #     for c, score in top
    # ]
    top_chunks = [
    {
        "id": c.get("id"),
        "source": c.get("source"),
        "text": c.get("text"),
        "score": score,
        "cvss": c.get("cvss") or c.get("doc_cvss"),
        "url": c.get("url") or c.get("doc_url"),
        "title": c.get("title") or c.get("doc_title"),
        "publishedDate": c.get("publishedDate")
    }
    for c, score in top                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
]


    answer = None
    gemini_ok = False
    gemini_raw = None
    safety_matches_after = []

    if use_gemini:
        context = "\n\n---\nContext chunks:\n"
        for tc in top_chunks:
            context += f"[{tc['source']}] {tc['text']}\n\n"

        prompt = f"You are an assistant. Use the following context to answer the user's question.\nQuestion: {query_text}\n\n{context}\nAnswer concisely and cite sources in brackets."

        # If API key is missing and GEMINI_API_URL is the default, prefer a local fallback
        if not GEMINI_API_KEY and GEMINI_API_URL.startswith("https://generativelanguage.googleapis.com/v1/models"):
            gemini_ok = False
            gemini_raw = {"error": "no_api_key"}
            answer = local_summarize(top_chunks)
        else:
            gemini_ok, answer, gemini_raw = call_gemini(prompt)
            if not gemini_ok:
                # fallback to local summarizer to avoid exposing raw error to UI
                answer = local_summarize(top_chunks)

        if isinstance(answer, str):
            ok_ans, safety_matches_after = safety_check(answer)
            if not ok_ans:
                # redact answer
                answer = "[redacted due to safety policy]"
    else:
    # fallback for when Gemini is disabled
        answer = local_summarize(top_chunks)
    resp = {
        "query": query_text,
        "top_chunks": top_chunks,
        "use_gemini": use_gemini,
        "gemini_success": gemini_ok,
        "answer": answer,
        "safety_query_matches": q_matches,
        "safety_answer_matches": safety_matches_after,
    }
    print("Returning:", resp)
    return jsonify(resp)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run RAG central microservice")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", default=8000, type=int)
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    print(f"Loaded {len(DOCS)} docs and {len(CHUNKS)} chunks. Starting server...")
    app.run(host=args.host, port=args.port, debug=args.debug)
