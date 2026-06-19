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
  Edit2,
  Camera,
  Users,
  Utensils,
  User,
  School,
  Search,
  Filter,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';
import { Button, Input } from '../ui';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { supabase } from '../../lib/supabase';

export default function DirectorDash({ 
  isValidated, 
  user: initialUser,
  profile: initialProfile,
  initialView = 'overview',
  onViewChange
}: { 
  isValidated: boolean;
  user?: any;
  profile?: any;
  initialView?: 'overview' | 'inventory' | 'canteen' | 'settings' | 'profile' | 'register' | 'register_cook' | 'history' | 'all_reports';
  onViewChange?: (view: any) => void;
}) {
  const [view, setView] = React.useState(initialView);
  const [schoolInfo, setSchoolInfo] = React.useState<any>(null);

  const getSchoolWithOverride = React.useCallback((school: any) => {
    if (!school) return null;
    const key = school.id ? `school_override_${school.id}` : `school_override_default`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return { ...school, ...JSON.parse(stored) };
      } catch (e) {
        console.error("Error merging school override:", e);
      }
    }
    return school;
  }, []);

  const [realInventory, setRealInventory] = React.useState<any[] | null>(null);
  const [recentReports, setRecentReports] = React.useState<any[] | null>(null);
  const [notifications, setNotifications] = React.useState<any[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const activeUser = initialUser || (await supabase.auth.getUser()).data.user;
      if (!activeUser) return;
      
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*, schools(*)')
        .eq('id', activeUser.id)
        .single();
      
      let currentProfile = profile;
        
      if (profileErr || !currentProfile) {
        console.error('❌ Error fetching profile:', profileErr);
        const { data: simpleProfile } = await supabase.from('profiles').select('*').eq('id', activeUser.id).single();
        if (simpleProfile) {
          if (simpleProfile.school_id) {
             const { data: school } = await supabase.from('schools').select('*').eq('id', simpleProfile.school_id).single();
             if (school) setSchoolInfo(getSchoolWithOverride(school));
          }
        }
        return;
      }

      if (currentProfile) {
        let currentSchool = currentProfile.schools;

        if (!currentSchool && currentProfile.school && !currentProfile.school_id) {
          const { data: matchedSchool } = await supabase
            .from('schools')
            .select('*')
            .eq('name', currentProfile.school)
            .maybeSingle();
          
          if (matchedSchool) {
            await supabase.from('profiles').update({ school_id: matchedSchool.id }).eq('id', activeUser.id);
            currentSchool = matchedSchool;
          } else {
            const { data: newSchool } = await supabase
              .from('schools')
              .insert({ 
                name: currentProfile.school,
                department: currentProfile.department,
                commune: currentProfile.commune,
                arrondissement: currentProfile.arrondissement
              })
              .select('*')
              .single();
            if (newSchool) {
              await supabase.from('profiles').update({ school_id: newSchool.id }).eq('id', activeUser.id);
              currentSchool = newSchool;
            }
          }
        }

        if (currentSchool || currentProfile.school_id) {
          const targetSchoolId = currentSchool?.id || currentProfile.school_id;
          if (currentProfile.school_id && !currentSchool) {
            const { data: school } = await supabase.from('schools').select('*').eq('id', currentProfile.school_id).single();
            if (school) setSchoolInfo(getSchoolWithOverride(school));
          } else {
             setSchoolInfo(getSchoolWithOverride(currentSchool));
          }
          
          if (targetSchoolId) {
            const [inventoryRes, reportsRes, notificationsRes] = await Promise.all([
              supabase.from('inventory').select('*').eq('school_id', targetSchoolId),
              supabase.from('meal_reports')
                .select('*')
                .eq('school_id', targetSchoolId)
                .order('created_at', { ascending: false }),
              supabase.from('inventory')
                .select('*')
                .eq('school_id', targetSchoolId)
                .order('updated_at', { ascending: false })
                .limit(5)
            ]);
            
            console.log('DEBUG: Target school ID', targetSchoolId);
            console.log('DEBUG: Reports response', reportsRes);

            setRealInventory(inventoryRes.data || []);
            setRecentReports(reportsRes.data || []);
            setNotifications(notificationsRes.data || []);
          }
        }
      }
    } catch (err) {
      console.error('Erreur fetching director data:', err);
    } finally {
      setLoading(false);
    }
  }, [initialUser, initialProfile, isValidated]);

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
  const [reportSearchQuery, setReportSearchQuery] = React.useState('');
  const [reportFilterStatus, setReportFilterStatus] = React.useState<'all' | 'validated' | 'pending'>('all');
  const [selectedPhotosReport, setSelectedPhotosReport] = React.useState<any | null>(null);

  // History filtering states
  const [isFilterExpanded, setIsFilterExpanded] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState<'all' | '30-days' | 'custom'>('all');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const [loadingReportId, setLoadingReportId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const [weeklyMenu, setWeeklyMenu] = React.useState<any[]>([
    { day: 'Lundi', dish: 'Riz sauce arachide + Poisson', kcal: '450', color: 'bg-emerald-500' },
    { day: 'Mardi', dish: 'Pâte de maïs sauce légumes + Fromage', kcal: '420', color: 'bg-amber-500' },
    { day: 'Mercredi', dish: 'Haricot vert + Gari + Huile de palme', kcal: '480', color: 'bg-brand-orange' },
    { day: 'Jeudi', dish: 'Couscous de maïs + Sauce tomate', kcal: '440', color: 'bg-blue-500' },
    { day: 'Vendredi', dish: 'Riz gras au poulet', kcal: '500', color: 'bg-brand-green' },
  ]);

  const [isEditingMenu, setIsEditingMenu] = React.useState(false);
  const [editedMenu, setEditedMenu] = React.useState<any[]>([]);

  // Weekly Menu effects / load
  React.useEffect(() => {
    if (schoolInfo?.id) {
      const stored = localStorage.getItem(`weekly_menu_${schoolInfo.id}`);
      if (stored) {
        try {
          setWeeklyMenu(JSON.parse(stored));
        } catch (e) {
          console.error("Error loading menu:", e);
        }
      }
    }
  }, [schoolInfo?.id]);

  const saveWeeklyMenu = (newMenu: any[]) => {
    setWeeklyMenu(newMenu);
    if (schoolInfo?.id) {
      localStorage.setItem(`weekly_menu_${schoolInfo.id}`, JSON.stringify(newMenu));
    } else {
      localStorage.setItem(`weekly_menu_default`, JSON.stringify(newMenu));
    }
  };

  // Staff/Personnel local persistence
  const [personnel, setPersonnel] = React.useState<any[]>([
    { name: "Adama Traoré", phone: "97 00 11 22", health: "À jour", absence: 0 },
    { name: "Mariam Bello", phone: "98 10 20 30", health: "À jour", absence: 1 },
  ]);

  React.useEffect(() => {
    const key = schoolInfo?.id ? `personnel_${schoolInfo.id}` : `personnel_default`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setPersonnel(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading personnel:", e);
      }
    } else {
      setPersonnel([
        { name: "Adama Traoré", phone: "97 00 11 22", health: "À jour", absence: 0 },
        { name: "Mariam Bello", phone: "98 10 20 30", health: "À jour", absence: 1 },
      ]);
    }
  }, [schoolInfo?.id]);

  const handleDeletePersonnel = (indexToDelete: number) => {
    const updated = personnel.filter((_, idx) => idx !== indexToDelete);
    setPersonnel(updated);
    const key = schoolInfo?.id ? `personnel_${schoolInfo.id}` : `personnel_default`;
    localStorage.setItem(key, JSON.stringify(updated));
    toast.success("Membre du personnel retiré.");
  };

  // Update School Info state and handlers
  const [isEditingSchool, setIsEditingSchool] = React.useState(false);
  const [editedSchool, setEditedSchool] = React.useState({
    name: '',
    department: '',
    commune: '',
    arrondissement: '',
    capacity: ''
  });

  const handleEditSchoolClick = () => {
    setEditedSchool({
      name: schoolInfo?.name || '',
      department: schoolInfo?.department || '',
      commune: schoolInfo?.commune || '',
      arrondissement: schoolInfo?.arrondissement || '',
      capacity: schoolInfo?.capacity || ''
    });
    setIsEditingSchool(true);
  };

  const handleSaveSchoolInfo = async () => {
    try {
      let updatedSchool = { ...schoolInfo, ...editedSchool };
      
      // Persist locally
      if (schoolInfo?.id) {
        localStorage.setItem(`school_override_${schoolInfo.id}`, JSON.stringify(editedSchool));
        
        // Also try to update DB
        const { error } = await supabase
          .from('schools')
          .update({
            name: editedSchool.name,
            department: editedSchool.department,
            commune: editedSchool.commune,
            arrondissement: editedSchool.arrondissement
          })
          .eq('id', schoolInfo.id);
        
        if (error) {
          console.warn("Could not save to remote schools table:", error);
        }
      } else {
        localStorage.setItem(`school_override_default`, JSON.stringify(editedSchool));
      }

      setSchoolInfo(updatedSchool);
      setIsEditingSchool(false);
      toast.success("Informations de l'école mises à jour !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur de sauvegarde");
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolInfo) {
      toast.error('Erreur: Votre profil n\'est pas encore rattaché à un établissement. Veuillez contacter l\'administrateur.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const promises = formData.products.map(async (prod: any) => {
        const itemName = prod.item === 'Autre' ? prod.customItem : prod.item;
        const qtyToAdd = Number(prod.quantity);

        // Fetch existing first to add to it
        const { data: existing } = await supabase
          .from('inventory')
          .select('*')
          .eq('school_id', schoolInfo.id)
          .eq('item_name', itemName)
          .maybeSingle();

        if (existing) {
          return supabase
            .from('inventory')
            .update({ 
               quantity: Number(existing.quantity) + qtyToAdd,
               updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          return supabase
            .from('inventory')
            .insert({
              school_id: schoolInfo.id,
              item_name: itemName,
              quantity: qtyToAdd,
              unit: prod.unit
            });
        }
      });

      await Promise.all(promises);
      
      setIsSubmitting(false);
      setIsPending(true);
      fetchData();
    } catch (err) {
      console.error('Erreur réception vivres:', err);
      toast.error('Erreur lors de l\'enregistrement.');
      setIsSubmitting(false);
    }
  };

  const handleCookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newCook = {
        name: cookData.name,
        phone: cookData.phone,
        health: "À jour",
        absence: 0
      };

      const updatedPersonnel = [...personnel, newCook];
      setPersonnel(updatedPersonnel);

      const key = schoolInfo?.id ? `personnel_${schoolInfo.id}` : `personnel_default`;
      localStorage.setItem(key, JSON.stringify(updatedPersonnel));

      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success(`${cookData.name} a été enregistré avec succès !`);

      // Reset cookData
      setCookData({
        name: '',
        phone: '',
        email: '',
        photo: null
      });

      setTimeout(() => {
        setView('canteen');
        setIsSuccess(false);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement.");
      setIsSubmitting(false);
    }
  };

  const handleValidation = async (reportId: string) => {
    setLoadingReportId(reportId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('meal_reports')
        .update({ 
          is_validated: true, 
          validated_by: user.id 
        })
        .eq('id', reportId);

      if (error) throw error;
      
      toast.success('Rapport validé !');
      fetchData();
    } catch (err) {
      console.error('Erreur validation repas:', err);
      toast.error('Erreur lors de la validation.');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleEditInventory = async (item: any) => {
    const newQty = prompt("Nouvelle quantité (" + item.unit + "):", item.quantity.toString());
    if (newQty !== null && !isNaN(Number(newQty))) {
      try {
        const { error } = await supabase
          .from('inventory')
          .update({ quantity: Number(newQty), updated_at: new Date().toISOString() })
          .eq('id', item.id);
        if (error) throw error;
        toast.success("Quantité mise à jour");
        fetchData();
      } catch(err) {
        console.error(err);
        toast.error("Erreur mise à jour");
      }
    }
  };

  const handleDeleteInventory = async (item: any) => {
    if (confirm("Supprimer " + item.item_name + " de l'inventaire ?")) {
      try {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
        toast.success("Produit supprimé");
        fetchData();
      } catch(err) {
        console.error(err);
        toast.error("Erreur suppression");
      }
    }
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

  const filteredReports = React.useMemo(() => {
    if (!recentReports) return [];
    
    // Apply search and status filter
    let processed = recentReports.filter(report => {
      const cookName = (report.profiles?.full_name || '').toLowerCase();
      const mealDesc = (report.meal_description || '').toLowerCase();
      const dateStr = new Date(report.created_at).toLocaleDateString('fr-FR').toLowerCase();				
      
      const matchesSearch = cookName.includes(reportSearchQuery.toLowerCase()) || 
                            mealDesc.includes(reportSearchQuery.toLowerCase()) ||
                            dateStr.includes(reportSearchQuery.toLowerCase());
                            
      const matchesStatus = reportFilterStatus === 'all' || 
                            (reportFilterStatus === 'validated' && report.is_validated) ||
                            (reportFilterStatus === 'pending' && !report.is_validated);
                            
      return matchesSearch && matchesStatus;
    });

    // Apply time filter
    if (timeFilter === '30-days') {
      const limit = new Date();
      limit.setDate(limit.getDate() - 30);
      limit.setHours(0, 0, 0, 0);
      processed = processed.filter(r => new Date(r.created_at) >= limit);
    } else if (timeFilter === 'custom' && startDate && endDate) {
        const sDate = new Date(startDate);
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        processed = processed.filter(r => {
            const rDate = new Date(r.created_at);
            return rDate >= sDate && rDate <= eDate;
        });
    }
    
    return processed;
  }, [recentReports, reportSearchQuery, reportFilterStatus, timeFilter, startDate, endDate]);

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
                  type="tel"
                  name="phone_number"
                  inputMode="tel"
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 18) return 'Bonjour';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-800">Gestion de l'École</h1>
            <p className="text-slate-500">{schoolInfo ? `${schoolInfo.name} • ${schoolInfo.department}` : 'En attente de rattachement école'}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button 
              disabled={!isValidated}
              onClick={() => {
                if (!schoolInfo) {
                  toast.error("Votre compte est validé, mais votre établissement n'est pas encore configuré. Veuillez contacter l'administrateur.");
                  return;
                }
                setView('register');
              }} 
              variant="primary" 
              className={`rounded-xl font-bold flex items-center gap-2 ${!isValidated ? 'opacity-50 grayscale' : ''}`}
            >
              <Plus size={18} /> Enregistrer des Vivres
            </Button>
            <Button 
              disabled={!isValidated}
              onClick={() => {
                if (!schoolInfo) {
                  toast.error("Votre compte est validé, mais votre établissement n'est pas encore configuré. Veuillez contacter l'administrateur.");
                  return;
                }
                setView('register_cook');
              }} 
              variant="outline" 
              className={`rounded-xl border-slate-300 text-slate-700 font-bold flex items-center gap-2 hover:bg-slate-50 ${!isValidated ? 'opacity-50 grayscale' : ''}`}
            >
              <Users size={18} /> Inscrire un Cuisinier
            </Button>
          </div>
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
                    <div className="bg-white/20 backdrop-blur-md w-fit px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                      {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black font-display leading-tight">{getGreeting()}, {initialProfile?.full_name || 'cher utilisateur'}</h2>
                      <p className="text-emerald-100 font-extrabold uppercase text-xs tracking-widest bg-white/15 px-4 py-2 rounded-2xl w-fit shadow-sm border border-white/5">
                        Directeur de {schoolInfo?.name || "l'EPP CALAVI CENTRE"}
                      </p>
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
                      {loading || !realInventory ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between animate-pulse">
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-slate-200 rounded w-24" />
                              <div className="h-3 bg-slate-200 rounded w-16" />
                            </div>
                            <div className="h-6 bg-slate-200 rounded-full w-12" />
                          </div>
                        ))
                      ) : realInventory.length > 0 ? (
                        realInventory.slice(0, 3).map((item, i) => (
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
                        ))
                      ) : (
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
                      {loading || !recentReports ? (
                        <div className="h-8 bg-slate-200 rounded animate-pulse w-16" />
                      ) : (
                        <div className="text-3xl font-black text-slate-800">{recentReports.length.toLocaleString()}</div>
                      )}
                      <div className="text-[10px] text-emerald-500 font-black">Historique total</div>
                    </div>
                    <div className="space-y-2">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Élèves nourris</div>
                       {loading || !recentReports ? (
                         <div className="h-8 bg-slate-200 rounded animate-pulse w-16" />
                       ) : (
                         <div className="text-3xl font-black text-slate-800">{recentReports.reduce((acc, curr) => acc + (curr.students_count || 0), 0).toLocaleString()}</div>
                       )}
                       <div className="text-[10px] text-emerald-500 font-black">Cumulatif</div>
                    </div>
                    <div className="space-y-2">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vivres Reçus</div>
                       {loading || !realInventory ? (
                         <div className="h-8 bg-slate-200 rounded animate-pulse w-20" />
                       ) : (
                         <div className="text-3xl font-black text-slate-800">{realInventory.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0).toLocaleString()} <span className="text-sm">kg/L</span></div>
                       )}
                       <div className="text-[10px] text-blue-500 font-black">Stock actuel</div>
                    </div>
                    <div className="space-y-2">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validations</div>
                       {loading || !recentReports ? (
                         <div className="h-8 bg-slate-200 rounded animate-pulse w-12" />
                       ) : (
                         <div className="text-3xl font-black text-slate-800">{recentReports.filter(r => r.is_validated).length}</div>
                       )}
                       <div className="text-[10px] text-emerald-500 font-black">Approuvés</div>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-green transition-all duration-500" 
                      style={{ width: `${recentReports && recentReports.length > 0 ? Math.round((recentReports.filter(r => r.is_validated).length / recentReports.length) * 100) : 0}%` }} 
                    />
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
                      {loading || !recentReports ? (
                        <div className="space-y-3 animate-pulse">
                          <div className="h-4 bg-white/10 rounded w-full" />
                          <div className="h-12 bg-white/5 border border-white/10 rounded-2xl w-full" />
                        </div>
                      ) : recentReports.filter(r => !r.is_validated).length > 0 ? (
                        <>
                          <p className="text-sm text-slate-400 font-medium leading-relaxed">Les photos du service ont été transmises et attendent votre validation.</p>
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-300">{recentReports.filter(r => !r.is_validated).length} rapport(s) en attente</div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                          <CheckCircle className="text-emerald-500 mx-auto mb-2" size={24} />
                          <div className="text-sm font-bold text-emerald-400">À jour</div>
                        </div>
                      )}
                    </div>
                  </div>
                  {loading || !recentReports ? (
                    <div className="h-12 bg-white/10 rounded-2xl animate-pulse w-full" />
                  ) : recentReports.filter(r => !r.is_validated).length > 0 && (
                    <Button onClick={() => setView('history')} className="w-full bg-brand-orange hover:bg-brand-orange/90 rounded-2xl py-6 font-black uppercase text-xs tracking-widest">
                      Vérifier {recentReports.filter(r => !r.is_validated).length} preuve(s)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'history' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 text-left">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Historique des Rapports Émis</h3>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">
                      Suivi et validation des rapports journaliers
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-705 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors"
                  >
                    <Filter size={14} className={isFilterExpanded ? "text-brand-green" : "text-slate-400"} />
                    <span>{isFilterExpanded ? "Masquer les filtres" : "Voir plus & Filtrer"}</span>
                    {isFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Collapsible Filters */}
                <AnimatePresence>
                  {isFilterExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans block">Option d'historique</label>
                          <div className="flex flex-wrap gap-2">
                             <button onClick={() => setTimeFilter('all')} className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${timeFilter === 'all' ? 'bg-brand-green/10 text-brand-green' : 'bg-white'}`}>Tout</button>
                             <button onClick={() => setTimeFilter('30-days')} className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${timeFilter === '30-days' ? 'bg-brand-green/10 text-brand-green' : 'bg-white'}`}>30 derniers jours</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {loading ? (
                   <div className="space-y-3">
                     <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-full" />
                   </div>
                ) : filteredReports.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-500">
                        <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Menu</th>
                            <th className="px-4 py-3 text-center">Présence</th>
                            <th className="px-4 py-3 text-center">Photos</th>
                            <th className="px-4 py-3 text-center">Statut</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReports.map((report) => (
                            <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-4 font-bold text-slate-700">
                                {new Date(report.created_at).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-4 py-4">{report.meal_description}</td>
                              <td className="px-4 py-4 text-center">{report.students_count}</td>
                              <td className="px-4 py-4 text-center">
                                {report.photos?.length > 0 ? (
                                    <button 
                                      onClick={() => setSelectedPhotosReport(report)} 
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-brand-green bg-brand-green/10 hover:bg-brand-green/20 rounded-xl transition-all cursor-pointer"
                                    >
                                      <ImageIcon size={12} />
                                      <span>{report.photos.length} photos</span>
                                    </button>
                                ) : <span className="text-xs text-slate-400 italic">Aucune</span>}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {report.is_validated ? 
                                  <span className="text-emerald-600 font-bold">Validé</span> : 
                                  <span className="text-amber-600 font-bold">En attente</span>
                                }
                              </td>
                              <td className="px-4 py-4 text-center">
                                {!report.is_validated && (
                                   <Button 
                                     isLoading={loadingReportId === report.id} 
                                     onClick={() => handleValidation(report.id)}
                                     size="sm"
                                     className="bg-brand-green text-xs"
                                   >
                                     Valider
                                   </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-400">Aucun rapport trouvé.</div>
                )}
              </div>
            </div>
          )}

          {view === 'all_reports' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-left">
              <div>
                <h1 className="text-3xl font-display font-black text-slate-800 tracking-tight">Rapports du Cuisinier</h1>
                <p className="text-sm text-slate-500 mt-1">Consultez les détails de tous les rapports de repas enregistrés par le cuisinier de votre école.</p>
              </div>

              {/* Reports List */}
              <div className="space-y-6">
                {loading ? (
                  <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 text-center animate-pulse space-y-4">
                    <Loader2 className="animate-spin text-slate-400 mx-auto" size={32} />
                    <p className="text-sm text-slate-400 font-medium">Chargement des rapports...</p>
                  </div>
                ) : recentReports && recentReports.length > 0 ? (
                  recentReports.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row animate-in fade-in"
                    >
                      {/* Left Block / Thumbnail if photo exists */}
                      <div className="md:w-64 bg-slate-50 p-6 flex flex-col justify-between border-r border-slate-100">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 font-sans text-slate-400">
                            <Clock size={14} className="shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {new Date(report.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date du rapport</div>
                            <div className="text-base font-black text-slate-800">
                              {new Date(report.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100">
                          {report.is_validated ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100/50">
                              <CheckCircle size={12} className="text-emerald-500 shrink-0" /> Validé
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-brand-orange rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100/50 animate-pulse">
                              <Clock size={12} className="text-brand-orange shrink-0" /> En attente
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Block / Details */}
                      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Cuisinier Émetteur</span>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green font-black text-xs flex items-center justify-center shrink-0">
                                  {(report.profiles?.full_name || 'C')[0]}
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{report.profiles?.full_name || 'Cuisinier de l\'école'}</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Effectif servi</span>
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                                <Users size={16} className="text-brand-green shrink-0" />
                                <span className="text-sm font-black text-slate-700">{report.students_count} élèves</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Repas Servis</span>
                              <p className="text-base font-bold text-slate-800 leading-tight bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                {report.meal_description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Photos section */}
                        {report.photos && report.photos.length > 0 && (
                          <div className="pt-4 border-t border-slate-100">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Preuves Photos (Cliquer pour agrandir)</span>
                            <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-hide">
                              {report.photos.map((photo: string, pIdx: number) => (
                                <div 
                                  key={pIdx} 
                                  className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 relative group shrink-0"
                                >
                                  <img src={photo} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={`Preuve Repas ${pIdx + 1}`} referrerPolicy="no-referrer" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Approval Action if not validated */}
                        {!report.is_validated && (
                          <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <Button 
                              disabled={!isValidated}
                              isLoading={isSubmitting}
                              onClick={() => handleValidation(report.id)}
                              className="px-6 py-2.5 bg-brand-green hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg hover:shadow-brand-green/25"
                            >
                              Approuver et Valider maintenant
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center shadow-sm font-sans">
                    <FileText className="text-slate-300 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-100">Aucun rapport trouvé</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 font-medium leading-relaxed font-sans">
                      Aucun rapport ne correspond à votre recherche ou vos filtres pour le moment.
                    </p>
                  </div>
                )}
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
                  <Button onClick={() => setView('inventory')} className="rounded-2xl h-12 font-bold gap-2 bg-blue-600 hover:bg-blue-700">
                    <Package size={18} /> Nouveaux Arrivages ({notifications ? notifications.length : 0})
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading || !realInventory ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-pulse">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                        <div className="h-6 w-16 bg-slate-200 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24" />
                        <div className="h-8 bg-slate-200 rounded w-16" />
                      </div>
                    </div>
                  ))
                ) : realInventory.length > 0 ? realInventory.map((item, i) => {
                    const qty = Number(item.quantity);
                    const status = qty > 100 ? 'optimal' : qty > 50 ? 'warning' : 'low';
                    const level = Math.min(100, (qty / (item.item_name === 'Riz' ? 1000 : 500)) * 100);
                    
                    return (
                      <motion.div 
                        key={item.id}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between"
                      >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${
                            status === 'optimal' ? 'bg-emerald-50 text-emerald-600' : 
                            status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {item.item_name[0]}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEditInventory(item)} className="text-slate-400 hover:text-brand-green p-1.5 rounded-full hover:bg-slate-50 transition-colors">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteInventory(item)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-50 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              status === 'optimal' ? 'bg-emerald-100 text-emerald-600' : 
                              status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {status}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{item.item_name}</h4>
                          <div className="flex items-end gap-2 mt-1">
                            <span className="text-2xl font-black text-slate-900">{qty}</span>
                            <span className="text-slate-400 font-bold mb-1 uppercase text-xs">{item.unit}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                            <span>Niveau</span>
                            <span>{Math.round(level)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              status === 'optimal' ? 'bg-emerald-500' : 
                              status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                            }`} style={{ width: `${level}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-tighter">
                        <span>Dernière mise à jour</span>
                        <span className="text-slate-600 font-black italic">{new Date(item.updated_at).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="col-span-full py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 italic">
                    Aucun stock enregistré. Veuillez ajouter un premier arrivage.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mt-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold font-display">Notifications Récentes</h3>
                </div>
                <div className="space-y-4">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((n, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Package size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Mise à jour: {n.item_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Quantité actuelle: {n.quantity} {n.unit} • {new Date(n.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">Aucune nouvelle notification.</p>
                  )}
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
                      {personnel.map((c, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-300 shadow-sm">
                                {(c.name || 'C')[0]}
                              </div>
                              <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                            </div>
                            <button 
                              onClick={() => handleDeletePersonnel(i)}
                              className="text-slate-300 hover:text-brand-orange transition-colors"
                              title="Retirer le membre du personnel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest pt-2 border-t border-slate-100">
                            <div className="text-slate-400">Carnet Santé: <span className="text-emerald-500">{c.health || "À jour"}</span></div>
                            <div className="text-slate-400">Absences: <span className="text-brand-orange">{c.absence || 0}</span></div>
                          </div>
                        </div>
                      ))}
                      {personnel.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">Aucun personnel enregistré.</p>
                      )}
                    </div>
                  </div>
 
                  <div className="bg-brand-green/5 p-6 rounded-[2.5rem] border border-brand-green/10 space-y-6">
                    <h3 className="text-lg font-bold text-brand-green font-display flex items-center gap-2">
                      <School size={20} /> Infos École
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-brand-green/10 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Localisation</div>
                        <p className="text-sm font-bold text-slate-700 leading-tight">
                          {schoolInfo?.department || initialProfile?.department || '---'}, {schoolInfo?.commune || initialProfile?.commune || '---'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleEditSchoolClick}
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-brand-green font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:bg-brand-green/5 rounded-xl py-2"
                    >
                      Modifier Infos École
                    </Button>
                  </div>
                </div>
 
                {/* Right Column: Menu & Planning */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-brand-orange/5">
                      <div>
                        <h3 className="text-xl font-bold font-display">Menu de la Semaine</h3>
                        <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">Menu personnalisé de l'établissement</p>
                      </div>
                      <Button 
                        onClick={() => {
                          setEditedMenu(JSON.parse(JSON.stringify(weeklyMenu)));
                          setIsEditingMenu(true);
                        }}
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-brand-orange text-brand-orange hover:bg-brand-orange/10 font-bold"
                      >
                        Modifier Menu
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-slate-50">
                      {weeklyMenu.map((m, i) => (
                        <div key={i} className="flex items-center gap-6 p-6 hover:bg-slate-50 transition-colors">
                          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white ${m.color || 'bg-brand-green'} shadow-lg shadow-current/20`}>
                            <span className="text-[10px] font-black uppercase">{(m.day || '').slice(0, 3)}</span>
                          </div>
                          <div className="flex-1 text-left">
                             <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{m.day}</div>
                             <div className="text-lg font-bold text-slate-600">{m.dish}</div>
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
                      {initialProfile?.full_name?.split(' ').map((n:any)=>n[0]).join('') || 'U'}
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-green text-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                      <Camera size={16} />
                    </button>
                                   <h2 className="text-3xl font-black font-display text-slate-800">{initialProfile?.full_name || 'Utilisateur'}</h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <span className="px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-[10px] font-black uppercase">{initialProfile?.role || 'Rôle'}</span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">ID: {initialProfile?.id?.slice(0, 8) || '---'}</span>
                    </div>
                  </div>
                  <div className="md:ml-auto flex gap-3">
                    <Button variant="outline" className="rounded-2xl h-12 font-bold">Modifier Infos</Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1 border-l-4 border-brand-green">Informations de Contact</h3>
                    <div className="grid gap-4">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Email Professionnel</div>
                        <div className="font-bold text-slate-800">{initialUser?.email || 'N/A'}</div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Téléphone</div>
                        <div className="font-bold text-slate-800">{initialProfile?.phone || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1 border-l-4 border-brand-orange">Détails Établissement</h3>
                    <div className="grid gap-4">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">École Affectée</div>
                        <div className="font-bold text-slate-800">{schoolInfo?.name || initialProfile?.school || 'Non affecté'}</div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Localisation</div>
                        <div className="font-bold text-slate-800">{schoolInfo?.department || initialProfile?.department || '---'}, {schoolInfo?.commune || initialProfile?.commune || '---'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50">
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Ma Signature</h3>
                   </div>
                   <div className="aspect-[4/1] md:w-64 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 font-display italic text-2xl font-black">
                      {initialProfile?.full_name || 'Signature'}
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

      {/* Edit Weekly Menu Modal */}
      <AnimatePresence>
        {isEditingMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsEditingMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden flex flex-col my-8 shadow-black/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={() => setIsEditingMenu(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Modal Header */}
              <div className="border-b border-slate-100 pb-5 mb-6 text-left">
                <span className="px-3 py-1 bg-brand-orange/10 text-brand-orange font-black text-[10px] tracking-widest uppercase rounded-full">
                  Cantine-Connect • Menu Scolaire
                </span>
                <h3 className="text-2xl font-black text-slate-800 mt-2 tracking-tight">
                  Modifier le Menu de la Semaine
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Établissement: <span className="text-slate-600 font-black">{schoolInfo?.name || "Votre École"}</span>
                </p>
              </div>

              {/* Day lists for edit */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 text-left">
                {editedMenu.map((dayItem, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase ${dayItem.color || 'bg-brand-orange'}`}>
                        {(dayItem.day || '').slice(0, 3)}
                      </div>
                      <span className="text-sm font-black text-slate-700">{dayItem.day}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Dish title */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Repas / Plat à servir</label>
                        <input
                          type="text"
                          value={dayItem.dish}
                          onChange={(e) => {
                            const updated = [...editedMenu];
                            updated[idx].dish = e.target.value;
                            setEditedMenu(updated);
                          }}
                          placeholder={`Plat du ${dayItem.day}`}
                          className="w-full px-4 h-11 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Actions */}
              <div className="border-t border-slate-100 pt-5 mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditingMenu(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-xs rounded-xl tracking-wider cursor-pointer transition-all active:scale-95"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    saveWeeklyMenu(editedMenu);
                    setIsEditingMenu(false);
                    toast.success("Le menu de la semaine a été mis à jour avec succès !");
                  }}
                  className="px-6 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-black uppercase text-xs rounded-xl tracking-wider cursor-pointer transition-all active:scale-95 shadow-lg shadow-brand-orange/20"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit School Info Modal */}
      <AnimatePresence>
        {isEditingSchool && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsEditingSchool(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden flex flex-col my-8 shadow-black/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={() => setIsEditingSchool(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Modal Header */}
              <div className="border-b border-slate-100 pb-5 mb-6 text-left">
                <span className="px-3 py-1 bg-brand-green/10 text-brand-green font-black text-[10px] tracking-widest uppercase rounded-full">
                  Cantine-Connect • Administration
                </span>
                <h3 className="text-2xl font-black text-slate-800 mt-2 tracking-tight">
                  Modifier les Infos d'Établissement
                </h3>
              </div>

              {/* Form Input list */}
              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nom de l'école</label>
                  <input
                    type="text"
                    value={editedSchool.name}
                    onChange={(e) => setEditedSchool({ ...editedSchool, name: e.target.value })}
                    className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                    placeholder="Nom de l'établissement"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Département</label>
                    <input
                      type="text"
                      value={editedSchool.department}
                      onChange={(e) => setEditedSchool({ ...editedSchool, department: e.target.value })}
                      className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                      placeholder="ex: Atlantique"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Commune</label>
                    <input
                      type="text"
                      value={editedSchool.commune}
                      onChange={(e) => setEditedSchool({ ...editedSchool, commune: e.target.value })}
                      className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                      placeholder="ex: Abomey-Calavi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Arrondissement</label>
                    <input
                      type="text"
                      value={editedSchool.arrondissement}
                      onChange={(e) => setEditedSchool({ ...editedSchool, arrondissement: e.target.value })}
                      className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                      placeholder="ex: Calavi Centre"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Effectif scolaire (élèves)</label>
                    <input
                      type="number"
                      value={editedSchool.capacity}
                      onChange={(e) => setEditedSchool({ ...editedSchool, capacity: e.target.value })}
                      className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                      placeholder="ex: 350"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-slate-100 pt-5 mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditingSchool(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-xs rounded-xl tracking-wider cursor-pointer transition-all active:scale-95"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveSchoolInfo}
                  className="px-6 py-2.5 bg-brand-green hover:bg-green-700 text-white font-black uppercase text-xs rounded-xl tracking-wider cursor-pointer transition-all active:scale-95 shadow-lg shadow-brand-green/20"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Photo Preview Modal (Lightbox) */}
      <AnimatePresence>
        {selectedPhotosReport && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
            onClick={() => setSelectedPhotosReport(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-lg">Photos du repas</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Enregistré le {new Date(selectedPhotosReport.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedPhotosReport(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                 <div className="grid gap-4 md:grid-cols-2">
                    {selectedPhotosReport.photos.map((photoUrl: string, index: number) => (
                      <div key={index} className="relative group rounded-2xl overflow-hidden border border-slate-150 bg-slate-50 shadow-sm">
                        <img 
                          src={photoUrl} 
                          alt={`Repas ${index + 1}`} 
                          className="w-full h-80 object-cover rounded-2xl" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-right">
                <Button 
                  onClick={() => setSelectedPhotosReport(null)}
                  variant="outline"
                  className="rounded-xl border-slate-200"
                >
                  Fermer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
