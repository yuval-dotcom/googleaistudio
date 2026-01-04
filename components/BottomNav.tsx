import React from 'react';
import { Home, PieChart, Plus, FileText, MessageSquare } from 'lucide-react';
import { ViewState, Language } from '../types';
import { t } from '../services/translationService';

interface BottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView, lang }) => {
  if (currentView === ViewState.LOGIN) return null;

  const navItemClass = (view: ViewState) =>
    `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      currentView === view ? 'text-brand-600' : 'text-gray-400'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-[84px] pb-6 px-4 z-50">
      <div className="flex justify-between items-center h-full max-w-md mx-auto relative">
        
        {/* Home */}
        <button className={navItemClass(ViewState.HOME)} onClick={() => setView(ViewState.HOME)}>
          <Home size={24} strokeWidth={currentView === ViewState.HOME ? 2.5 : 2} />
          <span className="text-[10px] font-medium">{t('dashboard', lang)}</span>
        </button>

        {/* Portfolio */}
        <button className={navItemClass(ViewState.PORTFOLIO)} onClick={() => setView(ViewState.PORTFOLIO)}>
          <PieChart size={24} strokeWidth={currentView === ViewState.PORTFOLIO ? 2.5 : 2} />
          <span className="text-[10px] font-medium">{t('portfolio', lang)}</span>
        </button>

        {/* Floating Add Button Wrapper (Center) */}
        <div className="relative -top-6">
          <button 
            onClick={() => setView(ViewState.QUICK_ADD)}
            className="w-14 h-14 bg-brand-600 rounded-full shadow-lg shadow-brand-500/40 flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>

        {/* Chat (AI) */}
        <button className={navItemClass(ViewState.CHAT)} onClick={() => setView(ViewState.CHAT)}>
          <MessageSquare size={24} strokeWidth={currentView === ViewState.CHAT ? 2.5 : 2} />
          <span className="text-[10px] font-medium">{t('chat', lang)}</span>
        </button>

        {/* Tax Report */}
        <button className={navItemClass(ViewState.TAX_REPORT)} onClick={() => setView(ViewState.TAX_REPORT)}>
          <FileText size={24} strokeWidth={currentView === ViewState.TAX_REPORT ? 2.5 : 2} />
          <span className="text-[10px] font-medium">{t('tax_report', lang)}</span>
        </button>

      </div>
    </div>
  );
};