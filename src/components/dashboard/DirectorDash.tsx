import React from 'react';
import { 
  Package, 
  Plus, 
  History, 
  AlertCircle, 
  ChefHat, 
  PieChart as PieIcon,
  ChevronRight,
  TrendingDown,
  Clock,
  CheckCircle,
  FileText,
  ArrowLeft,
  X,
  Loader2,
  Trash2,
  Camera,
  Users,
  Utensils,
  User,
  School
} from 'lucide-react';
import { Button, Input } from '../ui';
import { motion, AnimatePresence } from 'motion/react';

import { supabase } from '../../lib/supabase';

export default function DirectorDash({ 
  isValidated, 
  initialView = 'overview',
  onViewChange
}: { 
  isValidated: boolean;
  initialView?: 'overview' | 'inventory' | 'canteen' | 'settings' | 'profile' | 'register' | 'register_cook' | 'validate_meals';
  onViewChange?: (view: any) => void;
}) {
  const [view, setView] = React.useState(initialView);
  const [schoolInfo, setSchoolInfo] = React.useState<any>(null);
  const [realInventory, setRealInventory] = React.useState<any[]>([]);
  const [recentReports, setRecentReports] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, schools(*)')
        .eq('id', user.id)
        .single();

      if (profile && profile.schools) {
        setSchoolInfo(profile.schools);
        
        const [inventoryRes, reportsRes] = await Promise.all([
          supabase.from('inventory').select('*').eq('school_id', profile.school_id),
          supabase.from('meal_reports').select('*, profiles(full_name)').eq('school_id', profile.school_id).order('created_at', { ascending: false })
        ]);

        setRealInventory(inventoryRes.data || []);
        setRecentReports(reportsRes.data || []);
      }
    } catch (err) {
      console.error('Erreur fetching director data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const handleSetView = (newView: any) => {
    setView(newView);
    if (onViewChange) onViewChange(newView);
  };
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const [dailyValidation, setDailyValidation] = React.useState({
    studentsCount: '420',
    meal: 'Riz sauce arachide',
    timestamp: '12:45',
    photos: [
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=300&h=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1599481238505-b8b0537a3f77?q=80&w=300&h=200&auto=format&fit=crop'
    ],
    isValidated: false
  });

  const [formData, setFormData] = React.useState({
    products: [{ item: 'Riz', quantity: '', unit: 'kg', customItem: '' }],
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    provider: ''
  });

  const [cookData, setCookData] = React.useState({
    name: '',
    phone: '',
    email: '',
    photo: null as File | null
  });

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { item: 'Riz', quantity: '', unit: 'kg', customItem: '' }]
    });
  };

  const removeProductRow = (index: number) => {
    setFormData({
      ...formData,
      products: formData.products.filter((_, i) => i !== index)
    });
  };

  const updateProduct = (index: number, field: string, value: string) => {
    const newProducts = [...formData.products];
    (newProducts[index] as any)[field] = value;
    setFormData({ ...formData, products: newProducts });
  };

  const inventory = [
    { name: 'Riz', quantity: 450, unit: 'kg', status: 'optimal' },
    { name: 'Maïs', quantity: 80, unit: 'kg', status: 'low' },
    { name: 'Haricot', quantity: 120, unit: 'kg', status: 'warning' },
    { name: 'Huile', quantity: 45, unit: 'L', status: 'optimal' },
    { name: 'Pâtes', quantity: 200, unit: 'kg', status: 'optimal' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!schoolInfo) throw new Error("École non assignée");
      
      const { data: { user } } = await supabase.auth.getUser();

      const promises = formData.products.map(prod => {
        const itemName = prod.item === 'Autre' ? prod.customItem : prod.item;
        return supabase.from('inventory').upsert({
          school_id: schoolInfo.id,
          item_name: itemName,
          quantity: prod.quantity,
          unit: prod.unit,
          updated_at: new Date().toISOString()
        }, { onConflict: 'school_id,item_name' });
      });

      await Promise.all(promises);
      
      setIsSubmitting(false);
      setIsPending(true);
      fetchData();
    } catch (err) {
      console.error('Erreur réception vivres:', err);
      alert('Erreur lors de l\'enregistrement.');
      setIsSubmitting(false);
    }
  };

  const handleCookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      setView('overview');
      setIsSuccess(false);
    }, 3000);
  };

  const handleValidation = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDailyValidation({ ...dailyValidation, isValidated: true });
    setIsSubmitting(false);
    alert('Repas validé avec succès !');
    setView('overview');
  };

  const resetForm = () => {
    setView('overview');
    setIsPending(false);
    setFormData({
      products: [{ item: 'Riz', quantity: '', unit: 'kg', customItem: '' }],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      provider: ''
    });
  };

  if (view === 'register') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('overview')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="text-slate-600" />
          </button>
          <h1 className="text-3xl font-display font-bold">Réception de Vivres</h1>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            {isPending ? (
              <motion.div 
                key="pending"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-12 text-center flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                  <Clock className="text-amber-500 animate-pulse" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Demande en attente</h3>
                <p className="text-slate-500 mb-8 max-w-md">
                  Votre enregistrement pour <span className="font-bold text-slate-800">{formData.products.length} produit(s)</span> a été envoyé. 
                  L'administrateur doit approuver cette réception avant qu'elle ne soit ajoutée à vos stocks.
                </p>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-8">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="h-full bg-amber-500"
                  />
                </div>
                <Button onClick={resetForm} className="w-full rounded-xl py-6">OK, j'ai compris</Button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="p-8 space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest text-left">Liste des produits</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addProductRow} className="rounded-xl">
                      <Plus size={14} className="mr-1" /> Ajouter une ligne
                    </Button>
                  </div>
                  
                  {formData.products.map((prod, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5 space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Produit</label>
                          <select 
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-brand-green/30"
                            value={prod.item}
                            onChange={e => updateProduct(idx, 'item', e.target.value)}
                          >
                            <option>Riz</option>
                            <option>Maïs</option>
                            <option>Haricot</option>
                            <option>Huile de palme</option>
                            <option>Sel iodé</option>
                            <option value="Autre">Autre (préciser...)</option>
                          </select>
                        </div>
                        <div className="md:col-span-3 space-y-1.5 text-left">
                           <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Quantité</label>
                           <Input 
                            type="number" 
                            placeholder="0" 
                            required
                            value={prod.quantity}
                            onChange={e => updateProduct(idx, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1.5 text-left">
                           <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Unité</label>
                           <select 
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-brand-green/30"
                            value={prod.unit}
                            onChange={e => updateProduct(idx, 'unit', e.target.value)}
                          >
                            <option>kg</option>
                            <option>L</option>
                            <option>Sacs</option>
                            <option>Bidons</option>
                          </select>
                        </div>
                        <div className="md:col-span-1 flex justify-center">
                          {formData.products.length > 1 && (
                            <button type="button" onClick={() => removeProductRow(idx)} className="p-2 text-slate-300 hover:text-red-500">
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {prod.item === 'Autre' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                          <Input 
                            label="Préciser le produit" 
                            placeholder="Ex: Sucre, Lait..." 
                            value={prod.customItem}
                            onChange={e => updateProduct(idx, 'customItem', e.target.value)}
                          />
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <Input 
                    label="Heure de réception" 
                    type="time" 
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                  <Input 
                    label="Origine / Fournisseur" 
                    placeholder="Ex: PAM, Gouvernement..." 
                    required
                    value={formData.provider}
                    onChange={e => setFormData({...formData, provider: e.target.value})}
                  />
                </div>

                <div className="p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10 flex gap-3 text-xs text-slate-600">
                  <AlertCircle size={18} className="text-brand-green shrink-0" />
                  <p className="italic">Les stocks seront mis à jour après validation par l'administrateur départemental.</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" type="button" onClick={() => setView('overview')} className="flex-1 rounded-xl">Annuler</Button>
                  <Button isLoading={isSubmitting} type="submit" className="flex-[2] rounded-xl bg-brand-green">Soumettre la Liste</Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (view === 'register_cook') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('overview')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="text-slate-600" />
          </button>
          <h1 className="text-3xl font-display font-bold">Inscrire un Cuisinier</h1>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-8">
          {isSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="bg-brand-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-brand-green" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Inscription Réussie !</h3>
              <p className="text-slate-500">Le cuisinier a été ajouté à votre établissement.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleCookSubmit} className="space-y-6">
              <div className="flex flex-col items-center mb-8">
                <div 
                  onClick={() => document.getElementById('photo-cook')?.click()}
                  className="w-32 h-32 rounded-full bg-slate-50 border-4 border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:border-brand-green transition-colors overflow-hidden"
                >
                  {cookData.photo ? (
                    <img src={URL.createObjectURL(cookData.photo)} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="text-slate-300" size={32} />
                      <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Photo</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    id="photo-cook" 
                    className="hidden" 
                    accept="image/*"
                    onChange={e => e.target.files && setCookData({...cookData, photo: e.target.files[0]})} 
                  />
                </div>
              </div>

              <Input 
                label="Nom complet du cuisinier" 
                placeholder="Ex: Marie HOUNDETON" 
                required
                value={cookData.name}
                onChange={e => setCookData({...cookData, name: e.target.value})}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <Input 
                  label="Numéro de téléphone" 
                  placeholder="+229 00 00 00 00" 
                  required
                  value={cookData.phone}
                  onChange={e => setCookData({...cookData, phone: e.target.value})}
                />
                <Input 
                  label="Email (optionnel)" 
                  type="email" 
                  placeholder="cook@ecole.bj"
                  value={cookData.email}
                  onChange={e => setCookData({...cookData, email: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" type="button" onClick={() => setView('overview')} className="flex-1 rounded-xl">Annuler</Button>
                <Button isLoading={isSubmitting} type="submit" className="flex-[2] rounded-xl bg-brand-green">Valider l'Inscription</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-800">Gestion de l'École</h1>
            <p className="text-slate-500">EPP Godomey Centre • Atlantique</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button 
              disabled={!isValidated}
              onClick={() => setView('register')} 
              variant="secondary" 
              className={`rounded-xl font-bold flex items-center gap-2 ${!isValidated ? 'opacity-50 grayscale' : ''}`}
            >
              <Plus size={18} /> Enregistrer des Vivres
            </Button>
            <Button 
              disabled={!isValidated}
              onClick={() => setView('register_cook')} 
              variant="outline" 
              className={`rounded-xl border-slate-300 text-slate-700 font-bold flex items-center gap-2 hover:bg-slate-50 ${!isValidated ? 'opacity-50 grayscale' : ''}`}
            >
              <Users size={18} /> Inscrire un Cuisinier
            </Button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-100">
          {[
            { id: 'overview', label: "Vue d'ensemble", icon: <PieIcon size={16} /> },
            { id: 'validate_meals', label: "Validation Repas", icon: <CheckCircle size={16} /> },
            { id: 'inventory', label: "Gestion des stocks", icon: <Package size={16} /> },
            { id: 'canteen', label: "Ma Cantine", icon: <Utensils size={16} /> },
            { id: 'profile', label: "Mon Profil", icon: <User size={16} /> },
            { id: 'settings', label: "Paramètres", icon: <History size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                view === tab.id 
                ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              {/* Bento Grid Header */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 bg-gradient-to-br from-brand-green to-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-brand-green/20">
                  <div className="relative z-10 space-y-6">
                    <div className="bg-white/20 backdrop-blur-md w-fit px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">Aujourd'hui • 27 Avril</div>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black font-display leading-tight">Bonjour, M. DOSSOU</h2>
                      <p className="text-emerald-50 opacity-90 max-w-md font-medium">Tout est en ordre à l'EPP Godomey Centre. 420 élèves attendent leur repas.</p>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl border border-white/10 flex-1">
                        <div className="text-[10px] font-black text-emerald-100 uppercase mb-1">Repas du jour</div>
                        <div className="font-bold">Riz sauce arachide</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl border border-white/10 flex-1">
                        <div className="text-[10px] font-black text-emerald-100 uppercase mb-1">Heure de service</div>
                        <div className="font-bold">12:30 - 13:45</div>
                      </div>
                    </div>
                  </div>
                  <Utensils className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 -rotate-12" />
                </div>

                <div className="md:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Alertes de Stock</h3>
                      <div className="w-2 h-2 bg-brand-orange rounded-full animate-ping" />
                    </div>
            <div className="space-y-4">
              {realInventory.length > 0 ? realInventory.map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{item.item_name}</div>
                    <div className="text-xs text-slate-400">{item.quantity} {item.unit}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    Number(item.quantity) > 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {Number(item.quantity) > 100 ? 'Optimal' : 'Bas'}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic">Aucun stock enregistré</p>
              )}
            </div>
                  </div>
                  <Button onClick={() => setView('inventory')} variant="ghost" className="w-full text-brand-green font-black uppercase text-[10px] tracking-widest hover:bg-brand-green/5">Gérer les stocks <ChevronRight size={14} className="ml-1" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Monthly Stats */}
                <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-display">Performance Mensuelle</h3>
                    <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none">
                      <option>Avril 2026</option>
                      <option>Mars 2026</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Repas</div>
                      <div className="text-3xl font-black text-slate-800">12,450</div>
                      <div className="text-[10px] text-emerald-500 font-black">+14%</div>
                    </div>
                    <div className="space-y-2">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux Participation</div>
                       <div className="text-3xl font-black text-slate-800">98.2%</div>
                       <div className="text-[10px] text-emerald-500 font-black">Stable</div>
                    </div>
                    <div className="space-y-2">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vivres Reçus</div>
                       <div className="text-3xl font-black text-slate-800">2.4<span className="text-sm">t</span></div>
                       <div className="text-[10px] text-blue-500 font-black">Livré le 12/04</div>
                    </div>
                    <div className="space-y-2">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget Économisé</div>
                       <div className="text-3xl font-black text-slate-800">52k</div>
                       <div className="text-[10px] text-emerald-500 font-black">Réduction pertes</div>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-green w-[75%]" />
                  </div>
                </div>

                {/* Quick Validation Area */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-slate-900/10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-orange rounded-2xl flex items-center justify-center shadow-lg shadow-brand-orange/20">
                        <Camera size={20} />
                      </div>
                      <h3 className="font-bold text-lg">Validation Rapide</h3>
                    </div>
                    <div className="space-y-4">
                      {!dailyValidation.isValidated ? (
                        <>
                          <p className="text-sm text-slate-400 font-medium leading-relaxed">Les photos du service de ce midi ont été transmises par le cuisinier.</p>
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-300">2 Photos reçues</div>
                            <div className="flex -space-x-2">
                              {dailyValidation.photos.map((p, i) => (
                                <img key={i} src={p} className="w-6 h-6 rounded-full border border-slate-900 object-cover" />
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                          <CheckCircle className="text-emerald-500 mx-auto mb-2" size={24} />
                          <div className="text-sm font-bold text-emerald-400">Repas Validé</div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!dailyValidation.isValidated && (
                    <Button onClick={() => setView('validate_meals')} className="w-full bg-brand-orange hover:bg-brand-orange/90 rounded-2xl py-6 font-black uppercase text-xs tracking-widest">
                      Vérifier preuves
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'validate_meals' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 text-left">
               <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                  <div className="bg-brand-green p-8 text-white flex items-center justify-between">
                     <div>
                        <h3 className="text-xl font-black uppercase">Validation du Service</h3>
                        <p className="text-xs opacity-80 font-bold tracking-tight">Vérification des preuves quotidiennes</p>
                     </div>
                     <CheckCircle size={32} className="opacity-40" />
                  </div>
                  
                  <div className="p-8 space-y-8">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Élèves Déclarés</div>
                        <div className="text-2xl font-black text-slate-800 flex items-center gap-2">
                           <Users size={20} className="text-brand-green" />
                           {dailyValidation.studentsCount}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Repas Servis</div>
                        <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <ChefHat size={20} className="text-brand-orange" />
                           {dailyValidation.meal}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Heure d'envoi</div>
                        <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <Clock size={20} className="text-blue-500" />
                           {dailyValidation.timestamp}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase pl-1">Preuves Photos</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {dailyValidation.photos.map((photo, i) => (
                           <motion.div 
                            key={i} 
                            whileHover={{ scale: 1.02 }}
                            className="aspect-video rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50"
                           >
                             <img src={photo} className="w-full h-full object-cover" alt="Preuve repas" />
                           </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                      <Button 
                        disabled={!isValidated}
                        variant="ghost" 
                        className="flex-1 rounded-2xl h-14 font-black uppercase text-xs tracking-widest text-red-500 hover:bg-red-50 disabled:bg-slate-50 disabled:text-slate-300"
                        onClick={() => {
                          alert('Demande de modification envoyée au cuisinier.');
                          setView('overview');
                        }}
                      >
                         Signaler erreur
                      </Button>
                      <Button 
                        disabled={!isValidated}
                        isLoading={isSubmitting}
                        onClick={handleValidation}
                        className={`flex-[2] rounded-2xl h-14 shadow-xl font-black uppercase text-xs tracking-widest ${
                          isValidated 
                          ? 'bg-brand-green hover:bg-brand-green/90 shadow-brand-green/20' 
                          : 'bg-slate-300 text-white shadow-none cursor-not-allowed'
                        }`}
                      >
                         Valider le rapport <CheckCircle className="ml-2" size={18} />
                      </Button>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'inventory' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher un produit..." 
                    className="w-full pl-12 pr-4 h-12 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-brand-green/20 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <select className="px-4 h-12 rounded-2xl border border-slate-200 bg-white shadow-sm text-sm font-bold outline-none">
                    <option>Tous les états</option>
                    <option>Critique</option>
                    <option>Avertissement</option>
                    <option>Stable</option>
                  </select>
                  <Button onClick={() => setView('register')} className="rounded-2xl h-12 font-bold gap-2">
                    <Plus size={18} /> Nouvel Arrivage
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {inventory.map((item, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -4 }}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${
                          item.status === 'optimal' ? 'bg-emerald-50 text-emerald-600' : 
                          item.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {item.name[0]}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          item.status === 'optimal' ? 'bg-emerald-100 text-emerald-600' : 
                          item.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{item.name}</h4>
                        <div className="flex items-end gap-2 mt-1">
                          <span className="text-2xl font-black text-slate-900">{item.quantity}</span>
                          <span className="text-slate-400 font-bold mb-1 uppercase text-xs">{item.unit}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                          <span>Niveau</span>
                          <span>{item.status === 'optimal' ? '85' : item.status === 'warning' ? '40' : '15'}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            item.status === 'optimal' ? 'bg-emerald-500' : 
                            item.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: item.status === 'optimal' ? '85%' : item.status === 'warning' ? '40%' : '15%' }} />
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-tighter">
                      <span>Dernier arrivage</span>
                      <span className="text-slate-600 font-black italic">12 Avril</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold font-display">Historique des Mouvements</h3>
                  <Button variant="ghost" size="sm" className="text-brand-green font-bold">Voir tout l'historique</Button>
                </div>
                <div className="space-y-4">
                  {[
                    { type: 'IN', item: 'Riz', qty: '+500kg', date: 'Hier, 14:20', from: 'PAM', status: 'Validé' },
                    { type: 'OUT', item: 'Mais', qty: '-45kg', date: 'Hier, 08:30', from: 'Cuisine', status: 'Enregistré' },
                    { type: 'IN', item: 'Huile', qty: '+20L', date: '15/04, 10:15', from: 'DONS', status: 'Validé' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          log.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-orange/10 text-brand-orange'
                        }`}>
                          {log.type === 'IN' ? <TrendingDown className="rotate-180" size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{log.item} <span className={log.type === 'IN' ? 'text-emerald-500' : 'text-brand-orange'}>{log.qty}</span></div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{log.from} • {log.date}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">
                        {log.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'canteen' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Column: Staff & School */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold font-display">Personnel</h3>
                      <Button onClick={() => setView('register_cook')} variant="ghost" size="sm" className="text-brand-orange">+ Ajouter</Button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "Adama Traoré", phone: "97 00 11 22", health: "À jour", absence: 0 },
                        { name: "Mariam Bello", phone: "98 10 20 30", health: "À jour", absence: 1 },
                      ].map((c, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-300 shadow-sm">
                                {c.name[0]}
                              </div>
                              <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                            </div>
                            <button className="text-slate-300 hover:text-brand-orange transition-colors"><X size={16} /></button>
                          </div>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest pt-2 border-t border-slate-100">
                            <div className="text-slate-400">Carnet Santé: <span className="text-emerald-500">{c.health}</span></div>
                            <div className="text-slate-400">Absences: <span className="text-brand-orange">{c.absence}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-brand-green/5 p-6 rounded-[2.5rem] border border-brand-green/10 space-y-6">
                    <h3 className="text-lg font-bold text-brand-green font-display flex items-center gap-2">
                      <School size={20} /> Infos École
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-brand-green/10 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Localisation</div>
                        <p className="text-sm font-bold text-slate-700 leading-tight">Abomey-Calavi, Godomey Centre (Groupe A)</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-brand-green/10 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Capacité & Effectif</div>
                        <p className="text-sm font-bold text-slate-700">452 Élèves / 500 Places</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-brand-green/10 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Prochaine Inspection</div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-brand-orange" />
                          <p className="text-sm font-bold text-brand-orange italic">Dans 14 jours</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full text-brand-green font-bold text-[10px] uppercase tracking-widest">Modifier Infos École</Button>
                  </div>
                </div>

                {/* Right Column: Menu & Planning */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-brand-orange/5">
                      <div>
                        <h3 className="text-xl font-bold font-display">Menu de la Semaine</h3>
                        <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">Avril: Semaine 4</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl border-brand-orange text-brand-orange hover:bg-brand-orange/10 font-bold">Modifier Menu</Button>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-slate-50">
                      {[
                        { day: 'Lundi', dish: 'Riz sauce arachide + Poisson', kcal: '450', color: 'bg-emerald-500' },
                        { day: 'Mardi', dish: 'Pâte de maïs sauce légumes + Fromage', kcal: '420', color: 'bg-amber-500' },
                        { day: 'Mercredi', dish: 'Haricot vert + Gari + Huile de palme', kcal: '480', color: 'bg-brand-orange' },
                        { day: 'Jeudi', dish: 'Couscous de maïs + Sauce tomate', kcal: '440', color: 'bg-blue-500' },
                        { day: 'Vendredi', dish: 'Riz gras au poulet', kcal: '500', color: 'bg-brand-green' },
                      ].map((m, i) => (
                        <div key={i} className="flex items-center gap-6 p-6 hover:bg-slate-50 transition-colors">
                          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white ${m.color} shadow-lg shadow-current/20`}>
                            <span className="text-[10px] font-black uppercase">{m.day.slice(0, 3)}</span>
                          </div>
                          <div className="flex-1">
                             <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{m.day}</div>
                             <div className="text-lg font-bold text-slate-600">{m. dish}</div>
                          </div>
                          <div className="text-right">
                             <div className="text-sm font-black text-brand-orange">{m.kcal} kcal</div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase">Portion moy.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                        <Users size={24} />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-800">452</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">Élèves inscrits</div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green">
                        <Utensils size={24} />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-800">420</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">Moyenne repas/jour</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="relative h-48 bg-gradient-to-r from-brand-green to-emerald-500 rounded-[2.5rem] overflow-hidden -mb-12">
                <Utensils className="absolute -top-10 -right-10 w-64 h-64 text-white/10" />
                <div className="absolute inset-0 bg-black/10" />
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-8 -mt-20 md:-mt-16 mb-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2rem] bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-4xl font-black text-slate-300">
                      JD
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-green text-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                      <Camera size={16} />
                    </button>
                  </div>
                  <div className="text-center md:text-left space-y-2 mt-4 md:mt-0">
                    <h2 className="text-3xl font-black font-display text-slate-800">Julien DOSSOU</h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <span className="px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-[10px] font-black uppercase">Directeur d'Établissement</span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">ID: SC-2024-001</span>
                    </div>
                  </div>
                  <div className="md:ml-auto flex gap-3">
                    <Button variant="outline" className="rounded-2xl h-12 font-bold">Modifier Infos</Button>
                    <Button className="bg-brand-orange hover:bg-brand-orange/90 rounded-2xl h-12 font-bold px-8 shadow-lg shadow-brand-orange/20">Aide & Support</Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1 border-l-4 border-brand-green">Informations de Contact</h3>
                    <div className="grid gap-4">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Email Professionnel</div>
                        <div className="font-bold text-slate-800">j.dossou@ecole.bj</div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Téléphone</div>
                        <div className="font-bold text-slate-800">+229 97 00 00 00</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1 border-l-4 border-brand-orange">Détails Établissement</h3>
                    <div className="grid gap-4">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">École Affectée</div>
                        <div className="font-bold text-slate-800">EPP Godomey Centre (Groupe A)</div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Ancienneté</div>
                        <div className="font-bold text-slate-800">Assigné le 12 Septembre 2023</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50">
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Ma Signature Numérique</h3>
                     <Button variant="ghost" size="sm" className="text-brand-green font-bold">Mettre à jour</Button>
                   </div>
                   <div className="aspect-[4/1] md:w-64 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 font-display italic text-2xl font-black">
                      J. Dossou
                   </div>
                </div>
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                 <div className="space-y-1">
                   <h3 className="text-2xl font-black font-display text-slate-800">Paramètres</h3>
                   <p className="text-sm text-slate-500">Configurez votre application et vos préférences d'école.</p>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1 border-l-4 border-brand-green">Configuration École</h4>
                      <Button variant="outline" className="w-full rounded-2xl justify-between h-14 px-6 border-slate-200 group">
                        Seuil d'alerte critique (Actuel: 5 jours) <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-green transition-colors" />
                      </Button>
                      <Button variant="outline" className="w-full rounded-2xl justify-between h-14 px-6 border-slate-200 group">
                        Horaires de service des repas <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-green transition-colors" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1 border-l-4 border-brand-orange">Notifications Push</h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Alertes stock critique', desc: 'Notification instantanée si un produit passe sous le seuil.', active: true },
                          { label: 'Validation des repas', desc: 'Rappel quotidien si les photos ne sont pas validées à 14h.', active: true },
                          { label: 'Rapports hebdomadaires', desc: 'Résumé par email chaque vendredi soir.', active: false },
                        ].map((pref, i) => (
                          <div key={i} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                             <div>
                                <div className="text-sm font-bold text-slate-800">{pref.label}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{pref.desc}</div>
                             </div>
                             <div className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${pref.active ? 'bg-brand-green' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${pref.active ? 'right-1' : 'left-1'}`} />
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-50 space-y-4">
                      <Button variant="danger" className="w-full rounded-2xl font-black h-14 uppercase text-xs tracking-widest">Déconnexion</Button>
                      <p className="text-[10px] text-center text-slate-400 font-medium">Application version 1.0.4 • © 2026 Cantine-Connect</p>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
