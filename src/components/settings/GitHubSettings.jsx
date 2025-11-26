import React, { useState, useEffect } from 'react';
import { Github, ExternalLink, Code, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export function GitHubSettings() {
  const [config, setConfig] = useState({
    owner: localStorage.getItem('github_owner') || 'Wowstorelive',
    repo: localStorage.getItem('github_repo') || 'Hydrogen-v4-storefront-',
    branch: localStorage.getItem('github_branch') || 'main',
    token: localStorage.getItem('github_token') || '',
  });

  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const fetchRepos = async () => {
    if (!config.token) {
      toast.error('Please add a GitHub token first');
      return;
    }

    setLoadingRepos(true);
    try {
      const response = await axios.get(`https://api.github.com/users/${config.owner}/repos`, {
        headers: { 'Authorization': `Bearer ${config.token}` },
        params: { per_page: 100, sort: 'updated' }
      });
      setRepos(response.data);
      toast.success(`Found ${response.data.length} repositories`);
    } catch (error) {
      console.error('Failed to fetch repos:', error);
      toast.error('Failed to fetch repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('github_owner', config.owner);
    localStorage.setItem('github_repo', config.repo);
    localStorage.setItem('github_branch', config.branch);
    localStorage.setItem('github_token', config.token);
    toast.success('GitHub settings saved! Refresh page to apply.');
  };

  const openCodespaces = () => {
    const url = `https://github.com/${config.owner}/${config.repo}`;
    window.open(url, '_blank');
  };

  const createCodespace = () => {
    const url = `https://github.com/codespaces/new?repo=${config.owner}/${config.repo}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-900 rounded-lg">
            <Github className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">GitHub Integration</h2>
            <p className="text-sm text-gray-600">Connect your Hydrogen storefront repository</p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repository Owner
          </label>
          <input
            type="text"
            value={config.owner}
            onChange={(e) => setConfig({ ...config, owner: e.target.value })}
            placeholder="Wowstorelive"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repository Name
          </label>
          <div className="flex gap-2">
            {repos.length > 0 ? (
              <select
                value={config.repo}
                onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {repos.map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={config.repo}
                onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                placeholder="Hydrogen-v4-storefront-"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            <button
              onClick={fetchRepos}
              disabled={loadingRepos}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              title="Load repositories"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRepos ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Branch
          </label>
          <input
            type="text"
            value={config.branch}
            onChange={(e) => setConfig({ ...config, branch: e.target.value })}
            placeholder="main"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            value={config.token}
            onChange={(e) => setConfig({ ...config, token: e.target.value })}
            placeholder="ghp_..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          <p className="mt-2 text-xs text-gray-500">
            Token needs <code className="bg-gray-100 px-1 py-0.5 rounded">repo</code> scope
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <SettingsIcon className="w-4 h-4" />
            Save Settings
          </button>

          <button
            onClick={openCodespaces}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Github className="w-4 h-4" />
            Open Repository
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={createCodespace}
            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            <Code className="w-4 h-4" />
            Open in Codespaces
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Current Configuration Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Current Configuration</h3>
        <div className="space-y-1 text-sm">
          <p className="text-blue-800">
            <strong>Repository:</strong>{' '}
            <a
              href={`https://github.com/${config.owner}/${config.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-600"
            >
              {config.owner}/{config.repo}
            </a>
          </p>
          <p className="text-blue-800">
            <strong>Branch:</strong> {config.branch}
          </p>
          <p className="text-blue-800">
            <strong>Token:</strong> {config.token ? '••••••••' : 'Not set'}
          </p>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Guide</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">1.</span>
            <span>Go to GitHub → Settings → Developer settings → Personal access tokens</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">2.</span>
            <span>Create token with <code className="bg-gray-200 px-1 rounded">repo</code> scope</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">3.</span>
            <span>Paste token above and save settings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">4.</span>
            <span>Use "Open in Codespaces" to edit code directly in GitHub</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
