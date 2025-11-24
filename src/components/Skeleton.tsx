import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem'
}) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6" width="60%" />
        <Skeleton className="h-4" width="80px" />
      </div>
      <div className="mb-4">
        <Skeleton className="h-6 rounded-full" width="120px" />
      </div>
      <div className="mb-4">
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 rounded-lg" width="140px" />
        <Skeleton className="h-4" width="60px" />
      </div>
    </div>
  );
};

export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = ''
}) => {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};