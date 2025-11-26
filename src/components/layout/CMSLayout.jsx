import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CMSTopToolbar } from './CMSTopToolbar';
import { CMSSidebar } from './CMSSidebar';
import { useViewMode } from '../../hooks/useViewMode';
import toast from 'react-hot-toast';

/**
 * CMSLayout Component
 * Main layout wrapper providing Shopify-style UI with toolbar and sidebar
 * Now uses shared ViewModeContext for responsive preview state
 */
export function CMSLayout({ children, showPreview = false, pageData = null }) {
  const navigate = useNavigate();
  const { viewMode, setViewMode, storeMode, toggleStoreMode } = useViewMode();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (pageData && pageData.hasUnsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        handleSave();
      }, 30000); // 30 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [pageData]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save logic would go here
      // For now, just simulate a save
      await new Promise(resolve => setTimeout(resolve, 500));

      setLastSaved(new Date());
      toast.success('Changes saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [pageData]);

  const handlePublish = useCallback(async () => {
    try {
      // First save if there are unsaved changes
      if (pageData?.hasUnsavedChanges) {
        await handleSave();
      }

      // Then publish
      toast.success('Page published successfully!');
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish page');
    }
  }, [pageData, handleSave]);

  const handleAskAI = useCallback(() => {
    // AI assistant logic would go here
    toast.success('AI Assistant coming soon!');
  }, []);

  const handleNewPage = useCallback(() => {
    navigate('/pages/new');
  }, [navigate]);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    toast.success(`Switched to ${mode} view`);
  }, [setViewMode]);

  const handleStoreModeToggle = useCallback(() => {
    toggleStoreMode();
    toast.success(`Switched to ${storeMode === 'hydrogen' ? 'Liquid' : 'Hydrogen'} preview`);
  }, [toggleStoreMode, storeMode]);

  // Generate breadcrumbs based on current location
  const getBreadcrumbs = () => {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0) return ['Dashboard'];
    if (parts[0] === 'pages' && parts.length === 1) return ['Pages'];
    if (parts[0] === 'components') return ['Components'];
    if (parts[0] === 'funnels') return ['Funnels'];
    if (parts[0] === 'sdgs') return ['SDGs'];
    if (parts[0] === 'workflows') return ['Workflows'];

    return parts.map(part =>
      part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <CMSTopToolbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        storeMode={storeMode}
        onStoreModeToggle={handleStoreModeToggle}
        isSaving={isSaving}
        onSave={handleSave}
        onPublish={handlePublish}
        onAskAI={handleAskAI}
        breadcrumbs={getBreadcrumbs()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <CMSSidebar onNewPage={handleNewPage} />

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default CMSLayout;
