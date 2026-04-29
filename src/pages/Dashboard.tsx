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
  Menu
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
  onViewChange 
}: { 
  view: string, 
  role: UserRole | null, 
  isValidated: boolean,
  onViewChange: (view: any) => void
}) {
  if (role === UserRole.SUPER_ADMIN) return <AdminDash isValidated={isValidated} />;
  
  if (role === UserRole.DIRECTOR) {
    return <DirectorDash isValidated={isValidated} initialView={view as any} onViewChange={onViewChange} />;
  }

  if (role === UserRole.COOK) return <CookDash isValidated={isValidated} />;

  return null;
}

export default function Dashboard() {
  const [role, setRole] = React.useState<UserRole | null>(null);
  const [isValidated, setIsValidated] = React.useState<boolean | null>(null);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isLoading, setIsLoading] = React.useState(true);
  const [showValidationModal, setShowValidationModal] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !profile) {
        console.error('Erreur chargement profil:', error);
        
        // Force SUPER_ADMIN for the specific demo emails
        const adminEmails = ['honvoumerveille@gmail.com', 'arianaudelegbede1@gmail.com'];
        if (user.email && adminEmails.includes(user.email)) {
          setRole(UserRole.SUPER_ADMIN);
          setIsValidated(true);
          setIsLoading(false);
          return;
        }

        // Fallback pour la démo si profil manquant
        setRole(UserRole.DIRECTOR);
        setIsValidated(false);
        setIsLoading(false);
        return;
      }

      // Also force override even if profile exists but role is wrong
      const adminEmails = ['honvoumerveille@gmail.com', 'arianaudelegbede1@gmail.com'];
      if (user.email && adminEmails.includes(user.email)) {
        setRole(UserRole.SUPER_ADMIN);
        setIsValidated(true);
      } else {
        setRole(profile.role as UserRole || UserRole.DIRECTOR);
        setIsValidated(profile.is_validated);
      }
      setIsLoading(false);
    }

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    navigate('/login');
  };

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

  // Dashboard normal, accessible même si non validé (avec restrictions)
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-left">
      {/* Validation Banner if unvalidated */}
      {isValidated === false && (
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

      <div className="flex flex-col lg:flex-row flex-1">
        {/* Sidebar Navigation */}
        <aside 
          className={`bg-white border-r border-slate-200 flex flex-col pt-8 lg:sticky lg:top-0 lg:h-screen transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'w-20' : 'w-72'
          }`}
        >
          <div className={`px-6 mb-10 overflow-hidden ${isSidebarCollapsed ? 'px-4' : ''}`}>
             <div className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 shrink-0 rounded-full bg-brand-green flex items-center justify-center text-white shadow-lg shadow-brand-green/20">
                   <User size={20} />
                </div>
                {!isSidebarCollapsed && (
                  <div className="overflow-hidden">
                     <p className="text-sm font-bold text-slate-800 truncate">Utilisateur Connecté</p>
                  </div>
                )}
             </div>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {[
              { id: 'overview', label: "Vue d'ensemble", icon: <LayoutDashboard size={20} /> },
              { id: 'validate_meals', label: "Validation Repas", icon: <CheckCircle size={20} /> },
              { id: 'inventory', label: "Gestion des stocks", icon: <Package size={20} /> },
              { id: 'canteen', label: "Ma Cantine", icon: <Utensils size={20} /> },
              { id: 'profile', label: "Mon Profil", icon: <User size={20} /> },
              { id: 'settings', label: "Paramètres", icon: <Settings size={20} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${
                  activeTab === tab.id 
                  ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? tab.label : ''}
              >
                <div className="shrink-0">{tab.icon}</div>
                {!isSidebarCollapsed && <span className="truncate">{tab.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 space-y-2">
             <button 
               onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
               className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}
             >
                <Menu size={20} className={isSidebarCollapsed ? '' : 'rotate-180 transition-transform'} />
                {!isSidebarCollapsed && <span>Réduire</span>}
             </button>
             <button 
               onClick={handleLogout}
               className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}
             >
                <LogOut size={20} />
                {!isSidebarCollapsed && <span>Déconnexion</span>}
             </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 lg:p-12">
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
                onViewChange={setActiveTab}
              />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Chatbot />
      
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
