import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, TrendingUp, Users, Package, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import heroBgImage from '../assets/images/happy_african_children_1779573305156.png';

export default function Home() {
  const features = [
    {
      icon: <ShieldCheck className="text-brand-green" size={28} />,
      title: "Transparence Totale",
      description: "Évitez le détournement des vivres scolaires grâce à un suivi rigoureux et une validation administrative."
    },
    {
      icon: <TrendingUp className="text-brand-orange" size={28} />,
      title: "Impact Direct",
      description: "Luttez contre l'abandon scolaire en assurant une alimentation régulière et saine à chaque élève."
    },
    {
      icon: <Package className="text-brand-green" size={28} />,
      title: "Gestion de Stock",
      description: "Suivi automatisé des quantités reçues et consommées avec alertes de stock faible."
    }
  ];

  const stats = [
    { label: "Écoles Rurales", value: "250+" },
    { label: "Élèves Nourris", value: "45,000+" },
    { label: "Transparence", value: "100%" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[650px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBgImage}
            alt="Enfants heureux de la cantine scolaire au Bénin"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 hero-gradient" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl text-white"
          >
            <span className="inline-block bg-brand-green/90 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-6">
              SmartCantine • Impact Social
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-6">
              Garantir une alimentation scolaire <span className="text-brand-orange leading-tight">transparente</span> pour chaque enfant
            </h1>
            <p className="text-xl text-slate-100 mb-10 max-w-2xl leading-relaxed">
              SmartCantine aide les écoles rurales à mieux gérer les vivres alimentaires et à lutter contre le détournement pour assurer un avenir meilleur à nos élèves.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto rounded-full bg-brand-green">
                  Rejoindre en tant que Directeur
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full border-white text-white hover:bg-white/10">
                  Accéder à la plateforme
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-slate-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-4xl md:text-5xl font-display font-bold text-brand-green mb-1 group-hover:scale-110 transition-transform">{stat.value}</div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-24 bg-brand-light">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl mb-4">Une solution pour éradiquer la faim à l'école</h2>
            <p className="text-slate-600">Notre plateforme intègre des technologies de pointe pour assurer que chaque grain de riz arrive dans l'assiette de l'apprenant.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all"
              >
                <div className="mb-6 bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative">
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl z-0" />
              <div className="relative z-10 bg-white p-4 rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1024"
                  alt="Students eating"
                  className="rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl mb-6 leading-tight">Accompagner les écoliers dans les zones les plus reculées</h2>
              <div className="space-y-6">
                {[
                  "Élimination du gaspillage et des pertes inexpliquées.",
                  "Planification nutritionnelle assistée par IA.",
                  "Collecte de preuves visuelles quotidiennes (Photos).",
                  "Support technique 24/7 pour les cuisiniers."
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                       <CheckCircle2 className="text-brand-green" size={20} />
                    </div>
                    <p className="text-slate-700 font-medium">{item}</p>
                  </div>
                ))}
              </div>
              <Button size="lg" className="mt-10 rounded-full group">
                Découvrir notre rapport d'impact <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-brand-green text-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-8">Prêt à transformer votre cantine scolaire ?</h2>
          <p className="text-xl text-brand-light/80 mb-12 leading-relaxed">
            Rejoignez des centaines d'écoles qui font déjà confiance à SmartCantine pour nourrir l'avenir du Bénin.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link to="/register">
               <Button size="lg" className="bg-white text-brand-green hover:bg-slate-100 rounded-full px-12">
                 Créer un compte
               </Button>
             </Link>
             <a href="#contact">
               <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full px-12">
                 Nous contacter
               </Button>
             </a>
          </div>
        </div>
      </section>
    </div>
  );
}
