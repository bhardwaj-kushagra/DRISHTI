# DRISHTI Demo (Data-driven Reporting & Intelligence System for Highlighting Tactical Insights)

A minimal, end-to-end local prototype showing how DRISHTI could orchestrate scans, parse results, provide RAG question-answering over loaded documents, and present findings.

## Tech Stack
- **Backend:** Node.js + Express (in-memory storage)
- **RAG Microservice:** Python + RAG (retrieval + generative QA)
- **Frontend:** HTML + Vanilla JS (single page)
- **Optional Parser:** xml2js to parse sample Nmap XML

## Features
- Start a simulated scan by providing a target and a required `consent_id`.
- Backend simulates scan time and parses sample Nmap XML to canonical findings.
- UI polls job status and renders results on completion.
- RAG microservice provides question answering over loaded documents.

## File Structure
```
drishti-demo/
  backend/
    server.js
    parse_nmap.js
    samples/
      nmap-sample.xml
      nuclei-sample.json
    package.json
    rag/
      rag_central.py
      requirements.txt
      data/
        ... # your JSON/text documents
  frontend/
    index.html
```

## Run Locally

### 1. Start Node.js Backend
```bash
cd "drishti-demo/backend"
npm install
node server.js
```

Server will run on http://localhost:3001

### 2. Start RAG Microservice
```bash
cd "drishti-demo/backend/rag"
pip install -r requirements.txt
python rag_central.py --host 127.0.0.1 --port 8000
```

Flask server will run on http://127.0.0.1:8000

### 3. Open the Frontend
- Open `drishti-demo/frontend/index.html` in a Live Server or a browser tab (double-click may work but using a local static server avoids some CORS/origin issues).

### 4. Use the App
- Enter a target (optional) and a consent ID (required)
- Click "Start Scan"
- Watch the status update from queued → running → completed
- Findings will render in a table
- Use the RAG chat box to query loaded documents

## API Endpoints

### Node.js Backend
- POST `/api/scans` → Start simulated scan (requires `consent_id`)
- GET `/api/scans/:id/status` → Returns job status: queued, running, completed
- GET `/api/scans/:id/findings` → Returns parsed findings JSON
- POST `/api/rag` → Proxy to RAG microservice; accepts `{ query, k | top_k, use_gemini }` and returns RAG result

### RAG Microservice (Python)
- POST `/query` → Accepts JSON body `{ query: string, top_k?: number, use_gemini?: bool }` and returns QA results with top chunks and an answer

Example `/query` request body:
```json
{
  "query": "List common webserver CVEs",
  "top_k": 3,
  "use_gemini": false
}
```

Example `/query` response (truncated):
```json
{
  "query": "List common webserver CVEs",
  "top_chunks": [ { "id": "simulated_cves.json__0", "text": "..." } ],
  "use_gemini": false,
  "gemini_success": false,
  "answer": "...",
  "safety_query_matches": [],
  "safety_answer_matches": []
}
```

## Notes
- This is a demo—no real network scans are executed. The backend reads sample files in `backend/samples`.
- For local frontend development it's easiest to call the Node proxy (`/api/rag`) instead of the Python RAG endpoint directly to avoid CORS preflight issues. The Node proxy forwards the request server-side to the Python RAG service.
- To enable direct browser calls to the Python RAG server, ensure it runs with CORS enabled (the project includes minimal CORS support in `rag_central.py`). Using a static server to serve the frontend (Live Server extension or `python -m http.server`) keeps origins consistent.

