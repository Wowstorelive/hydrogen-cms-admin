import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsAPI } from '../../lib/api';
import { PreviewPane } from '../preview/PreviewPane';
import { FunnelPageGenerator } from './FunnelPageGenerator';
import { FunnelAnalytics } from './FunnelAnalytics';
import toast from 'react-hot-toast';
import {
  ArrowRight, Eye, Edit, TrendingUp, TrendingDown,
  Users, Target, Zap, CheckCircle, Save, ArrowLeft, Play,
  FileText, Sparkles, BarChart3
} from 'lucide-react';

/**
 * Stage types with metadata
 */
const STAGE_TYPES = [
  {
    type: 'landing',
    name: 'Landing',
    description: 'Welcome & Hook',
    icon: Zap,
    color: 'blue',
    defaultConversion: 75
  },
  {
    type: 'story',
    name: 'Story',
    description: 'Brand Narrative',
    icon: Target,
    color: 'purple',
    defaultConversion: 65
  },
  {
    type: 'social_proof',
    name: 'Social Proof',
    description: 'Trust & Testimonials',
    icon: Users,
    color: 'green',
    defaultConversion: 80
  },
  {
    type: 'offer',
    name: 'Offer',
    description: 'Product Showcase',
    icon: Target,
    color: 'orange',
    defaultConversion: 70
  },
  {
    type: 'urgency',
    name: 'Urgency',
    description: 'FOMO & Scarcity',
    icon: TrendingUp,
    color: 'red',
    defaultConversion: 85
  },
  {
    type: 'thank_you',
    name: 'Thank You',
    description: 'Confirmation',
    icon: CheckCircle,
    color: 'green',
    defaultConversion: 100
  },
];

/**
 * FunnelStageCard - Individual stage card in the flow
 */
function FunnelStageCard({ stage, index, isSelected, onSelect, onEdit, onPreview, metrics }) {
  const stageType = STAGE_TYPES.find(st => st.type === stage.stage_type) || STAGE_TYPES[0];
  const Icon = stageType.icon;
  const conversion = metrics?.conversion_rate || stageType.defaultConversion;
  const visitors = metrics?.visitors || 1000 - (index * 150);
  const dropoff = 100 - conversion;

  const colorClasses = {
    blue: 'border-blue-300 bg-blue-50 text-blue-700',
    purple: 'border-purple-300 bg-purple-50 text-purple-700',
    green: 'border-green-300 bg-green-50 text-green-700',
    orange: 'border-orange-300 bg-orange-50 text-orange-700',
    red: 'border-red-300 bg-red-50 text-red-700',
  };

  const colorClass = colorClasses[stageType.color] || colorClasses.blue;

  return (
    <div
      className={`relative bg-white rounded-lg border-2 transition-all cursor-pointer ${
        isSelected ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
      onClick={() => onSelect(stage, index)}
    >
      {/* Stage Header */}
      <div className={`px-4 py-3 border-b-2 ${colorClass}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <span className="font-semibold text-sm">Stage {index + 1}</span>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-white rounded-full">
            {stageType.name}
          </span>
        </div>
        <p className="text-xs opacity-80">{stageType.description}</p>
      </div>

      {/* Stage Body */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-2">{stage.headline || stageType.name}</h4>
        {stage.subheadline && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{stage.subheadline}</p>
        )}

        {/* Metrics */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Visitors</span>
            <span className="font-semibold text-gray-900">{visitors.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Conversion</span>
            <span className="font-semibold text-green-600">{conversion}%</span>
          </div>
          {dropoff > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Drop-off</span>
              <span className="font-semibold text-red-600 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {dropoff}%
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
              style={{ width: `${conversion}%` }}
            />
          </div>
        </div>

        {/* Components Count */}
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {stage.components?.length || 0} components
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(stage, index);
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(stage, index);
            }}
            className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

/**
 * FunnelFlowDiagram - Visual representation of funnel flow
 */
function FunnelFlowDiagram({ stages, selectedStageIndex, onStageClick }) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        Funnel Flow
      </h3>

      <div className="flex items-center justify-center flex-wrap gap-2">
        {stages.map((stage, index) => {
          const stageType = STAGE_TYPES.find(st => st.type === stage.stage_type) || STAGE_TYPES[0];
          const Icon = stageType.icon;
          const isSelected = selectedStageIndex === index;

          return (
            <React.Fragment key={stage.id || index}>
              {/* Stage Button */}
              <button
                onClick={() => onStageClick(stage, index)}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{stageType.name}</span>
                <span className="text-xs opacity-75">
                  {stage.components?.length || 0} comp
                </span>
              </button>

              {/* Arrow */}
              {index < stages.length - 1 && (
                <ArrowRight className="w-5 h-5 text-gray-400" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Funnel Metrics Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 font-medium mb-1">Total Visitors</p>
          <p className="text-2xl font-bold text-blue-900">1,000</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 font-medium mb-1">Conversions</p>
          <p className="text-2xl font-bold text-green-900">680</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-600 font-medium mb-1">Avg Conversion</p>
          <p className="text-2xl font-bold text-purple-900">68%</p>
        </div>
      </div>
    </div>
  );
}

/**
 * FunnelVisualBuilder - Main visual funnel editor
 */
export function FunnelVisualBuilder() {
  const { funnelId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [viewMode, setViewMode] = useState('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [showPageGenerator, setShowPageGenerator] = useState(false);
  const [activeTab, setActiveTab] = useState('stages'); // 'stages' or 'analytics'

  // Fetch funnel details
  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['funnel', funnelId],
    queryFn: async () => {
      const response = await cmsAPI.funnels.getById(funnelId);
      return response.data;
    },
    enabled: !!funnelId,
  });

  // Fetch funnel stages
  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['funnelStages', funnelId],
    queryFn: async () => {
      const response = await cmsAPI.funnels.getWithStages(funnelId);
      return response.data || [];
    },
    enabled: !!funnelId,
  });

  // Select first stage by default
  useEffect(() => {
    if (stages.length > 0 && !selectedStage) {
      setSelectedStage(stages[0]);
      setSelectedStageIndex(0);
    }
  }, [stages, selectedStage]);

  const handleStageSelect = (stage, index) => {
    setSelectedStage(stage);
    setSelectedStageIndex(index);
    setShowPreview(false);
  };

  const handleStageEdit = (stage, index) => {
    // Navigate to stage editor
    navigate(`/funnels/${funnelId}/stages/${stage.id}/edit`);
  };

  const handleStagePreview = (stage, index) => {
    setSelectedStage(stage);
    setSelectedStageIndex(index);
    setShowPreview(true);
  };

  const handleTestFunnel = () => {
    // Open funnel in new tab
    window.open(`/funnels/${funnel.funnel_code}`, '_blank');
    toast.success('Opening funnel in new tab...');
  };

  if (funnelLoading || stagesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading funnel...</p>
        </div>
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Funnel not found</p>
          <button
            onClick={() => navigate('/funnels')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Funnels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/funnels')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{funnel.funnel_name}</h2>
              <p className="text-sm text-gray-600">
                {stages.length} stages • {funnel.target_audience}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-6">
              <button
                onClick={() => setActiveTab('stages')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'stages'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="w-4 h-4" />
                Stages
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'analytics'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPageGenerator(true)}
              className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition"
            >
              <Sparkles className="w-4 h-4" />
              Generate Pages
            </button>
            <button
              onClick={handleTestFunnel}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Play className="w-4 h-4" />
              Test Funnel
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'analytics' ? (
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <FunnelAnalytics funnelId={funnelId} />
          </div>
        ) : (
        <>
        {/* Left: Stages Grid */}
        <div className="w-1/3 bg-gray-50 border-r overflow-y-auto p-6">
          <div className="space-y-4">
            <FunnelFlowDiagram
              stages={stages}
              selectedStageIndex={selectedStageIndex}
              onStageClick={handleStageSelect}
            />

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Funnel Stages</h3>
              {stages.map((stage, index) => (
                <FunnelStageCard
                  key={stage.id || index}
                  stage={stage}
                  index={index}
                  isSelected={selectedStageIndex === index}
                  onSelect={handleStageSelect}
                  onEdit={handleStageEdit}
                  onPreview={handleStagePreview}
                  metrics={stage.metrics}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview Pane */}
        <div className="flex-1 bg-gray-100">
          {showPreview && selectedStage ? (
            <PreviewPane
              viewMode={viewMode}
              pageData={{
                id: selectedStage.id,
                slug: `/funnels/${funnel.funnel_code}/stage/${selectedStageIndex + 1}`,
                title: selectedStage.headline,
                components: selectedStage.components || [],
                previewUrl: `/preview/funnel/${funnelId}/stage/${selectedStage.id}`,
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Stage Preview
                </h3>
                <p className="text-gray-600 mb-4">
                  Select a stage and click "Preview" to see how it looks
                </p>
                <button
                  onClick={() => selectedStage && handleStagePreview(selectedStage, selectedStageIndex)}
                  disabled={!selectedStage}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview Selected Stage
                </button>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* Page Generator Modal */}
      {showPageGenerator && funnel && (
        <FunnelPageGenerator
          funnel={funnel}
          stages={stages}
          onClose={() => setShowPageGenerator(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['pages']);
            toast.success('Pages generated! Check the Pages section.');
          }}
        />
      )}
    </div>
  );
}

export default FunnelVisualBuilder;
