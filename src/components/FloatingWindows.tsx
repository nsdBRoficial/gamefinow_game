/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { GameState, Player, Quest, Transaction } from "../types";
import { CharacterCustomizer } from "./CharacterCustomizer";
import { 
  X, 
  Sparkles, 
  Database, 
  HelpCircle, 
  Coins, 
  Key, 
  ShieldCheck, 
  Compass, 
  BookOpen,
  ArrowRight,
  Clipboard,
  CheckCircle2
} from "lucide-react";

interface FloatingWindowsProps {
  activeWindow: "customizer" | "backpack" | "ledger" | "guide" | null;
  onClose: () => void;
  gameState: GameState;
  playerPos: Player;
  setPlayerPos: React.Dispatch<React.SetStateAction<Player>>;
}

export const FloatingWindows: React.FC<FloatingWindowsProps> = ({
  activeWindow,
  onClose,
  gameState,
  playerPos,
  setPlayerPos,
}) => {
  if (!activeWindow) return null;

  const { wallet, quests, transactions, currentLedger } = gameState;

  // Copy to clipboard helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copiada para a área de transferência!`);
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#f4f2ea] border-[3.5px] border-black rounded-lg shadow-[6px_6px_0px_rgba(0,0,0,0.4)] flex flex-col max-h-[90%] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="bg-[#2f2e26] border-b-[3px] border-black px-4 py-2.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            {activeWindow === "customizer" && (
              <>
                <Sparkles className="h-4 w-4 text-[#ffbf00]" />
                <span className="text-xs font-black uppercase tracking-wide text-[#ffbf00] font-mono">🎨 Guarda-Roupa do Viajante (Outfit)</span>
              </>
            )}
            {activeWindow === "backpack" && (
              <>
                <Coins className="h-4 w-4 text-[#5db81d]" />
                <span className="text-xs font-black uppercase tracking-wide text-[#5db81d] font-mono">🎒 Inventário & Runas</span>
              </>
            )}
            {activeWindow === "ledger" && (
              <>
                <Database className="h-4 w-4 text-[#00a8e1]" />
                <span className="text-xs font-black uppercase tracking-wide text-[#00a8e1] font-mono">📜 Console de Registros Stellar</span>
              </>
            )}
            {activeWindow === "guide" && (
              <>
                <BookOpen className="h-4 w-4 text-[#c33309]" />
                <span className="text-xs font-black uppercase tracking-wide text-[#c33309] font-mono">📖 Pergaminho de Instruções</span>
              </>
            )}
          </div>
          <button 
            onClick={onClose}
            className="w-6 h-6 bg-[#c33309] hover:bg-[#e04010] active:translate-y-0.5 text-white font-black border-2 border-black rounded flex items-center justify-center cursor-pointer shadow-[inset_1.5px_1.5px_0px_rgba(255,255,255,0.4)] text-xs"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin text-black">
          
          {/* A. CUSTOMIZER WINDOW */}
          {activeWindow === "customizer" && (
            <div className="space-y-4">
              <CharacterCustomizer playerPos={playerPos} setPlayerPos={setPlayerPos} />
            </div>
          )}

          {/* B. BACKPACK & QUESTS WINDOW */}
          {activeWindow === "backpack" && (
            <div className="space-y-4">
              {/* Wallet credentials card */}
              <div className="bg-white border-2 border-black p-4 rounded-lg space-y-3 font-mono shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase">Cofre Descentralizado de Chaves</span>
                  <span className="text-[10px] text-[#5db81d] font-black flex items-center gap-1 uppercase">
                    <ShieldCheck className="h-3.5 w-3.5" /> Chaves Ativas
                  </span>
                </div>
                {wallet.hasWallet ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#005370] font-bold block uppercase">CHAVE PÚBLICA (Endereço para Receber Moedas)</span>
                      <div className="flex gap-2 items-center bg-[#f4f2ea] p-2 rounded border border-black/20">
                        <span className="text-[#005370] font-black truncate flex-1">{wallet.publicKey}</span>
                        <button 
                          onClick={() => handleCopyText(wallet.publicKey, "Chave Pública")}
                          className="p-1 text-black/60 hover:text-black hover:bg-black/5 rounded transition border border-transparent hover:border-black/10 cursor-pointer"
                          title="Copiar Endereço"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#c33309] font-bold block uppercase">⚠ CHAVE SECRETA (Senha Administrativa - Guarde bem!)</span>
                      <div className="flex gap-2 items-center bg-red-50 p-2 rounded border border-[#c33309]/30">
                        <span className="text-[#c33309] font-bold truncate flex-1 font-password">S{wallet.secretKey.substring(1).replace(/./g, "•")}</span>
                        <button 
                          onClick={() => handleCopyText(wallet.secretKey, "Chave Secreta")}
                          className="p-1 text-[#c33309] hover:bg-red-100 rounded transition border border-transparent hover:border-[#c33309]/10 cursor-pointer"
                          title="Copiar Chave Secreta"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 space-y-1 select-none">
                    <p className="text-[#c33309] font-black animate-pulse uppercase">Nenhuma identidade forjada ainda!</p>
                    <p className="text-[10px]">Fale com o Sacerdote Frank no Templo de Thais para criar sua carteira.</p>
                  </div>
                )}
              </div>

              {/* Balances detailed list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white border-2 border-black p-3 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">Moedas de Cristal (XLM)</span>
                    <span className="text-base font-black text-[#5db81d] font-mono">{wallet.xlmBalance} XLM</span>
                  </div>
                  <div className="w-8 h-8 bg-[#ffc600] text-black border-2 border-black rounded-full flex items-center justify-center font-black font-mono text-xs shadow-[1px_1.5px_0_#000]">C</div>
                </div>
                <div className="bg-white border-2 border-black p-3 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">Moedas de Platina (USDC)</span>
                    <span className="text-base font-black text-[#e83e8c] font-mono">{wallet.usdcBalance} USDC</span>
                  </div>
                  <div className="w-8 h-8 bg-[#e83e8c] text-white border-2 border-black rounded flex items-center justify-center font-black font-mono text-xs shadow-[1px_1.5px_0_#000]">D</div>
                </div>
                <div className="bg-white border-2 border-black p-3 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">Runas de Batalha (SORO)</span>
                    <span className="text-base font-black text-[#00a8e1] font-mono">{wallet.soroBalance} SORO</span>
                  </div>
                  <div className="w-8 h-8 bg-[#00a8e1] text-white border-2 border-black rotate-45 flex items-center justify-center font-black font-mono text-xs shadow-[1px_1.5px_0_#000]"><span className="-rotate-45">♦</span></div>
                </div>
              </div>

              {/* Quests timeline card */}
              <div className="bg-white border-2 border-black p-4 rounded-lg space-y-3 shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                <h3 className="text-xs font-black uppercase tracking-wider text-black font-mono">Missões Educacionais Concluídas</h3>
                <div className="space-y-2.5 text-xs">
                  {Object.values(quests).map((q: Quest) => (
                    <div 
                      key={q.id}
                      className={`p-3 rounded-lg border-2 transition ${
                        q.status === "completed" 
                          ? "bg-emerald-50 border-[#5db81d] text-black" 
                          : q.status === "active"
                            ? "bg-[#ffbf00]/10 border-[#ffbf00] text-black"
                            : "bg-[#f4f2ea]/40 border-black/10 text-black/40"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black uppercase tracking-wide font-mono text-xs">{q.title}</span>
                        <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border-2 border-black shadow-[1px_1px_0_#000] ${
                          q.status === "completed" ? "bg-[#5db81d] text-white" :
                          q.status === "active" ? "bg-[#ffbf00] text-black" :
                          "bg-[#ece9df] text-black/40"
                        }`}>
                          {q.status === "completed" ? "✔ CONCLUÍDO" :
                           q.status === "active" ? "● ATIVO" : "🔒 BLOQUEADO"}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed mb-1.5">{q.description}</p>
                      <span className="text-[10px] text-slate-500 block font-bold">★ Recompensa de Missão: {q.reward}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* C. CRYPTO LEDGER MONITOR */}
          {activeWindow === "ledger" && (
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-white border-2 border-black p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3 shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#005370] font-black uppercase tracking-wider block font-mono">Blockchain Ledger Sequencer</span>
                  <p className="text-black/80 leading-relaxed text-[11px]">
                    Stellar opera em lotes rápidos de consenso a cada 5 segundos. Nenhuma energia de mineração ou taxas pesadas são desperdiçadas.
                  </p>
                </div>
                <div className="text-center shrink-0 bg-[#f4f2ea] px-4 py-2.5 rounded border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                  <span className="text-[9px] text-slate-500 uppercase font-black block">Sequência Consenso</span>
                  <span className="text-xs font-black text-[#00a8e1]">Ledger #{currentLedger}</span>
                </div>
              </div>

              {/* Transactions stream */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-1 border-2 border-dashed border-black/20 rounded-lg">
                    <p className="font-mono font-bold uppercase text-[10px]">Aguardando transações na rede...</p>
                    <p className="text-[10px]">Interaja com os altares do templo para emitir transações live!</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className="bg-white p-3 rounded-lg border-2 border-black hover:border-black/75 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] transition space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-black px-1.5 py-0.5 rounded text-[8px] tracking-wider uppercase border-2 border-black shadow-[1px_1px_0_#000] text-white ${
                          tx.type === "CREATE_ACCOUNT" ? "bg-[#00a8e1]" :
                          tx.type === "ON_RAMP_PIX" || tx.type === "ON_RAMP_CARD" ? "bg-[#5db81d]" :
                          tx.type === "SWAP_SOROBAN" ? "bg-[#8a2be2]" :
                          "bg-[#c33309]"
                        }`}>
                          {tx.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{tx.timestamp}</span>
                      </div>
                      
                      <div className="text-black font-black flex justify-between text-xs">
                        <span>{tx.memo}</span>
                        {tx.amount !== "0" && (
                          <span className="text-[#5db81d]">+{tx.amount} {tx.asset}</span>
                        )}
                      </div>

                      <div className="pt-1.5 border-t border-black/10 flex justify-between items-center text-[9px] text-slate-400">
                        <span className="truncate max-w-[220px]">HASH: {tx.id}</span>
                        <span>TAXA: {tx.fee} XLM</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* D. TRAVELER'S LEARNING GUIDE */}
          {activeWindow === "guide" && (
            <div className="space-y-4 text-xs leading-relaxed text-black/80">
              <div className="bg-white border-2 border-black p-4 rounded-lg space-y-2 shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                <h3 className="text-xs font-black text-[#c33309] uppercase tracking-wide font-mono">Instruções de Sobrevivência no Continente</h3>
                <p>
                  Bem-vindo ao templo educacional! O objetivo deste RPG é guiar você pelos conceitos práticos do Web3 através da rede <strong>Stellar</strong> de forma totalmente compreensível.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#005370] text-xs font-mono uppercase">1. Como funciona a Criptografia Assimétrica?</h4>
                  <p className="text-[11px]">
                    No Web3, você não cria logins com e-mail e senha convencionais. Em vez disso, seu endereço é uma <strong>Chave Pública</strong> (que todos podem ver, como um PIX) gerada matematicamente a partir de uma <strong>Chave Secreta</strong> (sua senha privada, guardada em cofre). Se perder a secreta, perde tudo!
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#5db81d] text-xs font-mono uppercase">2. O que são Anchors (Âncoras)?</h4>
                  <p className="text-[11px]">
                    Uma das maiores inovações da Stellar são as <strong>Anchors</strong>. Elas funcionam como casas de câmbio digitais licenciadas integradas na blockchain, permitindo enviar moedas fiduciárias locais (como Reais ou Dólares) e transformá-las em ativos virtuais estáveis (como USDC) instantaneamente.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#8a2be2] text-xs font-mono uppercase">3. O que são Smart Contracts Soroban?</h4>
                  <p className="text-[11px]">
                    <strong>Soroban</strong> é a engine de contratos inteligentes da Stellar que executa código Rust seguro diretamente no consenso. Com eles, podemos programar transações automáticas sem intermediários, como fazer Swaps (trocas de moedas) em piscinas de liquidez descentralizadas de forma imediata.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#c33309] text-xs font-mono uppercase">4. O que significa fazer Hold / Escrow?</h4>
                  <p className="text-[11px]">
                    Fazer "Hold" significa travar ativos financeiros em um cofre automatizado sem custódia de terceiros por um período pré-determinado. Isso garante fidelidade ao ecossistema, permitindo ganhar recompensas e consolidar sua presença como holder no ecossistema global.
                  </p>
                </div>
              </div>

              <div className="border-t border-black/10 pt-3 text-center text-[10px] text-slate-500">
                <span>Stellar Tibia Temple • Todos os dados simulados localmente para fins de capacitação de guerreiros.</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions inside modal */}
        <div className="bg-[#ece9df] border-t-[3px] border-black px-4 py-3 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-[#ece9df] hover:bg-[#f4f2ea] active:translate-y-0.5 border-2 border-black text-black text-xs font-bold rounded shadow-[inset_-1.5px_-1.5px_0px_rgba(0,0,0,0.15),0_2px_0px_rgba(0,0,0,1)] active:shadow-[0_0.5px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
};
