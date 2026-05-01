# Conceitos do domínio — Danceflix

Documento de referência para os conceitos centrais do projeto e as relações entre eles. Serve de base para tipagem, estrutura de dados e decisões de modelagem.

---

## 1. Passo de Dança (`DanceStep`)

A unidade fundamental do domínio. Representa um movimento ou técnica ensinável de forma independente.

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Identificador único (slug usado na URL e nas referências do grafo) |
| `name` | `string` | Nome do passo |
| `description` | `string` | Descrição do movimento e intenção coreográfica |
| `youtubeVideos` | `string[]` | Lista de IDs de vídeos no YouTube |
| `localVideos` | `VideoSource[]` | Lista de vídeos locais com metadados extras (câmera, duração, apresentador) |
| `tags` | `string[]` | Palavras-chave para busca e agrupamento |
| `difficulty` | `0–5` | Complexidade conceitual/técnica do passo — definida na criação, não muda com o treino |
| `trainingNotes` | `string?` | Notas livres de treino (dicas, lembretes, observações pessoais) |
| `learningLevel` | `0–5` | Estado atual de domínio do praticante — evolui com o treino |

**Diferença entre `difficulty` e `learningLevel`:**
- `difficulty` é uma propriedade do passo em si — indica o quão complexo ele é objetivamente. Não muda.
- `learningLevel` é uma propriedade do praticante em relação ao passo — indica quanto já foi internalizado. Evolui com prática.

---

## 2. Hub

Um Hub é um **tipo especial de Passo de Dança** — tem todos os atributos de `DanceStep` e adiciona semântica de grafo: é um nó central no mapa mental do estilo.

**Um passo pode ser um Hub, mas nem todo passo é um Hub.**

Atributos adicionais ao `DanceStep`:

| Atributo | Tipo | Descrição |
|---|---|---|
| `incomingSteps` | `string[]` | IDs de passos que *chegam* neste hub (transições de entrada) |
| `outgoingSteps` | `string[]` | IDs de passos que *saem* deste hub (transições de saída) |
| `icon` | `string` | Ícone visual para o nó no grafo |
| `color` | `string` | Cor CSS para identidade visual no grafo |

Hubs são os **pontos de ancoragem** do `FlowMap`. Passos não-hub podem existir no catálogo sem aparecer no grafo.

---

## 3. Flow

Um Flow é um **caminho ordenado entre Passos de Dança** (hubs ou não), representando uma sequência comum ou coreografia de referência.

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Identificador único |
| `name` | `string` | Nome descritivo da sequência |
| `description` | `string` | Contexto e intenção do fluxo |
| `sequence` | `string[]` | Lista ordenada de IDs de passos (define o caminho no grafo) |
| `difficulty` | `0–5` | Complexidade da sequência como um todo |
| `learningLevel` | `0–5` | Nível atual de domínio do praticante para este fluxo específico |
| `videos` | `VideoSource[]?` | Vídeos dedicados à demonstração do fluxo completo |

Um Flow é modelado como um **grafo direcionado**: cada elemento de `sequence` aponta para o próximo. O grafo pode ter ramificações futuras (sequências alternativas).

---

## 4. DanceStyle

Agrupa tudo pertencente a um estilo de dança (Zouk, Bachata, Samba…). É o ponto de entrada de todos os dados.

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Slug único (ex: `'zouk'`) — usado na URL e como `styleId` nos passos |
| `name` | `string` | Nome de exibição (ex: `'Zouk Brasileiro'`) |
| `description` | `string` | Descrição curta do estilo |
| `icon` | `string` | Emoji ou caractere representativo |
| `color` | `string` | Cor primária da marca do estilo |
| `accentColor` | `string?` | Cor de destaque para CTAs e estados ativos — padrão `color` |
| `steps` | `DanceStep[]` | Catálogo completo de passos do estilo |
| `hubs` | `Hub[]` | Subconjunto de passos que são Hubs (nós do FlowMap) |
| `flows` | `Flow[]` | Sequências de referência definidas para o estilo |

---

## Relações entre os conceitos

```
DanceStyle
├── steps[]          → lista completa de DanceStep
│     └── (alguns steps são Hubs)
├── hubs[]           → subconjunto de DanceStep com semântica de grafo
│     ├── incomingSteps[]  → referências a DanceStep.id
│     └── outgoingSteps[]  → referências a DanceStep.id
└── flows[]          → Flow
      └── sequence[] → referências ordenadas a DanceStep.id (hubs ou não)
```

**Um Hub é um DanceStep** — não é uma entidade separada. A distinção é que hubs participam do grafo e têm referências direcionais a outros passos.

**Um Flow é um caminho no grafo** — referencia passos pelo `id`, independente de serem hubs ou não. Pode ter seu próprio material de vídeo.

---

## Notas de modelagem

- `difficulty` e `learningLevel` existem tanto em `DanceStep` quanto em `Flow`, com a mesma semântica: dificuldade objetiva vs. nível subjetivo do praticante.
- O progresso de treino (`learningLevel`, `trainingNotes`, histórico de revisões) deve ser separado dos dados estáticos do passo — fica em `TrainingProgress` persistido em `localStorage`, não no catálogo.
- Um passo pode ter múltiplas gravações de vídeo (`VideoSource[]`), incluindo ângulos, câmeras e apresentadores diferentes. Flows também podem ter vídeos dedicados mostrando a sequência completa.
