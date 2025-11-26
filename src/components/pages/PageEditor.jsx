import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cmsAPI } from '../../lib/api';
import { PreviewPane } from '../preview/PreviewPane';
import { useViewMode } from '../../hooks/useViewMode';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Settings, GripVertical, Search,
  ChevronDown, ChevronRight, Sparkles, Save, X
} from 'lucide-react';

/**
 * DraggableComponent - Draggable component card in the library
 */
function DraggableComponent({ component }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: component.id,
    data: {
      type: 'component',
      component: component,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition cursor-move"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <h4 className="font-medium text-gray-900 text-sm">{component.name}</h4>
        </div>
        {component.avg_conversion_lift > 0 && (
          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            +{component.avg_conversion_lift}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
        {component.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{component.category_name}</span>
        <Sparkles className="w-3 h-3 text-blue-500" />
      </div>
    </div>
  );
}

/**
 * ComponentLibraryPanel - Left panel with searchable component library
 */
function ComponentLibraryPanel({ components, onAddComponent, viewMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(['all']);

  // Group components by category
  const categorizedComponents = components.reduce((acc, component) => {
    const category = component.category_name || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(component);
    return acc;
  }, {});

  const filteredComponents = components.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="w-80 bg-white border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900 mb-3">Component Library</h3>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mt-3 text-xs text-gray-500">
          {filteredComponents.length} components available
        </div>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchTerm ? (
          // Show filtered results
          <div className="space-y-2">
            {filteredComponents.map((component) => (
              <div
                key={component.id}
                onClick={() => onAddComponent(component)}
                className="cursor-pointer"
              >
                <DraggableComponent component={component} />
              </div>
            ))}
          </div>
        ) : (
          // Show by category
          <div className="space-y-3">
            {Object.entries(categorizedComponents).map(([category, comps]) => {
              const isExpanded = expandedCategories.includes(category);

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded-lg transition"
                  >
                    <span className="font-medium text-sm text-gray-900">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{comps.length}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-2 ml-2">
                      {comps.map((component) => (
                        <div
                          key={component.id}
                          onClick={() => onAddComponent(component)}
                          className="cursor-pointer"
                        >
                          <DraggableComponent component={component} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PropertiesPanel - Right panel for editing selected component
 */
function PropertiesPanel({ instance, onUpdate, onClose }) {
  const [props, setProps] = useState(instance?.props || {});
  const [propsJson, setPropsJson] = useState(JSON.stringify(instance?.props || {}, null, 2));
  const [jsonError, setJsonError] = useState(null);

  useEffect(() => {
    if (instance) {
      setProps(instance.props || {});
      setPropsJson(JSON.stringify(instance.props || {}, null, 2));
    }
  }, [instance]);

  const handleJsonChange = (value) => {
    setPropsJson(value);
    try {
      const parsed = JSON.parse(value);
      setProps(parsed);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleSave = () => {
    if (jsonError) {
      toast.error('Invalid JSON format');
      return;
    }
    onUpdate(instance.id, { props });
  };

  if (!instance) {
    return (
      <div className="w-80 bg-white border-l flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Select a component to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Properties</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600">{instance.component?.name}</p>
      </div>

      {/* Properties Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Component Properties (JSON)
            </label>
            <textarea
              value={propsJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg font-mono text-xs h-64 focus:ring-2 focus:ring-blue-500 ${
                jsonError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {jsonError && (
              <p className="mt-1 text-xs text-red-600">{jsonError}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-blue-900 mb-2">Default Props:</h4>
            <pre className="text-xs text-blue-800 overflow-x-auto">
              {JSON.stringify(instance.component?.default_props || {}, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-900 mb-2">Component Info:</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Category:</strong> {instance.component?.category_name}</p>
              <p><strong>Section:</strong> {instance.section_name}</p>
              <p><strong>Order:</strong> {instance.sort_order}</p>
              {instance.component?.avg_conversion_lift > 0 && (
                <p><strong>Conversion Lift:</strong> +{instance.component.avg_conversion_lift}%</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={!!jsonError}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * PageEditor - Main component with three-panel layout
 */
export function PageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use shared view mode context
  const { viewMode, setPreviewPath, storeMode } = useViewMode();
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [pageData, setPageData] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch page details
  const { data: page } = useQuery({
    queryKey: ['page', pageId],
    queryFn: async () => {
      const response = await cmsAPI.pages.getById(pageId);
      return response.data;
    },
    enabled: !!pageId,
  });

  // Fetch page components
  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['pageComponents', pageId],
    queryFn: async () => {
      const response = await cmsAPI.componentInstances.getByPageId(pageId);
      return response.data;
    },
    enabled: !!pageId,
  });

  // Fetch available components
  const { data: availableComponents = [] } = useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      const response = await cmsAPI.components.getAll();
      return response.data;
    },
  });

  // Update pageData when instances change and set preview path
  useEffect(() => {
    if (page && instances) {
      const slug = page.slug?.startsWith('/') ? page.slug : `/${page.slug || ''}`;
      setPageData({
        ...page,
        slug,
        components: instances,
        publicUrl: `https://wowstore.live${slug}`,
      });
      // Update preview to show this page
      setPreviewPath(slug);
    }
  }, [page, instances, pageId, setPreviewPath]);

  // Add component mutation
  const addComponentMutation = useMutation({
    mutationFn: (data) => cmsAPI.componentInstances.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pageComponents', pageId]);
      toast.success('Component added!');
    },
    onError: () => toast.error('Failed to add component'),
  });

  // Update component mutation
  const updateInstanceMutation = useMutation({
    mutationFn: ({ id, data }) => cmsAPI.componentInstances.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pageComponents', pageId]);
      toast.success('Component updated!');
      setSelectedInstance(null);
    },
    onError: () => toast.error('Failed to update component'),
  });

  // Delete component mutation
  const deleteInstanceMutation = useMutation({
    mutationFn: (id) => cmsAPI.componentInstances.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pageComponents', pageId]);
      toast.success('Component removed!');
      setSelectedInstance(null);
    },
    onError: () => toast.error('Failed to remove component'),
  });

  const handleAddComponent = useCallback((component) => {
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
  }, [instances, pageId, addComponentMutation]);

  const handleUpdateInstance = useCallback((id, data) => {
    updateInstanceMutation.mutate({ id, data });
  }, [updateInstanceMutation]);

  const handleDeleteInstance = useCallback((id) => {
    if (window.confirm('Remove this component from the page?')) {
      deleteInstanceMutation.mutate(id);
    }
  }, [deleteInstanceMutation]);

  const handleComponentClick = useCallback((componentId) => {
    const instance = instances.find(i => i.id === componentId);
    if (instance) {
      setSelectedInstance(instance);
    }
  }, [instances]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    // If dragging a component from the library (adding new component)
    const draggedComponent = availableComponents.find(c => c.id === active.id);
    if (draggedComponent && !instances.find(i => i.id === active.id)) {
      // This is a new component being added
      handleAddComponent(draggedComponent);
      return;
    }

    // If reordering existing components
    if (active.id !== over.id) {
      const activeInstance = instances.find(i => i.id === active.id);
      const overInstance = instances.find(i => i.id === over.id);

      if (activeInstance && overInstance) {
        const oldIndex = instances.indexOf(activeInstance);
        const newIndex = instances.indexOf(overInstance);

        // Reorder the instances array
        const reorderedInstances = arrayMove(instances, oldIndex, newIndex);

        // Update sort_order for each instance
        reorderedInstances.forEach((instance, index) => {
          if (instance.sort_order !== index) {
            updateInstanceMutation.mutate({
              id: instance.id,
              data: { sort_order: index }
            });
          }
        });

        toast.success('Components reordered');
      }
    }
  };

  if (isLoading || !page) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page editor...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex">
        {/* Left: Component Library */}
        <ComponentLibraryPanel
          components={availableComponents}
          onAddComponent={handleAddComponent}
          viewMode={viewMode}
        />

        {/* Center: Preview Pane */}
        <PreviewPane
          viewMode={viewMode}
          pageData={pageData}
          onComponentClick={handleComponentClick}
        />

        {/* Right: Properties Panel */}
        <PropertiesPanel
          instance={selectedInstance}
          onUpdate={handleUpdateInstance}
          onClose={() => setSelectedInstance(null)}
        />
      </div>
    </DndContext>
  );
}

export default PageEditor;
