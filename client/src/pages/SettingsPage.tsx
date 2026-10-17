import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SectionHeader } from '../components/SectionHeader';
import { SettingsModal } from '../components/modals/SettingsModal';
import {
  Settings,
  Languages,
  ShieldCheck,
  Database,
  Smartphone,
  LogOut,
  RotateCcw,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100 select-none">
      {/* SECTION HEADER */}
      <SectionHeader
        title={language === 'gu' ? 'સેટિંગ્સ અને પ્રોફાઇલ' : 'Settings & Profile'}
        englishTitle="APP SETTINGS & PROFILE"
        icon={Settings}
        bgColor="bg-cream-200"
        borderColor="border-[#D8CEBD]"
        iconColor="text-brand-navy"
        actionButton={
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border-2 border-[#D8CEBD] text-brand-navy font-black text-xs transition active:scale-95 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Settings className="w-4 h-4 stroke-[2.2]" />
            <span>{language === 'gu' ? 'સેટિંગ્સ પોપઅપ' : 'Inspect Settings'}</span>
          </button>
        }
      />

      {/* SECTION CONTENT */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* User Profile Card with clear border */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-pastel-pink/70 border-2 border-[#F8B4BA] text-pastel-pinkIcon font-black text-base flex items-center justify-center shadow-xs">
              {user?.fullNameEn?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="text-sm sm:text-base font-black text-brand-navy">
                {language === 'gu' ? user?.fullNameGu || user?.fullNameEn : user?.fullNameEn}
              </div>
              <div className="text-xs text-brand-navy/60 font-semibold mt-0.5">
                હોદ્દો: {user?.role} · મોબાઇલ: {user?.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Language Selection Card */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b-2 border-[#E0D5C3]">
            <Languages className="w-4 h-4 text-brand-orange stroke-[2.2]" />
            <h2 className="text-xs sm:text-sm font-black text-brand-navy uppercase tracking-wider">
              {language === 'gu' ? 'ઇન્ટરફેસ ભાષા (Language)' : 'Interface Language'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setLanguage('gu')}
              className={`p-3.5 rounded-xl border-2 text-xs font-black transition cursor-pointer flex items-center justify-between ${
                language === 'gu'
                  ? 'bg-pastel-peach text-brand-navy border-[#FDC58A] shadow-2xs'
                  : 'bg-white text-brand-navy/70 border-[#E0D5C3] hover:bg-cream-100'
              }`}
            >
              <span>ગુજરાતી (Default Frontline)</span>
              {language === 'gu' && <span className="text-[10px] bg-brand-orange text-white px-2 py-0.5 rounded-full">સક્રિય</span>}
            </button>

            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-3.5 rounded-xl border-2 text-xs font-black transition cursor-pointer flex items-center justify-between ${
                language === 'en'
                  ? 'bg-pastel-peach text-brand-navy border-[#FDC58A] shadow-2xs'
                  : 'bg-white text-brand-navy/70 border-[#E0D5C3] hover:bg-cream-100'
              }`}
            >
              <span>English</span>
              {language === 'en' && <span className="text-[10px] bg-brand-orange text-white px-2 py-0.5 rounded-full">Active</span>}
            </button>
          </div>
        </div>

        {/* Center / System Information */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs space-y-2">
          <h2 className="text-xs sm:text-sm font-black text-brand-navy uppercase tracking-wider pb-2 border-b-2 border-[#E0D5C3]">
            {language === 'gu' ? 'કેન્દ્ર વિગતો' : 'Centre Information'}
          </h2>
          <div className="divide-y divide-[#E0D5C3] text-xs font-bold text-brand-navy">
            <div className="py-2 flex justify-between">
              <span className="text-brand-navy/60">AWC Code:</span>
              <span>{user?.awcId || '24190101'}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-brand-navy/60">જિલ્લો:</span>
              <span>પંચમહાલ (Panchmahal)</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-brand-navy/60">પ્રોજેક્ટ:</span>
              <span>ગોધરા ગ્રામ્ય (Godhra Rural)</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-brand-navy/60">સિસ્ટમ વર્ઝન:</span>
              <span className="font-mono text-[11px]">KHORAK v1.0.0 (Gujarat Seva First)</span>
            </div>
          </div>
        </div>

        {/* Logout Action */}
        <button
          type="button"
          onClick={logout}
          className="w-full py-3 px-4 rounded-xl border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs transition active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4 stroke-[2.2]" />
          <span>લોગ આઉટ કરો (Log Out)</span>
        </button>
      </div>

      {/* POPUP: SettingsModal with clear distributive border */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};
