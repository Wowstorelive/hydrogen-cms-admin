import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useShopifyStats, useShopifyPages } from '../hooks/useShopifyData';
import { useViewMode } from '../hooks/useViewMode';
import {
  FileText, Image as ImageIcon, TrendingUp, Activity, Github,
  ShoppingBag, FolderOpen, ExternalLink, Zap, ArrowRight,
  Monitor, Tablet, Smartphone
} from 'lucide-react';
import { isGitHubConnected, getGitHubUser, initiateGitHubOAuth, disconnectGitHub } from '../services/githubService';

export const Dashboard = () => {
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUser, setGithubUser] = useState(null);

  // Fetch real Shopify store data
  const { data: shopifyData, isLoading: shopifyLoading, error: shopifyError } = useShopifyStats();
  const { data: allPages = [] } = useShopifyPages();

  // Get view mode context
  const { storeMode, previewUrl } = useViewMode();

  useEffect(() => {
    // Check GitHub connection status on mount
    const checkGitHubConnection = () => {
      const connected = isGitHubConnected();
      const user = getGitHubUser();
      setGithubConnected(connected);
      setGithubUser(user);
    };

    // Initial check
    checkGitHubConnection();

    // Listen for GitHub connection events
    const handleGitHubConnected = (event) => {
      setGithubConnected(true);
      setGithubUser(event.detail.user);
    };

    window.addEventListener('github-connected', handleGitHubConnected);

    // Cleanup
    return () => {
      window.removeEventListener('github-connected', handleGitHubConnected);
    };
  }, []);

  const handleGitHubConnect = () => {
    try {
      initiateGitHubOAuth();
    } catch (error) {
      console.error('Failed to initiate GitHub OAuth:', error);
      alert('Failed to connect to GitHub: ' + error.message);
    }
  };

  const handleGitHubDisconnect = () => {
    if (confirm('Are you sure you want to disconnect from GitHub?')) {
      disconnectGitHub();
      setGithubConnected(false);
      setGithubUser(null);
    }
  };

  // Stats from real Shopify data
  const stats = shopifyData?.stats || {
    total_pages: 0,
    hydrogen_routes: 0,
    shopify_pages: 0,
    collections_count: 0,
    products_count: 0,
    published_pages: 0,
    draft_pages: 0
  };

  const statCards = [
    {
      label: 'Total Pages',
      value: stats.total_pages,
      icon: FileText,
      color: 'blue',
      description: `${stats.hydrogen_routes} Hydrogen + ${stats.shopify_pages} Shopify + ${stats.collections_count} Collections`
    },
    {
      label: 'Products',
      value: stats.products_count,
      icon: ShoppingBag,
      color: 'purple',
      description: 'Active products in store'
    },
    {
      label: 'Collections',
      value: stats.collections_count,
      icon: FolderOpen,
      color: 'green',
      description: 'Product collections'
    },
    {
      label: 'Hydrogen Routes',
      value: stats.hydrogen_routes,
      icon: Zap,
      color: 'yellow',
      description: 'React-based routes'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to WowStore CMS - Managing {shopifyData?.store?.domain || 'wowstore.live'}
        </p>
      </div>

      {/* Quick Links */}
      <div className="flex items-center gap-3">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <ExternalLink className="w-4 h-4" />
          View Store ({storeMode === 'hydrogen' ? 'Hydrogen' : 'Liquid'})
        </a>
        <Link
          to="/pages"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <FileText className="w-4 h-4" />
          Manage Pages
        </Link>
      </div>

      {/* Loading State */}
      {shopifyLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-700">Loading store data...</span>
        </div>
      )}

      {/* Error State */}
      {shopifyError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">
            Unable to fetch live store data. Showing cached data if available.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const bgColor = {
            blue: 'bg-blue-100',
            purple: 'bg-purple-100',
            green: 'bg-green-100',
            yellow: 'bg-yellow-100',
          }[stat.color];
          const textColor = {
            blue: 'text-blue-600',
            purple: 'text-purple-600',
            green: 'text-green-600',
            yellow: 'text-yellow-600',
          }[stat.color];

          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${bgColor}`}>
                  <Icon className={textColor} size={24} />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pages - Shows real Hydrogen routes + Shopify pages */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Store Pages</h3>
            <Link to="/pages" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {allPages.slice(0, 8).map((page, index) => (
              <div key={page.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${
                    page.type === 'page' ? 'bg-blue-100' :
                    page.type === 'collection' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    {page.type === 'page' ? <FileText className="w-4 h-4 text-blue-600" /> :
                     page.type === 'collection' ? <FolderOpen className="w-4 h-4 text-green-600" /> :
                     <ShoppingBag className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{page.title}</p>
                    <p className="text-xs text-gray-500">{page.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    page.type === 'page' ? 'bg-blue-100 text-blue-800' :
                    page.type === 'collection' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {page.type}
                  </span>
                </div>
              </div>
            ))}
            {allPages.length === 0 && !shopifyLoading && (
              <div className="text-center py-4 text-gray-500">
                No pages found. Connect to Shopify to see your store pages.
              </div>
            )}
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Github size={20} />
            GitHub Integration
          </h3>

          {githubConnected && githubUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <img
                  src={githubUser.avatar_url}
                  alt={githubUser.login}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-medium text-green-900">@{githubUser.login}</p>
                  <p className="text-sm text-green-700">{githubUser.name || 'GitHub User'}</p>
                  <p className="text-xs text-green-600 mt-1">Connected</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  You can now deploy to GitHub and trigger workflows directly from the CMS.
                </p>
                <button
                  onClick={handleGitHubDisconnect}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Disconnect GitHub
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Connect your GitHub account to enable automatic deployments and repository management.
              </p>

              <button
                onClick={handleGitHubConnect}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
              >
                <Github size={20} />
                Connect GitHub
              </button>

              <div className="text-xs text-gray-500 space-y-1">
                <p>Trigger GitHub Actions workflows</p>
                <p>Automatic deployments on save</p>
                <p>Repository access management</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Store Info */}
      {shopifyData?.store && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Store Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Live Domain</p>
              <a
                href={`https://${shopifyData.store.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                {shopifyData.store.domain}
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hydrogen URL</p>
              <a
                href={`https://${shopifyData.store.hydrogen_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                {shopifyData.store.hydrogen_url}
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Mode</p>
              <span className={`font-medium ${storeMode === 'hydrogen' ? 'text-blue-600' : 'text-orange-600'}`}>
                {storeMode === 'hydrogen' ? 'Hydrogen (React)' : 'Liquid (Shopify)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
