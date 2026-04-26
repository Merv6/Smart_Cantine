import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Upload, CheckCircle2, Utensils, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { BENIN_LOCATIONS } from '../constants/benin';

import { supabase } from '../lib/supabase';

export default function Register() {
  const [step, setStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({
    role: '' as string,
    name: '',
    email: '',
    phone: '',
    password: '',
    department: '',
    commune: '',
    arrondissement: '',
    school: '',
    cipNumber: '',
    document: null as File | null
  });

  const navigate = useNavigate();

  const validateStep = (currentStep: number) => {
    setError('');
    if (currentStep === 0) {
      if (!formData.role) {
        setError('Veuillez sélectionner un rôle.');
        return false;
      }
    } else if (currentStep === 1) {
      if (!formData.name || !formData.phone || !formData.email || !formData.password) {
        setError('Veuillez remplir tous les champs personnels.');
        return false;
      }
      if (formData.role === 'SUPER_ADMIN' && !formData.cipNumber) {
        setError('Le numéro CIP est obligatoire pour les administrateurs.');
        return false;
      }
    } else if (currentStep === 2) {
      const basicFields = formData.department && formData.commune && formData.arrondissement;
      const schoolField = formData.role === 'SUPER_ADMIN' ? true : !!formData.school;
      if (!basicFields || !schoolField) {
        setError('Veuillez renseigner toutes les informations de localisation/école.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setError('');
    if (step === 0) navigate('/login');
    else setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.document) {
      setError('Veuillez télécharger un document justificatif.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // 1. Authentification Supabase (SignUp)
      // On passe le nom et le rôle dans les metadata pour que le trigger puisse les utiliser
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            role: formData.role,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erreur lors de la création de l'utilisateur");

      // 2. Mise à jour complémentaire (si admin, on ajoute le CIP)
      // Le profil a déjà été créé par le trigger, on fait juste un update si nécessaire
      if (formData.role === 'SUPER_ADMIN' && formData.cipNumber) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ cip_number: formData.cipNumber })
          .eq('id', authData.user.id);
        
        if (updateError) console.warn("Erreur mise à jour CIP:", updateError);
      }

      // Note: Le téléchargement du document justificatif dans Storage pourrait être ajouté ici
      
      setStep(4); // Succès
    } catch (err: any) {
      console.error('Erreur inscription:', err);
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDept = BENIN_LOCATIONS.find(d => d.department === formData.department);

  const roles = [
    { 
      id: 'DIRECTOR', 
      title: 'Directeur d\'École', 
      desc: 'Gérer les stocks et superviser la cantine de votre établissement.',
      icon: <CheckCircle2 className="text-brand-green" />
    },
    { 
      id: 'COOK', 
      title: 'Cuisinier', 
      desc: 'Enregistrer les repas quotidiens et les photos de service.',
      icon: <Utensils className="text-brand-orange" />
    },
    { 
      id: 'SUPER_ADMIN', 
      title: 'Administrateur', 
      desc: 'Superviser plusieurs écoles et valider les rapports.',
      icon: <ShieldCheck className="text-blue-500" />
    }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-brand-light py-12 px-4 relative overflow-hidden text-left">
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 p-8 md:p-12 border border-slate-100 flex flex-col items-center">
          
          {step < 4 && (
            <div className="w-full mb-10">
              <div className="flex justify-between items-center mb-6">
                <button 
                  type="button"
                  onClick={handlePrev} 
                  className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-green hover:bg-brand-green/10 transition-all"
                >
                   <ArrowLeft size={20} />
                </button>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(i => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-brand-green' : 'w-4 bg-slate-100'}`}
                    />
                  ))}
                </div>
                <div className="w-10" /> {/* Spacer */}
              </div>
              <h2 className="text-3xl font-display font-bold text-center mb-2">Inscription</h2>
              <p className="text-slate-500 text-center mb-4">
                {step === 0 ? "Choisissez votre rôle" : `Étape ${step} sur 3`}
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-red-100 max-w-sm mx-auto"
                  >
                    <AlertCircle size={14} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full">
            {step === 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="grid gap-4">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setFormData({...formData, role: r.id});
                        setError('');
                        setStep(1);
                      }}
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:border-brand-green group ${
                        formData.role === r.id ? 'border-brand-green bg-brand-green/5' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="bg-white p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        {r.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{r.title}</h4>
                        <p className="text-xs text-slate-500">{r.desc}</p>
                      </div>
                      <ChevronRight className="ml-auto text-slate-300" size={20} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input label="Nom complet" placeholder="Jean Dupont" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <Input label="Téléphone" placeholder="+229 00 00 00 00" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <Input label="Email professionnel" type="email" placeholder="utilisateur@smartcantine.bj" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <Input label="Mot de passe" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                
                {formData.role === 'SUPER_ADMIN' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Input 
                      label="Numéro d'identification CIP" 
                      placeholder="Ex: 123456789" 
                      required 
                      value={formData.cipNumber} 
                      onChange={e => setFormData({...formData, cipNumber: e.target.value})} 
                    />
                    <p className="text-[10px] text-blue-500 font-bold mt-1 px-1">
                      ⚠️ Ce numéro sera requis pour vos prochaines connexions.
                    </p>
                  </motion.div>
                )}

                <Button type="button" onClick={handleNext} className="w-full rounded-xl py-6 mt-4">
                  Continuer <ArrowRight className="ml-2" size={18} />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 ml-1">Département</label>
                    <select 
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none"
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value, commune: ''})}
                    >
                      <option value="">Sélectionner</option>
                      {BENIN_LOCATIONS.map(loc => (
                        <option key={loc.department} value={loc.department}>{loc.department}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 ml-1">Commune</label>
                    <select 
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none"
                      disabled={!formData.department}
                      value={formData.commune}
                      onChange={e => setFormData({...formData, commune: e.target.value})}
                    >
                      <option value="">Sélectionner</option>
                      {selectedDept?.communes.map(com => (
                        <option key={com} value={com}>{com}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input label="Arrondissement" placeholder="Ex: Godomey" required value={formData.arrondissement} onChange={e => setFormData({...formData, arrondissement: e.target.value})} />
                
                {formData.role !== 'SUPER_ADMIN' && (
                  <Input label="Nom de l'école publique" placeholder="Ex: EPP Godomey Centre" required value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} />
                )}
                
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={handlePrev} className="flex-1 rounded-xl">Retour</Button>
                  <Button type="button" onClick={handleNext} className="flex-[2] rounded-xl">Continuer</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className={`p-8 border-2 border-dashed rounded-3xl text-center group transition-all cursor-pointer ${
                    formData.document ? 'border-brand-green bg-brand-green/5' : 'border-slate-200 bg-slate-50 hover:border-brand-green'
                  }`}
                >
                  <Upload className={`mx-auto mb-4 ${formData.document ? 'text-brand-green' : 'text-slate-400 group-hover:text-brand-green'}`} size={48} />
                  <p className="text-slate-600 font-medium mb-1">
                    {formData.document ? 'Document sélectionné' : 'Télécharger Document Justificatif'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formData.document ? formData.document.name : 'Preuve de fonction (PDF, JPG ou PNG)'}
                  </p>
                  <input 
                    type="file" 
                    className="hidden" 
                    id="file-upload" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFormData({...formData, document: e.target.files[0]});
                        setError('');
                      }
                    }}
                  />
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed text-center px-4">
                  En cliquant sur "Soumettre", vous certifiez que toutes les informations fournies sont exactes. Votre compte sera validé par un administrateur sous 48h.
                </p>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={handlePrev} className="flex-1 rounded-xl">Retour</Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] rounded-xl bg-brand-green" 
                    isLoading={isLoading}
                  >
                    {isLoading ? 'Traitement en cours...' : 'Soumettre la demande'}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="text-center py-10"
              >
                <div className="bg-brand-green/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 size={56} className="text-brand-green" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-4 text-slate-800">Demande Envoyée !</h2>
                <p className="text-slate-600 mb-10 leading-relaxed max-w-sm mx-auto font-medium">
                  Merci, <strong>{formData.name}</strong>. Votre dossier est en cours de révision. Vous recevrez un email dès que votre accès sera activé.
                </p>
                <Link to="/">
                  <Button className="rounded-full px-12 py-6 text-lg font-bold tracking-wide">
                    Retour à l'accueil
                  </Button>
                </Link>
              </motion.div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

