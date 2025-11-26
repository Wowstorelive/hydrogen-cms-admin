import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, Target, TrendingUp, Search } from 'lucide-react';
import { cmsAPI } from '../lib/api';

const SDGLibrary = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch all SDG goals
  const { data: sdgsData, isLoading } = useQuery({
    queryKey: ['sdgs'],
    queryFn: async () => {
      const response = await cmsAPI.sdgs.getAll();
      return response.data;
    },
  });

  const sdgs = sdgsData || [];

  // Filter SDGs by search
  const filteredSDGs = sdgs.filter(sdg =>
    sdg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sdg.official_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get SDG statistics
  const stats = {
    total: 17,
    environmental: sdgs.filter(s => [6, 7, 11, 12, 13, 14, 15].includes(s.id)).length,
    social: sdgs.filter(s => [1, 2, 3, 4, 5, 10, 16].includes(s.id)).length,
    economic: sdgs.filter(s => [8, 9, 17].includes(s.id)).length,
  };

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
        <div className="flex items-center gap-3 mb-2">
          <Globe size={28} />
          <h2 className="text-2xl font-bold">UN Sustainable Development Goals</h2>
        </div>
        <p className="text-blue-100">
          The 17 Global Goals for sustainable development adopted by all United Nations Member States
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total SDGs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Target className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Environmental</p>
              <p className="text-2xl font-bold text-green-600">{stats.environmental}</p>
            </div>
            <Globe className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Social</p>
              <p className="text-2xl font-bold text-purple-600">{stats.social}</p>
            </div>
            <TrendingUp className="text-purple-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Economic</p>
              <p className="text-2xl font-bold text-orange-600">{stats.economic}</p>
            </div>
            <Target className="text-orange-600" size={32} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search SDGs by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* SDG Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSDGs.map(sdg => (
          <div
            key={sdg.id}
            className="bg-white rounded-lg border hover:shadow-lg transition-all overflow-hidden"
          >
            {/* SDG Header with Color */}
            <div
              className="h-24 flex items-center justify-center text-white relative"
              style={{ backgroundColor: sdg.color }}
            >
              <div className="absolute top-2 left-2">
                <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-bold">
                  SDG {sdg.id}
                </span>
              </div>
              <div className="text-center">
                {sdg.icon_url && (
                  <img
                    src={sdg.icon_url}
                    alt={`SDG ${sdg.id}`}
                    className="h-16 w-16 mx-auto mb-2"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>

            {/* SDG Body */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{sdg.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">{sdg.official_description}</p>
              </div>

              {/* Category Badge */}
              <div className="flex items-center gap-2">
                {[6, 7, 11, 12, 13, 14, 15].includes(sdg.id) && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Environmental
                  </span>
                )}
                {[1, 2, 3, 4, 5, 10, 16].includes(sdg.id) && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                    Social
                  </span>
                )}
                {[8, 9, 17].includes(sdg.id) && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                    Economic
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSDGs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Search size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No SDGs found</h3>
          <p className="text-gray-600">Try adjusting your search query</p>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Globe size={18} className="text-blue-600" />
          About the SDGs
        </h4>
        <p className="text-sm text-blue-800 mb-3">
          The Sustainable Development Goals are a universal call to action to end poverty, protect the planet,
          and ensure that by 2030 all people enjoy peace and prosperity. WowStore aligns products and initiatives
          with these goals to maximize environmental and social impact.
        </p>
        <div className="text-xs text-blue-700">
          <strong>WowStore Focus:</strong> Primarily SDG 13 (Climate Action), SDG 14 (Life Below Water),
          and SDG 15 (Life on Land) - but all 17 goals are supported across the platform.
        </div>
      </div>
    </div>
  );
};

export default SDGLibrary;
