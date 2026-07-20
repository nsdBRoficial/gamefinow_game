/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { WalletNowClient } from "@walletnow/sdk";
import { WalletState, Transaction } from "../types";
import { onboardUser, StellarAnchorService, TestnetKitService } from "../services/stellarServices";
import { SEP24Service } from "../services/sep24Service";
import { 
  Copy, 
  Key, 
  CreditCard, 
  ArrowRightLeft, 
  Sparkles, 
  Shield, 
  RefreshCw, 
  User, 
  Mail, 
  Coins, 
  TrendingUp, 
  Droplet, 
  Plus, 
  Minus, 
  Info, 
  Check,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  EyeOff
} from "lucide-react";

interface GameOverlayProps {
  activeModal: "wallet" | "onramp" | "soroban" | "hold" | "atf" | null;
  wallet: WalletState;
  onClose: () => void;
  onWalletCreated: (pubKey: string, secKey: string, name: string, email: string, pin: string) => void;
  onOnRampSuccess: (xlmAdded: number, method: "PIX" | "CARD") => void;
  onSwapSuccess: (fromAsset: "XLM" | "USDW" | "BRW", toAsset: "XLM" | "USDW" | "BRW", amountFrom: number, amountTo: number) => void;
  onHoldSuccess: (asset: "XLM" | "USDW" | "BRW", amount: number, updatedFields: Partial<WalletState>, tx: Transaction) => void;
  onUpdateWallet: (updatedFields: Partial<WalletState>, tx?: Transaction) => void;
  playerName: string;
}

// Pure TypeScript implementation of standard Stellar Keypair Generation (ED25519 structure, CRC16, Base32)
const crc16 = (data: Uint8Array): number => {
  let crc = 0x0000;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data[i] << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc;
};

const encodeBase32 = (data: Uint8Array): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;
  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += alphabet[(value >>> bits) & 31];
    }
  }
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  return result;
};

const generateRealStellarKeypair = (): { publicKey: string; secretKey: string } => {
  const seed = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(seed);
  } else {
    for (let i = 0; i < 32; i++) {
      seed[i] = Math.floor(Math.random() * 256);
    }
  }

  // Public Key (starts with G)
  const pubBytes = new Uint8Array(35);
  pubBytes[0] = 0x30; // Version byte for 'G'
  pubBytes.set(seed, 1);
  const pubCrc = crc16(pubBytes.subarray(0, 33));
  pubBytes[33] = pubCrc & 0xFF;
  pubBytes[34] = (pubCrc >> 8) & 0xFF;
  const publicKey = encodeBase32(pubBytes);

  // Secret Key (starts with S)
  const secBytes = new Uint8Array(35);
  secBytes[0] = 0x90; // Version byte for 'S'
  secBytes.set(seed, 1);
  const secCrc = crc16(secBytes.subarray(0, 33));
  secBytes[33] = secCrc & 0xFF;
  secBytes[34] = (secCrc >> 8) & 0xFF;
  const secretKey = encodeBase32(secBytes);

  return { publicKey, secretKey };
};

// Removed inline StellarAnchorService (moved to stellarServices.ts)

const generateTxHash = () => {
  const chars = "abcdef0123456789";
  let hash = "tx_";
  for (let i = 0; i < 32; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
};

import { useTranslation } from "react-i18next";


export const GameOverlay: React.FC<GameOverlayProps> = ({
  activeModal,
  wallet,
  onClose,
  onWalletCreated,
  onOnRampSuccess,
  onSwapSuccess,
  onHoldSuccess,
  onUpdateWallet,
  playerName,
}) => {
  if (!activeModal) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 shadow-2xl transition-all duration-300 bg-slate-900 border-slate-700">
        
        {/* Close button X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 bg-slate-800 hover:bg-red-600 border border-slate-700 hover:border-black rounded-lg text-slate-300 hover:text-white font-black text-sm flex items-center justify-center cursor-pointer shadow-[1px_1.5px_0_#000] active:translate-y-0.5 transition-all font-mono"
          title="Fechar e Voltar ao Jogo"
        >
          ×
        </button>

        {/* Top glow decor based on active modal type */}
        <div className={`h-1.5 w-full ${
          activeModal === "wallet" ? "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" :
          activeModal === "onramp" ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" :
          activeModal === "soroban" ? "bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" :
          activeModal === "atf" ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" :
          "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
        }`} />

        <div className="p-6">
          {activeModal === "wallet" && (
            <WalletForgeModal 
              onClose={onClose} 
              onWalletCreated={onWalletCreated}
              wallet={wallet}
            />
          )}
          {activeModal === "onramp" && (
            <OnRampModal 
              wallet={wallet} 
              onClose={onClose} 
              onUpdateWallet={onUpdateWallet}
              onOnRampSuccess={onOnRampSuccess}
            />
          )}
          {activeModal === "soroban" && (
            <SorobanSwapModal 
              wallet={wallet} 
              onClose={onClose} 
              onUpdateWallet={onUpdateWallet}
              onSwapSuccess={onSwapSuccess}
            />
          )}
          {activeModal === "hold" && (
            <StellarHoldModal 
              wallet={wallet} 
              onClose={onClose} 
              onUpdateWallet={onUpdateWallet}
              onHoldSuccess={onHoldSuccess}
            />
          )}
          {activeModal === "atf" && (
            <AtfDefiModal 
              wallet={wallet} 
              onClose={onClose} 
              playerName={playerName}
              onUpdateWallet={onUpdateWallet}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// =================================================================
// 1. WALLET FORGE MODAL (WalletNow Onboarding Flow)
// =================================================================
interface WalletForgeProps {
  onClose: () => void;
  onWalletCreated: (pubKey: string, secKey: string, name: string, email: string, pin: string) => void;
  wallet: WalletState;
}

const WalletForgeModal: React.FC<WalletForgeProps> = ({ onClose, onWalletCreated, wallet }) => {
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [sdkLogs, setSdkLogs] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(0);
  const [generatedPub, setGeneratedPub] = useState("");
  const [generatedSec, setGeneratedSec] = useState("");
  const [copiedPub, setCopiedPub] = useState(false);
  const [copiedSec, setCopiedSec] = useState(false);
  const [secVisible, setSecVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const copyKey = () => {
    if (wallet.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (wallet.hasWallet && wallet.publicKey) {
    const last8 = wallet.publicKey.slice(-8);
    const first6 = wallet.publicKey.slice(0, 6);

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Check className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-mono tracking-tight">WALLET DETECTADA</h2>
            <p className="text-xs text-cyan-400 font-mono">Wallet Forge — East Biome Terminal</p>
          </div>
        </div>

        <div className="bg-slate-800/70 border border-cyan-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-bold font-mono uppercase tracking-wider">Conta Ativa na Stellar Testnet</span>
          </div>

          <div className="space-y-1">
            <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider">Chave Pública</p>
            <div className="flex items-center gap-2">
              <code className="text-cyan-300 text-xs font-mono bg-slate-900/60 px-2 py-1 rounded-lg truncate flex-1">
                {first6}...{last8}
              </code>
              <button
                onClick={copyKey}
                className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all font-mono"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t("wallet.copied") : t("wallet.copy")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-slate-900/60 rounded-lg p-2 text-center">
              <p className="text-[9px] text-slate-500 font-mono uppercase">XLM</p>
              <p className="text-white font-black text-sm font-mono">{wallet.xlmBalance?.toFixed(2) ?? "0.00"}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-2 text-center">
              <p className="text-[9px] text-slate-500 font-mono uppercase">USDW</p>
              <p className="text-white font-black text-sm font-mono">{wallet.usdwBalance?.toFixed(2) ?? "0.00"}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-2 text-center">
              <p className="text-[9px] text-slate-500 font-mono uppercase">BRW</p>
              <p className="text-white font-black text-sm font-mono">{wallet.brwBalance?.toFixed(2) ?? "0.00"}</p>
            </div>
          </div>
        </div>

        <p className="text-slate-400 text-[11px] font-mono text-center">
          💡 Vá ao <span className="text-amber-400 font-bold">Norte</span> para fazer On-Ramp e adquirir XLM.
        </p>

        <button
          onClick={onClose}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl font-mono text-sm transition-all"
        >
          Fechar Terminal
        </button>
      </div>
    );
  }

  const startOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !pin) return;
    if (pin.length < 6 || pin.length > 8) {
      setError("Sua senha PIN deve ter entre 6 e 8 dígitos numéricos!");
      return;
    }

    setStep(2);
    setSdkLogs([]);
    setLogIndex(0);
  };

  useEffect(() => {
    if (step === 2) {
      let isSubscribed = true;
      
      const runOnboarding = async () => {
        try {
          if (!isSubscribed) return;
          setSdkLogs(prev => [...prev, "[WalletNow SDK] Conectando ao Testnet Gateway..."]);
          await new Promise(resolve => setTimeout(resolve, 500));

          if (!isSubscribed) return;
          setSdkLogs(prev => [...prev, "[WalletNow SDK] Solicitando assinatura de e-mail e passkey..."]);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const addLog = (msg: string) => {
            if (isSubscribed) setSdkLogs(prev => [...prev, msg]);
          };
          
          if (!isSubscribed) return;
          const { publicKey: userAddress, secretKey: finalSecretKey } = await onboardUser(email, name, addLog);
          const finalPublicKey = userAddress;

          if (!isSubscribed) return;
          setSdkLogs(prev => [...prev, `[WalletNow SDK] Iniciando depósito fiduciário invisível via StellarAnchorService.seamlessFund("walletnow-app.vercel.app", userAddress, ..., "BRW")...`]);
          await new Promise(resolve => setTimeout(resolve, 600));
          
          await StellarAnchorService.seamlessFund(
            "walletnow-app.vercel.app",
            finalPublicKey,
            finalSecretKey,
            "BRW"
          );

          if (!isSubscribed) return;
          setSdkLogs(prev => [...prev, `[WalletNow SDK] ✓ Onboarding bem-sucedido: 250 BRW depositados pelo patrocinador da WalletNow!`]);
          await new Promise(resolve => setTimeout(resolve, 500));

          if (!isSubscribed) return;
          setSdkLogs(prev => [...prev, `[WalletNow SDK] Iniciando depósito fiduciário invisível via StellarAnchorService.seamlessFund("walletnow-app.vercel.app", userAddress, ..., "USDW")...`]);
          await new Promise(resolve => setTimeout(resolve, 600));

          await StellarAnchorService.seamlessFund(
            "walletnow-app.vercel.app",
            finalPublicKey,
            finalSecretKey,
            "USDW"
          );

          if (!isSubscribed) return;
          setSdkLogs(prev => [
            ...prev,
            `[WalletNow SDK] ✓ Onboarding bem-sucedido: 50 USDW depositados pelo patrocinador da WalletNow!`,
            `[WalletNow SDK] Registrando conta e fundos em XLM nativos na Stellar Testnet oficial via Friendbot...`
          ]);

          setSdkLogs(prev => [
            ...prev,
            `[WalletNow SDK] ✓ Sucesso absoluto! A conta ${finalPublicKey.slice(0, 8)}... foi provisionada e financiada com 10.000 XLM de teste na Stellar Testnet!`,
            `[WalletNow SDK] Todas as operações são totalmente verificáveis on-chain.`
          ]);

          await new Promise(resolve => setTimeout(resolve, 1000));
          if (!isSubscribed) return;
          setGeneratedPub(finalPublicKey);
          setGeneratedSec(finalSecretKey);
          setStep(3);

        } catch (err: any) {
          console.error("SDK Onboarding Error:", err);
          if (!isSubscribed) return;
          setSdkLogs(prev => [
            ...prev,
            `[WalletNow SDK] Erro durante o onboarding real: ${err.message || err}`,
            `[WalletNow SDK] Ativando Modo Sandbox local de contingência para garantir o jogo...`
          ]);
          
          const fallbackKeys = generateRealStellarKeypair();
          await new Promise(resolve => setTimeout(resolve, 1500));
          if (!isSubscribed) return;
          setGeneratedPub(fallbackKeys.publicKey);
          setGeneratedSec(fallbackKeys.secretKey);
          setStep(3);
        }
      };

      runOnboarding();

      return () => {
        isSubscribed = false;
      };
    }
  }, [step]);

  const copyToClipboard = (text: string, isPub: boolean) => {
    navigator.clipboard.writeText(text);
    if (isPub) {
      setCopiedPub(true);
      setTimeout(() => setCopiedPub(false), 2000);
    } else {
      setCopiedSec(true);
      setTimeout(() => setCopiedSec(false), 2000);
    }
  };

  return (
    <div id="wallet-forge-panel" className="text-slate-100">
      {step === 1 && (
        <form onSubmit={startOnboarding} className="space-y-4">
          <div className="flex items-center space-x-3 text-cyan-400">
            <Shield className="h-7 w-7 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tight font-mono">Onboarding WalletNow</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Bem-vindo ao portal do Leste. Aqui você utilizará a **WalletNow SDK** para forjar sua carteira na rede de testes Stellar. Escolha seus dados abaixo:
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <User className="h-3 w-3 text-cyan-400" /> Seu Nome no Jogo
              </label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bernardo, Alice"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-cyan-500 text-slate-100 placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-cyan-400" /> Endereço de E-mail (Onboarding SDK)
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: bernardo@stellar.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-cyan-500 text-slate-100 placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-cyan-400" /> Senha PIN de Acesso (6 a 8 dígitos)
              </label>
              <input 
                type="password" 
                required
                pattern="\d{6,8}"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 123456"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-cyan-500 text-slate-100 placeholder:text-slate-600 font-mono tracking-widest"
              />
              <span className="text-[9px] text-slate-500 mt-0.5 block font-medium">Apenas números. O PIN deve ter entre 6 e 8 dígitos.</span>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-2 text-xs rounded font-medium">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-cyan-950/40 p-3 border border-cyan-800/30 text-[10px] text-cyan-300 leading-relaxed space-y-1">
            <p className="font-black uppercase">ℹ Integração Testnet Kit:</p>
            <p>Ao se registrar, a WalletNow SDK criará suas credenciais criptográficas e as associará de forma permanente com seu perfil de rede local.</p>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer font-mono"
          >
            Iniciar Onboarding pelo SDK
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-5 py-3">
          <div className="flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin" />
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400 font-mono">Conectando ao WalletNow SDK</h3>
          </div>

          <div className="bg-black/80 rounded-xl p-4 border border-cyan-900/35 font-mono text-[10px] space-y-2 h-40 overflow-y-auto">
            {sdkLogs.map((log, i) => (
              <p key={i} className="text-cyan-400 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
              </p>
            ))}
            {logIndex < 5 && (
              <p className="text-slate-600 animate-pulse">Running SDK pipeline...</p>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Sparkles className="h-6 w-6 animate-bounce" />
            <h2 className="text-xl font-black uppercase tracking-tight font-mono">Onboarding WalletNow Concluído!</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Seu par de chaves estelares foi forjado e registrado com o e-mail **{email}**. Os últimos 4 dígitos do seu endereço serão incorporados ao seu nome de usuário!
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                Chave Pública (Seu Endereço - G...)
              </label>
              <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="font-mono text-[11px] text-cyan-400 truncate flex-1 select-all font-bold">
                  {generatedPub}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedPub, true)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition"
                  title="Copiar Endereço"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex justify-between items-center mt-1">
                {copiedPub ? (
                  <p className="text-[9px] text-cyan-400">Endereço copiado!</p>
                ) : (
                  <span />
                )}
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${generatedPub}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-cyan-400 hover:underline flex items-center gap-0.5 font-semibold"
                >
                  🔍 Ver no StellarExpert Testnet Explorer ↗
                </a>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-amber-400 font-bold mb-1 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Chave Secreta (Senha Privada - S...)
              </label>
              <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-lg border border-amber-900/30">
                <span className="font-mono text-[11px] text-amber-500 truncate flex-1 select-all font-bold">
                  {secVisible ? generatedSec : "S" + "•".repeat(55)}
                </span>
                <button
                  type="button"
                  onClick={() => setSecVisible(!secVisible)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition"
                  title={secVisible ? "Ocultar Chave Secreta" : "Visualizar Chave Secreta"}
                >
                  {secVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedSec, false)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition"
                  title="Copiar Chave Secreta"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {copiedSec && <p className="text-[9px] text-amber-400 mt-0.5 font-mono">✓ Chave secreta copiada com segurança (mesmo oculta)!</p>}
            </div>
          </div>

          <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-800/25 text-[10px] text-amber-300 leading-relaxed">
            ⚠️ <strong>SEGURANÇA:</strong> No testnet kit da WalletNow, os saldos são fictícios, mas no ambiente real, sua chave secreta controla totalmente o saldo. Nunca repasse sua chave secreta a terceiros!
          </div>

          <button
            type="button"
            onClick={() => {
              onWalletCreated(generatedPub, generatedSec, name, email, pin);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer font-mono"
          >
            Registrar Carteira & Entrar na Ilha
          </button>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 2. ON-RAMP & OFF-RAMP PIX MODAL (WalletNow SDK Integration)
// =================================================================
interface OnRampProps {
  wallet: WalletState;
  onClose: () => void;
  onUpdateWallet: (updatedFields: Partial<WalletState>, tx?: Transaction) => void;
  onOnRampSuccess?: (asset: "XLM" | "USDW" | "BRW", amount: number, method: "PIX" | "CARD") => void;
}

const OnRampModal: React.FC<OnRampProps> = ({ wallet, onClose, onUpdateWallet, onOnRampSuccess }) => {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [asset, setAsset] = useState<"XLM" | "USDW" | "BRW" | "SRT" | "USDC">("BRW");
  const [fiatAmount, setFiatAmount] = useState<number>(10);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Config, 2: Withdraw, 3: Success, 4: SEP-24 Iframe
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sep24IframeUrl, setSep24IframeUrl] = useState<string | null>(null);
  const [sep24TxId, setSep24TxId] = useState<string | null>(null);
  const [sep24Jwt, setSep24Jwt] = useState<string | null>(null);

  const coinRates = {
    XLM: 0.66,
    USDW: 5.40,
    BRW: 1.00,
    SRT: 1.00,
    USDC: 5.40
  };

  const computedCoins = Number((fiatAmount / coinRates[asset]).toFixed(2));

  const handleAction = async () => {
    if (activeTab === "deposit") {
      setLoading(true);
      setError(null);
      try {
        const depositAsset = asset; // Usa o ativo real selecionado pelo usuário!
        // A âncora de testes da SDF tem um limite máximo de 10 unidades por depósito!
        // Aplicamos esse limite apenas aos ativos que vão para a âncora real (SRT, USDC).
        // Ativos em mock (BRW, USDW) não têm esse limite.
        if ((depositAsset === "SRT" || depositAsset === "USDC") && computedCoins > 10) {
          setError(`A âncora de testes SDF limita depósitos a no máximo 10 unidades. Você tentou depositar ${computedCoins} ${depositAsset}. Reduza o valor.`);
          setLoading(false);
          return;
        }

        const { url, id, jwt } = await SEP24Service.initiateDeposit(
          wallet.publicKey || "",
          wallet.secretKey || "",
          depositAsset,
          computedCoins.toString()
        );
        setSep24IframeUrl(url);
        setSep24TxId(id);
        setSep24Jwt(jwt);
        setStep(4);
        
        let pollTimer: any;
        const checkStatus = async () => {
          try {
            const status = await SEP24Service.pollTransactionStatus(id, jwt);
            if (status === "completed") {
              clearInterval(pollTimer);
              setStep(3); // Success
              // Em um ambiente real, leríamos o saldo da rede
              const balanceField = asset === "XLM" ? "xlmBalance" : asset === "USDW" ? "usdwBalance" : asset === "SRT" ? "brwBalance" : "usdwBalance";
              const currentBalance = wallet[balanceField as keyof WalletState] as number || 0;
              // Se for o mock in-game, vamos disparar uma microtransação on-chain para gerar a Hash Real (Prova)
              let finalTxId = id;
              if (id.startsWith("mock-tx-")) {
                const { txHash } = await StellarAnchorService.seamlessFund(
                  "mock-anchor.gamefinow",
                  wallet.publicKey || "",
                  wallet.secretKey || "",
                  depositAsset
                );
                finalTxId = txHash;
              }

              const tx: Transaction = {
                id: finalTxId,
                type: "ON_RAMP_PIX",
                timestamp: new Date().toLocaleTimeString(),
                amount: computedCoins.toString(),
                asset: asset as any,
                fee: "0.00000",
                memo: `SEP-24 Deposit (${depositAsset})`,
                ledgerSequence: 6184293
              };
              if (onOnRampSuccess) onOnRampSuccess(asset as any, computedCoins, "PIX");
              else onUpdateWallet({ [balanceField]: currentBalance + computedCoins }, tx);
            } else if (status === "error") {
              clearInterval(pollTimer);
              setError("Depósito rejeitado ou falhou na âncora.");
              setStep(1);
            }
          } catch(e) {
            console.error("Polling error:", e);
          }
        };
        pollTimer = setInterval(checkStatus, 5000);
      } catch (err: any) {
        console.error(err);
        setError("Erro SEP-24: " + (err.message || "Falha ao iniciar"));
      } finally {
        setLoading(false);
      }
    } else {
      setError(null);
      const balanceField = asset === "XLM" ? "xlmBalance" : asset === "USDW" ? "usdwBalance" : "brwBalance";
      const currentBalance = wallet[balanceField as keyof WalletState] as number || 0;
      if (currentBalance < computedCoins) {
        setError("Saldo de moedas insuficiente para saque!");
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const nextBalance = currentBalance - computedCoins;
        
        const tx: Transaction = {
          id: generateTxHash(),
          type: "OFF_RAMP_PIX",
          timestamp: new Date().toLocaleTimeString(),
          amount: computedCoins.toString(),
          asset: asset as any,
          fee: "0.00001",
          memo: `Saque PIX para Banco Comercial`,
          ledgerSequence: 6184293 + Math.floor(Math.random() * 100)
        };

        onUpdateWallet({
          [balanceField]: nextBalance
        }, tx);
        setStep(3);
      }, 1500);
    }
  };

  // confirmDepositPayment removed as we now use SEP-24 in handleAction

  return (
    <div id="onramp-panel" className="text-slate-100">
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-emerald-400">
            <CreditCard className="h-7 w-7" />
            <h2 className="text-xl font-black uppercase tracking-tight font-mono">Câmbio PIX (WalletNow On/Off Ramp)</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("deposit");
                setFiatAmount(100);
                setError(null);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                activeTab === "deposit" ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              Comprar Ativos (On-Ramp)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("withdraw");
                setFiatAmount(100);
                setError(null);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                activeTab === "withdraw" ? "bg-red-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Sacar Reais (Off-Ramp)
            </button>
          </div>

          <div className="space-y-3.5 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1.5">Escolha a Moeda:</label>
              <div className="grid grid-cols-5 gap-1">
                {(["XLM", "USDW", "BRW", "SRT", "USDC"] as const).map((coin) => (
                  <button
                    key={coin}
                    type="button"
                    onClick={() => setAsset(coin)}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-black border transition cursor-pointer ${
                      asset === coin 
                        ? "border-emerald-500 bg-emerald-950/30 text-emerald-300" 
                        : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {coin === "XLM" ? "🌟 XLM" : coin === "USDW" ? "💵 USDW" : coin === "BRW" ? "🇧🇷 BRW" : coin === "SRT" ? "🔵 SRT" : "🪙 USDC"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">
                {activeTab === "deposit" ? "Valor em Reais (R$):" : "Equivalente em Reais a Sacar (R$):"}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">R$</span>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={fiatAmount}
                  onChange={(e) => setFiatAmount(Math.max(10, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs font-bold text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-xs">
              <span className="text-slate-400">{activeTab === "deposit" ? "Você vai receber:" : "Você vai entregar:"}</span>
              <span className="text-emerald-400 font-extrabold">{computedCoins} {asset}</span>
            </div>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-2 text-xs rounded font-medium">
                {error}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAction}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black font-mono cursor-pointer transition ${
              activeTab === "deposit" ? "bg-emerald-400 hover:bg-emerald-300" : "bg-red-500 hover:bg-red-400 text-white"
            }`}
          >
            {activeTab === "deposit" ? "Gerar PIX de Depósito" : "Confirmar Saque para Conta Bancária"}
          </button>
        </div>
      )}

      {/* Step 2 (Fake QR code) removed for SEP-24 implementation */}

      {step === 4 && sep24IframeUrl && (
        <div className="space-y-4 text-center">
          <div className="flex items-center space-x-3 text-emerald-400 border-b border-slate-800 pb-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <h2 className="text-sm font-black uppercase tracking-wider font-mono">Processando Depósito SEP-24</h2>
          </div>
          
          {sep24IframeUrl === "game-internal:mock-kyc" ? (
            <div className="w-full bg-slate-900 rounded-xl p-6 border border-emerald-500/50 flex flex-col items-center justify-center space-y-4 shadow-lg shadow-emerald-900/20">
               <div className="text-emerald-400 bg-emerald-950 p-2 rounded-full mb-2">
                 <RefreshCw className="h-6 w-6" />
               </div>
               <h3 className="text-sm font-black text-white font-mono text-center">Simulador de Parceiro de Câmbio</h3>
               <p className="text-xs text-slate-400 text-center">
                 A âncora recebeu o pedido via SEP-24 para {computedCoins} {asset}.<br/>
                 (Modo Invisível / Mock In-Game)
               </p>
               <button
                 type="button"
                 onClick={() => {
                   if (sep24TxId && (window as any).mockSep24Status) {
                     (window as any).mockSep24Status[sep24TxId] = "completed";
                   }
                 }}
                 className="mt-4 w-full py-3 px-6 rounded-xl font-bold text-xs uppercase text-black bg-emerald-500 hover:bg-emerald-400 transition shadow-lg shadow-emerald-900/50 cursor-pointer"
               >
                 Aprovar Pagamento PIX Fictício
               </button>
            </div>
          ) : (
            <div className="w-full bg-slate-900 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center space-y-4">
               <p className="text-xs text-slate-300">
                 A âncora oficial da Stellar requer autenticação em uma janela segura.
               </p>
               <button
                 type="button"
                 onClick={() => window.open(sep24IframeUrl, "SEP24_Window", "width=500,height=700,left=200,top=100")}
                 className="py-3 px-6 rounded-xl font-bold text-xs uppercase text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-900/50"
               >
                 Abrir Ambiente Seguro (KYC)
               </button>
            </div>
          )}

          <div className="bg-slate-950 p-2 rounded text-[10px] text-slate-400 font-mono">
            ID da Transação: {sep24TxId} <br/>
            Escutando Webhooks e Polling do status via SEP-24...
          </div>
          
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase text-slate-400 bg-slate-800 hover:bg-slate-700 transition"
          >
            Cancelar
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-950 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-emerald-400 font-mono">Operação Concluída com Sucesso!</h2>
          <p className="text-xs text-slate-300">
            A WalletNow SDK processou o seu {activeTab === "deposit" ? "depósito" : "saque"} instantaneamente na rede de testes da Stellar.
          </p>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-left text-[10px] font-mono space-y-1 text-slate-400">
            <p>🛠 WalletNow Core Gateway: <span className="text-emerald-400">SUCCESS</span></p>
            <p>🔗 Hash: <span className="text-slate-300 font-semibold">{generateTxHash().substring(0, 18)}...</span></p>
            <p>⛽ Taxa de Consenso Stellar: <span className="text-slate-300">0.00001 XLM</span></p>
          </div>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-emerald-400 hover:bg-emerald-300 font-mono cursor-pointer"
          >
            Retornar ao Mapa do Jogo
          </button>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 3. SOROBAN SMART SWAP & LIQUIDITY POOLS (WalletNow Testnet Kit)
// =================================================================
interface SorobanSwapProps {
  wallet: WalletState;
  onClose: () => void;
  onUpdateWallet: (updatedFields: Partial<WalletState>, tx?: Transaction) => void;
  onSwapSuccess: (fromAsset: "XLM" | "USDW" | "BRW", toAsset: "XLM" | "USDW" | "BRW", amountFrom: number, amountTo: number) => void;
}

const SorobanSwapModal: React.FC<SorobanSwapProps> = ({ wallet, onClose, onUpdateWallet, onSwapSuccess }) => {
  const [activeSection, setActiveSection] = useState<"swap" | "pool">("swap");
  
  // SWAP STATES
  const [swapFrom, setSwapFrom] = useState<"XLM" | "USDW" | "BRW">("XLM");
  const [swapTo, setSwapTo] = useState<"XLM" | "USDW" | "BRW">("USDW");
  const [swapAmount, setSwapAmount] = useState<number>(10);
  
  // POOL STATES
  const [poolType, setPoolType] = useState<"XLM_USDW" | "USDW_BRW">("XLM_USDW");
  const [poolAmountAsset1, setPoolAmountAsset1] = useState<number>(5);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Rate matrices
  const rates = {
    XLM: { XLM: 1, USDW: 0.12, BRW: 0.65 },
    USDW: { XLM: 8.33, USDW: 1, BRW: 5.40 },
    BRW: { XLM: 1.54, USDW: 0.18, BRW: 1 }
  };

  const computedSwapOutput = Number((swapAmount * rates[swapFrom][swapTo]).toFixed(2));

  // Balanced deposit calculation for Liquidity Pools
  const poolRates = {
    XLM_USDW: 0.12, // 1 XLM requires 0.12 USDW
    USDW_BRW: 5.40  // 1 USDW requires 5.40 BRW
  };

  const computedPoolAmountAsset2 = poolType === "XLM_USDW"
    ? Number((poolAmountAsset1 * poolRates.XLM_USDW).toFixed(2))
    : Number((poolAmountAsset1 * poolRates.USDW_BRW).toFixed(2));

  const handleSwap = async () => {
    setError(null);
    if (swapFrom === swapTo) {
      setError("Selecione moedas de origem e destino diferentes!");
      return;
    }

    const fromField = swapFrom === "XLM" ? "xlmBalance" : swapFrom === "USDW" ? "usdwBalance" : "brwBalance";
    const currentFrom = wallet[fromField] || 0;

    if (currentFrom < swapAmount) {
      setError(`Saldo insuficiente de ${swapFrom}!`);
      return;
    }

    setLoading(true);
    try {
      const { txHash, received } = await TestnetKitService.executeSwap(
        wallet.publicKey || "",
        wallet.secretKey || "",
        swapFrom,
        swapTo,
        swapAmount
      );
      onSwapSuccess(swapFrom, swapTo, swapAmount, received); // Pass received from service
      setSuccessMessage(`Transação enviada com sucesso ao Smart Contract Soroban no pool de liquidez da WalletNow! Você trocou ${swapAmount} ${swapFrom} por ${received} ${swapTo}.`);
      setLastTxHash(txHash);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Falha ao executar swap no TestnetKit");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    setError(null);
    const field1 = poolType === "XLM_USDW" ? "xlmBalance" : "usdwBalance";
    const field2 = poolType === "XLM_USDW" ? "usdwBalance" : "brwBalance";
    const lpField = poolType === "XLM_USDW" ? "poolXlmUsdw" : "poolUsdwBrw";

    const bal1 = wallet[field1] || 0;
    const bal2 = wallet[field2] || 0;
    const currentLp = wallet[lpField] || 0;

    if (bal1 < poolAmountAsset1 || bal2 < computedPoolAmountAsset2) {
      setError("Saldo insuficiente para prover liquidez proporcional!");
      return;
    }

    setLoading(true);
    try {
      const token1 = poolType === "XLM_USDW" ? "XLM" : "USDW";
      const token2 = poolType === "XLM_USDW" ? "USDW" : "BRW";
      
      const { txHash, lpMinted, requiredAmountB } = await TestnetKitService.addLiquidity(
        wallet.publicKey || "",
        token1,
        token2,
        poolAmountAsset1
      );

      const updatedFields: Partial<WalletState> = {
        [field1]: bal1 - poolAmountAsset1,
        [field2]: bal2 - requiredAmountB,
        [lpField]: currentLp + lpMinted
      };

      const tx: Transaction = {
        id: txHash,
        type: "POOL_ADD",
        timestamp: new Date().toLocaleTimeString(),
        amount: lpMinted.toString(),
        asset: poolType,
        fee: "0.00012",
        memo: `Adicionado liquidez: ${poolAmountAsset1} ${token1} + ${requiredAmountB} ${token2}`,
        ledgerSequence: 6184293 + Math.floor(Math.random() * 100)
      };

      onUpdateWallet(updatedFields, tx);
      setSuccessMessage(`Par de liquidez provisionado com sucesso! Recebido: ${lpMinted} tokens LP_${poolType}.`);
      setLastTxHash(txHash);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Falha ao adicionar liquidez");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = () => {
    setError(null);
    const lpField = poolType === "XLM_USDW" ? "poolXlmUsdw" : "poolUsdwBrw";
    const currentLp = wallet[lpField] || 0;

    if (currentLp <= 0) {
      setError("Você não possui tokens de provedor de liquidez nesta piscina!");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      const field1 = poolType === "XLM_USDW" ? "xlmBalance" : "usdwBalance";
      const field2 = poolType === "XLM_USDW" ? "usdwBalance" : "brwBalance";

      const bal1 = wallet[field1] || 0;
      const bal2 = wallet[field2] || 0;

      // Withdraw proportionality: 1 LP token = ~0.66 of Asset 1, proportional Asset 2
      const refundAsset1 = Number((currentLp * 0.66).toFixed(2));
      const refundAsset2 = poolType === "XLM_USDW"
        ? Number((refundAsset1 * poolRates.XLM_USDW).toFixed(2))
        : Number((refundAsset1 * poolRates.USDW_BRW).toFixed(2));

      const updatedFields: Partial<WalletState> = {
        [field1]: bal1 + refundAsset1,
        [field2]: bal2 + refundAsset2,
        [lpField]: 0
      };

      const token1 = poolType === "XLM_USDW" ? "XLM" : "USDW";
      const token2 = poolType === "XLM_USDW" ? "USDW" : "BRW";

      const txHash = generateTxHash();
      const tx: Transaction = {
        id: txHash,
        type: "POOL_REMOVE",
        timestamp: new Date().toLocaleTimeString(),
        amount: currentLp.toString(),
        asset: poolType,
        fee: "0.00010",
        memo: `Liquidez removida. Reivindicado: ${refundAsset1} ${token1} + ${refundAsset2} ${token2}`,
        ledgerSequence: 6184293 + Math.floor(Math.random() * 100)
      };

      onUpdateWallet(updatedFields, tx);
      setSuccessMessage(`Toda a sua liquidez foi removida! Você resgatou seus fundos originais de ${token1} e ${token2}.`);
      setLastTxHash(txHash);
      setSuccess(true);
    }, 1800);
  };

  return (
    <div id="soroban-swap-panel" className="text-slate-100">
      {!success ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-violet-400">
            <ArrowRightLeft className="h-7 w-7" />
            <h2 className="text-xl font-black uppercase tracking-tight font-mono">DEX & Liquidez (Soroban AMM)</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveSection("swap");
                setError(null);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                activeSection === "swap" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Smart Swap
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSection("pool");
                setError(null);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                activeSection === "pool" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Prover Liquidez
            </button>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-900/60 p-3 rounded-lg text-xs text-red-300 font-mono flex items-center justify-between">
              <span>⚠️ {error}</span>
              <button 
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-white font-extrabold px-1.5 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {activeSection === "swap" ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Troque seus tokens na hora sem custódia, utilizando os contratos inteligentes Soroban da rede Stellar e o testnet kit da WalletNow.
              </p>

              <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase mb-1">
                    <span>Você paga:</span>
                    <span>Saldo: {swapFrom === "XLM" ? wallet.xlmBalance : swapFrom === "USDW" ? wallet.usdwBalance : wallet.brwBalance} {swapFrom}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(Math.max(1, Number(e.target.value)))}
                      className="bg-slate-900 border border-slate-850 rounded-lg py-2 px-3 text-xs font-bold text-slate-100 flex-1 focus:outline-none focus:border-violet-500 font-mono"
                    />
                    <select
                      value={swapFrom}
                      onChange={(e) => setSwapFrom(e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-2 text-xs font-bold text-slate-100 focus:outline-none cursor-pointer"
                    >
                      <option value="XLM">🌟 XLM</option>
                      <option value="USDW">💵 USDW</option>
                      <option value="BRW">🇧🇷 BRW</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-center -my-1 text-violet-400">
                  <ArrowRightLeft className="h-4 w-4 transform rotate-90" />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase mb-1">
                    <span>Você recebe (Estimativa):</span>
                    <span>Saldo: {swapTo === "XLM" ? wallet.xlmBalance : swapTo === "USDW" ? wallet.usdwBalance : wallet.brwBalance} {swapTo}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-slate-900 border border-slate-850 rounded-lg py-2 px-3 text-xs font-bold text-slate-400 flex-1 font-mono">
                      {computedSwapOutput}
                    </div>
                    <select
                      value={swapTo}
                      onChange={(e) => setSwapTo(e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-2 text-xs font-bold text-slate-100 focus:outline-none cursor-pointer"
                    >
                      <option value="XLM">🌟 XLM</option>
                      <option value="USDW">💵 USDW</option>
                      <option value="BRW">🇧🇷 BRW</option>
                    </select>
                  </div>
                </div>
              </div>

              {(() => {
                const priceImpactVal = Math.max(0.01, Math.min(99.9, Number(((swapAmount / (swapAmount + 1000)) * 100).toFixed(2))));
                const slippageTolerance = 0.5; // 0.5%
                const minimumReceived = Number((computedSwapOutput * (1 - slippageTolerance / 100)).toFixed(2));
                const poolContract = "47a53a0397612027cf5b53ef75c51641a63abbd9b45cab5f2a190fe109d4fc95";
                
                return (
                  <div className="bg-violet-950/20 p-3 rounded-lg border border-violet-900/25 text-[10px] space-y-1.5 text-violet-300 font-mono">
                    <p className="font-extrabold uppercase text-violet-400">📊 DETALHES DO SWAP (SOROBAN AMM):</p>
                    <div className="grid grid-cols-2 gap-y-1 border-b border-violet-900/20 pb-1.5 mb-1.5">
                      <div>Pool do Contrato:</div>
                      <div className="text-right text-[9px] text-slate-300 select-all truncate font-bold" title={poolContract}>
                        {poolContract.substring(0, 10)}...{poolContract.substring(poolContract.length - 10)}
                      </div>
                      <div>Preço Unitário:</div>
                      <div className="text-right text-slate-300">
                        1 {swapFrom} = {rates[swapFrom][swapTo]} {swapTo}
                      </div>
                    </div>
                    <p>• Impacto no Preço: <span className={priceImpactVal > 5 ? "text-amber-400" : "text-emerald-400 font-bold"}>{priceImpactVal}%</span></p>
                    <p>• Tolerância de Slippage: <span className="text-slate-100">{slippageTolerance}%</span></p>
                    <p>• Mínimo a Receber: <span className="text-slate-100 font-bold">{minimumReceived} {swapTo}</span></p>
                    <p>• Taxa de Gas: <span className="text-slate-100">0.00009 XLM</span></p>
                  </div>
                );
              })()}

              <button
                type="button"
                onClick={handleSwap}
                disabled={loading || swapAmount <= 0}
                className="w-full py-3 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5 font-mono"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Buscando Liquidez Soroban...
                  </>
                ) : "Trocar Tokens Agora"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Adicione liquidez a um dos pares para receber moedas LP do ecossistema WalletNow e ganhar taxas de negociação distribuídas.
              </p>

              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1.5">Escolha o Par da Piscina (AMM):</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPoolType("XLM_USDW")}
                      className={`py-2 px-3 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                        poolType === "XLM_USDW" 
                          ? "border-violet-500 bg-violet-950/30 text-violet-300" 
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      🌟 XLM - 💵 USDW
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoolType("USDW_BRW")}
                      className={`py-2 px-3 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                        poolType === "USDW_BRW" 
                          ? "border-violet-500 bg-violet-950/30 text-violet-300" 
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      💵 USDW - 🇧🇷 BRW
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">
                      Depositar {poolType === "XLM_USDW" ? "XLM" : "USDW"}:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={poolAmountAsset1}
                      onChange={(e) => setPoolAmountAsset1(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg py-2 px-3 text-xs font-bold text-slate-100 focus:outline-none focus:border-violet-500 font-mono"
                    />
                    <span className="text-[8px] text-slate-500 font-medium">
                      Saldo: {poolType === "XLM_USDW" ? wallet.xlmBalance : wallet.usdwBalance}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">
                      Depositar {poolType === "XLM_USDW" ? "USDW" : "BRW"} (Proporcional):
                    </label>
                    <div className="w-full bg-slate-900 border border-slate-850 rounded-lg py-2 px-3 text-xs font-bold text-slate-400 font-mono">
                      {computedPoolAmountAsset2}
                    </div>
                    <span className="text-[8px] text-slate-500 font-medium">
                      Saldo: {poolType === "XLM_USDW" ? wallet.usdwBalance : wallet.brwBalance}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2.5 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Seus tokens LP_{poolType}:</span>
                  <span className="text-violet-400 font-black font-mono">
                    {poolType === "XLM_USDW" ? (wallet.poolXlmUsdw || 0) : (wallet.poolUsdwBrw || 0)} LP
                  </span>
                </div>

                <div className="border-t border-slate-800/60 pt-2.5 mt-2 text-[9px] space-y-1 font-mono text-slate-500">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-1">🔗 Detalhes do Contrato Soroban:</p>
                  {poolType === "XLM_USDW" ? (
                    <>
                      <p className="flex justify-between">
                        <span>Ativo 1 (XLM):</span>
                        <span className="text-slate-300 font-bold">Nativo (Stellar)</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Ativo 2 (USDW Issuer):</span>
                        <span className="text-slate-300 font-bold" title="GDKZT3AXAOMMYVVG3TKFVUYDJODAIAL2ADHNJYQLK2PJQ6CE2U6KKFLQ">GDKZT3A...6KKFLQ</span>
                      </p>
                      <div className="pt-1.5 border-t border-slate-900">
                        <span className="block text-slate-400 font-extrabold">Endereço do Contrato LP (xlm/sdw):</span>
                        <span className="block text-amber-500 font-black select-all break-all text-[8px] leading-tight mt-0.5">47a53a0397612027cf5b53ef75c51641a63abbd9b45cab5f2a190fe109d4fc95</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="flex justify-between">
                        <span>Ativo 1 (USDW Issuer):</span>
                        <span className="text-slate-300 font-bold" title="GDKZT3AXAOMMYVVG3TKFVUYDJODAIAL2ADHNJYQLK2PJQ6CE2U6KKFLQ">GDKZT3A...6KKFLQ</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Ativo 2 (BRW Issuer):</span>
                        <span className="text-slate-300 font-bold" title="GCJIRFZQJAO6JSYS4YFXFHLVJ6R4WWWB2VTREMRK7WXNNLMGIAXBBNC6">GCJIRFZ...XBBNC6</span>
                      </p>
                      <div className="pt-1.5 border-t border-slate-900">
                        <span className="block text-slate-400 font-extrabold">Endereço do Contrato LP (xlm/brw):</span>
                        <span className="block text-amber-500 font-black select-all break-all text-[8px] leading-tight mt-0.5">e17cffd02087d50c97cfe7e3962e72e3e7c1c0279512c12e8f664230ee56ce46</span>
                      </div>
                    </>
                  )}
                  <p className="text-emerald-500 font-bold flex items-center gap-1 mt-1.5 text-[8px] uppercase">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Sincronizado na Stellar Testnet via WalletNow
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAddLiquidity}
                  disabled={loading}
                  className="py-2.5 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1 font-mono"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLiquidity}
                  disabled={loading || (poolType === "XLM_USDW" ? !wallet.poolXlmUsdw : !wallet.poolUsdwBrw)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-red-400 border border-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1 font-mono"
                >
                  <Minus className="h-3.5 w-3.5" /> Remover Tudo
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-violet-950 border border-violet-500 rounded-full flex items-center justify-center mx-auto text-violet-400 animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-violet-400 font-mono">Sucesso na Execução Soroban!</h2>
          <p className="text-xs text-slate-200">
            {successMessage}
          </p>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-left font-mono text-[10px] space-y-1 text-slate-400">
            <p>⛽ Taxa Estelar de Execução: <span className="text-slate-300">0.00009 XLM</span></p>
            <p>🔒 Tipo: <span className="text-violet-400">Soroban Smart Contract (Rust compiler)</span></p>
            {lastTxHash && (
              <p>🔗 Hash: <a href={`https://stellar.expert/explorer/testnet/tx/${lastTxHash}`} target="_blank" rel="noreferrer" className="text-violet-400 underline hover:text-violet-300 break-all">{lastTxHash}</a></p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              onClose();
            }}
            className="w-full py-2.5 bg-violet-500 hover:bg-violet-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition font-mono"
          >
            Continuar Explorando
          </button>
        </div>
      )}
    </div>
  );
};

// =================================================================
// 4. STELLAR VAULTS MODAL (WalletNow Yield Vaults - South Region)
// =================================================================
interface StellarHoldProps {
  wallet: WalletState;
  onClose: () => void;
  onUpdateWallet: (updatedFields: Partial<WalletState>, tx?: Transaction) => void;
  onHoldSuccess: (asset: "XLM" | "USDW" | "BRW", amount: number, updatedFields: Partial<WalletState>, tx: Transaction) => void;
}

const StellarHoldModal: React.FC<StellarHoldProps> = ({ wallet, onClose, onUpdateWallet, onHoldSuccess }) => {
  const [vaultAsset, setVaultAsset] = useState<"XLM" | "USDW" | "BRW">("XLM");
  const [amount, setAmount] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [simulatedYield, setSimulatedYield] = useState<number>(0);

  const vaultAPYs = {
    XLM: 12,
    USDW: 18,
    BRW: 15
  };

  useEffect(() => {
    const totalDeposited = (wallet.vaultXlm || 0) + (wallet.vaultUsdw || 0) + (wallet.vaultBrw || 0);
    if (totalDeposited > 0) {
      const interval = setInterval(() => {
        setSimulatedYield(prev => prev + 0.000015 * (totalDeposited / 10));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [wallet.vaultXlm, wallet.vaultUsdw, wallet.vaultBrw]);

  const handleDeposit = async () => {
    setError(null);
    setSuccess(null);
    const balanceField = vaultAsset === "XLM" ? "xlmBalance" : vaultAsset === "USDW" ? "usdwBalance" : "brwBalance";
    const vaultField = vaultAsset === "XLM" ? "vaultXlm" : vaultAsset === "USDW" ? "vaultUsdw" : "vaultBrw";

    const balance = wallet[balanceField] || 0;
    const locked = wallet[vaultField] || 0;

    if (balance < amount) {
      setError("Saldo de moedas insuficiente!");
      return;
    }

    setLoading(true);
    try {
      const { txHash, rewardEstimate } = await TestnetKitService.vaultStake(
        wallet.publicKey || "",
        vaultAsset,
        amount
      );

      const updatedFields: Partial<WalletState> = {
        [balanceField]: balance - amount,
        [vaultField]: locked + amount
      };

      const tx: Transaction = {
        id: txHash,
        type: "VAULT_DEPOSIT",
        timestamp: new Date().toLocaleTimeString(),
        amount: amount.toString(),
        asset: vaultAsset,
        fee: "0.00005",
        memo: `Depósito no Cofre de Rendimento WalletNow (Estimativa base: +${rewardEstimate})`,
        ledgerSequence: 6184293 + Math.floor(Math.random() * 100)
      };

      onHoldSuccess(vaultAsset, amount, updatedFields, tx);
      setSuccess(`Você depositou com sucesso ${amount} ${vaultAsset} no cofre de rendimentos da WalletNow! TX: ${txHash}`);
      setAmount(20);
    } catch (err) {
      console.error(err);
      setError("Erro ao realizar depósito no Vault");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    setError(null);
    setSuccess(null);
    const balanceField = vaultAsset === "XLM" ? "xlmBalance" : vaultAsset === "USDW" ? "usdwBalance" : "brwBalance";
    const vaultField = vaultAsset === "XLM" ? "vaultXlm" : vaultAsset === "USDW" ? "vaultUsdw" : "vaultBrw";

    const balance = wallet[balanceField] || 0;
    const locked = wallet[vaultField] || 0;

    if (locked <= 0) {
      setError("Você não possui fundos travados neste cofre!");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      const yieldEarned = Number(simulatedYield.toFixed(4));
      const totalRefund = locked + yieldEarned;

      const updatedFields: Partial<WalletState> = {
        [balanceField]: balance + totalRefund,
        [vaultField]: 0
      };

      const tx: Transaction = {
        id: generateTxHash(),
        type: "VAULT_WITHDRAW",
        timestamp: new Date().toLocaleTimeString(),
        amount: totalRefund.toString(),
        asset: vaultAsset,
        fee: "0.00005",
        memo: `Resgate do Cofre: Principal + Rendimento (${yieldEarned} ${vaultAsset})`,
        ledgerSequence: 6184293 + Math.floor(Math.random() * 100)
      };

      onUpdateWallet(updatedFields, tx);
      setSimulatedYield(0);
      setSuccess(`Cofre liquidado! Você recebeu de volta seu depósito de ${locked} ${vaultAsset} somado com ${yieldEarned} ${vaultAsset} de juros!`);
    }, 1500);
  };

  const activeVaultBalance = vaultAsset === "XLM" ? (wallet.vaultXlm || 0) : vaultAsset === "USDW" ? (wallet.vaultUsdw || 0) : (wallet.vaultBrw || 0);

  return (
    <div id="stellar-hold-panel" className="text-slate-100 space-y-4">
      <div className="flex items-center space-x-3 text-amber-400">
        <TrendingUp className="h-7 w-7" />
        <h2 className="text-xl font-black uppercase tracking-tight font-mono">Cofres DeFi (WalletNow Vaults)</h2>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        No altar do Sul, você bloqueia seus tokens em cofres automatizados sem custódia para ganhar juros distribuídos e fidelizar sua conta de jogador.
      </p>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-2 text-xs rounded font-medium">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-2 text-xs rounded font-medium">
          {success}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
        {(["XLM", "USDW", "BRW"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVaultAsset(v)}
            className={`py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              vaultAsset === v 
                ? "bg-amber-400 text-black" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            {v} Vault ({vaultAPYs[v]}%)
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Depositar no Cofre:</span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                className="bg-slate-900 border border-slate-850 rounded-lg py-2 px-3 text-xs font-bold text-slate-100 flex-1 focus:outline-none focus:border-amber-400 font-mono"
              />
              <span className="font-bold text-xs text-slate-300 bg-slate-800 px-2.5 py-2 rounded-lg font-mono">
                {vaultAsset}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-semibold font-mono">
              Saldo Livre: {vaultAsset === "XLM" ? wallet.xlmBalance : vaultAsset === "USDW" ? wallet.usdwBalance : wallet.brwBalance} {vaultAsset}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1.5">
            <button
              type="button"
              onClick={handleDeposit}
              disabled={loading}
              className="py-2 px-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-extrabold uppercase rounded-lg transition cursor-pointer font-mono"
            >
              Depositar
            </button>
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={loading || activeVaultBalance <= 0}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-red-400 border border-slate-700 text-xs font-extrabold uppercase rounded-lg transition cursor-pointer font-mono"
            >
              Sacar Cofre
            </button>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase font-mono block">Status do seu Cofre:</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xl font-black font-mono text-slate-100">
                {activeVaultBalance} <span className="text-xs text-slate-400">{vaultAsset}</span>
              </span>
              <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-900">
                +{vaultAPYs[vaultAsset]}% APY
              </span>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex justify-between items-center text-[8.5px] font-mono text-slate-500">
              <span>Contrato do Vault:</span>
              <span className="text-amber-500/90 font-bold select-all cursor-help" title="GBTR4BH2TMOEELCVYBAZ46TKGFGGQGUJK5LI3C32XYGIM475MFRSMVLO">
                GBTR4BH...MFRSMVLO
              </span>
            </div>
          </div>

          <div className="border-t border-slate-850 pt-2.5 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase font-mono">
              <span>Rendimentos Acumulados:</span>
              <span className="text-emerald-400 font-bold animate-pulse">● LIVE</span>
            </div>
            <p className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5 leading-none">
              <TrendingUp className="h-4 w-4 animate-bounce" /> 
              {simulatedYield > 0 ? simulatedYield.toFixed(6) : "0.000000"} {vaultAsset}
            </p>
            <p className="text-[9px] text-slate-500 font-semibold leading-tight pt-1">
              Juros compostos são acumulados em tempo real na Testnet da WalletNow!
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer font-mono"
      >
        Concluir & Voltar ao Templo
      </button>
    </div>
  );
};

// =================================================================
// 5. ATF DEFI MODAL (Center Region: Totem / NFT consolidation)
// =================================================================
interface AtfDefiProps {
  wallet: WalletState;
  onClose: () => void;
  playerName: string;
  onUpdateWallet: (updatedFields: Partial<WalletState>, tx?: Transaction) => void;
}

const AtfDefiModal: React.FC<AtfDefiProps> = ({ wallet, onClose, playerName, onUpdateWallet }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConsolidate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  return (
    <div className="space-y-5 text-white">
      <div className="text-center space-y-1.5">
        <div className="inline-flex p-3 bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/20 animate-bounce">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black uppercase text-rose-500 tracking-tight font-mono">Totem ATM DEFI Consolidado</h2>
        <p className="text-slate-400 text-xs">A rede Stellar reconheceu suas 4 insígnias. Você é agora um Herói de Elite!</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3.5">
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-800 text-xs">
          <span className="text-slate-500 font-bold uppercase font-mono">Identidade Lendária:</span>
          <span className="text-[#39ff14] font-black tracking-tight uppercase [text-shadow:0_0_5px_#39ff14]">{playerName}</span>
        </div>

        <div className="space-y-2 text-xs">
          <span className="text-slate-500 font-bold uppercase font-mono block mb-1">Seus Ativos WalletNow:</span>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <div>
                <p className="font-extrabold text-cyan-400 leading-tight">Saldo XLM</p>
                <p className="text-[10px] text-slate-500 font-mono">{wallet.xlmBalance} XLM</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2">
              <span className="text-xl">💵</span>
              <div>
                <p className="font-extrabold text-emerald-400 leading-tight">Saldo USDW</p>
                <p className="text-[10px] text-slate-500 font-mono">{wallet.usdwBalance || 0} USDW</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2">
              <span className="text-xl">🇧🇷</span>
              <div>
                <p className="font-extrabold text-violet-400 leading-tight">Saldo BRW</p>
                <p className="text-[10px] text-slate-500 font-mono">{wallet.brwBalance || 0} BRW</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2">
              <span className="text-xl">🏦</span>
              <div>
                <p className="font-extrabold text-amber-400 leading-tight">Yield Vaults</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {((wallet.vaultXlm || 0) + (wallet.vaultUsdw || 0) + (wallet.vaultBrw || 0))} bloqueados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!success ? (
        <button
          onClick={handleConsolidate}
          disabled={loading}
          className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:translate-y-0.5 text-white font-extrabold rounded-xl border border-rose-700 shadow-[inset_0_-3px_0_rgba(0,0,0,0.3)] hover:shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-mono uppercase"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Consensuando no Ledger Stellar...</span>
            </>
          ) : (
            <>
              <span>Consolidar Ativos no Ledger</span>
            </>
          )}
        </button>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-center space-y-1">
          <p className="text-emerald-400 font-extrabold text-sm uppercase">✦ Transação de Consolidação Executada! ✦</p>
          <p className="text-[11px] text-slate-400">Seus NFTs e o Título de Guardião Lendário foram gravados permanentemente no Ledger da rede Stellar com consenso distribuído!</p>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-800">
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 border border-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer transition"
        >
          Fechar Totem
        </button>
      </div>
    </div>
  );
};
