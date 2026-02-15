
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Language, Property, Transaction } from '../types';
import { t } from '../services/translationService';
import { generateStream as aiGenerateStream } from '../services/aiApiService';
import { getAiConsent, setAiConsent } from '../services/aiConsent';
import { AiPrivacyGate } from '../components/AiPrivacyGate';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

interface ChatAssistantProps {
  lang: Language;
  properties: Property[];
  transactions: Transaction[];
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ lang, properties, transactions }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: lang === 'en' 
        ? "Hello! I'm your Portfolio AI. I can analyze your specific properties and cash flow. Ask me anything!" 
        : "שלום! אני ה-AI של התיק שלך. אני יכול לנתח את הנכסים ותזרים המזומנים שלך. שאל אותי כל דבר!", 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAiGate, setShowAiGate] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const doSend = async (messageText: string) => {
    const userMsg: Message = { id: Date.now().toString(), text: messageText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const portfolioContext = {
      propertiesCount: properties.length,
      properties: properties.map(p => ({
        address: p.address,
        country: p.country,
        type: p.type,
        value: p.marketValue,
        currency: p.currency,
        loan: p.loanBalance,
        rent: p.lease?.monthlyRent || 0,
        partners: p.partners?.map(part => `${part.name}: ${part.percentage}%`).join(', ')
      })),
      recentTransactions: transactions.slice(0, 10).map(tx => ({
        date: tx.date,
        amount: tx.amount,
        type: tx.type,
        category: tx.category
      }))
    };

    const systemInstruction = `
You are an expert Real Estate Investment Analyst named "InvestorPro AI".
You are assisting the user in managing their portfolio.
Current Language: ${lang === 'he' ? 'Hebrew' : 'English'}.
Portfolio Data: ${JSON.stringify(portfolioContext)}.

Rules:
1. Always answer in ${lang === 'he' ? 'Hebrew' : 'English'}.
2. Be professional, concise, and data-driven.
3. If asked about ROI or performance, use the provided data to calculate rough estimates if possible.
4. If data is missing for a specific query, politely state that you don't have that information.
5. Format your responses with bullet points and clear headings where appropriate.
    `.trim();

    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMessageId, text: '', sender: 'bot' }]);
    let fullText = '';

    try {
      await aiGenerateStream({
        prompt: messageText,
        systemInstruction,
        lang,
        onChunk: (text) => {
          fullText += text;
          setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: fullText } : m));
        }
      });
    } catch (err: unknown) {
      console.error('AI Error:', err);
      const errorMsg = lang === 'en'
        ? "I'm sorry, I'm having trouble connecting to my analysis engine right now."
        : "מצטער, אני מתקשה להתחבר למנוע הניתוח שלי כרגע.";
      setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: errorMsg } : m));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isTyping) return;
    if (!getAiConsent()) {
      setPendingMessage(text);
      setShowAiGate(true);
      return;
    }
    setInput('');
    doSend(text);
  };

  const handleAcceptGate = () => {
    setAiConsent();
    setShowAiGate(false);
    if (pendingMessage) {
      doSend(pendingMessage);
      setPendingMessage(null);
    }
  };

  return (
    <div className="flex flex-col h-full pb-32 animate-fade-in bg-white">
      {showAiGate && (
        <AiPrivacyGate
          lang={lang}
          onAccept={handleAcceptGate}
          onCancel={() => { setShowAiGate(false); setPendingMessage(null); }}
        />
      )}
       <header className="flex-none p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('chat', lang)}</h1>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Active Analyst</p>
            </div>
         </div>
       </header>

       <div 
         ref={scrollRef}
         className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
       >
         {messages.map(msg => (
           <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${msg.sender === 'user' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-brand-600'}`}>
                 {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
               </div>
               <div className={`p-3 rounded-2xl shadow-sm ${
                 msg.sender === 'user' 
                   ? 'bg-brand-600 text-white rounded-tr-none' 
                   : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
               }`}>
                 <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
               </div>
             </div>
           </div>
         ))}
         {isTyping && (
           <div className="flex justify-start">
              <div className="flex gap-2 items-center text-gray-400 bg-white border border-gray-100 p-2 px-4 rounded-full shadow-sm">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs font-medium">AI is thinking...</span>
              </div>
           </div>
         )}
       </div>

       <div className="flex-none p-4 bg-white border-t border-gray-100 sticky bottom-0">
         <div className="flex items-center space-x-2 gap-2 max-w-lg mx-auto">
           <input 
             type="text" 
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleSend()}
             placeholder={lang === 'en' ? "Ask about your ROI, maintenance..." : "שאל על תשואה, תחזוקה..."}
             className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
           />
           <button 
             onClick={handleSend}
             disabled={!input.trim() || isTyping}
             className="p-3.5 bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-500/30 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
           >
             <Send size={20} />
           </button>
         </div>
         <p className="text-[10px] text-gray-400 text-center mt-3">InvestorPro AI may occasionally provide inaccurate financial estimates.</p>
       </div>
    </div>
  );
};
