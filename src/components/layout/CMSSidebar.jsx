import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText, Layout, Component as ComponentIcon,
  Settings, Code, Plus, ChevronRight, Github
} from 'lucide-react';

/**
 * CMSSidebar Component
 * Left navigation sidebar with collapsible sections
 */
export function CMSSidebar({ onNewPage }) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState(['pages']);

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Layout,
      href: '/',
      exact: true
    },
    {
      id: 'pages',
      label: 'Pages',
      icon: FileText,
      href: '/pages',
      children: [
        { id: 'all-pages', label: 'All Pages', href: '/pages' },
        { id: 'new-page', label: 'Create New', href: '/pages/new' },
      ],
    },
    {
      id: 'components',
      label: 'Component Library',
      icon: ComponentIcon,
      href: '/components',
    },
    {
      id: 'funnels',
      label: 'Funnels',
      icon: Layout,
      href: '/funnels',
    },
    {
      id: 'sdgs',
      label: 'SDG Library',
      icon: Layout,
      href: '/sdgs',
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: Settings,
      href: '/workflows',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      children: [
        { id: 'github-settings', label: 'GitHub', href: '/settings/github', icon: Github },
      ],
    },
  ];

  const toggleSection = (id) => {
    setExpandedSections(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const isActive = (href, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const renderSidebarItem = (item, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const Icon = item.icon;
    const active = isActive(item.href, item.exact);

    return (
      <div key={item.id}>
        {hasChildren ? (
          <button
            onClick={() => toggleSection(item.id)}
            className={`
              w-full flex items-center justify-between px-4 py-2 text-left
              hover:bg-gray-100 transition-colors rounded-lg group
              ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
              ${depth > 0 ? 'ml-4' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="w-4 h-4" />}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>
        ) : (
          <Link
            to={item.href}
            className={`
              flex items-center gap-3 px-4 py-2
              hover:bg-gray-100 transition-colors rounded-lg group
              ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
              ${depth > 0 ? 'ml-4' : ''}
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {!Icon && depth > 0 && (
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            )}
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        )}

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children.map(child => renderSidebarItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white border-r h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <button
          onClick={onNewPage}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Page</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {sidebarItems.map(item => renderSidebarItem(item))}
      </div>

      {/* Footer: Ocean Conservation */}
      <div className="p-4 border-t bg-blue-50">
        <div className="flex items-start gap-2">
          <div className="text-2xl">🌊</div>
          <div>
            <p className="text-sm font-medium text-blue-900">Ocean Conservation</p>
            <p className="text-xs text-blue-700 mt-1">
              Every page you create helps save our oceans
            </p>
          </div>
        </div>
      </div>

      {/* Code Editor Button */}
      <div className="p-4 border-t">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Code className="w-4 h-4" />
          <span className="text-sm font-medium">Edit Code</span>
        </button>
      </div>
    </div>
  );
}

export default CMSSidebar;
