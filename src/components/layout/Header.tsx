import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Utensils, Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { User as SupaUser } from '@supabase/supabase-js';

export default function Header() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [user, setUser] = React.useState<SupaUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.includes('dashboard');

  React.useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'À propos', href: '/#about' },
    { name: 'Impact', href: '/#impact' },
    { name: 'Contact', href: '/#contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-brand-green/20 blur-lg rounded-full group-hover:bg-brand-orange/20 transition-colors" />
              <div className="relative bg-gradient-to-br from-brand-green to-emerald-700 p-2.5 rounded-xl shadow-lg shadow-brand-green/20 group-hover:scale-105 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <path d="M2 12V10C2 6.22876 2 4.34315 3.17157 3.17157C4.34315 2 6.22876 2 10 2H14C17.7712 2 19.6569 2 20.8284 3.17157C22 4.34315 22 6.22876 22 10V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M2 12C2 15.7712 2 17.6569 3.17157 18.8284C4.34315 20 6.22876 20 10 20H14C17.7712 20 19.6569 20 20.8284 18.8284C22 17.6569 22 15.7712 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 11V16M12 11L15 8M12 11L9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-black tracking-tight text-slate-800 leading-none">
                Smart<span className="text-brand-green">Cantine</span>
              </span>
              <span className="text-[9px] font-bold text-brand-orange uppercase tracking-[0.2em] mt-0.5">Bénin • Nutrition</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {!isDashboard && navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-brand-green transition-colors"
              >
                {link.name}
              </a>
            ))}
            
            {user ? (
              <div className="flex items-center gap-4 border-l pl-6 border-slate-200">
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2 text-sm font-bold text-brand-green hover:text-brand-green/80 transition-colors bg-brand-green/10 px-4 py-2 rounded-full"
                >
                  <LayoutDashboard size={18} />
                  <span>Mon Bureau</span>
                </Link>
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-slate-400 hover:text-red-500 transition-all hover:rotate-12"
                  title="Déconnexion"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-brand-green px-4 py-2"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-green text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-brand-green/90 shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-brand-green transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 bg-white overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {!isDashboard && navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-slate-700 hover:text-brand-green py-2 transition-colors border-b border-slate-50 last:border-0"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-2">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-brand-green/10 text-brand-green font-black rounded-2xl border border-brand-green/20"
                    >
                      <LayoutDashboard size={20} />
                      ACCÉDER AU BUREAU
                    </Link>
                    <button
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 text-red-500 font-bold"
                    >
                      <LogOut size={18} />
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="w-full text-center py-3 bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200"
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="w-full text-center py-3 bg-brand-green text-white font-medium rounded-xl hover:bg-brand-green/90"
                    >
                      S'inscrire
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center z-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Déconnexion</h3>
              <p className="text-slate-500 font-medium mb-8">Êtes-vous sûr de vouloir quitter votre session ?</p>
              
              <div className="flex flex-col gap-3">
                <Button 
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl py-4"
                  onClick={() => {
                    handleLogout();
                    setShowLogoutConfirm(false);
                  }}
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
    </header>
  );
}
