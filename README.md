# Danceflix

Minha biblioteca pessoal de passos de dança, com vídeos, sistema de treino e mapa mental de fluxo entre passos.

## Features

### Estilos de dança
- **Multi-estilo** — Zouk, Bachata e Samba, cada um com identidade visual própria.
- **Seletor de estilo** — barra de tabs sticky abaixo da navbar para trocar de estilo a qualquer momento; preferência salva no `localStorage`
- Arquitetura preparada para adicionar novos estilos sem tocar nos componentes existentes

### Biblioteca de vídeos
- **Vídeos do YouTube e locais** — cada passo suporta embed do YouTube ou arquivo de vídeo local (`.mp4`)
- **Múltiplas fontes por passo** — um mesmo passo pode ter várias gravações (câmera frontal, slow-motion, ângulo diferente), com seletor de tabs no player
- **Metadados por fonte** — duração e apresentador podem variar por gravação
- Filtro por categoria com chips coloridos por estilo
- Busca por título, descrição, apresentador e tags

### Vídeo do dia
- Seção hero com 5 vídeos em destaque sortidos a cada visita
- Prioriza vídeos que têm ID do YouTube (garante thumbnail real; nunca mostra placeholder cinza)
- Fallback automático para o catálogo completo quando o estilo ainda tem poucos vídeos com YouTube

### Sistema de treino
- Score de 0 a 5 por passo (Não praticado → Dominado)
- Progresso individual: score, contagem de revisões, data da última revisão, notas livres
- **Fila de treino** — lista completa ordenável por score, nome, data ou "nunca revisado"; filtrável por categoria e por status (precisa treinar / no caminho)
- Estado persistido em `localStorage` (sem necessidade de backend)

### Mapa mental (FlowMap)
- **View lista** — cards de hubs com dificuldade, vídeos vinculados e conexões
- **View rede** — grafo SVG interativo com layout radial; nós de passo orbitam ao redor do hub em fan
- Arestas com curva de Bézier; tooltip ao hover com nome do vídeo e link direto
- Layout fixo para Zouk; layout circular dinâmico gerado automaticamente para estilos novos
- Fluxos comuns pré-definidos por estilo (sequências típicas de passos)

### Design e UX
- Identidade visual adaptada por estilo ativo (cor da navbar, CTA, tags)
- Animações de entrada na viewport via Framer Motion (`AnimatedSection`)
- Totalmente responsivo; sem dependência de backend ou CMS

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (via plugin Vite, sem config file)
- React Router v7 com `HashRouter` (compatível com GitHub Pages)
- Framer Motion
- `@xyflow/react` instalado (candidato para substituir o SVG manual do FlowMap)

## Rodando localmente

```bash
npm install
npm run dev
```

## Build e deploy

```bash
npm run build     # tsc -b && vite build
npm run deploy    # build + push para gh-pages
```

O deploy usa `gh-pages` para o branch `gh-pages`. Configurar em **Settings → Pages → branch `gh-pages`** no repositório do GitHub.

## Adicionando conteúdo

### Novo vídeo (Zouk)
Editar `src/data/styles/zouk/videos.ts` e adicionar ao array `zoukVideos`. Campos obrigatórios: `id`, `title`, `description`, `duration`, `date`, `category`, `tags`, `presenter`, `knowledgeLevel`.

### Novo estilo de dança
1. Criar `src/data/styles/<id>/videos.ts`, `flowMap.ts`, `index.ts`
2. Registrar em `src/data/registry.ts`

### Novo hub no FlowMap
1. Adicionar entrada em `src/data/styles/zouk/flowMap.ts` → `hubs`
2. Adicionar posição em `src/components/FlowMapGraph.tsx` → `ZOUK_POSITIONS`
3. Adicionar conexões em `connections`
