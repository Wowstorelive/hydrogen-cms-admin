import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid, List, Search, Filter, Eye, Plus, Sparkles, TrendingUp,
  Layout, ShoppingBag, Zap, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cmsAPI } from '../lib/api';

const ComponentLibrary = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedComponent, setSelectedComponent] = useState(null);

  // Fetch components from database
  const { data: componentsData, isLoading: componentsLoading } = useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      const response = await cmsAPI.components.getAll();
      return response.data;
    },
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await cmsAPI.categories.getAll();
      return response.data;
    },
  });

  // Fetch color schemes
  const { data: colorSchemesData } = useQuery({
    queryKey: ['colorSchemes'],
    queryFn: async () => {
      const response = await cmsAPI.colorSchemes.getAll();
      return response.data;
    },
  });

  const categories = categoriesData || [];
  const components = componentsData || [];
  const colorSchemes = colorSchemesData || [];

  // Filter components
  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         component.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || component.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get category icon
  const getCategoryIcon = (categorySlug) => {
    const icons = {
      'hero-sections': Layout,
      'product-displays': ShoppingBag,
      'conversion-boosters': Zap,
      'content-blocks': Package,
    };
    return icons[categorySlug] || Package;
  };

  // Get conversion lift badge color
  const getConversionColor = (lift) => {
    if (lift >= 40) return 'bg-green-100 text-green-800';
    if (lift >= 25) return 'bg-blue-100 text-blue-800';
    if (lift >= 15) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleAddComponent = async (component) => {
    try {
      toast.success(`${component.name} ready to add to page!`);
      // In a real implementation, this would open a page selector
      setSelectedComponent(component);
    } catch (error) {
      toast.error('Failed to add component');
    }
  };

  const handlePreview = (component) => {
    setSelectedComponent(component);
  };

  if (componentsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={28} />
          <h2 className="text-2xl font-bold">Component Library</h2>
        </div>
        <p className="text-blue-100">
          {components.length} production-ready components with an average +{
            components.length > 0
              ? Math.round(components.reduce((acc, c) => acc + (c.avg_conversion_lift || 0), 0) / components.length)
              : 0
          }% conversion lift
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Component Grid/List */}
      <div className={viewMode === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'space-y-4'
      }>
        {filteredComponents.map(component => {
          const CategoryIcon = getCategoryIcon(component.category?.slug || '');

          return (
            <div
              key={component.id}
              className="bg-white rounded-lg border hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
            >
              {/* Component Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-t-lg flex items-center justify-center p-6">
                <CategoryIcon size={64} className="text-blue-600 opacity-20" />
              </div>

              {/* Component Info */}
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{component.name}</h3>
                    {component.avg_conversion_lift > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getConversionColor(component.avg_conversion_lift)}`}>
                        <TrendingUp size={12} />
                        +{component.avg_conversion_lift}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{component.description}</p>
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CategoryIcon size={14} />
                  <span>{component.category?.name || 'Uncategorized'}</span>
                </div>

                {/* Component Type */}
                <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                  {component.component_type}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handlePreview(component)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                  <button
                    onClick={() => handleAddComponent(component)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredComponents.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No components found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Component Preview Modal */}
      {selectedComponent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedComponent(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedComponent.name}</h3>
                  <p className="text-sm text-gray-600">{selectedComponent.category?.name || 'Uncategorized'}</p>
                </div>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedComponent.description}</p>
                </div>

                {selectedComponent.avg_conversion_lift > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-1">
                      <TrendingUp size={18} />
                      Average Conversion Lift: +{selectedComponent.avg_conversion_lift}%
                    </div>
                    <p className="text-sm text-green-700">
                      This component has been proven to increase conversions by an average of {selectedComponent.avg_conversion_lift}% in production environments.
                    </p>
                  </div>
                )}

                {selectedComponent.default_props && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Default Props</h4>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(selectedComponent.default_props, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleAddComponent(selectedComponent);
                      setSelectedComponent(null);
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Add to Page
                  </button>
                  <button
                    onClick={() => setSelectedComponent(null)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentLibrary;
