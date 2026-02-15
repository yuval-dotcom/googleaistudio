import React from 'react';
import { Shield, X } from 'lucide-react';
import { t } from '../services/translationService';
import type { Language } from '../types';

interface AiPrivacyGateProps {
  lang: Language;
  onAccept: () => void;
  onCancel: () => void;
}

export const AiPrivacyGate: React.FC<AiPrivacyGateProps> = ({ lang, onAccept, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
          <Shield size={20} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{t('ai_consent_title', lang)}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-6">{t('ai_consent_body', lang)}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <X size={16} />
          {t('cancel', lang)}
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors"
        >
          {t('i_understand', lang)}
        </button>
      </div>
    </div>
  </div>
);
