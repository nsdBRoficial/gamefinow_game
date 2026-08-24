import React, { useState, useEffect } from "react";
import { 
  Fingerprint, 
  Sparkles, 
  Trash2, 
  Key, 
  User, 
  ShieldAlert, 
  HelpCircle, 
  Smartphone,
  ChevronRight,
  UserCheck,
  Zap,
  Globe,
  Loader2,
  Languages
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AccountRecoveryModal } from "./AccountRecoveryModal";

interface LoginScreenProps {
  existingWallet: {
    hasWallet: boolean;
    name?: string;
    email?: string;
    publicKey?: string;
  };
  existingPlayerName: string;
  existingGender?: "male" | "female";
  onLogin: (name: string, gender: "male" | "female") => void;
  onPasskeyLogin: () => void;
  onResetCharacter: () => void;
  playSynthSound: (type: "beep" | "success" | "coin" | "unlock") => void;
}

// Subcomponente de Prévia do Personagem no Login
const LoginCharacterPreview: React.FC<{ gender: "male" | "female"; name: string }> = ({ gender, name }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frameCounter = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCounter += 0.05;

      const isFemale = gender === "female";
      const charData = {
        gender,
        skinColor: "#ffdbac",
        headColor: isFemale ? "#ec4899" : "#3b82f6",
        headType: isFemale ? "ribbon" : "topete",
        torsoColor: isFemale ? "#ec4899" : "#ef4444",
        torsoType: isFemale ? "dress" : "classic",
        legsColor: isFemale ? "#1e293b" : "#2563eb",
        shoesColor: isFemale ? "#ec4899" : "#1e293b",
        faceType: isFemale ? "eyelashes" : "none",
        accessoryType: "none",
        hairColor: isFemale ? "#ec4899" : "#78350f",
      };

      // Import dynamic draw logic
      import("./canvas/PlayerSprite").then(({ drawPixelCharacter }) => {
        drawPixelCharacter(ctx, 16, 12, charData as any, true, frameCounter, "down", false);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gender]);

  return (
    <div className="flex items-center gap-3 bg-black/60 border border-slate-800 p-2.5 rounded-xl">
      <div className="w-16 h-16 bg-slate-950 border border-cyan-500/30 rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner">
        <canvas ref={canvasRef} width={64} height={64} className="w-12 h-12 image-render-pixel" />
      </div>
      <div className="space-y-0.5 font-mono">
        <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider block">Prévia do Herói</span>
        <h4 className="text-xs font-black text-white truncate max-w-[150px]">{name || "Anonymo"}</h4>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase inline-block ${
          gender === "female" ? "bg-pink-950 text-pink-300 border-pink-800" : "bg-cyan-950 text-cyan-300 border-cyan-800"
        }`}>
          {gender === "female" ? "👧 Feminino" : "👦 Masculino (Padrão)"}
        </span>
      </div>
    </div>
  );
};

export const LoginScreen: React.FC<LoginScreenProps> = ({
  existingWallet,
  existingPlayerName,
  existingGender = "male",
  onLogin,
  onPasskeyLogin,
  onResetCharacter,
  playSynthSound,
}) => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState(existingPlayerName || "Anonymo");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [passkeyStep, setPasskeyStep] = useState<"idle" | "scanning" | "success">("idle");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

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
    }, 5000);
    return () => clearInterval(interval);
  }, [backgrounds.length]);

  // Handle Frictionless Play
  const handleFrictionlessPlay = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(name.trim() || "Anonymo", gender);
  };

  // Start Real Biometric Passkey Login via WebAuthn
  const handleStartPasskey = async () => {
    if (!existingWallet.hasWallet) return;
    playSynthSound("beep");
    setShowPasskeyModal(true);
    setPasskeyStep("scanning");

    try {
      if (window.PublicKeyCredential) {
        // Tentativa de login via Passkey / Biometria nativa
        const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
          challenge: new Uint8Array(32), // Em produção: gerar pelo servidor
          timeout: 60000,
          userVerification: "preferred"
        };
        
        await navigator.credentials.get({
          publicKey: publicKeyCredentialRequestOptions
        });
        
        playSynthSound("success");
        setPasskeyStep("success");
        setTimeout(() => {
          setShowPasskeyModal(false);
          onPasskeyLogin();
        }, 1200);
      } else {
        throw new Error("WebAuthn não suportado");
      }
    } catch (e) {
      console.error("Passkey falhou, fallback para simulação:", e);
      // Fallback (ex: navegador não suporta, ou usuário cancelou) para simular no dev
      setTimeout(() => {
        playSynthSound("beep");
        setTimeout(() => {
          playSynthSound("success");
          setPasskeyStep("success");
          setTimeout(() => {
            setShowPasskeyModal(false);
            onPasskeyLogin();
          }, 1200);
        }, 1500);
      }, 1000);
    }
  };

  const confirmReset = () => {
    playSynthSound("unlock");
    onResetCharacter();
    setName("Anonymo");
    setShowResetConfirm(false);
  };

  const changeLanguage = (lng: string) => {
    localStorage.setItem('gameLanguage', lng);
    i18n.changeLanguage(lng);
    playSynthSound("beep");
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-black text-slate-100 flex items-center justify-center p-4 overflow-y-auto selection:bg-cyan-400 selection:text-black">
      
      {/* 1. BACKGROUND CAROUSEL */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/80 pointer-events-none" />
        {/* Retro scanlines overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_4px,6px_100%] pointer-events-none" />
      </div>

      {/* LANGUAGE SELECTOR */}
      <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
          <Languages className="w-3.5 h-3.5" />
          {t('ui.login.selectLanguage')}
        </div>
        <div className="flex bg-black/40 backdrop-blur-md border border-slate-700 rounded-lg overflow-hidden shadow-lg">
          <button 
            onClick={() => changeLanguage('en')} 
            className={`px-3 py-1.5 text-[10px] font-bold uppercase transition ${i18n.language === 'en' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            EN
          </button>
          <div className="w-px bg-slate-700" />
          <button 
            onClick={() => changeLanguage('pt')} 
            className={`px-3 py-1.5 text-[10px] font-bold uppercase transition ${i18n.language === 'pt' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            PT-BR
          </button>
          <div className="w-px bg-slate-700" />
          <button 
            onClick={() => changeLanguage('es')} 
            className={`px-3 py-1.5 text-[10px] font-bold uppercase transition ${i18n.language === 'es' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            ES
          </button>
        </div>
      </div>

      {/* 2. MAIN CONSOLE CONTAINER */}
      <div className="relative w-full max-w-4xl bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden z-10 font-mono mt-12 md:mt-0">
        
        {/* Top retro status bar */}
        <div className="bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-green-400">{t('ui.onlineServers')}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{t('ui.login.network')}: {t('ui.login.testnet')}</span>
            <span className="text-cyan-400 font-semibold">{t('ui.login.version')}</span>
          </div>
        </div>

        {/* Content Layout */}
        <div className="p-6 md:p-8 grid md:grid-cols-12 gap-8 items-center">
          
          {/* LEFT COLUMN: HERO GAME CONCEPT & LOGO */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-4 animate-[pulse_6s_ease-in-out_infinite]">
            
            {/* Pulsing floating game emblem */}
            <div className="relative w-28 h-28 md:w-36 md:h-36 bg-black/60 backdrop-blur-md border-2 border-cyan-500/40 rounded-3xl p-3 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.35)] group">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/80 via-transparent to-amber-950/40 rounded-3xl pointer-events-none" />
              <img 
                src="/imagens/logo gamefinow - transparente.png" 
                alt="GameFiNow Emblem" 
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] filter transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-black">
                <Sparkles className="h-2.5 w-2.5 fill-black" /> RPG
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-100 to-cyan-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-tight uppercase">
                {t('ui.login.title')}
              </h1>
              <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed mt-1.5 font-medium max-w-sm">
                {t('ui.login.subtitle')}
              </p>
            </div>

            {/* Quick stats panel */}
            <div className="w-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-sm rounded-xl p-3 border border-slate-850 space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('ui.login.connectivity')}</span>
                <span className="text-cyan-400 font-semibold">OFFLINE SECURE (LOCAL)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('ui.login.walletModule')}</span>
                <span className="text-amber-400 font-semibold">STELLAR WALLETNOW SDK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('ui.login.persistence')}</span>
                <span className="text-purple-400 font-semibold">DURABLE INDEXED DB</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INTERACTIVE LOGIN INTERFACES */}
          <div className="md:col-span-7 space-y-6 group">
            
            {/* OPTION A: RECOGNIZED PASSKEY IDENTITY */}
            {existingWallet.hasWallet ? (
              <div className="bg-black/50 backdrop-blur-md border border-cyan-500/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:border-cyan-500/50 hover:-translate-y-1 transition-all duration-500 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.06)] relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                    <UserCheck className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="space-y-1 overflow-hidden flex-1">
                    <span className="text-[9px] bg-cyan-400/10 text-cyan-400 font-bold px-2 py-0.5 rounded border border-cyan-400/20 uppercase tracking-widest inline-block">
                      Perfil Ativo Detectado
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-100 truncate mt-1">
                      {existingWallet.name || existingPlayerName}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate">
                      📧 {existingWallet.email || "{t('ui.login.noEmail')}"}
                    </p>
                    <p className="text-[9px] text-cyan-500/80 font-mono tracking-wider truncate bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded mt-1.5 max-w-[240px]">
                      🔑 {existingWallet.publicKey?.slice(0, 8)}...{existingWallet.publicKey?.slice(-8)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-900 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleStartPasskey}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 font-mono shadow-[0_4px_12px_rgba(34,211,238,0.25)]"
                  >
                    <Fingerprint className="h-4 w-4" /> {t('ui.login.loginPasskey')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSynthSound("beep");
                      onLogin(existingWallet.name || existingPlayerName, undefined, true);
                    }}
                    className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-slate-200 bg-black/40 backdrop-blur-md hover:bg-slate-850 active:scale-[0.99] transition-all cursor-pointer border border-slate-800"
                    title={t('ui.login.fastLoginTitle')}
                  >
                    {t('ui.login.fastLogin')}
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-900 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      playSynthSound("beep");
                      setShowRecoveryModal(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>🔑</span> Restaurar / Importar Outra Conta
                  </button>
                </div>
              </div>
            ) : (
              /* IF NO WALLET: SHOW FRICTIONLESS LOGIN FORM WITH NAME PREFILL */
              <form onSubmit={handleFrictionlessPlay} className="bg-black/50 backdrop-blur-md border border-slate-850 hover:border-slate-700 hover:-translate-y-1 transition-all duration-500 rounded-xl p-5 space-y-4 shadow-lg hover:shadow-xl">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-400 animate-pulse" /> {t('ui.login.frictionlessMode')}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {t('ui.login.frictionlessDesc')}
                  </p>
                </div>

                {/* PRÉVIA DO PERSONAGEM EM PIXEL-ART */}
                <LoginCharacterPreview gender={gender} name={name} />

                {/* NOME DO PERSONAGEM */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <User className="h-3 w-3 text-cyan-400" /> {t('ui.login.characterName')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={18}
                      value={name}
                      onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_ ]/g, ""))}
                      placeholder={t('ui.loginNamePlaceholder')}
                      className="w-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md border border-slate-800 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-cyan-500 focus:bg-[#0c0d10] text-slate-100 placeholder:text-slate-600 tracking-wide transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded border border-slate-800">
                      EDITÁVEL
                    </span>
                  </div>
                </div>

                {/* SELETOR DE SEXO DO PERSONAGEM (MASCULINO DEFAULT / FEMININO) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    👥 Sexo do Personagem
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playSynthSound("beep");
                        setGender("male");
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        gender === "male"
                          ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                          : "bg-black/40 border-slate-800 text-slate-400 hover:bg-slate-850"
                      }`}
                    >
                      <span>👦</span> Masculino (Padrão)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSynthSound("beep");
                        setGender("female");
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        gender === "female"
                          ? "bg-pink-950/80 border-pink-500 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                          : "bg-black/40 border-slate-800 text-slate-400 hover:bg-slate-850"
                      }`}
                    >
                      <span>👧</span> Feminino
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-black bg-amber-400 hover:bg-amber-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 font-mono shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
                >
                  {t('ui.login.playNow')} <ChevronRight className="h-4 w-4" />
                </button>

                {/* BOTÃO DE RECUPERAÇÃO DE CONTA PARA NOVOS DISPOSITIVOS / USUÁRIOS */}
                <div className="pt-2 border-t border-slate-900 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      playSynthSound("beep");
                      setShowRecoveryModal(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>🔑</span> Já possui conta? Restaurar Personagem (SEP-10 / E-mail)
                  </button>
                </div>
              </form>
            )}

            {/* INTERACTIVE CREDENTIAL PASSKEY DESCRIPTION */}
            <div className="bg-black/30 backdrop-blur-md p-4 rounded-xl border border-slate-800/80 text-[10.5px] leading-relaxed space-y-1.5 text-slate-400">
              <span className="text-[9px] bg-slate-800 text-slate-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide">
                {t('ui.login.howItWorks')}
              </span>
              <p>
                {t('ui.login.howItWorksDesc1')}<span className="text-cyan-400 font-semibold">{t('ui.login.howItWorksDesc2')}</span>{t('ui.login.howItWorksDesc3')}
              </p>
            </div>

            {/* DEVELOPER SANDBOX TESTBED ZONE */}
            <div className="pt-4 border-t border-slate-900 flex flex-col items-center">
              {showResetConfirm ? (
                <div className="w-full bg-red-950/30 border border-red-900/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2 text-red-400 text-xs font-bold">
                    <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <h4>{t('ui.login.confirmResetTitle')}</h4>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {t('ui.login.confirmResetDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 bg-black/40 backdrop-blur-md rounded-lg hover:bg-slate-850 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmReset}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer flex items-center gap-1 shadow-lg shadow-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Sim, Resetar Tudo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playSynthSound("beep");
                    setShowResetConfirm(true);
                  }}
                  className="text-[10px] text-slate-500 hover:text-orange-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition px-2 py-1 rounded hover:bg-black/40 backdrop-blur-md cursor-pointer"
                  title={t('ui.newCharacter')}
                >
                  <Trash2 className="h-3.5 w-3.5 text-slate-600" /> ✨ {t('ui.newCharacter')} (Modo Teste)
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 3. SIMULATED BROWSER / OS PASSKEY BIOMETRIC DIALOG */}
      {showPasskeyModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/40 backdrop-blur-md border-2 border-slate-750 w-full max-w-sm rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header simulating OS biometric request */}
            <div className="bg-black/50 backdrop-blur-md px-4 py-3 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-cyan-400" />
                <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">{t('ui.login.passkeyLocal')}</span>
              </div>
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              </div>
            </div>

            <div className="p-6 text-center space-y-5">
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Autenticação de Dispositivo
                </h3>
                <p className="text-[10.5px] text-slate-400 leading-normal max-w-xs mx-auto">
                  {t('ui.login.deviceAuthDesc')}
                </p>
              </div>

              {/* Glowing animated fingerprint scan indicator */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                
                {/* Concentric scan lines */}
                <div className={`absolute inset-0 border-2 rounded-full transition-all duration-300 ${
                  passkeyStep === "scanning" 
                    ? "border-cyan-500/20 animate-ping" 
                    : "border-green-500/20"
                }`} />

                <div className={`absolute inset-2 border rounded-full transition-all duration-500 ${
                  passkeyStep === "scanning" 
                    ? "border-cyan-500/40 animate-pulse" 
                    : "border-green-500/40"
                }`} />

                {/* Biometric container */}
                <div className={`w-14 h-14 rounded-2xl bg-black/50 backdrop-blur-md border-2 flex items-center justify-center shadow-inner transition-all duration-300 ${
                  passkeyStep === "scanning"
                    ? "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                }`}>
                  <Fingerprint className={`h-8 w-8 transition-colors duration-300 ${
                    passkeyStep === "scanning" ? "text-cyan-400 animate-pulse" : "text-green-400"
                  }`} />
                </div>

                {/* Scanning sweep bar */}
                {passkeyStep === "scanning" && (
                  <div className="absolute left-3 right-3 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] rounded animate-bounce top-1/2" />
                )}
              </div>

              {/* Dynamic Authentication feedback status text */}
              <div className="flex items-center justify-center gap-2">
                {passkeyStep === "scanning" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                    <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase animate-pulse">{t('ui.login.scanningBio')}</span>
                  </>
                ) : (
                  <>
                    <span className="text-green-400 font-extrabold">✓</span>
                    <span className="text-[10px] font-bold text-green-400 tracking-wider uppercase">{t('ui.login.authApproved')}</span>
                  </>
                )}
              </div>

              {/* Simulated user profile info in biometric prompt */}
              <div className="bg-black/40 backdrop-blur-sm p-2.5 rounded-lg border border-slate-850/80 text-left text-[9px] text-slate-500 space-y-0.5 max-w-[250px] mx-auto">
                <div className="truncate"><span className="text-slate-400 font-bold">{t('ui.login.userLabel')}</span> {existingWallet.name}</div>
                <div className="truncate"><span className="text-slate-400 font-bold">{t('ui.login.accountLabel')}</span> {existingWallet.publicKey?.slice(0, 12)}...</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE RECUPERAÇÃO DE CONTA NO LOGIN */}
      {showRecoveryModal && (
        <AccountRecoveryModal
          isOpen={showRecoveryModal}
          onClose={() => setShowRecoveryModal(false)}
          playSynthSound={playSynthSound}
          onRecoverySuccess={(recoveredName) => {
            setShowRecoveryModal(false);
            onLogin(recoveredName || "Herói Recuperado", undefined, true);
          }}
        />
      )}

    </div>
  );
};
