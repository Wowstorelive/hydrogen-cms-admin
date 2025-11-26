/**
 * N8N Workflow Integration Service
 * Connects CMS to n8n.wowstore.live for workflow control
 */

// Use nginx proxy endpoints to avoid mixed content errors
const N8N_API_BASE = '/api/n8n';
const POSTGREST_API_BASE = '/api/postgrest';

// N8N API Key from environment (injected at runtime)
const getN8NApiKey = () => {
  if (typeof window !== 'undefined' && window.ENV && window.ENV.N8N_API_KEY) {
    return window.ENV.N8N_API_KEY;
  }
  console.warn('N8N_API_KEY not found in environment');
  return null;
};

// Helper function to get n8n request headers
const getN8NHeaders = (additionalHeaders = {}) => {
  const headers = {
    'Accept': 'application/json',
    ...additionalHeaders
  };
  const apiKey = getN8NApiKey();
  if (apiKey) {
    headers['X-N8N-API-KEY'] = apiKey;
  }
  return headers;
};

/**
 * N8N Workflow ID Mapping
 * Maps our workflow IDs to n8n workflow IDs
 */
const WORKFLOW_N8N_MAPPING = {
  1: { name: 'Performance Audit', n8nId: null }, // Will be populated
  2: { name: 'Google Merchant Center Compliance', n8nId: null },
  3: { name: 'Broken Link Repair', n8nId: null },
  4: { name: 'SEO Enhancement', n8nId: null },
  5: { name: 'Script Optimization', n8nId: null },
  6: { name: 'Theme Code Review', n8nId: null },
  7: { name: 'Creative Director AI', n8nId: null },
  8: { name: 'Business Intelligence', n8nId: null },
  9: { name: 'Social Media Automation', n8nId: null },
  10: { name: 'Customer Feedback Loop', n8nId: null }
};

/**
 * Get all workflows from n8n
 */
export async function getAllN8NWorkflows(useInternal = false) {
  try {
    const response = await fetch(`${N8N_API_BASE}/workflows`, {
      headers: getN8NHeaders()
    });

    if (!response.ok) {
      throw new Error(`N8N API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data; // Handle different response formats
  } catch (error) {
    console.error('Error fetching n8n workflows:', error);
    throw error;
  }
}

/**
 * Get single workflow from n8n
 */
export async function getN8NWorkflow(workflowId) {
  try {
    const response = await fetch(`${N8N_API_BASE}/workflows/${workflowId}`, {
      headers: getN8NHeaders()
    });

    if (!response.ok) {
      throw new Error(`N8N API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching n8n workflow ${workflowId}:`, error);
    return null;
  }
}

/**
 * Execute a workflow in n8n
 */
export async function executeN8NWorkflow(workflowId) {
  try {
    const response = await fetch(`${N8N_API_BASE}/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: getN8NHeaders({ 'Content-Type': 'application/json' })
    });

    if (!response.ok) {
      throw new Error(`N8N API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error executing n8n workflow ${workflowId}:`, error);
    throw error;
  }
}

/**
 * Activate/Deactivate workflow in n8n
 */
export async function toggleN8NWorkflow(workflowId, active) {
  try {
    const response = await fetch(`${N8N_API_BASE}/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: getN8NHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ active })
    });

    if (!response.ok) {
      throw new Error(`N8N API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error toggling n8n workflow ${workflowId}:`, error);
    throw error;
  }
}

/**
 * Get workflow executions from n8n
 */
export async function getN8NExecutions(workflowId, limit = 10) {
  try {
    const response = await fetch(
      `${N8N_API_BASE}/executions?workflowId=${workflowId}&limit=${limit}`,
      {
        headers: getN8NHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`N8N API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`Error fetching n8n executions for workflow ${workflowId}:`, error);
    return [];
  }
}

/**
 * Sync n8n workflows to our database
 * This should be called periodically (every 5 minutes)
 */
export async function syncN8NWorkflowsToDB() {
  try {
    // Get all workflows from n8n
    const n8nWorkflows = await getAllN8NWorkflows(true);

    if (!n8nWorkflows || n8nWorkflows.length === 0) {
      console.warn('No n8n workflows found');
      return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    // Match n8n workflows to our workflow definitions by name
    for (const [dbId, mapping] of Object.entries(WORKFLOW_N8N_MAPPING)) {
      const n8nWorkflow = n8nWorkflows.find(w =>
        w.name && w.name.toLowerCase().includes(mapping.name.toLowerCase())
      );

      if (!n8nWorkflow) {
        console.warn(`N8N workflow not found for: ${mapping.name}`);
        continue;
      }

      try {
        // Update workflow_definitions table with n8n data
        const updateData = {
          n8n_workflow_id: n8nWorkflow.id,
          is_active: n8nWorkflow.active || false,
          updated_at: new Date().toISOString()
        };

        // Determine health status based on n8n data
        if (n8nWorkflow.active) {
          updateData.health_status = 'healthy';
        } else {
          updateData.health_status = 'unknown';
        }

        const response = await fetch(
          `${POSTGREST_API_BASE}/workflow_definitions?id=eq.${dbId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(updateData)
          }
        );

        if (response.ok) {
          synced++;
        } else {
          errors++;
          console.error(`Failed to sync workflow ${dbId}:`, await response.text());
        }
      } catch (error) {
        errors++;
        console.error(`Error syncing workflow ${dbId}:`, error);
      }
    }

    console.log(`N8N sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors, total: Object.keys(WORKFLOW_N8N_MAPPING).length };
  } catch (error) {
    console.error('Error in syncN8NWorkflowsToDB:', error);
    return { synced: 0, errors: 1 };
  }
}

/**
 * Record workflow execution in our database
 */
export async function recordWorkflowExecution(workflowId, executionData) {
  try {
    const execution = {
      workflow_id: workflowId,
      n8n_execution_id: executionData.id,
      trigger_type: executionData.mode || 'manual',
      started_at: executionData.startedAt || new Date().toISOString(),
      completed_at: executionData.stoppedAt,
      execution_time_ms: executionData.stoppedAt && executionData.startedAt
        ? new Date(executionData.stoppedAt) - new Date(executionData.startedAt)
        : null,
      status: executionData.finished ? 'success' : executionData.status || 'running',
      output_data: executionData.data ? JSON.stringify(executionData.data) : null
    };

    const response = await fetch(`${POSTGREST_API_BASE}/workflow_executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(execution)
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to record execution:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Error recording execution:', error);
    return null;
  }
}

/**
 * Handle webhook from n8n execution update
 * This is called when n8n sends a webhook about execution status
 */
export async function handleN8NExecutionWebhook(payload) {
  try {
    const { workflowId, executionId, status, startedAt, stoppedAt, data } = payload;

    // Find our workflow ID by n8n workflow ID
    const dbWorkflowId = Object.entries(WORKFLOW_N8N_MAPPING).find(
      ([_, mapping]) => mapping.n8nId === workflowId
    )?.[0];

    if (!dbWorkflowId) {
      console.warn(`Unknown n8n workflow ID: ${workflowId}`);
      return null;
    }

    return await recordWorkflowExecution(dbWorkflowId, {
      id: executionId,
      status,
      startedAt,
      stoppedAt,
      data,
      finished: status === 'success'
    });
  } catch (error) {
    console.error('Error handling n8n webhook:', error);
    return null;
  }
}

/**
 * Initialize workflow sync
 * Should be called when CMS starts and every 5 minutes
 */
export function initializeN8NSync() {
  // Initial sync
  syncN8NWorkflowsToDB();

  // Sync every 5 minutes
  const syncInterval = setInterval(() => {
    syncN8NWorkflowsToDB();
  }, 5 * 60 * 1000); // 5 minutes

  // Return cleanup function
  return () => clearInterval(syncInterval);
}

/**
 * Get workflow status summary
 * Combines n8n data with our database data
 */
export async function getWorkflowStatusSummary(workflowId) {
  try {
    // Get from our database
    const dbResponse = await fetch(
      `${POSTGREST_API_BASE}/workflow_status_overview?id=eq.${workflowId}`
    );
    const dbData = await dbResponse.json();
    const dbWorkflow = dbData[0];

    if (!dbWorkflow || !dbWorkflow.n8n_workflow_id) {
      return { ...dbWorkflow, n8nConnected: false };
    }

    // Get from n8n
    const n8nWorkflow = await getN8NWorkflow(dbWorkflow.n8n_workflow_id);
    const n8nExecutions = await getN8NExecutions(dbWorkflow.n8n_workflow_id, 5);

    return {
      ...dbWorkflow,
      n8nConnected: true,
      n8nActive: n8nWorkflow?.active,
      n8nLastExecution: n8nExecutions[0],
      n8nRecentExecutions: n8nExecutions
    };
  } catch (error) {
    console.error(`Error getting workflow status summary for ${workflowId}:`, error);
    return null;
  }
}

export default {
  getAllN8NWorkflows,
  getN8NWorkflow,
  executeN8NWorkflow,
  toggleN8NWorkflow,
  getN8NExecutions,
  syncN8NWorkflowsToDB,
  recordWorkflowExecution,
  handleN8NExecutionWebhook,
  initializeN8NSync,
  getWorkflowStatusSummary
};
