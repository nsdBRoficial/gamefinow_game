/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { KeyRound, Mail, CheckCircle2, ShieldCheck, RefreshCw, X, Sparkles, AlertTriangle, LogIn, Loader2 } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { Keypair } from "@stellar/stellar-sdk";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";
import { authService } from "../services/authService";

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

  const [mode, setMode] = useState<"google" | "sep10">("google");
  const [stellarSecretKey, setStellarSecretKey] = useState("");
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

  const handleGoogleRecover = async () => {
    setIsLoading(true);
    setStatusMsg({ text: "Conectando ao Google para localizar seu perfil...", type: "success" });
    playSynthSound("coin");

    try {
      const { error } = await authService.signInWithGoogle();
      if (error) {
        throw error;
      }
      // O redirect do OAuth levará de volta ao app, onde o App.tsx processará handleGoogleAuthSession()
    } catch (err: any) {
      console.error("[Recovery] Erro na recuperação Google:", err);
      setStatusMsg({
        text: err.message || "Falha ao conectar com Google. Tente novamente ou use sua Secret Key.",
        type: "error",
      });
      playSynthSound("beep");
      setIsLoading(false);
    }
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
                Recuperação de Conta
              </h2>
              <p className="text-[10px] text-slate-400">
                Restaure seu herói e suas chaves Stellar com segurança
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
            onClick={() => { setMode("google"); setStatusMsg(null); playSynthSound("beep"); }}
            className={`py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === "google" ? "bg-cyan-500 text-slate-950 border-black shadow-[2px_2px_0px_#000]" : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <LogIn className="w-4 h-4" /> Google (1-Clique)
          </button>
          <button
            onClick={() => { setMode("sep10"); setStatusMsg(null); playSynthSound("beep"); }}
            className={`py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === "sep10" ? "bg-amber-500 text-slate-950 border-black shadow-[2px_2px_0px_#000]" : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <KeyRound className="w-4 h-4" /> Secret Key (SEP-10)
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
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Restauração Manual Criptográfica
              </p>
              <p>Sua Chave Secreta Ed25519 será processada em memória para restaurar seu inventário, nível e carteira.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-[2px_2px_0px_#000] border-2 border-black flex items-center justify-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? "Validando Chave..." : "Restaurar via Secret Key"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-xs py-2">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-cyan-500/30 space-y-2 text-[11.5px] text-slate-300">
              <p className="flex items-center gap-2 text-cyan-400 font-bold">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Restauração Automática em 1 Clique
              </p>
              <p className="text-slate-400 leading-relaxed">
                Ao autenticar com sua conta Google, identificamos seu herói vinculado e restauramos instantaneamente seu nível, inventário e endereço Stellar on-chain sem necessidade de digitar chaves manuais.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleRecover}
              disabled={isLoading}
              className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-[0_4px_16px_rgba(6,182,212,0.3)] border-2 border-black flex items-center justify-center gap-2 font-mono"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando ao Google...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Recuperar com Google
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
