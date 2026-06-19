import React from 'react';
import { Users, School, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Skeleton } from '../../ui/Skeleton';

export const StatCards = () => {
  const [stats, setStats] = React.useState<{
    activeSchools: number | null;
    totalStudents: number | null;
    pendingRequests: number | null;
    totalMeals: number | null;
    isLoading: boolean;
  }>({
    activeSchools: null,
    totalStudents: null,
    pendingRequests: null,
    totalMeals: null,
    isLoading: true
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          { count: schoolsCount },
          { data: reports },
          { count: requestsCount }
        ] = await Promise.all([
          supabase.from('schools').select('*', { count: 'exact', head: true }),
          supabase.from('meal_reports').select('students_count'),
          supabase.from('validation_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);

        const studentsSum = reports?.reduce((acc, curr) => acc + (curr.students_count || 0), 0) || 0;
        
        setStats({
          activeSchools: schoolsCount,
          totalStudents: studentsSum,
          pendingRequests: requestsCount,
          totalMeals: reports?.length || 0,
          isLoading: false
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();
  }, []);

  if (stats.isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const items = [
    { label: "Écoles Actives", value: stats.activeSchools?.toString(), icon: <School className="text-brand-green" />, trend: "Total" },
    { label: "Total Élevés", value: stats.totalStudents?.toLocaleString(), icon: <Users className="text-blue-500" />, trend: "Cumulative" },
    { label: "Demandes en attente", value: stats.pendingRequests?.toString(), icon: <AlertTriangle className="text-brand-orange" />, trend: "Action requise" },
    { label: "Repas Total", value: stats.totalMeals?.toLocaleString(), icon: <CheckCircle className="text-emerald-500" />, trend: "Servis" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-2xl">{stat.icon}</div>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-500 uppercase">{stat.trend}</span>
          </div>
          <div className="text-2xl font-black mb-1">{stat.value}</div>
          <p className="text-xs text-slate-400 font-bold">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};
