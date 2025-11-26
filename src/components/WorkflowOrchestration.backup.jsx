import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, Activity, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const POSTGREST_URL = 'http://wowstore-postgrest.production:3000';
const N8N_API_URL = 'https://n8n.wowstore.live/api/v1';

const WorkflowOrchestration = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [stats24h, setStats24h] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch workflow status overview
  const fetchWorkflows = async () => {
    try {
      const response = await fetch(`${POSTGREST_URL}/workflow_status_overview?order=workflow_number.asc`);
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load workflows');
    }
  };

  // Fetch recent executions for selected workflow
  const fetchExecutions = async (workflowId) => {
    try {
      const response = await fetch(
        `${POSTGREST_URL}/workflow_executions?workflow_id=eq.${workflowId}&order=started_at.desc&limit=10`
      );
      const data = await response.json();
      setExecutions(data);
    } catch (error) {
      console.error('Error fetching executions:', error);
    }
  };

  // Fetch learning insights for selected workflow
  const fetchInsights = async (workflowId) => {
    try {
      const response = await fetch(
        `${POSTGREST_URL}/workflow_learning?workflow_id=eq.${workflowId}&order=created_at.desc&limit=5`
      );
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  // Fetch 24-hour operations stats
  const fetch24hStats = async () => {
    try {
      const response = await fetch(`${POSTGREST_URL}/workflow_24h_operations?order=hour.desc&limit=24`);
      const data = await response.json();
      setStats24h(data);
    } catch (error) {
      console.error('Error fetching 24h stats:', error);
    }
  };

  // Execute workflow manually
  const executeWorkflow = async (workflowId) => {
    try {
      toast.loading('Executing workflow...', { id: 'execute' });

      // Record execution start in database
      const response = await fetch(`${POSTGREST_URL}/workflow_executions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: workflowId,
          trigger_type: 'manual',
          started_at: new Date().toISOString(),
          status: 'running'
        })
      });

      if (response.ok) {
        toast.success('Workflow started successfully', { id: 'execute' });
        fetchWorkflows();
        if (selectedWorkflow?.id === workflowId) {
          fetchExecutions(workflowId);
        }
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Failed to execute workflow', { id: 'execute' });
    }
  };

  // Toggle workflow active status
  const toggleWorkflowStatus = async (workflowId, isActive) => {
    try {
      const response = await fetch(`${POSTGREST_URL}/workflow_definitions?id=eq.${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        toast.success(isActive ? 'Workflow paused' : 'Workflow activated');
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast.error('Failed to update workflow');
    }
  };

  // Pause/resume workflow
  const toggleWorkflowPause = async (workflowId, isPaused) => {
    try {
      const response = await fetch(`${POSTGREST_URL}/workflow_definitions?id=eq.${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_paused: !isPaused })
      });

      if (response.ok) {
        toast.success(isPaused ? 'Workflow resumed' : 'Workflow paused');
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Error pausing workflow:', error);
      toast.error('Failed to pause workflow');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchWorkflows();
      await fetch24hStats();
      setLoading(false);
    };
    loadData();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchWorkflows();
      fetch24hStats();
      if (selectedWorkflow) {
        fetchExecutions(selectedWorkflow.id);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedWorkflow) {
      fetchExecutions(selectedWorkflow.id);
      fetchInsights(selectedWorkflow.id);
    }
  }, [selectedWorkflow]);

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={16} className="text-green-600" />;
      case 'degraded': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'critical': return <XCircle size={16} className="text-red-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getExecutionStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Workflow Orchestration</h1>
            <p className="text-blue-100">24-Hour Autonomous Business Operations</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{workflows.length}</div>
            <div className="text-sm text-blue-100">Active Workflows</div>
          </div>
        </div>
      </div>

      {/* 24-Hour Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Executions (24h)</div>
            <Activity className="text-blue-600" size={20} />
          </div>
          <div className="text-2xl font-bold">
            {workflows.reduce((sum, w) => sum + (w.executions_last_24h || 0), 0)}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Success Rate</div>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {workflows.length > 0
              ? Math.round(
                  workflows.reduce((sum, w) => sum + (w.success_rate || 100), 0) / workflows.length
                )
              : 0}%
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Failures (24h)</div>
            <XCircle className="text-red-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {workflows.reduce((sum, w) => sum + (w.failures_last_24h || 0), 0)}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Avg Response Time</div>
            <Clock className="text-purple-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {workflows.length > 0
              ? Math.round(
                  workflows.reduce((sum, w) => sum + (w.average_execution_time_ms || 0), 0) /
                    workflows.filter(w => w.average_execution_time_ms).length || 1
                )
              : 0}ms
          </div>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflows List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Workflows</h2>
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`bg-white rounded-lg border p-4 cursor-pointer transition ${
                selectedWorkflow?.id === workflow.id ? 'ring-2 ring-blue-500' : 'hover:border-blue-300'
              }`}
              onClick={() => setSelectedWorkflow(workflow)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-500">#{workflow.workflow_number}</span>
                    <h3 className="font-semibold text-gray-900">{workflow.workflow_name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getHealthStatusColor(workflow.health_status)}`}>
                      {workflow.health_status}
                    </span>
                    {workflow.schedule_enabled && workflow.next_scheduled_run && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        Next: {new Date(workflow.next_scheduled_run).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                {getHealthStatusIcon(workflow.health_status)}
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <div className="text-gray-500 text-xs">Executions</div>
                  <div className="font-semibold">{workflow.total_executions || 0}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Success Rate</div>
                  <div className="font-semibold text-green-600">{workflow.success_rate?.toFixed(1) || 0}%</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">24h Runs</div>
                  <div className="font-semibold">{workflow.executions_last_24h || 0}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    executeWorkflow(workflow.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  disabled={!workflow.is_active || workflow.is_paused}
                >
                  <Play size={16} />
                  Execute
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWorkflowPause(workflow.id, workflow.is_paused);
                  }}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition text-sm"
                  disabled={!workflow.is_active}
                >
                  {workflow.is_paused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWorkflowStatus(workflow.id, workflow.is_active);
                  }}
                  className={`px-3 py-2 rounded-lg transition text-sm ${
                    workflow.is_active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <Square size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Workflow Details */}
        <div className="space-y-4">
          {selectedWorkflow ? (
            <>
              <h2 className="text-lg font-semibold">
                {selectedWorkflow.workflow_name} - Details
              </h2>

              {/* Recent Executions */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Recent Executions</h3>
                <div className="space-y-2">
                  {executions.length > 0 ? (
                    executions.map((execution) => (
                      <div key={execution.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{execution.trigger_type || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(execution.started_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${getExecutionStatusColor(execution.status)}`}>
                            {execution.status}
                          </div>
                          {execution.execution_time_ms && (
                            <div className="text-xs text-gray-500">{execution.execution_time_ms}ms</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4 text-sm">
                      No executions yet
                    </div>
                  )}
                </div>
              </div>

              {/* Learning Insights */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap size={18} className="text-yellow-600" />
                  AI Learning Insights
                </h3>
                <div className="space-y-2">
                  {insights.length > 0 ? (
                    insights.map((insight) => (
                      <div key={insight.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-sm">{insight.pattern_name || 'Pattern Detected'}</div>
                          <span className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded">
                            {insight.recommendation_priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mb-2">{insight.insight_summary}</div>
                        {insight.recommendation && (
                          <div className="text-sm text-gray-600 bg-white p-2 rounded border border-yellow-300">
                            💡 {insight.recommendation}
                          </div>
                        )}
                        {insight.potential_revenue_impact && (
                          <div className="text-xs text-green-700 mt-2">
                            Potential Revenue Impact: ${insight.potential_revenue_impact}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4 text-sm">
                      No insights generated yet. System is learning...
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
              <Activity size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Select a workflow to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowOrchestration;
