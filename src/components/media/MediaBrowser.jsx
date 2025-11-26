import { useState } from 'react';
import { useShopifyMedia, getOptimizedImageUrl } from '../../hooks/useShopifyMedia';
import { Search, X, Image as ImageIcon, Check, Loader2, Grid, List, FolderOpen, ShoppingBag } from 'lucide-react';

/**
 * MediaBrowser - Modal component for browsing and selecting Shopify media
 * Used in the page editor for selecting images for components
 */
export function MediaBrowser({ isOpen, onClose, onSelect, allowMultiple = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selected, setSelected] = useState([]);

  const { media, isLoading, totalCount, filteredCount } = useShopifyMedia({
    filter,
    searchTerm,
  });

  const handleSelect = (item) => {
    if (allowMultiple) {
      setSelected(prev => {
        const isSelected = prev.find(s => s.id === item.id);
        if (isSelected) {
          return prev.filter(s => s.id !== item.id);
        }
        return [...prev, item];
      });
    } else {
      onSelect(item);
      onClose();
    }
  };

  const handleConfirmMultiple = () => {
    if (selected.length > 0) {
      onSelect(selected);
      onClose();
    }
  };

  const isSelected = (item) => selected.some(s => s.id === item.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Media Library</h2>
            <p className="text-sm text-gray-500">
              {filteredCount} of {totalCount} items
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('product')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                filter === 'product'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Products
            </button>
            <button
              onClick={() => setFilter('collection')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                filter === 'collection'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Collections
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600">Loading Shopify media...</p>
              </div>
            </div>
          ) : media.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No media found</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`
                    relative group cursor-pointer rounded-lg overflow-hidden border-2 transition
                    ${isSelected(item) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'}
                  `}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={getOptimizedImageUrl(item.url, { width: 300 })}
                      alt={item.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isSelected(item) && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        item.type === 'product'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-900 font-medium truncate">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`
                    flex items-center gap-4 p-3 rounded-lg cursor-pointer transition
                    ${isSelected(item) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}
                  `}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={getOptimizedImageUrl(item.url, { width: 100 })}
                      alt={item.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-sm text-gray-500 truncate">{item.alt}</p>
                    {item.width && item.height && (
                      <p className="text-xs text-gray-400">{item.width} × {item.height}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.type === 'product'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {item.type}
                    </span>
                    {isSelected(item) && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {allowMultiple && (
          <div className="p-4 border-t flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-600">
              {selected.length} item{selected.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected([])}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                disabled={selected.length === 0}
              >
                Clear Selection
              </button>
              <button
                onClick={handleConfirmMultiple}
                disabled={selected.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Selected
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaBrowser;
