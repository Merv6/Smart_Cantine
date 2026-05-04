import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, ArrowLeft, ArrowRight, ShieldCheck, ChefHat, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../components/ui';

import { supabase } from '../lib/supabase';

export default function Login() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  const [resetSent, setResetSent] = React.useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Tous les champs sont obligatoires.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Tentative de connexion pour:', identifier.trim());
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password: password,
      });

      if (authError) {
        console.error('Erreur Auth Supabase:', authError);
        if (authError.message === 'Invalid login credentials') {
          throw new Error("Email ou mot de passe incorrect.");
        }
        if (authError.message.includes('Email not confirmed')) {
          throw new Error("Votre email n'est pas encore confirmé. Vérifiez vos messages.");
        }
        throw new Error(authError.message);
      }

      if (!authData.user) throw new Error("Utilisateur non trouvé après connexion.");

      console.log('Utilisateur connecté, redirection...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Exception capturée:', err);
      setError(err.message || "Impossible de se connecter.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!identifier) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) throw resetError;
      
      setResetSent(true);
    } catch (err: any) {
      console.error('Erreur reset password:', err);
      setError(err.message || "Erreur lors de l'envoi de l'email de réinitialisation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="bg-brand-green w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-green/20">
            <span className="text-white font-bold text-2xl">SC</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">Bon retour</h2>
          <p className="text-slate-500">Connectez-vous à votre portail SmartCantine</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
          <AnimatePresence mode="wait">
            {resetSent ? (
              <motion.div
                key="reset-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Email envoyé !</h3>
                <p className="text-slate-500 mb-6">
                  Vérifiez votre boîte mail ({identifier}) pour réinitialiser votre mot de passe.
                </p>
                <Button 
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetSent(false);
                  }}
                  className="w-full rounded-xl"
                  variant="outline"
                >
                  Retour à la connexion
                </Button>
              </motion.div>
            ) : isForgotPassword ? (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-xl font-bold text-slate-800 mb-2">Mot de passe oublié</h3>
                <p className="text-slate-500 mb-6">
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>

                {error && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center gap-2 mb-6 border border-red-100">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-6">
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
                  
                  <div className="flex flex-col gap-3">
                    <Button 
                      type="submit" 
                      className="w-full rounded-xl py-6 text-base font-bold bg-brand-green mt-2 shadow-xl shadow-brand-green/20"
                      isLoading={isLoading}
                    >
                      Envoyer le lien
                    </Button>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError('');
                      }}
                      className="text-sm text-slate-400 hover:text-slate-600 font-medium py-2"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {error && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center gap-2 mb-6 border border-red-100">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleLogin}>
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
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="rounded-xl"
                    icon={<Lock size={18} />}
                    rightElement={
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />

                  <div className="flex justify-end">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                      }}
                      className="text-xs text-brand-green font-semibold hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full rounded-xl py-6 text-base font-bold bg-brand-green hover:bg-brand-green/90 mt-4 shadow-xl shadow-brand-green/20"
                    isLoading={isLoading}
                  >
                    Se connecter <ArrowRight className="ml-2" size={18} />
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-sm text-slate-600">
                    Pas encore de compte ?{' '}
                    <Link to="/register" className="text-brand-green font-bold hover:underline">
                      Créer un compte
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
