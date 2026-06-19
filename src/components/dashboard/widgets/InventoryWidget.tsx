import React from 'react';
import { Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Skeleton } from '../../ui/Skeleton';

export const InventoryWidget = () => {
  const [inventory, setInventory] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('item_name, quantity');

        if (error) throw error;

        const invMap: { [key: string]: number } = {};
        data?.forEach(item => {
          invMap[item.item_name] = (invMap[item.item_name] || 0) + Number(item.quantity);
        });
        
        setInventory(Object.entries(invMap).map(([name, value]) => ({ name, value })).slice(0, 4));
      } catch (err) {
        console.error('Error fetching inventory:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      <h3 className="text-xl font-bold font-display">État des Stocks</h3>
      {inventory.length === 0 ? (
        <p className="text-slate-500 italic">Aucune donnée de stock.</p>
      ) : (
        <div className="space-y-4">
          {inventory.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Package size={16} /></div>
                <span className="font-semibold text-slate-700">{item.name}</span>
              </div>
              <span className="font-black text-slate-800">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
