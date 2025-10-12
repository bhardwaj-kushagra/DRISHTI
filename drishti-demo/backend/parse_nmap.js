import { parseStringPromise } from 'xml2js';
import { v4 as uuidv4 } from 'uuid';

// Convert Nmap XML to canonical findings array
// Options: { scan_job_id, target }
export async function parseNmapXmlToFindings(xmlString, options = {}) {
  const { scan_job_id, target } = options;
  const now = new Date().toISOString();

  const xml = await parseStringPromise(xmlString, { explicitArray: false, mergeAttrs: true });
  const nmaprun = xml?.nmaprun;
  if (!nmaprun) return [];

  const hosts = Array.isArray(nmaprun.host) ? nmaprun.host : (nmaprun.host ? [nmaprun.host] : []);
  const findings = [];

  for (const host of hosts) {
    const addr = host?.address?.addr || target || 'unknown';
    const ports = host?.ports?.port;
    if (!ports) continue;
    const portsArray = Array.isArray(ports) ? ports : [ports];

    for (const p of portsArray) {
      const state = p?.state?.state;
      if (state !== 'open') continue;
      const portid = p.portid;
      const proto = p.protocol || 'tcp';
      const serviceName = p?.service?.name || 'unknown-service';
      const product = p?.service?.product;
      const version = p?.service?.version;
      const extrainfo = p?.service?.extrainfo;

      const title = `Open ${serviceName.toUpperCase()} port ${portid}`;
      const descriptionParts = [];
      if (product || version) descriptionParts.push(`Detected ${product || ''}${version ? '/' + version : ''}`.trim());
      if (extrainfo) descriptionParts.push(`Info: ${extrainfo}`);
      const description = descriptionParts.join('. ') || 'Open service detected by Nmap.';

      findings.push({
        finding_id: uuidv4(),
        scan_job_id,
        target: addr,
        timestamp: now,
        source_scanner: 'nmap',
        title,
        description,
        cve_ids: [],
        cvss_v3: null,
        severity: inferSeverityFromService(serviceName, portid),
        remediation: suggestRemediation(serviceName, portid)
      });
    }
  }

  return findings;
}

function inferSeverityFromService(serviceName, port) {
  const sevMap = {
    22: 'low',
    80: 'medium',
    443: 'low',
    3306: 'high',
    6379: 'high',
    27017: 'high'
  };
  return sevMap[Number(port)] || (serviceName?.includes('http') ? 'medium' : 'low');
}

function suggestRemediation(serviceName, port) {
  if (String(port) === '22') return 'Restrict SSH to trusted IPs, use keys, and disable password auth.';
  if (String(port) === '3306') return 'Restrict MySQL to internal interfaces and require strong authentication.';
  if (String(port) === '6379') return 'Bind Redis to localhost or protect with ACLs and network policy.';
  if (String(port) === '27017') return 'Enable MongoDB auth and restrict network exposure.';
  if ((serviceName || '').includes('http')) return 'Enforce TLS, harden web server, and minimize info leakage.';
  return 'Restrict exposure to necessary networks and harden service configuration.';
}
