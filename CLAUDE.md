# danceflix

Biblioteca pessoal de passos de dança, com vídeos, sistema de treino e mapa mental de fluxo entre passos. Originalmente focado em Zouk, com arquitetura preparada para múltiplos estilos.

Hospedado localmente / build estático (sem deploy configurado ainda).

---

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** via plugin do Vite (`@tailwindcss/vite`) — sem `tailwind.config.js`, tema em `src/index.css` com `@theme {}`
- **React Router v7** com `HashRouter` (URLs `#/...`)
- **Framer Motion** para animações de entrada (`AnimatedSection`)
- **@xyflow/react** instalado (não usado ainda — candidato para FlowMapGraph SVG futuro)

---

## Estrutura

```
src/
├── App.tsx                  HashRouter + rotas
├── main.tsx                 Entry point
├── index.css                Tailwind v4 + @theme + utilitários globais
├── types.ts                 Tipos compartilhados: Video, VideoCategory, TrainingScore, VideoProgress
├── data/
│   ├── videos.ts            Shim de retrocompatibilidade → re-exporta do registry
│   ├── registry.ts          Registro de estilos; API pública (getAllStyles, getVideoById, getRelatedVideos…)
│   ├── types.ts             Tipos do sistema de estilos: Hub, Connection, CommonFlow, FlowMap, DanceStyle
│   └── styles/
│       └── zouk/
│           ├── index.ts     ZoukStyle descriptor (injeta styleId nos vídeos)
│           ├── videos.ts    Catálogo de vídeos (sem styleId — fica limpo)
│           └── flowMap.ts   Hubs, conexões e fluxos comuns do Zouk
├── components/
│   ├── AnimatedSection.tsx  Wrapper framer-motion (fade-in ao entrar na viewport)
│   ├── CategoryTag.tsx      Badge de categoria
│   ├── FlowMapGraph.tsx     Grafo SVG interativo (renderiza o FlowMap)
│   ├── Navbar.tsx           Barra de navegação sticky com busca
│   ├── RelatedVideos.tsx    Grade de vídeos relacionados
│   ├── TrainingPanel.tsx    Painel de progresso individual de um vídeo
│   └── VideoCard.tsx        Card de vídeo (thumbnail, nível, categoria)
├── hooks/
│   └── useTraining.ts       Estado de treino persistido em localStorage
└── pages/
    ├── Home.tsx             Hero + filtro por categoria + grid de vídeos
    ├── VideoDetail.tsx      Player (YouTube embed ou <video>) + TrainingPanel + RelatedVideos
    ├── TrainingQueue.tsx    Lista de todos os vídeos ordenada por prioridade de treino
    └── FlowMap.tsx          Mapa mental: view "lista" (hubs) e view "rede" (SVG grafo)
```

---

## Modelo de dados

### `src/types.ts` — tipos de vídeo e progresso

```ts
type VideoCategory =
  | 'Base e Deslocamento' | 'Abertura' | 'Giros e Dinâmicas'
  | 'Pêndulos' | 'Movimentos de Tronco e Cabeça'
  | 'Conexões e Estilizações' | 'Finalizações' | 'All'

type TrainingScore = 0 | 1 | 2 | 3 | 4 | 5
// 0 Não praticado | 1 Iniciante | 2 Em desenvolvimento
// 3 Confortável   | 4 Forte     | 5 Dominado

interface VideoProgress { videoId, timesReviewed, trainingScore, lastReviewedAt, notes? }

interface Video {
  id: string           // slug usado na URL (/video/:id)
  styleId?: string     // injetado pelo descriptor do estilo (ex: 'zouk')
  title, description, duration, date, category, tags[], presenter
  youtubeId?: string   // '' ou ID real → embed YouTube
  videoUrl?: string    // path para vídeo local em /public/videos/
  thumbnail?: string   // fallback: YouTube thumbnail ou SVG placeholder
  knowledgeLevel: TrainingScore
  technicalDetails?: string
  hubs?: string[]      // IDs dos hubs do FlowMap a que pertence
}
```

### `src/data/types.ts` — sistema de estilos

```ts
interface Hub { id, title, description, icon, color, difficulty(0-5), videoIds[], notes }
interface Connection { fromHub, toHub, videoIds[], description, difficulty, notes }
interface CommonFlow { name, difficulty, sequence: string[], description }
interface FlowMap { hubs: Record<string, Hub>, connections: Connection[], commonFlows: CommonFlow[] }
interface DanceStyle { id, name, description, icon, color, videos: Video[], flowMap: FlowMap }
```

---

## Sistema de estilos de dança

Cada estilo é um módulo autocontido em `src/data/styles/<id>/`:

| Arquivo | Responsabilidade |
|---|---|
| `index.ts` | Exporta `DanceStyle`; injeta `styleId` nos vídeos |
| `videos.ts` | Array `Omit<Video, 'styleId'>[]` — dados puros |
| `flowMap.ts` | Objeto `FlowMap` — hubs, conexões, fluxos |

Para registrar um novo estilo, adicionar em `src/data/registry.ts`:
```ts
import { BachataStyle } from './styles/bachata'
const registeredStyles = [ZoukStyle, BachataStyle]
```

---

## Sistema de treino

- `useTraining` persiste `VideoProgress` em `localStorage` (chave: `zouksteps:training`)
- `knowledgeLevel` no vídeo = ponto de partida; `trainingScore` no progresso = estado atual
- `TrainingQueue` ordena por `effectiveScore = progress?.trainingScore ?? video.knowledgeLevel`
- Filtros: por categoria, por status (precisa treinar ≤2 / no caminho ≥3), ordenação (score, nome, recente, nunca revisado)

---

## FlowMap

- `FlowMap.tsx` tem duas views: **lista** (cards de hubs) e **rede** (SVG interativo)
- `FlowMapGraph.tsx` renderiza grafo SVG puro com layout radial fixo (`POSITIONS`)
  - `base_frente_tras` no centro; demais hubs em posições x/y hardcoded
  - Nós de passo (vídeo) orbitam ao redor do hub em fan radial (`stepPositions`)
  - Arestas com curva de Bézier (`bezierCP`)
  - Tooltip HTML overlay ao hover nos nós de vídeo
- **Atualmente hardcoded para Zouk** — importa `zoukFlowMap` diretamente. Ponto de extensão futuro: receber `FlowMap` como prop.

---

## Design system

### Paleta (definida em `@theme` no `index.css`)

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#eef2ff` | Background global |
| `--color-navy` | `#1a1d3b` | Texto principal, backgrounds escuros |
| `--color-text` | `#4a4e6b` | Texto secundário |
| `--color-amber` | `#f5a623` | CTA, destaque, hover ativo |
| `--color-grad-teal` | `#00c9a7` | Eyebrow labels, badges verdes |
| `--color-grad-purple` | `#b39ddb` | Categoria giros, nível 0 |
| `--color-grad-pink` | `#f06292` | Categoria pêndulos, nível 1 |
| `--color-grad-blue` | `#4fc3f7` | Categoria abertura, nível 3 |
| `--color-grad-yellow` | `#ffd54f` | Categoria tronco, nível 2 |
| `--color-grad-green` | `#00e676` | Categoria finalizações |

### Tipografia

- Fonte única: **Poppins** (Google Fonts, pesos 300–900)
- Componentes usam `const P = "'Poppins', sans-serif"` como constante local (padrão do codebase)
- Eyebrow labels: `10px`, `letter-spacing: 0.45em`, `font-weight: 700`, `text-transform: uppercase`
- Headings hero: `clamp(36px, 7vw, 72px)`, `font-weight: 900`, `letter-spacing: -0.03em`

### Layout

- `.page-wrap`: `max-width: 1024px`, `margin: auto`, `padding: 0 24px` (definido em `index.css`)
- Backgrounds de página: `#f0f4ff` (levemente mais saturado que `#eef2ff`)
- Dot grid decorativo: `radial-gradient(circle, #b39ddb22 1px, transparent 1px)` em `24px`

### Estilos inline vs Tailwind

O projeto usa **inline styles para valores de design específicos** e Tailwind para utilitários de layout estrutural (`flex`, `grid`, `gap`, `hidden md:flex`, `sticky`, etc.). Não usar classes Tailwind para cores ou tipografia — usar os tokens inline.

### Nível de conhecimento — cores

| Score | Label | Cor |
|---|---|---|
| 0 | Não praticado | `#b39ddb` (roxo) |
| 1 | Em desenvolvimento | `#f06292` (rosa) |
| 2 | Iniciante | `#ffa726` (laranja) |
| 3 | Estável | `#4fc3f7` (azul) |
| 4 | Confortável | `#00c9a7` (verde-água) |
| 5 | Dominado | `#f5a623` (âmbar) |

---

## Rotas

| Path | Componente | Descrição |
|---|---|---|
| `#/` | `Home` | Hero + filtro + grid |
| `#/video/:id` | `VideoDetail` | Player + painel de treino |
| `#/training` | `TrainingQueue` | Fila de treino ordenada |
| `#/flow-map` | `FlowMap` | Mapa mental do Zouk |

---

## Scripts

```bash
npm run dev       # dev server (Vite)
npm run build     # tsc -b && vite build
npm run preview   # serve o build local
npm run lint      # ESLint
```

---

## Padrões e convenções

- **Imports de dados**: todos os componentes importam de `../data/videos` (shim) — nunca diretamente de `styles/zouk/videos`
- **`styleId`** nunca aparece nos arquivos de dados brutos; sempre injetado pelo descriptor
- **`videos.ts` na raiz de `data/`** é um shim de retrocompatibilidade — não modificar, só estende o registry
- **Vídeos sem `youtubeId`** mostram placeholder SVG cinza; vídeos com `youtubeId !== ''` usam thumbnail do YouTube
- **Player**: prefere YouTube embed; fallback para `<video>` com `videoUrl`; `controlsList="nodownload"` no player local
- **`hubs[]` no vídeo**: array de IDs de hubs do FlowMap — conecta vídeo ao grafo

---

## Extensões planejadas / pontos de crescimento

### Adicionar novo estilo (ex: Bachata)
1. Criar `src/data/styles/bachata/videos.ts`, `flowMap.ts`, `index.ts`
2. Registrar em `src/data/registry.ts`
3. `VideoCategory` em `src/types.ts` pode precisar de categorias específicas do estilo ou ser generalizado
4. `FlowMap.tsx` e `FlowMapGraph.tsx` precisam receber o estilo como prop (atualmente hardcoded para Zouk)
 

### `@xyflow/react`
Instalado mas não usado. Candidato para substituir o SVG manual em `FlowMapGraph.tsx`.

## Adicionando conteúdo

### Novo vídeo (Zouk)
Editar `src/data/styles/zouk/steps.ts` e adicionar ao array `zouksteps`. Campos obrigatórios: `id`, `title`, `description`, `duration`, `date`, `category`, `tags`, `presenter`, `knowledgeLevel`.

### Novo estilo de dança
1. Criar `src/data/styles/<id>/steps.ts`, `flowMap.ts`, `index.ts`
2. Registrar em `src/data/registry.ts`

### Novo hub no FlowMap
1. Adicionar entrada em `src/data/styles/zouk/flowMap.ts` → `hubs`
2. Adicionar posição em `src/components/FlowMapGraph.tsx` → `ZOUK_POSITIONS`
3. Adicionar conexões em `connections`
