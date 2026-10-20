import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between animate-pulse">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="h-5 bg-slate-200 rounded-md w-24"></div>
          <div className="h-5 bg-slate-200 rounded-md w-16"></div>
        </div>
        <div className="h-6 bg-slate-200 rounded-md w-4/5 mb-2.5"></div>
        <div className="space-y-1.5 mb-4">
          <div className="h-3.5 bg-slate-100 rounded-md w-full"></div>
          <div className="h-3.5 bg-slate-100 rounded-md w-3/4"></div>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="h-4 bg-slate-100 rounded-full w-12"></div>
          <div className="h-4 bg-slate-100 rounded-full w-16"></div>
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded-md w-28"></div>
          <div className="h-4 bg-slate-200 rounded-md w-14"></div>
        </div>
      </div>
    </div>
  );
};

export const LoadingGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};
