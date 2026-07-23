# 🌐 GameFiNow — Plano de Implementação Multiplayer / MMO

> **Branch:** `feature/multiplayer-mmo`  
> **Data de criação:** Julho 2026  
> **Versão do Jogo:** 0.7.7+  
> **Objetivo:** Transformar o GameFiNow de um jogo single-player local em um MMO com múltiplos jogadores simultâneos visíveis no mundo

---

## 🎯 Visão Geral

O GameFiNow é atualmente um jogo single-player que roda 100% no browser, com estado salvo no `localStorage`. O objetivo é evoluí-lo para um **MMO (Massively Multiplayer Online)** onde:

- Vários jogadores aparecem simultaneamente no mapa
- As posições dos jogadores são sincronizadas em tempo real
- O progresso de cada jogador é persistido em banco de dados
- O jogo escala para centenas (e futuramente milhares) de usuários simultâneos

---

## 🏗️ Arquitetura Atual (Diagnóstico)

```
Browser (React + Canvas)
  ├── gameStore.ts (Zustand) → localStorage
  ├── GameCanvas.tsx (HTML5 Canvas, 60 FPS)
  ├── stellarServices.ts → Stellar Testnet (Horizon API)
  └── App.tsx → orchestração geral
```

**Limitações atuais para MMO:**
- Estado apenas local (localStorage) — sem persistência remota
- Sem sistema de sessão/autenticação de usuários
- Sem canal de comunicação em tempo real entre clientes
- `drawOtherPlayers()` já existe no canvas (a função já está preparada!), mas não tem dados reais
- Posição do jogador, customização e quests ficam apenas no cliente

---

## ☁️ Infraestrutura Disponível (Sem Custo Inicial)

| Serviço | Plano Free | Limite |
|--------|-----------|--------|
| **Supabase** | Free Tier | 500MB DB, 2GB storage, 50K MAU |
| **Vercel** | Hobby | Deploys ilimitados, 100GB bandwidth |
| **Hostinger** | Plano contratado | Upload de `dist/` estático |

---

## 📡 Opções de Arquitetura para Tempo Real

### ✅ OPÇÃO 1 — Supabase Realtime (RECOMENDADA — Custo Zero)

**Como funciona:**  
O Supabase possui um sistema de **Realtime** baseado em WebSockets (via Phoenix Channels / PostgreSQL LISTEN/NOTIFY). Cada jogador publica sua posição no banco e assina as atualizações dos outros.

```
Browser A ──POST posição──► Supabase DB
                                │
                    LISTEN/NOTIFY (Realtime)
                                │
Browser B ◄─── recebe posição ──┘
```

**Fluxo técnico:**
1. Jogador se conecta → `supabase.channel('mapa-center').subscribe()`
2. A cada movimento → `supabase.from('players_presence').upsert({ id, x, y, mapId, ... })`
3. Outros jogadores recebem via `on('postgres_changes', ...)` em tempo real

**Prós:**
- ✅ 100% gratuito no Free Tier
- ✅ Supabase Presence: canal de presença nativo para salas/mapas
- ✅ PostgreSQL robusto para persistência
- ✅ Auth integrado (email, Google, wallet address)
- ✅ Row Level Security (RLS) para proteção dos dados
- ✅ SDK TypeScript oficial e bem documentado
- ✅ Não precisa de servidor Node.js próprio

**Contras:**
- ⚠️ Latência ~100-300ms (aceitável para MMO casual)
- ⚠️ Free tier: 200 conexões simultâneas (suficiente para início)
- ⚠️ Não é ideal para jogos FPS/ação rápida (mas é perfeito para RPG/MMO casual)

**Custo estimado:**
- 0 a 500 usuários ativos: **Grátis**
- 500 a 5.000 usuários: **~$25/mês** (Supabase Pro)

---

### OPÇÃO 2 — WebSocket Server próprio no Hostinger

**Como funciona:**  
Um servidor Node.js com `ws` ou `Socket.io` rodando no Hostinger, conectado a um banco PostgreSQL ou Redis.

```
Browser ──WebSocket──► Node.js Server (Hostinger)
                              │
                         PostgreSQL / Redis
```

**Prós:**
- ✅ Controle total sobre a lógica
- ✅ Latência menor (~50ms)
- ✅ Sem limite de conexões externo

**Contras:**
- ❌ Exige hospedagem Node.js ativa (Hostinger Business ou VPS)
- ❌ Gerenciamento manual de servidor, SSL, uptime
- ❌ O Hostinger shared hosting NÃO suporta WebSockets nativos
- ❌ Precisa de VPS (~$5-15/mês) ou plano Business

**Custo estimado:**
- VPS Hostinger KVM1: **~$4.99/mês**
- Ou Railway.app free tier: **500h/mês grátis**

---

### OPÇÃO 3 — Supabase Realtime + PartyKit (Presença avançada)

**Como funciona:**  
PartyKit é um serviço para construir aplicações multiplayer em tempo real via Cloudflare Workers. Gratuito para uso moderado.

```
Browser ──WebSocket──► PartyKit Server (Cloudflare Edge)
                              │
                         Supabase (persistência)
```

**Prós:**
- ✅ Latência ultra-baixa (edge computing global)
- ✅ Free tier generoso (25.000 req/dia)
- ✅ Perfeito para presença de jogadores (posição, chat)

**Contras:**
- ⚠️ Serviço relativamente novo
- ⚠️ Curva de aprendizado adicional

---

### OPÇÃO 4 — Vercel + Edge Functions + Supabase

**Como funciona:**  
Usar Vercel Edge Functions como middleware de sincronização + Supabase como banco.

```
Browser ──fetch──► Vercel Edge Function ──► Supabase
                   (valida, sanitiza, broadcast)
```

**Prós:**
- ✅ Totalmente serverless
- ✅ Deploy automático via Vercel
- ✅ Gratuito nos limites do Hobby

**Contras:**
- ❌ Edge Functions não suportam WebSocket persistente (só request/response)
- ❌ Para tempo real precisaria de polling (menos eficiente)

---

## 🏆 RECOMENDAÇÃO FINAL: Supabase Realtime + Vercel

```
┌─────────────────────────────────────────────────────┐
│                   ARQUITETURA MMO                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Browser] React + Canvas                            │
│      │                                               │
│      ├─── Auth ──────────► Supabase Auth             │
│      │                        │                      │
│      ├─── Posição (WS) ──────► Supabase Realtime     │
│      │    (Presence Channels)     │                  │
│      │                        PostgreSQL DB          │
│      ├─── Dados Persistentes ─► Supabase REST API    │
│      │    (quests, wallet, char)                     │
│      │                                               │
│      └─── Static Files ──────► Vercel / Hostinger    │
│                                                      │
│  [Stellar Network] ─────────► Horizon / Soroban API │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ Modelo de Banco de Dados (Supabase/PostgreSQL)

### Tabela: `players`
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stellar_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),

  gender TEXT DEFAULT 'male',
  head_color TEXT DEFAULT '#fcd34d',
  torso_color TEXT DEFAULT '#ef4444',
  legs_color TEXT DEFAULT '#2563eb',
  shoes_color TEXT DEFAULT '#1e293b',
  skin_color TEXT DEFAULT '#ffdbac',
  head_type TEXT DEFAULT 'square',
  torso_type TEXT DEFAULT 'plain',
  shoes_type TEXT DEFAULT 'sneakers',
  face_type TEXT DEFAULT 'smile',
  accessory_type TEXT DEFAULT 'backpack',
  active_outfit TEXT,
  owned_outfits TEXT[] DEFAULT '{}',
  active_title TEXT,
  unlocked_titles TEXT[] DEFAULT '{}',
  name_style TEXT DEFAULT 'plain'
);
```

### Tabela: `players_presence` (Posição em tempo real)
```sql
CREATE TABLE players_presence (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  map_id TEXT DEFAULT 'center',
  x REAL NOT NULL,
  y REAL NOT NULL,
  dir TEXT DEFAULT 'down',
  is_moving BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (player_id)
);

CREATE INDEX idx_presence_map_id ON players_presence(map_id);
```

### Tabela: `player_quests`
```sql
CREATE TABLE player_quests (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  status TEXT DEFAULT 'locked',
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (player_id, quest_id)
);
```

### Tabela: `player_wallets`
```sql
CREATE TABLE player_wallets (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  stellar_address TEXT NOT NULL,
  xlm_balance REAL DEFAULT 0,
  usdc_balance REAL DEFAULT 0,
  gamefi_balance REAL DEFAULT 0,
  last_faucet_claim BIGINT,
  PRIMARY KEY (player_id)
);
```

### Tabela: `chat_messages`
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  player_name TEXT NOT NULL,
  map_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_map_time ON chat_messages(map_id, created_at DESC);
```

---

## 🔐 Sistema de Autenticação

### Estratégia: Stellar Wallet como Identidade

```typescript
// Fluxo de Auth:
// 1. Frontend gera um "challenge" (timestamp + nonce)
// 2. Jogador assina com a chave privada Stellar
// 3. Supabase Edge Function verifica a assinatura
// 4. Se válida, emite JWT do Supabase

async function authenticateWithStellar(publicKey: string, secretKey: string) {
  const challenge = `gamefinow-auth-${Date.now()}`;
  const signature = signMessage(challenge, secretKey);

  const { data } = await supabase.functions.invoke('stellar-auth', {
    body: { publicKey, challenge, signature }
  });

  await supabase.auth.setSession(data.session);
}
```

**Alternativa simples (MVP):** Usar o `publicKey` da Stellar como identificador único sem assinatura criptográfica. Menos seguro mas suficiente para o início.

---

## 🎮 Sistema de Presença em Tempo Real

### A função `drawOtherPlayers()` já existe no GameCanvas.tsx!

Precisamos apenas alimentá-la com dados reais:

```typescript
// src/services/multiplayerService.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface OnlinePlayer {
  player_id: string;
  name: string;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  mapId: string;
  headColor: string;
  torsoColor: string;
  legsColor: string;
  shoesColor: string;
  skinColor: string;
  headType: string;
  torsoType: string;
  faceType: string;
  accessoryType: string;
}

export async function publishPosition(player: Player, playerId: string) {
  await supabase
    .from('players_presence')
    .upsert({
      player_id: playerId,
      map_id: player.mapId,
      x: player.x,
      y: player.y,
      dir: player.dir,
      is_moving: player.isMoving,
      updated_at: new Date().toISOString()
    });
}

export function subscribeToMap(
  mapId: string,
  onUpdate: (players: OnlinePlayer[]) => void
) {
  return supabase
    .channel(`map-${mapId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players_presence',
        filter: `map_id=eq.${mapId}`
      },
      () => fetchPlayersInMap(mapId).then(onUpdate)
    )
    .subscribe();
}
```

### Throttling (anti-spam)

```typescript
const POSITION_THROTTLE_MS = 100;
let lastPositionSent = 0;

function maybePublishPosition(player: Player, playerId: string) {
  const now = Date.now();
  if (now - lastPositionSent > POSITION_THROTTLE_MS) {
    publishPosition(player, playerId);
    lastPositionSent = now;
  }
}
```

---

## 💬 Sistema de Chat MMO

```typescript
export function sendChatMessage(mapId: string, player: Player, message: string) {
  return supabase.from('chat_messages').insert({
    player_id: getCurrentPlayerId(),
    player_name: player.name,
    map_id: mapId,
    message: message.slice(0, 200)
  });
}

export function subscribeToChatOnMap(
  mapId: string,
  onMessage: (msg: ChatMessage) => void
) {
  return supabase
    .channel(`chat-${mapId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `map_id=eq.${mapId}`
    }, (payload) => onMessage(payload.new as ChatMessage))
    .subscribe();
}
```

---

## 📋 Plano de Implementação — 6 Fases

### FASE 1: Fundação (2–3 semanas) — SEM QUEBRAR NADA

**Objetivo:** Configurar o Supabase e migrar o estado para o banco, mantendo o jogo funcionando offline.

- [ ] 1.1 Criar projeto no Supabase e configurar schemas
- [ ] 1.2 Instalar `@supabase/supabase-js` no projeto
- [ ] 1.3 Criar `src/services/supabaseClient.ts` (singleton do client)
- [ ] 1.4 Criar `src/services/playerService.ts` (CRUD de jogadores)
- [ ] 1.5 Migrar dados do `localStorage` para Supabase ao fazer login
- [ ] 1.6 Adicionar variáveis de ambiente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] 1.7 Implementar RLS (Row Level Security) no Supabase

**✅ Resultado:** Jogo funciona normalmente mas dados são salvos no banco.

---

### FASE 2: Autenticação (1–2 semanas)

**Objetivo:** Sistema de login vinculado à carteira Stellar.

- [ ] 2.1 Criar Supabase Edge Function `stellar-auth`
- [ ] 2.2 Implementar fluxo de assinatura no frontend
- [ ] 2.3 Atualizar `LoginScreen.tsx` para autenticar via Supabase após criar/importar wallet
- [ ] 2.4 Gerenciar sessão com `supabase.auth.onAuthStateChange()`
- [ ] 2.5 Proteger rotas com verificação de sessão ativa

**✅ Resultado:** Cada jogador tem identidade única persistida no banco.

---

### FASE 3: Presença em Tempo Real (2–3 semanas) ⭐ FASE PRINCIPAL

**Objetivo:** Ver outros jogadores se movendo no mapa!

- [ ] 3.1 Criar tabela `players_presence` com Realtime habilitado
- [ ] 3.2 Criar `src/services/multiplayerService.ts`
- [ ] 3.3 Publicar posição do jogador a cada movimento (throttle 100ms)
- [ ] 3.4 Assinar canal do mapa atual e receber posições dos outros
- [ ] 3.5 Conectar dados ao `drawOtherPlayers()` existente no `GameCanvas.tsx`
- [ ] 3.6 Adicionar indicador de quantos jogadores estão online
- [ ] 3.7 Gerenciar desconexões (remover jogadores inativos >30s)
- [ ] 3.8 Supabase Presence para status online/offline

**✅ Resultado:** 🎉 MMO funcional! Múltiplos jogadores visíveis simultaneamente.

---

### FASE 4: Chat e Interação Social (1–2 semanas)

**Objetivo:** Comunicação entre jogadores.

- [ ] 4.1 Criar tabela `chat_messages`
- [ ] 4.2 Criar componente `ChatBox.tsx` (balões de fala no mapa)
- [ ] 4.3 Chat por proximidade (apenas jogadores no mesmo mapa)
- [ ] 4.4 Adicionar comando `/me` para emotes
- [ ] 4.5 Sistema de notificação "X jogadores online agora"
- [ ] 4.6 Balões de fala visíveis no canvas acima do personagem

**✅ Resultado:** Jogadores podem se comunicar.

---

### FASE 5: Persistência Completa e Placar (1–2 semanas)

**Objetivo:** Rankings, conquistas e dados completos no banco.

- [ ] 5.1 Migrar quests completadas para `player_quests`
- [ ] 5.2 Migrar customização de personagem para `players`
- [ ] 5.3 Criar leaderboard de quests completadas
- [ ] 5.4 Sistema de conquistas (badges visíveis no perfil)
- [ ] 5.5 Histórico de transações Stellar vinculado ao perfil
- [ ] 5.6 Perfil público do jogador (passaporte visível por outros)

---

### FASE 6: Deploy e Escala (1 semana)

**Objetivo:** Colocar no ar para múltiplos usuários.

- [ ] 6.1 Build de produção: `npm run build`
- [ ] 6.2 Deploy no Vercel (recomendado) ou upload `dist/` no Hostinger
- [ ] 6.3 Configurar variáveis de ambiente no painel do Vercel
- [ ] 6.4 Configurar domínio personalizado
- [ ] 6.5 Configurar CORS no Supabase para o domínio de produção
- [ ] 6.6 Testes de carga com múltiplos usuários simultâneos
- [ ] 6.7 Monitoramento com Supabase Dashboard + Vercel Analytics

---

## 🚀 Opções de Deploy

### OPÇÃO A: Vercel (Recomendada para início)

```bash
npm i -g vercel
vercel --prod \
  -e VITE_SUPABASE_URL=https://xxx.supabase.co \
  -e VITE_SUPABASE_ANON_KEY=xxx
```

- ✅ Deploy automático via git push
- ✅ Preview deployments por branch
- ✅ CDN global gratuita + SSL automático
- **URL exemplo:** `gamefinow.vercel.app`

---

### OPÇÃO B: Hostinger (Dist estático)

```bash
npm run build
# Upload da pasta dist/ para o Hostinger via FTP/File Manager
```

- ✅ Você já tem o plano contratado
- ✅ Pode usar domínio próprio (ex: gamefinow.com)
- ⚠️ Deploy manual (sem CI/CD automático)

**Estratégia ideal:** Vercel para desenvolvimento/preview + Hostinger para produção com domínio oficial.

---

### OPÇÃO C: GitHub Pages (100% Grátis)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 💰 Tabela de Custos Projetados

| Fase | Usuários Ativos | Serviços | Custo/mês |
|------|----------------|----------|-----------|
| MVP | 0 – 100 | Supabase Free + Vercel Hobby | **R$ 0** |
| Crescimento | 100 – 500 | Supabase Free + Vercel Hobby | **R$ 0** |
| Escala leve | 500 – 2.000 | Supabase Pro ($25) + Vercel Hobby | **~R$ 140** |
| Escala média | 2.000 – 10.000 | Supabase Pro + Vercel Pro ($20) | **~R$ 250** |
| MMO real | 10.000+ | Supabase Pro + Dedicated DB | **~R$ 500–2.000** |

> 💡 Com a Stellar como backbone financeiro, o jogo pode se monetizar via taxas mínimas de transação, itens especiais e passes de temporada sem depender de planos pagos no início.

---

## ⚡ Otimizações de Performance para MMO

### 1. Throttle de posição
```typescript
const publishThrottled = throttle(publishPosition, 100);
```

### 2. Spatial Partitioning (por mapa)
```typescript
supabase.channel(`map-${player.mapId}`)
// Jogador só recebe atualizações do mapa onde está
```

### 3. Dead Reckoning (interpolação suave)
```typescript
function interpolatePosition(current: Position, target: Position, alpha: number): Position {
  return {
    x: current.x + (target.x - current.x) * alpha,
    y: current.y + (target.y - current.y) * alpha,
  };
}
```

### 4. Cleanup de jogadores inativos
```typescript
const PLAYER_TIMEOUT_MS = 30_000;
function isPlayerActive(player: OnlinePlayer): boolean {
  return Date.now() - new Date(player.updated_at).getTime() < PLAYER_TIMEOUT_MS;
}
```

### 5. Limite de jogadores visíveis por mapa
```typescript
const MAX_VISIBLE_PLAYERS = 50;
function getPlayersInViewport(allPlayers: OnlinePlayer[], viewport: Viewport): OnlinePlayer[] {
  return allPlayers
    .filter(p => isInViewport(p, viewport))
    .slice(0, MAX_VISIBLE_PLAYERS);
}
```

---

## 🔒 Segurança

### Row Level Security (RLS)

```sql
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_own_update" ON players
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "players_public_read" ON players
  FOR SELECT USING (true);

ALTER TABLE players_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presence_own_update" ON players_presence
  FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "presence_public_read" ON players_presence
  FOR SELECT USING (true);
```

### Anti-Cheat Básico
```sql
CREATE OR REPLACE FUNCTION validate_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.x < 0 OR NEW.x > 100 OR NEW.y < 0 OR NEW.y > 100 THEN
    RAISE EXCEPTION 'Posição inválida';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_position
  BEFORE INSERT OR UPDATE ON players_presence
  FOR EACH ROW EXECUTE FUNCTION validate_position();
```

### Rate Limiting
- Limitar publicações de posição a 20/s por jogador
- Limitar mensagens de chat a 1/s por jogador
- Validar tamanho máximo das mensagens (200 chars)

---

## 📱 Considerações Mobile

O jogo já tem suporte a joystick virtual (`react-nipple`). Para o MMO mobile:

- ✅ A UI de chat precisa ser colapsável (teclado virtual ocupa muito espaço)
- ✅ Indicador de jogadores online discreto (não atrapalhar o canvas)
- ✅ Notificações de chat aparecem como balões no canvas, não em caixa fixa

---

## 🗺️ Roadmap Visual

```
AGORA (v0.7.7)          FASE 1              FASE 2
Single Player     →   Supabase DB     →   Auth Stellar
localStorage          migração             + Sessão JWT

    FASE 3              FASE 4              FASE 5+
Ver Outros        →    Chat MMO       →   Leaderboard
Jogadores              Proximidade         Rankings
(CORE MMO!)            Emotes              Conquistas

    FASE 6
Deploy Vercel
+ Hostinger prod
+ Domínio customizado
```

---

## 🛠️ Dependências a Instalar

```bash
npm install @supabase/supabase-js

# Opcional para throttle/debounce
npm install lodash-es
npm install --save-dev @types/lodash-es
```

---

## 📝 Variáveis de Ambiente a Adicionar

### `.env-dev`
```env
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-anon-key]
VITE_MULTIPLAYER_ENABLED=true
VITE_MAX_PLAYERS_PER_MAP=50
VITE_POSITION_THROTTLE_MS=100
```

### `.env-prod`
```env
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-anon-key-de-producao]
VITE_MULTIPLAYER_ENABLED=true
VITE_MAX_PLAYERS_PER_MAP=100
VITE_POSITION_THROTTLE_MS=150
```

---

## 🎯 Critérios de Sucesso por Fase

| Fase | Critério |
|------|---------|
| Fase 1 | Dados do jogador salvos no Supabase após login |
| Fase 2 | Login com carteira Stellar cria sessão persistente |
| Fase 3 | 2 abas do browser mostram os jogadores se movendo mutuamente |
| Fase 4 | Mensagem de chat aparece como balão em outra aba |
| Fase 5 | Leaderboard mostra top jogadores por quests completadas |
| Fase 6 | Jogo acessível via domínio público com 10+ usuários simultâneos |

---

## 💡 Dicas e Boas Práticas

1. **Supabase local:** Use `supabase start` para rodar o banco localmente. Evita consumir o free tier em testes.

2. **Feature flag:** Adicione `VITE_MULTIPLAYER_ENABLED=false` para desligar o multiplayer rapidamente se houver problemas.

3. **Graceful degradation:** Se a conexão com Supabase falhar, o jogo continua funcionando em modo single-player (localStorage como fallback).

4. **Sincronize só o necessário:** Envie coordenadas de grid (x, y inteiros) e interpole no cliente. Não envie posição pixel a pixel.

5. **Stellar como camada econômica:** O multiplayer não substitui a blockchain. A Stellar continua sendo o backbone financeiro (tokens, quests) enquanto o Supabase cuida da sincronização em tempo real.

6. **Migrations versionadas:** Use Supabase CLI com migrations desde o início para não perder o schema em atualizações.

7. **Teste com múltiplas abas:** Durante desenvolvimento, 2-3 abas do browser simulam múltiplos jogadores perfeitamente.

8. **Monitore o uso:** O Supabase Dashboard mostra conexões WebSocket ativas em tempo real. Fique de olho para não estourar o free tier.

---

## 🔗 Recursos e Referências

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase Presence](https://supabase.com/docs/guides/realtime/presence)
- [Supabase Auth customizado](https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Vercel Deploy Docs](https://vercel.com/docs/deployments/overview)
- [PartyKit — Multiplayer alternativo](https://partykit.io)
- [Dead Reckoning em jogos](https://gafferongames.com/post/state_synchronization/)
- [Stellar SDK TypeScript](https://stellar.github.io/js-stellar-sdk/)

---

*Documento criado na branch `feature/multiplayer-mmo` — GameFiNow v0.7.7+*  
*Próximo passo sugerido: Fase 1 — Configuração do Supabase e migração do estado*
