# Danceflix

Minha biblioteca pessoal de passos de dança, com vídeos, sistema de treino e mapa mental de fluxo entre passos.

**Site:** https://cfrancisco.github.io/danceflix/

## Features

### Estilos de dança
- **Multi-estilo** — Zouk, Bachata e Samba, cada um com identidade visual própria.
- **Seletor de estilo** — barra de tabs sticky abaixo da navbar para trocar de estilo a qualquer momento; preferência salva no `localStorage`
- Arquitetura preparada para adicionar novos estilos sem tocar nos componentes existentes

### Biblioteca de passos
- Gerenciamento dos passos em uma interface dedicada.
- Filtro por título, descrição, tags e categoria.
- **Passos organizados por categoria** — Como "Abertura",
"Base e Deslocamento", "Conexões e Estilizações", "Giros e Dinâmicas", "Finalizações", etc.
- Cada passo tem título, descrição, tags e vídeos associados.
- Os videos relacionados aos passos podem ser adicionados, editados e removidos na interface da Biblioteca.

### Biblioteca de vídeos
- **Vídeos do YouTube e locais** — cada passo suporta embed do YouTube ou arquivo de vídeo local (`.mp4`)
- **Múltiplas fontes por passo** — um mesmo passo pode ter várias gravações (câmera frontal, slow-motion, ângulo diferente), com seletor de tabs no player
- Filtro por título, descrição e tags.
- Gerenciamento dos videos em uma interface dedicada.

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
- Fluxos comuns pré-definidos por estilo (sequências típicas de passos).

## Criação de Fluxos
- Interface de criação de fluxos a partir do mapa mental
- Arrastar e soltar passos para criar um fluxo personalizado.
- Fluxos salvos localmente e compartilháveis via URL (query string com IDs dos passos)
- Marcação de tempo de onde o passo é feito no video, para facilitar a revisão e o play direto do passo no vídeo.
- Fluxos pré-definidos para cada estilo, com os passos mais comuns.


# Informações do Projeto

## Stack
- Vite + React 19 + TypeScript
- Tailwind CSS v4 (via plugin Vite, sem config file)
- React Router v7 com `HashRouter` (compatível com GitHub Pages)
- Framer Motion

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

O deploy usa `gh-pages` para o branch `gh-pages`.
