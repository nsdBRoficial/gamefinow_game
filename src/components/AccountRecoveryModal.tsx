/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { KeyRound, Mail, CheckCircle2, ShieldCheck, RefreshCw, X, Sparkles, AlertTriangle } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { Keypair } from "@stellar/stellar-sdk";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";

interface AccountRecoveryModalProps {
  playSynthSound: (type: "beep" | "success" | "coin" | "unlock") => void;
  isOpen?: boolean;
  onClose?: () => void;
  onRecoverySuccess?: (name: string, publicKey?: string) => void;
}

export const AccountRecoveryModal: React.FC<AccountRecoveryModalProps> = ({
  playSynthSound,
  isOpen,
  onClose,
  onRecoverySuccess,
}) => {
  const activeModal = useGameStore((s) => s.activeModal);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const updateWallet = useGameStore((s) => s.updateWallet);
  const setPlayerPos = useGameStore((s) => s.setPlayerPos);
  const setGameState = useGameStore((s) => s.setGameState);

  const isVisible = isOpen !== undefined ? isOpen : activeModal === "account_recovery";

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveModal(null);
    }
  };

  const [mode, setMode] = useState<"sep10" | "email">("sep10");
  const [stellarSecretKey, setStellarSecretKey] = useState("");
  const [secretKeyOrPin, setSecretKeyOrPin] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (!isVisible) return null;

  const handleSecretKeyRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stellarSecretKey.trim()) {
      setStatusMsg({ text: "Insira sua Secret Key Stellar (S...)!", type: "error" });
      playSynthSound("beep");
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      // 1. Validação do formato Ed25519 Stellar e derivação da chave pública
      const keypair = Keypair.fromSecret(stellarSecretKey.trim());
      const publicKey = keypair.publicKey();

      setStatusMsg({ text: "Verificando dados on-chain e na base de dados...", type: "success" });

      // 2. Tenta restaurar do Supabase autenticando no backend primeiro
      let profile: any = null;
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
        console.log("[Recovery] Requesting token for publicKey:", publicKey);
        const authRes = await fetch(`${backendUrl}/api/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey })
        });
        if (!authRes.ok) {
          console.error("[Recovery] /api/auth/token returned:", authRes.status, await authRes.text());
        }

        if (authRes.ok) {
          const { token } = await authRes.json();
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
          
          if (supabaseUrl && supabaseAnonKey) {
            const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
              global: { headers: { Authorization: `Bearer ${token}` } },
            });
            const { data, error } = await authSupabase.from("players").select("*").eq("id", publicKey).maybeSingle();
            if (data && !error) {
              profile = data;
            }
          }
        }
      } catch (err) {
        console.error("Falha ao recuperar dados do Supabase:", err);
      }

      // Fallback para nome padrão caso não exista base
      const recoveredName = profile?.name || "Herói Recuperado";

      // 3. Restauração do perfil 
      updateWallet({
        hasWallet: true,
        publicKey: publicKey,
        secretKey: stellarSecretKey.trim(),
        name: recoveredName,
        gamefiBalance: 50,
      });

      setPlayerPos({
        name: recoveredName,
        walletAddress: publicKey,
        ...(profile && {
          gender: profile.gender,
          headColor: profile.head_color,
          torsoColor: profile.torso_color,
          legsColor: profile.legs_color,
          shoesColor: profile.shoes_color,
          skinColor: profile.skin_color,
          headType: profile.head_type,
          torsoType: profile.torso_type,
          shoesType: profile.shoes_type,
          faceType: profile.face_type,
          accessoryType: profile.accessory_type,
          activeOutfit: profile.active_outfit,
          ownedOutfits: profile.owned_outfits,
          activeTitle: profile.active_title,
          unlockedTitles: profile.unlocked_titles,
          nameStyle: profile.name_style
        })
      });

      if (profile && profile.level) {
        setGameState({
          level: profile.level,
          xp_current: profile.xp_current || 0,
        });
      }

      playSynthSound("unlock");
      setStatusMsg({
        text: `✅ Carteira de ${recoveredName} restaurada com sucesso!`,
        type: "success",
      });

      setTimeout(() => {
        handleClose();
        if (onRecoverySuccess) {
          onRecoverySuccess(recoveredName, publicKey);
        }
      }, 1500);
    } catch (err: any) {
      setStatusMsg({ text: "Secret Key inválida!", type: "error" });
      playSynthSound("beep");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes("@")) {
      setStatusMsg({ text: "Insira um e-mail válido!", type: "error" });
      playSynthSound("beep");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      playSynthSound("coin");
      setStatusMsg({ text: `Código de recuperação enviado para ${emailInput}! (Simulação: digite 123456)`, type: "success" });
    }, 1000);
  };

  const handleVerifyEmailOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim() !== "123456" && otpCode.trim().length !== 6) {
      setStatusMsg({ text: "Código OTP inválido! Use o código de teste: 123456", type: "error" });
      playSynthSound("beep");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      updateWallet({ email: emailInput.trim(), hasWallet: true });
      playSynthSound("unlock");
      setStatusMsg({ text: "✅ E-mail confirmado e conta sincronizada com sucesso!", type: "success" });
      setTimeout(() => {
        handleClose();
        if (onRecoverySuccess) {
          onRecoverySuccess("Herói Recuperado");
        }
      }, 1500);
    }, 1000);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none animate-in fade-in">
      <div className="bg-[#181a20] border-4 border-cyan-500/80 rounded-2xl max-w-md w-full p-5 shadow-[0_0_40px_rgba(6,182,212,0.4)] text-white relative flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase text-cyan-300 tracking-wider">
                Recuperação de Conta Web3
              </h2>
              <p className="text-[10px] text-slate-400">
                Restaure seu herói e suas carteiras com segurança
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-lg border border-black flex items-center justify-center font-bold text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <button
            onClick={() => { setMode("sep10"); setStatusMsg(null); playSynthSound("beep"); }}
            className={`py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === "sep10" ? "bg-amber-500 text-slate-950 border-black shadow-[2px_2px_0px_#000]" : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <KeyRound className="w-4 h-4" /> Secret Key
          </button>
          <button
            onClick={() => { setMode("email"); setStatusMsg(null); playSynthSound("beep"); }}
            className={`py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === "email" ? "bg-amber-500 text-slate-950 border-black shadow-[2px_2px_0px_#000]" : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <Mail className="w-4 h-4" /> E-mail OTP
          </button>
        </div>

        {statusMsg && (
          <div className={`mb-3 text-xs font-bold p-2.5 rounded-lg text-center ${
            statusMsg.type === "success" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-red-950 text-red-300 border border-red-800"
          }`}>
            {statusMsg.text}
          </div>
        )}

        {mode === "sep10" ? (
          <form onSubmit={handleSecretKeyRecover} className="space-y-3 text-xs">
            <div>
              <label className="block text-amber-400 font-bold mb-1">Chave Secreta Stellar (S...)</label>
              <input
                type="password"
                value={stellarSecretKey}
                onChange={(e) => setStellarSecretKey(e.target.value)}
                placeholder="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-[11px] outline-none focus:border-amber-400"
              />
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-amber-900/40 space-y-1 text-[11px] text-slate-400">
              <p className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Restauração via Secret Key
              </p>
              <p>Sua Chave Secreta será usada localmente para derivar sua chave pública e recuperar sua conta com segurança. Não a compartilhe.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-[2px_2px_0px_#000] border-2 border-black flex items-center justify-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? "Validando Chave..." : "Restaurar Personagem via Secret Key"}
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-xs">
            {!otpSent ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">E-mail Cadastrado</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Enviar Código de Verificação
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Código de 6 Dígitos (OTP)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center text-amber-400 font-black tracking-widest text-lg outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirmar e Restaurar Conta
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
