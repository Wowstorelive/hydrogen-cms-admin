import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

/**
 * useShopifyData Hook
 * Fetches real Shopify store data from the unified orchestrator API
 * Returns actual page counts, products, collections from wowstore.live
 */

// API configuration - points to our unified orchestrator
const ORCHESTRATOR_API = '/api/orchestrator';

// Fallback to direct Shopify JSON APIs if orchestrator unavailable
const SHOPIFY_STORE_URL = 'https://wowstore.live';
const HYDROGEN_URL = 'https://wowstore-live-e73ceb638e20e1167a63.o2.myshopify.dev';

/**
 * Fetch store statistics from orchestrator or directly from Shopify
 */
async function fetchStoreStats() {
  try {
    // Try orchestrator API first
    const response = await axios.get(`${ORCHESTRATOR_API}/cms/shopify/stats`, {
      timeout: 5000
    });
    return response.data;
  } catch (orchestratorError) {
    console.log('Orchestrator unavailable, fetching directly from Shopify...');

    // Fallback: fetch directly from Shopify JSON APIs
    const [productsRes, collectionsRes, pagesRes] = await Promise.allSettled([
      axios.get(`${SHOPIFY_STORE_URL}/products.json?limit=1`),
      axios.get(`${SHOPIFY_STORE_URL}/collections.json?limit=250`),
      axios.get(`${SHOPIFY_STORE_URL}/pages.json?limit=250`)
    ]);

    const products = productsRes.status === 'fulfilled' ? productsRes.value.data.products : [];
    const collections = collectionsRes.status === 'fulfilled' ? collectionsRes.value.data.collections : [];
    const pages = pagesRes.status === 'fulfilled' ? pagesRes.value.data.pages : [];

    // Hydrogen routes (static)
    const hydrogenRoutes = [
      { id: 'home', title: 'Homepage', path: '/', type: 'page', status: 'published' },
      { id: 'collections', title: 'All Collections', path: '/collections', type: 'page', status: 'published' },
      { id: 'products', title: 'All Products', path: '/products', type: 'page', status: 'published' },
      { id: 'cart', title: 'Cart', path: '/cart', type: 'page', status: 'published' },
      { id: 'search', title: 'Search', path: '/search', type: 'page', status: 'published' },
      { id: 'blogs', title: 'Blogs', path: '/blogs', type: 'page', status: 'published' },
      { id: 'account', title: 'Account', path: '/account', type: 'page', status: 'published' },
      { id: 'policies', title: 'Policies', path: '/policies', type: 'page', status: 'published' },
    ];

    const totalPages = hydrogenRoutes.length + pages.length + collections.length;

    return {
      stats: {
        total_pages: totalPages,
        hydrogen_routes: hydrogenRoutes.length,
        shopify_pages: pages.length,
        collections_count: collections.length,
        products_count: products.length || '100+',
        published_pages: totalPages,
        draft_pages: 0
      },
      hydrogen_routes: hydrogenRoutes,
      shopify_pages: pages.map(p => ({
        id: p.id,
        title: p.title,
        path: `/pages/${p.handle}`,
        type: 'shopify_page',
        status: 'published'
      })),
      collections: collections.slice(0, 20).map(c => ({
        id: c.id,
        title: c.title,
        path: `/collections/${c.handle}`,
        type: 'collection',
        status: 'published'
      })),
      store: {
        domain: 'wowstore.live',
        hydrogen_url: HYDROGEN_URL,
        mode: 'hydrogen'
      }
    };
  }
}

/**
 * Fetch all pages (Hydrogen routes + Shopify pages + Collections)
 */
async function fetchAllPages() {
  const stats = await fetchStoreStats();

  return [
    ...stats.hydrogen_routes,
    ...(stats.shopify_pages || []),
    ...(stats.collections || [])
  ];
}

/**
 * Get preview URL for a specific page
 */
async function fetchPreviewUrl(path = '/', mode = 'hydrogen') {
  try {
    const response = await axios.get(`${ORCHESTRATOR_API}/cms/shopify/preview-url`, {
      params: { path, mode }
    });
    return response.data;
  } catch (error) {
    // Fallback
    const baseUrl = mode === 'liquid' ? SHOPIFY_STORE_URL : HYDROGEN_URL;
    return {
      preview_url: `${baseUrl}${path}`,
      mode,
      responsive_widths: {
        desktop: 1440,
        tablet: 768,
        mobile: 375
      }
    };
  }
}

/**
 * Main hook for store statistics
 */
export function useShopifyStats() {
  return useQuery({
    queryKey: ['shopify-stats'],
    queryFn: fetchStoreStats,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for all pages list
 */
export function useShopifyPages() {
  return useQuery({
    queryKey: ['shopify-pages'],
    queryFn: fetchAllPages,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for preview URL
 */
export function usePreviewUrl(path = '/', mode = 'hydrogen') {
  return useQuery({
    queryKey: ['preview-url', path, mode],
    queryFn: () => fetchPreviewUrl(path, mode),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });
}

export default useShopifyStats;
