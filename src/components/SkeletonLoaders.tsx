import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const MenuCardSkeleton: React.FC = () => {
  return (
    <div className="bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden border border-accent/10 flex flex-row h-32 sm:h-36">
      {/* Image Skeleton */}
      <Skeleton className="w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0" />
      
      {/* Content Skeleton */}
      <div className="flex-1 p-3 sm:p-5 flex flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/4 rounded-md" />
          <div className="space-y-1 pt-2">
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-5/6 rounded-md" />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-2 w-8 rounded" />
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const MenuManagementSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton className="w-16 h-16 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-48 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
      </div>
      <div className="flex items-center gap-8 px-8">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
};
