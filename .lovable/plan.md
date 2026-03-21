

## Melhorias da Página de Detalhe do Projeto v1.0

### Estado atual (análise completa do arquivo — 1649 linhas)

- **OverviewTab** (linha 120): tem campos genéricos, sem dados de site, sem label de complexidade
- **PromptsTab** (linha 289): já tem sub-abas por tipo + FocusModal + histórico de versões — **já implementado em grande parte**. Falta apenas ajustar detalhes
- **EvalTab** (linha 862): `useState` local perde resultado ao trocar de aba
- **VersionsTab** (linha 1020): sem botão de criar versão manual
- **InlineExportTab** (linha 1314): só exporta documentação, sem opção de prompts
- **Header card** (linha 1475): sem score label textual, sem barra de completude, sem Duplicar/Copiar link
- **Tabs** (linha 1579): sem dot indicador de conteúdo por aba
- **Skeleton loading** (linha 1437): muito básico

---

### Bloco 1 — Header: score label + completude + duplicar/compartilhar

**1.1 Score label**: adicionar texto classificatório abaixo do `ScoreRing` (linha 1531–1533). Lógica: ≥90 Enterprise, ≥80 Sênior, ≥65 Avançado, ≥40 Intermediário, else Básico.

**1.2 Complexidade label**: no `OverviewTab` (linha 143–156), adicionar `complexityLabels` record e renderizar label descritivo abaixo da barra.

**1.3 Barra de completude**: após os badges no header (linha 1499), adicionar barra de progresso que calcula `completedSections` a partir de `aiContentCache` + `project.original_idea` + `prompts`. Requer `useProjectPrompts` no nível do `ProjectDetailPage` e passar `prompts` como prop para a lógica.

**1.4 Menu de ações**: no `DropdownMenuContent` (linha 1554), adicionar "Duplicar projeto" e "Copiar link" antes do separator. `handleDuplicate` faz `supabase.from("projects").insert(...)` e navega. `handleShare` copia a URL atual.

Importar `Share2`, `ChevronRight` de lucide-react.

---

### Bloco 2 — Abas: dot indicador + scroll ao trocar

**2.1 Dot indicador**: criar `tabHasContent` record no `ProjectDetailPage` após `TABS` ser definido. Passar para o render de cada botão de aba como dot verde de 6px posicionado `absolute top-0.5 right-0.5`.

**2.2 Scroll ao trocar de aba**: `useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [activeTab]);` — já existe o AnimatePresence, só falta o scroll.

**Nota**: AnimatePresence já está implementado na linha 1598. Não precisa alterar.

---

### Bloco 3 — PromptsTab: verificação do estado atual

Após análise do código (linhas 289–562), o `PromptsTab` **já tem**:
- Sub-abas por tipo com dots verde/cinza
- FocusModal
- Version selector (dropdown)
- Gerar/Regenerar states
- `isWebsite` prop

O que **falta** é o `SYSTEM_PROMPT_TYPES` vs `WEBSITE_PROMPT_TYPES` já existem como `PROMPT_TYPES_LIST` e `WEBSITE_PROMPT_TYPES_LIST`. Já está correto.

**Ajuste pontual**: o bloco de "Estado 2: não gerado" (linha 430) mostra um botão "Gerar com IA" — adicionar um atalho via Enter e ajustar o texto do label para usar `platform` badge colorido.

**Bloco 3 real**: pequeno ajuste cosmético — adicionar `shortLabel` já existe, mas o label na plataforma badge para tipos sem cor definida em `platformBadgeClasses` (ex: "Geral", "Figma / Lovable", "Vercel / Netlify") cai no `undefined` e não renderiza estilo. Corrigir o `platformBadgeClasses` para ter fallback.

---

### Bloco 4 — EvalTab: persistência no cache

**Problema**: `EvalTab` (linha 862) usa `useState<EvalResult | null>(null)` — perde resultado ao trocar de aba.

**Solução**:
1. Adicionar `evalResultCache` state no `ProjectDetailPage`: `const [evalResultCache, setEvalResultCache] = useState<EvalResult | null>(null);`
2. Alterar `EvalTab` para aceitar `cachedResult: EvalResult | null` e `onResultCached: (r: EvalResult) => void`
3. Inicializar `const [result, setResult] = useState<EvalResult | null>(cachedResult);`
4. Chamar `onResultCached(data.evaluation)` após `setResult(data.evaluation)` (linha 881)
5. Atualizar callsite na linha 1621

**Arquivos**: apenas `ProjectDetailPage.tsx`

---

### Bloco 5 — VersionsTab: botão criar versão manual

**Problema**: `VersionsTab` (linha 1020–1060) só lista versões, sem criar.

**Solução**: adicionar estados `isCreating`, `note`, `showForm` dentro de `VersionsTab`. Adicionar `useQueryClient` ao componente. Renderizar header com "N versão(ões)" + botão "Nova versão" que toggle um form. Form tem `textarea` para nota + botões Criar/Cancelar. `handleCreateVersion` insere via `supabase.from("project_versions").insert(...)`.

---

### Bloco 6 — InlineExportTab: exportar prompts

**Problema**: `InlineExportTab` (linha 1314) só exporta documentação do projeto.

**Solução**:
1. Adicionar `useProjectPrompts(project.id)` no componente
2. Adicionar `exportMode` state: `"doc" | "prompts"`
3. Toggle de 2 botões no topo (Documentação Técnica / Todos os Prompts)
4. Função `generatePromptsDoc()` que formata todos os prompts em texto
5. Adaptar `handleCopy`, `handleDownload` e preview para usar o conteúdo correto baseado em `exportMode`

---

### Bloco 7 — OverviewTab: dados de site

**Problema**: `OverviewTab` (linha 120–194) não exibe dados específicos de site (estilo, tom, seções, e-commerce/blog/form).

**Solução**:
1. Adicionar `isWebsite` ao `OverviewTab` props (ou detectar via `project.metadata.mode`)
2. Quando `isWebsite`, substituir campo "Monetização" por "Estilo Visual" e "Tom de Voz" lendo de `projectMeta`
3. Adicionar seção "Seções do Site" com chips se `website_sections` array existir
4. Adicionar seção de recursos com badges para `website_has_ecommerce`, `website_has_blog`, `website_has_form`

Importar `Palette`, `ShoppingCart`, `Mail` de lucide-react (verificar o que já está importado — `Mail` não está, `ShoppingCart` não está, `Palette` não está).

---

### Bloco 8 — Polish geral

**8.1 Breadcrumb**: substituir botão simples "Todos os projetos" (linha 1468–1472) por breadcrumb com `Meus Projetos > {title}`. Usar `ChevronRight` já importado mas não listado — verificar e adicionar se necessário.

**8.2 Skeleton melhorado** (linha 1437–1444): substituir os 3 blocos básicos por skeleton que imita o layout real (header card, fila de tabs, área de conteúdo).

**8.3 Linha colorida no header**: adicionar elemento `div` de 3px de altura com gradiente baseado no `quality_score` no topo do header card. Usar `style={{ background: ... }}`.

**8.4 Tooltip no título**: o hover com ícone Edit3 já existe (linha 1516–1521). Adicionar título `title="Clique para editar"` no `h1`.

---

### Arquivos alterados

Apenas `src/pages/app/ProjectDetailPage.tsx` — cirurgicamente, bloco a bloco.

### Novos imports necessários
- `Share2`, `ChevronRight`, `Palette`, `ShoppingCart`, `Mail` de lucide-react
- Verificar que `useQueryClient` já está importado em `VersionsTab` (não está — adicionar ao componente)
- `useProjectPrompts` já importado no nível de arquivo

