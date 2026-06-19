import React, { lazy, Suspense } from 'react';
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
  ChevronUp,
  Eye,
  Check,
  X,
  File,
  Loader2,
  Trash2,
  Activity,
  Calendar,
  ArrowUpDown,
  User,
  Utensils,
  Search,
  Filter,
  Image as ImageIcon
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
import { Skeleton } from '../ui/Skeleton';
import { toast } from 'sonner';
const StatCards = lazy(() => import('./widgets/StatCards').then(m => ({ default: m.StatCards })));
const RequestsWidget = lazy(() => import('./widgets/RequestsWidget').then(m => ({ default: m.RequestsWidget })));
const InventoryWidget = lazy(() => import('./widgets/InventoryWidget').then(m => ({ default: m.InventoryWidget })));
const ActivityFeedWidget = lazy(() => import('./widgets/ActivityFeedWidget').then(m => ({ default: m.ActivityFeedWidget })));
const MonthlyYieldWidget = lazy(() => import('./widgets/MonthlyYieldWidget').then(m => ({ default: m.MonthlyYieldWidget })));
const GlobalInventoryWidget = lazy(() => import('./widgets/GlobalInventoryWidget').then(m => ({ default: m.GlobalInventoryWidget })));
import { PhotoGallery } from './widgets/PhotoGallery';

const COLORS = ['#2D6A4F', '#F59E0B', '#3B82F6', '#EF4444'];

import { BENIN_GEO_DATA } from '../../lib/geoData';
import { supabase } from '../../lib/supabase';

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
  const isMerveille = initialUser?.email?.toLowerCase() === 'honvoumerveille@gmail.com';
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
  const [feedType, setFeedType] = React.useState<'all' | 'reports' | 'arrivals'>('all');
  const [feedSearch, setFeedSearch] = React.useState('');
  const [selectedZoomPhoto, setSelectedZoomPhoto] = React.useState<string | null>(null);
  
  // History filtering states
  const [isFilterExpanded, setIsFilterExpanded] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState<'all' | '30-days' | 'custom'>('all');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [selectedPhotosReport, setSelectedPhotosReport] = React.useState<any | null>(null);
  const [selectedJustificatif, setSelectedJustificatif] = React.useState<any | null>(null);

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
  const [statsData, setStatsData] = React.useState<{
    activeSchools: number | null;
    totalStudents: number | null;
    pendingRequests: number | null;
    totalMeals: number | null;
  }>({
    activeSchools: null,
    totalStudents: null,
    pendingRequests: null,
    totalMeals: null
  });
  const [globalInventory, setGlobalInventory] = React.useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = React.useState(true);
  const [detailedMealReports, setDetailedMealReports] = React.useState<any[] | null>(null);
  const [detailedInventoryFeed, setDetailedInventoryFeed] = React.useState<any[]>([]);
  const [monthlyYield, setMonthlyYield] = React.useState<any[]>([]);
  
  // School Details Modal States
  const [selectedSchoolDetails, setSelectedSchoolDetails] = React.useState<any | null>(null);
  const [selectedSchoolStaff, setSelectedSchoolStaff] = React.useState<any[]>([]);
  const [selectedSchoolInventory, setSelectedSchoolInventory] = React.useState<any[]>([]);
  const [selectedSchoolReports, setSelectedSchoolReports] = React.useState<any[]>([]);
  const [isLoadingSchoolDetails, setIsLoadingSchoolDetails] = React.useState(false);
  const [schoolSearch, setSchoolSearch] = React.useState('');

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [requestsRes, schoolsRes, reportsRes, inventoryRes, inventoryAuditRes, mealReportsRes, schoolsDetailedRes, allInventoryDetailedRes] = await Promise.all([
        supabase.from('validation_requests').select(`
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
        `).order('created_at', { ascending: false }),
        supabase.from('schools').select('*'),
        supabase.from('meal_reports').select('students_count, school_id, created_at').limit(500),
        supabase.from('inventory').select('item_name, quantity, updated_at').limit(500),
        supabase.from('inventory').select('item_name, quantity, updated_at, school_id, schools(name)').order('updated_at', { ascending: false }).limit(5),
        supabase.from('meal_reports').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('schools').select('id, name, department, commune, arrondissement'),
        supabase.from('inventory').select('id, item_name, quantity, unit, updated_at, school_id, schools(name, department, commune, arrondissement)').order('updated_at', { ascending: false }).limit(100)
      ]);
      
      const requests = requestsRes.data;
      if (requestsRes.error) throw requestsRes.error;
      if (schoolsRes.error) console.error("Error fetching schools:", schoolsRes.error);
      if (reportsRes.error) console.error("Error fetching reports:", reportsRes.error);
      if (inventoryRes.error) console.error("Error fetching inventory:", inventoryRes.error);
      if (inventoryAuditRes.error) console.error("Error fetching inventory audit:", inventoryAuditRes.error);
      if (mealReportsRes.error) console.error("Error fetching meal reports:", mealReportsRes.error);
      if (schoolsDetailedRes.error) console.error("Error fetching detailed schools:", schoolsDetailedRes.error);
      if (allInventoryDetailedRes.error) console.error("Error fetching detailed inventory:", allInventoryDetailedRes.error);
      
      setPendingUsers(requests?.filter(r => r.status === 'pending') || []);
      
      const schools = schoolsRes.data || [];
      const reports = reportsRes.data || [];
      const inventory = inventoryRes.data || [];
      
      setSchoolsList(schools);
      
      if (mealReportsRes.data && schoolsDetailedRes.data) {
        const reportsWithSchools = mealReportsRes.data.map(r => ({
          ...r,
          schools: schoolsDetailedRes.data.find(s => s.id === r.school_id)
        }));
        setDetailedMealReports(reportsWithSchools);
      } else {
        setDetailedMealReports([]);
      }
      if (allInventoryDetailedRes.data) {
        setDetailedInventoryFeed(allInventoryDetailedRes.data);
      } else {
        setDetailedInventoryFeed([]);
      }

      const mealsCount = reports.length;
      const studentsSum = reports.reduce((acc: number, curr: any) => acc + (curr.students_count || 0), 0);

      setStatsData({
        activeSchools: schools.length,
        totalStudents: studentsSum,
        pendingRequests: requests?.filter(r => r.status === 'pending').length ?? null,
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

    // Subscribe to new validation requests, meal reports, and inventory updates
    const requestsSub = supabase
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

    const reportsSub = supabase
      .channel('admin_reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_reports'
        },
        () => {
          console.log('🔄 Admin: Meal reports changed, refreshing...');
          fetchDashboardData();
        }
      )
      .subscribe();

    const inventorySub = supabase
      .channel('admin_inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        () => {
          console.log('🔄 Admin: Inventory changed, refreshing...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      requestsSub.unsubscribe();
      reportsSub.unsubscribe();
      inventorySub.unsubscribe();
    };
  }, [fetchDashboardData]);

  const [pendingStocks, setPendingStocks] = React.useState<any[]>([]);

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

  const handleValidateArrival = async (arrivalId: string) => {
    setIsProcessing(`validate-arrival-${arrivalId}`);
    try {
      // Try to set is_validated if column exists in public.inventory
      const { error } = await supabase
        .from('inventory')
        .update({ is_validated: true } as any)
        .eq('id', arrivalId);

      // We still update localValidatedArrivals and save to localStorage for extreme reliability/fallback
      const updated = [...localValidatedArrivals, arrivalId];
      setLocalValidatedArrivals(updated);
      localStorage.setItem('validated_arrivals', JSON.stringify(updated));

      toast.success("Arrivage de vivres validé avec succès !");
      fetchDashboardData();
    } catch (err: any) {
      console.error("Error validating arrival:", err);
      // Fallback in case of lack of DB column
      const updated = [...localValidatedArrivals, arrivalId];
      setLocalValidatedArrivals(updated);
      localStorage.setItem('validated_arrivals', JSON.stringify(updated));
      toast.success("Arrivage validé (session locale enregistrée).");
      fetchDashboardData();
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteArrival = async (arrivalId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cet arrivage de vivres ? Cela supprimera le stock correspondant de la base.")) return;
    setIsProcessing(`delete-arrival-${arrivalId}`);
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', arrivalId);

      if (error) throw error;

      toast.success("Arrivage supprimé avec succès !");
      fetchDashboardData();
    } catch (err: any) {
      console.error("Error deleting arrival:", err);
      toast.error("Erreur durant la suppression: " + (err.message || "Erreur"));
    } finally {
      setIsProcessing(null);
    }
  };

  const handleValidateReport = async (reportId: string) => {
    setIsProcessing(`validate-report-${reportId}`);
    try {
      const { error } = await supabase
        .from('meal_reports')
        .update({ is_validated: true })
        .eq('id', reportId);

      if (error) throw error;

      toast.success("Rapport de repas validé avec succès !");
      fetchDashboardData();
    } catch (err: any) {
      console.error("Error validating report:", err);
      toast.error("Erreur durant la validation: " + (err.message || "Erreur"));
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce rapport de repas ?")) return;
    setIsProcessing(`delete-report-${reportId}`);
    try {
      // 1. Fetch record first to get photo URLs
      const { data: record, error: fetchError } = await supabase
        .from('meal_reports')
        .select('photos')
        .eq('id', reportId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // 2. Delete photos if they exist
      if (record?.photos && record.photos.length > 0) {
        const paths = record.photos.map((url: string) => {
            // Extract path after '/proofs/'
             const parts = url.split('/proofs/');
             return parts.length > 1 ? parts[1] : null;
        }).filter(Boolean); // keep non-null

        if (paths.length > 0) {
            await supabase.storage.from('proofs').remove(paths);
        }
      }

      // 3. Delete record
      const { error } = await supabase
        .from('meal_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast.success("Rapport de repas supprimé avec succès !");
      fetchDashboardData();
    } catch (err: any) {
      console.error("Error deleting report:", err);
      toast.error("Erreur durant la suppression: " + (err.message || "Erreur"));
    } finally {
      setIsProcessing(null);
    }
  };

  const handleViewSchoolDetails = async (school: any) => {
    setSelectedSchoolDetails(school);
    setIsLoadingSchoolDetails(true);
    setSelectedSchoolStaff([]);
    setSelectedSchoolInventory([]);
    setSelectedSchoolReports([]);
    
    try {
      const [staffRes, inventoryRes, reportsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, role, phone, cip_number, is_validated')
          .eq('school_id', school.id),
        supabase
          .from('inventory')
          .select('id, item_name, quantity, unit, updated_at')
          .eq('school_id', school.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('meal_reports')
          .select('id, meal_description, students_count, photos, created_at, is_validated, cook_id, profiles(full_name)')
          .eq('school_id', school.id)
          .order('created_at', { ascending: false })
      ]);
      
      if (staffRes.data) setSelectedSchoolStaff(staffRes.data);
      if (inventoryRes.data) setSelectedSchoolInventory(inventoryRes.data);
      if (reportsRes.data) setSelectedSchoolReports(reportsRes.data);
    } catch (err: any) {
      console.error("Error fetching school details:", err);
      toast.error("Erreur de chargement des détails de l'établissement: " + (err.message || "Erreur"));
    } finally {
      setIsLoadingSchoolDetails(false);
    }
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

  const filteredReports = React.useMemo(() => {
    if (!detailedMealReports) return [];
    
    // Apply time filter
    let processed = [...detailedMealReports];
    
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
  }, [detailedMealReports, timeFilter, startDate, endDate]);
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
            {getGreeting()}, {isMerveille ? 'Merveille' : (initialProfile?.full_name || 'cher utilisateur')}
          </h1>
          <p className="text-slate-500 font-medium">
            {activeTab === 'overview' && "Vue d'ensemble • Super Admin"}
            {activeTab === 'activity_feed' && "Suivi Terrain • Rapports de Cantine & Arrivages"}
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
        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
           <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Historique des rapports émis</h2>
                <p className="text-slate-400 font-medium text-sm">Suivi national de tous les repas déclarés</p>
              </div>
              <button 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                <Filter size={16} />
                Filtrer
                {isFilterExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </button>
            </div>

            {isFilterExpanded && (
               <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Période</label>
                      <select className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as any)}>
                          <option value="all">Tout le temps</option>
                          <option value="30-days">30 derniers jours</option>
                          <option value="custom">Personnalisé</option>
                      </select>
                  </div>
                  {timeFilter === 'custom' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Début</label>
                          <input type="date" className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Fin</label>
                          <input type="date" className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                      </>
                  )}
               </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">École</th>
                      <th className="px-6 py-4">Menu</th>
                      <th className="px-6 py-4 text-center">Présence</th>
                      <th className="px-6 py-4 text-center">Photos</th>
                      <th className="px-6 py-4 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingStats ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={`skeleton-${i}`}>
                          <td colSpan={6} className="px-6 py-4">
                            <div className="h-10 w-full bg-slate-100 animate-pulse rounded-2xl"></div>
                          </td>
                        </tr>
                      ))
                    ) : filteredReports.length > 0 ? (
                      filteredReports.map((report: any) => (
                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-700">{new Date(report.created_at).toLocaleDateString('fr-FR')}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-700">{report.schools?.name || 'Inconnue'}</div>
                            {report.schools && (
                              <div className="text-[10px] text-slate-400 font-medium">
                                Dépt: {report.schools.department || 'Non précisé'} | Com: {report.schools.commune || 'Non précisé'} | Arr: {report.schools.arrondissement || 'Non précisé'}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">{report.meal_description}</td>
                          <td className="px-6 py-4 text-center">{report.students_count} élèves</td>
                          <td className="px-6 py-4 text-center">
                            {report.photos && report.photos.length > 0 ? (
                              <button 
                                  onClick={() => setSelectedPhotosReport(report)} 
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-brand-green bg-brand-green/10 hover:bg-brand-green/20 rounded-xl transition-all cursor-pointer"
                              >
                                  <ImageIcon size={12} />
                                  <span>{report.photos.length} photos</span>
                              </button>
                            ) : <span className="text-xs text-slate-400 italic">Aucune</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {report.is_validated ? 
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase rounded-full">Validé</span> :
                              <span className="px-3 py-1 bg-amber-50 text-amber-600 font-black text-[10px] uppercase rounded-full">En attente</span>
                            }
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">Aucun rapport trouvé.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>

            {/* Photo Lightbox */}
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
                        </motion.div>
                    </motion.div>
                )}
                {selectedJustificatif && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
                        onClick={() => setSelectedJustificatif(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 15 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h4 className="font-extrabold text-slate-800 text-lg">Visualisation du document</h4>
                                <button 
                                onClick={() => setSelectedJustificatif(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[70vh]">
                                <img 
                                    src={selectedJustificatif.document_url} 
                                    alt="Justificatif" 
                                    className="w-full h-auto rounded-xl"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <Suspense fallback={<Skeleton className="h-[100px] w-full" />}>
              <StatCards />
            </Suspense>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Repas servis par mois</h3>
                  <select className="bg-slate-50 border-none rounded-lg p-2 text-xs font-bold outline-none" disabled={isLoadingStats}>
                    <option>2026</option>
                    <option>2025</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                  <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                  <MonthlyYieldWidget />
                </Suspense>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <GlobalInventoryWidget />
              </Suspense>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'activity_feed' && (
          <motion.div 
            key="activity_feed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8 text-left"
          >
            {/* Real-time Subtitles Info */}
            <div className="bg-gradient-to-r from-brand-green to-teal-800 p-6 rounded-3xl text-white shadow-xl shadow-brand-green/10">
               <h3 className="text-xl font-black uppercase">Télémesure en Temps Réel</h3>
               <p className="text-xs opacity-90 mt-1 max-w-2xl font-medium">
                  Cette console centralise les rapports de repas émis par les cuisiniers ainsi que les arrivages de vivres certifiés par les directeurs d'écoles à travers le Bénin. Les données se synchronisent automatiquement.
               </p>
            </div>

            {/* Premium Stats for Cook Meal Reports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Total Repas Déclarés</div>
                  <h3 className="text-3xl font-black text-slate-800 mt-2">
                    {detailedMealReports ? detailedMealReports.length : <div className="h-8 w-20 bg-slate-100 animate-pulse rounded" />}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-2">Rapports culinaires enregistrés</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-brand-orange font-mono">Nombre d'Élèves Nourris</div>
                  <h3 className="text-3xl font-black text-slate-800 mt-2">
                    {detailedMealReports ? detailedMealReports.reduce((acc, curr) => acc + (curr.students_count || 0), 0).toLocaleString('fr-FR') : <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" />}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-2 font-sans">Portions de déjeuners servies</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 font-mono font-sans font-bold">Taux de Validation</div>
                  <h3 className="text-3xl font-black text-emerald-600 mt-2">
                    {detailedMealReports && detailedMealReports.length > 0 
                      ? `${Math.round((detailedMealReports.filter(r => r.is_validated).length / detailedMealReports.length) * 100)}%`
                      : detailedMealReports !== null ? "0%" : <div className="h-8 w-20 bg-slate-100 animate-pulse rounded" />
                    }
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-2 font-sans">
                  {detailedMealReports ? `${detailedMealReports.filter(r => r.is_validated).length} validés par directeur` : <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />}
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 font-mono">Dernier Menu Préparé</div>
                  <div className="text-sm font-black text-slate-700 mt-2 line-clamp-2 leading-snug">
                    {detailedMealReports && detailedMealReports.length > 0 
                      ? detailedMealReports[0].meal_description 
                      : detailedMealReports !== null ? "Aucun repas récent" : <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
                    }
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-2">
                  {detailedMealReports && detailedMealReports.length > 0 
                    ? `Le ${new Date(detailedMealReports[0].created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                    : detailedMealReports !== null ? "Aucune information de date" : <div className="h-4 w-40 bg-slate-100 animate-pulse rounded" />
                  }
                </span>
              </div>
            </div>

            {/* Combined Search & Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Live Search Input */}
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  placeholder="Rechercher par école, repas, auteur, commune..."
                  className="w-full pl-12 pr-10 h-11 rounded-2xl border border-slate-200 bg-slate-50 text-slate-750 outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all font-bold text-sm"
                />
                {feedSearch && (
                  <button 
                    onClick={() => setFeedSearch('')} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1 w-full md:w-auto">
                <button
                  onClick={() => setFeedType('all')}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    feedType === 'all' 
                      ? 'bg-brand-green text-white shadow-md shadow-brand-green/20' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Tout {detailedMealReports !== null ? `(${
                    ((detailedMealReports?.length || 0) + (detailedInventoryFeed?.length || 0))
                  })` : <span className="inline-block w-4 h-3 bg-slate-200 animate-pulse rounded" />}
                </button>
                <button
                  onClick={() => setFeedType('reports')}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    feedType === 'reports' 
                      ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/25' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Rapports Repas {detailedMealReports !== null ? `(${detailedMealReports?.length || 0})` : <span className="inline-block w-4 h-3 bg-slate-200 animate-pulse rounded" />}
                </button>
                <button
                  onClick={() => setFeedType('arrivals')}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    feedType === 'arrivals' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Nouvels Arrivages {detailedInventoryFeed !== null ? `(${detailedInventoryFeed?.length || 0})` : <span className="inline-block w-4 h-3 bg-slate-200 animate-pulse rounded" />}
                </button>
              </div>
            </div>

            {/* Combined Stream list */}
            <div className="space-y-6">
              {isLoadingStats ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse space-y-3">
                      <div className="flex justify-between">
                        <div className="h-4 bg-slate-100 rounded w-1/3" />
                        <div className="h-4 bg-slate-100 rounded w-20" />
                      </div>
                      <div className="h-6 bg-slate-100 rounded w-2/3" />
                      <div className="h-4 bg-slate-100 rounded w-1/4" />
                    </div>
                  ))}
                </div>
              ) : (() => {
                // Compute combined events
                const reports = (detailedMealReports || []).map(r => ({
                  id: `report-${r.id}`,
                  type: 'report',
                  school: r.schools?.name || "École Inconnue",
                  author: r.profiles?.full_name || "Cuisinier",
                  title: r.meal_description || "Rapport de repas",
                  detail: `${r.students_count || 0} élèves nourris`,
                  date: new Date(r.created_at),
                  photos: r.photos || [],
                  validated: r.is_validated,
                  raw: r
                }));

                const arrivals = (detailedInventoryFeed || []).map(i => {
                  const isLocalVal = localValidatedArrivals.includes(i.id);
                  const isVal = i.is_validated !== undefined ? i.is_validated : isLocalVal;
                  return {
                    id: `arrival-${i.id}`,
                    type: 'arrival',
                    school: i.schools?.name || "École Inconnue",
                    author: "Directeur de l'Établissement",
                    title: i.item_name || "Vivre enregistré",
                    detail: `Quantité ajoutée : ${i.quantity || 0} ${i.unit || 'kg'}`,
                    date: new Date(i.updated_at || i.created_at),
                    photos: [],
                    validated: isVal,
                    raw: i
                  };
                });

                // Combine & Sort by date descending
                let allEvents = [...reports, ...arrivals].sort((a, b) => b.date.getTime() - a.date.getTime());

                // Filter by type
                if (feedType === 'reports') {
                  allEvents = allEvents.filter(e => e.type === 'report');
                } else if (feedType === 'arrivals') {
                  allEvents = allEvents.filter(e => e.type === 'arrival');
                }

                // Filter by search
                if (feedSearch.trim()) {
                  const query = feedSearch.toLowerCase();
                  allEvents = allEvents.filter(e => {
                    const schoolName = e.school.toLowerCase();
                    const titleText = e.title.toLowerCase();
                    const authorName = e.author.toLowerCase();
                    const dept = (e.raw.schools?.department || '').toLowerCase();
                    const comm = (e.raw.schools?.commune || '').toLowerCase();
                    const arr = (e.raw.schools?.arrondissement || '').toLowerCase();
                    const statusText = e.validated ? 'validé' : 'en attente';
                    
                    return schoolName.includes(query) ||
                      titleText.includes(query) ||
                      authorName.includes(query) ||
                      dept.includes(query) ||
                      comm.includes(query) ||
                      arr.includes(query) ||
                      statusText.includes(query);
                  });
                }

                if (allEvents.length === 0) {
                  return (
                    <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-medium">
                      Aucune activité ne correspond à vos critères de recherche.
                    </div>
                  );
                }

                return (
                  <div className="relative border-l border-slate-100 ml-4 md:ml-6 pl-6 md:pl-8 space-y-8">
                    {allEvents.map((event) => {
                      const hourStr = event.date.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const dateStr = event.date.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      });

                      const isReport = event.type === 'report';
                      const isLoadingVal = isProcessing === `validate-${event.type}-${event.raw.id}`;
                      const isLoadingDel = isProcessing === `delete-${event.type}-${event.raw.id}`;

                      return (
                        <div key={event.id} className="relative group">
                          
                          {/* Timeline dot */}
                          <div className={`absolute -left-[35px] md:-left-[43px] top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-md transition-all group-hover:scale-110 z-10 ${
                            isReport ? 'bg-brand-orange' : 'bg-blue-600'
                          }`}>
                            {isReport ? (
                              <Utensils size={10} className="text-white" />
                            ) : (
                              <Package size={10} className="text-white" />
                            )}
                          </div>

                          {/* Event Card */}
                          <div className={`bg-white p-6 rounded-3xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                            isReport 
                              ? 'border-slate-100 hover:border-brand-orange/20' 
                              : 'border-slate-100 hover:border-blue-500/20'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1.5">
                                <Clock size={12} />
                                {dateStr} à {hourStr}
                              </span>
                              
                              <div className="flex gap-2">
                                {isReport ? (
                                  <>
                                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-brand-orange/10 text-brand-orange">
                                      RAPPORT REPAS
                                    </span>
                                    {event.validated ? (
                                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100/50 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                                        Validé par Directeur
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100/50 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                                        En attente de validation
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-600">
                                      ARRIVAGE DE VIVRES
                                    </span>
                                    {event.validated ? (
                                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-110 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        Arrivage Validé
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-110 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                        En attente Admin
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              {/* School Details */}
                              <div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                                  {event.school}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                  Département: <span className="text-slate-600">{event.raw.schools?.department || 'Non précisé'}</span> | Commune: <span className="text-slate-600">{event.raw.schools?.commune || 'Non précisé'}</span> | Arrond.: <span className="text-slate-600">{event.raw.schools?.arrondissement || 'Non précisé'}</span>
                                </p>
                              </div>
                              
                              {/* Core metrics and main text */}
                              <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-base font-black text-slate-800 tracking-tight leading-snug">
                                  {isReport ? (
                                    <>
                                      Repas cuisiné : <span className="text-brand-orange">{event.title}</span> pour <span className="text-slate-800 underline decoration-brand-orange decoration-2">{event.detail}</span>
                                    </>
                                  ) : (
                                    <>
                                      Vivres entrés : <span className="text-blue-600 font-extrabold">{event.title}</span> (<span className="text-emerald-600 font-black">{event.detail}</span>)
                                    </>
                                  )}
                                </p>
                                
                                {/* Chef/Author Details */}
                                <div className="pt-2 border-t border-slate-100/60 mt-2 space-y-1 text-xs">
                                  <p className="font-bold text-slate-400">
                                    Enregistré par : <span className="text-slate-700 font-black">{event.author}</span>
                                  </p>
                                  {isReport && event.raw.profiles && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-100">
                                      <p><strong className="text-slate-400 uppercase tracking-widest text-[9px]">Téléphone :</strong> <span className="text-slate-800 font-bold">{event.raw.profiles.phone || 'Non renseigné'}</span></p>
                                      <p><strong className="text-slate-400 uppercase tracking-widest text-[9px]">N° CIP / Identifiant :</strong> <span className="text-slate-800 font-bold">{event.raw.profiles.cip_number || 'Non renseigné'}</span></p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Images feed if report contains photos */}
                              {isReport && event.photos && event.photos.length > 0 && (
                                <div className="pt-1 space-y-2">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preuve(s) photo du repas :</p>
                                  <div className="flex gap-3 flex-wrap">
                                    {event.photos.map((photo: string, index: number) => (
                                      <div 
                                        key={index} 
                                        onClick={() => {
                                          setSelectedZoomPhoto(photo);
                                        }}
                                        className="relative w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm overflow-hidden cursor-zoom-in transition-all duration-300 hover:scale-105 hover:shadow-md"
                                      >
                                        <img 
                                          src={photo} 
                                          alt={`Preuve repas ${index + 1}`} 
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ADMIN ACTIONS ZONE */}
                              <div className="pt-2 flex flex-wrap gap-2.5 justify-end border-t border-slate-100/50 mt-4">
                                {/* Validate buttons */}
                                {!event.validated && (
                                  <button
                                    onClick={() => isReport ? handleValidateReport(event.raw.id) : handleValidateArrival(event.raw.id)}
                                    disabled={!!isProcessing}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-all text-white ${
                                      isReport
                                        ? 'bg-brand-orange hover:bg-orange-600 hover:shadow-lg hover:shadow-brand-orange/20 active:scale-[0.98]'
                                        : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98]'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {isLoadingVal ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <Check size={13} className="stroke-[3]" />
                                    )}
                                    {isReport ? "Valider le repas" : "Valider l'arrivage"}
                                  </button>
                                )}

                                {/* Delete buttons */}
                                <button
                                  onClick={() => isReport ? handleDeleteReport(event.raw.id) : handleDeleteArrival(event.raw.id)}
                                  disabled={!!isProcessing}
                                  className="px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all outline-none border border-rose-100/60 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isLoadingDel ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={13} />
                                  )}
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
                  <Users className="text-brand-green" size={24} />
                  <div>
                    <h3 className="text-lg font-bold">Validation des Comptes Directeurs</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">Nouveaux dossiers à examiner</p>
                  </div>
                </div>
                <span className="bg-brand-green/10 text-brand-green text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
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
                               onClick={() => setSelectedJustificatif(request)}
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Liste des Établissements ({schoolsList.length})</h3>
                    <p className="text-xs text-slate-400 font-medium">Cliquez sur une ligne d'établissement pour consulter le personnel, les stocks et les repas cuisinés.</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Rechercher une école..." 
                      value={schoolSearch}
                      onChange={(e) => setSchoolSearch(e.target.value)}
                      className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom de l'École</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Département</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Commune / Arrondissement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-sans">
                        {((schoolsList || []).filter(school => {
                          const term = schoolSearch.toLowerCase();
                          return (
                            (school.name || '').toLowerCase().includes(term) ||
                            (school.department || '').toLowerCase().includes(term) ||
                            (school.commune || '').toLowerCase().includes(term) ||
                            (school.arrondissement || '').toLowerCase().includes(term)
                          );
                        })).map((school, i) => (
                          <tr 
                            key={school.id || i} 
                            onClick={() => handleViewSchoolDetails(school)}
                            className="hover:bg-slate-50/90 active:bg-slate-100/70 transition-all cursor-pointer group"
                            title="Cliquez pour voir la fiche détaillée de l'établissement"
                          >
                            <td className="px-6 py-4 font-black text-slate-800 group-hover:text-brand-green transition-colors">{school.name}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-500">{school.department || 'Bénin'}</td>
                            <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">
                              <span className="px-2 py-1 rounded bg-brand-green/5 text-brand-green">
                                {school.commune || 'Bénin'}
                              </span>
                              {school.arrondissement && (
                                <span className="ml-1 px-2 py-1 rounded bg-slate-100 text-slate-600">
                                  {school.arrondissement}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {schoolsList.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-bold">Aucune école enregistrée.</td>
                          </tr>
                        )}
                        {schoolsList.length > 0 && ((schoolsList || []).filter(school => {
                          const term = schoolSearch.toLowerCase();
                          return (
                            (school.name || '').toLowerCase().includes(term) ||
                            (school.department || '').toLowerCase().includes(term) ||
                            (school.commune || '').toLowerCase().includes(term) ||
                            (school.arrondissement || '').toLowerCase().includes(term)
                          );
                        })).length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-bold">Aucun établissement ne correspond à votre recherche.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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
                    {isMerveille ? 'HM' : (initialProfile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'SA')}
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">{isMerveille ? 'Merveille Honvou' : (initialProfile?.full_name || 'Super Administrateur')}</h4>
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

      {/* School Details Modal */}
      <AnimatePresence>
        {selectedSchoolDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedSchoolDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden flex flex-col my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedSchoolDetails(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Modal Header */}
              <div className="border-b border-slate-100 pb-5 mb-6 text-left">
                <span className="px-3 py-1 bg-brand-green/10 text-brand-green font-black text-[10px] tracking-widest uppercase rounded-full">
                  Fiche Établissement SÉMI-TEMPS
                </span>
                <h3 className="text-2xl font-black text-slate-800 mt-2 tracking-tight">
                  {selectedSchoolDetails.name}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Département: <span className="text-slate-600 font-black">{selectedSchoolDetails.department || 'Bénin'}</span> | Commune: <span className="text-slate-600 font-black">{selectedSchoolDetails.commune || 'Inconnue'}</span> {selectedSchoolDetails.arrondissement && <>| Arrondissement: <span className="text-slate-600 font-black">{selectedSchoolDetails.arrondissement}</span></>}
                </p>
              </div>

              {/* Modal Content - Scrollable if too long */}
              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 text-left scrollbar-thin scrollbar-thumb-slate-200">
                {isLoadingSchoolDetails ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 size={40} className="text-brand-green animate-spin" />
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Chargement des données de l'école...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column: Personnel & General Info */}
                    <div className="md:col-span-4 space-y-5">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                          Équipe d'Encadrement
                        </h4>
                        
                        <div className="space-y-4">
                          {/* Director Name */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Directeur Coordinateur</span>
                            <p className="text-sm font-extrabold text-slate-800">
                              {selectedSchoolDetails.director_name || "Non encore enregistré dans la base"}
                            </p>
                          </div>

                          {/* Users belonging to this school */}
                          <div className="pt-3 border-t border-slate-200/50 space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Profils Enregistrés ({selectedSchoolStaff.length})</span>
                            {selectedSchoolStaff.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Aucun directeur ou cuisinier inscrit sur la plateforme.</p>
                            ) : (
                              <div className="space-y-2.5">
                                {selectedSchoolStaff.map((p, idx) => (
                                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100/80 shadow-sm text-xs">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-extrabold text-slate-800">{p.full_name}</span>
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                        p.role === 'DIRECTOR' 
                                          ? 'bg-blue-50 text-blue-600' 
                                          : 'bg-emerald-50 text-brand-green'
                                      }`}>
                                        {p.role === 'DIRECTOR' ? 'Directeur' : 'Cuisinier'}
                                      </span>
                                    </div>
                                    <p className="text-slate-400">Tél: <span className="font-bold text-slate-600">{p.phone || 'Non renseigné'}</span></p>
                                    <p className="text-slate-400 text-[10px] mt-0.5 font-medium">N° CIP: <span className="font-bold text-slate-600">{p.cip_number || 'Non renseigné'}</span></p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Inventory stocks & Meals reports stream */}
                    <div className="md:col-span-8 space-y-6">
                      {/* Section 1: Stocks à l'école */}
                      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-150">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Package size={14} className="text-slate-500" />
                            Stocks Réels de Vivres de l'Établissement
                          </h4>
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-md">
                            {selectedSchoolInventory.length} articles
                          </span>
                        </div>

                        {selectedSchoolInventory.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            Aucun lot de vivres (riz, haricot, huile) n'est pour l'instant inventorié pour cette école.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedSchoolInventory.map((item, idx) => (
                              <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aliment / Vivre</p>
                                  <p className="text-sm font-black text-slate-700 mt-0.5">{item.item_name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Disponible</p>
                                  <p className="text-lg font-black text-brand-green mt-0.5">
                                    {item.quantity} <span className="text-xs font-bold text-slate-500">{item.unit || 'kg'}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Rapports de Repas */}
                      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-150">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Utensils size={14} className="text-slate-500" />
                            Historique des Repas Émis (Canteen Logs)
                          </h4>
                          <span className="px-2.5 py-0.5 bg-brand-orange/10 text-brand-orange text-[9px] font-black uppercase rounded-md">
                            {selectedSchoolReports.length} repas
                          </span>
                        </div>

                        {selectedSchoolReports.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            Aucun rapport de repas n'a encore été émis par un cuisinier de cet établissement.
                          </p>
                        ) : (
                          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                            {selectedSchoolReports.map((rep, idx) => (
                              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 text-xs">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="space-y-0.5">
                                    <p className="font-extrabold text-slate-800 text-[13px] leading-tight">
                                      {rep.meal_description || "Menu non renseigné"}
                                    </p>
                                    <p className="text-slate-400 font-semibold text-[10px]">
                                      Cuisiné par: <span className="text-slate-600 font-bold">{rep.profiles?.full_name || 'Cuisinier'}</span> | Le {new Date(rep.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                      rep.is_validated 
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                                    }`}>
                                      {rep.is_validated ? 'Validé' : 'En attente'}
                                    </span>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                                      {rep.students_count || 0} écoliers
                                    </p>
                                  </div>
                                </div>

                                {rep.photos && rep.photos.length > 0 && (
                                  <div className="pt-2 border-t border-slate-200/40">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Preuve(s) photo :</p>
                                    <PhotoGallery photos={rep.photos} onZoom={setSelectedZoomPhoto} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-100 pt-5 mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSchoolDetails(null)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-xs rounded-xl tracking-wider cursor-pointer transition-all active:scale-95"
                >
                  Fermer la Fiche
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox / Zoom modal */}
      <AnimatePresence>
        {selectedZoomPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedZoomPhoto(null)}
            className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-4xl w-full max-h-[85vh] overflow-hidden rounded-3xl bg-white shadow-2xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedZoomPhoto} 
                alt="Repas Zoomé" 
                className="max-w-full max-h-[80vh] mx-auto object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedZoomPhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
