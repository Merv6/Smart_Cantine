import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { Skeleton } from '../../ui/Skeleton';

export const MonthlyYieldWidget = () => {
  const [data, setData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMonthlyYield = async () => {
      try {
        const { data: reports, error } = await supabase
          .from('meal_reports')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;

        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const monthlyData: { [key: string]: number } = {};
        
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthlyData[monthNames[d.getMonth()]] = 0;
        }

        (reports || []).forEach((r) => {
          const d = new Date(r.created_at);
          const m = monthNames[d.getMonth()];
          if (monthlyData[m] !== undefined) {
            monthlyData[m]++;
          }
        });
        
        setData(Object.entries(monthlyData).map(([name, meals]) => ({ name, meals })));
      } catch (err) {
        console.error('Error fetching monthly yield:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlyYield();
  }, []);

  if (isLoading) return <Skeleton className="h-[300px] w-full" />;

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      <h3 className="text-lg font-bold mb-8">Rendement Mensuel</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
            <Tooltip 
              cursor={{fill: '#F8FAFC'}} 
              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
            />
            <Bar dataKey="meals" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
