/**
 * GitHub App Integration Service
 * Handles OAuth flow and repository operations
 */

// Get GitHub credentials from runtime environment
const getGitHubConfig = () => {
  if (typeof window !== 'undefined' && window.ENV) {
    return {
      clientId: window.ENV.GITHUB_CLIENT_ID,
      appId: window.ENV.GITHUB_APP_ID
    };
  }
  console.warn('GitHub credentials not found in environment');
  return { clientId: null, appId: null };
};

/**
 * Initiate GitHub OAuth flow
 * Redirects user to GitHub authorization page
 */
export function initiateGitHubOAuth() {
  const { clientId } = getGitHubConfig();

  if (!clientId) {
    throw new Error('GitHub Client ID not configured');
  }

  const redirectUri = `${window.location.origin}/`;
  const scope = 'repo,workflow'; // Repository access and GitHub Actions
  const state = generateState(); // CSRF protection

  // Store state in sessionStorage for verification
  sessionStorage.setItem('github_oauth_state', state);

  // Construct GitHub OAuth URL
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);

  // Redirect to GitHub
  window.location.href = authUrl.toString();
}

/**
 * Handle OAuth callback
 * Exchanges code for access token
 */
export async function handleGitHubCallback(code, state) {
  // Verify state to prevent CSRF
  const savedState = sessionStorage.getItem('github_oauth_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter - possible CSRF attack');
  }

  // Clear state
  sessionStorage.removeItem('github_oauth_state');

  // Exchange code for token via our backend
  const response = await fetch('/api/github/exchange-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to exchange OAuth code');
  }

  const data = await response.json();

  // Store access token securely
  // Note: In production, consider using httpOnly cookies instead
  localStorage.setItem('github_access_token', data.access_token);
  localStorage.setItem('github_user', JSON.stringify(data.user));

  return data;
}

/**
 * Get stored GitHub access token
 */
export function getGitHubAccessToken() {
  return localStorage.getItem('github_access_token');
}

/**
 * Get stored GitHub user info
 */
export function getGitHubUser() {
  const userJson = localStorage.getItem('github_user');
  return userJson ? JSON.parse(userJson) : null;
}

/**
 * Check if user is connected to GitHub
 */
export function isGitHubConnected() {
  return !!getGitHubAccessToken();
}

/**
 * Disconnect from GitHub
 */
export function disconnectGitHub() {
  localStorage.removeItem('github_access_token');
  localStorage.removeItem('github_user');
}

/**
 * List user's repositories
 */
export async function listRepositories() {
  const token = getGitHubAccessToken();
  if (!token) {
    throw new Error('Not connected to GitHub');
  }

  const response = await fetch('https://api.github.com/user/repos', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }

  return await response.json();
}

/**
 * Get repository details
 */
export async function getRepository(owner, repo) {
  const token = getGitHubAccessToken();
  if (!token) {
    throw new Error('Not connected to GitHub');
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch repository');
  }

  return await response.json();
}

/**
 * List repository workflows (GitHub Actions)
 */
export async function listWorkflows(owner, repo) {
  const token = getGitHubAccessToken();
  if (!token) {
    throw new Error('Not connected to GitHub');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch workflows');
  }

  const data = await response.json();
  return data.workflows || [];
}

/**
 * Trigger a workflow dispatch
 */
export async function triggerWorkflow(owner, repo, workflowId, ref = 'main', inputs = {}) {
  const token = getGitHubAccessToken();
  if (!token) {
    throw new Error('Not connected to GitHub');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ref, inputs })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to trigger workflow');
  }

  return { success: true };
}

/**
 * List workflow runs
 */
export async function listWorkflowRuns(owner, repo, workflowId, limit = 10) {
  const token = getGitHubAccessToken();
  if (!token) {
    throw new Error('Not connected to GitHub');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch workflow runs');
  }

  const data = await response.json();
  return data.workflow_runs || [];
}

/**
 * Generate random state for CSRF protection
 */
function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export default {
  initiateGitHubOAuth,
  handleGitHubCallback,
  getGitHubAccessToken,
  getGitHubUser,
  isGitHubConnected,
  disconnectGitHub,
  listRepositories,
  getRepository,
  listWorkflows,
  triggerWorkflow,
  listWorkflowRuns
};
