import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleGitHubCallback } from '../services/githubService';

/**
 * GitHub OAuth Callback Page
 * Handles the redirect from GitHub OAuth authorization
 */
export default function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get OAuth code and state from URL parameters
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        // Check for OAuth errors
        if (errorParam) {
          throw new Error(
            searchParams.get('error_description') ||
            'GitHub authorization failed'
          );
        }

        if (!code) {
          throw new Error('No authorization code received from GitHub');
        }

        setStatus('exchanging');

        // Exchange code for access token
        const result = await handleGitHubCallback(code, state);

        setStatus('success');

        // Show success message
        console.log('GitHub connected successfully:', result.user);

        // Redirect to settings page after 2 seconds
        setTimeout(() => {
          navigate('/settings', {
            state: {
              githubConnected: true,
              githubUser: result.user
            }
          });
        }, 2000);

      } catch (err) {
        console.error('GitHub OAuth callback error:', err);
        setError(err.message);
        setStatus('error');

        // Redirect to settings after 5 seconds
        setTimeout(() => {
          navigate('/settings', {
            state: {
              githubError: err.message
            }
          });
        }, 5000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        padding: '2rem',
        borderRadius: '8px',
        backgroundColor: '#f9fafb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite'
            }}></div>
            <h2 style={{ color: '#111827', marginBottom: '0.5rem' }}>
              Connecting to GitHub...
            </h2>
            <p style={{ color: '#6b7280' }}>
              Please wait while we process your authorization
            </p>
          </>
        )}

        {status === 'exchanging' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#10b981',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite'
            }}></div>
            <h2 style={{ color: '#111827', marginBottom: '0.5rem' }}>
              Exchanging tokens...
            </h2>
            <p style={{ color: '#6b7280' }}>
              Securing your connection
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 1rem',
              color: '#10b981',
              fontSize: '48px'
            }}>✓</div>
            <h2 style={{ color: '#111827', marginBottom: '0.5rem' }}>
              Connected Successfully!
            </h2>
            <p style={{ color: '#6b7280' }}>
              Your GitHub account has been connected. Redirecting...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 1rem',
              color: '#ef4444',
              fontSize: '48px'
            }}>✗</div>
            <h2 style={{ color: '#111827', marginBottom: '0.5rem' }}>
              Connection Failed
            </h2>
            <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
              {error}
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Redirecting to settings...
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
