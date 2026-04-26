import React from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, Send, X, Bot, ChefHat, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui';

export default function Chatbot() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: "Bonjour ! Je suis l'assistant SmartCantine. Comment puis-je vous aider aujourd'hui ? Je peux vous conseiller sur la nutrition, la cuisine ou la gestion des repas." }
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            { 
              parts: [
                { text: `Tu es un assistant expert pour SmartCantine, une application de gestion de cantines scolaires au Bénin. Ton rôle est d'aider les cuisiniers et directeurs d'école. Conseils de cuisine, nutrition infantile, gestion des stocks alimentaires, recettes saines avec des produits locaux beninois (riz, maïs, haricot, niébé, igname, manioc, huile de palme). Sois amical, professionnel et encourageant. Voici la question de l'utilisateur : ${userText}` }
              ] 
            }
        ],
      });

      const botText = response.text || "Désolé, je rencontre une petite difficulté. Essayez de reformuler votre question.";
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: "Erreur de connexion avec l'IA. Vérifiez votre clé API." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-brand-orange text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 group"
      >
        <MessageSquare size={28} />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Aide & Conseils Cuisine
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-8 right-8 w-[400px] max-w-[calc(100vw-4rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-2xl z-50 flex flex-col border border-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-brand-green text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <ChefHat size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Assistant SmartCantine</h3>
                  <p className="text-[10px] text-white/70">Expert en nutrition & cuisine</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand-green text-white rounded-tr-none shadow-md' 
                      : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Posez votre question ici..."
                className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green/30"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-brand-green text-white p-2.5 rounded-xl disabled:opacity-50 hover:bg-brand-green/90 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            
            <div className="px-4 py-2 bg-slate-50 text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Sparkles size={10} /> Propulsé par Google Gemini AI
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
