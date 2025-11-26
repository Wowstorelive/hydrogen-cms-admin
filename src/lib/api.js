import axios from 'axios';
import { githubAPI } from './githubAPI';

// Use nginx proxy route instead of direct PostgREST URL
// This routes through HTTPS and avoids mixed content issues
const API_BASE_URL = '/api/postgrest';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const cmsAPI = {
  // Pages now pull from GitHub Hydrogen repository
  pages: githubAPI.pages,
  media: {
    getAll: () => apiClient.get('/cms_media?order=created_at.desc'),
  },
  components: {
    getAll: () => apiClient.get('/component_library?select=*,category:component_categories(*)&is_active=eq.true&order=name.asc'),
    getBySlug: (slug) => apiClient.get(`/component_library?slug=eq.${slug}&select=*,category:component_categories(*)`),
    getByCategory: (categoryId) => apiClient.get(`/component_library?category_id=eq.${categoryId}&is_active=eq.true&select=*,category:component_categories(*)`),
  },
  categories: {
    getAll: () => apiClient.get('/component_categories?order=sort_order.asc'),
    getBySlug: (slug) => apiClient.get(`/component_categories?slug=eq.${slug}`),
  },
  colorSchemes: {
    getAll: () => apiClient.get('/brand_color_schemes?is_active=eq.true&order=name.asc'),
    getBySlug: (slug) => apiClient.get(`/brand_color_schemes?slug=eq.${slug}`),
  },
  componentInstances: {
    getByPageId: (pageId) => apiClient.get(`/component_instances?page_id=eq.${pageId}&select=*,component:component_library(*)&order=sort_order.asc`),
    create: (data) => apiClient.post('/component_instances', data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    update: (id, data) => apiClient.patch(`/component_instances?id=eq.${id}`, data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    delete: (id) => apiClient.delete(`/component_instances?id=eq.${id}`),
    reorder: (pageId, updates) => {
      // Batch update sort orders
      return Promise.all(
        updates.map(({ id, sort_order }) =>
          apiClient.patch(`/component_instances?id=eq.${id}`, { sort_order })
        )
      );
    },
  },
  funnels: {
    getAll: () => apiClient.get('/funnels?order=created_at.desc'),
    getById: (id) => apiClient.get(`/funnels?id=eq.${id}`),
    getWithStages: (id) => apiClient.get(`/funnel_stages?funnel_id=eq.${id}&select=*,components:funnel_stage_components(id,sort_order,component:component_library(id,name,slug,category:component_categories(*)))`),
    create: (data) => apiClient.post('/funnels', data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    update: (id, data) => apiClient.patch(`/funnels?id=eq.${id}`, data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    delete: (id) => apiClient.delete(`/funnels?id=eq.${id}`)
  },
  funnelStages: {
    create: (data) => apiClient.post('/funnel_stages', data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    update: (id, data) => apiClient.patch(`/funnel_stages?id=eq.${id}`, data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    delete: (id) => apiClient.delete(`/funnel_stages?id=eq.${id}`)
  },
  funnelStageComponents: {
    create: (data) => apiClient.post('/funnel_stage_components', data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    delete: (id) => apiClient.delete(`/funnel_stage_components?id=eq.${id}`)
  },
  initiatives: {
    getAll: () => apiClient.get('/conservation_initiatives?order=display_month.desc,sort_order.asc'),
    getByMonth: (month) => apiClient.get(`/conservation_initiatives?display_month=eq.${month}&is_active=eq.true&order=sort_order.asc`),
    create: (data) => apiClient.post('/conservation_initiatives', data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    update: (id, data) => apiClient.patch(`/conservation_initiatives?id=eq.${id}`, data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    delete: (id) => apiClient.delete(`/conservation_initiatives?id=eq.${id}`)
  },
  sdgs: {
    getAll: () => apiClient.get('/sdg_goals?order=id.asc'),
    getById: (id) => apiClient.get(`/sdg_goals?id=eq.${id}`),
  },
  initiativeSDGs: {
    getByInitiative: (initiativeId) => apiClient.get(`/initiative_sdg_mappings?initiative_id=eq.${initiativeId}&select=*,sdg:sdg_goals(*)`),
    create: (data) => apiClient.post('/initiative_sdg_mappings', data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    delete: (id) => apiClient.delete(`/initiative_sdg_mappings?id=eq.${id}`)
  },
  productSDGs: {
    getByProduct: (productId) => apiClient.get(`/product_sdg_mappings?product_id=eq.${productId}&select=*,sdg:sdg_goals(*)`),
    create: (data) => apiClient.post('/product_sdg_mappings', data, {
      headers: { 'Prefer': 'return=representation' }
    }),
    delete: (id) => apiClient.delete(`/product_sdg_mappings?id=eq.${id}`)
  },
};

export default apiClient;
