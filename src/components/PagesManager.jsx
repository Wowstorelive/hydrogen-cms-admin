import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { cmsAPI } from '../lib/api';
import { RichTextEditor } from './RichTextEditor';
import { PageBuilder } from './PageBuilder';
import { TemplateSelector } from './pages/TemplateSelector';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Save, X, Eye, Layout, Code } from 'lucide-react';

export const PagesManager = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [showPageBuilder, setShowPageBuilder] = useState(false);
  const [builderPage, setBuilderPage] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-open template selector when navigating to /pages/new
  useEffect(() => {
    if (location.pathname === '/pages/new') {
      setShowTemplateSelector(true);
    }
  }, [location.pathname]);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => (await cmsAPI.pages.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => cmsAPI.pages.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pages']);
      toast.success('Page created successfully!');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create page');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => cmsAPI.pages.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pages']);
      toast.success('Page updated successfully!');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update page');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => cmsAPI.pages.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pages']);
      toast.success('Page deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete page');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      status: page.status,
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
    });
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingPage(null);
    setShowPageBuilder(false);
    setBuilderPage(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      status: 'draft',
      meta_title: '',
      meta_description: '',
    });
  };

  const handleOpenPageBuilder = (page) => {
    setBuilderPage(page);
    setShowPageBuilder(true);
  };

  const handleShowTemplateSelector = () => {
    setShowTemplateSelector(true);
  };

  const handleTemplateSelect = async (template) => {
    try {
      const timestamp = Date.now();
      const templateTitles = {
        blank: 'Untitled Page',
        homepage: 'Homepage',
        product: 'Product Page',
        collection: 'Collection Page',
        blog: 'Blog Post',
      };

      const newPage = await createMutation.mutateAsync({
        title: templateTitles[template.id] || 'New Page',
        slug: `${template.id}-${timestamp}`,
        status: 'draft',
        content: `<!-- Template: ${template.name} -->`,
        meta_title: '',
        meta_description: template.description,
      });

      // Close template selector
      setShowTemplateSelector(false);

      // Navigate to the new PageEditor
      if (newPage?.data?.id) {
        navigate(`/pages/${newPage.data.id}/edit`);
        toast.success(`Created ${template.name}!`);
      }
    } catch (error) {
      console.error('Failed to create page:', error);
      toast.error('Failed to create page');
    }
  };

  const handleEditVisually = (page) => {
    // Navigate to PageEditor instead of old PageBuilder
    navigate(`/pages/${page.id}/edit`);
  };

  const handleEditCode = (page) => {
    // Get GitHub config
    const owner = localStorage.getItem('github_owner') || 'Wowstorelive';
    const repo = localStorage.getItem('github_repo') || 'Hydrogen-v4-storefront-';

    // Open file in GitHub (will redirect to Codespaces if available)
    const filePath = page.github_path || `app/routes/${page.slug}.tsx`;
    const url = `https://github.com/${owner}/${repo}/blob/main/${filePath}`;
    window.open(url, '_blank');
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (isLoading) {
    return <div className="p-6">Loading pages...</div>;
  }

  if (showPageBuilder && builderPage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowPageBuilder(false);
              setBuilderPage(null);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Pages
          </button>
        </div>
        <PageBuilder pageId={builderPage.id} pageName={builderPage.title} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pages</h1>
          <p className="text-gray-600 mt-1">Manage your website pages</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleShowTemplateSelector}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            New Page
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {editingPage ? 'Edit Page' : 'Create New Page'}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <RichTextEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave empty to use page title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Brief description for search engines"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save size={20} />
                {editingPage ? 'Update Page' : 'Create Page'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{page.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">/{page.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        page.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditCode(page)}
                        className="p-2 text-gray-900 hover:bg-gray-100 rounded-lg transition"
                        title="Edit Code in GitHub"
                      >
                        <Code size={18} />
                      </button>
                      <button
                        onClick={() => handleEditVisually(page)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Visual Page Editor"
                      >
                        <Layout size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(page)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Metadata"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No pages yet. Create your first page!</p>
            </div>
          )}
        </div>
      )}

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => {
          setShowTemplateSelector(false);
          // Navigate back to /pages if we came from /pages/new
          if (location.pathname === '/pages/new') {
            navigate('/pages');
          }
        }}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
};
