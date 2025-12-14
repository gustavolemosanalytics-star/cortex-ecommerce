import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={clsx('skeleton', roundedClasses[rounded], className)}
      style={{ width, height }}
    />
  );
}

// KPI Card skeleton
export function KPICardSkeleton() {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton width={100} height={16} />
        <Skeleton width={24} height={24} rounded="full" />
      </div>
      <Skeleton width={150} height={32} className="mb-2" />
      <Skeleton width={80} height={14} />
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={150} height={20} />
        <Skeleton width={100} height={32} />
      </div>
      <Skeleton width="100%" height={height} rounded="lg" />
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-dark-700">
        <Skeleton width={150} height={20} />
      </div>
      <div className="divide-y divide-dark-700">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton width={40} height={40} rounded="full" />
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={12} />
            </div>
            <Skeleton width={80} height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3">
      <Skeleton width={48} height={48} rounded="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <TableSkeleton />
    </div>
  );
}
