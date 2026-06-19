import React, { createContext, useContext, useState } from 'react';

const DashboardCacheContext = createContext<{
  cache: Record<string, any>;
  setCache: (key: string, data: any) => void;
} | null>(null);

export function DashboardCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCacheState] = useState<Record<string, any>>({});

  const setCache = (key: string, data: any) => {
    setCacheState(prev => ({ ...prev, [key]: data }));
  };

  return (
    <DashboardCacheContext.Provider value={{ cache, setCache }}>
      {children}
    </DashboardCacheContext.Provider>
  );
}

export const useDashboardCache = () => {
  const context = useContext(DashboardCacheContext);
  if (!context) throw new Error('useDashboardCache must be used within DashboardCacheProvider');
  return context;
};
