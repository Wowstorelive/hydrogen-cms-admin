import React from 'react';
import { FileText, Home, ShoppingBag, Grid, BookOpen, X } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Page',
    icon: FileText,
    description: 'Start from scratch with an empty page',
    color: 'gray',
  },
  {
    id: 'homepage',
    name: 'Homepage',
    icon: Home,
    description: 'Hero section, features, testimonials, and CTA',
    color: 'blue',
  },
  {
    id: 'product',
    name: 'Product Page',
    icon: ShoppingBag,
    description: 'Product gallery, details, and reviews',
    color: 'green',
  },
  {
    id: 'collection',
    name: 'Collection',
    icon: Grid,
    description: 'Product grid with filters and sorting',
    color: 'purple',
  },
  {
    id: 'blog',
    name: 'Blog Post',
    icon: BookOpen,
    description: 'Article layout with content and sidebar',
    color: 'orange',
  },
];

const colorClasses = {
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200 hover:border-gray-400',
    icon: 'text-gray-600',
    iconBg: 'bg-gray-100',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200 hover:border-blue-500',
    icon: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200 hover:border-green-500',
    icon: 'text-green-600',
    iconBg: 'bg-green-100',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200 hover:border-purple-500',
    icon: 'text-purple-600',
    iconBg: 'bg-purple-100',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200 hover:border-orange-500',
    icon: 'text-orange-600',
    iconBg: 'bg-orange-100',
  },
};

export function TemplateSelector({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
              <p className="text-gray-600 mt-1">Select a starting point for your new page</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((template) => {
              const Icon = template.icon;
              const colors = colorClasses[template.color];

              return (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className={`group p-6 border-2 rounded-xl ${colors.border} ${colors.bg} transition-all hover:shadow-lg text-left`}
                >
                  <div className={`w-16 h-16 ${colors.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 ${colors.icon}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {template.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              💡 Tip: You can customize any template with 65+ components after creation
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
