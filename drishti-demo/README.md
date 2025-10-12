# DRISHTI Demo (Data-driven Reporting & Intelligence System for Highlighting Tactical Insights)

A minimal, end-to-end local prototype showing how DRISHTI could orchestrate scans, parse results, and present findings.

## Tech Stack
- Backend: Node.js + Express (in-memory storage)
- Frontend: HTML + Vanilla JS (single page)
- Optional Parser: xml2js to parse sample Nmap XML

## Features
- Start a simulated scan by providing a target and a required consent_id.
- Backend simulates scan time and parses sample Nmap XML to canonical findings.
- UI polls job status and renders results on completion.

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
  frontend/
    index.html
```

## Run locally
1. Start the backend server:

```powershell
cd "drishti-demo/backend"; npm install; npm start
```

- Server will run on http://localhost:3001

2. Open the frontend:

- Open `drishti-demo/frontend/index.html` in your browser (double-click or drag into a tab)

3. Use the app:
- Enter a target (optional) and a consent ID (required)
- Click "Start Scan"
- Watch the status update from queued → running → completed
- Findings will render in a table

## API Endpoints
- POST `/api/scans` → Start simulated scan (requires `consent_id`)
- GET `/api/scans/:id/status` → Returns job status: queued, running, completed
- GET `/api/scans/:id/findings` → Returns parsed findings JSON

## Canonical Finding JSON
```json
{
  "finding_id": "uuid",
  "scan_job_id": "uuid",
  "target": "127.0.0.1",
  "timestamp": "2025-10-13T00:00:00Z",
  "source_scanner": "nmap",
  "title": "Open HTTP port 80",
  "description": "Detected HTTP service running Apache/2.4.49",
  "cve_ids": ["CVE-2021-XXXXX"],
  "cvss_v3": 7.5,
  "severity": "high",
  "remediation": "Upgrade Apache version or apply patch"
}
```

## Notes
- This is a demo—no real network scans are executed. The backend reads sample files in `backend/samples`.
- You can replace the sample Nmap XML with your own later; see `parse_nmap.js` for mapping.
- Stretch: Add a real nmap exec call and parse the produced XML; add charts of findings.
