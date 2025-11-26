import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Spinner - Simple loading spinner
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`} />
  );
}

/**
 * FullPageLoader - Full screen loading overlay
 */
export function FullPageLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" />
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

/**
 * SectionLoader - Loading state for a section/panel
 */
export function SectionLoader({ message = 'Loading...', height = 'h-64' }) {
  return (
    <div className={`${height} flex items-center justify-center`}>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * InlineLoader - Inline loading indicator
 */
export function InlineLoader({ message }) {
  return (
    <span className="inline-flex items-center gap-2 text-gray-600">
      <Spinner size="sm" />
      {message && <span className="text-sm">{message}</span>}
    </span>
  );
}

/**
 * SkeletonBox - Basic skeleton loading box
 */
export function SkeletonBox({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

/**
 * SkeletonText - Skeleton loading for text lines
 */
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/**
 * CardSkeleton - Skeleton loading for card layouts
 */
export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-4 space-y-4">
          <SkeletonBox className="h-40 w-full" />
          <SkeletonBox className="h-6 w-3/4" />
          <SkeletonText lines={2} />
          <div className="flex gap-2">
            <SkeletonBox className="h-10 w-24" />
            <SkeletonBox className="h-10 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * TableSkeleton - Skeleton loading for table rows
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4 p-4 bg-gray-50 rounded-lg" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBox key={i} className="h-4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 p-4 border rounded-lg"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBox key={colIndex} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * ComponentSkeleton - Skeleton for component library items
 */
export function ComponentSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-6 w-1/2" />
            <SkeletonBox className="h-6 w-16 rounded-full" />
          </div>
          <SkeletonText lines={2} />
          <div className="flex gap-2">
            <SkeletonBox className="h-6 w-16 rounded-full" />
            <SkeletonBox className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * PageEditorSkeleton - Skeleton for page editor layout
 */
export function PageEditorSkeleton() {
  return (
    <div className="h-full flex">
      {/* Left Panel */}
      <div className="w-64 bg-white border-r p-4 space-y-4">
        <SkeletonBox className="h-8 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBox key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>

      {/* Center - Preview */}
      <div className="flex-1 bg-gray-100 p-6">
        <div className="bg-white rounded-lg shadow-lg h-full">
          <SkeletonBox className="h-full w-full rounded-lg" />
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-80 bg-white border-l p-4 space-y-4">
        <SkeletonBox className="h-8 w-full" />
        <SkeletonText lines={4} />
        <SkeletonBox className="h-10 w-full" />
        <SkeletonBox className="h-10 w-full" />
        <SkeletonBox className="h-32 w-full" />
      </div>
    </div>
  );
}

/**
 * ButtonLoader - Loading state for buttons
 */
export function ButtonLoader({ loading, children, className = '', ...props }) {
  return (
    <button
      disabled={loading}
      className={`relative ${loading ? 'cursor-wait' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
          <Spinner size="sm" />
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
}

/**
 * ProgressLoader - Loading with progress indicator
 */
export function ProgressLoader({ progress, message = 'Processing...' }) {
  return (
    <div className="text-center space-y-4">
      <Spinner size="lg" />
      <div className="w-64 mx-auto">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{message}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default {
  Spinner,
  FullPageLoader,
  SectionLoader,
  InlineLoader,
  SkeletonBox,
  SkeletonText,
  CardSkeleton,
  TableSkeleton,
  ComponentSkeleton,
  PageEditorSkeleton,
  ButtonLoader,
  ProgressLoader,
};
