/**
 * ChatBox.tsx
 * Componente de chat MMO em tempo real.
 * Aparece como uma caixa flutuante no canto inferior esquerdo do canvas.
 * Em mobile: colapsável para não atrapalhar o joystick.
 */

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, ChevronDown, ChevronUp, Users } from "lucide-react";
import { ChatMessage } from "../services/multiplayerService";

interface ChatBoxProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onlineCount: number;
  currentPlayerName: string;
  isConnected: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSend,
  onlineCount,
  currentPlayerName,
  isConnected,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  // Quando receber nova mensagem com o chat fechado, pisca o botão
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCount.current && !isExpanded) {
      setHasNewMsg(true);
    }
    prevMsgCount.current = messages.length;
  }, [messages.length, isExpanded]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !isConnected) return;
    onSend(trimmed);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
    if (e.key === "Escape") setIsExpanded(false);
  };

  const handleToggle = () => {
    setIsExpanded((v) => !v);
    setHasNewMsg(false);
  };

  return (
    <div
      className="fixed bottom-20 left-2 z-50 flex flex-col items-start gap-1"
      style={{ pointerEvents: "auto" }}
    >
      {/* Caixa expandida de chat */}
      {isExpanded && (
        <div
          className="w-72 flex flex-col rounded-xl overflow-hidden shadow-2xl border border-white/10"
          style={{
            background: "rgba(10, 12, 20, 0.92)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                Chat do Mapa
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono">{onlineCount} online</span>
              </div>
              <button onClick={handleToggle} className="text-slate-500 hover:text-white transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex flex-col gap-1 px-2 py-2 overflow-y-auto" style={{ maxHeight: "180px", minHeight: "60px" }}>
            {messages.length === 0 && (
              <p className="text-[10px] text-slate-500 italic text-center py-2">
                Nenhuma mensagem ainda. Diga olá! 👋
              </p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-[10px] font-bold"
                    style={{
                      color:
                        msg.player_name === currentPlayerName
                          ? "#38bdf8"
                          : "#fbbf24",
                    }}
                  >
                    {msg.player_name}:
                  </span>
                  <span className="text-[10px] text-slate-200 break-words">
                    {msg.message}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-1 px-2 py-2 border-t border-white/10">
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition font-mono"
              placeholder={isConnected ? "Digite e pressione Enter..." : "Conectando..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, 200))}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              autoComplete="off"
              maxLength={200}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || !isConnected}
              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition text-white"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Botão toggle */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all shadow-lg"
        style={{
          background: hasNewMsg
            ? "rgba(56, 189, 248, 0.9)"
            : "rgba(10, 12, 20, 0.85)",
          border: hasNewMsg ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
          color: hasNewMsg ? "#000" : "#94a3b8",
          backdropFilter: "blur(8px)",
        }}
        title="Chat MMO"
      >
        <MessageSquare className="w-3 h-3" />
        <span>Chat</span>
        {hasNewMsg && (
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
        )}
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronUp className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};

// ─── Indicador de jogadores online ─────────────────────────────────────────

interface OnlineIndicatorProps {
  count: number;
  isConnected: boolean;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  count,
  isConnected,
}) => {
  return (
    <div
      className="fixed top-12 right-2 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-lg transition-all"
      style={{
        background: "rgba(10, 12, 20, 0.88)",
        border: isConnected
          ? "1px solid rgba(74, 222, 128, 0.4)"
          : "1px solid rgba(251, 191, 36, 0.4)",
        backdropFilter: "blur(8px)",
        color: isConnected ? "#4ade80" : "#fbbf24",
      }}
      title={isConnected ? "Multiplayer Supabase Ativo" : "Conectando ao Supabase MMO..."}
    >
      <Users className="w-3.5 h-3.5" />
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"
        }`}
      />
      <span>
        {isConnected
          ? `${count + 1} herói(s) online`
          : "Conectando MMO..."}
      </span>
    </div>
  );
};

