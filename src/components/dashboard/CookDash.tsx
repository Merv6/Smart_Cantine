import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  ChefHat, 
  Users, 
  UtensilsCrossed, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Plus,
  Trash2,
  X,
  User
} from 'lucide-react';
import { Button, Input } from '../ui';
import { toast } from 'sonner';

import { supabase } from '../../lib/supabase';

export default function CookDash({ 
  isValidated, 
  user: initialUser, 
  profile: initialProfile,
  view = 'overview'
}: { 
  isValidated: boolean, 
  user?: any, 
  profile?: any,
  view?: string
}) {
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [schoolId, setSchoolId] = React.useState<string | null>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [realInventory, setRealInventory] = React.useState<any[]>([]);
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userProfile?.full_name
        })
        .eq('id', initialUser?.id || userProfile?.id);
      
      if (error) throw error;
      toast.success('Profil mis à jour avec succès !');
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  React.useEffect(() => {
    async function getProfile() {
      const activeUser = initialUser || (await supabase.auth.getUser()).data.user;
      if (!activeUser) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', activeUser.id).single();

      if (profile) {
        setUserProfile(profile);
        setSchoolId(profile.school_id);
        
        if (profile.school_id) {
          const [invRes, reportsRes] = await Promise.all([
            supabase.from('inventory').select('*').eq('school_id', profile.school_id),
            supabase.from('meal_reports')
              .select('*')
              .eq('school_id', profile.school_id)
              .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
          ]);

          if (invRes.data) setRealInventory(invRes.data);
          
          if (reportsRes.data) {
            // Process week progress
            const progress = [false, false, false, false, false];
            const recent = reportsRes.data.filter(r => new Date(r.created_at) > new Date(new Date().setDate(new Date().getDate() - 7)));
            recent.forEach(r => {
              const d = new Date(r.created_at);
              const day = d.getDay(); 
              if (day >= 1 && day <= 5) {
                progress[day - 1] = true;
              }
            });
            setWeekProgress(progress);

            // Process stats
            const totalStudents = reportsRes.data.reduce((acc: number, curr: any) => acc + (curr.students_count || 0), 0);
            const avg = reportsRes.data.length > 0 ? Math.round(totalStudents / reportsRes.data.length) : 0;
            
            // Service rate: actual reports / potential working days in last 30 days (approx 22)
            const rate = Math.min(100, Math.round((reportsRes.data.length / 22) * 100));
            
            setStats({ avgStudents: avg, serviceRate: rate });
          }
        }
      }
    }
    getProfile();
  }, [initialUser, initialProfile, isValidated]);
  
  // Form State
  const [studentsCount, setStudentsCount] = React.useState('');
  const [meal, setMeal] = React.useState('Riz sauce arachide');
  const [customMeal, setCustomMeal] = React.useState('');
  
  const [photos, setPhotos] = React.useState<(string | null)[]>([null, null]);
  const [ingredients, setIngredients] = React.useState<any[]>([]);
  const [newIngredient, setNewIngredient] = React.useState({ name: '', qty: 0, unit: 'kg' });
  const [showAddIngredient, setShowAddIngredient] = React.useState(false);

  React.useEffect(() => {
    if (realInventory.length > 0 && ingredients.length === 0) {
      // Pré-remplir avec les stocks existants les plus communs
      const common = realInventory.filter(item => ['Riz', 'Maïs', 'Haricot', 'Huile'].includes(item.item_name));
      setIngredients(common.map(item => ({ name: item.item_name, qty: 0, unit: item.unit || 'kg' })));
    }
  }, [realInventory]);
  
  const [weekProgress, setWeekProgress] = React.useState([false, false, false, false, false]); // Mon-Fri status
  const [stats, setStats] = React.useState({ avgStudents: 0, serviceRate: 0 });

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotos = [...photos];
        newPhotos[index] = reader.result as string;
        setPhotos(newPhotos);
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => {
    if (newIngredient.name.trim()) {
      setIngredients([...ingredients, { ...newIngredient }]);
      setNewIngredient({ name: '', qty: 0, unit: 'kg' });
      setShowAddIngredient(false);
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmitReport = async () => {
    if (!schoolId) {
      toast.error('Erreur: Vous n\'êtes rattaché à aucun établissement. Veuillez contacter votre directeur.');
      return;
    }
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('meal_reports')
        .insert({
          school_id: schoolId,
          cook_id: user.id,
          meal_description: meal === 'Autre' ? customMeal : meal,
          students_count: parseInt(studentsCount),
          photos: photos.filter(p => p !== null) as string[]
        });

      if (error) throw error;
      
      // Update inventory (decrement quantities)
      const invPromises = ingredients.map(item => {
        const existing = realInventory.find(ri => ri.item_name === item.name);
        if (existing) {
          return supabase
            .from('inventory')
            .update({ quantity: Math.max(0, Number(existing.quantity) - item.qty) })
            .eq('id', existing.id);
        }
        return Promise.resolve();
      });
      await Promise.all(invPromises);

      // Mettre à jour la progression
      const today = new Date().getDay(); 
      const progressIndex = today === 0 ? 4 : Math.min(today - 1, 4);
      
      const newProgress = [...weekProgress];
      if (progressIndex >= 0 && progressIndex <= 4) {
        newProgress[progressIndex] = true;
      }
      setWeekProgress(newProgress);
      
      setIsLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        resetForm();
      }, 5000);
    } catch (err) {
      console.error('Erreur rapport repas:', err);
      toast.error('Erreur lors de l\'envoi du rapport.');
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setPhotos([null, null]);
    setStudentsCount('');
    setMeal('Riz sauce arachide');
    setCustomMeal('');
    setIsSuccess(false);
  };

  const isStep1Valid = studentsCount !== '' && (meal !== 'Autre' || customMeal.trim() !== '');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 18) return 'Bonjour';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            {getGreeting()}, {userProfile?.full_name || 'cher utilisateur'}
          </h1>
          <p className="text-slate-500 font-medium">
            {view === 'overview' && 'Tableau de Bord'}
            {view === 'rapport' && 'Rapport Journalier'}
            {view === 'inventory' && 'Gestion des Stocks'}
            {view === 'profile' && 'Mon Profil'}
            {view === 'settings' && 'Paramètres'} • {schoolId ? 'Cantine Scolaire' : 'En attente de rattachement école'}
          </p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
          <Clock className="text-brand-orange" size={18} />
          <span className="text-sm font-bold text-slate-700">
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Effectif Moyen</p>
                    <p className="text-2xl font-black text-slate-800">{stats.avgStudents} <span className="text-sm font-medium text-slate-400">élèves</span></p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Taux de Service</p>
                    <p className="text-2xl font-black text-slate-800">{stats.serviceRate}%</p>
                  </div>
                </div>
              </div>

              {/* Weekly Status */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Progression Hebdomadaire</h3>
                  <span className="text-xs font-black text-brand-green bg-brand-green/10 px-3 py-1 rounded-full uppercase tracking-widest">Semaine en cours</span>
                </div>
                <div className="grid grid-cols-5 gap-4 md:gap-6">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${
                        weekProgress[i] ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20 scale-105' : 'bg-slate-50 text-slate-200'
                      }`}>
                        {weekProgress[i] ? <CheckCircle size={24} /> : <Clock size={24} />}
                      </div>
                      <span className={`text-[10px] md:text-sm font-bold ${weekProgress[i] ? 'text-brand-green' : 'text-slate-400'}`}>{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Quick Help */}
              <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-6">
                <ChefHat size={40} className="text-brand-green" />
                <h3 className="text-xl font-bold">Assistant Culinaire</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Besoin d'idées de recettes ou de conseils sur les quantités ? Notre assistant IA est là pour vous aider.
                </p>
                <Button className="w-full bg-brand-green text-white rounded-xl">DISCUTER AVEC L'IA</Button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'rapport' && (
          <motion.div 
            key="rapport"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="bg-brand-green p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed />
                    <h3 className="text-lg font-bold">Nouveau Rapport</h3>
                  </div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest">Étape {step} / 3</span>
                </div>
                
                <div className="p-8">
                  {isSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <div className="bg-brand-green/10 p-6 rounded-full mb-6">
                        <CheckCircle size={64} className="text-brand-green" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Rapport envoyé avec succès !</h3>
                      <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium italic">
                        Les données ont été synchronisées avec la direction.
                      </p>
                      <Button onClick={resetForm} variant="outline" className="rounded-xl">
                        Créer un autre rapport
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          <h4 className="font-bold text-xl text-slate-800">1. Présence et Menu</h4>
                          <div className="grid md:grid-cols-2 gap-6">
                            <Input 
                              label="Nombre d'élèves présents" 
                              type="number" 
                              placeholder="0" 
                              value={studentsCount}
                              onChange={(e) => setStudentsCount(e.target.value)}
                              icon={<Users className="text-slate-400" size={16} />} 
                            />
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-slate-700 ml-1 uppercase tracking-wider">Repas préparé</label>
                              <select 
                                value={meal}
                                onChange={(e) => setMeal(e.target.value)}
                                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-green/30 outline-none"
                              >
                                <option>Riz sauce arachide</option>
                                <option>Pâte de maïs et légumes</option>
                                <option>Haricot et gari</option>
                                <option>Igname pilée sauce graine</option>
                                <option>Manioc cuit et huile de palme</option>
                                <option value="Autre">Autre (préciser...)</option>
                              </select>
                            </div>
                          </div>
                          
                          {meal === 'Autre' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Input 
                                label="Nom du repas personnalisé" 
                                placeholder="Entrez le nom du plat..." 
                                value={customMeal}
                                onChange={(e) => setCustomMeal(e.target.value)}
                              />
                            </motion.div>
                          )}

                          <Button 
                            disabled={!isValidated || !isStep1Valid}
                            onClick={() => setStep(2)} 
                            className="w-full rounded-xl py-6 bg-slate-900 text-white font-black"
                          >
                            Étape Suivante <ArrowRight className="ml-2" size={18} />
                          </Button>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xl text-slate-800">2. Ingrédients utilisés</h4>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setShowAddIngredient(true)}
                              className="text-[10px] font-black uppercase tracking-widest rounded-lg"
                            >
                              <Plus size={14} className="mr-1" /> Ajouter
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                             {ingredients.map((item, i) => (
                               <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                                 <div className="flex-1 font-bold text-slate-700">{item.name}</div>
                                 <div className="flex items-center gap-2">
                                    <input 
                                      type="number" 
                                      className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-brand-green outline-none focus:ring-2 focus:ring-brand-green/30"
                                      defaultValue={item.qty}
                                    />
                                    <span className="text-[10px] font-black text-slate-400 uppercase w-8">{item.unit}</span>
                                    <button onClick={() => removeIngredient(i)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                      <Trash2 size={16} />
                                    </button>
                                 </div>
                               </div>
                             ))}
                          </div>
                          <div className="flex gap-4 pt-4">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl">Retour</Button>
                            <Button onClick={() => setStep(3)} className="flex-[2] rounded-xl bg-slate-900">Suivant</Button>
                          </div>
                        </motion.div>
                      )}

                      {step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          <h4 className="font-bold text-xl text-slate-800">3. Photos (Obligatoire)</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {photos.map((p, idx) => (
                              <div key={idx} className="relative">
                                {!p ? (
                                  <div 
                                    onClick={() => document.getElementById(`photo-upload-${idx}`)?.click()}
                                    className="h-44 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 text-center flex flex-col items-center justify-center group hover:border-brand-green transition-colors cursor-pointer"
                                  >
                                    <Camera className="text-slate-300 group-hover:text-brand-green mb-2" size={32} />
                                    <p className="text-slate-500 font-bold text-xs">Charger Photo {idx + 1}</p>
                                    <input 
                                      type="file" 
                                      id={`photo-upload-${idx}`} 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={(e) => handlePhotoUpload(idx, e)}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative group overflow-hidden rounded-3xl border-4 border-slate-50 shadow-sm">
                                    <img src={p} className="w-full h-44 object-cover" />
                                    <button className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl" onClick={() => {
                                      const nextPhotos = [...photos];
                                      nextPhotos[idx] = null;
                                      setPhotos(nextPhotos);
                                    }}>
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-4 pt-4">
                            <Button variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-xl">Retour</Button>
                            <Button 
                              onClick={handleSubmitReport}
                              isLoading={isLoading}
                              className="flex-[2] rounded-xl bg-brand-orange text-white font-black" 
                              disabled={photos.some(p => !p)}
                            >
                               VALIDER LE RAPPORT
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-brand-green/5 p-6 rounded-3xl border border-brand-green/10">
                <h4 className="text-xs font-black text-brand-green uppercase tracking-widest mb-4">Informations</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Chaque rapport envoyé décrémente automatiquement les stocks nationaux de votre école. Assurez-vous des quantités saisies.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'inventory' && (
          <motion.div 
            key="inventory"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-50">
                  <h3 className="text-xl font-bold text-slate-800">Inventaire de la Cantine</h3>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">État des stocks actuels</p>
               </div>
               <div className="p-0">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantité</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">État</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {realInventory.length > 0 ? realInventory.map((item, i) => {
                        const lowStock = Number(item.quantity) < 50;
                        return (
                          <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <span className="font-bold text-slate-700">{item.item_name}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-sm font-black text-slate-800">{item.quantity} <span className="text-slate-400 font-medium">{item.unit}</span></span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${lowStock ? 'bg-red-500 animate-pulse' : 'bg-brand-green'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${lowStock ? 'text-red-500' : 'text-brand-green'}`}>
                                  {lowStock ? 'Stock Critique' : 'En Stock'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-400 hover:text-slate-900 rounded-lg">Signaler</Button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">Aucun produit en stock</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}

        {view === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="max-w-4xl"
          >
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-brand-green to-emerald-400" />
              <div className="px-8 pb-10">
                <div className="relative -mt-12 mb-6">
                  <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl">
                    <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <User size={48} />
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nom complet</label>
                      <input 
                        type="text" 
                        value={userProfile?.full_name || ''} 
                        onChange={(e) => setUserProfile({...userProfile, full_name: e.target.value})}
                        className="w-full text-2xl font-black text-slate-800 bg-transparent border-b border-dashed border-slate-200 focus:border-brand-green outline-none"
                      />
                      <p className="text-brand-green font-black uppercase text-[10px] tracking-widest mt-1">Cuisinier Qualifié</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Établissement</p>
                          <p className="text-sm font-bold text-slate-700">{schoolId ? 'Cantine Scolaire Rattachée' : 'Non rattaché'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membre Depuis</p>
                          <p className="text-sm font-bold text-slate-700">
                            {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Date inconnue'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Statistiques de Service</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl border border-slate-100 bg-white">
                        <p className="text-2xl font-black text-brand-green">{weekProgress.filter(p => p).length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Rapports cette semaine</p>
                      </div>
                      <div className="p-4 rounded-2xl border border-slate-100 bg-white">
                        <p className="text-2xl font-black text-brand-orange">{stats.serviceRate}%</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Assiduité</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-slate-200 text-slate-600 font-bold"
                      onClick={handleUpdateProfile}
                      isLoading={isUpdatingProfile}
                    >
                      Sauvegarder les modifications
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl"
          >
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50">
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-800">Paramètres</h3>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Gérez vos préférences</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-700">Notifications Push</p>
                    <p className="text-xs text-slate-400">Recevoir des rappels pour les rapports journaliers</p>
                  </div>
                  <div className="w-12 h-6 bg-brand-green rounded-full relative cursor-pointer shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-700">Mode Sombre</p>
                    <p className="text-xs text-slate-400">Adapter l'interface pour une utilisation nocturne</p>
                  </div>
                  <div className="w-12 h-6 bg-slate-100 rounded-full relative cursor-pointer border border-slate-200">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-slate-300 rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-700">Langue de l'interface</p>
                    <p className="text-xs text-slate-400">Français (Bénin)</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-brand-green font-bold text-xs uppercase tracking-widest">Changer</Button>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 rounded-b-3xl">
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                        <AlertCircle size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 tabular-nums">Zone Sensible</p>
                        <p className="text-[10px] text-slate-400 font-medium">Réinitialisation des données</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-red-500 font-bold text-xs">Supprimer</Button>
                </div>
                <Button className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold">Enregistrer les préférences</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
