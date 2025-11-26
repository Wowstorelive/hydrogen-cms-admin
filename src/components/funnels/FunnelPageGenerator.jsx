import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsAPI } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  FileText, Zap, Check, Loader2, ChevronRight,
  ArrowRight, X, Settings, Sparkles, Target
} from 'lucide-react';

const STAGE_TYPES = [
  { type: 'landing', name: 'Landing', description: 'Welcome & Hook' },
  { type: 'story', name: 'Story', description: 'Brand Narrative' },
  { type: 'social_proof', name: 'Social Proof', description: 'Trust & Testimonials' },
  { type: 'offer', name: 'Offer', description: 'Product Showcase' },
  { type: 'urgency', name: 'Urgency', description: 'FOMO & Scarcity' },
  { type: 'thank_you', name: 'Thank You', description: 'Confirmation' },
];

/**
 * FunnelPageGenerator - Generate pages from funnel stages
 */
export function FunnelPageGenerator({ funnel, stages, onClose, onSuccess }) {
  const [selectedStages, setSelectedStages] = useState(
    stages.map(s => s.id)
  );
  const [pagePrefix, setPagePrefix] = useState(funnel.funnel_code || 'funnel');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [generatedPages, setGeneratedPages] = useState([]);

  const queryClient = useQueryClient();

  const createPageMutation = useMutation({
    mutationFn: (data) => cmsAPI.pages.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pages']);
    },
  });

  const createInstanceMutation = useMutation({
    mutationFn: (data) => cmsAPI.componentInstances.create(data),
  });

  const toggleStage = (stageId) => {
    setSelectedStages(prev =>
      prev.includes(stageId)
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  const selectAll = () => {
    setSelectedStages(stages.map(s => s.id));
  };

  const selectNone = () => {
    setSelectedStages([]);
  };

  const generatePages = async () => {
    if (selectedStages.length === 0) {
      toast.error('Please select at least one stage');
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: selectedStages.length });
    setGeneratedPages([]);

    const results = [];

    for (let i = 0; i < selectedStages.length; i++) {
      const stageId = selectedStages[i];
      const stage = stages.find(s => s.id === stageId);
      const stageType = STAGE_TYPES.find(st => st.type === stage?.stage_type);

      if (!stage) continue;

      setProgress({ current: i + 1, total: selectedStages.length });

      try {
        // Create the page
        const slug = `${pagePrefix}-${stage.stage_type}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const pageTitle = `${funnel.funnel_name} - ${stageType?.name || stage.stage_type}`;

        const pageResponse = await createPageMutation.mutateAsync({
          title: pageTitle,
          slug: slug,
          status: 'draft',
          github_path: `app/routes/${slug}.jsx`,
        });

        const newPage = pageResponse.data?.[0] || pageResponse.data;

        // Copy components from stage to page
        if (stage.components && stage.components.length > 0) {
          for (let j = 0; j < stage.components.length; j++) {
            const stageComp = stage.components[j];
            await createInstanceMutation.mutateAsync({
              page_id: newPage.id,
              component_id: stageComp.component?.id || stageComp.component_id,
              sort_order: j + 1,
              props_override: stageComp.props_override || {},
            });
          }
        }

        results.push({
          stageType: stage.stage_type,
          stageName: stageType?.name || stage.stage_type,
          pageId: newPage.id,
          pageSlug: slug,
          pageTitle: pageTitle,
          componentCount: stage.components?.length || 0,
          success: true,
        });

      } catch (error) {
        console.error('Failed to generate page for stage:', stage.stage_type, error);
        results.push({
          stageType: stage.stage_type,
          stageName: stageType?.name || stage.stage_type,
          success: false,
          error: error.message,
        });
      }

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setGeneratedPages(results);
    setGenerating(false);

    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      toast.success(`Generated ${successCount} page${successCount !== 1 ? 's' : ''} successfully!`);
      onSuccess?.();
    }
  };

  const successfulPages = generatedPages.filter(p => p.success);
  const failedPages = generatedPages.filter(p => !p.success);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Generate Pages</h2>
                <p className="text-sm text-gray-600">
                  Create pages from funnel stages for {funnel.funnel_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {generatedPages.length === 0 ? (
            <div className="space-y-6">
              {/* Page Prefix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page URL Prefix
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">/</span>
                  <input
                    type="text"
                    value={pagePrefix}
                    onChange={(e) => setPagePrefix(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="funnel-name"
                  />
                  <span className="text-gray-500">-[stage]</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Example: /{pagePrefix}-landing, /{pagePrefix}-story, etc.
                </p>
              </div>

              {/* Stage Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Select Stages to Generate
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-purple-600 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={selectNone}
                      className="text-xs text-gray-600 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {stages.map((stage, index) => {
                    const stageType = STAGE_TYPES.find(st => st.type === stage.stage_type);
                    const isSelected = selectedStages.includes(stage.id);

                    return (
                      <div
                        key={stage.id}
                        onClick={() => toggleStage(stage.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {stageType?.name || stage.stage_type}
                            </p>
                            <p className="text-xs text-gray-500">
                              {stage.components?.length || 0} components • {stage.headline || 'No headline'}
                            </p>
                          </div>
                        </div>

                        <div className="ml-auto">
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>

                        <div className="text-right text-xs text-gray-500">
                          /{pagePrefix}-{stage.stage_type}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Results view
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    Generated {successfulPages.length} page{successfulPages.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-green-700">
                    Pages are now available in the Pages section
                  </p>
                </div>
              </div>

              {successfulPages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Successfully Created:</h4>
                  {successfulPages.map((page, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{page.pageTitle}</p>
                        <p className="text-xs text-gray-500">
                          /{page.pageSlug} • {page.componentCount} components
                        </p>
                      </div>
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              )}

              {failedPages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-700">Failed:</h4>
                  {failedPages.map((page, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <X className="w-5 h-5 text-red-600" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900">{page.stageName}</p>
                        <p className="text-xs text-red-600">{page.error}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {generating ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              <span className="text-gray-600">
                Generating page {progress.current} of {progress.total}...
              </span>
            </div>
          ) : generatedPages.length > 0 ? (
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {selectedStages.length} stage{selectedStages.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePages}
                  disabled={selectedStages.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Pages
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FunnelPageGenerator;
