import React from 'react';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '../ui/Skeleton';

export function DashboardWidget({ 
  children, 
  isLoading, 
  className,
  skeleton = <Skeleton className="h-64 w-full" />
}: { 
  children: React.ReactNode, 
  isLoading: boolean, 
  className?: string,
  skeleton?: React.ReactNode 
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className={className}>
      {inView ? (
        isLoading ? skeleton : children
      ) : (
        skeleton
      )}
    </div>
  );
}
