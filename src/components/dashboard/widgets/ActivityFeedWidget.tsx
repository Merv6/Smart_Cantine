import React from 'react';
import { FileText, ImageIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Skeleton } from '../../ui/Skeleton';

export const ActivityFeedWidget = () => {
  const [reports, setReports] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('meal_reports')
          .select('*, schools(name)')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error('Error fetching activity:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      <h3 className="text-xl font-bold font-display">Dernières Activités</h3>
      <div className="space-y-4">
        {reports.map((r) => (
          <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-lg">
              <FileText size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800">{r.schools?.name || 'Inconnue'}</p>
              <p className="text-xs text-slate-500">{r.meal_description}</p>
            </div>
            {r.photos && r.photos.length > 0 && <ImageIcon size={16} className="text-slate-400" />}
            <span className="text-xs font-medium text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
