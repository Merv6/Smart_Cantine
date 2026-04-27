import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Upload, CheckCircle2, Utensils, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { BENIN_LOCATIONS } from '../constants/benin';

import { supabase } from '../lib/supabase';

export default function Register() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Début de l\'inscription simple pour:', formData.email);
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Erreur Inscription:', err);
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center"
        >
          <div className="bg-brand-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-brand-green" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Compte créé !</h2>
          <p className="text-slate-600 mb-8">
            Veuillez vérifier votre boîte mail pour confirmer votre inscription avant de vous connecter.
          </p>
          <Link to="/login" className="w-full inline-block">
            <Button className="w-full rounded-xl py-4">Se connecter</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-slate-100">
          <h2 className="text-3xl font-display font-bold text-center mb-2">Créer un compte</h2>
          <p className="text-slate-500 text-center mb-8">Inscrivez-vous pour accéder au portail</p>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center gap-2 mb-6 border border-red-100"
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <Input 
              label="Email" 
              type="email" 
              placeholder="votre@email.com" 
              required 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
            <Input 
              label="Mot de passe" 
              type="password" 
              placeholder="••••••••"
              required 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            <Input 
              label="Confirmer le mot de passe" 
              type="password" 
              placeholder="••••••••"
              required 
              value={formData.confirmPassword} 
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
            />

            <Button 
              type="submit" 
              className="w-full rounded-xl py-6 mt-4" 
              isLoading={isLoading}
            >
              Plus d'étapes <ArrowRight className="ml-2" size={18} />
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <p className="text-slate-500">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-brand-green font-bold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

