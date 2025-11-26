const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const N8N_INTERNAL_URL = process.env.N8N_INTERNAL_URL || 'http://n8n.n8n-workflows:5678/api/v1';
const POSTGREST_URL = process.env.POSTGREST_URL || 'http://wowstore-postgrest.production:3000';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// Core workflow matching
const CORE_WORKFLOWS = [
  { number: 1, keywords: ['performance', 'audit', 'pagespeed', 'lighthouse'] },
  { number: 2, keywords: ['google', 'merchant', 'center', 'gmc', 'image'] },
  { number: 3, keywords: ['broken', 'link', 'repair'] },
  { number: 4, keywords: ['seo', 'enhancement', 'metadata'] },
  { number: 5, keywords: ['script', 'optimization', 'javascript'] },
  { number: 6, keywords: ['theme', 'code', 'review'] },
  { number: 7, keywords: ['creative', 'director', 'content'] },
  { number: 8, keywords: ['business', 'intelligence', 'analytics'] },
  { number: 9, keywords: ['social', 'media', 'multi-platform'] },
  { number: 10, keywords: ['customer', 'feedback', 'loop'] }
];

function matchWorkflow(name) {
  const lower = name.toLowerCase();
  for (const wf of CORE_WORKFLOWS) {
    if (wf.keywords.some(k => lower.includes(k))) return wf.number;
  }
  return null;
}

async function fetchN8N(path, options = {}) {
  const url = `${N8N_INTERNAL_URL}${path}`;
  const headers = { 'Accept': 'application/json', ...options.headers };
  if (N8N_API_KEY) headers['X-N8N-API-KEY'] = N8N_API_KEY;

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`N8N API error: ${response.status}`);
  return await response.json();
}

async function updateWorkflow(workflowNumber, data) {
  const response = await fetch(`${POSTGREST_URL}/workflow_definitions?workflow_number=eq.${workflowNumber}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`Database error: ${response.status}`);
  return await response.json();
}

app.post('/api/workflows/sync-from-n8n', async (req, res) => {
  try {
    console.log('Syncing from n8n...');
    const n8nData = await fetchN8N('/workflows');
    const n8nWorkflows = n8nData.data || n8nData || [];

    let synced = 0;
    const results = [];

    for (const wf of n8nWorkflows) {
      const num = matchWorkflow(wf.name);
      if (num) {
        try {
          await updateWorkflow(num, {
            n8n_workflow_id: wf.id,
            is_active: wf.active || false,
            health_status: wf.active ? 'healthy' : 'unknown',
            updated_at: new Date().toISOString()
          });
          synced++;
          results.push({ workflowNumber: num, n8nId: wf.id, name: wf.name, status: 'synced' });
          console.log(`✅ Synced #${num}: ${wf.name}`);
        } catch (error) {
          results.push({ workflowNumber: num, name: wf.name, status: 'failed', error: error.message });
        }
      }
    }

    res.json({ success: true, synced, total: n8nWorkflows.length, results });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cms-api', n8nUrl: N8N_INTERNAL_URL });
});

app.listen(PORT, () => {
  console.log(`CMS API on port ${PORT}`);
  console.log(`N8N: ${N8N_INTERNAL_URL}`);
  console.log(`API Key: ${N8N_API_KEY ? 'Set' : 'Not set'}`);
});
