import { useState, useEffect, useRef } from 'react';
import { useViewMode } from '../../hooks/useViewMode';
import { ExternalLink, RefreshCw, Maximize2 } from 'lucide-react';

/**
 * PreviewPane Component
 * Real-time iframe preview showing actual Shopify store (Hydrogen or Liquid)
 * Responds to viewMode changes from the shared context
 */
export function PreviewPane({ pageData, onComponentClick }) {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Get view mode and store settings from shared context
  const {
    viewMode,
    currentViewport,
    previewUrl,
    storeMode,
    setPreviewPath
  } = useViewMode();

  // Update preview path when pageData changes
  useEffect(() => {
    if (pageData?.slug) {
      setPreviewPath(pageData.slug.startsWith('/') ? pageData.slug : `/${pageData.slug}`);
    }
  }, [pageData?.slug, setPreviewPath]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setIframeError(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setIframeError(true);
  };

  // Refresh preview
  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = previewUrl;
    }
  };

  // Open in new tab
  const handleOpenExternal = () => {
    window.open(previewUrl, '_blank');
  };

  // Calculate container width based on view mode
  const getContainerStyle = () => {
    if (viewMode === 'desktop') {
      return {
        width: '100%',
        maxWidth: `${currentViewport.width}px`,
        minHeight: `${currentViewport.height}px`,
      };
    }
    return {
      width: `${currentViewport.width}px`,
      minHeight: `${currentViewport.height}px`,
    };
  };

  return (
    <div className="flex-1 bg-gray-100 p-6 overflow-auto">
      {/* Preview Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            storeMode === 'hydrogen'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {storeMode === 'hydrogen' ? 'Hydrogen' : 'Liquid'} Preview
          </div>
          <span className="text-sm text-gray-500">
            {currentViewport.width} x {currentViewport.height}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
            title="Refresh preview"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div
        className="mx-auto bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-in-out"
        style={getContainerStyle()}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600">Loading store preview...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {iframeError && !isLoading && (
          <div className="h-full min-h-[600px] flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Unavailable</h3>
              <p className="text-gray-600 mb-4 max-w-sm">
                The store preview couldn't be loaded in the iframe due to security restrictions.
              </p>
              <button
                onClick={handleOpenExternal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Open Store in New Tab
              </button>
            </div>
          </div>
        )}

        {/* Preview Iframe */}
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0"
          style={{ minHeight: '800px' }}
          title={`${storeMode === 'hydrogen' ? 'Hydrogen' : 'Liquid'} Store Preview`}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>

      {/* Preview URL Bar */}
      <div className="flex justify-center mt-4">
        <div className="bg-white rounded-lg shadow px-4 py-2 flex items-center gap-3 max-w-lg overflow-hidden">
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <code className="text-sm text-gray-600 truncate">
            {previewUrl}
          </code>
          <button
            onClick={handleOpenExternal}
            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
          >
            Open
          </button>
        </div>
      </div>

      {/* Device Info */}
      <div className="flex justify-center mt-2">
        <div className="text-xs text-gray-500">
          {currentViewport.label} - {currentViewport.width} x {currentViewport.height}px
        </div>
      </div>
    </div>
  );
}

export default PreviewPane;
