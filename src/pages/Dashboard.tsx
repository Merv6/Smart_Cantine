import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  LayoutDashboard, 
  ChefHat, 
  Settings, 
  Bell, 
  Search,
  School,
  LogOut,
  User,
  AlertCircle,
  CheckCircle,
  Package,
  Utensils,
  Menu,
  X,
  ChevronLeft,
  Clock
} from 'lucide-react';
import { UserRole } from '../types';
import AdminDash from '../components/dashboard/AdminDash';
import DirectorDash from '../components/dashboard/DirectorDash';
import CookDash from '../components/dashboard/CookDash';
import Chatbot from '../components/dashboard/Chatbot';
import AccountValidationForm from '../components/dashboard/AccountValidationForm';
import { Button } from '../components/ui';
import { supabase } from '../lib/supabase';

function ViewRenderer({ 
  view, 
  role, 
  isValidated, 
  user,
  profile,
  onViewChange 
}: { 
  view: string, 
  role: UserRole | null, 
  isValidated: boolean,
  user: any,
  profile: any,
  onViewChange: (view: any) => void
}) {
  if (role === UserRole.SUPER_ADMIN) {
    return <AdminDash user={user} profile={profile} isValidated={isValidated} initialView={view as any} onViewChange={onViewChange} />;
  }
  
  if (role === UserRole.DIRECTOR) {
    return <DirectorDash user={user} profile={profile} isValidated={isValidated} initialView={view as any} onViewChange={onViewChange} />;
  }

  if (role === UserRole.COOK) return <CookDash user={user} profile={profile} isValidated={isValidated} />;

  return null;
}

export default function Dashboard() {
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [role, setRole] = React.useState<UserRole | null>(null);
  const [isValidated, setIsValidated] = React.useState<boolean | null>(null);
  const [isValidationPending, setIsValidationPending] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isLoading, setIsLoading] = React.useState(true);
  const [initError, setInitError] = React.useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkAuth = React.useCallback(async (currentUser?: any) => {
    try {
      setInitError(null);
      const activeUser = currentUser || (await supabase.auth.getUser()).data.user;
      
      if (!activeUser) {
        if (!isLoading) navigate('/login');
        return null;
      }

      setUser(activeUser);

      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .maybeSingle();

      if (error) {
        if (error.message.includes('Failed to fetch')) {
          setInitError("Erreur de connexion : Impossible de joindre le serveur. Vérifiez votre connexion internet.");
          setIsLoading(false);
          return null;
        }
        console.error('Erreur chargement profil:', error);
      }

      if (!userProfile) {
        const adminEmails = ['honvoumerveille@gmail.com', 'arianaudelegbede1@gmail.com'];
        if (activeUser.email && adminEmails.includes(activeUser.email)) {
          setRole(UserRole.SUPER_ADMIN);
          setIsValidated(true);
          setIsLoading(false);
          
          supabase.from('profiles').upsert({ 
            id: activeUser.id, 
            role: 'SUPER_ADMIN', 
            is_validated: true,
            full_name: activeUser.user_metadata?.full_name || activeUser.email?.split('@')[0]
          }).then(({error}) => {
            if (error) console.error('Error creating admin profile:', error);
          });

          return activeUser;
        }

        setRole(UserRole.DIRECTOR);
        setIsValidated(false);
        setIsLoading(false);
        return activeUser;
      }

      setProfile(userProfile);
      const adminEmails = ['honvoumerveille@gmail.com', 'arianaudelegbede1@gmail.com'];
      if (activeUser.email && adminEmails.includes(activeUser.email)) {
        setRole(UserRole.SUPER_ADMIN);
        setIsValidated(true);
        
        if (userProfile?.role !== 'SUPER_ADMIN') {
          supabase.from('profiles').update({ role: 'SUPER_ADMIN', is_validated: true }).eq('id', activeUser.id).then(({error}) => {
            if (error) console.error('Error syncing admin role:', error);
          });
        }
      } else {
        setRole(userProfile.role as UserRole || UserRole.DIRECTOR);
        setIsValidated(userProfile.is_validated);
        
        if (!userProfile.is_validated) {
          const { data: request } = await supabase
            .from('validation_requests')
            .select('status')
            .eq('user_id', activeUser.id)
            .eq('status', 'pending')
            .maybeSingle();
            
          if (request) {
            setIsValidationPending(true);
          }
        }
      }
      setIsLoading(false);
      return activeUser;
    } catch (err: any) {
      console.error('Crash in checkAuth:', err);
      if (err.message?.includes('Failed to fetch')) {
        setInitError("Erreur de réseau : Le serveur est injoignable.");
      } else {
        setInitError("Une erreur inattendue est survenue au démarrage.");
      }
      setIsLoading(false);
      return null;
    }
  }, [navigate, isLoading]);

  React.useEffect(() => {
    const initDashboard = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        navigate('/login');
        return;
      }

      await checkAuth(currentUser);

      const subscription = supabase
        .channel(`profile_changes_${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${currentUser.id}`
          },
          (payload) => {
            console.log('Profile updated in real-time:', payload.new);
            setProfile(payload.new);
            setIsValidated(payload.new.is_validated);
            setRole(payload.new.role as UserRole);
            if (payload.new.is_validated) {
              setIsValidationPending(false);
            }
          }
        )
        .subscribe();

      const requestSub = supabase
        .channel(`request_changes_${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'validation_requests',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            console.log('Validation request changed:', payload);
            if (payload.eventType === 'DELETE' || (payload.new && payload.new.status !== 'pending')) {
               setIsValidationPending(false);
            } else if (payload.eventType === 'INSERT' || (payload.new && payload.new.status === 'pending')) {
               setIsValidationPending(true);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
        requestSub.unsubscribe();
      };
    };

    const cleanupPromise = initDashboard();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [checkAuth, navigate]);

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // Get menu items based on role
  const menuItems = React.useMemo(() => {
    if (role === UserRole.SUPER_ADMIN) {
      return [
        { id: 'overview', label: "Tableau de Bord", icon: <LayoutDashboard size={20} /> },
        { id: 'validations', label: "Validations", icon: <CheckCircle size={20} /> },
        { id: 'schools', label: "Gestion Écoles", icon: <School size={20} /> },
        { id: 'inventory', label: "Stock National", icon: <Package size={20} /> },
        { id: 'profile', label: "Mon Profil", icon: <User size={20} /> },
        { id: 'settings', label: "Paramètres", icon: <Settings size={20} /> },
      ];
    }
    if (role === UserRole.DIRECTOR) {
      return [
        { id: 'overview', label: "Vue d'ensemble", icon: <LayoutDashboard size={20} /> },
        { id: 'validate_meals', label: "Validation Repas", icon: <CheckCircle size={20} /> },
        { id: 'inventory', label: "Gestion des stocks", icon: <Package size={20} /> },
        { id: 'canteen', label: "Ma Cantine", icon: <Utensils size={20} /> },
        { id: 'profile', label: "Mon Profil", icon: <User size={20} /> },
        { id: 'settings', label: "Paramètres", icon: <Settings size={20} /> },
      ];
    }
    return [
      { id: 'overview', label: "Mon Service", icon: <Utensils size={20} /> },
      { id: 'profile', label: "Mon Profil", icon: <User size={20} /> },
    ];
  }, [role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center space-y-6">
           <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
             <AlertCircle size={32} />
           </div>
           <h2 className="text-xl font-black text-slate-800">Problème de Synchronisation</h2>
           <p className="text-slate-500 font-medium leading-relaxed">{initError}</p>
           <Button 
             className="w-full bg-brand-green"
             onClick={() => window.location.reload()}
           >
             RÉESSAYER LA CONNEXION
           </Button>
        </div>
      </div>
    );
  }

  // Dashboard normal, accessible même si non validé (avec restrictions)
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-left">
      {/* Validation Banner if unvalidated and not pending */}
      {isValidated === false && !isValidationPending && (
        <div className="bg-brand-orange text-white py-3 px-6 flex flex-col md:flex-row justify-between items-center gap-3 sticky top-0 z-[100] shadow-md">
          <div className="flex items-center gap-3 text-center md:text-left">
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <p className="text-xs md:text-sm font-bold">Mode "Consultation Seule" activé</p>
              <p className="text-[10px] md:text-xs opacity-90">Validez votre compte pour commencer à enregistrer des données et des photos.</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="bg-white text-brand-orange hover:bg-white/90 font-bold text-xs px-6 py-2 h-auto rounded-full shrink-0 shadow-lg"
            onClick={() => setShowValidationModal(true)}
          >
            VALIDER MON COMPTE
          </Button>
        </div>
      )}

      {/* Pending Validation Banner */}
      {isValidated === false && isValidationPending && (
        <div className="bg-blue-500 text-white py-3 px-6 flex flex-col md:flex-row justify-between items-center gap-3 sticky top-0 z-[100] shadow-md">
          <div className="flex items-center gap-3 text-center md:text-left">
            <Clock size={20} className="shrink-0 animate-pulse" />
            <div>
              <p className="text-xs md:text-sm font-bold">Validation en attente</p>
              <p className="text-[10px] md:text-xs opacity-90">Votre demande est en cours d'examen par le Superviseur. Vous serez notifié dès l'activation.</p>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-1.5 rounded-full">
            Dossier transmis
          </div>
        </div>
      )}

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-[150] lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row flex-1 relative bg-slate-50/30">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-[140] shadow-sm">
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
           >
             <Menu size={24} />
           </button>
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                SC
              </div>
              <span className="font-black text-slate-800 text-sm tracking-tighter uppercase">SmartCantine</span>
           </div>
           <div className="w-10" />
        </div>

        {/* Sidebar Navigation */}
        <aside 
          className={`bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-[160] lg:sticky lg:top-0 lg:h-screen shadow-2xl lg:shadow-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isSidebarCollapsed ? 'lg:w-[80px]' : 'lg:w-72'
          } ${isMobileMenuOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0 w-[280px] lg:w-auto'}`}
        >
          <div className="lg:hidden absolute top-6 right-6">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col h-full py-8">
            {/* Logo Section */}
            <div className={`px-6 mb-10 transition-all ${isSidebarCollapsed ? 'lg:px-4' : ''}`}>
               <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-green flex items-center justify-center text-white shadow-lg shadow-brand-green/20">
                    <Utensils size={20} />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex flex-col text-left">
                      <span className="font-black text-slate-900 leading-none tracking-tighter">SmartCantine</span>
                      <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest mt-1">Plateforme</span>
                    </div>
                  )}
               </div>
            </div>

            {/* Nav Items */}
            <nav className={`flex-1 px-4 space-y-1.5 overflow-y-auto ${isSidebarCollapsed ? 'lg:px-3' : ''}`}>
              {menuItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all group relative ${
                    activeTab === tab.id 
                    ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  } ${isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                >
                  <div className={`shrink-0 transition-transform group-hover:scale-110 ${isSidebarCollapsed ? 'lg:flex lg:justify-center' : ''}`}>
                    {tab.icon}
                  </div>
                  {!isSidebarCollapsed && <span className="truncate">{tab.label}</span>}
                  
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                      {tab.label}
                    </div>
                  )}
                </button>
              ))}
            </nav>

            {/* Actions Section */}
            <div className={`px-4 pt-4 border-t border-slate-100 space-y-1.5 ${isSidebarCollapsed ? 'lg:px-3' : ''}`}>
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`hidden lg:flex w-full items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all group ${isSidebarCollapsed ? 'justify-center border border-slate-100' : ''}`}
              >
                <div className={`transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                  <ChevronLeft size={20} />
                </div>
                {!isSidebarCollapsed && <span>Réduire</span>}
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all group ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}
              >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                {!isSidebarCollapsed && <span>Déconnexion</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-10 overflow-auto bg-white/40">
          <AnimatePresence mode="wait">
            <motion.div
              key={(role || '') + activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ViewRenderer 
                view={activeTab} 
                role={role} 
                isValidated={!!isValidated} 
                user={user}
                profile={profile}
                onViewChange={setActiveTab}
              />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Chatbot />
      
      
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Déconnexion</h3>
              <p className="text-slate-500 font-medium mb-8">Êtes-vous sûr de vouloir quitter votre session ?</p>
              
              <div className="flex flex-col gap-3">
                <Button 
                  variant="primary" 
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl py-4"
                  onClick={handleLogout}
                >
                  OUI, SE DÉCONNECTER
                </Button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Validation Modal */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowValidationModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <AccountValidationForm 
                onComplete={() => {
                  setShowValidationModal(false);
                  checkAuth();
                }} 
              />
              <button 
                onClick={() => setShowValidationModal(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100/10 hover:bg-slate-100/20 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
