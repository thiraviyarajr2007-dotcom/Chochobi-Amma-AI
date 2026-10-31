import React from 'react';
import { Mascot } from './Mascot';
import { Skeleton } from './Skeleton';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col items-center justify-center p-6 gap-4 select-none animate-fade-in">
      <Mascot mood="thinking" size={90} animate={true} />
      <div className="w-48 flex flex-col items-center gap-2">
        <Skeleton className="w-36 h-4" variant="circular" />
        <Skeleton className="w-24 h-3" variant="circular" />
      </div>
    </div>
  );
};
