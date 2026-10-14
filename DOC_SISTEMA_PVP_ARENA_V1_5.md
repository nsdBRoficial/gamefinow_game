# ⚔️ Especificação Técnica Oficial — Sistema de Arena PvP v1.5pvp
## GameFiNow — The Arena & Open-World PvP Definitive Release

---

## 📌 1. Visão Geral e Propósito

A versão **v1.5pvp** consolida a transição do GameFiNow de uma experiência estritamente PvE para um **MMORPG completo em tempo real com combates PvP abertos**. O sistema permite que jogadores de todas as 4 classes consagradas se enfrentem no **Coliseu de Batalhas (Arena 60×60)**, combinando física no canvas, seleção de alvo dinâmico (Target Lock), habilidades mágicas com Global Cooldown (GCD), placar competitivo em tempo real e proteção avançada contra exploits (anti-spawn kill e anti-combat logging).

---

## 🏗️ 2. Arquitetura de Software e Fluxo de Dados

O sistema opera sob uma arquitetura híbrida com **autoridade final no Servidor** e **reconciliação visual otimista no Cliente**:

```
 ┌────────────────────────────────────────────────────────┐
 │                   CLIENTE (Navegador)                  │
 │                                                        │
 │  [GameCanvas 60fps] ──> [Target Locking / HUD]         │
 │          │                           ▲                 │
 │          ▼                           │                 │
 │   [useGameStore] ─────────── [ArenaScoreHUD]           │
 └──────────┬───────────────────────────▲─────────────────┘
            │                           │
  Socket.IO │ Eventos de Ação           │ Sincronização & Dano
  (WebSocket)                           │
            ▼                           │
 ┌──────────────────────────────────────┴─────────────────┐
 │                   SERVIDOR (Node/Express)              │
 │                                                        │
 │  - Validação de Alcance (Range Check por Classe)       │
 │  - Verificação de Buffs / Invulnerabilidade            │
 │  - Cálculo de Dano Físico e Mágico (RNG + Crítico)    │
 │  - Verificação Anti-Cheat (Teto de Dano por Nível)     │
 │  - Transmissão Broadcast para a Sala `arena:<id>`      │
 └────────────────────────────────────────────────────────┘
```

### Componentes Principais do Frontend:
1. **[`ArenaCanvas.tsx`](./src/components/ArenaCanvas.tsx)** & **[`GameCanvas.tsx`](./src/components/GameCanvas.tsx)**: Renderizadores Canvas 2D responsáveis por desenhar o ringue de areia, jogadores remotos com roupas/skins fiéis, tochas animadas, indicadores de alvo e efeitos de combate.
2. **[`BattleHUD.tsx`](./src/components/BattleHUD.tsx)**: Barra de ação contendo slots numéricos (1, 2, 3 para Magias, 4 e 5 para Poções), barra de GCD animada e o **TargetHUD** integrado no topo.
3. **[`ArenaScoreHUD.tsx`](./src/components/ArenaScoreHUD.tsx)**: Placar reativo exibido abaixo do chat com contadores de Kills, Mortes, K/D Ratio e Killstreaks com animação de fogo.
4. **[`useGameStore.ts`](./src/store/gameStore.ts)**: Estado global Zustand gerenciando `lockedTargetId`, `targetInfo`, `arenaScore`, `activeBuffs` e posicionamento.

---

## 🏟️ 3. O Coliseu de Batalhas (Arena 60×60)

O mapa [`arenaMap.ts`](./src/maps/arenaMap.ts) foi projetado matematicamente com uma grade de 60×60 azulejos:
- **Ringue Central de Combate**: Círculo euclidiano de areia com raio de **14 tiles** centrado em `(30, 30)`.
- **Muralhas e Arquibancadas**: Delimitação com azulejos de pedra intransponíveis (`isArenaCollidable`) que confinam a luta.
- **Portais de Saída Segura**: Coordenadas `(30, 55)` ao sul que permitem evacuação instantânea para a praça central.
- **Entrada no Mundo**: Acesso no mapa central pelas coordenadas `x=41, y=17` através do edifício temático do Coliseu.

---

## 🎯 4. Target Locking System (Mira Travada)

O sistema de trava de alvo foi modelado para oferecer jogabilidade competitiva precisa:
1. **Ativação**: O jogador pode clicar com o ponteiro do mouse diretamente sobre o sprite de qualquer adversário na tela.
2. **Armazenamento no Estado**: O ID e os metadados do adversário são registrados em `targetInfo`:
   - `id`: Identificador exclusivo da sessão ou carteira.
   - `name`: Nome do jogador exibido no jogo.
   - `guildTag`: Tag da guilda vinculada (ex: `[STAR]`).
   - `level`: Nível atual de experiência.
   - `hp` e `maxHp`: Vida reativa para atualização da barra do Target HUD.
   - `playerClass`: Classe para exibição contextual de arquétipo.
3. **Desengajamento Rápido**: Tecla `ESC` limpa imediatamente a seleção de alvo.

---

## 🏆 5. Placar de Combate (Arena Scoreboard HUD)

Monitora o desempenho do gladiador durante toda a permanência no Coliseu:
- **Abates (Kills)**: Incrementado automaticamente via evento `recordArenaKill()`.
- **Mortes (Deaths)**: Registrado ao sofrer dano letal (`recordArenaDeath()`).
- **K/D Ratio**: Calculado como `kills / deaths` (com precisão de uma casa decimal; se deaths = 0, ratio = kills).
- **Streak & Recorde**:
  - A sequência atual é incrementada a cada abate e zerada ao morrer.
  - Sequências $\ge 3$ ativam animação de chamas ardentes (`🔥`).
  - O recorde da maior sequência da sessão (`highestStreak`) permanece preservado mesmo após morrer.
- **Limpeza de Sessão**: Ao teleportar para fora do Coliseu, o placar é reinicializado com `resetArenaScore()`.

---

## 🛡️ 6. Mecânicas de Sobrevivência & Anti-Exploit

### 6.1 Contextual Respawn (Renascer na Arena)
- Ao morrer na Arena, o jogador não é forçado a voltar à cidade central.
- O botão **Renascer** teleporta o jogador diretamente para a base sul do Coliseu: **`x: 30, y: 53`** com 100% de HP restaurado.
- Mortes fora da Arena mantêm o respawn canônico na praça central (`x: 30, y: 30`).

### 6.2 Escudo Anti-Spawn Kill (3 Segundos)
- Imediatamente após renascer na Arena, o jogador recebe o buff `buff_shield_respawn`.
- Propriedade: `invulnerable: true` durante 3000ms.
- Enquanto o escudo estiver ativo, o motor do servidor descarta 100% de qualquer dano recebido, impedindo que adversários acampem no ponto de renascimento.

### 6.3 Safe Spawn Anti-Combat Logging
- Se um jogador fechar o navegador, perder a conexão de rede ou deslogar enquanto estiver na Arena, os dados de persistência forçam o próximo carregamento para o centro pacífico (`x: 30, y: 30` do mapa `center`).
- Impede que jogadores fiquem deslogando em combate para reaparecer de surpresa nas costas dos oponentes.

### 6.4 Isolamento Multi-Aba via `getOrCreatePlayerId()`
- No arquivo [`multiplayerService.ts`](./src/services/multiplayerService.ts), o identificador anônimo de jogadores sem carteira utiliza o escopo de janela (`window.name` e `sessionStorage`).
- Permite que desenvolvedores e moderadores abram 2 ou mais abas no mesmo navegador (ex: Chrome ou Edge) e simulem batalhas PvP entre duas contas diferentes sem colisão de IDs.

---

## ⚖️ 7. Motor de Combate (PvP Engine) e Balanceamento

### 7.1 Alcances de Ataque (Attack Range)
| Classe | Tipo de Ataque | Alcance Máximo (Tiles) |
|---|---|---|
| **Guerreiro Estelar** | Melee Físico | 1.5 |
| **Guardião da Rede** | Melee Físico | 1.5 |
| **Caçador Cósmico** | Ranged Físico | 4.5 |
| **Alquimista Soroban** | Ranged Mágico | 4.5 |

### 7.2 Fórmulas Matemáticas de Dano
- **Dano Físico Base**:
  $$\text{DanoBase} = \max\left(1, \text{ATK} \times \left(1 + \frac{\text{STR}}{100}\right) - \frac{\text{DEF}_{\text{alvo}}}{2}\right)$$
- **Variação Aleatória (Roll)**:
  $$\text{Roll} \in [0.85, 1.15]$$
- **Chance de Crítico**:
  $$\text{ChanceCrit} = 0.05 + \frac{\text{AGI}}{100}$$
  $$\text{Multiplicador de Crítico} = 2.0\times$$
- **Fator Defensivo de Buffs**:
  $$\text{FatorDef} = \max\left(0.2, 1 - \sum \text{damageReduction}\right)$$
  *(O fator defensivo limita a redução a 80%, garantindo que mesmo tanques com buffs recebam pelo menos 20% do impacto).*

### 7.3 Validação Anti-Cheat (Teto de Dano)
No servidor, todo dano recebido é validado por:
$$\text{DanoValido} \iff 0 < \text{dano} \le (\text{Level}_{\text{atacante}} \times 80)$$
Ataques que excedam este teto são rejeitados e logados como anomalias.

---

## 📡 8. Protocolo de Eventos Socket.io

| Evento | Direção | Payload / Parâmetros | Descrição |
|---|---|---|---|
| `arena_join_request` | Cliente ➔ Servidor | `{ playerId, mode, sessionId, playerPayload }` | Solicita entrada na fila ou sala da Arena |
| `arena_sync` | Servidor ➔ Cliente | `PvpSession` | Sincroniza estado de todos os jogadores da arena |
| `arena_move` | Cliente ➔ Servidor | `{ sessionId, playerId, arenaX, arenaY, dir }` | Transmite nova coordenada validada |
| `arena_player_move` | Servidor ➔ Broadcast | `{ playerId, arenaX, arenaY, dir }` | Atualiza posição para os outros jogadores |
| `arena_attack` | Cliente ➔ Servidor | `{ sessionId, attackerId, targetId, playerClass }` | Dispara golpe físico |
| `arena_cast_spell` | Cliente ➔ Servidor | `{ sessionId, attackerId, targetId, spellId, spellPower }` | Executa magia direcionada |
| `arena_player_hit` | Servidor ➔ Broadcast | `{ targetId, damage, isCrit, remainingHp }` | Anuncia impacto e dano sofrido |
| `arena_player_eliminated` | Servidor ➔ Broadcast | `{ playerId, killerId }` | Anuncia eliminação no placar |
| `arena_leave` | Cliente ➔ Servidor | `{ sessionId, playerId }` | Abandono voluntário da Arena |

---

## 🧪 9. Validação e Testes Automatizados

O sistema conta com suíte de testes de integração e unitários dedicados em [`arenaPvP.test.ts`](./src/pvp/arenaPvP.test.ts) e [`pvpEngine.test.ts`](./src/pvp/pvpEngine.test.ts):
- **48 testes automatizados aprovados (100% pass)**.
- Validação de cálculo de dano com e sem buffs.
- Validação de alcance euclidiano.
- Teste de respawn contextual dentro e fora da arena.
- Teste de concessão e expiração do escudo anti-spawn kill.
- Teste de contagem e retenção do Arena Scoreboard.
- Script de teste de estresse de concorrência: [`scripts/pvpLoadBenchmark.ts`](./scripts/pvpLoadBenchmark.ts).

---

<div align="center">
  <b>Documento Oficial de Engenharia GameFiNow</b><br/>
  <sub>Versão 1.5pvp — Outubro 2026 — nsdBR Consultoria Blockchain</sub>
</div>
