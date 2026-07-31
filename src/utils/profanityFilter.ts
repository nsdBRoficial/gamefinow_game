/**
 * profanityFilter.ts
 * Filtro de palavrões para o chat MMO do GameFiNow.
 * Suporta: Português (PT-BR), Inglês (EN), Espanhol (ES).
 *
 * Regras:
 *  - Máximo 80 caracteres por mensagem
 *  - Palavras ofensivas são substituídas por "***"
 *  - Case-insensitive, ignora variações com números (ex: "f4ck")
 */

/** Lista de termos bloqueados nas 3 línguas */
const BLOCKED_TERMS_PT: string[] = [
  "puta", "puto", "putinha", "viado", "viadinho", "buceta", "caralho",
  "merda", "porra", "corno", "safado", "safada", "vaca", "pederasta",
  "fdp", "filhoda", "arrombado", "idiota", "imbecil", "retardado",
  "cuzao", "cuzão", "cu", "rola", "piroca", "pau", "maldito",
  "desgraça", "desgraca", "lixo", "escroto", "vagabundo", "vagabunda",
  "prostituta", "vadio", "negro", "negao", "macaco", "bicha", "traveco",
];

const BLOCKED_TERMS_EN: string[] = [
  "fuck", "fucker", "fucking", "fck", "f4ck", "sh1t", "shit",
  "bitch", "bastard", "asshole", "ass", "cunt", "dick", "cock",
  "pussy", "nigger", "nigga", "faggot", "fag", "whore", "slut",
  "retard", "idiot", "moron", "dumbass", "prick", "wanker", "twat",
  "jackass", "bullshit", "motherfucker", "damn", "crap",
];

const BLOCKED_TERMS_ES: string[] = [
  "puta", "puto", "mierda", "cabron", "cabrón", "coño", "joder",
  "hostia", "gilipollas", "imbécil", "idiota", "maricón", "maricon",
  "pendejo", "chingada", "chingar", "polla", "culo", "verga",
  "carajo", "mamón", "mamona", "zorra", "perra", "estupido", "estúpido",
  "bastardo", "maldito", "hideputa", "hdp",
];

const ALL_BLOCKED = [
  ...BLOCKED_TERMS_PT,
  ...BLOCKED_TERMS_EN,
  ...BLOCKED_TERMS_ES,
];

/** Normaliza texto para comparação (leet speak básico) */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/8/g, "b")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
}

/**
 * Verifica se o texto contém palavrão.
 */
export function hasProfanity(text: string): boolean {
  const normalized = normalizeText(text);
  return ALL_BLOCKED.some((word) => {
    const regex = new RegExp(`\\b${normalizeText(word)}\\b`, "i");
    return regex.test(normalized);
  });
}

/**
 * Substitui palavrões por "***" no texto.
 */
export function filterProfanity(text: string): string {
  let result = text;

  ALL_BLOCKED.forEach((word) => {
    const escaped = normalizeText(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    result = result.replace(regex, "***");
  });

  return result;
}

/**
 * Processa uma mensagem de chat:
 * 1. Limita a 80 caracteres
 * 2. Aplica filtro de palavrões
 * 3. Retorna o texto limpo
 */
export function processChatMessage(text: string): string {
  const trimmed = text.trim().slice(0, 80);
  return filterProfanity(trimmed);
}

/** Constante do limite máximo de caracteres do chat */
export const CHAT_MAX_CHARS = 80;
