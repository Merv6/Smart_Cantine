import React from 'react';
import { motion } from 'motion/react';
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
  X
} from 'lucide-react';
import { Button, Input } from '../ui';

export default function CookDash({ isValidated }: { isValidated: boolean }) {
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  
  // Form State
  const [studentsCount, setStudentsCount] = React.useState('');
  const [meal, setMeal] = React.useState('Riz sauce arachide');
  const [customMeal, setCustomMeal] = React.useState('');
  
  const [photos, setPhotos] = React.useState<(string | null)[]>([null, null]);
  const [ingredients, setIngredients] = React.useState([
    { name: 'Riz', qty: 12, unit: 'kg' },
    { name: 'Maïs', qty: 0, unit: 'kg' },
    { name: 'Haricot', qty: 5, unit: 'kg' },
    { name: 'Huile', qty: 2, unit: 'L' },
  ]);
  const [newIngredient, setNewIngredient] = React.useState({ name: '', qty: 0, unit: 'kg' });
  const [showAddIngredient, setShowAddIngredient] = React.useState(false);
  
  const [weekProgress, setWeekProgress] = React.useState([true, true, false, false, false]); // Mon-Tue completed

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
    setIsLoading(true);
    // Simuler l'envoi
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mettre à jour la progression
    const today = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    const progressIndex = today === 0 ? 4 : Math.min(today - 1, 4); // Map Mon-Fri
    
    const newProgress = [...weekProgress];
    if (progressIndex >= 0 && progressIndex <= 4) {
      newProgress[progressIndex] = true;
    }
    setWeekProgress(newProgress);
    
    setIsLoading(false);
    setIsSuccess(true);
    
    // Réinitialisation après 3 secondes ou au clic
    setTimeout(() => {
      resetForm();
    }, 5000);
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

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Espace Cuisinier</h1>
          <p className="text-slate-500">Service du jour • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-3">
          <Clock className="text-brand-orange" size={18} />
          <span className="text-sm font-bold text-slate-700">
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Daily Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
            <div className="bg-brand-green p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UtensilsCrossed />
                <h3 className="text-lg font-bold">Rapport Journalier</h3>
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
                  <p className="text-slate-500 max-w-md mx-auto mb-8">
                    Merci pour votre dévouement. Les données ont été synchronisées avec la direction départementale.
                  </p>
                  <Button onClick={resetForm} variant="outline" className="rounded-xl">
                    Nouveau rapport
                  </Button>
                </motion.div>
              ) : (
                <>
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <h4 className="font-display font-bold text-xl text-slate-800">1. Présence et Menu</h4>
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
                          <label className="text-xs font-semibold text-slate-700 ml-1">Repas préparé</label>
                          <select 
                            value={meal}
                            onChange={(e) => setMeal(e.target.value)}
                            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none"
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
                        className={`w-full rounded-xl py-6 ${!isValidated ? 'bg-slate-300 text-white cursor-not-allowed shadow-none' : ''}`}
                      >
                        Suivant <ArrowRight className="ml-2" size={18} />
                      </Button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-bold text-xl text-slate-800">2. Ingrédients utilisés</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowAddIngredient(true)}
                          className="text-xs rounded-xl"
                        >
                          <Plus size={14} className="mr-1" /> Ajouter
                        </Button>
                      </div>
                      
                      {showAddIngredient && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-slate-100 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3"
                        >
                          <Input 
                            placeholder="Nom de l'ingrédient" 
                            value={newIngredient.name}
                            onChange={e => setNewIngredient({...newIngredient, name: e.target.value})}
                          />
                          <div className="flex gap-2">
                            <Input 
                              type="number" 
                              placeholder="Qté" 
                              value={newIngredient.qty || ''}
                              onChange={e => setNewIngredient({...newIngredient, qty: Number(e.target.value)})}
                            />
                            <select 
                              className="h-11 rounded-xl border border-slate-200 bg-white px-2 text-xs"
                              value={newIngredient.unit}
                              onChange={e => setNewIngredient({...newIngredient, unit: e.target.value as any})}
                            >
                              <option value="kg">kg</option>
                              <option value="L">L</option>
                              <option value="Sacs">Sacs</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <Button className="flex-1 rounded-xl" onClick={addIngredient}>Valider</Button>
                            <Button variant="ghost" className="rounded-xl" onClick={() => setShowAddIngredient(false)}>Annuler</Button>
                          </div>
                        </motion.div>
                      )}

                      <p className="text-xs text-slate-400 mb-4 font-medium uppercase tracking-wider">Sélectionnez les quantités précises pour la mise à jour automatique des stocks</p>
                      <div className="space-y-4">
                         {ingredients.map((item, i) => (
                           <div key={i} className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                             <div className="flex-1 font-bold text-slate-700">{item.name}</div>
                             <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-brand-green outline-none focus:ring-2 focus:ring-brand-green/30"
                                  defaultValue={item.qty}
                                />
                                <span className="text-xs font-bold text-slate-400 uppercase">{item.unit}</span>
                                <button onClick={() => removeIngredient(i)} className="p-1 text-slate-300 hover:text-red-500 ml-2">
                                  <Trash2 size={16} />
                                </button>
                             </div>
                           </div>
                         ))}
                      </div>
                      <div className="flex gap-4 pt-4">
                        <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl">Retour</Button>
                        <Button onClick={() => setStep(3)} className="flex-[2] rounded-xl">Suivant</Button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <h4 className="font-display font-bold text-xl text-slate-800">3. Preuve visuelle (2 photos requises)</h4>
                      <p className="text-xs text-slate-400 mb-4 font-medium uppercase tracking-wider">Sélectionnez les photos du repas servi et des élèves</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {photos.map((p, idx) => (
                          <div key={idx} className="relative">
                            {!p ? (
                              <div 
                                onClick={() => document.getElementById(`photo-upload-${idx}`)?.click()}
                                className="h-48 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 text-center flex flex-col items-center justify-center group hover:border-brand-green transition-colors cursor-pointer p-4"
                              >
                                <Camera className="text-slate-300 group-hover:text-brand-green mb-2" size={32} />
                                <p className="text-slate-600 font-bold text-sm">Charger Photo {idx + 1}</p>
                                <input 
                                  type="file" 
                                  id={`photo-upload-${idx}`} 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => handlePhotoUpload(idx, e)}
                                />
                              </div>
                            ) : (
                              <div className="relative group">
                                <img src={p} className="w-full h-48 object-cover rounded-3xl border-4 border-brand-green/20" />
                                <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <button className="bg-red-500 text-white p-2 rounded-full" onClick={() => {
                                     const nextPhotos = [...photos];
                                     nextPhotos[idx] = null;
                                     setPhotos(nextPhotos);
                                   }}>
                                     <X size={16} />
                                   </button>
                                </div>
                                <div className="absolute bottom-2 left-2 right-2 bg-brand-green/90 text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center justify-between shadow-lg">
                                   <span className="flex items-center gap-1"><CheckCircle size={8} /> Capturée</span>
                                   <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                                </div>
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
                          className="flex-[2] rounded-xl bg-brand-orange shadow-lg shadow-brand-orange/30 disabled:opacity-50" 
                          disabled={photos.some(p => !p)}
                        >
                           Envoyer le Rapport Final
                        </Button>
                      </div>
                      {photos.some(p => !p) && (
                        <div className="p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-600">
                          <AlertCircle size={14} className="shrink-0" />
                          <p className="text-[10px] font-bold uppercase tracking-tight">Rappel : La plateforme sera bloquée demain si les 2 photos ne sont pas envoyées.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
               <TrendingDown className="text-red-500" />
               <h3 className="text-lg font-bold">Stock Restant</h3>
             </div>
             <div className="space-y-4">
                {[
                  { name: 'Riz', qty: 450, color: 'brand-green' },
                  { name: 'Maïs', qty: 80, color: 'brand-orange' },
                  { name: 'Haricot', qty: 120, color: 'brand-green' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wide">
                       <span className="text-slate-500">{item.name}</span>
                       <span className="text-slate-800">{item.qty} kg</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.qty / 600) * 100}%` }}
                        className={`h-full ${item.qty < 100 ? 'bg-red-500' : 'bg-brand-green'}`} 
                       />
                    </div>
                  </div>
                ))}
             </div>
           </div>

           <div className="bg-brand-green/10 p-8 rounded-3xl border border-brand-green/20 space-y-4">
             <div className="flex items-center gap-3">
               <ChefHat className="text-brand-green" />
               <h3 className="text-lg font-bold text-brand-green">Aide & Recettes</h3>
             </div>
             <p className="text-xs text-slate-600 font-bold leading-relaxed">
               Besoin d'aide pour les proportions ou les instructions de préparation ?
             </p>
             <Button 
               variant="outline" 
               className="w-full rounded-xl bg-white border-brand-green/30 text-brand-green font-bold text-xs"
               onClick={() => {
                 alert('Le chatbot culinaire est prêt à vous aider ! Utilisez la bulle de chat en bas à droite.');
               }}
             >
               Consulter le Chatbot
             </Button>
           </div>

           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-lg">Progression Hebdomadaire</h3>
            <div className="grid grid-cols-5 gap-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                    weekProgress[i] ? 'bg-brand-green shadow-lg shadow-brand-green/20 scale-105' : 'bg-slate-100'
                  }`}>
                    {weekProgress[i] && <CheckCircle size={16} className="text-white" />}
                  </div>
                  <span className={`text-[10px] font-bold ${weekProgress[i] ? 'text-brand-green' : 'text-slate-400'}`}>{day}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center italic mt-2">
              Une nouvelle semaine débute chaque lundi matin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
