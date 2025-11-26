import { useEffect, useState } from 'react';
import { handleGitHubCallback } from '../services/githubService';
import toast from 'react-hot-toast';

/**
 * GitHub OAuth Handler Component
 * Detects OAuth callback and processes it automatically
 */
export default function GitHubOAuthHandler({ onComplete }) {
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const processOAuthCallback = async () => {
      // Check if this is an OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      // Not an OAuth callback
      if (!code && !error) {
        return;
      }

      // Already processing
      if (processing) {
        return;
      }

      setProcessing(true);

      try {
        // Handle OAuth error
        if (error) {
          const errorDescription = urlParams.get('error_description') || 'GitHub authorization failed';
          toast.error(`GitHub connection failed: ${errorDescription}`);

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setProcessing(false);
          return;
        }

        // Show processing toast
        const toastId = toast.loading('Connecting to GitHub...');

        // Exchange code for token
        const result = await handleGitHubCallback(code, state);

        // Show success
        toast.success(
          `Connected to GitHub as @${result.user.login}!`,
          { id: toastId }
        );

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Notify parent component
        if (onComplete) {
          onComplete(result);
        }

        // Trigger a custom event so other components can update their state
        window.dispatchEvent(new CustomEvent('github-connected', {
          detail: { user: result.user }
        }));

        // Force a page reload after a short delay to ensure UI updates
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err) {
        console.error('GitHub OAuth error:', err);
        toast.error(err.message || 'Failed to connect to GitHub');

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } finally {
        setProcessing(false);
      }
    };

    processOAuthCallback();
  }, []); // Run once on mount

  // This component doesn't render anything
  return null;
}
