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
  const [chatChannel, setChatChannel] = useState<"local" | "global">("local");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Enter shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (!isExpanded && isConnected) {
          setIsExpanded(true);
        }
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
    const prefix = chatChannel === "global" ? "[Global] " : "";
    onSend(prefix + trimmed);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (inputValue.trim()) {
        handleSend();
      } else {
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
      className="relative z-50 flex flex-col items-start font-mono"
      style={{ pointerEvents: "auto" }}
    >
      {/* Caixa expandida de chat */}
      {isExpanded && (
        <div
          className="absolute left-14 md:left-12 top-0 w-80 flex flex-col rounded-xl overflow-hidden shadow-2xl border border-white/10"
          style={{
            background: "rgba(10, 12, 20, 0.94)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-slate-950/80">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setChatChannel("local")}
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition cursor-pointer ${
                  chatChannel === "local" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                📍 Local
              </button>
              <button
                onClick={() => setChatChannel("global")}
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition cursor-pointer ${
                  chatChannel === "global" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                🌍 Global
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono">{onlineCount} online</span>
              </div>
              <button onClick={handleToggle} className="text-slate-500 hover:text-white transition cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex flex-col gap-1 px-2.5 py-2 overflow-y-auto" style={{ maxHeight: "180px", minHeight: "70px" }}>
            {messages.length === 0 && (
              <p className="text-[10px] text-slate-500 italic text-center py-2">
                Nenhuma mensagem ainda. Diga olá para todos os heróis! 👋
              </p>
            )}
            {messages.map((msg) => {
              const isGlobalMsg = msg.message?.startsWith("[Global]");
              const cleanText = isGlobalMsg ? msg.message.replace("[Global]", "").trim() : msg.message;

              return (
                <div key={msg.id} className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-1 text-[10.5px]">
                    {isGlobalMsg && (
                      <span className="text-[9px] bg-amber-950 text-amber-300 font-bold px-1 rounded border border-amber-800/50">
                        GLOBAL
                      </span>
                    )}
                    <span
                      className="font-black"
                      style={{
                        color:
                          msg.player_name === currentPlayerName
                            ? "#38bdf8"
                            : "#fbbf24",
                      }}
                    >
                      {msg.player_name}:
                    </span>
                    <span className="text-slate-200 break-words leading-tight">
                      {cleanText}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-white/10 bg-slate-950/60">
            <input
              ref={inputRef}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition font-mono"
              placeholder={isConnected ? (chatChannel === "global" ? "Mensagem Global (todos os mapas)..." : "Mensagem Local...") : "Conectando..."}
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
              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition text-white cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Botão toggle */}
      <button
        onClick={handleToggle}
        className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none group relative cursor-pointer"
        style={{
          background: hasNewMsg ? "rgba(56, 189, 248, 0.9)" : "#ebd9c0",
          border: "2px solid #000",
          color: "#000",
        }}
        title="Chat MMO Global e Local"
      >
        <MessageSquare className="w-5 h-5 md:w-4 md:h-4" />
        <span className="absolute left-13 bg-black text-white text-[8px] uppercase tracking-wider px-2 py-1 rounded border border-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 font-mono">
          Chat MMO
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
      className="fixed top-12 right-2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] font-bold shadow-lg transition-all font-mono select-none"
      style={{
        background: "rgba(10, 12, 20, 0.92)",
        border: isConnected
          ? "1.5px solid rgba(74, 222, 128, 0.5)"
          : "1.5px solid rgba(251, 191, 36, 0.5)",
        backdropFilter: "blur(8px)",
        color: isConnected ? "#4ade80" : "#fbbf24",
      }}
      title={isConnected ? "Multiplayer Ativo (Todos os Mapas)" : "Conectando ao Multiplayer..."}
    >
      <Users className="w-3.5 h-3.5" />
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"
        }`}
      />
      <span>
        {isConnected
          ? `${count + 1} herói(s) online 🌍`
          : "Conectando MMO..."}
      </span>
    </div>
  );
};

