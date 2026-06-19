import React from 'react';
import { supabase } from '../../../lib/supabase';
import { Skeleton } from '../../ui/Skeleton';

export const RequestsWidget = () => {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('validation_requests')
          .select(`
            id,
            user_id,
            full_name,
            role_requested,
            school_name,
            status,
            created_at,
            profiles (
              id,
              department,
              commune,
              arrondissement,
              phone
            )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching pending requests:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
    
    // Subscribe to changes
    const channel = supabase.channel('pending_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'validation_requests' }, () => {
        fetchRequests();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      <h3 className="text-xl font-bold font-display">Demandes en attente ({requests.length})</h3>
      {requests.length === 0 ? (
        <p className="text-slate-500 italic">Aucune demande en attente.</p>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">{r.full_name}</p>
                <p className="text-xs text-slate-500">{r.role_requested} • {r.school_name}</p>
              </div>
              <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full">En attente</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
