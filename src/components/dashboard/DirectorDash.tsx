import React from 'react';
import { 
  Package, 
  Plus, 
  History, 
  AlertCircle, 
  ChefHat, 
  PieChart as PieIcon,
  ChevronRight,
  TrendingDown,
  Clock,
  CheckCircle,
  FileText,
  ArrowLeft,
  X,
  Loader2,
  Trash2,
  Camera,
  Users
} from 'lucide-react';
import { Button, Input } from '../ui';
import { motion, AnimatePresence } from 'motion/react';

export default function DirectorDash() {
  const [view, setView] = React.useState<'overview' | 'inventory' | 'canteen' | 'settings' | 'register' | 'register_cook' | 'validate_meals'>('overview');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const [dailyValidation, setDailyValidation] = React.useState({
    studentsCount: '420',
    meal: 'Riz sauce arachide',
    timestamp: '12:45',
    photos: [
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=300&h=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1599481238505-b8b0537a3f77?q=80&w=300&h=200&auto=format&fit=crop'
    ],
    isValidated: false
  });

  const [formData, setFormData] = React.useState({
    products: [{ item: 'Riz', quantity: '', unit: 'kg', customItem: '' }],
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    provider: ''
  });

  const [cookData, setCookData] = React.useState({
    name: '',
    phone: '',
    email: '',
    photo: null as File | null
  });

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { item: 'Riz', quantity: '', unit: 'kg', customItem: '' }]
    });
  };

  const removeProductRow = (index: number) => {
    setFormData({
      ...formData,
      products: formData.products.filter((_, i) => i !== index)
    });
  };

  const updateProduct = (index: number, field: string, value: string) => {
    const newProducts = [...formData.products];
    (newProducts[index] as any)[field] = value;
    setFormData({ ...formData, products: newProducts });
  };

  const inventory = [
    { name: 'Riz', quantity: 450, unit: 'kg', status: 'optimal' },
    { name: 'Maïs', quantity: 80, unit: 'kg', status: 'low' },
    { name: 'Haricot', quantity: 120, unit: 'kg', status: 'warning' },
    { name: 'Huile', quantity: 45, unit: 'L', status: 'optimal' },
    { name: 'Pâtes', quantity: 200, unit: 'kg', status: 'optimal' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simuler l'envoi vers l'admin
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsPending(true);
  };

  const handleCookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      setView('overview');
      setIsSuccess(false);
    }, 3000);
  };

  const handleValidation = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDailyValidation({ ...dailyValidation, isValidated: true });
    setIsSubmitting(false);
    alert('Repas validé avec succès !');
    setView('overview');
  };

  const resetForm = () => {
    setView('overview');
    setIsPending(false);
    setFormData({
      products: [{ item: 'Riz', quantity: '', unit: 'kg', customItem: '' }],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      provider: ''
    });
  };

  if (view === 'register') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('overview')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="text-slate-600" />
          </button>
          <h1 className="text-3xl font-display font-bold">Réception de Vivres</h1>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            {isPending ? (
              <motion.div 
                key="pending"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-12 text-center flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                  <Clock className="text-amber-500 animate-pulse" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Demande en attente</h3>
                <p className="text-slate-500 mb-8 max-w-md">
                  Votre enregistrement pour <span className="font-bold text-slate-800">{formData.products.length} produit(s)</span> a été envoyé. 
                  L'administrateur doit approuver cette réception avant qu'elle ne soit ajoutée à vos stocks.
                </p>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-8">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="h-full bg-amber-500"
                  />
                </div>
                <Button onClick={resetForm} className="w-full rounded-xl py-6">OK, j'ai compris</Button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="p-8 space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest text-left">Liste des produits</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addProductRow} className="rounded-xl">
                      <Plus size={14} className="mr-1" /> Ajouter une ligne
                    </Button>
                  </div>
                  
                  {formData.products.map((prod, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5 space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Produit</label>
                          <select 
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-brand-green/30"
                            value={prod.item}
                            onChange={e => updateProduct(idx, 'item', e.target.value)}
                          >
                            <option>Riz</option>
                            <option>Maïs</option>
                            <option>Haricot</option>
                            <option>Huile de palme</option>
                            <option>Sel iodé</option>
                            <option value="Autre">Autre (préciser...)</option>
                          </select>
                        </div>
                        <div className="md:col-span-3 space-y-1.5 text-left">
                           <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Quantité</label>
                           <Input 
                            type="number" 
                            placeholder="0" 
                            required
                            value={prod.quantity}
                            onChange={e => updateProduct(idx, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1.5 text-left">
                           <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Unité</label>
                           <select 
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-brand-green/30"
                            value={prod.unit}
                            onChange={e => updateProduct(idx, 'unit', e.target.value)}
                          >
                            <option>kg</option>
                            <option>L</option>
                            <option>Sacs</option>
                            <option>Bidons</option>
                          </select>
                        </div>
                        <div className="md:col-span-1 flex justify-center">
                          {formData.products.length > 1 && (
                            <button type="button" onClick={() => removeProductRow(idx)} className="p-2 text-slate-300 hover:text-red-500">
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {prod.item === 'Autre' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                          <Input 
                            label="Préciser le produit" 
                            placeholder="Ex: Sucre, Lait..." 
                            value={prod.customItem}
                            onChange={e => updateProduct(idx, 'customItem', e.target.value)}
                          />
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <Input 
                    label="Heure de réception" 
                    type="time" 
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                  <Input 
                    label="Origine / Fournisseur" 
                    placeholder="Ex: PAM, Gouvernement..." 
                    required
                    value={formData.provider}
                    onChange={e => setFormData({...formData, provider: e.target.value})}
                  />
                </div>

                <div className="p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10 flex gap-3 text-xs text-slate-600">
                  <AlertCircle size={18} className="text-brand-green shrink-0" />
                  <p className="italic">Les stocks seront mis à jour après validation par l'administrateur départemental.</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" type="button" onClick={() => setView('overview')} className="flex-1 rounded-xl">Annuler</Button>
                  <Button isLoading={isSubmitting} type="submit" className="flex-[2] rounded-xl bg-brand-green">Soumettre la Liste</Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (view === 'register_cook') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('overview')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="text-slate-600" />
          </button>
          <h1 className="text-3xl font-display font-bold">Inscrire un Cuisinier</h1>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-8">
          {isSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="bg-brand-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-brand-green" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Inscription Réussie !</h3>
              <p className="text-slate-500">Le cuisinier a été ajouté à votre établissement.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleCookSubmit} className="space-y-6">
              <div className="flex flex-col items-center mb-8">
                <div 
                  onClick={() => document.getElementById('photo-cook')?.click()}
                  className="w-32 h-32 rounded-full bg-slate-50 border-4 border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:border-brand-green transition-colors overflow-hidden"
                >
                  {cookData.photo ? (
                    <img src={URL.createObjectURL(cookData.photo)} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="text-slate-300" size={32} />
                      <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Photo</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    id="photo-cook" 
                    className="hidden" 
                    accept="image/*"
                    onChange={e => e.target.files && setCookData({...cookData, photo: e.target.files[0]})} 
                  />
                </div>
              </div>

              <Input 
                label="Nom complet du cuisinier" 
                placeholder="Ex: Marie HOUNDETON" 
                required
                value={cookData.name}
                onChange={e => setCookData({...cookData, name: e.target.value})}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <Input 
                  label="Numéro de téléphone" 
                  placeholder="+229 00 00 00 00" 
                  required
                  value={cookData.phone}
                  onChange={e => setCookData({...cookData, phone: e.target.value})}
                />
                <Input 
                  label="Email (optionnel)" 
                  type="email" 
                  placeholder="cook@ecole.bj"
                  value={cookData.email}
                  onChange={e => setCookData({...cookData, email: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" type="button" onClick={() => setView('overview')} className="flex-1 rounded-xl">Annuler</Button>
                <Button isLoading={isSubmitting} type="submit" className="flex-[2] rounded-xl bg-brand-green">Valider l'Inscription</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-800">Gestion de l'École</h1>
            <p className="text-slate-500">EPP Godomey Centre • Atlantique</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => setView('register')} variant="secondary" className="rounded-xl font-bold flex items-center gap-2">
              <Plus size={18} /> Enregistrer des Vivres
            </Button>
            <Button onClick={() => setView('register_cook')} variant="outline" className="rounded-xl border-slate-300 text-slate-700 font-bold flex items-center gap-2 hover:bg-slate-50">
              <Users size={18} /> Inscrire un Cuisinier
            </Button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-100">
          {[
            { id: 'overview', label: "Vue d'ensemble", icon: <PieIcon size={16} /> },
            { id: 'validate_meals', label: "Validation Repas", icon: <CheckCircle size={16} /> },
            { id: 'inventory', label: "Gestion des stocks", icon: <Package size={16} /> },
            { id: 'canteen', label: "Ma Cantine", icon: <ChefHat size={16} /> },
            { id: 'settings', label: "Paramètres", icon: <History size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                view === tab.id 
                ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'overview' && (
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-8 space-y-8">
                {!dailyValidation.isValidated && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-brand-orange/10 border border-brand-orange/20 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-orange/20">
                        <Camera size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase">Validation Requise</h4>
                        <p className="text-xs text-slate-500 font-bold">Le cuisinier a envoyé les photos du repas de ce midi.</p>
                      </div>
                    </div>
                    <Button onClick={() => setView('validate_meals')} size="sm" className="bg-brand-orange rounded-xl font-bold px-6">Vérifier maintenant</Button>
                  </motion.div>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="text-slate-400 font-bold text-[10px] uppercase mb-2">Repas servis (Mois)</div>
                    <div className="text-2xl font-black text-slate-800">12,450</div>
                    <div className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
                      <TrendingDown size={14} className="rotate-180" /> +12% vs mois dernier
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="text-slate-400 font-bold text-[10px] uppercase mb-2">Valeur du Stock</div>
                    <div className="text-2xl font-black text-slate-800">842,000 FCFA</div>
                    <div className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">Mise à jour aujourd'hui</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="text-slate-400 font-bold text-[10px] uppercase mb-2">Alertes critiques</div>
                    <div className="text-2xl font-black text-brand-orange">02</div>
                    <div className="text-xs text-brand-orange font-bold mt-1 uppercase">Action requise</div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="text-brand-green" />
                      <h3 className="text-lg">Aperçu de l'Inventaire</h3>
                    </div>
                    <Button onClick={() => setView('inventory')} variant="ghost" size="sm" className="text-brand-green font-bold text-xs uppercase tracking-wider">Gérer le stock</Button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {inventory.slice(0, 3).map((item, i) => (
                      <div key={i} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setView('inventory')}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            item.status === 'optimal' ? 'bg-emerald-50 text-emerald-600' : 
                            item.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {item.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-[10px] font-bold uppercase text-slate-400">Dernier arrivé: il y a 3 jours</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-slate-800">{item.quantity} {item.unit}</div>
                          <div className={`text-[10px] font-bold uppercase ${
                            item.status === 'optimal' ? 'text-emerald-500' : 'text-brand-orange'
                          }`}>
                             {item.status === 'optimal' ? 'Stable' : 'Faible'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cooks Section */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <ChefHat className="text-brand-orange" />
                      <h3 className="text-lg font-bold">Équipe de Cuisine</h3>
                    </div>
                    <Button onClick={() => setView('canteen')} variant="ghost" size="sm" className="text-brand-orange font-bold text-xs uppercase tracking-wider">Voir tout</Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { name: "Adama Traoré", role: "Chef Cuisinière", status: "Présente" },
                      { name: "Mariam Bello", role: "Assistante", status: "Présente" },
                    ].map((cook, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-400">
                            {cook.name[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{cook.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{cook.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          {cook.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-brand-green/5 p-8 rounded-3xl border border-brand-green/10">
                   <h3 className="text-lg text-brand-green font-bold mb-6">Alertes de Stock</h3>
                   <div className="space-y-4">
                      <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-red-500 text-xs font-black uppercase">
                          <AlertCircle size={14} /> Stock Critique
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-bold">Le stock de Maïs (80kg) ne permet de tenir que 2 jours supplémentaires.</p>
                        <Button className="w-full text-[10px] py-3 rounded-lg" size="sm" variant="secondary">Commander Maintenant</Button>
                      </div>
                   </div>
                </div>

                {/* Notifications & Recent Activity */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Messages & Notifications</h3>
                    <div className="w-5 h-5 bg-brand-orange text-white rounded-full flex items-center justify-center text-[10px] font-black">1</div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                        <CheckCircle className="text-emerald-500" size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">Stock Approuvé</div>
                        <p className="text-xs text-slate-600 mt-1">Le Super Admin a validé votre réception de 500kg de Riz. Vos stocks ont été mis à jour.</p>
                        <div className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Il y a 15 minutes</div>
                      </div>
                    </div>

                    {[
                      { title: "Rapport journalier validé", time: "Il y a 10 min", icon: <CheckCircle className="text-emerald-500" size={16} /> },
                      { title: "Alerte: Stock bas (Maïs)", time: "Hier, 17:30", icon: <AlertCircle className="text-brand-orange" size={16} /> },
                    ].map((act, i) => (
                      <div key={i} className="flex gap-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                          {act.icon}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{act.title}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{act.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full rounded-xl">Voir tout</Button>
                </div>
              </div>
            </div>
          )}

          {view === 'validate_meals' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 text-left">
               <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                  <div className="bg-brand-green p-8 text-white flex items-center justify-between">
                     <div>
                        <h3 className="text-xl font-black uppercase">Validation du Service</h3>
                        <p className="text-xs opacity-80 font-bold tracking-tight">Vérification des preuves quotidiennes</p>
                     </div>
                     <CheckCircle size={32} className="opacity-40" />
                  </div>
                  
                  <div className="p-8 space-y-8">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Élèves Déclarés</div>
                        <div className="text-2xl font-black text-slate-800 flex items-center gap-2">
                           <Users size={20} className="text-brand-green" />
                           {dailyValidation.studentsCount}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Repas Servis</div>
                        <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <ChefHat size={20} className="text-brand-orange" />
                           {dailyValidation.meal}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Heure d'envoi</div>
                        <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <Clock size={20} className="text-blue-500" />
                           {dailyValidation.timestamp}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase pl-1">Preuves Photos</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {dailyValidation.photos.map((photo, i) => (
                           <motion.div 
                            key={i} 
                            whileHover={{ scale: 1.02 }}
                            className="aspect-video rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50"
                           >
                             <img src={photo} className="w-full h-full object-cover" alt="Preuve repas" />
                           </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                      <Button 
                        variant="ghost" 
                        className="flex-1 rounded-2xl h-14 font-black uppercase text-xs tracking-widest text-red-500 hover:bg-red-50"
                        onClick={() => {
                          alert('Demande de modification envoyée au cuisinier.');
                          setView('overview');
                        }}
                      >
                         Signaler erreur
                      </Button>
                      <Button 
                        isLoading={isSubmitting}
                        onClick={handleValidation}
                        className="flex-[2] rounded-2xl h-14 bg-brand-green hover:bg-brand-green/90 shadow-xl shadow-brand-green/20 font-black uppercase text-xs tracking-widest"
                      >
                         Valider le rapport <CheckCircle className="ml-2" size={18} />
                      </Button>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'inventory' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Gestion Détaillée des Stocks</h3>
                    <p className="text-sm text-slate-500">Mise à jour en temps réel selon les rapports des cuisiniers.</p>
                  </div>
                  <Button onClick={() => setView('register')} size="sm" className="hidden md:flex rounded-xl font-bold gap-2">
                    <Plus size={16} /> Nouvel Arrivage
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantité</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unité</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">État</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {inventory.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="font-bold text-slate-800">{item.name}</div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-lg font-black text-slate-800">{item.quantity}</div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-xs font-bold text-slate-400 uppercase">{item.unit}</div>
                          </td>
                          <td className="px-8 py-5">
                            <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              item.status === 'optimal' ? 'bg-emerald-100 text-emerald-600' : 
                              item.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {item.status}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <button className="text-slate-400 hover:text-brand-green font-bold text-xs uppercase tracking-tighter">Détails</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {view === 'canteen' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-xl font-bold">Informations de l'Établissement</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nom de l'école</div>
                      <div className="font-bold text-slate-800">EPP Godomey Centre (Groupe A)</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Effectif Total</div>
                      <div className="font-bold text-slate-800">452 Élèves inscrits</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Directeur Responsable</div>
                      <div className="font-bold text-slate-800">M. Julien DOSSOU</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl font-bold">Modifier les informations</Button>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Personnel de Cuisine</h3>
                    <Button onClick={() => setView('register_cook')} size="sm" variant="ghost" className="text-brand-green font-bold text-xs">+ Ajouter</Button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: "Adama Traoré", phone: "97 00 11 22", email: "adama@cook.bj" },
                      { name: "Mariam Bello", phone: "98 10 20 30", email: "mariam@cook.bj" },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-300">
                            {c.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{c.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{c.phone}</div>
                          </div>
                        </div>
                        <button className="text-slate-300 hover:text-brand-orange"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                 <h3 className="text-xl font-bold">Paramètres du Compte</h3>
                 
                 <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Sécurité</h4>
                      <Button variant="outline" className="w-full rounded-xl justify-between h-14 px-6 border-slate-200">
                        Modifier le mot de passe <ChevronRight size={18} className="text-slate-300" />
                      </Button>
                      <Button variant="outline" className="w-full rounded-xl justify-between h-14 px-6 border-slate-200">
                        Identification (Biométrie/PIN) <ChevronRight size={18} className="text-slate-300" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Préférences</h4>
                      <div className="flex items-center justify-between p-6 border border-slate-100 rounded-2xl">
                         <div className="text-sm font-bold text-slate-700">Notifications Push (Alertes Stock)</div>
                         <div className="w-11 h-6 bg-brand-green rounded-full relative">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                         </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 space-y-4">
                      <Button variant="danger" className="w-full rounded-xl font-bold h-14">Déconnexion</Button>
                      <p className="text-[10px] text-center text-slate-400 font-medium">Application version 1.0.4 • © 2024 Cantine-Connect</p>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
