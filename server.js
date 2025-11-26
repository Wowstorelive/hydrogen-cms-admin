#!/usr/bin/env node

/**
 * CMS Backend API Server
 * Provides API endpoints for workflow management
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.wowstore.live/api/v1';
const N8N_INTERNAL_URL = process.env.N8N_INTERNAL_URL || 'http://n8n.n8n-workflows:5678/api/v1';
const POSTGREST_URL = process.env.POSTGREST_URL || 'http://wowstore-postgrest.production:3000';
const N8N_API_KEY = process.env.N8N_API_KEY || ''; // Will be set from secret

// Core workflow names to match
const CORE_WORKFLOWS = [
  { number: 1, name: 'Performance Audit', keywords: ['performance', 'audit', 'pagespeed', 'lighthouse'] },
  { number: 2, name: 'Google Merchant Center', keywords: ['google', 'merchant', 'center', 'gmc', 'image', 'optimization'] },
  { number: 3, name: 'Broken Link Repair', keywords: ['broken', 'link', 'repair', 'fix'] },
  { number: 4, name: 'SEO Enhancement', keywords: ['seo', 'enhancement', 'metadata', 'meta'] },
  { number: 5, name: 'Script Optimization', keywords: ['script', 'optimization', 'javascript', 'js', 'css'] },
  { number: 6, name: 'Theme Code Review', keywords: ['theme', 'code', 'review', 'hydrogen'] },
  { number: 7, name: 'Creative Director', keywords: ['creative', 'director', 'content', 'generation', 'ai'] },
  { number: 8, name: 'Business Intelligence', keywords: ['business', 'intelligence', 'analytics', 'report'] },
  { number: 9, name: 'Social Media', keywords: ['social', 'media', 'multi-platform', 'publishing', 'blotato'] },
  { number: 10, name: 'Customer Feedback', keywords: ['customer', 'feedback', 'loop', 'sentiment'] }
];

/**
 * Helper: Match n8n workflow to core workflow
 */
function matchWorkflow(n8nWorkflowName) {
  const nameLower = n8nWorkflowName.toLowerCase();

  for (const coreWf of CORE_WORKFLOWS) {
    // Check if any keyword matches
    for (const keyword of coreWf.keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        return coreWf.number;
      }
    }
  }

  return null;
}

/**
 * Helper: Fetch from n8n API
 */
async function fetchN8N(path, options = {}) {
  const url = `${N8N_INTERNAL_URL}${path}`;
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (N8N_API_KEY) {
    headers['X-N8N-API-KEY'] = N8N_API_KEY;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    throw new Error(`N8N API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Helper: Update PostgreSQL via PostgREST
 */
async function updateWorkflow(workflowNumber, data) {
  const response = await fetch(`${POSTGREST_URL}/workflow_definitions?workflow_number=eq.${workflowNumber}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Database update error: ${response.status}`);
  }

  return await response.json();
}

/**
 * API Endpoint: Sync workflows from n8n
 */
app.post('/api/workflows/sync-from-n8n', async (req, res) => {
  try {
    console.log('Starting n8n sync...');

    // 1. Fetch all workflows from n8n
    let n8nData;
    try {
      n8nData = await fetchN8N('/workflows');
    } catch (error) {
      console.error('N8N fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Could not connect to n8n API',
        details: error.message
      });
    }

    const n8nWorkflows = n8nData.data || n8nData || [];
    console.log(`Found ${n8nWorkflows.length} workflows in n8n`);

    if (n8nWorkflows.length === 0) {
      return res.json({
        success: true,
        synced: 0,
        message: 'No workflows found in n8n'
      });
    }

    // 2. Match and update each core workflow
    let synced = 0;
    const results = [];

    for (const n8nWorkflow of n8nWorkflows) {
      const workflowNumber = matchWorkflow(n8nWorkflow.name);

      if (workflowNumber) {
        try {
          const updateData = {
            n8n_workflow_id: n8nWorkflow.id,
            is_active: n8nWorkflow.active || false,
            updated_at: new Date().toISOString()
          };

          // Determine health status
          if (n8nWorkflow.active) {
            updateData.health_status = 'healthy';
          } else {
            updateData.health_status = 'unknown';
          }

          await updateWorkflow(workflowNumber, updateData);
          synced++;

          results.push({
            workflowNumber,
            n8nId: n8nWorkflow.id,
            name: n8nWorkflow.name,
            active: n8nWorkflow.active,
            status: 'synced'
          });

          console.log(`Synced workflow #${workflowNumber}: ${n8nWorkflow.name} (${n8nWorkflow.id})`);
        } catch (error) {
          console.error(`Failed to sync workflow #${workflowNumber}:`, error);
          results.push({
            workflowNumber,
            name: n8nWorkflow.name,
            status: 'failed',
            error: error.message
          });
        }
      } else {
        console.log(`Skipped n8n workflow (no match): ${n8nWorkflow.name}`);
      }
    }

    res.json({
      success: true,
      synced,
      total: n8nWorkflows.length,
      results
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API Endpoint: Get workflow status
 */
app.get('/api/workflows/status', async (req, res) => {
  try {
    const response = await fetch(`${POSTGREST_URL}/workflow_status_overview?order=workflow_number.asc`);
    const data = await response.json();
    res.json({ success: true, workflows: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'cms-api',
    n8nUrl: N8N_INTERNAL_URL,
    postgrestUrl: POSTGREST_URL,
    hasApiKey: !!N8N_API_KEY
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`CMS API Server listening on port ${PORT}`);
  console.log(`N8N URL: ${N8N_INTERNAL_URL}`);
  console.log(`PostgREST URL: ${POSTGREST_URL}`);
  console.log(`N8N API Key: ${N8N_API_KEY ? 'Set' : 'Not set (will try without auth)'}`);
});
