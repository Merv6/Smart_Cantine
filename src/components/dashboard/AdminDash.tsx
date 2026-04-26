import React from 'react';
import { 
  Users, 
  School, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Package, 
  BarChart2, 
  FileText,
  Clock,
  ArrowUpRight,
  ChevronDown,
  Eye,
  Check,
  X,
  File
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui';

const data = [
  { name: 'Jan', meals: 4000 },
  { name: 'Feb', meals: 3000 },
  { name: 'Mar', meals: 2000 },
  { name: 'Apr', meals: 2780 },
  { name: 'May', meals: 1890 },
  { name: 'Jun', meals: 2390 },
];

const stockData = [
  { name: 'Riz', value: 400 },
  { name: 'Maïs', value: 300 },
  { name: 'Haricot', value: 300 },
  { name: 'Huile', value: 200 },
];

const COLORS = ['#2D6A4F', '#F59E0B', '#3B82F6', '#EF4444'];

const stockEvolutionData = [
  { name: 'Lun', stock: 1200 },
  { name: 'Mar', stock: 1100 },
  { name: 'Mer', stock: 1050 },
  { name: 'Jeu', stock: 950 },
  { name: 'Ven', stock: 1300 },
];

const deptStats = [
  { name: 'Littoral', schools: 45, pupils: 8200, meals: '120k' },
  { name: 'Atlantique', schools: 38, pupils: 7100, meals: '95k' },
  { name: 'Borgou', schools: 30, pupils: 5200, meals: '70k' },
  { name: 'Ouémé', schools: 29, pupils: 4000, meals: '55k' },
];

export default function AdminDash() {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'validations'>('overview');
  const [showNewSchoolModal, setShowNewSchoolModal] = React.useState(false);
  const [newSchool, setNewSchool] = React.useState({
    name: '',
    department: '',
    commune: '',
    arrondissement: '',
    director: ''
  });
  
  const [pendingDirectors, setPendingDirectors] = React.useState([
    { id: 1, name: "Koffi Mensah", school: "EPP Cotonou Est", dept: "Littoral", date: "24/04/2026", docs: ["Certificat.pdf", "CNI_Recto.pdf"] },
    { id: 2, name: "Sika Ayaba", school: "EPP Godomey Sud", dept: "Atlantique", date: "23/04/2026", docs: ["Nomination.pdf"] },
    { id: 3, name: "Bio Gounou", school: "EPP Kandi A", dept: "Alibori", date: "22/04/2026", docs: ["Certificat_Residence.pdf", "Diplome.pdf"] },
    { id: 4, name: "Marcelle Zoundi", school: "EPP Abomey C", dept: "Zou", date: "21/04/2026", docs: ["CNI.pdf"] },
    { id: 5, name: "Paulin Hounkpatin", school: "EPP Parakou Nord", dept: "Borgou", date: "20/04/2026", docs: ["Certificat.pdf", "Contrat.pdf"] },
  ]);

  const [pendingStocks, setPendingStocks] = React.useState([
    { id: 1, director: "Julien Dossou", school: "EPP Godomey Centre", products: "500kg Riz, 200kg Maïs", date: "Ce matin, 09:12" },
    { id: 2, director: "Léontine Agossa", school: "EPP Akpakpa B", products: "100L Huile de palme", date: "Hier, 16:45" },
    { id: 3, director: "Benoit Adjayi", school: "EPP Porto-Novo 3", products: "300kg Haricot, 50kg Sel", date: "Hier, 14:20" },
  ]);

  const stats = [
    { label: "Écoles Actives", value: "142", icon: <School className="text-brand-green" />, trend: "+4 ce mois" },
    { label: "Total Élevés", value: "24,500", icon: <Users className="text-blue-500" />, trend: "+2.5% vs mois dernier" },
    { label: "Stocks Faibles", value: "12", icon: <AlertTriangle className="text-brand-orange" />, trend: "Action requise" },
    { label: "Repas Servis (Mois)", value: "520k", icon: <CheckCircle className="text-emerald-500" />, trend: "Record atteint" },
  ];

  const approveDirector = (id: number) => {
    setPendingDirectors(prev => prev.filter(d => d.id !== id));
  };

  const approveStock = (id: number) => {
    setPendingStocks(prev => prev.filter(s => s.id !== id));
  };

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app we'd save it. Here we just close the modal.
    setShowNewSchoolModal(false);
    setNewSchool({ name: '', department: '', commune: '', arrondissement: '', director: '' });
    alert('École créée avec succès !');
  };

  return (
    <div className="space-y-8 pb-12 text-left">
      {/* New School Modal */}
      <AnimatePresence>
        {showNewSchoolModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewSchoolModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Ajouter une École</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-tight">Paramétrer un nouvel établissement</p>
                </div>
                <button 
                  onClick={() => setShowNewSchoolModal(false)}
                  className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateSchool} className="p-8 space-y-6">
                <div className="space-y-4">
                   <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Nom de l'école</label>
                    <input 
                      required
                      placeholder="Ex: EPP Cotonou Centre"
                      className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 focus:bg-white transition-all outline-none"
                      value={newSchool.name}
                      onChange={e => setNewSchool({...newSchool, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase ml-1">Département</label>
                      <input 
                        required
                        placeholder="Ex: Littoral"
                        className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none"
                        value={newSchool.department}
                        onChange={e => setNewSchool({...newSchool, department: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase ml-1">Commune</label>
                      <input 
                        required
                        placeholder="Ex: Cotonou"
                        className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none"
                        value={newSchool.commune}
                        onChange={e => setNewSchool({...newSchool, commune: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Nom du Directeur (si connu)</label>
                    <input 
                      placeholder="Ex: M. Jean Sossa"
                      className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none"
                      value={newSchool.director}
                      onChange={e => setNewSchool({...newSchool, director: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowNewSchoolModal(false)}
                    className="flex-1 rounded-2xl h-14 font-black uppercase text-xs tracking-widest"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] rounded-2xl h-14 bg-brand-green hover:bg-brand-green/90 shadow-xl shadow-brand-green/20 font-black uppercase text-xs tracking-widest"
                  >
                    Créer l'établissement
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800">Tableau de Bord Super Admin</h1>
          <p className="text-slate-500">Aperçu global de la nutrition scolaire au Bénin</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab(activeTab === 'overview' ? 'validations' : 'overview')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'validations' 
              ? 'bg-brand-orange text-white' 
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {activeTab === 'validations' ? <BarChart2 size={16} /> : <Clock size={16} />}
            {activeTab === 'validations' ? 'Voir Stats' : `Validations (${pendingDirectors.length + pendingStocks.length})`}
          </button>
          <button 
            onClick={() => setShowNewSchoolModal(true)}
            className="bg-brand-green text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-green/90 shadow-sm shadow-brand-green/20"
          >
            Nouvelle École
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl">{stat.icon}</div>
                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-500 uppercase">{stat.trend}</span>
                  </div>
                  <div className="text-2xl font-black mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400 font-bold uppercase tracking-tight">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Repas servis par mois</h3>
                  <select className="bg-slate-50 border-none rounded-lg p-2 text-xs font-bold outline-none">
                    <option>2026</option>
                    <option>2025</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                      <Tooltip 
                        cursor={{fill: '#F8FAFC'}} 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="meals" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Évolution des Stocks Globaux</h3>
                  <TrendingUp className="text-brand-green" size={18} />
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stockEvolutionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                      />
                      <Line type="monotone" dataKey="stock" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Statistiques par Département</h3>
                  <FileText className="text-slate-400" size={18} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6">Département</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Écoles</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Élèves</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">Repas (Mois)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {deptStats.map((dept, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 font-bold text-slate-800 pl-6">{dept.name}</td>
                            <td className="px-4 py-4 text-center text-sm font-bold text-slate-600">{dept.schools}</td>
                            <td className="px-4 py-4 text-center text-sm font-bold text-brand-green">{dept.pupils.toLocaleString()}</td>
                            <td className="px-4 py-4 text-right text-sm font-black text-slate-800 pr-6">{dept.meals}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Distribution Thématique</h3>
                  <Package size={18} className="text-slate-400" />
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stockData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-6">
                  {stockData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                        <span className="text-slate-600 font-bold">{item.name}</span>
                      </div>
                      <span className="font-black text-slate-800">{item.value} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="validations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Pending Validation: Directors */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <Users className="text-brand-orange" size={24} />
                  <div>
                    <h3 className="text-lg font-bold">Validation des Comptes Directeurs</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">Nouveaux dossiers à examiner</p>
                  </div>
                </div>
                <span className="bg-brand-orange/10 text-brand-orange text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  {pendingDirectors.length} demandes
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/30">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informations</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documents PDF</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pendingDirectors.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                              {row.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-black text-slate-800">{row.name}</div>
                              <div className="text-xs text-slate-400 font-bold">{row.school} • {row.dept}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-wrap gap-2">
                             {row.docs.map((doc, idx) => (
                               <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-brand-green/10 hover:text-brand-green cursor-pointer transition-colors border border-slate-200/50">
                                 <FileText size={12} /> {doc}
                               </div>
                             ))}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="text-xs font-bold text-slate-500">{row.date}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => approveDirector(row.id)}
                              className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            >
                              <Check size={20} />
                            </button>
                            <button className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                              <X size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingDirectors.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                              <CheckCircle size={32} className="text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold text-sm">Tous les dossiers sont validés</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Validation: Stocks */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-3">
                  <Package className="text-brand-green" size={24} />
                  <div>
                    <h3 className="text-lg font-bold">Validation des Arrivages de Stocks</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">Réceptions déclarées par les directeurs</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-brand-green text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  {pendingStocks.length} réceptions
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/30">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">École / Directeur</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Détails des Vivres</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Heure Déclarée</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pendingStocks.map((stock) => (
                      <tr key={stock.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="font-black text-slate-800">{stock.school}</div>
                          <div className="text-xs text-slate-400 font-bold">Dir. {stock.director}</div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="text-sm font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl inline-block">
                             {stock.products}
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                             <Clock size={12} /> {stock.date}
                           </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex gap-2">
                             <Button onClick={() => approveStock(stock.id)} size="sm" className="bg-brand-green rounded-xl text-[10px] font-bold px-4 h-9">Approuver</Button>
                             <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 rounded-xl text-[10px] font-bold px-4 h-9">Rejeter</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingStocks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                              <CheckCircle size={32} className="text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold text-sm">Tous les stocks sont à jour</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
