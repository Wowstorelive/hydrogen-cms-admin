import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsAPI } from '../lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, MoveUp, MoveDown, Settings, Eye, Save, Package,
  Grid, X, ChevronRight, Sparkles
} from 'lucide-react';

export const PageBuilder = ({ pageId, pageName }) => {
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [editingInstance, setEditingInstance] = useState(null);
  const [instanceProps, setInstanceProps] = useState({});
  const queryClient = useQueryClient();

  // Fetch page components
  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['pageComponents', pageId],
    queryFn: async () => {
      const response = await cmsAPI.componentInstances.getByPageId(pageId);
      return response.data;
    },
    enabled: !!pageId,
  });

  // Fetch available components for library
  const { data: availableComponents = [] } = useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      const response = await cmsAPI.components.getAll();
      return response.data;
    },
  });

  // Add component to page
  const addComponentMutation = useMutation({
    mutationFn: (data) => cmsAPI.componentInstances.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pageComponents', pageId]);
      toast.success('Component added to page!');
      setShowComponentLibrary(false);
    },
    onError: () => toast.error('Failed to add component'),
  });

  // Update component instance
  const updateInstanceMutation = useMutation({
    mutationFn: ({ id, data }) => cmsAPI.componentInstances.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pageComponents', pageId]);
      toast.success('Component updated!');
      setEditingInstance(null);
    },
    onError: () => toast.error('Failed to update component'),
  });

  // Delete component instance
  const deleteInstanceMutation = useMutation({
    mutationFn: (id) => cmsAPI.componentInstances.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pageComponents', pageId]);
      toast.success('Component removed from page!');
    },
    onError: () => toast.error('Failed to remove component'),
  });

  // Reorder components
  const reorderMutation = useMutation({
    mutationFn: (updates) => cmsAPI.componentInstances.reorder(pageId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['pageComponents', pageId]);
      toast.success('Components reordered!');
    },
    onError: () => toast.error('Failed to reorder components'),
  });

  const handleAddComponent = (component) => {
    const maxOrder = instances.length > 0
      ? Math.max(...instances.map(i => i.sort_order || 0))
      : 0;

    addComponentMutation.mutate({
      page_id: pageId,
      component_id: component.id,
      section_name: 'main',
      sort_order: maxOrder + 1,
      props: component.default_props || {},
    });
  };

  const handleMoveUp = (instance, index) => {
    if (index === 0) return;
    const updates = [
      { id: instance.id, sort_order: instance.sort_order - 1 },
      { id: instances[index - 1].id, sort_order: instances[index - 1].sort_order + 1 },
    ];
    reorderMutation.mutate(updates);
  };

  const handleMoveDown = (instance, index) => {
    if (index === instances.length - 1) return;
    const updates = [
      { id: instance.id, sort_order: instance.sort_order + 1 },
      { id: instances[index + 1].id, sort_order: instances[index + 1].sort_order - 1 },
    ];
    reorderMutation.mutate(updates);
  };

  const handleEditProps = (instance) => {
    setEditingInstance(instance);
    setInstanceProps(instance.props || {});
  };

  const handleSaveProps = () => {
    updateInstanceMutation.mutate({
      id: editingInstance.id,
      data: { props: instanceProps },
    });
  };

  const handleDeleteInstance = (id) => {
    if (window.confirm('Remove this component from the page?')) {
      deleteInstanceMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading page components...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Page Builder</h2>
          <p className="text-gray-600 mt-1">
            Building: <span className="font-medium">{pageName}</span>
          </p>
        </div>
        <button
          onClick={() => setShowComponentLibrary(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add Component
        </button>
      </div>

      {/* Components List */}
      {instances.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No components yet</h3>
          <p className="text-gray-600 mb-4">
            Start building your page by adding components from the library
          </p>
          <button
            onClick={() => setShowComponentLibrary(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add First Component
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {instances.map((instance, index) => (
            <div
              key={instance.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition"
            >
              <div className="flex items-center gap-4">
                {/* Component Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Sparkles size={18} className="text-blue-600" />
                    <h3 className="font-semibold text-gray-900">
                      {instance.component?.name || 'Unknown Component'}
                    </h3>
                    {instance.component?.avg_conversion_lift > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        +{instance.component.avg_conversion_lift}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {instance.component?.description || 'No description'}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    Section: {instance.section_name} • Order: {instance.sort_order}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Reorder */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(instance, index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <MoveUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(instance, index)}
                      disabled={index === instances.length - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <MoveDown size={16} />
                    </button>
                  </div>

                  {/* Edit Props */}
                  <button
                    onClick={() => handleEditProps(instance)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit properties"
                  >
                    <Settings size={18} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteInstance(instance.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Component Library Modal */}
      {showComponentLibrary && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowComponentLibrary(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Add Component to Page</h3>
                <button
                  onClick={() => setShowComponentLibrary(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableComponents.map((component) => (
                <div
                  key={component.id}
                  className="border rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
                  onClick={() => handleAddComponent(component)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{component.name}</h4>
                    {component.avg_conversion_lift > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        +{component.avg_conversion_lift}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {component.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{component.category_name}</span>
                    <button className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline">
                      Add <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Props Modal */}
      {editingInstance && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setEditingInstance(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">
                Edit Component: {editingInstance.component?.name}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Component Properties (JSON)
                </label>
                <textarea
                  value={JSON.stringify(instanceProps, null, 2)}
                  onChange={(e) => {
                    try {
                      setInstanceProps(JSON.parse(e.target.value));
                    } catch (err) {
                      // Invalid JSON, keep typing
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm h-64 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Default Props:</h4>
                <pre className="text-xs text-blue-800 overflow-x-auto">
                  {JSON.stringify(editingInstance.component?.default_props || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-6 border-t flex items-center gap-3">
              <button
                onClick={handleSaveProps}
                disabled={updateInstanceMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save size={18} />
                Save Changes
              </button>
              <button
                onClick={() => setEditingInstance(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
