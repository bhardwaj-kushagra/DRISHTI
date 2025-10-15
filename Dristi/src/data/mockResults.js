export const MOCK_RESULTS = [
  { id: "f1", tool: "Nmap", finding: "Open SSH port (22)", cve: null, cvss: null, component: "sshd", severity: "Medium", details: "Port 22 open, service: OpenSSH 7.6p1", asset: "shop.example.com", exploited: false },
  { id: "f2", tool: "Nessus", finding: "Apache HTTPD CVE-2021-41773", cve: "CVE-2021-41773", cvss: 7.5, component: "apache2", severity: "High", details: "Path traversal in Apache 2.4.49", asset: "shop.example.com", exploited: true },
  { id: "f3", tool: "Nuclei", finding: "Old WordPress version - known plugin exploit", cve: "CVE-2020-28036", cvss: 6.1, component: "wordpress", severity: "Medium", details: "Outdated WordPress core + vulnerable plugin", asset: "shop.example.com", exploited: false }
];
