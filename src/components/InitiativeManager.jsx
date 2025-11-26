import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Plus, Edit, Trash2, Calendar, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { cmsAPI } from '../lib/api';

// SDG_OPTIONS removed - now fetched from API

const InitiativeManager = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const queryClient = useQueryClient();

  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Fetch initiatives
  const { data: initiativesData, isLoading } = useQuery({
    queryKey: ['initiatives'],
    queryFn: async () => {
      const response = await cmsAPI.initiatives.getAll();
      return response.data;
    },
  });

  // Fetch all SDGs for display
  const { data: sdgsData } = useQuery({
    queryKey: ['sdgs'],
    queryFn: async () => {
      const response = await cmsAPI.sdgs.getAll();
      return response.data;
    },
  });

  const initiatives = initiativesData || [];
  const allSDGs = sdgsData || [];
  const monthInitiatives = initiatives.filter(i => i.display_month === selectedMonth);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => cmsAPI.initiatives.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['initiatives']);
      toast.success('Initiative deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete initiative');
    },
  });

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (initiative) => {
    setEditingInitiative(initiative);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingInitiative(null);
    setShowForm(true);
  };

  if (showForm) {
    return <InitiativeForm initiative={editingInitiative} month={selectedMonth} onClose={() => setShowForm(false)} />;
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
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart size={28} />
              <h2 className="text-2xl font-bold">Conservation Initiatives</h2>
            </div>
            <p className="text-blue-100">
              {initiatives.length} total initiatives | Virtue Integration powered
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition font-medium"
          >
            <Plus size={20} />
            Add Initiative
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-lg border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="text-gray-500" size={20} />
          <span className="font-medium text-gray-700">Display Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-sm text-gray-600">
          {monthInitiatives.length} active initiative{monthInitiatives.length !== 1 ? 's' : ''} this month
        </div>
      </div>

      {/* Initiatives Grid */}
      {monthInitiatives.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Heart size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No initiatives for {selectedMonth}</h3>
          <p className="text-gray-600 mb-4">Add conservation initiatives to display in the Virtue widget</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add Initiative
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {monthInitiatives.sort((a, b) => a.sort_order - b.sort_order).map((initiative, index) => (
            <div
              key={initiative.id}
              className="bg-white rounded-lg border hover:border-blue-300 hover:shadow-lg transition-all"
            >
              {/* Initiative Header */}
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
                <div className="flex items-start justify-between mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Initiative #{index + 1}
                  </span>
                  {initiative.is_active && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{initiative.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{initiative.organization}</p>
              </div>

              {/* Initiative Body */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-700 line-clamp-3">{initiative.description}</p>

                {/* Impact Metric */}
                {initiative.impact_metric && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Impact per purchase:</p>
                    <p className="text-lg font-semibold text-green-600">
                      {initiative.impact_value} {initiative.impact_metric}
                    </p>
                  </div>
                )}

                {/* SDG Badges */}
                {initiative.sdg_goals && initiative.sdg_goals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {initiative.sdg_goals.map(sdgNum => {
                      const sdg = allSDGs.find(s => s.id === sdgNum);
                      return sdg ? (
                        <span
                          key={sdgNum}
                          className="text-white text-xs px-2 py-1 rounded font-medium"
                          style={{ backgroundColor: sdg.color }}
                        >
                          SDG {sdg.id}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t bg-gray-50 flex gap-2">
                <button
                  onClick={() => handleEdit(initiative)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(initiative.id, initiative.name)}
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
          <Globe size={18} className="text-blue-600" />
          About Conservation Initiatives
        </h4>
        <p className="text-sm text-blue-800">
          Display up to 3 active initiatives per month in the Virtue widget at checkout. Customers can choose
          which initiative their purchase supports. Impact is tracked and displayed in the order confirmation.
        </p>
      </div>
    </div>
  );
};

// Initiative Form Component
const InitiativeForm = ({ initiative, month, onClose }) => {
  const [formData, setFormData] = useState({
    name: initiative?.name || '',
    organization: initiative?.organization || '',
    description: initiative?.description || '',
    sdg_goals: initiative?.sdg_goals || [],
    impact_metric: initiative?.impact_metric || '',
    impact_value: initiative?.impact_value || '',
    display_month: initiative?.display_month || month,
    sort_order: initiative?.sort_order || 1,
    is_active: initiative?.is_active !== undefined ? initiative.is_active : true,
  });

  const queryClient = useQueryClient();

  // Fetch all 17 SDGs from API
  const { data: sdgsData } = useQuery({
    queryKey: ['sdgs'],
    queryFn: async () => {
      const response = await cmsAPI.sdgs.getAll();
      return response.data;
    },
  });

  const allSDGs = sdgsData || [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = {
        ...formData,
        impact_value: parseFloat(formData.impact_value) || 0,
      };

      if (initiative?.id) {
        return cmsAPI.initiatives.update(initiative.id, data);
      } else {
        return cmsAPI.initiatives.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['initiatives']);
      toast.success('Initiative saved successfully!');
      onClose();
    },
    onError: () => {
      toast.error('Failed to save initiative');
    },
  });

  const handleSave = () => {
    if (!formData.name || !formData.organization) {
      toast.error('Name and organization are required');
      return;
    }
    saveMutation.mutate();
  };

  const toggleSDG = (sdgNumber) => {
    setFormData(prev => ({
      ...prev,
      sdg_goals: prev.sdg_goals.includes(sdgNumber)
        ? prev.sdg_goals.filter(n => n !== sdgNumber)
        : [...prev.sdg_goals, sdgNumber],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {initiative ? 'Edit Initiative' : 'New Initiative'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <Plus size={24} className="rotate-45" />
        </button>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initiative Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Ocean Plastic Cleanup"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization *
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
              placeholder="e.g., Ocean Conservancy"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the initiative and its impact"
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Impact Metric
            </label>
            <input
              type="text"
              value={formData.impact_metric}
              onChange={(e) => setFormData(prev => ({ ...prev, impact_metric: e.target.value }))}
              placeholder="e.g., kg of plastic removed"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Impact Value (per purchase)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.impact_value}
              onChange={(e) => setFormData(prev => ({ ...prev, impact_value: e.target.value }))}
              placeholder="2.5"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UN SDG Goals ({formData.sdg_goals.length} selected)
          </label>
          <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
            {allSDGs.map(sdg => (
              <label
                key={sdg.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
                  formData.sdg_goals.includes(sdg.id)
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.sdg_goals.includes(sdg.id)}
                  onChange={() => toggleSDG(sdg.id)}
                  className="rounded"
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: sdg.color }}
                />
                <div className="flex-1">
                  <span className="font-medium text-sm">SDG {sdg.id}:</span>
                  <span className="text-sm ml-1">{sdg.name}</span>
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select all SDGs that this initiative supports. WowStore primarily focuses on SDG 13, 14, and 15.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Month
            </label>
            <input
              type="month"
              value={formData.display_month}
              onChange={(e) => setFormData(prev => ({ ...prev, display_month: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 1 }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            Active (visible in Virtue widget)
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Initiative'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitiativeManager;
