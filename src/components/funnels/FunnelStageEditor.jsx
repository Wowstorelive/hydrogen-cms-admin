import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cmsAPI } from '../../lib/api';
import { PreviewPane } from '../preview/PreviewPane';
import { MediaBrowser } from '../media/MediaBrowser';
import { useViewMode } from '../../hooks/useViewMode';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, Trash2, Settings, GripVertical, Search,
  ChevronDown, ChevronRight, Sparkles, Save, X, Eye,
  Layers, ArrowUp, ArrowDown, Zap, Target, Users, CheckCircle, TrendingUp
} from 'lucide-react';

const STAGE_TYPES = [
  { type: 'landing', name: 'Landing', icon: Zap, color: 'blue' },
  { type: 'story', name: 'Story', icon: Target, color: 'purple' },
  { type: 'social_proof', name: 'Social Proof', icon: Users, color: 'green' },
  { type: 'offer', name: 'Offer', icon: Target, color: 'orange' },
  { type: 'urgency', name: 'Urgency', icon: TrendingUp, color: 'red' },
  { type: 'thank_you', name: 'Thank You', icon: CheckCircle, color: 'green' },
];

/**
 * SortableComponentCard - Draggable component in the stage
 */
function SortableComponentCard({ instance, isSelected, onClick, onDelete }) {
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
      `}
      onClick={onClick}
    >
      <div
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-gray-100 rounded cursor-grab"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">
          {instance.component?.name || 'Unknown Component'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {instance.component?.category_name || 'Component'}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-1 hover:bg-red-100 text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

/**
 * ComponentSelector - Mini component library for adding to stage
 */
function ComponentSelector({ components, onAdd, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const cats = new Set(components.map(c => c.category_name || 'Other'));
    return ['all', ...Array.from(cats)];
  }, [components]);

  const filteredComponents = useMemo(() => {
    return components.filter(c => {
      const matchesSearch = !searchTerm ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' ||
        c.category_name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [components, searchTerm, selectedCategory]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Add Component</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredComponents.map(component => (
              <button
                key={component.id}
                onClick={() => onAdd(component)}
                className="text-left p-4 border rounded-lg hover:border-blue-400 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{component.name}</span>
                  {component.avg_conversion_lift > 0 && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      +{component.avg_conversion_lift}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{component.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">{component.category_name}</span>
                  <Sparkles className="w-3 h-3 text-blue-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FunnelStageEditor - Editor for individual funnel stage
 */
export function FunnelStageEditor() {
  const { funnelId, stageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { viewMode } = useViewMode();

  const [selectedInstance, setSelectedInstance] = useState(null);
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [stageData, setStageData] = useState({
    headline: '',
    subheadline: '',
    cta_text: '',
    cta_url: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Fetch stage details
  const { data: stage, isLoading: stageLoading } = useQuery({
    queryKey: ['funnelStage', stageId],
    queryFn: async () => {
      const response = await cmsAPI.funnelStages.getById?.(stageId) ||
        { data: [{ id: stageId, stage_type: 'landing', headline: 'Stage' }] };
      return response.data?.[0] || response.data;
    },
    enabled: !!stageId,
  });

  // Fetch stage components
  const { data: stageComponents = [], isLoading: componentsLoading } = useQuery({
    queryKey: ['stageComponents', stageId],
    queryFn: async () => {
      const response = await cmsAPI.funnelStageComponents?.getByStageId?.(stageId) ||
        { data: [] };
      return response.data || [];
    },
    enabled: !!stageId,
  });

  // Fetch available components
  const { data: availableComponents = [] } = useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      const response = await cmsAPI.components.getAll();
      return response.data || [];
    },
  });

  // Fetch funnel info
  const { data: funnel } = useQuery({
    queryKey: ['funnel', funnelId],
    queryFn: async () => {
      const response = await cmsAPI.funnels.getById(funnelId);
      return response.data?.[0] || response.data;
    },
    enabled: !!funnelId,
  });

  // Initialize stage data
  useEffect(() => {
    if (stage) {
      setStageData({
        headline: stage.headline || '',
        subheadline: stage.subheadline || '',
        cta_text: stage.cta_text || '',
        cta_url: stage.cta_url || '',
      });
    }
  }, [stage]);

  // Sort components
  const sortedComponents = useMemo(() => {
    return [...stageComponents].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [stageComponents]);

  // Mutations
  const addComponentMutation = useMutation({
    mutationFn: (data) => cmsAPI.funnelStageComponents.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stageComponents', stageId]);
      toast.success('Component added to stage!');
      setShowComponentSelector(false);
    },
    onError: () => toast.error('Failed to add component'),
  });

  const deleteComponentMutation = useMutation({
    mutationFn: (id) => cmsAPI.funnelStageComponents.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['stageComponents', stageId]);
      toast.success('Component removed');
      setSelectedInstance(null);
    },
    onError: () => toast.error('Failed to remove component'),
  });

  const updateStageMutation = useMutation({
    mutationFn: (data) => cmsAPI.funnelStages.update(stageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['funnelStage', stageId]);
      toast.success('Stage updated!');
    },
    onError: () => toast.error('Failed to update stage'),
  });

  const handleAddComponent = useCallback((component) => {
    const maxOrder = sortedComponents.length > 0
      ? Math.max(...sortedComponents.map(c => c.sort_order || 0))
      : 0;

    addComponentMutation.mutate({
      stage_id: stageId,
      component_id: component.id,
      sort_order: maxOrder + 1,
    });
  }, [sortedComponents, stageId, addComponentMutation]);

  const handleDeleteComponent = useCallback((id) => {
    deleteComponentMutation.mutate(id);
  }, [deleteComponentMutation]);

  const handleSaveStage = () => {
    updateStageMutation.mutate(stageData);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedComponents.findIndex(c => c.id === active.id);
    const newIndex = sortedComponents.findIndex(c => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(sortedComponents, oldIndex, newIndex);
      reordered.forEach((comp, index) => {
        if (comp.sort_order !== index) {
          // Update sort order via API
        }
      });
    }
  };

  const stageType = STAGE_TYPES.find(st => st.type === stage?.stage_type) || STAGE_TYPES[0];
  const StageIcon = stageType.icon;

  if (stageLoading || componentsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/funnels/${funnelId}/visual`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Funnel
              </button>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stageType.color}-100`}>
                  <StageIcon className={`w-5 h-5 text-${stageType.color}-600`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {stageType.name} Stage
                  </h2>
                  <p className="text-sm text-gray-600">{funnel?.funnel_name}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveStage}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" />
              Save Stage
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Stage Settings & Components */}
          <div className="w-80 bg-white border-r overflow-y-auto">
            {/* Stage Settings */}
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900 mb-4">Stage Content</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={stageData.headline}
                    onChange={(e) => setStageData({ ...stageData, headline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter headline..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subheadline
                  </label>
                  <textarea
                    value={stageData.subheadline}
                    onChange={(e) => setStageData({ ...stageData, subheadline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Supporting text..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={stageData.cta_text}
                    onChange={(e) => setStageData({ ...stageData, cta_text: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Get Started"
                  />
                </div>
              </div>
            </div>

            {/* Components */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Components</h3>
                </div>
                <button
                  onClick={() => setShowComponentSelector(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              <SortableContext items={sortedComponents.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sortedComponents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No components yet</p>
                      <button
                        onClick={() => setShowComponentSelector(true)}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                      >
                        Add your first component
                      </button>
                    </div>
                  ) : (
                    sortedComponents.map((comp) => (
                      <SortableComponentCard
                        key={comp.id}
                        instance={comp}
                        isSelected={selectedInstance?.id === comp.id}
                        onClick={() => setSelectedInstance(comp)}
                        onDelete={() => handleDeleteComponent(comp.id)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          </div>

          {/* Center: Preview */}
          <div className="flex-1 bg-gray-100">
            <PreviewPane
              viewMode={viewMode}
              pageData={{
                id: stageId,
                slug: `/funnel/${funnelId}/stage/${stageId}`,
                title: stageData.headline || 'Stage Preview',
                components: sortedComponents,
              }}
            />
          </div>

          {/* Right: Properties (when component selected) */}
          {selectedInstance && (
            <div className="w-80 bg-white border-l p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Component Properties</h3>
                <button
                  onClick={() => setSelectedInstance(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">{selectedInstance.component?.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedInstance.component?.category_name}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Order: {selectedInstance.sort_order}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component Selector Modal */}
      {showComponentSelector && (
        <ComponentSelector
          components={availableComponents}
          onAdd={handleAddComponent}
          onClose={() => setShowComponentSelector(false)}
        />
      )}
    </DndContext>
  );
}

export default FunnelStageEditor;
