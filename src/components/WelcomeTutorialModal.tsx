import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info, Keyboard, ShieldAlert, ArrowRight, X } from "lucide-react";

interface WelcomeTutorialModalProps {
  onClose: () => void;
}

export const WelcomeTutorialModal: React.FC<WelcomeTutorialModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 w-11/12 max-w-md shadow-[0_0_40px_rgba(16,185,129,0.3)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 1 && (
          <div className="flex flex-col items-center space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-300">
            <div className="w-16 h-16 bg-emerald-950 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <Info className="h-8 w-8" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider font-mono">{t('welcome_tutorial.title')}<br/><span className="text-emerald-400">GameFiNow!</span></h2>
              <p className="text-slate-300 text-sm leading-relaxed px-2">
                {t('welcome_tutorial.desc1')}
              </p>
            </div>
            
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2"
            >
              {t('welcome_tutorial.btn_continue')} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-300">
            <div className="w-16 h-16 bg-blue-950 border-2 border-blue-500 rounded-full flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Keyboard className="h-8 w-8" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-mono">{t('welcome_tutorial.movement')}</h2>
              <p className="text-slate-300 text-sm leading-relaxed px-2" dangerouslySetInnerHTML={{ __html: t('welcome_tutorial.desc2') }}></p>
              
              <div className="flex justify-center gap-2 mt-4">
                <div className="w-10 h-10 bg-slate-800 rounded border-b-4 border-slate-950 flex items-center justify-center font-bold text-white">W</div>
              </div>
              <div className="flex justify-center gap-2 mt-2">
                <div className="w-10 h-10 bg-slate-800 rounded border-b-4 border-slate-950 flex items-center justify-center font-bold text-white">A</div>
                <div className="w-10 h-10 bg-slate-800 rounded border-b-4 border-slate-950 flex items-center justify-center font-bold text-white">S</div>
                <div className="w-10 h-10 bg-slate-800 rounded border-b-4 border-slate-950 flex items-center justify-center font-bold text-white">D</div>
              </div>
            </div>
            
            <button
              onClick={() => setStep(3)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2"
            >
              {t('welcome_tutorial.btn_next')} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-300">
            <div className="w-16 h-16 bg-amber-950 border-2 border-amber-500 rounded-full flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <ShieldAlert className="h-8 w-8" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-mono">{t('welcome_tutorial.first_mission')}</h2>
              <p className="text-slate-300 text-sm leading-relaxed px-2" dangerouslySetInnerHTML={{ __html: t('welcome_tutorial.desc3') }}></p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mt-4 text-xs text-slate-400 text-left">
                <strong>{t('welcome_tutorial.hint')}</strong> {t('welcome_tutorial.hint_desc')}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-900/50 flex items-center justify-center"
            >
              {t('welcome_tutorial.btn_start')}
            </button>
          </div>
        )}
        
        {/* Progress indicators */}
        <div className="flex justify-center space-x-2 mt-6">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-700'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-6 bg-blue-500' : 'w-2 bg-slate-700'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 3 ? 'w-6 bg-amber-500' : 'w-2 bg-slate-700'}`} />
        </div>
      </div>
    </div>
  );
};

