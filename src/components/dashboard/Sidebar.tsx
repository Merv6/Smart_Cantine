import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Settings, 
  User, 
  School, 
  Package, 
  Utensils, 
  CheckCircle, 
  LogOut, 
  ChevronLeft,
  X,
  Menu
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  role: UserRole | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({
  role,
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onLogout
}: SidebarProps) {
  
  const menuGroups = React.useMemo(() => {
    if (role === UserRole.SUPER_ADMIN) {
      return [
        {
          title: "PLATEFORME",
          items: [
            { id: 'overview', label: "Dashboard", icon: <LayoutDashboard size={20} /> },
            { id: 'validations', label: "Validations", icon: <CheckCircle size={20} /> },
            { id: 'schools', label: "Gestion Écoles", icon: <School size={20} /> },
            { id: 'inventory', label: "Stock National", icon: <Package size={20} /> },
          ]
        },
        {
          title: "COMPTE",
          items: [
            { id: 'profile', label: "Mon Profil", icon: <User size={20} /> },
            { id: 'settings', label: "Paramètres", icon: <Settings size={20} /> },
          ]
        }
      ];
    }
    if (role === UserRole.DIRECTOR) {
      return [
        {
          title: "ÉCOLE",
          items: [
            { id: 'overview', label: "Vue d'ensemble", icon: <LayoutDashboard size={20} /> },
            { id: 'validate_meals', label: "Validation Repas", icon: <CheckCircle size={20} /> },
            { id: 'inventory', label: "Gestion Stocks", icon: <Package size={20} /> },
            { id: 'canteen', label: "Ma Cantine", icon: <Utensils size={20} /> },
          ]
        },
        {
          title: "COMPTE",
          items: [
            { id: 'profile', label: "Mon Profil", icon: <User size={20} /> },
            { id: 'settings', label: "Paramètres", icon: <Settings size={20} /> },
          ]
        }
      ];
    }
    if (role === UserRole.COOK) {
      return [
        {
          title: "CANTINE",
          items: [
            { id: 'overview', label: "Tableau de Bord", icon: <LayoutDashboard size={20} /> },
            { id: 'rapport', label: "Nouveau Rapport", icon: <CheckCircle size={20} /> },
            { id: 'inventory', label: "Mes Stocks", icon: <Package size={20} /> },
          ]
        },
        {
          title: "COMPTE",
          items: [
            { id: 'profile', label: "Mon Profil", icon: <User size={20} /> },
            { id: 'settings', label: "Paramètres", icon: <Settings size={20} /> },
          ]
        }
      ];
    }

    return [
      {
        title: "SERVICE",
        items: [
          { id: 'overview', label: "Cantine", icon: <Utensils size={20} /> },
          { id: 'profile', label: "Profil", icon: <User size={20} /> },
        ]
      }
    ];
  }, [role]);

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 flex-grow">
      {/* Top Section / Brand & Toggle */}
      <div className={`p-4 mb-2 flex items-center transition-all ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'}`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`shrink-0 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm ${isCollapsed && !isMobileOpen ? 'mx-auto' : ''}`}
        >
          <Menu size={20} />
        </button>
        {(!isCollapsed || isMobileOpen) && (
          <div className="flex items-center gap-2 ml-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center text-white shrink-0">
              <Utensils size={16} />
            </div>
            <span className="font-bold text-slate-800 text-sm truncate uppercase tracking-tight">SmartCantine</span>
          </div>
        )}
      </div>

      {/* Persistent Search (Optional accent) */}
      {!isCollapsed && !isMobileOpen && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-slate-400">
            <Menu size={16} className="shrink-0" />
            <span className="text-xs font-medium">Rechercher...</span>
          </div>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 space-y-8 py-2 overflow-y-auto scrollbar-hide">
        {menuGroups.map((group, idx) => (
          <div key={group.title || idx} className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all group relative ${
                      isActive 
                      ? 'bg-slate-100 text-slate-900' 
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    } ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}
                  >
                    <div className={`shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {item.icon}
                    </div>
                    {(!isCollapsed || isMobileOpen) && <span className="truncate text-xs font-semibold">{item.label}</span>}
                    
                    {isCollapsed && !isMobileOpen && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-50 space-y-1">
        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all group ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}
        >
          <LogOut size={18} />
          {(!isCollapsed || isMobileOpen) && <span className="text-xs font-semibold">Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className={`flex-shrink-0 transition-all duration-500 ${isCollapsed ? 'w-16' : 'w-16'}`}>
        {/* This div reserves the 64px space (w-16) so content doesn't move when opening */}
      </div>

      <aside 
        className={`fixed top-0 left-0 h-screen z-[150] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white border-r border-slate-100 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCollapsed(true)}
              className="fixed inset-0 bg-slate-900/5 z-[-1] backdrop-blur-[1px]"
            />
          )}
        </AnimatePresence>
        
        <div className="h-full relative overflow-hidden flex flex-col">
          {SidebarContent}
        </div>
      </aside>
    </>
  );
}
