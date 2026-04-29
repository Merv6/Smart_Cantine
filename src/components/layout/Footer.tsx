import { Link } from 'react-router-dom';
import { Heart, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1.5 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-white p-1 unit rounded-md">
                 <span className="text-brand-green font-bold text-lg leading-none">SC</span>
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Smart<span className="text-brand-green">Cantine</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Assurer une gestion transparente des vivres scolaires pour garantir qu'aucun enfant ne soit privé d'éducation à cause de la faim.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="hover:text-brand-green transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-brand-green transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-brand-green transition-colors"><Instagram size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-6">Plateforme</h4>
            <ul className="flex flex-col gap-4">
              <li><Link to="/login" className="text-sm hover:text-white transition-colors">Connexion</Link></li>
              <li><Link to="/register" className="text-sm hover:text-white transition-colors">Inscription Directeur</Link></li>
              <li><a href="#impact" className="text-sm hover:text-white transition-colors">Notre Impact</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-6">Légal</h4>
            <ul className="flex flex-col gap-4">
              <li><a href="#" className="text-sm hover:text-white transition-colors">Conditions d'Utilisation</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Confidentialité</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Gestion des données</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-6">Contact</h4>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-brand-green shrink-0 mt-1" size={18} />
                <span className="text-sm">Porto-Novo, Benin</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-brand-green shrink-0" size={18} />
                <span className="text-sm">+229 21 00 00 00</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-brand-green shrink-0" size={18} />
                <span className="text-sm">contact@smartcantine.bj</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} SmartCantine (SC). Tous droits réservés.
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            Fait avec <Heart size={12} className="text-brand-orange inline" fill="currentColor" /> pour les enfants du Bénin.
          </p>
        </div>
      </div>
    </footer>
  );
}
