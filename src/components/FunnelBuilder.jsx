import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Layers, Plus, X, Search, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cmsAPI } from '../lib/api';

const STAGE_TYPES = [
  { type: 'landing', name: 'Landing', description: 'Welcome & Hook', defaultHeadline: 'Welcome' },
  { type: 'story', name: 'Story', description: 'Brand Narrative', defaultHeadline: 'Our Story' },
  { type: 'social_proof', name: 'Social Proof', description: 'Trust & Testimonials', defaultHeadline: 'Customer Love' },
  { type: 'offer', name: 'Offer', description: 'Product Showcase', defaultHeadline: 'Shop the Collection' },
  { type: 'urgency', name: 'Urgency', description: 'FOMO & Scarcity', defaultHeadline: 'Limited Time Offer' },
  { type: 'thank_you', name: 'Thank You', description: 'Confirmation & Next Steps', defaultHeadline: 'Thank You!' },
];

const STAGE_COMPONENT_FILTERS = {
  landing: ['Hero Sections'],
  story: ['Content Blocks'],
  social_proof: ['Social & Reviews', 'Conversion Boosters'],
  offer: ['Product Displays'],
  urgency: ['Conversion Boosters'],
  thank_you: ['Post-Purchase'],
};

const FunnelBuilder = ({ funnel, onClose }) => {
  const [formData, setFormData] = useState({
    funnel_name: '',
    funnel_code: '',
    target_audience: '',
    description: '',
    is_active: true,
  });
  const [stages, setStages] = useState([]);
  const [expandedStage, setExpandedStage] = useState(null);
  const queryClient = useQueryClient();

  // Load funnel data if editing
  useEffect(() => {
    if (funnel) {
      setFormData({
        funnel_name: funnel.funnel_name || '',
        funnel_code: funnel.funnel_code || '',
        target_audience: funnel.target_audience || '',
        description: funnel.description || '',
        is_active: funnel.is_active !== undefined ? funnel.is_active : true,
      });
      loadFunnelStages(funnel.id);
    } else {
      // Initialize with all 6 stages for new funnel
      setStages(STAGE_TYPES.map((st, idx) => ({
        stage_type: st.type,
        stage_name: st.description,
        headline: st.defaultHeadline,
        subheadline: '',
        sort_order: idx + 1,
        components: [],
      })));
    }
  }, [funnel]);

  const loadFunnelStages = async (funnelId) => {
    try {
      const response = await cmsAPI.funnels.getWithStages(funnelId);
      const loadedStages = response.data || [];
      setStages(loadedStages.map(stage => ({
        id: stage.id,
        stage_type: stage.stage_type,
        stage_name: stage.stage_name,
        headline: stage.headline,
        subheadline: stage.subheadline,
        sort_order: stage.sort_order,
        components: stage.components || [],
      })));
    } catch (error) {
      toast.error('Failed to load funnel stages');
      console.error(error);
    }
  };

  // Fetch all components for selection
  const { data: componentsData } = useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      const response = await cmsAPI.components.getAll();
      return response.data;
    },
  });

  const components = componentsData || [];

  // Auto-generate code from name
  const handleNameChange = (value) => {
    setFormData(prev => ({
      ...prev,
      funnel_name: value,
      funnel_code: prev.funnel_code || value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }));
  };

  // Save funnel mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      let funnelId;

      // Create or update funnel
      if (funnel?.id) {
        await cmsAPI.funnels.update(funnel.id, formData);
        funnelId = funnel.id;
      } else {
        const response = await cmsAPI.funnels.create(formData);
        funnelId = response.data[0].id;
      }

      // Save stages
      for (const stage of stages) {
        let stageId;

        if (stage.id) {
          // Update existing stage
          await cmsAPI.funnelStages.update(stage.id, {
            stage_name: stage.stage_name,
            headline: stage.headline,
            subheadline: stage.subheadline,
            sort_order: stage.sort_order,
          });
          stageId = stage.id;
        } else {
          // Create new stage
          const stageResponse = await cmsAPI.funnelStages.create({
            funnel_id: funnelId,
            stage_type: stage.stage_type,
            stage_name: stage.stage_name,
            headline: stage.headline,
            subheadline: stage.subheadline,
            sort_order: stage.sort_order,
          });
          stageId = stageResponse.data[0].id;
        }

        // Delete old component mappings and create new ones
        // (For simplicity, we'll handle component management in a future iteration)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['funnels']);
      toast.success('Funnel saved successfully!');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to save funnel');
      console.error(error);
    },
  });

  const handleSave = () => {
    if (!formData.funnel_name) {
      toast.error('Please enter a funnel name');
      return;
    }
    if (!formData.funnel_code) {
      toast.error('Please enter a funnel code');
      return;
    }
    saveMutation.mutate();
  };

  const updateStage = (index, field, value) => {
    setStages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleStageExpanded = (index) => {
    setExpandedStage(expandedStage === index ? null : index);
  };

  const getFilteredComponents = (stageType) => {
    const allowedCategories = STAGE_COMPONENT_FILTERS[stageType] || [];
    return components.filter(c =>
      c.category && allowedCategories.includes(c.category.name)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Funnels
        </button>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Save size={20} />
          {saveMutation.isPending ? 'Saving...' : 'Save Funnel'}
        </button>
      </div>

      {/* Funnel Info Form */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Funnel Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funnel Name *
            </label>
            <input
              type="text"
              value={formData.funnel_name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Winter Sale 2025"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funnel Code * <span className="text-gray-500 text-xs">(URL slug)</span>
            </label>
            <input
              type="text"
              value={formData.funnel_code}
              onChange={(e) => setFormData(prev => ({ ...prev, funnel_code: e.target.value }))}
              placeholder="winter-sale-2025"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
          </label>
          <input
            type="text"
            value={formData.target_audience}
            onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
            placeholder="e.g., First-time visitors interested in sustainable fashion"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this funnel's purpose and goals"
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">
            Active (visible on storefront)
          </label>
        </div>
      </div>

      {/* Stages Builder */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Layers className="text-purple-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Funnel Stages (6)</h3>
        </div>

        <div className="space-y-4">
          {stages.map((stage, index) => {
            const stageType = STAGE_TYPES.find(st => st.type === stage.stage_type);
            const isExpanded = expandedStage === index;
            const availableComponents = getFilteredComponents(stage.stage_type);

            return (
              <div key={index} className="border rounded-lg overflow-hidden">
                {/* Stage Header */}
                <div
                  className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleStageExpanded(index)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full font-semibold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{stageType.name}</h4>
                      <p className="text-sm text-gray-500">{stage.headline || stageType.defaultHeadline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {stage.components.length} component{stage.components.length !== 1 ? 's' : ''}
                    </span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Stage Content (Expandable) */}
                {isExpanded && (
                  <div className="p-4 space-y-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Headline
                        </label>
                        <input
                          type="text"
                          value={stage.headline}
                          onChange={(e) => updateStage(index, 'headline', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subheadline
                        </label>
                        <input
                          type="text"
                          value={stage.subheadline}
                          onChange={(e) => updateStage(index, 'subheadline', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    {/* Component Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Components ({availableComponents.length})
                      </label>
                      {availableComponents.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No components available for this stage type</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {availableComponents.map(comp => (
                            <div
                              key={comp.id}
                              className="p-3 border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition cursor-pointer text-sm"
                            >
                              <p className="font-medium text-gray-900 text-xs mb-1">{comp.name}</p>
                              <p className="text-xs text-gray-500">{comp.category?.name}</p>
                              {comp.avg_conversion_lift > 0 && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                  +{comp.avg_conversion_lift}%
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Click a component to add it to this stage (full functionality coming soon)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FunnelBuilder;
