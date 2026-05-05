import React from 'react';
import { 
  Users, 
  School, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Package, 
  BarChart2, 
  FileText,
  Clock,
  ArrowUpRight,
  ChevronDown,
  Eye,
  Check,
  X,
  File,
  Loader2,
  Trash2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

const COLORS = ['#2D6A4F', '#F59E0B', '#3B82F6', '#EF4444'];

import { BENIN_GEO_DATA } from '../../lib/geoData';

export default function AdminDash({ 
  isValidated,
  user: initialUser,
  profile: initialProfile,
  initialView = 'overview',
  onViewChange
}: { 
  isValidated: boolean;
  user?: any;
  profile?: any;
  initialView?: string;
  onViewChange?: (view: any) => void;
}) {
  const [activeTab, setActiveTabInternal] = React.useState<string>(initialView);
  
  const setActiveTab = (newTab: string) => {
    setActiveTabInternal(newTab);
    if (onViewChange) onViewChange(newTab);
  };

  React.useEffect(() => {
    setActiveTabInternal(initialView);
  }, [initialView]);
  const [showNewSchoolModal, setShowNewSchoolModal] = React.useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
  
  const [newSchool, setNewSchool] = React.useState({
    name: '',
    department: '',
    commune: '',
    arrondissement: '',
    director: ''
  });

  const selectedDept = BENIN_GEO_DATA.find(d => d.name === newSchool.department);
  const selectedCommune = selectedDept?.communes.find(c => c.name === newSchool.commune);
  
  const [deptStats, setDeptStats] = React.useState<any[]>([]);
  const [schoolsList, setSchoolsList] = React.useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = React.useState<any[]>([]);
  const [statsData, setStatsData] = React.useState({
    activeSchools: 0,
    totalStudents: 0,
    pendingRequests: 0,
    totalMeals: 0
  });
  const [monthlyYield, setMonthlyYield] = React.useState<any[]>([]);
  const [globalInventory, setGlobalInventory] = React.useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = React.useState(true);

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoadingStats(true);
    try {
      // 1. Fetch pending validation requests
      const { data: requests, error: requestsError } = await supabase
        .from('validation_requests')
        .select(`
          id,
          user_id,
          full_name,
          role_requested,
          school_name,
          document_url,
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
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      
      setPendingUsers(requests?.filter(r => r.status === 'pending') || []);
      const [schoolsRes, reportsRes, inventoryRes, inventoryAuditRes] = await Promise.all([
        supabase.from('schools').select('*'),
        supabase.from('meal_reports').select('students_count, school_id, created_at'),
        supabase.from('inventory').select('item_name, quantity, updated_at'),
        supabase.from('inventory').select('item_name, quantity, updated_at, school_id, schools(name)').order('updated_at', { ascending: false }).limit(5)
      ]);

      const schools = schoolsRes.data || [];
      const reports = reportsRes.data || [];
      const inventory = inventoryRes.data || [];
      
      setSchoolsList(schools);

      const mealsCount = reports.length;
      const studentsSum = reports.reduce((acc: number, curr: any) => acc + (curr.students_count || 0), 0);

      setStatsData({
        activeSchools: schools.length,
        totalStudents: studentsSum,
        pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
        totalMeals: mealsCount
      });

      // 3. Process inventory
      const invMap: { [key: string]: number } = {};
      inventory.forEach(item => {
        invMap[item.item_name] = (invMap[item.item_name] || 0) + Number(item.quantity);
      });
      setGlobalInventory(Object.entries(invMap).map(([name, value]) => ({ name, value })).slice(0, 4));

      // 4. Dept Stats
      const deptMap: { [key: string]: { schools: number, pupils: number, meals: number } } = {};
      schools.forEach(s => {
        const d = s.department || 'Inconnu';
        if (!deptMap[d]) deptMap[d] = { schools: 0, pupils: 0, meals: 0 };
        deptMap[d].schools++;
      });

      reports.forEach(r => {
        const school = schools.find(s => s.id === r.school_id);
        const d = school?.department || 'Inconnu';
        if (!deptMap[d]) deptMap[d] = { schools: 0, pupils: 0, meals: 0 };
        deptMap[d].meals++;
        deptMap[d].pupils += (r.students_count || 0);
      });

      setDeptStats(Object.entries(deptMap).map(([name, stats]) => ({
        name,
        schools: stats.schools,
        pupils: stats.pupils,
        meals: stats.meals > 1000 ? (stats.meals / 1000).toFixed(1) + 'k' : stats.meals.toString()
      })));

      // 5. Monthly Yield from REAL reports
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthlyData: { [key: string]: number } = {};
      
      // Initialize last 6 months
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyData[monthNames[d.getMonth()]] = 0;
      }

      reports.forEach(r => {
        const d = new Date(r.created_at);
        const m = monthNames[d.getMonth()];
        if (monthlyData[m] !== undefined) {
          monthlyData[m]++;
        }
      });

      setMonthlyYield(Object.entries(monthlyData).map(([name, meals]) => ({ name, meals })));

      // 6. Stock Audit (Pending or recent stocks)
      if (inventoryAuditRes.data) {
        setPendingStocks(inventoryAuditRes.data.map((item: any) => ({
          id: Math.random(),
          director: "Directeur",
          school: item.schools?.name || "École",
          products: `${item.quantity} ${item.item_name}`,
          date: new Date(item.updated_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        })));
      }

    } catch (err) {
      console.error('Erreur dashboard data:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();

    // Subscribe to new validation requests
    const subscription = supabase
      .channel('admin_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'validation_requests'
        },
        () => {
          console.log('🔄 Admin: Validation requests changed, refreshing...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDashboardData]);

  const [pendingStocks, setPendingStocks] = React.useState<any[]>([]);

  const stats = [
    { label: "Écoles Actives", value: statsData.activeSchools.toString(), icon: <School className="text-brand-green" />, trend: "Total" },
    { label: "Total Élevés", value: statsData.totalStudents.toLocaleString(), icon: <Users className="text-blue-500" />, trend: "Cumulative" },
    { label: "Demandes en attente", value: statsData.pendingRequests.toString(), icon: <AlertTriangle className="text-brand-orange" />, trend: "Action requise" },
    { label: "Repas Total", value: statsData.totalMeals.toLocaleString(), icon: <CheckCircle className="text-emerald-500" />, trend: "Servis" },
  ];

  const approveUser = async (requestId: string) => {
    const request = pendingUsers.find(r => r.id === requestId);
    if (!request) return;

    setIsProcessing(`approve-${requestId}`);
    try {
      // Supabase can return profiles as an object or an array of one element
      const profileData = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles;

      // 1. Déterminer l'ID de l'école
      let schoolId = profileData?.school_id || null;
      const normalizedRole = (request.role_requested || '').toUpperCase();
      
      // Si on n'a pas d'ID d'école mais qu'on a un nom, on cherche par nom (compatibilité)
      if (!schoolId && request.school_name && !normalizedRole.includes('ADMIN')) {
        const { data: school } = await supabase
          .from('schools')
          .select('id')
          .eq('name', request.school_name)
          .maybeSingle();
        
        if (school) {
          schoolId = school.id;
        } else {
          // Créer l'école si elle n'existe vraiment pas (cas dégradé)
          const { data: newSchool, error: schoolErr } = await supabase
            .from('schools')
            .insert({
               name: request.school_name,
               department: profileData?.department,
               commune: profileData?.commune,
               arrondissement: profileData?.arrondissement
            })
            .select('id')
            .single();
          
          if (!schoolErr && newSchool) {
            schoolId = newSchool.id;
          }
        }
      }

      // 2. Update validation request
      const { error: reqError } = await supabase
        .from('validation_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (reqError) throw new Error(`Erreur validation_requests: ${reqError.message}`);

      // 3. Update profile
      let dbRole: 'SUPER_ADMIN' | 'DIRECTOR' | 'COOK' = 'DIRECTOR';
      
      const roleUpper = (request.role_requested || '').toUpperCase();
      if (roleUpper.includes('ADMIN')) {
        dbRole = 'SUPER_ADMIN';
      } else if (roleUpper.includes('COOK') || roleUpper.includes('CUISIN')) {
        dbRole = 'COOK';
      } else if (roleUpper.includes('DIRECTOR') || roleUpper.includes('DIRECTEUR')) {
        dbRole = 'DIRECTOR';
      } else {
        dbRole = 'DIRECTOR'; 
      }

      // Force the values to match the EXACT strings in the DB constraint
      const roleToSet = dbRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : (dbRole === 'COOK' ? 'COOK' : 'DIRECTOR');

      const { error: profError } = await supabase
        .from('profiles')
        .update({ 
          is_validated: true,
          role: roleToSet,
          school_id: schoolId,
          school: request.school_name
        })
        .eq('id', request.user_id);

      if (profError) {
        console.error('Database Constraint Error Details:', profError);
        throw profError;
      }

      setPendingUsers(prev => prev.filter(r => r.id !== requestId));
      toast.success(`L'utilisateur ${request.full_name} a été validé en tant que ${dbRole} ! Son dashboard sera mis à jour instantanément.`);
      
      // Refresh stats
      fetchDashboardData();
    } catch (err: any) {
      console.error('Erreur validation:', err);
      toast.error('Erreur lors de la validation: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setIsProcessing(null);
    }
  };

  const rejectUser = async (requestId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) return;
    setIsProcessing(`reject-${requestId}`);
    try {
      const { error } = await supabase
        .from('validation_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      setPendingUsers(prev => prev.filter(r => r.id !== requestId));
      fetchDashboardData();
    } catch (err) {
      console.error('Erreur rejet:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!window.confirm('Voulez-vous supprimer définitivement cette demande de la base de données ?')) return;
    setIsProcessing(`delete-${requestId}`);
    try {
      const { error } = await supabase
        .from('validation_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      setPendingUsers(prev => prev.filter(r => r.id !== requestId));
      fetchDashboardData();
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.error('Erreur lors de la suppression.');
    } finally {
      setIsProcessing(null);
    }
  };

  const approveStock = (id: number) => {
    setPendingStocks(prev => prev.filter(s => s.id !== id));
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing('creating-school');
    try {
      const { error } = await supabase
        .from('schools')
        .insert({
          name: newSchool.name,
          department: newSchool.department,
          commune: newSchool.commune,
          arrondissement: newSchool.arrondissement,
          director_name: newSchool.director
        });

      if (error) throw error;
      
      setShowNewSchoolModal(false);
      setNewSchool({ name: '', department: '', commune: '', arrondissement: '', director: '' });
      toast.success('École créée avec succès !');
      fetchDashboardData();
    } catch (err) {
      console.error('Erreur création école:', err);
      toast.error('Erreur lors de la création de l\'école: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setIsProcessing(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 18) return 'Bonjour';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-8 pb-12 text-left">
      {/* New School Modal */}
      <AnimatePresence>
        {showNewSchoolModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewSchoolModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Ajouter une École</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-tight">Paramétrer un nouvel établissement</p>
                </div>
                <button 
                  onClick={() => setShowNewSchoolModal(false)}
                  className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateSchool} className="p-8 space-y-6">
                <div className="space-y-4">
                   <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Nom de l'école</label>
                    <input 
                      required
                      placeholder="Ex: EPP Cotonou Centre"
                      className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 focus:bg-white transition-all outline-none"
                      value={newSchool.name}
                      onChange={e => setNewSchool({...newSchool, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase ml-1">Département</label>
                      <select 
                        required
                        className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none"
                        value={newSchool.department}
                        onChange={e => setNewSchool({...newSchool, department: e.target.value, commune: '', arrondissement: ''})}
                      >
                        <option value="">Sélectionner</option>
                        {BENIN_GEO_DATA.map(d => (
                          <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase ml-1">Commune</label>
                      <select 
                        required
                        disabled={!newSchool.department}
                        className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none disabled:opacity-50"
                        value={newSchool.commune}
                        onChange={e => setNewSchool({...newSchool, commune: e.target.value, arrondissement: ''})}
                      >
                        <option value="">Sélectionner</option>
                        {selectedDept?.communes.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Arrondissement</label>
                    <select 
                      required
                      disabled={!newSchool.commune}
                      className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none disabled:opacity-50"
                      value={newSchool.arrondissement}
                      onChange={e => setNewSchool({...newSchool, arrondissement: e.target.value})}
                    >
                      <option value="">Sélectionner un arrondissement</option>
                      {selectedCommune?.arrondissements.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Nom du Directeur (si connu)</label>
                    <input 
                      placeholder="Ex: M. Jean Sossa"
                      className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none"
                      value={newSchool.director}
                      onChange={e => setNewSchool({...newSchool, director: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowNewSchoolModal(false)}
                    className="flex-1 rounded-2xl h-14 font-black uppercase text-xs tracking-widest"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] rounded-2xl h-14 bg-brand-green hover:bg-brand-green/90 shadow-xl shadow-brand-green/20 font-black uppercase text-xs tracking-widest"
                  >
                    Créer l'établissement
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800">
            {getGreeting()}, {initialProfile?.full_name || 'cher utilisateur'}
          </h1>
          <p className="text-slate-500 font-medium">
            {activeTab === 'overview' && "Vue d'ensemble • Super Admin"}
            {activeTab === 'validations' && "Validation des Demandes"}
            {activeTab === 'schools' && "Gestion des Établissements"}
            {activeTab === 'inventory' && "État des Stocks Nationaux"}
            {activeTab === 'settings' && "Configuration Système"}
          </p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'schools' && (
            <button 
              disabled={!isValidated}
              onClick={() => setShowNewSchoolModal(true)}
              className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all bg-brand-green text-white hover:bg-brand-green/90 shadow-brand-green/20`}
            >
              Nouvelle École
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl">{stat.icon}</div>
                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-500 uppercase">{stat.trend}</span>
                  </div>
                  <div className="text-2xl font-black mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400 font-bold uppercase tracking-tight">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Repas servis par mois</h3>
                  <select className="bg-slate-50 border-none rounded-lg p-2 text-xs font-bold outline-none">
                    <option>2026</option>
                    <option>2025</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyYield}>
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

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Volume des Stocks Nationaux</h3>
                  <Package className="text-brand-orange" size={18} />
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={globalInventory}>
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
            </div>
          </motion.div>
        )}

        {activeTab === 'validations' && (
          <motion.div 
            key="validations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Pending Validation: Directors */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <Users className="text-brand-orange" size={24} />
                  <div>
                    <h3 className="text-lg font-bold">Validation des Comptes Directeurs</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">Nouveaux dossiers à examiner</p>
                  </div>
                </div>
                <span className="bg-brand-orange/10 text-brand-orange text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  {pendingUsers.length} demandes
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/30">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informations</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Localité</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date demande</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Justificatif</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoadingUsers ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-10 text-center">
                          <Loader2 className="animate-spin mx-auto text-slate-300" size={32} />
                        </td>
                      </tr>
                    ) : pendingUsers.map((request) => (
                      <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center font-black text-brand-green">
                              {request.full_name?.split(' ').map((n:any)=>n[0]).join('') || '?'}
                            </div>
                            <div>
                              <div className="font-black text-slate-800">{request.full_name}</div>
                              <div className="text-xs text-slate-400 font-bold">{request.role_requested} • {request.school_name || 'Non assigné'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="text-sm font-bold text-slate-600 italic">
                             {(Array.isArray(request.profiles) ? request.profiles[0] : request.profiles)?.department || 'N/A'}, {(Array.isArray(request.profiles) ? request.profiles[0] : request.profiles)?.commune || 'N/A'}
                           </div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{(Array.isArray(request.profiles) ? request.profiles[0] : request.profiles)?.arrondissement || 'N/A'}</div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="text-xs font-bold text-slate-500">
                             {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                           </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                           {request.document_url ? (
                             <button 
                               onClick={() => window.open(request.document_url, '_blank')}
                               className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-green/10 text-brand-green rounded-xl text-xs font-black uppercase hover:bg-brand-green hover:text-white transition-all shadow-sm"
                             >
                               <Eye size={14} /> Voir pièce
                             </button>
                           ) : (
                             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Aucun fichier</span>
                           )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex gap-2">
                            <button 
                              disabled={!!isProcessing}
                              onClick={() => approveUser(request.id)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white disabled:opacity-50`}
                              title="Valider le compte"
                            >
                              {isProcessing === `approve-${request.id}` ? (
                                <Loader2 className="animate-spin" size={18} />
                              ) : (
                                <Check size={20} />
                              )}
                            </button>
                            <button 
                              disabled={!!isProcessing}
                              onClick={() => deleteRequest(request.id)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm bg-red-50 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50`}
                              title="Supprimer la demande"
                            >
                              {isProcessing === `delete-${request.id}` ? (
                                <Loader2 className="animate-spin" size={18} />
                              ) : (
                                <Trash2 size={20} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!isLoadingUsers && pendingUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                              <CheckCircle size={32} className="text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold text-sm">Tous les dossiers sont validés</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'schools' && (
          <motion.div 
            key="schools"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Liste des Établissements ({schoolsList.length})</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Rechercher une école..." 
                      className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-green/20"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom de l'École</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Département</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Commune</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {schoolsList.map((school, i) => (
                          <tr key={school.id || i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{school.name}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-600">{school.department}</td>
                            <td className="px-6 py-4 text-center text-sm font-bold text-brand-green">{school.commune}</td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-slate-400 hover:text-brand-green transition-colors">
                                <Eye size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {schoolsList.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-slate-400">Aucune école trouvée.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                </div>
              </div>
          </motion.div>
        )}

        {activeTab === 'inventory' && (
          <motion.div 
            key="inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Distribution Statistique des Vivres</h3>
                  <Package size={18} className="text-slate-400" />
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={globalInventory}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {globalInventory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                  {globalInventory.map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{item.name}</span>
                      </div>
                      <div className="text-xl font-black text-slate-800">{item.value} {item.unit || 'kg'}</div>
                    </div>
                  ))}
                  {globalInventory.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-400 italic">
                      Aucune donnée d'inventaire disponible.
                    </div>
                  )}
                </div>
              </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Mon Profil Administrateur</h3>
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-brand-green/10 flex items-center justify-center text-brand-green font-black text-3xl shadow-inner italic">
                    {initialProfile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'SA'}
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">{initialProfile?.full_name || 'Super Administrateur'}</h4>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Ministère des Enseignements Maternel et Primaire</p>
                    <div className="flex gap-2 mt-4">
                      <span className="px-3 py-1 bg-brand-green/10 text-brand-green text-[10px] font-black uppercase rounded-full">Accès Total</span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-500 text-[10px] font-black uppercase rounded-full">Support Technique</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email de service</label>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-600">{initialUser?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Numéro Personnel</label>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-600">{initialProfile?.phone || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Réseau Local</label>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 font-bold text-brand-green flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
                        Connecté au VPN Gouvernemental
                      </div>
                    </div>
                    <Button variant="ghost" className="w-full h-14 rounded-2xl border border-slate-100 text-slate-400 hover:text-red-500 font-black uppercase text-xs">Changer le mot de passe</Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Paramètres de la Plateforme</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="font-bold">Notifications Email</div>
                    <div className="text-xs text-slate-400">Recevoir un rapport quotidien</div>
                  </div>
                  <div className="w-12 h-6 bg-brand-green rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="font-bold">Maintenance Système</div>
                    <div className="text-xs text-slate-400">Dernière sauvegarde: il y a 3h</div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl px-4 h-9">Lancer Sauvegarde</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
