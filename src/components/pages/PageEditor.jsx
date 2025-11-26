import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cmsAPI } from '../../lib/api';
import { PreviewPane } from '../preview/PreviewPane';
import { MediaBrowser } from '../media/MediaBrowser';
import { useViewMode } from '../../hooks/useViewMode';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Settings, GripVertical, Search,
  ChevronDown, ChevronRight, Sparkles, Save, X, Image as ImageIcon,
  Eye, EyeOff, Copy, Undo2, Layers, ArrowUp, ArrowDown, MousePointer
} from 'lucide-react';

/**
 * SortableComponentCard - Draggable component in the page structure
 */
function SortableComponentCard({ instance, isSelected, onClick, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: instance.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
        ${isDragging ? 'shadow-lg z-50' : ''}
      `}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Component Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">
          {instance.component?.name || 'Unknown Component'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {instance.component?.category_name || 'Component'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={isFirst}
          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
          title="Move up"
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={isLast}
          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
          title="Move down"
        >
          <ArrowDown className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 hover:bg-red-100 text-red-600 rounded"
          title="Remove"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/**
 * PageStructurePanel - Shows sorted list of components on the page
 */
function PageStructurePanel({ instances, selectedId, onSelect, onDelete, onReorder }) {
  return (
    <div className="w-72 bg-white border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Page Structure</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {instances.length} component{instances.length !== 1 ? 's' : ''} • Drag to reorder
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {instances.length === 0 ? (
          <div className="text-center py-8">
            <MousePointer className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No components yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Click a component from the library to add it
            </p>
          </div>
        ) : (
          <SortableContext items={instances.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {instances.map((instance, index) => (
                <SortableComponentCard
                  key={instance.id}
                  instance={instance}
                  isSelected={selectedId === instance.id}
                  onClick={() => onSelect(instance)}
                  onDelete={() => onDelete(instance.id)}
                  onMoveUp={() => onReorder(index, index - 1)}
                  onMoveDown={() => onReorder(index, index + 1)}
                  isFirst={index === 0}
                  isLast={index === instances.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

/**
 * DraggableComponent - Draggable component card in the library
 */
function DraggableComponent({ component, onAdd }) {
  return (
    <div
      onClick={() => onAdd(component)}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-500" />
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
function ComponentLibraryPanel({ components, onAddComponent }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(['Hero Sections']);

  // Group components by category
  const categorizedComponents = useMemo(() => {
    return components.reduce((acc, component) => {
      const category = component.category_name || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(component);
      return acc;
    }, {});
  }, [components]);

  const filteredComponents = useMemo(() => {
    if (!searchTerm) return null;
    return components.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [components, searchTerm]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="w-80 bg-gray-50 border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
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
          {components.length} components available
        </div>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredComponents ? (
          // Show filtered results
          <div className="space-y-2">
            {filteredComponents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No components found</p>
            ) : (
              filteredComponents.map((component) => (
                <DraggableComponent
                  key={component.id}
                  component={component}
                  onAdd={onAddComponent}
                />
              ))
            )}
          </div>
        ) : (
          // Show by category
          <div className="space-y-3">
            {Object.entries(categorizedComponents).map(([category, comps]) => {
              const isExpanded = expandedCategories.includes(category);

              return (
                <div key={category} className="bg-white rounded-lg border">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-t-lg transition"
                  >
                    <span className="font-medium text-sm text-gray-900">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {comps.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-2 space-y-2 border-t">
                      {comps.map((component) => (
                        <DraggableComponent
                          key={component.id}
                          component={component}
                          onAdd={onAddComponent}
                        />
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
 * VisualPropsEditor - Form-based props editor
 */
function VisualPropsEditor({ schema, values, onChange }) {
  if (!schema?.properties) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No configurable properties
      </div>
    );
  }

  const handleFieldChange = (key, value) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(([key, fieldSchema]) => {
        const value = values[key] ?? '';
        const isRequired = schema.required?.includes(key);
        const isImageField = key.toLowerCase().includes('image') ||
                            key.toLowerCase().includes('url') ||
                            fieldSchema.description?.toLowerCase().includes('image');

        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {key}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {fieldSchema.description && (
              <p className="text-xs text-gray-500 mb-1">{fieldSchema.description}</p>
            )}

            {fieldSchema.type === 'boolean' ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => handleFieldChange(key, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Enabled</span>
              </label>
            ) : fieldSchema.type === 'number' ? (
              <input
                type="number"
                value={value}
                onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            ) : fieldSchema.type === 'array' ? (
              <textarea
                value={JSON.stringify(value || [], null, 2)}
                onChange={(e) => {
                  try {
                    handleFieldChange(key, JSON.parse(e.target.value));
                  } catch {}
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono h-24 focus:ring-2 focus:ring-blue-500"
                placeholder="[]"
              />
            ) : isImageField ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                  title="Browse Shopify Media"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * PropertiesPanel - Right panel for editing selected component
 */
function PropertiesPanel({ instance, onUpdate, onDelete, onClose }) {
  const [props, setProps] = useState(instance?.props_override || {});
  const [propsJson, setPropsJson] = useState(JSON.stringify(instance?.props_override || {}, null, 2));
  const [jsonError, setJsonError] = useState(null);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [activeImageField, setActiveImageField] = useState(null);
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'json'

  useEffect(() => {
    if (instance) {
      setProps(instance.props_override || {});
      setPropsJson(JSON.stringify(instance.props_override || {}, null, 2));
      setJsonError(null);
    }
  }, [instance]);

  const handleMediaSelect = (media) => {
    if (activeImageField) {
      const updatedProps = { ...props, [activeImageField]: media.url };
      setProps(updatedProps);
      setPropsJson(JSON.stringify(updatedProps, null, 2));
    }
    setShowMediaBrowser(false);
    setActiveImageField(null);
  };

  const handleVisualChange = (newProps) => {
    setProps(newProps);
    setPropsJson(JSON.stringify(newProps, null, 2));
    setJsonError(null);
  };

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
    onUpdate(instance.id, { props_override: props });
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
    <div className="w-96 bg-white border-l flex flex-col h-full">
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

        {/* Editor Mode Toggle */}
        <div className="flex items-center gap-1 mt-3 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setEditorMode('visual')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              editorMode === 'visual' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Visual
          </button>
          <button
            onClick={() => setEditorMode('json')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              editorMode === 'json' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            JSON
          </button>
        </div>
      </div>

      {/* Properties Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        {editorMode === 'visual' ? (
          <VisualPropsEditor
            schema={instance.component?.props_schema}
            values={props}
            onChange={handleVisualChange}
          />
        ) : (
          <div className="space-y-4">
            <textarea
              value={propsJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg font-mono text-xs h-64 focus:ring-2 focus:ring-blue-500 ${
                jsonError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {jsonError && (
              <p className="text-xs text-red-600">{jsonError}</p>
            )}
          </div>
        )}

        {/* Component Info */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Component Info</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Category:</strong> {instance.component?.category_name}</p>
            <p><strong>Order:</strong> {instance.sort_order}</p>
            {instance.component?.conversion_lift_percentage > 0 && (
              <p className="text-green-600">
                <strong>Conversion Lift:</strong> +{instance.component.conversion_lift_percentage}%
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!!jsonError}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
        <button
          onClick={() => onDelete(instance.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
        >
          <Trash2 className="w-4 h-4" />
          Remove Component
        </button>
      </div>

      {/* Media Browser Modal */}
      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => {
          setShowMediaBrowser(false);
          setActiveImageField(null);
        }}
        onSelect={handleMediaSelect}
        allowMultiple={false}
      />
    </div>
  );
}

/**
 * PageEditor - Main component with four-panel layout
 */
export function PageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use shared view mode context
  const { viewMode, setPreviewPath, storeMode } = useViewMode();
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [pageData, setPageData] = useState(null);
  const [deletedStack, setDeletedStack] = useState([]); // For undo functionality

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
      return response.data?.[0] || response.data;
    },
    enabled: !!pageId,
  });

  // Fetch page components
  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['pageComponents', pageId],
    queryFn: async () => {
      const response = await cmsAPI.componentInstances.getByPageId(pageId);
      return response.data || [];
    },
    enabled: !!pageId,
  });

  // Fetch available components
  const { data: availableComponents = [] } = useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      const response = await cmsAPI.components.getAll();
      return response.data || [];
    },
  });

  // Sort instances by sort_order
  const sortedInstances = useMemo(() => {
    return [...instances].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [instances]);

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
      setSelectedInstance(null);
    },
    onError: () => toast.error('Failed to remove component'),
  });

  const handleAddComponent = useCallback((component) => {
    const maxOrder = sortedInstances.length > 0
      ? Math.max(...sortedInstances.map(i => i.sort_order || 0))
      : 0;

    // Generate default values from props_schema if available
    let defaultProps = {};
    if (component.props_schema?.properties) {
      for (const [key, schema] of Object.entries(component.props_schema.properties)) {
        if (schema.default !== undefined) {
          defaultProps[key] = schema.default;
        } else if (schema.type === 'string') {
          defaultProps[key] = '';
        } else if (schema.type === 'number') {
          defaultProps[key] = 0;
        } else if (schema.type === 'array') {
          defaultProps[key] = [];
        } else if (schema.type === 'object') {
          defaultProps[key] = {};
        } else if (schema.type === 'boolean') {
          defaultProps[key] = false;
        }
      }
    }

    addComponentMutation.mutate({
      page_id: pageId,
      component_id: component.id,
      sort_order: maxOrder + 1,
      props_override: defaultProps,
    });
  }, [sortedInstances, pageId, addComponentMutation]);

  const handleUpdateInstance = useCallback((id, data) => {
    updateInstanceMutation.mutate({ id, data });
  }, [updateInstanceMutation]);

  const handleDeleteInstance = useCallback((id) => {
    const instance = sortedInstances.find(i => i.id === id);
    if (!instance) return;

    // Save to deleted stack for undo
    setDeletedStack(prev => [...prev, instance]);

    deleteInstanceMutation.mutate(id);
    toast((t) => (
      <div className="flex items-center gap-3">
        <span>Component removed</span>
        <button
          onClick={() => {
            // Undo: re-add the component
            addComponentMutation.mutate({
              page_id: instance.page_id,
              component_id: instance.component_id,
              sort_order: instance.sort_order,
              props_override: instance.props_override,
            });
            toast.dismiss(t.id);
            setDeletedStack(prev => prev.slice(0, -1));
          }}
          className="px-2 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-700"
        >
          Undo
        </button>
      </div>
    ), { duration: 5000 });
  }, [sortedInstances, deleteInstanceMutation, addComponentMutation]);

  const handleReorder = useCallback((oldIndex, newIndex) => {
    if (newIndex < 0 || newIndex >= sortedInstances.length) return;

    const reordered = arrayMove(sortedInstances, oldIndex, newIndex);

    // Update sort_order for affected instances
    reordered.forEach((instance, index) => {
      if (instance.sort_order !== index) {
        updateInstanceMutation.mutate({
          id: instance.id,
          data: { sort_order: index }
        });
      }
    });
  }, [sortedInstances, updateInstanceMutation]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedInstances.findIndex(i => i.id === active.id);
    const newIndex = sortedInstances.findIndex(i => i.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      handleReorder(oldIndex, newIndex);
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
        />

        {/* Center-Left: Page Structure */}
        <PageStructurePanel
          instances={sortedInstances}
          selectedId={selectedInstance?.id}
          onSelect={setSelectedInstance}
          onDelete={handleDeleteInstance}
          onReorder={handleReorder}
        />

        {/* Center-Right: Preview Pane */}
        <div className="flex-1 min-w-0">
          <PreviewPane
            viewMode={viewMode}
            pageData={pageData}
            onComponentClick={(id) => {
              const instance = sortedInstances.find(i => i.id === id);
              if (instance) setSelectedInstance(instance);
            }}
          />
        </div>

        {/* Right: Properties Panel */}
        <PropertiesPanel
          instance={selectedInstance}
          onUpdate={handleUpdateInstance}
          onDelete={handleDeleteInstance}
          onClose={() => setSelectedInstance(null)}
        />
      </div>
    </DndContext>
  );
}

export default PageEditor;
