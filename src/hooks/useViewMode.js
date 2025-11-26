import { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * ViewModeContext - Shared state for responsive preview across CMS components
 * This enables the toolbar buttons (desktop/tablet/mobile) to control the preview iframe
 */

const VIEWPORT_SIZES = {
  desktop: { width: 1440, height: 900, label: 'Desktop' },
  tablet: { width: 768, height: 1024, label: 'Tablet' },
  mobile: { width: 375, height: 812, label: 'Mobile' },
};

const ViewModeContext = createContext(null);

export function ViewModeProvider({ children }) {
  const [viewMode, setViewMode] = useState('desktop');
  const [previewUrl, setPreviewUrl] = useState('https://wowstore-live-e73ceb638e20e1167a63.o2.myshopify.dev');
  const [storeMode, setStoreMode] = useState('hydrogen'); // 'hydrogen' or 'liquid'

  const currentViewport = VIEWPORT_SIZES[viewMode];

  // Change view mode (desktop/tablet/mobile)
  const changeViewMode = useCallback((mode) => {
    if (VIEWPORT_SIZES[mode]) {
      setViewMode(mode);
    }
  }, []);

  // Toggle between Hydrogen and Liquid preview
  const toggleStoreMode = useCallback(() => {
    setStoreMode(prev => {
      const newMode = prev === 'hydrogen' ? 'liquid' : 'hydrogen';
      // Update preview URL based on store mode
      if (newMode === 'liquid') {
        setPreviewUrl('https://wowstore.live');
      } else {
        setPreviewUrl('https://wowstore-live-e73ceb638e20e1167a63.o2.myshopify.dev');
      }
      return newMode;
    });
  }, []);

  // Set preview to a specific page path
  const setPreviewPath = useCallback((path) => {
    const baseUrl = storeMode === 'liquid'
      ? 'https://wowstore.live'
      : 'https://wowstore-live-e73ceb638e20e1167a63.o2.myshopify.dev';

    setPreviewUrl(`${baseUrl}${path}`);
  }, [storeMode]);

  const value = {
    viewMode,
    setViewMode: changeViewMode,
    currentViewport,
    viewportSizes: VIEWPORT_SIZES,
    previewUrl,
    setPreviewUrl,
    setPreviewPath,
    storeMode,
    setStoreMode,
    toggleStoreMode,
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}

export { VIEWPORT_SIZES };
export default useViewMode;
