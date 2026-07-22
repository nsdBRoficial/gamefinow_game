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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
                <span className="text-xs font-black uppercase tracking-wide text-[#ffbf00] font-mono">{t("huds.customizer_title")}</span>
              </>
            )}
            {activeWindow === "backpack" && (
              <>
                <Coins className="h-4 w-4 text-[#5db81d]" />
                <span className="text-xs font-black uppercase tracking-wide text-[#5db81d] font-mono">{t("huds.backpack_title")}</span>
              </>
            )}
            {activeWindow === "ledger" && (
              <>
                <Database className="h-4 w-4 text-[#00a8e1]" />
                <span className="text-xs font-black uppercase tracking-wide text-[#00a8e1] font-mono">{t("huds.ledger_title")}</span>
              </>
            )}
            {activeWindow === "guide" && (
              <>
                <BookOpen className="h-4 w-4 text-[#c33309]" />
                <span className="text-xs font-black uppercase tracking-wide text-[#c33309] font-mono">{t("huds.guide_title")}</span>
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
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase">{t("huds.decentralized_vault")}</span>
                  <span className="text-[10px] text-[#5db81d] font-black flex items-center gap-1 uppercase">
                    <ShieldCheck className="h-3.5 w-3.5" /> {t("huds.active_keys")}
                  </span>
                </div>
                {wallet.hasWallet ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#005370] font-bold block uppercase">{t("huds.public_key")}</span>
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
                      <span className="text-[9px] text-[#c33309] font-bold block uppercase">{t("huds.secret_key")}</span>
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
                    <p className="text-[#c33309] font-black animate-pulse uppercase">{t("huds.no_identity")}</p>
                    <p className="text-[10px]">{t("huds.no_identity_desc")}</p>
                  </div>
                )}
              </div>

              {/* Balances detailed list */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase font-mono block">{t("huds.available_balances")}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border-2 border-black p-3 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">{t("huds.crystal_coins")}</span>
                      <span className="text-sm font-black text-[#d97706] font-mono">{wallet.xlmBalance} XLM</span>
                    </div>
                    <div className="w-8 h-8 bg-[#ffc600] text-black border-2 border-black rounded-full flex items-center justify-center font-black font-mono text-xs shadow-[1.5px_1.5px_0_#000]">🌟</div>
                  </div>
                  <div className="bg-white border-2 border-black p-3 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">{t("huds.stable_dollar")}</span>
                      <span className="text-sm font-black text-[#10b981] font-mono">{wallet.usdwBalance || 0} USDW</span>
                    </div>
                    <div className="w-8 h-8 bg-[#10b981] text-white border-2 border-black rounded flex items-center justify-center font-black font-mono text-xs shadow-[1.5px_1.5px_0_#000]">💵</div>
                  </div>
                  <div className="bg-white border-2 border-black p-3 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">{t("huds.stable_real")}</span>
                      <span className="text-sm font-black text-[#6366f1] font-mono">{wallet.brwBalance || 0} BRW</span>
                    </div>
                    <div className="w-8 h-8 bg-[#6366f1] text-white border-2 border-black rounded flex items-center justify-center font-black font-mono text-xs shadow-[1.5px_1.5px_0_#000]">🇧🇷</div>
                  </div>
                  <div className="bg-white border-2 border-black p-3 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Token GameFi</span>
                      <span className="text-sm font-black text-[#ec4899] font-mono">{wallet.gamefiBalance || 0} GAMEFI</span>
                    </div>
                    <div className="w-8 h-8 bg-[#ec4899] text-white border-2 border-black rounded flex items-center justify-center font-black font-mono text-xs shadow-[1.5px_1.5px_0_#000]">🎮</div>
                  </div>
                </div>

                {/* Vault & LP Balances */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-100 border-2 border-dashed border-slate-400 p-3 rounded-lg space-y-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.05)]">
                    <span className="text-[8.5px] text-slate-500 font-black uppercase font-mono block">{t("huds.yield_vaults")}</span>
                    <div className="text-[11px] font-mono space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>{t("huds.vault_xlm")}</span>
                        <span className="font-bold">{wallet.vaultXlm || 0} XLM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("huds.vault_usdw")}</span>
                        <span className="font-bold">{wallet.vaultUsdw || 0} USDW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("huds.vault_brw")}</span>
                        <span className="font-bold">{wallet.vaultBrw || 0} BRW</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-100 border-2 border-dashed border-slate-400 p-3 rounded-lg space-y-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.05)]">
                    <span className="text-[8.5px] text-slate-500 font-black uppercase font-mono block">{t("huds.liquidity_shares")}</span>
                    <div className="text-[11px] font-mono space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>{t("huds.pool_xlm_usdw")}</span>
                        <span className="font-bold text-violet-600">{wallet.poolXlmUsdw || 0} LP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("huds.pool_usdw_brw")}</span>
                        <span className="font-bold text-violet-600">{wallet.poolUsdwBrw || 0} LP</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-200">
                        <span>{t("huds.fee_rewards")}</span>
                        <span className="font-bold text-emerald-500">{t("huds.accumulating")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quests timeline card */}
              <div className="bg-white border-2 border-black p-4 rounded-lg space-y-3 shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                <h3 className="text-xs font-black uppercase tracking-wider text-black font-mono">{t("huds.completed_quests")}</h3>
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
                          {q.status === "completed" ? t("huds.completed") :
                           q.status === "active" ? t("huds.active") : t("huds.blocked")}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed mb-1.5">{q.description}</p>
                      <span className="text-[10px] text-slate-500 block font-bold">{t("huds.quest_reward")} {q.reward}</span>
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
                  <span className="text-[10px] text-[#005370] font-black uppercase tracking-wider block font-mono">{t("huds.ledger_sequencer")}</span>
                  <p className="text-black/80 leading-relaxed text-[11px]">{t("huds.ledger_sequencer_desc")}</p>
                </div>
                <div className="text-center shrink-0 bg-[#f4f2ea] px-4 py-2.5 rounded border-2 border-black shadow-[1.5px_1.5px_0_#000]">
                  <span className="text-[9px] text-slate-500 uppercase font-black block">{t("huds.consensus_sequence")}</span>
                  <span className="text-xs font-black text-[#00a8e1]">{t("huds.ledger")} #{currentLedger}</span>
                </div>
              </div>

              {/* Transactions stream */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-1 border-2 border-dashed border-black/20 rounded-lg">
                    <p className="font-mono font-bold uppercase text-[10px]">{t("huds.awaiting_transactions")}</p>
                    <p className="text-[10px]">{t("huds.interact_altars")}</p>
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
                        <span className="truncate max-w-[220px]">{t("huds.tx_hash")}: {tx.id}</span>
                        <span>{t("huds.tx_fee")}: {tx.fee} XLM</span>
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
                <h3 className="text-xs font-black text-[#c33309] uppercase tracking-wide font-mono">{t("huds.survival_instructions")}</h3>
                <p dangerouslySetInnerHTML={{ __html: t("huds.survival_desc") }}></p>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#005370] text-xs font-mono uppercase">{t("huds.guide_q1")}</h4>
                  <p className="text-[11px]" dangerouslySetInnerHTML={{ __html: t("huds.guide_a1") }}></p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#5db81d] text-xs font-mono uppercase">{t("huds.guide_q2")}</h4>
                  <p className="text-[11px]" dangerouslySetInnerHTML={{ __html: t("huds.guide_a2") }}></p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#8a2be2] text-xs font-mono uppercase">{t("huds.guide_q3")}</h4>
                  <p className="text-[11px]" dangerouslySetInnerHTML={{ __html: t("huds.guide_a3") }}></p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#c33309] text-xs font-mono uppercase">{t("huds.guide_q4")}</h4>
                  <p className="text-[11px]">{t("huds.guide_a4")}</p>
                </div>
              </div>

              <div className="border-t border-black/10 pt-3 text-center text-[10px] text-slate-500">
                <span>{t("huds.guide_footer")}</span>
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
            {t("huds.close_window")}
          </button>
        </div>

      </div>
    </div>
  );
};
