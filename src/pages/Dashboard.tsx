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
  User
} from 'lucide-react';
import { UserRole } from '../types';
import AdminDash from '../components/dashboard/AdminDash';
import DirectorDash from '../components/dashboard/DirectorDash';
import CookDash from '../components/dashboard/CookDash';
import Chatbot from '../components/dashboard/Chatbot';
import { Button } from '../components/ui';

export default function Dashboard() {
  const savedRole = localStorage.getItem('userRole');
  const [role, setRole] = React.useState<UserRole>((savedRole as UserRole) || UserRole.DIRECTOR);
  const [activeTab, setActiveTab] = React.useState('overview');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!savedRole) {
      navigate('/login');
    }
  }, [savedRole, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const roleLabels = {
    [UserRole.SUPER_ADMIN]: 'Super Administrateur',
    [UserRole.DIRECTOR]: 'Directeur d\'École',
    [UserRole.COOK]: 'Cuisinier'
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] flex flex-col lg:flex-row text-left">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col pt-8 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)]">
         <div className="px-6 mb-10">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white shadow-lg shadow-brand-green/20">
                  <User size={20} />
               </div>
               <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate">Jean Dupont</p>
               </div>
            </div>
         </div>

         <nav className="flex-1 px-4 space-y-1">
            {[
              { id: 'overview', icon: <LayoutDashboard size={20} />, label: 'Vue d\'ensemble' },
              { id: 'stock', icon: <BarChart size={20} />, label: 'Gestion Stocks' },
              { id: 'schools', icon: <School size={20} />, label: role === UserRole.SUPER_ADMIN ? 'Écoles' : 'Ma Cantine' },
              { id: 'settings', icon: <Settings size={20} />, label: 'Paramètres' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-brand-green text-white shadow-xl shadow-brand-green/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {item.icon}
                <span className="text-sm font-bold tracking-tight">{item.label}</span>
              </button>
            ))}
         </nav>

         <div className="p-6 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm font-bold tracking-tight">Déconnexion</span>
            </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={role + activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
          >
            {role === UserRole.SUPER_ADMIN && <AdminDash />}
            {role === UserRole.DIRECTOR && <DirectorDash />}
            {role === UserRole.COOK && <CookDash />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Bot */}
      <Chatbot />
    </div>
  );
}
