import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * useShopifyMedia - Hook for fetching and managing Shopify media
 * Fetches from Shopify's CDN via product API or stored media
 */

const SHOPIFY_STORE = 'wowstore-live-e73ceb638e20e1167a63.o2.myshopify.dev';

// Fetch products from Shopify Storefront API (public)
const fetchShopifyProducts = async () => {
  try {
    // Use Shopify's products.json endpoint (public API)
    const response = await fetch(`https://${SHOPIFY_STORE}/products.json?limit=50`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Shopify products fetch error:', error);
    return [];
  }
};

// Fetch collections from Shopify
const fetchShopifyCollections = async () => {
  try {
    const response = await fetch(`https://${SHOPIFY_STORE}/collections.json`);
    if (!response.ok) {
      throw new Error('Failed to fetch collections');
    }
    const data = await response.json();
    return data.collections || [];
  } catch (error) {
    console.error('Shopify collections fetch error:', error);
    return [];
  }
};

// Extract images from products and collections
const extractMediaFromProducts = (products) => {
  const media = [];

  products.forEach(product => {
    // Add featured image
    if (product.featured_image) {
      media.push({
        id: `product-${product.id}-featured`,
        url: product.featured_image,
        alt: product.title,
        title: product.title,
        type: 'product',
        productId: product.id,
        source: 'featured',
      });
    }

    // Add all product images
    if (product.images && product.images.length > 0) {
      product.images.forEach((image, index) => {
        // Only add if not already the featured image
        if (image.src !== product.featured_image) {
          media.push({
            id: `product-${product.id}-image-${index}`,
            url: image.src,
            alt: image.alt || product.title,
            title: `${product.title} - Image ${index + 1}`,
            type: 'product',
            productId: product.id,
            width: image.width,
            height: image.height,
            source: 'product-images',
          });
        }
      });
    }
  });

  return media;
};

const extractMediaFromCollections = (collections) => {
  return collections
    .filter(collection => collection.image)
    .map(collection => ({
      id: `collection-${collection.id}`,
      url: collection.image.src,
      alt: collection.title,
      title: collection.title,
      type: 'collection',
      collectionId: collection.id,
      width: collection.image.width,
      height: collection.image.height,
      source: 'collection',
    }));
};

export function useShopifyMedia(options = {}) {
  const { filter = 'all', searchTerm = '' } = options;

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['shopify-products'],
    queryFn: fetchShopifyProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch collections
  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ['shopify-collections'],
    queryFn: fetchShopifyCollections,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  // Combine all media
  const allMedia = [
    ...extractMediaFromProducts(products),
    ...extractMediaFromCollections(collections),
  ];

  // Filter media based on options
  const filteredMedia = allMedia.filter(item => {
    // Filter by type
    if (filter !== 'all' && item.type !== filter) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(term) ||
        item.alt?.toLowerCase().includes(term)
      );
    }

    return true;
  });

  return {
    media: filteredMedia,
    isLoading: productsLoading || collectionsLoading,
    totalCount: allMedia.length,
    filteredCount: filteredMedia.length,
  };
}

// Utility to get optimized image URL with Shopify's CDN
export function getOptimizedImageUrl(url, options = {}) {
  const { width = 800, height, crop = 'center', format = 'auto' } = options;

  if (!url || !url.includes('cdn.shopify.com')) {
    return url;
  }

  // Shopify CDN transformation parameters
  const params = [];

  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (crop) params.push(`crop=${crop}`);

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.join('&')}`;
}

export default useShopifyMedia;
