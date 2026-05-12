# Danceflix

Minha biblioteca pessoal de passos de dança, com vídeos, sistema de treino e mapa mental de fluxo entre passos.

**Site:** https://cfrancisco.github.io/danceflix/

## Features

### Estilos de dança
- **Multi-estilo** — Zouk, Bachata e Samba, cada um com identidade visual própria
- **Seletor de estilo** — barra de tabs sticky abaixo da navbar para trocar de estilo a qualquer momento; preferência salva no `localStorage`
- Arquitetura preparada para adicionar novos estilos sem tocar nos componentes existentes

### Biblioteca de passos
- Filtro por título, descrição, tags e categoria; alternância entre view grade e lista tabular com ordenação por coluna
- **Passos organizados por categoria** — "Abertura", "Base e Deslocamento", "Conexões e Estilizações", "Giros e Dinâmicas", "Finalizações", etc.
- Cada passo tem título, descrição, tags, detalhes técnicos, dificuldade e duração
- **Edição inline de passos** — qualquer passo do catálogo pode ser editado (nome, descrição, categoria, dificuldade, tags, detalhes técnicos); alterações salvas em `localStorage` e exportáveis como JSON

### Biblioteca de vídeos
- **Vídeos do YouTube e locais** — suporte a URLs normais, `youtu.be`, `embed/` e Shorts (`shorts/`), além de ficheiros locais `.mp4`
- **Múltiplas fontes por passo** — um mesmo passo pode ter várias gravações (câmera frontal, slow-motion, ângulo diferente), com seletor de tabs no player
- **Segmentos com timestamp** — início e fim configuráveis por fonte; botão de captura do tempo atual do player; sobreposições persistidas em `localStorage` separadamente da base de dados
- **Relação muitos-para-muitos** — um passo pode aparecer em vários vídeos e um vídeo pode conter vários passos, cada um com o seu próprio segmento
- **CRUD completo de vídeos** — criação, edição, vinculação a passos e exclusão; vídeos do catálogo e da biblioteca pessoal têm as mesmas ações
- **Hold-to-delete** — exclusão via pressão prolongada (1,5 s) com animação de preenchimento, sem diálogo de confirmação
- **Exportação de overrides** — botões para exportar `steps.json` e `videos.json` prontos para substituir na base de dados, com badge de contagem de alterações pendentes
- **Importação e exportação de backup** — todos os dados do `localStorage` exportáveis e importáveis como JSON

### Vídeo do dia
- Seção hero com 5 vídeos em destaque sorteados a cada visita
- Prioriza vídeos que têm ID do YouTube (garante thumbnail real; nunca mostra placeholder cinza)
- Fallback automático para o catálogo completo quando o estilo tem poucos vídeos com YouTube

### Sistema de treino
- Score de 0 a 5 por passo (Não praticado → Dominado)
- Progresso individual: score, contagem de revisões, data da última revisão
- **Fila de treino** — lista completa ordenável por score, nome, data ou "nunca revisado"; filtrável por categoria e por status (precisa treinar / no caminho)
- Estado persistido em `localStorage` (sem necessidade de backend)

### Mapa mental (FlowMap)
- **View rede** — grafo SVG interativo com layout radial; nós de passo orbitam ao redor do hub em fan; arestas com curva de Bézier
- **View lista** — cards de hubs com dificuldade, vídeos vinculados e conexões; tooltip de preview de vídeo ao hover nos passos do fluxo, com pin para manter aberto e dar play sem sair da página
- Layout fixo para Zouk; layout circular dinâmico gerado automaticamente para novos estilos
- **Sidebar de detalhe e edição** — ao clicar num fluxo na listagem, abre as informações no próprio sidebar com navegação back/edit, sem poluir a área do grafo

### Criação e gestão de fluxos
- Arrastar e soltar passos no sidebar para construir um fluxo personalizado
- Reordenação dinâmica dos passos dentro do fluxo
- **Vídeo do fluxo** — campo para vincular um vídeo (YouTube ou local) ao fluxo, com busca nos vídeos já cadastrados; cada passo do fluxo pode ter timestamps de início e fim dentro desse vídeo
- **Todos os fluxos editáveis e deletáveis** — fluxos do catálogo e personalizados têm as mesmas ações de edição e exclusão
- Fluxos pré-definidos por estilo com os passos mais comuns


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
