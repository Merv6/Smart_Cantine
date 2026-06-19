import React from 'react';
import { Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Skeleton } from '../../ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const GlobalInventoryWidget = () => {
  const [data, setData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data: inventory, error } = await supabase
          .from('inventory')
          .select('item_name, quantity')
          .limit(500);

        if (error) throw error;

        const invMap: { [key: string]: number } = {};
        (inventory || []).forEach(item => {
          invMap[item.item_name] = (invMap[item.item_name] || 0) + Number(item.quantity);
        });
        
        setData(Object.entries(invMap).map(([name, value]) => ({ name, value })).slice(0, 4));
      } catch (err) {
        console.error('Error fetching global inventory:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  if (isLoading) return <Skeleton className="h-[300px] w-full" />;

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      <h3 className="text-lg font-bold mb-8">Volume des Stocks Nationaux</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
            <Tooltip 
              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
            />
            <Bar dataKey="value" fill="#F59E0B" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
