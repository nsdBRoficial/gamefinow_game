# 📜 DOCUMENTO DE REQUISITOS E ESPECIFICAÇÕES TÉCNICAS DO SISTEMA DE BATALHAS (v1.0)

**Projeto:** GameFiNow  
**Branch de Desenvolvimento:** `batalhas`  
**Data:** 28 de Julho de 2026  
**Status:** Especificação Técnica de Requisitos  

---

## 1. VISÃO GERAL DO PROJETO DE BATALHAS

O Sistema de Batalhas do **GameFiNow** adota a **Abordagem Híbrida**:
- **Fase 1 (PvE Mapa Aberto - Estilo Tibia)**: Combate em tempo real diretamente no mapa 2D contra mobs (Blobs, Worms, Bees, Crabs, Snakes). O jogador clica no inimigo para **Fixar Alvo (Target Lock)** e realiza auto-ataques periódicos enquanto usa hotkeys (`1`, `2`, `3`, `Espaço`) para magias e cura.
- **Fase 2 (PvP & Boss Arena - Estilo Final Fantasy VII)**: Transição para uma arena por turnos (ATB) em janela/modal dedicada para duelos entre jogadores e combates contra Chefes Globais.

---

## 2. REQUISITOS DE BANCO DE DADOS & SCHEMAS (SUPABASE)

### 2.1. Tabela `monsters_def` (Definição de Monstros)
```sql
CREATE TABLE IF NOT EXISTS monsters_def (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL DEFAULT 1,
    max_hp INT NOT NULL DEFAULT 100,
    attack INT NOT NULL DEFAULT 10,
    defense INT NOT NULL DEFAULT 5,
    speed INT NOT NULL DEFAULT 10,
    exp_reward INT NOT NULL DEFAULT 25,
    gamefi_reward_min INT NOT NULL DEFAULT 1,
    gamefi_reward_max INT NOT NULL DEFAULT 5,
    sprite_type VARCHAR(50) NOT NULL,
    aggro_range INT DEFAULT 3 -- Raio de agressão em tiles (0 = passivo)
);
```

### 2.2. Tabela `player_inventory` (Itens de Combate & Consumíveis)
```sql
CREATE TABLE IF NOT EXISTS player_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id VARCHAR(100) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'potion_hp', 'potion_mp', 'weapon', 'armor'
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 3. EVENTOS WEBSOCKET (SOCKET.IO)

Para garantir sincronização multiplayer em tempo real das batalhas:

| Evento Socket.io | Direção | Payload / Parâmetros | Descrição |
|---|---|---|---|
| `monster_attacked` | Cliente ➔ Servidor | `{ monsterId, targetPlayerId, skillId }` | Emite intenção de ataque do jogador ao mob. |
| `monster_damaged` | Servidor ➔ Cliente (Broadcast) | `{ monsterId, damage, currentHp, attackerId, isCritical }` | Notifica todos os clientes do mapa sobre o dano causado no mob e atualiza a barra de HP. |
| `monster_defeated` | Servidor ➔ Cliente (Broadcast) | `{ monsterId, killerId, expGained, gamefiRewarded, loot }` | Notifica a morte do mob, limpa o canvas e concede recompensas. |
| `pvp_challenge` | Cliente ➔ Servidor | `{ targetPlayerId, wagerAmount }` | Convida outro jogador para duelo PvP na Arena por Turnos. |
| `pvp_action` | Cliente ➔ Servidor | `{ matchId, actionType, skillId }` | Transmite a ação do turno (Atacar, Magia, Defender, Item) na Arena PvP. |

---

## 4. COMPONENTES FRONTEND & ESTADO REQUERIDOS

### 4.1. Componentes de Interface (UI)
- **`BattleOverlay.tsx`**: Interface do HUD de combate no mapa (Target Lock, barra de vida do inimigo selecionado, feedback numérico de dano flutuante *-15 Floating Combat Text*).
- **`TurnBattleModal.tsx`**: Modal retro pixel-art contendo a Arena por Turnos estilo Final Fantasy VII (para PvP e Bosses).
- **`HotbarUI.tsx`**: Barra inferior ou lateral com atalhos configuráveis (`1`, `2`, `3`, `4`, `Espaço`) para poções e magias.

### 4.2. Efeitos Sonoros Requeridos (Web Audio / Synth)
- `sound_hit_sword`: Som sintético de golpe físico de lâmina.
- `sound_hit_magic`: Som de magia / elemento.
- `sound_potion`: Som de consumo de poção de vida.
- `sound_level_up`: Fanfarra de subida de nível.
- `sound_victory`: Música de vitória na batalha por turnos.

---

## 5. REQUISITOS INTEGRADOS DE CONTRATOS INTELIGENTES (SOROBAN)

- **Contrato de Recompensa de Loot (`LootDistributor.soroban`)**: Chamada em lote (*batch*) executada periodicamente para transferir os tokens `GAMEFI` ganhos em batalhas diretas para o saldo on-chain dos jogadores na Testnet.
- **Contrato de Apostas PvP (`WagerPvP.soroban`)**: Custódia de fundos (Escrow) que retém o valor apostado pelos dois duelantes e libera 100% do valor (descontando 0.5% de taxa da Tesouraria) para o vencedor do duelo tático.

---

## 6. PRÓXIMOS PASSOS (PLANEJAMENTO DE AMANHÃ)

1. Revisar este documento [`DOC_REQUISITOS_BATALHAS.md`](file:///c:/Users/Usu%C3%A1rio/Documents/GitHub/gamefinow_game/DOC_REQUISITOS_BATALHAS.md) e o plano de implementação.
2. Iniciar o desenvolvimento dos componentes no branch `batalhas`.
