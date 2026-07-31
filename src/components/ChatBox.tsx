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
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Enter shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignorar se já houver algum input focado
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "Enter" && !isExpanded && isConnected) {
        e.preventDefault();
        setIsExpanded(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isExpanded, isConnected]);

  // Auto-focus no input quando expandir
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isExpanded]);

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
    if (e.key === "Enter") {
      if (inputValue.trim()) {
        handleSend();
      } else {
        // Se estiver vazio e apertar Enter de novo, apenas fecha o chat
        setIsExpanded(false);
      }
    }
    if (e.key === "Escape") setIsExpanded(false);
  };

  const handleToggle = () => {
    setIsExpanded((v) => !v);
    setHasNewMsg(false);
  };

  return (
    <div
      className="relative z-50 flex flex-col items-start"
      style={{ pointerEvents: "auto" }}
    >
      {/* Caixa expandida de chat */}
      {isExpanded && (
        <div
          className="absolute left-14 md:left-12 top-0 w-72 flex flex-col rounded-xl overflow-hidden shadow-2xl border border-white/10"
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
              ref={inputRef}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition font-mono"
              placeholder={isConnected ? "Digite (máx. 80 chars)..." : "Conectando..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, 80))}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              autoComplete="off"
              maxLength={80}
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
        className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none group relative"
        style={{
          background: hasNewMsg ? "rgba(56, 189, 248, 0.9)" : "#ebd9c0",
          border: "2px solid #000",
          color: hasNewMsg ? "#000" : "#000",
        }}
        title="Chat MMO"
      >
        <MessageSquare className="w-5 h-5 md:w-4 md:h-4" />
        <span className="absolute left-13 bg-black text-white text-[8px] uppercase tracking-wider px-2 py-1 rounded border border-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 font-mono">
          Abrir Chat MMO
        </span>
        {hasNewMsg && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-black animate-pulse" />
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

