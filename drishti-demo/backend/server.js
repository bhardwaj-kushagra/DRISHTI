import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseNmapXmlToFindings } from './parse_nmap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// In-memory stores for demo
const scans = new Map(); // id -> { id, target, consent_id, status, createdAt, finishedAt }
const findingsStore = new Map(); // id -> findings array

// Utility: simulate delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Start a simulated scan
app.post('/api/scans', async (req, res) => {
  try {
    const { target, consent_id } = req.body || {};
    if (!consent_id || typeof consent_id !== 'string' || consent_id.trim() === '') {
      return res.status(400).json({ error: 'consent_id is required before starting a scan' });
    }
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const scan = { id, target: target || '', consent_id, status: 'queued', createdAt };
    scans.set(id, scan);

    // Fire-and-forget async simulation
    simulateScanJob(id, target).catch((e) => {
      console.error('Scan simulation error:', e);
      const s = scans.get(id);
      if (s) {
        s.status = 'completed';
        s.error = String(e?.message || e);
        scans.set(id, s);
        findingsStore.set(id, []);
      }
    });

    return res.status(202).json({ job_id: id, status: scan.status, created_at: createdAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scan status
app.get('/api/scans/:id/status', (req, res) => {
  const { id } = req.params;
  const scan = scans.get(id);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  return res.json({ job_id: id, status: scan.status, created_at: scan.createdAt, finished_at: scan.finishedAt || null, error: scan.error || null });
});

// Get findings
app.get('/api/scans/:id/findings', (req, res) => {
  const { id } = req.params;
  const scan = scans.get(id);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  if (scan.status !== 'completed') return res.status(202).json({ message: 'Scan not completed yet' });
  const findings = findingsStore.get(id) || [];
  return res.json({ job_id: id, findings });
});

// Simulated scan job
async function simulateScanJob(id, target) {
  const scan = scans.get(id);
  if (!scan) return;

  scan.status = 'running';
  scans.set(id, scan);

  // Simulate time
  await sleep(1500);

  // "Run" Nmap by reading a sample XML file
  const samplePath = path.join(__dirname, 'samples', 'nmap-sample.xml');
  const xml = fs.readFileSync(samplePath, 'utf-8');

  // Parse Nmap XML into findings
  let nmapFindings = await parseNmapXmlToFindings(xml, { scan_job_id: id, target });

  // Optionally, you can merge with other tool findings (e.g., nuclei)
  // const nucleiSample = JSON.parse(fs.readFileSync(path.join(__dirname, 'samples', 'nuclei-sample.json'), 'utf-8'));
  // const nucleiFindings = normalizeNucleiFindings(nucleiSample, id, target);
  // const allFindings = [...nmapFindings, ...nucleiFindings];

  const allFindings = nmapFindings;

  // Simulate extra processing time
  await sleep(1000);

  // Store results
  findingsStore.set(id, allFindings);
  scan.status = 'completed';
  scan.finishedAt = new Date().toISOString();
  scans.set(id, scan);
}

// Helper for potential nuclei normalization (not used in base flow)
function normalizeNucleiFindings(nucleiArray, scan_job_id, target) {
  if (!Array.isArray(nucleiArray)) return [];
  return nucleiArray.map((n, idx) => ({
    finding_id: uuidv4(),
    scan_job_id,
    target: target || n.host || 'unknown',
    timestamp: new Date().toISOString(),
    source_scanner: 'nuclei',
    title: n.info?.name || n.templateID || `nuclei finding ${idx + 1}`,
    description: n.extracted_results?.join(', ') || n.matcher_name || 'Nuclei detected an issue',
    cve_ids: n.info?.classification?.cveId ? [n.info.classification.cveId] : [],
    cvss_v3: n.info?.classification?.cvssScore || null,
    severity: (n.info?.severity || 'medium').toLowerCase(),
    remediation: n.info?.reference || 'Review and apply appropriate remediation.'
  }));
}

// const PORT = process.env.PORT || 3001;
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`DRISHTI demo backend running on http://localhost:${PORT}`);
});
