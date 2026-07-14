/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { WalletState } from "../types";
import { Copy, Key, CreditCard, ArrowRightLeft, Sparkles, Shield, RefreshCw } from "lucide-react";

interface GameOverlayProps {
  activeModal: "wallet" | "onramp" | "soroban" | "hold" | null;
  wallet: WalletState;
  onClose: () => void;
  onWalletCreated: (pubKey: string, secKey: string) => void;
  onOnRampSuccess: (xlmAdded: number, method: "PIX" | "CARD") => void;
  onSwapSuccess: (xlmSpent: number, usdcGained: number, soroGained: number) => void;
  onHoldSuccess: (xlmLocked: number, durationMonths: number) => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  activeModal,
  wallet,
  onClose,
  onWalletCreated,
  onOnRampSuccess,
  onSwapSuccess,
  onHoldSuccess,
}) => {
  if (!activeModal) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 shadow-2xl transition-all duration-300 bg-slate-900 border-slate-700">
        
        {/* Top glow decor based on active modal type */}
        <div className={`h-1.5 w-full ${
          activeModal === "wallet" ? "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" :
          activeModal === "onramp" ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" :
          activeModal === "soroban" ? "bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" :
          "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
        }`} />

        <div className="p-6">
          {activeModal === "wallet" && (
            <WalletForgeModal 
              onClose={onClose} 
              onWalletCreated={onWalletCreated} 
            />
          )}
          {activeModal === "onramp" && (
            <OnRampModal 
              wallet={wallet} 
              onClose={onClose} 
              onOnRampSuccess={onOnRampSuccess} 
            />
          )}
          {activeModal === "soroban" && (
            <SorobanSwapModal 
              wallet={wallet} 
              onClose={onClose} 
              onSwapSuccess={onSwapSuccess} 
            />
          )}
          {activeModal === "hold" && (
            <StellarHoldModal 
              wallet={wallet} 
              onClose={onClose} 
              onHoldSuccess={onHoldSuccess} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// 1. WALLET FORGE MODAL
// -----------------------------------------------------------------
interface WalletForgeProps {
  onClose: () => void;
  onWalletCreated: (pubKey: string, secKey: string) => void;
}

const WalletForgeModal: React.FC<WalletForgeProps> = ({ onClose, onWalletCreated }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [generatedPub, setGeneratedPub] = useState("");
  const [generatedSec, setGeneratedSec] = useState("");
  const [copiedPub, setCopiedPub] = useState(false);
  const [copiedSec, setCopiedSec] = useState(false);

  const generateKeys = () => {
    setLoading(true);
    setTimeout(() => {
      // Mocking high-fidelity Stellar keys
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      let pKey = "G";
      let sKey = "S";
      for (let i = 0; i < 55; i++) {
        pKey += chars.charAt(Math.floor(Math.random() * chars.length));
        sKey += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setGeneratedPub(pKey.substring(0, 56));
      setGeneratedSec(sKey.substring(0, 56));
      setLoading(false);
      setStep(2);
    }, 1200);
  };

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
      {step === 1 ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-cyan-400">
            <Key className="h-7 w-7 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight">Forja da Carteira Stellar</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Uma carteira Stellar não é guardada por um banco comercial. Ela é criada de forma 
            <strong> autônoma e descentralizada</strong> por você através de criptografia assimétrica.
          </p>
          <div className="rounded-lg bg-cyan-950/40 p-4 border border-cyan-800/30 text-xs text-cyan-300 leading-relaxed">
            <p className="font-semibold mb-1">Como funciona?</p>
            O terminal utiliza um gerador matemático de entropia para criar duas chaves únicas ligadas de forma irreversível. 
            Você receberá um endereço de depósito público (Chave G) e uma chave de assinatura secreta (Chave S).
          </div>
          <button
            id="btn-generate-keys"
            onClick={generateKeys}
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl font-bold text-sm text-black bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Gerando Entropia Estelar...
              </span>
            ) : (
              "Gerar Par de Chaves Criptográficas"
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Sparkles className="h-6 w-6" />
            <h2 className="text-xl font-bold tracking-tight">Carteira Criada com Sucesso!</h2>
          </div>
          <p className="text-xs text-slate-300">
            Abaixo estão os seus dados de conta criptográfica simulados. Guarde com carinho!
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                Chave Pública (Endereço Recebível - Começa com G)
              </label>
              <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="font-mono text-[11px] text-slate-300 truncate flex-1 select-all">
                  {generatedPub}
                </span>
                <button
                  id="btn-copy-pub"
                  onClick={() => copyToClipboard(generatedPub, true)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition"
                  title="Copiar Endereço"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copiedPub && <p className="text-[10px] text-cyan-400 mt-1">Endereço copiado!</p>}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-amber-400 font-bold mb-1 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Chave Secreta (Senha Privada - Começa com S)
              </label>
              <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-lg border border-amber-900/30">
                <span className="font-mono text-[11px] text-amber-500/90 truncate flex-1 select-all">
                  {generatedSec}
                </span>
                <button
                  id="btn-copy-sec"
                  onClick={() => copyToClipboard(generatedSec, false)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition"
                  title="Copiar Chave Secreta"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copiedSec && <p className="text-[10px] text-amber-400 mt-1">Chave secreta copiada com segurança!</p>}
            </div>
          </div>

          <div className="bg-amber-950/40 p-3 rounded-lg border border-amber-800/20 text-[11px] text-amber-200/90 leading-relaxed">
            ⚠️ <strong>AVISO DE SEGURANÇA REAL:</strong> Na rede real Stellar, quem possui a chave que começa com "S" possui total controle do dinheiro. Nunca revele ela a ninguém, nem mesmo ao suporte!
          </div>

          <button
            id="btn-finish-wallet"
            onClick={() => {
              onWalletCreated(generatedPub, generatedSec);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
          >
            Concluir Forja & Registrar Conta
          </button>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------
// 2. ON-RAMP PORTAL MODAL
// -----------------------------------------------------------------
interface OnRampProps {
  wallet: WalletState;
  onClose: () => void;
  onOnRampSuccess: (xlmAdded: number, method: "PIX" | "CARD") => void;
}

const OnRampModal: React.FC<OnRampProps> = ({ wallet, onClose, onOnRampSuccess }) => {
  const [fiatAmount, setFiatAmount] = useState<number>(100);
  const [method, setMethod] = useState<"PIX" | "CARD">("PIX");
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Input, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);

  // Stellar exchange rate mock (1 XLM = ~R$ 0.66)
  const XLM_PRICE = 0.66;
  const computedXlm = Math.floor(fiatAmount / XLM_PRICE);

  const startPayment = () => {
    setStep(2);
  };

  const confirmPayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 2000);
  };

  return (
    <div id="onramp-panel" className="text-slate-100">
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-emerald-400">
            <CreditCard className="h-7 w-7" />
            <h2 className="text-xl font-bold tracking-tight">Portal de Câmbio (On-Ramp)</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Dê vida à sua carteira Stellar! Faça uma transação fiat simulada para receber seus XLMs instantaneamente na blockchain.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1">Qual valor deseja depositar?</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">R$</span>
                <input
                  id="input-fiat-amount"
                  type="number"
                  min="10"
                  max="1000"
                  value={fiatAmount}
                  onChange={(e) => setFiatAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
              <span className="text-slate-400">Você receberá aproximadamente:</span>
              <span className="text-emerald-400 font-bold text-sm font-mono">{computedXlm} XLM</span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1.5">Forma de Pagamento Simulada:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("PIX")}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1 cursor-pointer transition ${
                    method === "PIX" 
                      ? "border-emerald-500 bg-emerald-950/30 text-emerald-300" 
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="text-[13px]">⚡ PIX</span>
                  <span className="text-[9px] opacity-75">Liquidação Instantânea</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("CARD")}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1 cursor-pointer transition ${
                    method === "CARD" 
                      ? "border-emerald-500 bg-emerald-950/30 text-emerald-300" 
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="text-[13px]">💳 Cartão de Crédito</span>
                  <span className="text-[9px] opacity-75">Simulação de Rampa</span>
                </button>
              </div>
            </div>
          </div>

          <button
            id="btn-trigger-payment"
            onClick={startPayment}
            disabled={fiatAmount <= 0}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            Prosseguir para Depósito
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-emerald-400">
            <CreditCard className="h-6 w-6 animate-pulse" />
            <h2 className="text-lg font-bold tracking-tight">Aguardando Pagamento</h2>
          </div>

          {method === "PIX" ? (
            <div className="flex flex-col items-center space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-300 text-center">
                Escaneie o QR Code simulado abaixo com o app do seu banco ou use a chave copia-e-cola.
              </p>
              {/* QR Code Placeholder with High-Tech retro style */}
              <div className="h-32 w-32 bg-slate-900 border-2 border-emerald-500 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/10 flex flex-col justify-between p-1 select-none pointer-events-none">
                  <div className="flex justify-between">
                    <div className="w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                    <div className="w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                    <div className="w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                </div>
                {/* Simulated retro pixelated code */}
                <div className="grid grid-cols-6 gap-1 w-full h-full p-1 opacity-80">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-sm ${
                        (i * 7 + 13) % 3 === 0 || i % 5 === 0 ? "bg-emerald-400" : "bg-slate-950"
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                PIX_ST_TX_892348239048
              </span>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-300">Digite dados de cartão fictícios:</p>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-slate-400 mb-0.5">Nome no Cartão</label>
                  <input type="text" placeholder="STELLAR HOLDER" disabled className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-semibold text-slate-300" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-0.5">Nº do Cartão</label>
                    <input type="text" placeholder="4000 1234 5678 9010" disabled className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-semibold text-slate-300" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Validade / CVV</label>
                    <input type="text" placeholder="12/29 - 777" disabled className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-semibold text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs bg-slate-950/60 p-3 rounded-lg text-slate-300">
            💸 Valor depositado: <strong className="text-slate-100">R$ {fiatAmount}</strong>
            <br />
            🚀 XLM a receber: <strong className="text-emerald-400">{computedXlm} XLM</strong>
          </div>

          <button
            id="btn-confirm-payment"
            onClick={confirmPayment}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Validando transação on-chain...
              </span>
            ) : (
              "Confirmar Pagamento (Mock)"
            )}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-950 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <Sparkles className="h-6 w-6 animate-bounce" />
          </div>
          <h2 className="text-xl font-bold text-emerald-400">On-Ramp Concluído!</h2>
          <p className="text-sm text-slate-300">
            O Anchor identificou o seu pagamento e emitiu o crédito correspondente. 
            <strong> {computedXlm} XLM</strong> já estão brilhando na sua carteira.
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-left text-[11px] font-mono space-y-1">
            <p className="text-slate-400">Ledger Status: <span className="text-emerald-400">SUCCESS</span></p>
            <p className="text-slate-400">Hash: <span className="text-slate-300 select-all">tx_672b1...89a2</span></p>
            <p className="text-slate-400">Taxa Stellar: <span className="text-slate-300">0.00001 XLM (menos de R$ 0.00001!)</span></p>
          </div>
          <button
            id="btn-close-onramp"
            onClick={() => {
              onOnRampSuccess(computedXlm, method);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all cursor-pointer"
          >
            Retornar ao Arquipélago
          </button>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------
// 3. SOROBAN SMART SWAP MODAL
// -----------------------------------------------------------------
interface SorobanSwapProps {
  wallet: WalletState;
  onClose: () => void;
  onSwapSuccess: (xlmSpent: number, usdcGained: number, soroGained: number) => void;
}

const SorobanSwapModal: React.FC<SorobanSwapProps> = ({ wallet, onClose, onSwapSuccess }) => {
  const [xlmAmount, setXlmAmount] = useState<number>(50);
  const [targetAsset, setTargetAsset] = useState<"USDC" | "SORO">("USDC");
  const [step, setStep] = useState<1 | 2>(1); // 1: Config, 2: Animation & Success
  const [loading, setLoading] = useState(false);

  // Exchange rate mocks
  // 1 XLM = 0.12 USDC
  // 1 XLM = 2.5 SORO
  const usdcRate = 0.12;
  const soroRate = 2.5;

  const targetAmount = targetAsset === "USDC" 
    ? Number((xlmAmount * usdcRate).toFixed(2)) 
    : Number((xlmAmount * soroRate).toFixed(0));

  const triggerSwap = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  return (
    <div id="soroban-swap-panel" className="text-slate-100">
      {step === 1 ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-violet-400">
            <ArrowRightLeft className="h-7 w-7" />
            <h2 className="text-xl font-bold tracking-tight">Alquimia Soroban (Smart Swap)</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Soroban é a engine de Smart Contracts da Stellar. Aqui você executa trocas de tokens sem custodiantes de forma instantânea e barata.
          </p>

          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1">Você paga (De):</label>
              <div className="flex items-center space-x-3">
                <input
                  id="input-swap-xlm"
                  type="number"
                  min="5"
                  max={wallet.xlmBalance}
                  value={xlmAmount}
                  onChange={(e) => setXlmAmount(Math.min(wallet.xlmBalance, Number(e.target.value)))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm font-mono flex-1 focus:outline-none focus:border-violet-500"
                />
                <span className="font-bold text-sm text-slate-300 bg-slate-800 px-3 py-2 rounded-lg">XLM</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Saldo disponível: {wallet.xlmBalance} XLM</p>
            </div>

            <div className="flex justify-center my-1 text-violet-400">
              <ArrowRightLeft className="h-5 w-5 transform rotate-90" />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1">Você recebe (Para):</label>
              <div className="flex items-center space-x-3">
                <div className="bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm font-mono text-slate-300 flex-1">
                  {targetAmount}
                </div>
                <select
                  id="select-swap-target"
                  value={targetAsset}
                  onChange={(e) => setTargetAsset(e.target.value as "USDC" | "SORO")}
                  className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-2 text-sm font-bold text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="USDC">USDC</option>
                  <option value="SORO">SORO</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-violet-950/20 p-3 rounded-lg border border-violet-800/20 text-[11px] leading-relaxed text-violet-300 space-y-1">
            <p>📋 <strong>Detalhes do Contrato Soroban:</strong></p>
            <p>• Taxa de Rede Máxima: <strong>0.0001 XLM</strong> (Incrível!)</p>
            <p>• Tempo de Execução: <strong>~1.5 segundos</strong></p>
            <p>• Impacto de Preço: <strong>&lt; 0.01%</strong></p>
          </div>

          <button
            id="btn-trigger-swap"
            onClick={triggerSwap}
            disabled={loading || xlmAmount <= 0 || xlmAmount > wallet.xlmBalance}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-violet-400 hover:bg-violet-300 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Invocando Contrato Soroban...
              </span>
            ) : (
              "Executar Swap Cripto"
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-violet-950 border border-violet-500 rounded-full flex items-center justify-center mx-auto text-violet-400">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-violet-400">Smart Swap Executado!</h2>
          <p className="text-sm text-slate-300">
            O contrato inteligente Soroban processou com sucesso a transação de swap descentralizada.
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Gasto:</span>
              <span className="text-red-400 font-bold">-{xlmAmount} XLM</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Recebido:</span>
              <span className="text-emerald-400 font-bold">+{targetAmount} {targetAsset}</span>
            </div>
            <div className="border-t border-slate-800 pt-1.5 flex justify-between font-mono text-[10px]">
              <span className="text-slate-500">Gas Pago:</span>
              <span className="text-slate-400">0.00009 XLM</span>
            </div>
          </div>
          <button
            id="btn-close-swap"
            onClick={() => {
              onSwapSuccess(
                xlmAmount,
                targetAsset === "USDC" ? targetAmount : 0,
                targetAsset === "SORO" ? targetAmount : 0
              );
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-violet-400 hover:bg-violet-300 active:scale-[0.98] transition-all cursor-pointer"
          >
            Retornar ao Arquipélago
          </button>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------
// 4. STELLAR HOLD MODAL
// -----------------------------------------------------------------
interface StellarHoldProps {
  wallet: WalletState;
  onClose: () => void;
  onHoldSuccess: (xlmLocked: number, durationMonths: number) => void;
}

const StellarHoldModal: React.FC<StellarHoldProps> = ({ wallet, onClose, onHoldSuccess }) => {
  const [holdAmount, setHoldAmount] = useState<number>(100);
  const [duration, setDuration] = useState<number>(12); // months
  const [step, setStep] = useState<1 | 2>(1); // 1: Input, 2: Confetti/Complete
  const [loading, setLoading] = useState(false);

  const startHold = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1800);
  };

  return (
    <div id="stellar-hold-panel" className="text-slate-100">
      {step === 1 ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-amber-400">
            <Shield className="h-7 w-7" />
            <h2 className="text-xl font-bold tracking-tight">Santuário do Stellar Holder</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Parabéns por chegar à fronteira final! O compromisso a longo prazo (Hold) é a base de um ecossistema financeiro sólido. 
            Trave seus ativos para receber seu título.
          </p>

          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1">Quantidade de XLM para Lock:</label>
              <div className="flex items-center space-x-3">
                <input
                  id="input-hold-xlm"
                  type="number"
                  min="10"
                  max={wallet.xlmBalance}
                  value={holdAmount}
                  onChange={(e) => setHoldAmount(Math.min(wallet.xlmBalance, Number(e.target.value)))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm font-mono flex-1 focus:outline-none focus:border-amber-500"
                />
                <span className="font-bold text-sm text-slate-300 bg-slate-800 px-3 py-2 rounded-lg">XLM</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Saldo livre disponível: {wallet.xlmBalance} XLM</p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1">Período de Lock (Meses):</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 6, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDuration(m)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition ${
                      duration === m 
                        ? "border-amber-500 bg-amber-950/30 text-amber-300" 
                        : "border-slate-850 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {m} Meses
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-amber-950/20 p-3 rounded-lg border border-amber-800/20 text-[11px] leading-relaxed text-amber-300">
            🔒 <strong>Como funciona o Lock?</strong> Seus XLM serão transferidos para um cofre inteligente descentralizado (Escrow Contract). Eles ficarão guardados em seu nome e não podem ser movidos até a data definida.
          </div>

          <button
            id="btn-lock-assets"
            onClick={startHold}
            disabled={loading || holdAmount <= 10 || holdAmount > wallet.xlmBalance}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-amber-400 hover:bg-amber-300 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Selando Cofre Inteligente...
              </span>
            ) : (
              `Selar Lock de ${holdAmount} XLM`
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-amber-950 border-2 border-amber-500 rounded-full flex items-center justify-center mx-auto text-amber-400 animate-pulse">
            <Sparkles className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-amber-400">🌟 Título Conquistado!</h2>
          <p className="text-sm text-slate-200">
            Você selou com sucesso o contrato inteligente de Escrow! Suas moedas estão trancadas em um cofre inquebrável por {duration} meses.
          </p>
          <div className="p-3.5 bg-slate-950 border border-amber-500/20 rounded-xl max-w-sm mx-auto">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">Certificado do Onboarding</span>
            <h3 className="text-base font-extrabold text-slate-100 tracking-tight">STELLAR LEGENDARY HOLDER</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">ID: {wallet.publicKey.substring(0, 8)}...{wallet.publicKey.substring(48)}</p>
          </div>
          <button
            id="btn-finish-onboarding"
            onClick={() => {
              onHoldSuccess(holdAmount, duration);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-amber-400 hover:bg-amber-300 active:scale-[0.98] transition-all cursor-pointer"
          >
            Concluir Jornada 🚀
          </button>
        </div>
      )}
    </div>
  );
};
