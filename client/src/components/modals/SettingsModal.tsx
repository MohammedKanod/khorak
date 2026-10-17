import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { ModalWrapper } from '../ModalWrapper';
import {
  Settings,
  Globe,
  User,
  Database,
  HelpCircle,
  Phone,
  LogOut,
  ShieldCheck,
  Wheat,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { pendingCount } = useOffline();

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'gu' ? 'સેટિંગ્સ અને પ્રોફાઇલ' : 'Settings & Profile'}
      subtitle={
        language === 'gu'
          ? 'ભાષા પસંદગી, કેન્દ્ર વિગતો અને સહાય'
          : 'Language, centre information, and support'
      }
      englishTitle="SETTINGS"
      icon={Settings}
      iconColor="text-slate-700"
      bgColor="bg-slate-200"
      borderColor="border-[#D8CEBD]"
      maxWidth="2xl"
      footerActions={
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition active:scale-95 flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('logout')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold transition active:scale-95"
          >
            {language === 'gu' ? 'બંધ કરો' : 'Close'}
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* User Profile Card */}
        <div className="p-3.5 bg-[#FFF5EA] rounded-2xl border border-[#FEDEBA] shadow-xs flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-lg shadow-xs">
            {user?.fullNameEn?.charAt(0) || 'H'}
          </div>
          <div>
            <div className="text-sm font-black text-brand-navy">
              {language === 'gu' ? user?.fullNameGu : user?.fullNameEn}
            </div>
            <div className="text-xs font-bold text-brand-orange mt-0.5">
              {user ? t(`role_${user.role}` as any) : 'આંગણવાડી કાર્યકર'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {user?.awc
                ? `${language === 'gu' ? user.awc.nameGu : user.awc.nameEn} (કોડ: ${user.awc.code})`
                : 'Panchmahal District'}
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="p-3.5 bg-[#F4F9FF] rounded-2xl border border-[#D0E2FC] shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-xs font-black text-brand-navy">
            <Globe className="w-4 h-4 text-brand-orange" />
            <span>{language === 'gu' ? 'ભાષા પસંદગી (Language):' : 'Select Interface Language:'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLanguage('gu')}
              className={`p-3 rounded-xl border text-center transition ${
                language === 'gu'
                  ? 'bg-amber-100 border-brand-orange text-brand-navy font-black ring-2 ring-brand-orange/30'
                  : 'bg-white border-[#D0E2FC] text-slate-700 hover:bg-slate-50 font-bold'
              }`}
            >
              <div className="text-sm">ગુજરાતી</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Default (ગુજરાત-પ્રથમ)</div>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-3 rounded-xl border text-center transition ${
                language === 'en'
                  ? 'bg-amber-100 border-brand-orange text-brand-navy font-black ring-2 ring-brand-orange/30'
                  : 'bg-white border-[#D0E2FC] text-slate-700 hover:bg-slate-50 font-bold'
              }`}
            >
              <div className="text-sm">English</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Alternative language</div>
            </button>
          </div>
        </div>

        {/* Offline Storage Status */}
        <div className="p-3.5 bg-[#F5F2FF] rounded-2xl border border-[#DDD5FC] shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Database className="w-4 h-4 text-indigo-600" />
            <div>
              <div className="text-xs font-bold text-brand-navy">
                {language === 'gu' ? 'સ્થાનિક ડેટાબેઝ (IndexedDB)' : 'Offline Local Storage'}
              </div>
              <div className="text-[10px] text-slate-500">
                {pendingCount} {language === 'gu' ? 'રેકોર્ડ સુરક્ષિત છે' : 'records in outbox'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Active
          </span>
        </div>

        {/* ICDS Helpline & App Info */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-xs font-black text-brand-navy">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>{language === 'gu' ? 'ICDS હેલ્પલાઇન અને સહાય:' : 'Help & Support:'}</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <div>
              {language === 'gu' ? 'ટોલ-ફ્રી હેલ્પલાઇન:' : 'Toll-free Helpline:'}{' '}
              <a href="tel:1098" className="font-bold text-brand-orange underline">
                1098 / 155214
              </a>
            </div>
            <div>
              {language === 'gu' ? 'પંચમહાલ ICDS કંટ્રોલ રૂમ:' : 'District Control Room:'}{' '}
              <span className="font-bold text-slate-800">02672-241010</span>
            </div>
          </div>
        </div>

        {/* App Version Info */}
        <div className="text-center text-[10px] text-slate-400 font-medium">
          KHORAK v2.2.0 · Seva First Innovation Challenge 2026 · Gujarat
        </div>
      </div>
    </ModalWrapper>
  );
};
