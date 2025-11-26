import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsAPI } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Bookmark, Plus, Edit2, Trash2, Copy, Search, Filter,
  Star, StarOff, ChevronDown, X, Save, Sparkles, Layout
} from 'lucide-react';
import { SectionLoader } from '../common/LoadingStates';

/**
 * TemplateSaver - Modal to save current component config as template
 */
export function TemplateSaver({ component, propsOverride, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => cmsAPI.componentTemplates?.create?.(data) ||
      Promise.resolve({ data: { id: Date.now(), ...data } }),
    onSuccess: (response) => {
      toast.success('Template saved successfully!');
      queryClient.invalidateQueries(['componentTemplates']);
      onSaved?.(response.data);
      onClose();
    },
    onError: () => toast.error('Failed to save template'),
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      component_id: component.id,
      component_slug: component.slug,
      props_config: propsOverride,
      is_favorite: isFavorite,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bookmark className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Save as Template</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hero with Blue CTA"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                isFavorite
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {isFavorite ? (
                <Star className="w-4 h-4 fill-current" />
              ) : (
                <StarOff className="w-4 h-4" />
              )}
              {isFavorite ? 'Favorited' : 'Add to Favorites'}
            </button>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Component:</strong> {component.name}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This will save the current property configuration for quick reuse.
            </p>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * TemplateSelector - Browse and apply saved templates
 */
export function TemplateSelector({ componentId, onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch templates for this component
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['componentTemplates', componentId],
    queryFn: async () => {
      // Try API, fall back to localStorage for demo
      try {
        const response = await cmsAPI.componentTemplates?.getByComponentId?.(componentId);
        return response?.data || [];
      } catch {
        // Fallback to localStorage
        const stored = localStorage.getItem(`templates_${componentId}`);
        return stored ? JSON.parse(stored) : [];
      }
    },
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (showFavoritesOnly && !t.is_favorite) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          t.name.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [templates, searchTerm, showFavoritesOnly]);

  if (isLoading) {
    return (
      <div className="p-8">
        <SectionLoader message="Loading templates..." />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Layout className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Choose Template</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                showFavoritesOnly
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'border text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              Favorites
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No templates found</p>
              <p className="text-sm text-gray-500 mt-1">
                {templates.length === 0
                  ? 'Save a template to get started'
                  : 'Try adjusting your search'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelect(template);
                    onClose();
                  }}
                  className="text-left p-4 border rounded-lg hover:border-purple-400 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    {template.is_favorite && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Sparkles className="w-3 h-3" />
                    Apply configuration
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * TemplateManager - Full template management UI
 */
export function TemplateManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const queryClient = useQueryClient();

  // Fetch all templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['allComponentTemplates'],
    queryFn: async () => {
      try {
        const response = await cmsAPI.componentTemplates?.getAll?.();
        return response?.data || [];
      } catch {
        // Aggregate from localStorage
        const allTemplates = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('templates_')) {
            const stored = localStorage.getItem(key);
            if (stored) {
              allTemplates.push(...JSON.parse(stored));
            }
          }
        }
        return allTemplates;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => cmsAPI.componentTemplates?.delete?.(id) ||
      Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries(['allComponentTemplates']);
      toast.success('Template deleted');
    },
    onError: () => toast.error('Failed to delete template'),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) =>
      cmsAPI.componentTemplates?.update?.(id, { is_favorite: !isFavorite }) ||
      Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries(['allComponentTemplates']);
    },
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          t.name.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [templates, searchTerm]);

  if (isLoading) {
    return <SectionLoader message="Loading templates..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Component Templates</h2>
          <p className="text-gray-600">{templates.length} saved templates</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600">
            Save component configurations as templates for quick reuse
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.component_slug}</p>
                </div>
                <button
                  onClick={() => toggleFavoriteMutation.mutate({
                    id: template.id,
                    isFavorite: template.is_favorite
                  })}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  {template.is_favorite ? (
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  ) : (
                    <StarOff className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100 transition">
                  <Copy className="w-3 h-3" />
                  Use
                </button>
                <button className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 transition">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(template.id)}
                  className="px-3 py-1.5 border border-red-200 text-red-600 rounded text-sm hover:bg-red-50 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TemplateManager;
