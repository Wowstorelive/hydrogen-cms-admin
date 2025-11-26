import { useState } from 'react';
import {
  Monitor, Tablet, Smartphone,
  Sparkles, Save, Rocket, ArrowLeftRight
} from 'lucide-react';

/**
 * CMSTopToolbar Component
 * Top navigation bar with device switcher, Hydrogen/Liquid toggle, save status, and action buttons
 */
export function CMSTopToolbar({
  viewMode = 'desktop',
  onViewModeChange,
  storeMode = 'hydrogen',
  onStoreModeToggle,
  isSaving = false,
  onSave,
  onPublish,
  onAskAI,
  breadcrumbs = []
}) {
  const viewModes = [
    { id: 'desktop', icon: Monitor, label: 'Desktop', width: '1440px' },
    { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px' },
  ];

  return (
    <div className="h-14 border-b bg-white flex items-center justify-between px-6 shadow-sm">
      {/* Left: Logo & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          WowStore
        </div>
        {breadcrumbs.length > 0 && (
          <div className="text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {index > 0 && ' / '}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-900 font-medium">{crumb}</span>
                ) : (
                  crumb
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Center: View Switcher & Store Mode Toggle */}
      <div className="flex items-center gap-4">
        {/* Device View Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => onViewModeChange && onViewModeChange(mode.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md transition-all
                  ${viewMode === mode.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{mode.label}</span>
                <span className="text-xs text-gray-500">({mode.width})</span>
              </button>
            );
          })}
        </div>

        {/* Hydrogen/Liquid Toggle */}
        <button
          onClick={onStoreModeToggle}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
            ${storeMode === 'hydrogen'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-orange-50 border-orange-200 text-orange-700'
            }
          `}
          title={`Switch to ${storeMode === 'hydrogen' ? 'Liquid' : 'Hydrogen'} preview`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span className="text-sm font-medium">
            {storeMode === 'hydrogen' ? 'Hydrogen' : 'Liquid'}
          </span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Ask AI */}
        <button
          onClick={onAskAI}
          className="flex items-center gap-2 px-4 py-2 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Ask AI</span>
        </button>

        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
          <span>{isSaving ? 'Saving...' : 'Saved'}</span>
        </div>

        {/* Publish */}
        <button
          onClick={onPublish}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Rocket className="w-4 h-4" />
          <span className="text-sm font-medium">Publish</span>
        </button>

        {/* User Menu */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:shadow-lg transition-shadow">
          W
        </div>
      </div>
    </div>
  );
}

export default CMSTopToolbar;
