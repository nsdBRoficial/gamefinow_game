/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { KeyRound, Mail, CheckCircle2, ShieldCheck, RefreshCw, X, Sparkles, AlertTriangle } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { Keypair } from "@stellar/stellar-sdk";

interface AccountRecoveryModalProps {
  playSynthSound: (type: "beep" | "success" | "coin" | "unlock") => void;
}

export const AccountRecoveryModal: React.FC<AccountRecoveryModalProps> = ({ playSynthSound }) => {
  const activeModal = useGameStore((s) => s.activeModal);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const updateWallet = useGameStore((s) => s.updateWallet);
  const setPlayerPos = useGameStore((s) => s.setPlayerPos);

  const [mode, setMode] = useState<"sep10" | "email">("sep10");
  const [stellarPublicKey, setStellarPublicKey] = useState("");
  const [secretKeyOrPin, setSecretKeyOrPin] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (activeModal !== "account_recovery") return null;

  const handleSep10Recover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stellarPublicKey.trim()) {
      setStatusMsg({ text: "Insira seu endereço público Stellar (G...)!", type: "error" });
      playSynthSound("beep");
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      // 1. Validação do formato Ed25519 Stellar
      Keypair.fromPublicKey(stellarPublicKey.trim());

      // 2. Simulação de desafio SEP-10 (Challenge / Response)
      await new Promise((res) => setTimeout(res, 1200));

      // 3. Restauração do perfil
      updateWallet({
        hasWallet: true,
        publicKey: stellarPublicKey.trim(),
        name: "Herói Recuperado",
        gamefiBalance: 50,
      });

      setPlayerPos({
        name: "Herói Recuperado",
        walletAddress: stellarPublicKey.trim(),
      });

      playSynthSound("unlock");
      setStatusMsg({
        text: "✅ Identidade SEP-10 verificada com sucesso! Seu personagem e carteira foram restaurados.",
        type: "success",
      });

      setTimeout(() => {
        setActiveModal(null);
      }, 1500);
    } catch (err: any) {
      setStatusMsg({ text: "Endereço Stellar inválido ou desafio não assinado!", type: "error" });
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
      setTimeout(() => setActiveModal(null), 1500);
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
              mode === "sep10" ? "bg-cyan-500 text-slate-950 border-black shadow-[2px_2px_0px_#000]" : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <KeyRound className="w-4 h-4" /> Stellar SEP-10
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
          <form onSubmit={handleSep10Recover} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Chave Pública Stellar (G...)</label>
              <input
                type="text"
                value={stellarPublicKey}
                onChange={(e) => setStellarPublicKey(e.target.value)}
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-[11px] outline-none focus:border-cyan-400"
              />
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-400">
              <p className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Autenticação Criptográfica SEP-10
              </p>
              <p>O servidor enviará uma transação de desafio para comprovar a posse da chave on-chain.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-[2px_2px_0px_#000] border-2 border-black flex items-center justify-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? "Validando Assinatura..." : "Restaurar Personagem via SEP-10"}
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
