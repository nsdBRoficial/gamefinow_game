# Sistema de Evolução, Drops e Status dos Inimigos

Este documento detalha o balanceamento matemático e o design do sistema de progressão do **GameFiNow**. As regras aqui estabelecidas regem o ganho de experiência (XP), o nivelamento até o Level 99, os atributos dos monstros (Mobs) e as taxas de Drop (Loot).

---

## 1. Curva de Nivelamento (XP Necessária)

O sistema utiliza uma curva exponencial para determinar o XP necessário para alcançar o próximo nível. 
A fórmula adotada para calcular o XP total para alcançar um `Nivel` (L) é:

$$XP_{total} = \lfloor 50 \times (L - 1)^{2.5} \rfloor$$

### Tabela de Progressão de Nível (Amostragem)

| Nível (Level) | XP Necessária (Total) | Diferença (XP p/ Upar) | Desbloqueio Típico |
|:---:|:---:|:---:|---|
| **1** | 0 | 50 | Início do Jogo |
| **2** | 50 | 232 | Acesso a Batalhas |
| **5** | 1.600 | 1.195 | - |
| **10** | 12.150 | 3.422 | Primeira Evolução de Magia |
| **20** | 78.438 | 10.963 | Acesso a Novos Mapas |
| **30** | 227.181 | 21.611 | Tier Médio |
| **50** | 827.682 | 49.330 | Combate PvP Avançado |
| **75** | 2.378.100 | 86.877 | Chefões Épicos (Arena) |
| **99** | 4.606.312 | 124.088 | Cap Final de Jogador |

*Nota: No banco de dados (Supabase), o jogador armazena a coluna `xp_current`. O nível é dinamicamente calculado através da fórmula inversa ou consultando a tabela.*

---

## 2. Bestiário e Atributos dos Mobs

Cada região do mapa conta com monstros específicos. O ganho de XP e a força não são totalmente estáticos, podendo haver uma leve variação baseada em RNG (Random Number Generation).

### Fórmulas de Atributos Variáveis
Os monstros ao "nascerem" no mapa (Spawn) recebem um grau de aleatoriedade nos atributos para evitar repetição massante:
- **HP e Dano**: $\pm 10\%$ do valor base.
- **XP e Drops**: O jogador ganha XP com uma variação de $\pm 15\%$ baseada no combate.

### Lista de Inimigos

#### 1. Slime (Mapa Central)
- **Nível Base**: 1 a 3
- **HP Base**: 30
- **Ataque Base**: 5
- **Defesa Base**: 2
- **Velocidade**: Baixa
- **XP Base (Por Morte)**: 15 XP ($\pm 15\%$)
- **Drops (Loot)**:
  - GameFi Token: 10% de chance (Drop: 0.1 a 0.5 GFN)
  - Joia Pequena / Gema Bruta (Item Comum): 5% chance

#### 2. Cave Worm (Mapa Leste)
- **Nível Base**: 4 a 7
- **HP Base**: 65
- **Ataque Base**: 12
- **Defesa Base**: 8 (Possui armadura natural)
- **Velocidade**: Média-Baixa
- **XP Base**: 45 XP ($\pm 15\%$)
- **Drops (Loot)**:
  - GameFi Token: 18% de chance (Drop: 0.5 a 1.2 GFN)
  - Fragmento de Topázio: 8% chance

#### 3. Crab (Mapa Norte)
- **Nível Base**: 8 a 12
- **HP Base**: 120
- **Ataque Base**: 22
- **Defesa Base**: 25 (Altamente defensivo)
- **Velocidade**: Média
- **XP Base**: 110 XP ($\pm 15\%$)
- **Drops (Loot)**:
  - GameFi Token: 25% de chance (Drop: 1.0 a 2.5 GFN)
  - Pérola do Mar (Item Raro): 3% chance
  - Rubi Pequeno: 10% chance

#### 4. Bee (Mapa Oeste)
- **Nível Base**: 13 a 18
- **HP Base**: 85
- **Ataque Base**: 35
- **Defesa Base**: 5
- **Velocidade**: Alta (Ataque rápido, cooldown menor)
- **XP Base**: 185 XP ($\pm 15\%$)
- **Drops (Loot)**:
  - GameFi Token: 30% de chance (Drop: 1.5 a 3.0 GFN)
  - Gema Esmeralda: 12% chance

#### 5. Snake (Mapa Sul)
- **Nível Base**: 19 a 25
- **HP Base**: 210
- **Ataque Base**: 55 (Ataques mágicos venenosos)
- **Defesa Base**: 18
- **Velocidade**: Alta
- **XP Base**: 350 XP ($\pm 15\%$)
- **Drops (Loot)**:
  - GameFi Token: 40% de chance (Drop: 2.0 a 5.0 GFN)
  - Safira Brilhante (Gema Rara): 15% chance
  - Escama Mágica (Crafting): 8% chance

---

## 3. Lógica do Combate e Aleatoriedade

Para o combate (Fase 1 - Tempo Real no Mapa), utilizamos os seguintes cálculos ao confirmar um golpe:

### Aleatoriedade no Dano (Damage Roll)
Quando um ataque conecta, ele sofre um *"roll"* para que os hits nunca deem números estáticos idênticos.
$$Dano_{Final} = Dano_{Base\_Fórmula} \times (0.85 + (Math.random() \times 0.3))$$
*(O dano pode variar entre 85% e 115% do cálculo original).*

### Crítico (Critical Strike)
Todo ataque físico/mágico tem chance de infligir dano crítico:
- **Chance Base**: 5% + (Agilidade / 100)%
- **Multiplicador Crítico**: 200% do Dano Final.

---

## 4. O Sistema de Drop e Economia

A economia de Tokens GFN (GameFiNow) proveniente de matança no PvE funcionará seguindo estritas leis de supply e restrições.

### Função de Cálculo do Drop (Pseudocódigo):
```typescript
function calcularDrop(monstro) {
    const chanceBaseToken = monstro.tokenDropChance; // Ex: 0.25 (25%)
    const modifierSorte = (player.luck || 1) / 100; // Buffs aumentam a sorte

    const rollToken = Math.random();
    if (rollToken <= (chanceBaseToken + modifierSorte)) {
        // Quantidade é randomizada entre o min e max do monstro
        const quantidade = randomFloat(monstro.minToken, monstro.maxToken);
        darAoJogadorTokens(quantidade);
        exibirFeedback("Você obteve " + quantidade + " GFN!");
    }

    // Mesma lógica se aplica às Gemas e Items Comuns
    const rollGema = Math.random();
    if (rollGema <= monstro.gemDropChance) {
        darAoJogadorItem(monstro.gemId);
    }
}
```

### Regra de Proteção (Anti-Bot & Faucet Drain)
Para evitar que contas falsas farmem XP/Tokens excessivamente matando "Slimes" infinitos:
1. **Diminuição de Loot por Diferença de Level**: Se o nível do jogador for `10` níveis maior que o nível do monstro, a chance de drops e ganho de XP são reduzidos para `0`.
2. **Cap de Drop Diário**: Cada jogador possui um `energy_stamina` atrelado ao banco de dados. Batalhas e drops reduzem a estamina. Sem estamina (fadiga), o XP ganho cai em 70% e GFN drops caem a 0% até o reset diário (00:00 UTC).
