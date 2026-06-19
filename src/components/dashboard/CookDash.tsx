import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  ChefHat, 
  Users, 
  UtensilsCrossed, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Plus,
  Trash2,
  X,
  User,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import { Button, Input, ConfirmDialog } from '../ui';
import { toast } from 'sonner';

import { supabase } from '../../lib/supabase';

export default function CookDash({ 
  isValidated, 
  user: initialUser, 
  profile: initialProfile,
  view = 'overview'
}: { 
  isValidated: boolean, 
  user?: any, 
  profile?: any,
  view?: string
}) {
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<{ isOpen: boolean; onConfirm: () => void; title: string; message: string } | null>(null);
  const [schoolId, setSchoolId] = React.useState<string | null>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [realInventory, setRealInventory] = React.useState<any[] | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userProfile?.full_name
        })
        .eq('id', initialUser?.id || userProfile?.id);
      
      if (error) throw error;
      toast.success('Profil mis à jour avec succès !');
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const [pastReports, setPastReports] = React.useState<any[]>([]);

  // History filtering and calendar states
  const [isFilterExpanded, setIsFilterExpanded] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState<'7-reports' | '30-days' | 'custom'>('7-reports');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  // Selected report for photo preview modal
  const [selectedPhotosReport, setSelectedPhotosReport] = React.useState<any | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true);
    try {
      const activeUser = initialUser || (await supabase.auth.getUser()).data.user;
      if (!activeUser) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', activeUser.id).single();

      if (profile) {
        setUserProfile(profile);
        setSchoolId(profile.school_id);
        
        if (profile.school_id) {
          const [invRes, reportsRes] = await Promise.all([
            supabase.from('inventory').select('*').eq('school_id', profile.school_id),
            supabase.from('meal_reports')
              .select('*')
              .eq('school_id', profile.school_id)
              .order('created_at', { ascending: false })
          ]);

          if (invRes.data) setRealInventory(invRes.data);
          
          if (reportsRes.data) {
            setPastReports(reportsRes.data);
            
            // Process week progress
            const progress = [false, false, false, false, false];
            const recent = reportsRes.data.filter(r => new Date(r.created_at) > new Date(new Date().setDate(new Date().getDate() - 7)));
            recent.forEach(r => {
              const d = new Date(r.created_at);
              const day = d.getDay(); 
              if (day >= 1 && day <= 5) {
                progress[day - 1] = true;
              }
            });
            setWeekProgress(progress);

            // Process stats - only for last 30 days
            const last30DaysReports = reportsRes.data.filter(r => new Date(r.created_at) > new Date(new Date().setDate(new Date().getDate() - 30)));
            const totalStudents = last30DaysReports.reduce((acc: number, curr: any) => acc + (curr.students_count || 0), 0);
            const avg = last30DaysReports.length > 0 ? Math.round(totalStudents / last30DaysReports.length) : 0;
            
            // Service rate: actual reports / potential working days in last 30 days (approx 22)
            const rate = Math.min(100, Math.round((last30DaysReports.length / 22) * 100));
            
            setStats({ avgStudents: avg, serviceRate: rate });
          } else {
            setPastReports([]);
            setWeekProgress([false, false, false, false, false]);
            setStats({ avgStudents: 0, serviceRate: 0 });
          }
        } else {
          setRealInventory([]);
          setPastReports([]);
          setWeekProgress([false, false, false, false, false]);
          setStats({ avgStudents: 0, serviceRate: 0 });
        }
      }
    } catch (err) {
      console.error('Erreur profil / stat:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [initialUser, initialProfile]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Form State
  const [studentsCount, setStudentsCount] = React.useState('');
  const [meal, setMeal] = React.useState('Riz sauce arachide');
  const [customMeal, setCustomMeal] = React.useState('');
  
  const [photos, setPhotos] = React.useState<(string | null)[]>([null, null]);
  const [ingredients, setIngredients] = React.useState<any[]>([]);
  const [newIngredient, setNewIngredient] = React.useState({ name: '', qty: 0, unit: 'kg' });
  const [showAddIngredient, setShowAddIngredient] = React.useState(false);
  const [addMode, setAddMode] = React.useState<'select' | 'manual'>('select');

  React.useEffect(() => {
    if (realInventory && realInventory.length > 0 && ingredients.length === 0) {
      // Pré-remplir avec les stocks existants les plus communs
      const common = realInventory.filter(item => ['Riz', 'Maïs', 'Haricot', 'Huile'].includes(item.item_name));
      setIngredients(common.map(item => ({ name: item.item_name, qty: 0, unit: item.unit || 'kg' })));
    }
  }, [realInventory]);
  
  const [weekProgress, setWeekProgress] = React.useState<boolean[] | null>(null); // Mon-Fri status
  const [stats, setStats] = React.useState<{ avgStudents: number | null; serviceRate: number | null }>({ avgStudents: null, serviceRate: null });

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotos = [...photos];
        newPhotos[index] = reader.result as string;
        setPhotos(newPhotos);
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => {
    if (newIngredient.name.trim()) {
      const alreadyExists = ingredients.some(item => item.name.toLowerCase() === newIngredient.name.trim().toLowerCase());
      if (alreadyExists) {
        toast.error(`"${newIngredient.name}" est déjà ajouté.`);
        return;
      }
      setIngredients([...ingredients, { ...newIngredient, name: newIngredient.name.trim() }]);
      setNewIngredient({ name: '', qty: 0, unit: 'kg' });
      setShowAddIngredient(false);
    } else {
      toast.error("Veuillez spécifier le nom de l'ingrédient.");
    }
  };

  const removeIngredient = (index: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer l\'ingrédient',
      message: 'Êtes-vous sûr de vouloir supprimer cet ingrédient ? Cette action est irréversible.',
      onConfirm: () => {
        setIngredients(ingredients.filter((_, i) => i !== index));
        toast.success('Ingrédient supprimé.');
      }
    });
  };

  const handleSubmitReport = async () => {
    if (!schoolId) {
      toast.error('Erreur: Vous n\'êtes rattaché à aucun établissement. Veuillez contacter votre directeur.');
      return;
    }
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('meal_reports')
        .insert({
          school_id: schoolId,
          cook_id: user.id,
          meal_description: meal === 'Autre' ? customMeal : meal,
          students_count: parseInt(studentsCount),
          photos: photos.filter(p => p !== null) as string[]
        });

      if (error) throw error;
      
      // Update inventory (decrement quantities)
      const invPromises = ingredients.map(item => {
        const existing = realInventory.find(ri => ri.item_name === item.name);
        if (existing) {
          return supabase
            .from('inventory')
            .update({ quantity: Math.max(0, Number(existing.quantity) - item.qty) })
            .eq('id', existing.id);
        }
        return Promise.resolve();
      });
      await Promise.all(invPromises);

      // Mettre à jour la progression et l'historique
      await fetchData();
      
      setIsLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        resetForm();
      }, 5000);
    } catch (err) {
      console.error('Erreur rapport repas:', err);
      toast.error('Erreur lors de l\'envoi du rapport.');
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setPhotos([null, null]);
    setStudentsCount('');
    setMeal('Riz sauce arachide');
    setCustomMeal('');
    setIsSuccess(false);
  };

  const displayedReports = React.useMemo(() => {
    if (!pastReports) return [];
    
    // If filter accordion is NOT expanded, default to latest 7 reports directly
    if (!isFilterExpanded) {
      return pastReports.slice(0, 7);
    }
    
    // Otherwise, filter according to the active expanded filter
    if (timeFilter === '7-reports') {
      return pastReports.slice(0, 7);
    }
    
    if (timeFilter === '30-days') {
      const limit = new Date();
      limit.setDate(limit.getDate() - 30);
      limit.setHours(0, 0, 0, 0);
      return pastReports.filter(r => new Date(r.created_at) >= limit);
    }
    
    if (timeFilter === 'custom') {
      return pastReports.filter(r => {
        const rDate = new Date(r.created_at);
        rDate.setHours(0, 0, 0, 0);
        
        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0, 0, 0, 0);
          if (rDate < sDate) return false;
        }
        
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(23, 59, 59, 999);
          if (rDate > eDate) return false;
        }
        
        return true;
      });
    }
    
    return pastReports;
  }, [pastReports, isFilterExpanded, timeFilter, startDate, endDate]);

  const isStep1Valid = studentsCount !== '' && (meal !== 'Autre' || customMeal.trim() !== '');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 18) return 'Bonjour';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            {getGreeting()}, {userProfile?.full_name || 'cher utilisateur'}
          </h1>
          <p className="text-slate-500 font-medium">
            {view === 'overview' && 'Tableau de Bord'}
            {view === 'rapport' && 'Rapport Journalier'}
            {view === 'inventory' && 'Gestion des Stocks'}
            {view === 'profile' && 'Mon Profil'}
            {view === 'settings' && 'Paramètres'} • {schoolId ? 'Cantine Scolaire' : 'En attente de rattachement école'}
          </p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
          <Clock className="text-brand-green" size={18} />
          <span className="text-sm font-bold text-slate-700">
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                    <Users size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Effectif Moyen</p>
                    {isLoadingData ? (
                      <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mt-1" />
                    ) : (
                      <p className="text-2xl font-black text-slate-800">{stats.avgStudents ?? 0} <span className="text-sm font-medium text-slate-400">élèves</span></p>
                    )}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                    <CheckCircle size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Taux de Service</p>
                    {isLoadingData ? (
                      <div className="h-6 w-16 bg-slate-200 rounded animate-pulse mt-1" />
                    ) : (
                      <p className="text-2xl font-black text-slate-800">{stats.serviceRate ?? 0}%</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly Status */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Progression Hebdomadaire</h3>
                  <span className="text-xs font-black text-brand-green bg-brand-green/10 px-3 py-1 rounded-full uppercase tracking-widest">Semaine en cours</span>
                </div>
                <div className="grid grid-cols-5 gap-4 md:gap-6">
                  {isLoadingData ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
                        <div className="w-full aspect-square rounded-2xl bg-slate-200" />
                        <div className="h-3 w-10 bg-slate-200 rounded" />
                      </div>
                    ))
                  ) : (
                    ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day, i) => {
                      const active = weekProgress ? weekProgress[i] : false;
                      return (
                        <div key={i} className="flex flex-col items-center gap-3">
                           <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${
                            active ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20 scale-105' : 'bg-slate-50 text-slate-200'
                          }`}>
                            {active ? <CheckCircle size={24} /> : <Clock size={24} />}
                          </div>
                          <span className={`text-[10px] md:text-sm font-bold ${active ? 'text-brand-green' : 'text-slate-400'}`}>{day}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Historique des Rapports */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Historique des Rapports Émis</h3>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">
                      Suivi complet de vos rapports journaliers de cantine
                    </p>
                  </div>
                  
                  {/* Collapsible toggle button */}
                  <button
                    onClick={() => {
                      setIsFilterExpanded(!isFilterExpanded);
                      if (!isFilterExpanded) {
                        // When opening, reset filter mode to 30 days or customize
                        setTimeFilter('30-days');
                      } else {
                        // When closing, revert to showing 7 reports as default
                        setTimeFilter('7-reports');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-705 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors"
                  >
                    <Filter size={14} className={isFilterExpanded ? "text-brand-green" : "text-slate-400"} />
                    <span>{isFilterExpanded ? "Masquer les filtres" : "Voir plus & Filtrer"}</span>
                    {isFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Collapsible Panel */}
                <AnimatePresence>
                  {isFilterExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                        
                        {/* Quick filters selection */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans block">
                            Option d'historique
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setTimeFilter('7-reports')}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                timeFilter === '7-reports'
                                  ? 'bg-brand-green/10 text-brand-green border-brand-green/35'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50/50'
                              }`}
                            >
                              7 derniers rapports
                            </button>
                            <button
                              onClick={() => setTimeFilter('30-days')}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                timeFilter === '30-days'
                                  ? 'bg-brand-green/10 text-brand-green border-brand-green/35'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50/50'
                              }`}
                            >
                              30 derniers jours
                            </button>
                            <button
                              onClick={() => setTimeFilter('custom')}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                timeFilter === 'custom'
                                  ? 'bg-brand-green/10 text-brand-green border-brand-green/35'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50/50'
                              }`}
                            >
                              Période personnalisée (Calendrier)
                            </button>
                          </div>
                        </div>

                        {/* Custom calendars selection */}
                        <div className={`space-y-3 transition-all duration-200 ${timeFilter === 'custom' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans block">
                            Sélectionner les dates
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                  setStartDate(e.target.value);
                                  if (timeFilter !== 'custom') setTimeFilter('custom');
                                }}
                                className="w-full pl-9 pr-2 h-9 rounded-xl border border-slate-200 bg-white text-xs text-slate-705 font-bold outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                                placeholder="Date début"
                              />
                            </div>
                            <span className="text-slate-405 text-xs font-bold">à</span>
                            <div className="relative flex-1">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                  setEndDate(e.target.value);
                                  if (timeFilter !== 'custom') setTimeFilter('custom');
                                }}
                                className="w-full pl-9 pr-2 h-9 rounded-xl border border-slate-200 bg-white text-xs text-slate-750 font-bold outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                                placeholder="Date fin"
                              />
                            </div>
                            {(startDate || endDate) && (
                              <button
                                onClick={() => {
                                  setStartDate('');
                                  setEndDate('');
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Réinitialiser"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {isLoadingData ? (
                  <div className="space-y-3">
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-full" />
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-full" />
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-full" />
                  </div>
                ) : displayedReports && displayedReports.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-500">
                      <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Menu préparé</th>
                          <th className="px-4 py-3 text-center">Présence</th>
                          <th className="px-4 py-3 text-center">Photos</th>
                          <th className="px-4 py-3 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {displayedReports.map((report) => {
                          const pubDate = new Date(report.created_at);
                          const dateStr = pubDate.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          });
                          const isToday = new Date().toDateString() === pubDate.toDateString();

                          const hasPhotos = report.photos && report.photos.length > 0;

                          return (
                            <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-4 font-bold text-slate-700">
                                <div className="flex items-center gap-2">
                                  {dateStr}
                                  {isToday && (
                                    <span className="px-1.5 py-0.5 text-[8px] bg-brand-green/10 text-brand-green font-black uppercase rounded">
                                      Aujourd'hui
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 font-medium text-slate-600">{report.meal_description}</td>
                              <td className="px-4 py-4 font-bold text-slate-700 text-center tabular-nums">
                                {report.students_count} élèves
                              </td>
                              <td className="px-4 py-4 text-center">
                                {hasPhotos ? (
                                  <button
                                    onClick={() => setSelectedPhotosReport(report)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-brand-green bg-brand-green/10 hover:bg-brand-green/20 rounded-xl transition-all cursor-pointer"
                                    title="Visualiser les clichés"
                                  >
                                    <Eye size={12} />
                                    <span>{report.photos.length} photo{report.photos.length > 1 ? 's' : ''}</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Aucune</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {report.is_validated ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                    Validé
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-50 text-amber-600 border border-amber-100/50">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    En attente
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100 border-dashed text-slate-450 font-semibold text-xs">
                    {isFilterExpanded 
                      ? "Aucun rapport trouvé pour les critères de filtrage sélectionnés." 
                      : "Aucun rapport historique trouvé pour cet établissement."
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {/* Quick Help */}
              <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-6">
                <ChefHat size={40} className="text-brand-green" />
                <h3 className="text-xl font-bold">Assistant Culinaire</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Besoin d'idées de recettes ou de conseils sur les quantités ? Notre assistant IA est là pour vous aider.
                </p>
                <Button className="w-full bg-brand-green text-white rounded-xl">DISCUTER AVEC L'IA</Button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'rapport' && (
          <motion.div 
            key="rapport"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="bg-brand-green p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed />
                    <h3 className="text-lg font-bold">Nouveau Rapport</h3>
                  </div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest">Étape {step} / 3</span>
                </div>
                
                <div className="p-8">
                  {isSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <div className="bg-brand-green/10 p-6 rounded-full mb-6">
                        <CheckCircle size={64} className="text-brand-green" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Rapport envoyé avec succès !</h3>
                      <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium italic">
                        Les données ont été synchronisées avec la direction.
                      </p>
                      <Button onClick={resetForm} variant="outline" className="rounded-xl">
                        Créer un autre rapport
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          <h4 className="font-bold text-xl text-slate-800">1. Présence et Menu</h4>
                          <div className="grid md:grid-cols-2 gap-6">
                            <Input 
                              label="Nombre d'élèves présents" 
                              type="number" 
                              placeholder="0" 
                              value={studentsCount}
                              onChange={(e) => setStudentsCount(e.target.value)}
                              icon={<Users className="text-slate-400" size={16} />} 
                            />
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-slate-700 ml-1 uppercase tracking-wider">Repas préparé</label>
                              <select 
                                value={meal}
                                onChange={(e) => setMeal(e.target.value)}
                                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-green/30 outline-none"
                              >
                                <option>Riz sauce arachide</option>
                                <option>Pâte de maïs et légumes</option>
                                <option>Haricot et gari</option>
                                <option>Igname pilée sauce graine</option>
                                <option>Manioc cuit et huile de palme</option>
                                <option value="Autre">Autre (préciser...)</option>
                              </select>
                            </div>
                          </div>
                          
                          {meal === 'Autre' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Input 
                                label="Nom du repas personnalisé" 
                                placeholder="Entrez le nom du plat..." 
                                value={customMeal}
                                onChange={(e) => setCustomMeal(e.target.value)}
                              />
                            </motion.div>
                          )}

                          <Button 
                            disabled={!isValidated || !isStep1Valid}
                            onClick={() => setStep(2)} 
                            className="w-full rounded-xl py-6 bg-slate-900 text-white font-black"
                          >
                            Étape Suivante <ArrowRight className="ml-2" size={18} />
                          </Button>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xl text-slate-800">2. Ingrédients utilisés</h4>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setShowAddIngredient(prev => !prev);
                                setAddMode('select');
                                setNewIngredient({ name: '', qty: 0, unit: 'kg' });
                              }}
                              className="text-[10px] font-black uppercase tracking-widest rounded-lg"
                            >
                              <Plus size={14} className="mr-1" /> {showAddIngredient ? 'Fermer' : 'Ajouter'}
                            </Button>
                          </div>

                          {showAddIngredient && (
                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4 animate-in fade-in slide-in-from-top-2 text-left">
                              <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2">
                                <h5 className="text-xs font-black uppercase text-brand-green tracking-widest">Nouvel ingrédient</h5>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddMode('select');
                                      setNewIngredient({ name: '', qty: 0, unit: 'kg' });
                                    }}
                                    className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                                      addMode === 'select' ? 'bg-white shadow-sm text-brand-green' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                  >
                                    Du stock
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddMode('manual');
                                      setNewIngredient({ name: '', qty: 0, unit: 'kg' });
                                    }}
                                    className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                                      addMode === 'manual' ? 'bg-white shadow-sm text-brand-green' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                  >
                                    Manuel
                                  </button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {addMode === 'select' ? (
                                  <div className="sm:col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Sélectionner</label>
                                    <select
                                      value={newIngredient.name}
                                      onChange={(e) => {
                                        const name = e.target.value;
                                        const matchingItem = realInventory?.find(item => item.item_name === name);
                                        setNewIngredient({
                                          name,
                                          qty: newIngredient.qty,
                                          unit: matchingItem?.unit || 'kg'
                                        });
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-green/35"
                                    >
                                      <option value="">-- Choisir un produit --</option>
                                      {realInventory && realInventory.length > 0 ? (
                                        realInventory.map((item) => (
                                          <option key={item.id} value={item.item_name}>
                                            {item.item_name} ({item.quantity} {item.unit})
                                          </option>
                                        ))
                                      ) : (
                                        <option disabled>Aucun produit en stock</option>
                                      )}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="sm:col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nom</label>
                                    <input
                                      type="text"
                                      placeholder="Ex: Sel, Épices..."
                                      value={newIngredient.name}
                                      onChange={(e) => {
                                        setNewIngredient({
                                          ...newIngredient,
                                          name: e.target.value
                                        });
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-green/35"
                                    />
                                  </div>
                                )}

                                <div>
                                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Quantité</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                    value={newIngredient.qty || ''}
                                    onChange={(e) => {
                                      setNewIngredient({
                                        ...newIngredient,
                                        qty: Math.max(0, Number(e.target.value))
                                      });
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-green/35"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Unité</label>
                                  <input
                                    type="text"
                                    placeholder="kg, L, etc."
                                    value={newIngredient.unit}
                                    onChange={(e) => {
                                      setNewIngredient({
                                        ...newIngredient,
                                        unit: e.target.value
                                      });
                                    }}
                                    disabled={addMode === 'select'}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-green/35 disabled:opacity-50 disabled:bg-slate-50"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-100/50">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setShowAddIngredient(false);
                                    setNewIngredient({ name: '', qty: 0, unit: 'kg' });
                                  }}
                                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                  Annuler
                                </Button>
                                <Button
                                  variant="primary"
                                  type="button"
                                  size="sm"
                                  onClick={addIngredient}
                                  className="text-[10px] font-black uppercase tracking-widest bg-brand-green hover:bg-brand-green/90 text-white rounded-lg"
                                >
                                  Ajouter à la liste
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-3">
                             {ingredients.map((item, i) => (
                               <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                                 <div className="flex-1 font-bold text-slate-700">{item.name}</div>
                                 <div className="flex items-center gap-2">
                                    <input 
                                      type="number" 
                                      className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-brand-green outline-none focus:ring-2 focus:ring-brand-green/30"
                                      value={item.qty || ''}
                                      placeholder="0"
                                      min="0"
                                      onChange={(e) => {
                                        const val = Math.max(0, Number(e.target.value));
                                        const nextIngredients = [...ingredients];
                                        nextIngredients[i] = {
                                          ...nextIngredients[i],
                                          qty: val
                                        };
                                        setIngredients(nextIngredients);
                                      }}
                                    />
                                    <span className="text-[10px] font-black text-slate-400 uppercase w-8">{item.unit}</span>
                                    <button 
                                      type="button"
                                      onClick={() => removeIngredient(i)} 
                                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                 </div>
                               </div>
                             ))}
                          </div>
                          <div className="flex gap-4 pt-4">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl">Retour</Button>
                            <Button onClick={() => setStep(3)} className="flex-[2] rounded-xl bg-slate-900">Suivant</Button>
                          </div>
                        </motion.div>
                      )}

                      {step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          <h4 className="font-bold text-xl text-slate-800">3. Photos (Obligatoire)</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {photos.map((p, idx) => (
                              <div key={idx} className="relative">
                                {!p ? (
                                  <div 
                                    onClick={() => document.getElementById(`photo-upload-${idx}`)?.click()}
                                    className="h-44 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 text-center flex flex-col items-center justify-center group hover:border-brand-green transition-colors cursor-pointer"
                                  >
                                    <Camera className="text-slate-300 group-hover:text-brand-green mb-2" size={32} />
                                    <p className="text-slate-500 font-bold text-xs">Charger Photo {idx + 1}</p>
                                    <input 
                                      type="file" 
                                      id={`photo-upload-${idx}`} 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={(e) => handlePhotoUpload(idx, e)}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative group overflow-hidden rounded-3xl border-4 border-slate-50 shadow-sm">
                                    <img src={p} className="w-full h-44 object-cover" />
                                    <button className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl" onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: 'Supprimer la photo',
                                        message: 'Êtes-vous sûr de vouloir supprimer cette photo ?',
                                        onConfirm: () => {
                                          const nextPhotos = [...photos];
                                          nextPhotos[idx] = null;
                                          setPhotos(nextPhotos);
                                          toast.success('Photo supprimée.');
                                        }
                                      });
                                    }}>
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-4 pt-4">
                            <Button variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-xl">Retour</Button>
                            <Button 
                              onClick={handleSubmitReport}
                              isLoading={isLoading}
                              className="flex-[2] rounded-xl bg-brand-orange text-white font-black" 
                              disabled={photos.some(p => !p)}
                            >
                               VALIDER LE RAPPORT
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-brand-green/5 p-6 rounded-3xl border border-brand-green/10">
                <h4 className="text-xs font-black text-brand-green uppercase tracking-widest mb-4">Informations</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Chaque rapport envoyé décrémente automatiquement les stocks nationaux de votre école. Assurez-vous des quantités saisies.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'inventory' && (
          <motion.div 
            key="inventory"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-50">
                  <h3 className="text-xl font-bold text-slate-800">Inventaire de la Cantine</h3>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">État des stocks actuels</p>
               </div>
               <div className="p-0">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantité</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">État</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {isLoadingData || !realInventory ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-8 py-6">
                              <div className="h-4 bg-slate-200 rounded w-28" />
                            </td>
                            <td className="px-8 py-6">
                              <div className="h-4 bg-slate-200 rounded w-16" />
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-200" />
                                <div className="h-3 bg-slate-200 rounded w-20" />
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="h-8 bg-slate-200 rounded-lg w-16 ml-auto" />
                            </td>
                          </tr>
                        ))
                      ) : realInventory.length > 0 ? (
                        realInventory.map((item, i) => {
                          const lowStock = Number(item.quantity) < 50;
                          return (
                            <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-6">
                                <span className="font-bold text-slate-700">{item.item_name}</span>
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-sm font-black text-slate-800">{item.quantity} <span className="text-slate-400 font-medium">{item.unit}</span></span>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${lowStock ? 'bg-red-500 animate-pulse' : 'bg-brand-green'}`} />
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${lowStock ? 'text-red-500' : 'text-brand-green'}`}>
                                    {lowStock ? 'Stock Critique' : 'En Stock'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-400 hover:text-slate-900 rounded-lg">Signaler</Button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">Aucun produit en stock</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}

        {view === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="max-w-4xl"
          >
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-brand-green to-emerald-400" />
              <div className="px-8 pb-10">
                <div className="relative -mt-12 mb-6">
                  <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl">
                    <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <User size={48} />
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nom complet</label>
                      <input 
                        type="text" 
                        value={userProfile?.full_name || ''} 
                        onChange={(e) => setUserProfile({...userProfile, full_name: e.target.value})}
                        className="w-full text-2xl font-black text-slate-800 bg-transparent border-b border-dashed border-slate-200 focus:border-brand-green outline-none"
                      />
                      <p className="text-brand-green font-black uppercase text-[10px] tracking-widest mt-1">Cuisinier Qualifié</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Établissement</p>
                          <p className="text-sm font-bold text-slate-700">{schoolId ? 'Cantine Scolaire Rattachée' : 'Non rattaché'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membre Depuis</p>
                          <p className="text-sm font-bold text-slate-700">
                            {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Date inconnue'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Statistiques de Service</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl border border-slate-100 bg-white">
                        {isLoadingData || !weekProgress ? (
                          <div className="h-8 w-12 bg-slate-200 rounded animate-pulse mb-1" />
                        ) : (
                          <p className="text-2xl font-black text-brand-green">{weekProgress.filter(p => p).length}</p>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Rapports cette semaine</p>
                      </div>
                      <div className="p-4 rounded-2xl border border-slate-100 bg-white">
                        {isLoadingData || stats.serviceRate === null ? (
                          <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mb-1" />
                        ) : (
                          <p className="text-2xl font-black text-brand-green">{stats.serviceRate}%</p>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Assiduité</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-slate-200 text-slate-600 font-bold"
                      onClick={handleUpdateProfile}
                      isLoading={isUpdatingProfile}
                    >
                      Sauvegarder les modifications
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl"
          >
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50">
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-800">Paramètres</h3>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Gérez vos préférences</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-700">Notifications Push</p>
                    <p className="text-xs text-slate-400">Recevoir des rappels pour les rapports journaliers</p>
                  </div>
                  <div className="w-12 h-6 bg-brand-green rounded-full relative cursor-pointer shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-700">Mode Sombre</p>
                    <p className="text-xs text-slate-400">Adapter l'interface pour une utilisation nocturne</p>
                  </div>
                  <div className="w-12 h-6 bg-slate-100 rounded-full relative cursor-pointer border border-slate-200">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-slate-300 rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-700">Langue de l'interface</p>
                    <p className="text-xs text-slate-400">Français (Bénin)</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-brand-green font-bold text-xs uppercase tracking-widest">Changer</Button>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 rounded-b-3xl">
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                        <AlertCircle size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 tabular-nums">Zone Sensible</p>
                        <p className="text-[10px] text-slate-400 font-medium">Réinitialisation des données</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-red-500 font-bold text-xs">Supprimer</Button>
                </div>
                <Button className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold">Enregistrer les préférences</Button>
              </div>
            </div>
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
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-lg">Photos du repas</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Enregistré le {new Date(selectedPhotosReport.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedPhotosReport(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Main Info Box */}
              <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-slate-600 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Menu Préparé</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{selectedPhotosReport.meal_description}</div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Présence</span>
                    <span className="text-slate-800 font-bold text-sm block">{selectedPhotosReport.students_count} élèves</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Statut</span>
                    {selectedPhotosReport.is_validated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100/50">
                        Validé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 font-black uppercase px-2 py-0.5 rounded-full border border-amber-100/50">
                        En attente
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos Content list */}
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                {selectedPhotosReport.photos && selectedPhotosReport.photos.length > 0 ? (
                  <div className={`grid gap-4 ${selectedPhotosReport.photos.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                    {selectedPhotosReport.photos.map((photoUrl: string, index: number) => (
                      <div key={index} className="relative group rounded-2xl overflow-hidden border border-slate-150 bg-slate-50 shadow-sm">
                        <img 
                          src={photoUrl} 
                          alt={`Repas option photo ${index + 1}`} 
                          className="w-full h-80 object-cover rounded-2xl" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Photo #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ImageIcon className="mx-auto text-slate-300 mb-2" size={40} />
                    <p className="text-slate-400 text-sm font-bold">Aucune image enregistrée pour ce rapport.</p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
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
        <ConfirmDialog 
          isOpen={!!confirmDialog?.isOpen} 
          onClose={() => setConfirmDialog(null)} 
          onConfirm={confirmDialog?.onConfirm || (() => {})} 
          title={confirmDialog?.title || ''} 
          message={confirmDialog?.message || ''} 
        />
    </div>
  );
}
