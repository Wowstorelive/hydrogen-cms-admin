import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ViewModeProvider } from './hooks/useViewMode';
import { CMSLayout } from './components/layout/CMSLayout';
import { Dashboard } from './components/Dashboard';
import { PagesManager } from './components/PagesManager';
import { PageEditor } from './components/pages/PageEditor';
import ComponentLibrary from './components/ComponentLibrary';
import FunnelManager from './components/FunnelManager';
import { FunnelVisualBuilder } from './components/funnels/FunnelVisualBuilder';
import InitiativeManager from './components/InitiativeManager';
import SDGLibrary from './components/SDGLibrary';
import WorkflowOrchestration from './components/WorkflowOrchestration';
import GitHubOAuthHandler from './components/GitHubOAuthHandler';
import { GitHubSettings } from './components/settings/GitHubSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ViewModeProvider>
      <Router>
        <GitHubOAuthHandler />

        <CMSLayout>
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Pages */}
            <Route path="/pages" element={<PagesManager />} />
            <Route path="/pages/:pageId/edit" element={<PageEditor />} />

            {/* Components */}
            <Route path="/components" element={<ComponentLibrary />} />

            {/* Funnels */}
            <Route path="/funnels" element={<FunnelManager />} />
            <Route path="/funnels/:funnelId/visual" element={<FunnelVisualBuilder />} />

            {/* Initiatives */}
            <Route path="/initiatives" element={<InitiativeManager />} />

            {/* SDGs */}
            <Route path="/sdgs" element={<SDGLibrary />} />

            {/* Workflows */}
            <Route path="/workflows" element={<WorkflowOrchestration />} />

            {/* Settings */}
            <Route path="/settings/github" element={<GitHubSettings />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CMSLayout>

        <Toaster position="top-right" />
      </Router>
      </ViewModeProvider>
    </QueryClientProvider>
  );
};

export default App;
