import React, { useState, useEffect } from "react";
import { ChevronRight, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LandingPageProps {
  onPlay: () => void;
  playSynthSound: (type: "beep" | "success" | "coin" | "unlock") => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPlay, playSynthSound }) => {
  const { t, i18n } = useTranslation();
  
  // Background images from 'imagens/'
  const backgrounds = [
    "/imagens/capa-0.png",
    "/imagens/capa-1.png",
    "/imagens/capa-2.png",
    "/imagens/capa-3.png",
    "/imagens/capa-4.png"
  ];

  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, [backgrounds.length]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    playSynthSound("beep");
  };

  const handlePlayClick = () => {
    playSynthSound("success");
    onPlay();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-mono selection:bg-cyan-400 selection:text-black">
      {/* Background Carousel */}
      {backgrounds.map((bg, index) => (
        <div
          key={bg}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
            index === currentBg ? "opacity-100 scale-105" : "opacity-0 scale-100"
          }`}
          style={{ backgroundImage: `url(${bg})` }}
        />
      ))}

      {/* Dark Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 pointer-events-none" />

      {/* Retro scanlines overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_4px,6px_100%] pointer-events-none" />

      {/* LANGUAGE SELECTOR */}
      <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 text-white/80 text-[10px] uppercase font-bold tracking-wider mb-1 drop-shadow-md">
          <Languages className="w-3.5 h-3.5" />
          {t('ui.login.selectLanguage')}
        </div>
        <div className="flex bg-black/50 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden shadow-lg">
          <button 
            onClick={() => changeLanguage('en')} 
            className={`px-3 py-1.5 text-[10px] font-bold uppercase transition ${i18n.language === 'en' ? 'bg-cyan-500 text-black' : 'text-slate-300 hover:bg-white/10'}`}
          >
            EN
          </button>
          <div className="w-px bg-white/20" />
          <button 
            onClick={() => changeLanguage('pt')} 
            className={`px-3 py-1.5 text-[10px] font-bold uppercase transition ${i18n.language === 'pt' ? 'bg-cyan-500 text-black' : 'text-slate-300 hover:bg-white/10'}`}
          >
            PT-BR
          </button>
          <div className="w-px bg-white/20" />
          <button 
            onClick={() => changeLanguage('es')} 
            className={`px-3 py-1.5 text-[10px] font-bold uppercase transition ${i18n.language === 'es' ? 'bg-cyan-500 text-black' : 'text-slate-300 hover:bg-white/10'}`}
          >
            ES
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center">
        {/* LOGO */}
        <div className="animate-bounce" style={{ animationDuration: "3s" }}>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] leading-tight uppercase" style={{ WebkitTextStroke: "2px #000" }}>
            GAMEFINOW
          </h1>
          <h2 className="text-xl md:text-2xl text-amber-400 font-black mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-widest" style={{ WebkitTextStroke: "1px #000" }}>
            {t('ui.login.landingSubtitle')}
          </h2>
        </div>

        {/* PLAY BUTTON */}
        <div className="mt-16">
          <button
            onClick={handlePlayClick}
            className="group relative px-10 py-5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl font-black text-xl md:text-3xl text-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(245,158,11,0.5),_inset_0_2px_0_rgba(255,255,255,0.5)] border-4 border-black overflow-hidden flex items-center gap-3 animate-pulse"
            style={{ animationDuration: "2s" }}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10">{t('ui.login.playForFree')}</span>
            <ChevronRight className="w-8 h-8 relative z-10" strokeWidth={4} />
          </button>
        </div>

      </div>

    </div>
  );
};
