import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  CheckCircle2, 
  Utensils, 
  ShieldCheck, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { Button, Input } from '../ui';
import { BENIN_LOCATIONS } from '../../constants/benin';
import { supabase } from '../../lib/supabase';

interface AccountValidationFormProps {
  onComplete: () => void;
}

export default function AccountValidationForm({ onComplete }: AccountValidationFormProps) {
  const [step, setStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({
    role: '' as string,
    name: '',
    phone: '',
    department: '',
    commune: '',
    arrondissement: '',
    school: '',
    cipNumber: '',
    document: null as File | null
  });

  const validateStep = (currentStep: number) => {
    setError('');
    if (currentStep === 0) {
      if (!formData.role) {
        setError('Veuillez sélectionner un rôle.');
        return false;
      }
    } else if (currentStep === 1) {
      if (!formData.name || !formData.phone) {
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
    setStep(prev => Math.max(0, prev - 1));
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
      // 1. Get user session firmly
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
      }
      
      const activeUser = user || (await supabase.auth.getSession()).data.session?.user;
      if (!activeUser) throw new Error("Utilisateur non identifié");

      let documentUrl = '';
      
      // 2. Upload du document si présent (Non-bloquant pour la démo)
      if (formData.document) {
        try {
          const fileExt = formData.document.name.split('.').pop();
          const fileName = `${activeUser.id}-${Date.now()}.${fileExt}`;
          const filePath = `validation-proofs/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('proofs')
            .upload(filePath, formData.document, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.warn('⚠️ Stockage non configuré (Bucket "proofs" manquant). Le document ne sera pas sauvegardé sur le cloud.');
            // On continue sans l'URL pour ne pas bloquer l'utilisateur
          } else if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('proofs')
              .getPublicUrl(filePath);
            documentUrl = publicUrl;
          }
        } catch (storageErr) {
          console.error('Erreur stockage silencieuse:', storageErr);
        }
      }

      // 3. Mise à jour ou création du profil de base
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: activeUser.id,
          full_name: formData.name,
          phone: formData.phone,
          department: formData.department,
          commune: formData.commune,
          arrondissement: formData.arrondissement,
          school: formData.role !== 'SUPER_ADMIN' ? formData.school : null,
          cip_number: formData.role === 'SUPER_ADMIN' ? formData.cipNumber : null,
          email: activeUser.email,
          is_validated: false, // On force à false pendant la demande
        }, { onConflict: 'id' });

      if (profileError) throw profileError;

      // 4. Création de la demande de validation
      const { error: requestError } = await supabase
        .from('validation_requests')
        .insert({
          user_id: activeUser.id,
          full_name: formData.name,
          role_requested: formData.role,
          school_name: formData.role !== 'SUPER_ADMIN' ? formData.school : 'Administration',
          document_url: documentUrl,
          status: 'pending'
        });

      if (requestError) throw requestError;

      // 5. Gestion de l'école (Optionnel)
      if (formData.role !== 'SUPER_ADMIN' && formData.school) {
        await supabase
          .from('schools')
          .upsert({
            name: formData.school,
            department: formData.department,
            commune: formData.commune
          }, { onConflict: 'name' });
      }

      // 6. Confirmation finale
      if (formData.document && !documentUrl) {
        console.warn("Dossier soumis sans fichier (Bucket proofs non configuré)");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Erreur validation profil:', err);
      if (err.message?.includes('Failed to fetch')) {
        setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
      } else if (err.message?.includes('Bucket not found')) {
        setError("Erreur de stockage : Le compartiment 'proofs' n'est pas créé sur Supabase.");
      } else {
        setError(err.message || "Une erreur est survenue lors de l'envoi de votre demande.");
      }
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
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 p-8 md:p-10 border border-slate-100 flex flex-col items-center">
      
      {isSubmitted ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-10 py-10"
        >
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] animate-pulse" />
            <div className="absolute inset-2 bg-emerald-100 text-emerald-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/10">
              <CheckCircle2 size={56} strokeWidth={2.5} />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-4xl font-black font-display text-slate-800 leading-tight">Soumission réussie !</h3>
            <p className="text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
              Vos informations ont été transmises avec succès. Pour garantir l'intégrité du système, veuillez patienter pour la <span className="font-bold text-slate-900 border-b-2 border-brand-green">validation sous 72h</span> par votre administration départementale.
            </p>
          </div>
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm font-bold text-slate-600 flex items-center gap-4 text-left">
             <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
               <AlertCircle className="text-brand-orange" size={20} />
             </div>
             <p>Vous recevrez une notification par email dès que votre accès sera activé par le Superviseur.</p>
          </div>
          <Button onClick={onComplete} className="w-full rounded-2xl h-14 font-black uppercase text-xs tracking-widest bg-brand-green shadow-lg shadow-brand-green/20">
            Retourner à l'accueil
          </Button>
        </motion.div>
      ) : (
        <>
          <div className="w-full mb-10">
            <div className="flex justify-between items-center mb-6">
          <button 
            type="button"
            onClick={handlePrev} 
            disabled={step === 0}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-green hover:bg-brand-green/10 transition-all disabled:opacity-0"
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
          <div className="w-10" />
        </div>
        
        <h3 className="text-2xl font-bold text-center mb-2">Configuration du compte</h3>
        <p className="text-slate-500 text-center text-sm">Étape {step + 1} sur 4</p>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-red-100 mt-4 max-w-md mx-auto"
            >
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid gap-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setFormData({...formData, role: r.id});
                    setStep(1);
                  }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:border-brand-green group ${
                    formData.role === r.id ? 'border-brand-green bg-brand-green/5' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="bg-white p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                    {r.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{r.title}</h4>
                    <p className="text-[10px] text-slate-500">{r.desc}</p>
                  </div>
                  <ChevronRight className="ml-auto text-slate-300" size={20} />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Input 
              label="Nom complet (comme sur votre pièce d'identité)" 
              placeholder="Ex: Kouassi Koffi" 
              type="text" 
              required 
              autoComplete="name"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            <Input 
              label="Numéro de téléphone mobile" 
              placeholder="01 00 00 00 00" 
              type="tel" 
              required 
              autoComplete="tel"
              inputMode="tel"
              pattern="[0-9]{10}"
              title="Veuillez entrer un numéro de téléphone valide à 10 chiffres (nouveau format Bénin)"
              value={formData.phone} 
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setFormData({...formData, phone: value});
                }
              }} 
            />
            
            {formData.role === 'SUPER_ADMIN' && (
              <Input 
                label="Numéro Personnel d'Identification (CIP)" 
                placeholder="Numéro à 12 ou 15 chiffres" 
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required 
                value={formData.cipNumber} 
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 15) {
                    setFormData({...formData, cipNumber: value});
                  }
                }} 
              />
            )}

            <Button type="button" onClick={handleNext} className="w-full rounded-2xl py-6 mt-4 font-black uppercase text-xs tracking-widest bg-brand-green">
              Continuer vers l'étape suivante <ArrowRight className="ml-2" size={16} />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Département</label>
                <select 
                  className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all focus:ring-4 focus:ring-brand-green/10 outline-none"
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value, commune: ''})}
                >
                  <option value="">Sélectionner</option>
                  {BENIN_LOCATIONS.map(loc => (
                    <option key={loc.department} value={loc.department}>{loc.department}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Commune</label>
                <select 
                  className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all focus:ring-4 focus:ring-brand-green/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  disabled={!formData.department}
                  value={formData.commune}
                  onChange={e => setFormData({...formData, commune: e.target.value})}
                >
                  <option value="">Sélectionner la commune</option>
                  {selectedDept?.communes.map(com => (
                    <option key={com} value={com}>{com}</option>
                  ))}
                </select>
              </div>
            </div>
            <Input 
              label="Arrondissement" 
              placeholder="Ex: Godomey, Akassato..." 
              required 
              type="text"
              value={formData.arrondissement} 
              onChange={e => setFormData({...formData, arrondissement: e.target.value})} 
            />
            
            {formData.role !== 'SUPER_ADMIN' && (
              <Input 
                label="Nom de l'établissement scolaire" 
                placeholder="Ex: EPP Godomey Centre (Groupe A)" 
                required 
                type="text"
                value={formData.school} 
                onChange={e => setFormData({...formData, school: e.target.value})} 
              />
            )}
            
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handlePrev} className="flex-1 rounded-2xl h-14 font-bold border-slate-200 text-slate-500">Retour</Button>
              <Button type="button" onClick={handleNext} className="flex-[2] rounded-2xl h-14 font-black uppercase text-xs tracking-widest bg-brand-green">Continuer <ChevronRight size={16} className="ml-2" /></Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div 
              onClick={() => document.getElementById('file-upload-validation')?.click()}
              className={`p-10 border-2 border-dashed rounded-3xl text-center group transition-all cursor-pointer ${
                formData.document ? 'border-brand-green bg-brand-green/5' : 'border-slate-200 bg-slate-50 hover:border-brand-green'
              }`}
            >
              <Upload className={`mx-auto mb-4 ${formData.document ? 'text-brand-green' : 'text-slate-400 group-hover:text-brand-green'}`} size={48} />
              <p className="text-slate-600 font-medium mb-1">
                {formData.document ? 'Document sélectionné' : 'Télécharger justificatif de fonction'}
              </p>
              <p className="text-xs text-slate-400">
                {formData.document ? formData.document.name : 'PDF, JPG ou PNG (Lettre de nomination, etc.)'}
              </p>
              <input 
                type="file" 
                className="hidden" 
                id="file-upload-validation" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFormData({...formData, document: e.target.files[0]});
                    setError('');
                  }
                }}
              />
            </div>
            
            <p className="text-[10px] text-slate-500 leading-relaxed text-center px-4 italic">
              Vos informations seront vérifiées par les services départementaux compétents.<br/>
              Toute fausse déclaration peut entraîner la suspension définitive de votre accès.
            </p>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handlePrev} className="flex-1 rounded-xl">Retour</Button>
              <Button 
                type="submit" 
                className="flex-[2] rounded-xl bg-brand-green" 
                isLoading={isLoading}
              >
                {isLoading ? 'Transmission...' : 'Soumettre mes informations'}
              </Button>
            </div>
          </motion.div>
        )}
      </form>
    </>
  )}
</div>
);
}
