import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Edit, Trash2, Eye, Copy, TrendingUp, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { cmsAPI } from '../lib/api';
import FunnelBuilder from './FunnelBuilder';

const FunnelManager = () => {
  const [selectedFunnel, setSelectedFunnel] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all funnels
  const { data: funnelsData, isLoading } = useQuery({
    queryKey: ['funnels'],
    queryFn: async () => {
      const response = await cmsAPI.funnels.getAll();
      return response.data;
    },
  });

  const funnels = funnelsData || [];

  // Delete funnel mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => cmsAPI.funnels.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['funnels']);
      toast.success('Funnel deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete funnel');
    },
  });

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (funnel) => {
    setSelectedFunnel(funnel);
    setShowBuilder(true);
  };

  const handleCreate = () => {
    setSelectedFunnel(null);
    setShowBuilder(true);
  };

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setSelectedFunnel(null);
  };

  if (showBuilder) {
    return <FunnelBuilder funnel={selectedFunnel} onClose={handleCloseBuilder} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap size={28} />
              <h2 className="text-2xl font-bold">Funnel System</h2>
            </div>
            <p className="text-blue-100">
              {funnels.length} conversion funnels | Award-winning AI-powered system
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition font-medium"
          >
            <Plus size={20} />
            Create Funnel
          </button>
        </div>
      </div>

      {/* Funnels Grid */}
      {funnels.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Zap size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No funnels yet</h3>
          <p className="text-gray-600 mb-4">Create your first conversion funnel to get started</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Create Your First Funnel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funnels.map((funnel) => (
            <div
              key={funnel.id}
              className="bg-white rounded-lg border hover:border-purple-300 hover:shadow-lg transition-all"
            >
              {/* Funnel Header */}
              <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{funnel.funnel_name}</h3>
                    <code className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      /funnels/{funnel.funnel_code}
                    </code>
                  </div>
                  {funnel.is_active && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Funnel Body */}
              <div className="p-4 space-y-3">
                {funnel.target_audience && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Target Audience:</p>
                    <p className="text-sm text-gray-700">{funnel.target_audience}</p>
                  </div>
                )}

                {funnel.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{funnel.description}</p>
                )}

                {/* Funnel Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Layers size={14} />
                    <span>6 stages</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    <span className="text-green-600 font-medium">+195% avg lift</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t bg-gray-50 flex gap-2">
                <button
                  onClick={() => handleEdit(funnel)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm"
                  title="Preview"
                >
                  <Eye size={16} />
                </button>
                <button
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm"
                  title="Duplicate"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleDelete(funnel.id, funnel.funnel_name)}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Zap size={18} className="text-blue-600" />
          About the Funnel System
        </h4>
        <p className="text-sm text-blue-800">
          Each funnel consists of 6 optimized stages: Landing, Story, Social Proof, Offer, Urgency, and Thank You.
          Select appropriate components for each stage to maximize conversions. The AI system personalizes content
          based on your target audience.
        </p>
      </div>
    </div>
  );
};

export default FunnelManager;
