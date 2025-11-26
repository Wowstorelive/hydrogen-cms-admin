import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, Activity, Zap, MessageCircle, Send, X as CloseIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import n8nService from '../services/n8nService';

// Use nginx proxy endpoints to avoid mixed content errors
const POSTGREST_BASE = '/api/postgrest';

const WorkflowOrchestration = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [stats24h, setStats24h] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch workflow status overview
  const fetchWorkflows = async () => {
    try {
      const response = await fetch(`${POSTGREST_BASE}/workflow_status_overview?order=workflow_number.asc`);
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load workflows');
    }
  };

  // Sync workflows from n8n
  const syncFromN8N = async () => {
    setSyncing(true);
    toast.loading('Syncing from n8n...', { id: 'sync' });

    try {
      // Call the n8nService sync function
      const result = await n8nService.syncN8NWorkflowsToDB();

      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} of ${result.total} workflows from n8n!`, { id: 'sync' });
      } else {
        toast('No workflows matched. Check n8n workflow names.', { id: 'sync', icon: '⚠️' });
      }

      // Refresh the workflows list
      await fetchWorkflows();
    } catch (error) {
      console.error('Error syncing from n8n:', error);
      toast.error('Failed to sync from n8n: ' + (error.message || 'Unknown error'), { id: 'sync' });
    } finally {
      setSyncing(false);
    }
  };

  // Fetch recent executions for selected workflow
  const fetchExecutions = async (workflowId) => {
    try {
      const response = await fetch(
        `${POSTGREST_BASE}/workflow_executions?workflow_id=eq.${workflowId}&order=started_at.desc&limit=10`
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
        `${POSTGREST_BASE}/workflow_learning?workflow_id=eq.${workflowId}&order=created_at.desc&limit=5`
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
      const response = await fetch(`${POSTGREST_BASE}/workflow_24h_operations?order=hour.desc&limit=24`);
      const data = await response.json();
      setStats24h(data);
    } catch (error) {
      console.error('Error fetching 24h stats:', error);
    }
  };

  // Execute workflow via n8n
  const executeWorkflow = async (workflow) => {
    if (!workflow.n8n_workflow_id) {
      toast.error('N8N workflow ID not configured. Please sync first.');
      return;
    }

    try {
      toast.loading('Executing workflow in n8n...', { id: 'execute' });

      // Execute in n8n
      const n8nResult = await n8nService.executeN8NWorkflow(workflow.n8n_workflow_id);

      // Record in our database
      await n8nService.recordWorkflowExecution(workflow.id, n8nResult);

      toast.success('Workflow started successfully', { id: 'execute' });

      // Refresh data
      fetchWorkflows();
      if (selectedWorkflow?.id === workflow.id) {
        fetchExecutions(workflow.id);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Failed to execute workflow', { id: 'execute' });
    }
  };

  // Toggle workflow active status via n8n
  const toggleWorkflowStatus = async (workflow, isActive) => {
    if (!workflow.n8n_workflow_id) {
      toast.error('N8N workflow ID not configured. Please sync first.');
      return;
    }

    try {
      // Toggle in n8n
      await n8nService.toggleN8NWorkflow(workflow.n8n_workflow_id, !isActive);

      // Update in our database
      const response = await fetch(`${POSTGREST_BASE}/workflow_definitions?id=eq.${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        toast.success(isActive ? 'Workflow deactivated' : 'Workflow activated');
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast.error('Failed to update workflow');
    }
  };

  // Pause/resume workflow
  const toggleWorkflowPause = async (workflow, isPaused) => {
    try {
      const response = await fetch(`${POSTGREST_BASE}/workflow_definitions?id=eq.${workflow.id}`, {
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

  // AI Chat handler
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      // Get workflow data for context
      const workflowsData = await fetch(`${POSTGREST_BASE}/workflow_status_overview?order=workflow_number.asc`);
      const workflows = await workflowsData.json();

      const executionsData = await fetch(`${POSTGREST_BASE}/recent_workflow_executions?limit=20`);
      const executions = await executionsData.json();

      // Build context for AI
      const context = {
        workflows: workflows.map(w => ({
          number: w.workflow_number,
          name: w.workflow_name,
          status: w.is_active ? 'active' : 'inactive',
          health: w.health_status,
          executions24h: w.executions_last_24h,
          failures24h: w.failures_last_24h,
          successRate: w.success_rate
        })),
        recentExecutions: executions.slice(0, 10).map(e => ({
          workflow: e.workflow_name,
          status: e.status,
          time: e.started_at,
          duration: e.execution_time_ms
        }))
      };

      // Call Vertex AI for response
      const aiResponse = await fetch('http://vertexai-mcp.mcp-servers:8003', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'vertexai.chat.complete',
          params: {
            messages: [
              {
                role: 'system',
                content: `You are an n8n Workflow Specialist for WowStore. You help users understand and monitor their 10 autonomous workflows. Here's the current state: ${JSON.stringify(context, null, 2)}. Provide clear, concise answers about workflow status, executions, and performance.`
              },
              {
                role: 'user',
                content: userMessage
              }
            ],
            temperature: 0.7
          }
        })
      });

      const aiResult = await aiResponse.json();
      const aiMessage = aiResult.result?.content || 'I apologize, but I encountered an error. Please try again.';

      setChatMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
    } catch (error) {
      console.error('Error in AI chat:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchWorkflows();
      await fetch24hStats();

      // Initialize n8n sync
      const cleanup = n8nService.initializeN8NSync();

      setLoading(false);

      return cleanup;
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
          <div className="flex items-center gap-4">
            <button
              onClick={syncFromN8N}
              disabled={syncing}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync from N8N'}
            </button>
            <div className="text-right">
              <div className="text-3xl font-bold">{workflows.length}</div>
              <div className="text-sm text-blue-100">Active Workflows</div>
            </div>
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

      {/* Rest of the component continues... (workflow grid, details, etc.) */}
      {/* Using the same UI from the original component */}
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
                    {workflow.n8n_workflow_id && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">N8N</span>
                    )}
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
                    executeWorkflow(workflow);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  disabled={!workflow.is_active || workflow.is_paused || !workflow.n8n_workflow_id}
                >
                  <Play size={16} />
                  Execute
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWorkflowPause(workflow, workflow.is_paused);
                  }}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition text-sm"
                  disabled={!workflow.is_active}
                >
                  {workflow.is_paused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWorkflowStatus(workflow, workflow.is_active);
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

        {/* Workflow Details - Same as original component */}
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

      {/* AI Chat Widget */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-2xl border-2 border-blue-500 flex flex-col max-h-[500px]">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span className="font-semibold">N8N Workflow Specialist</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="hover:bg-blue-700 rounded p-1"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="mb-2">Ask me about your workflows!</p>
                <p className="text-sm">Try: "How many workflows are active?"</p>
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about workflows..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
};

export default WorkflowOrchestration;
