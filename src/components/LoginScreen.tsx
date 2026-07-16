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
  Loader2
} from "lucide-react";

interface LoginScreenProps {
  existingWallet: {
    hasWallet: boolean;
    name?: string;
    email?: string;
    publicKey?: string;
  };
  existingPlayerName: string;
  onLogin: (name: string) => void;
  onPasskeyLogin: () => void;
  onResetCharacter: () => void;
  playSynthSound: (type: "beep" | "success" | "coin" | "unlock") => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  existingWallet,
  existingPlayerName,
  onLogin,
  onPasskeyLogin,
  onResetCharacter,
  playSynthSound,
}) => {
  const [name, setName] = useState(existingPlayerName || "Anonymo");
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [passkeyStep, setPasskeyStep] = useState<"idle" | "scanning" | "success">("idle");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Background star blinking animation effect
  const [stars, setStars] = useState<{ id: number; top: number; left: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate static-random stars positions
    const newStars = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
    }));
    setStars(newStars);
  }, []);

  // Handle Frictionless Play
  const handleFrictionlessPlay = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(name.trim() || "Anonymo");
  };

  // Start Simulated Biometric Passkey Login
  const handleStartPasskey = () => {
    if (!existingWallet.hasWallet) return;
    playSynthSound("beep");
    setShowPasskeyModal(true);
    setPasskeyStep("scanning");

    // Phase 1: Biometric Scanning Simulation
    setTimeout(() => {
      playSynthSound("beep");
      // Phase 2: Success
      setTimeout(() => {
        playSynthSound("success");
        setPasskeyStep("success");
        // Phase 3: Login Callback
        setTimeout(() => {
          setShowPasskeyModal(false);
          onPasskeyLogin();
        }, 1200);
      }, 1500);
    }, 1000);
  };

  const confirmReset = () => {
    playSynthSound("unlock");
    onResetCharacter();
    setName("Anonymo");
    setShowResetConfirm(false);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#07080a] text-slate-100 flex items-center justify-center p-4 overflow-y-auto selection:bg-cyan-400 selection:text-black">
      
      {/* 1. BACKGROUND COSMIC STARFIELD */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white opacity-40 animate-pulse"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: "3s",
              boxShadow: star.size > 2 ? "0 0 4px rgba(255, 255, 255, 0.8)" : "none",
            }}
          />
        ))}
        {/* Ambient colored nebulas */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-950/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-950/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Retro scanlines overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_4px,6px_100%] pointer-events-none" />
      </div>

      {/* 2. MAIN CONSOLE CONTAINER */}
      <div className="relative w-full max-w-4xl bg-[#0f1115] border-2 border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden z-10 font-mono">
        
        {/* Top retro status bar */}
        <div className="bg-[#14181f] border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-green-400">SERVIDORES DE ESTRELAS ONLINE</span>
          </div>
          <div className="flex items-center gap-4">
            <span>NETWORK: STELLAR TESTNET</span>
            <span className="text-cyan-400 font-semibold">V2.5.0-ALPHA</span>
          </div>
        </div>

        {/* Content Layout */}
        <div className="p-6 md:p-8 grid md:grid-cols-12 gap-8 items-center">
          
          {/* LEFT COLUMN: HERO GAME CONCEPT & LOGO */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            
            {/* Pulsing floating game emblem */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-slate-950 border-2 border-dashed border-cyan-800/60 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)] group animate-bounce" style={{ animationDuration: "6s" }}>
              <div className="absolute inset-2 bg-gradient-to-tr from-cyan-950 to-slate-950 rounded-full flex items-center justify-center border border-cyan-500/20">
                <Globe className="h-10 w-10 md:h-14 md:w-14 text-cyan-400/80 animate-spin" style={{ animationDuration: "25s" }} />
              </div>
              <div className="absolute -top-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg flex items-center gap-0.5">
                <Sparkles className="h-2.5 w-2.5 fill-black" /> RPG
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-100 to-cyan-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-tight uppercase">
                Stellar Island
              </h1>
              <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed mt-1.5 font-medium max-w-sm">
                O arquipélago educacional onde você domina a Rede Stellar e contratos inteligentes Soroban através de uma jornada gamificada de exploração offline-first.
              </p>
            </div>

            {/* Quick stats panel */}
            <div className="w-full bg-slate-950/60 rounded-xl p-3 border border-slate-850 space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-500">CONECTIVIDADE:</span>
                <span className="text-cyan-400 font-semibold">OFFLINE SECURE (LOCAL)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MÓDULO DE WALLET:</span>
                <span className="text-amber-400 font-semibold">STELLAR WALLETNOW SDK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PERSISTÊNCIA:</span>
                <span className="text-purple-400 font-semibold">DURABLE INDEXED DB</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INTERACTIVE LOGIN INTERFACES */}
          <div className="md:col-span-7 space-y-6">
            
            {/* OPTION A: RECOGNIZED PASSKEY IDENTITY */}
            {existingWallet.hasWallet ? (
              <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.06)] relative overflow-hidden group">
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
                      📧 {existingWallet.email || "Sem e-mail registrado"}
                    </p>
                    <p className="text-[9px] text-cyan-500/80 font-mono tracking-wider truncate bg-slate-900 px-1.5 py-0.5 rounded mt-1.5 max-w-[240px]">
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
                    <Fingerprint className="h-4 w-4" /> Logar com Passkey
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSynthSound("beep");
                      onLogin(existingWallet.name || existingPlayerName);
                    }}
                    className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 active:scale-[0.99] transition-all cursor-pointer border border-slate-800"
                    title="Entrar sem precisar re-escanear biometria"
                  >
                    Login Rápido ⚡
                  </button>
                </div>
              </div>
            ) : (
              /* IF NO WALLET: SHOW FRICTIONLESS LOGIN FORM WITH NAME PREFILL */
              <form onSubmit={handleFrictionlessPlay} className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-400" /> Modo Sem Fricção Ativo
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Entre instantaneamente sem preencher formulários complicados. Você poderá forjar sua carteira com segurança criptográfica quando explorar a ilha.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <User className="h-3 w-3 text-cyan-400" /> Nome do Seu Personagem
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={18}
                      value={name}
                      onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_ ]/g, ""))}
                      placeholder="Anonymo"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-cyan-500 focus:bg-[#0c0d10] text-slate-100 placeholder:text-slate-600 tracking-wide transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      EDITÁVEL
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block font-medium">
                    Deixe em branco ou digite qualquer apelido para entrar de forma 100% livre.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-black bg-amber-400 hover:bg-amber-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 font-mono shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
                >
                  Jogar Agora Sem Fricção <ChevronRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* INTERACTIVE CREDENTIAL PASSKEY DESCRIPTION */}
            <div className="bg-[#12161f]/40 p-4 rounded-xl border border-slate-800/80 text-[10.5px] leading-relaxed space-y-1.5 text-slate-400">
              <span className="text-[9px] bg-slate-800 text-slate-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide">
                ℹ️ Como Funciona
              </span>
              <p>
                Os dados de progresso e estatísticas são mantidos no seu navegador. Após criar a carteira na região leste (East Region), o game se integra à autenticação local de <span className="text-cyan-400 font-semibold">Chaves de Acesso (Passkeys)</span>, permitindo logar com um único toque sem necessitar de senhas convencionais.
              </p>
            </div>

            {/* DEVELOPER SANDBOX TESTBED ZONE */}
            <div className="pt-4 border-t border-slate-900 flex flex-col items-center">
              {showResetConfirm ? (
                <div className="w-full bg-red-950/30 border border-red-900/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2 text-red-400 text-xs font-bold">
                    <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <h4>Confirmar Novo Personagem?</h4>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                        Isso removerá todo o progresso atual, histórico de transações e a carteira criptográfica gerada no seu navegador. Ótimo para testar o onboarding do zero!
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 bg-slate-900 rounded-lg hover:bg-slate-850 cursor-pointer"
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
                  className="text-[10px] text-slate-500 hover:text-orange-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition px-2 py-1 rounded hover:bg-slate-900 cursor-pointer"
                  title="Permite reiniciar o jogo limpando localStorage para novos testes de onboarding."
                >
                  <Trash2 className="h-3.5 w-3.5 text-slate-600" /> ✨ Resetar & Criar Novo Personagem (Modo Teste)
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 3. SIMULATED BROWSER / OS PASSKEY BIOMETRIC DIALOG */}
      {showPasskeyModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-750 w-full max-w-sm rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header simulating OS biometric request */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-cyan-400" />
                <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Chave de Acesso Local</span>
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
                  Por favor, escaneie sua impressão digital ou use a autenticação facial cadastrada para verificar sua carteira estelar.
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
                <div className={`w-14 h-14 rounded-2xl bg-slate-950 border-2 flex items-center justify-center shadow-inner transition-all duration-300 ${
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
                    <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase animate-pulse">Escaneando Biometria...</span>
                  </>
                ) : (
                  <>
                    <span className="text-green-400 font-extrabold">✓</span>
                    <span className="text-[10px] font-bold text-green-400 tracking-wider uppercase">AUTENTICAÇÃO APROVADA!</span>
                  </>
                )}
              </div>

              {/* Simulated user profile info in biometric prompt */}
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/80 text-left text-[9px] text-slate-500 space-y-0.5 max-w-[250px] mx-auto">
                <div className="truncate"><span className="text-slate-400 font-bold">USUÁRIO:</span> {existingWallet.name}</div>
                <div className="truncate"><span className="text-slate-400 font-bold">CONTA:</span> {existingWallet.publicKey?.slice(0, 12)}...</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
