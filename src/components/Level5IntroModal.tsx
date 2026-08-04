import React, { useState, useEffect } from "react";
import { Star, Swords, Pickaxe, Store, Landmark, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameStore";

interface Level5IntroModalProps {
  onClose: () => void;
}

export const Level5IntroModal: React.FC<Level5IntroModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [canClose, setCanClose] = useState(false);

  // Exigir que o jogador leia por pelo menos alguns segundos antes de pular tudo
  useEffect(() => {
    if (step === 5) {
      setTimeout(() => setCanClose(true), 2000);
    }
  }, [step]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-700">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 w-11/12 max-w-lg shadow-[0_0_50px_rgba(245,158,11,0.3)] relative overflow-hidden">
        
        {/* Efeitos visuais */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        {step === 1 && (
          <div className="flex flex-col items-center space-y-6 relative z-10 animate-in slide-in-from-bottom-8 duration-500">
            <div className="w-20 h-20 bg-amber-950 border-4 border-amber-500 rounded-full flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce">
              <Star className="h-10 w-10" fill="currentColor" />
            </div>
            
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-white uppercase tracking-widest font-mono">
                {t('level5_intro.title1')}<br/>
                <span className="text-amber-400">{t('level5_intro.subtitle1')}</span>
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed px-2">
                {t('level5_intro.desc1')}
              </p>
            </div>
            
            <button
              onClick={() => setStep(2)}
              className="w-full mt-4 py-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm uppercase tracking-widest rounded-xl transition shadow-lg shadow-amber-900/50 flex items-center justify-center gap-2"
            >
              {t('level5_intro.btn_see_news')} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-300">
            <div className="w-16 h-16 bg-red-950 border-2 border-red-500 rounded-full flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <Swords className="h-8 w-8" />
            </div>
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider font-mono">{t('level5_intro.title2')}</h2>
              <p className="text-slate-300 text-sm leading-relaxed px-2">
                {t('level5_intro.desc2')}
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 text-left">
                <strong>{t('level5_intro.warning2')}</strong>
              </div>
            </div>
            
            <button
              onClick={() => setStep(3)}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-900/50 flex items-center justify-center gap-2"
            >
              {t('level5_intro.btn_next')} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-300">
            <div className="w-16 h-16 bg-emerald-950 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <Pickaxe className="h-8 w-8" />
            </div>
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider font-mono">{t('level5_intro.title3')}</h2>
              <p className="text-slate-300 text-sm leading-relaxed px-2">
                {t('level5_intro.desc3')}
              </p>
            </div>
            
            <button
              onClick={() => setStep(4)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2"
            >
              {t('level5_intro.btn_next')} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-300">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-violet-950 border-2 border-violet-500 rounded-full flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                <Store className="h-7 w-7" />
              </div>
              <div className="w-14 h-14 bg-blue-950 border-2 border-blue-500 rounded-full flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Landmark className="h-7 w-7" />
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider font-mono">{t('level5_intro.title4')}</h2>
              <div className="text-sm text-slate-300 space-y-2 text-left bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p>{t('level5_intro.atm_desc')}</p>
              </div>
            </div>
            
            <button
              onClick={() => setStep(5)}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl transition shadow-lg shadow-violet-900/50 flex items-center justify-center gap-2"
            >
              {t('level5_intro.btn_next')} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col items-center space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-300">
            <div className="w-20 h-20 bg-emerald-950 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-emerald-400 uppercase tracking-widest font-mono">{t('level5_intro.title5')}</h2>
              <p className="text-slate-300 text-sm leading-relaxed px-2">
                {t('level5_intro.desc5')}
              </p>
            </div>
            
            <button
              onClick={onClose}
              disabled={!canClose}
              className={`w-full py-4 font-extrabold text-sm uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center ${
                canClose 
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-900/50 cursor-pointer" 
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {t('level5_intro.btn_finish')}
            </button>
          </div>
        )}
        
        {/* Progress indicators */}
        <div className="flex justify-center space-x-2 mt-6">
          {[1,2,3,4,5].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === i ? 'w-6 bg-amber-500' : 
                step > i ? 'w-3 bg-amber-700/50' : 'w-2 bg-slate-700'
              }`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
