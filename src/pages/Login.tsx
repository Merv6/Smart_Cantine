import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, ArrowLeft, ArrowRight, ShieldCheck, ChefHat, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';

import { supabase } from '../lib/supabase';

export default function Login() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<'DIRECTOR' | 'COOK' | 'SUPER_ADMIN' | null>(null);
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [securityCode, setSecurityCode] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!selectedRole) {
      setError('Veuillez sélectionner un statut (Directeur, Cuisinier ou Administrateur).');
      return;
    }
    if (!identifier || !password) {
      setError('Tous les champs sont obligatoires.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Connexion Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password: password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error("Cet identifiant n'est pas reconnu ou le mot de passe est incorrect. Veuillez vérifier vos accès.");
        }
        if (authError.message.includes('Email not confirmed')) {
          throw new Error("Votre adresse email n'a pas encore été confirmée. Veuillez vérifier votre boîte de réception.");
        }
        throw authError;
      }

      if (!authData.user) throw new Error("Une erreur inattendue est survenue lors de la connexion.");

      // 2. Récupération du profil pour vérifier le rôle et le CIP
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("Compte authentifié mais profil introuvable. Veuillez contacter le support.");
      }

      // 3. Vérification de la cohérence du rôle
      if (profile.role !== selectedRole) {
        await supabase.auth.signOut();
        throw new Error(`Ce compte n'est pas enregistré en tant que ${selectedRole === 'SUPER_ADMIN' ? 'Administrateur' : selectedRole.toLowerCase()}.`);
      }

      // 4. Validation CIP pour l'administrateur
      if (selectedRole === 'SUPER_ADMIN') {
        if (securityCode !== profile.cip_number) {
          await supabase.auth.signOut();
          throw new Error('Numéro d’identification CIP incorrect.');
        }
      }

      // Succès
      localStorage.setItem('userRole', profile.role);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erreur login:', err);
      setError(err.message || "Email ou mot de passe incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: 'DIRECTOR', title: 'Directeur', icon: <User size={18} />, color: 'bg-brand-green' },
    { id: 'COOK', title: 'Cuisinier', icon: <ChefHat size={18} />, color: 'bg-brand-orange' },
    { id: 'SUPER_ADMIN', title: 'Admin', icon: <ShieldCheck size={18} />, color: 'bg-blue-500' },
  ] as const;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-brand-light py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-brand-green font-medium mb-8 hover:opacity-80 transition-opacity">
            <ArrowLeft size={16} /> <span>Retour à l'accueil</span>
          </Link>
          <div className="bg-brand-green w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-green/20">
            <span className="text-white font-bold text-2xl">SC</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">Connexion</h2>
          <p className="text-slate-500">Choisissez votre rôle et identifiez-vous</p>
        </div>

        <motion.div
          animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
        >
          {/* Role Selection */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {roles.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRole(role.id as any);
                  setError('');
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group ${
                  selectedRole === role.id 
                    ? 'border-brand-green bg-brand-green/5' 
                    : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110 ${
                  selectedRole === role.id ? role.color : 'bg-slate-300'
                }`}>
                  {role.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  selectedRole === role.id ? 'text-brand-green' : 'text-slate-400'
                }`}>
                  {role.title}
                </span>
              </button>
            ))}
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100"
                >
                  <AlertCircle size={14} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Adresse Email"
              type="email"
              placeholder="votre@email.com"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="rounded-xl"
              icon={<Mail size={18} />}
            />
            
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="rounded-xl"
              icon={<Lock size={18} />}
            />

            <AnimatePresence>
              {selectedRole === 'SUPER_ADMIN' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="pt-2"
                >
                  <Input
                    label="Numéro d'identification CIP"
                    placeholder="Entrez votre numéro CIP"
                    type="password"
                    required
                    value={securityCode}
                    onChange={e => setSecurityCode(e.target.value)}
                    className="rounded-xl border-blue-200 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-blue-400 mt-1 font-bold italic tracking-tight">
                    * Authentification CIP requise pour les administrateurs.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end pt-1">
              <a href="#" className="text-xs text-brand-green font-semibold hover:underline">
                Mot de passe oublié ?
              </a>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-xl py-6 text-base font-bold bg-brand-green hover:bg-brand-green/90 mt-4 shadow-xl shadow-brand-green/20"
              isLoading={isLoading}
            >
              {isLoading ? 'Authentification...' : 'Accéder au Portail'} 
              {!isLoading && <ArrowRight className="ml-2" size={18} />}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Nouveau sur la plateforme ?{' '}
              <Link to="/register" className="text-brand-green font-bold hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </motion.div>
        
        <div className="mt-10 text-center">
           <p className="text-xs text-slate-400">
             SmartCantine est une initiative gouvernementale sécurisée.<br/>
             Veuillez contacter votre administrateur départemental en cas de problème d'accès.
           </p>
        </div>
      </motion.div>
    </div>
  );
}
