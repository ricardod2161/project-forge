
## Expansão: Criação de Sites v1.0 — Plano Completo

### Diagnóstico real do codebase

**Arquivos confirmados e seu estado atual:**
- `useProjectWizard.ts` — Zustand store com 4 steps sistema (Ideia/Classificação/Detalhamento/Confirmação), sem campo `mode`
- `useProjects.ts` — `CreateProjectInput` sem campos de site, `useCreateProject` não salva `metadata`
- `NewProjectPage.tsx` — 747 linhas, 4 steps fixos para sistema, `STEPS = ["Ideia","Classificação","Detalhamento","Confirmação"]`
- `ProjectDetailPage.tsx` — `TABS` é `const` com `as const`, todos os 11 tabs fixos para sistema
- `generate-prompt/index.ts` — `PROMPT_TYPES` tem apenas 10 tipos de sistema
- `generate-ai-content/index.ts` — `ContentType = "modules" | "screens" | "database" | "rules"` apenas
- `TemplatesPage.tsx` — sem filtro de modo, usa Skeleton local (a ser substituído), `handleUseTemplate` não chama `setMode`
- `ProjectCard.tsx` — sem prop `mode`, sem badge "Site"

**Ponto crítico identificado:** `TABS` em `ProjectDetailPage.tsx` usa `as const` (linha 37-49), o que significa que `TabId` é inferido dos valores. Para tornar os tabs dinâmicos por modo, precisamos remover o `as const` e criar dois arrays separados `SYSTEM_TABS` e `WEBSITE_TABS`.

---

### Bloco 1 — `useProjectWizard.ts`
Adicionar campos ao `WizardState`:
- `mode: "system" | "website"`
- `websiteSections: string[]`
- `websiteStyle`, `websiteTone`, `websiteCMS: string`
- `websiteHasEcommerce`, `websiteHasBlog`, `websiteHasForm: boolean`

Adicionar actions correspondentes e incluir todos no `partialize`. Ajustar `nextStep` para máximo `Math.min(s.currentStep + 1, 4)` (sistema tem 5 steps: Tipo + 4 anteriores).

---

### Bloco 2 — `useProjects.ts`
- Adicionar campos opcionais a `CreateProjectInput`: `mode`, `website_*`
- Em `useCreateProject.mutationFn`, passar `metadata: { mode: input.mode ?? "system", ...dados do site }` no insert
- `useDuplicateProject` já existe — copiar `metadata` do projeto original também

---

### Bloco 3 — `NewProjectPage.tsx` (maior mudança)

**Nova estrutura de steps:**
- Step 0 = `StepModo` (novo) — dois cards: Sistema vs Site
- Steps do sistema: Ideia (1) → Classificação (2) → Detalhamento (3) → Confirmação (4)
- Steps do site: Ideia (1) → StepSite (2) → Confirmação (3)

**Lógica da barra de progresso:**
```
const STEPS_SYSTEM = ["Tipo", "Ideia", "Classificação", "Detalhamento", "Confirmação"];
const STEPS_WEBSITE = ["Tipo", "Ideia", "Site", "Confirmação"];
const STEPS = mode === "website" ? STEPS_WEBSITE : STEPS_SYSTEM;
```

**Mapeamento de steps para componentes:**
- currentStep 0 → `StepModo`
- currentStep 1 → `StepIdeia` (adaptado com placeholder por modo)
- currentStep 2:
  - mode === "system" → `StepClassificacao`
  - mode === "website" → `StepSite` (novo)
- currentStep 3:
  - mode === "system" → `StepDetalhamento`
  - mode === "website" → `StepConfirmacaoSite` (confirmação adaptada)
- currentStep 4 (só sistema) → `StepConfirmacao` atual

**`StepModo`**: dois cards grandes lado a lado com Framer Motion stagger, ícones `Cpu` e `Globe`. Clique → `setMode()` + `nextStep()` automático.

**`StepSite`**: campos WEBSITE_TYPES (grid 3 cols), NICHES reutilizados, WEBSITE_SECTIONS (grid chips multi-select), WEBSITE_STYLES (grid), WEBSITE_TONES (chips single), 3 Switches, CMS condicional, WEBSITE_INTEGRATIONS. Botão "Próximo" ativo quando `type && websiteStyle && niche`.

**`StepConfirmacaoSite`**: resumo adaptado para site + `handleCreate` passa `metadata` completo.

**`handleCreate` no confirmação de site:**
```ts
createProject({
  title: derivedTitle,
  original_idea: idea,
  type,
  niche,
  complexity: 2, // sites são menos complexos
  platform: "Web",
  audience: "",
  features: websiteSections,
  monetization: "",
  integrations,
  status: "draft",
  mode: "website",
  website_sections: websiteSections,
  website_style: websiteStyle,
  website_tone: websiteTone,
  website_cms: websiteCMS,
  website_has_ecommerce: websiteHasEcommerce,
  website_has_blog: websiteHasBlog,
  website_has_form: websiteHasForm,
})
```

---

### Bloco 4 — `generate-prompt/index.ts`
- Adicionar `WEBSITE_PROMPT_TYPES` com os 10 tipos de site (site_master, site_copy, site_seo, site_design, site_sections, site_performance, site_forms, site_ecommerce, site_cms, site_deploy)
- Lógica: `const isSiteType = prompt_type.startsWith("site_")`
- `typeConfig` = `isSiteType ? WEBSITE_PROMPT_TYPES[prompt_type] : PROMPT_TYPES[prompt_type]`
- Adicionar `siteContext` ao `userPrompt` quando `isSiteType`

---

### Bloco 5 — `generate-ai-content/index.ts`
- Expandir `ContentType` para incluir `"site_pages" | "site_copy" | "site_seo" | "site_structure"`
- Adicionar instruções em `contentInstructions` para os 4 novos tipos
- Adicionar `websiteContext` ao `userPrompt` quando `isWebsite`

---

### Bloco 6 — `ProjectDetailPage.tsx`

**Mudança estrutural em TABS:**
```ts
// Remover `as const` e criar dois arrays
const SYSTEM_TABS = [
  { id: "overview", label: "Visão Geral", icon: Layers },
  { id: "idea", label: "Ideia Original", icon: Lightbulb },
  { id: "modules", label: "Módulos", icon: Puzzle },
  { id: "screens", label: "Telas", icon: Monitor },
  { id: "database", label: "Banco de Dados", icon: Database },
  { id: "rules", label: "Regras", icon: ScrollText },
  { id: "prompts", label: "Prompts", icon: Zap },
  { id: "exports", label: "Exportações", icon: Download },
  { id: "eval", label: "Avaliação", icon: BarChart3 },
  { id: "versions", label: "Versões", icon: History },
  { id: "ai", label: "Revisão IA", icon: Bot },
];

const WEBSITE_TABS = [
  { id: "overview", label: "Visão Geral", icon: Layers },
  { id: "idea", label: "Briefing", icon: Lightbulb },
  { id: "pages", label: "Páginas", icon: Monitor },
  { id: "copy", label: "Copywriting", icon: ScrollText },
  { id: "seo", label: "SEO", icon: TrendingUp },
  { id: "structure", label: "Estrutura", icon: Code2 },
  { id: "prompts", label: "Prompts", icon: Zap },
  { id: "exports", label: "Exportações", icon: Download },
  { id: "eval", label: "Avaliação", icon: BarChart3 },
  { id: "versions", label: "Versões", icon: History },
  { id: "ai", label: "Revisão IA", icon: Bot },
];
```

`TabId` passa a ser `string` (sem `as const`). `activeTab` tipado como `string`.

**Detecção de modo:**
```ts
const projectMeta = (project.metadata as Record<string, unknown>) ?? {};
const isWebsite = projectMeta.mode === "website";
const TABS = isWebsite ? WEBSITE_TABS : SYSTEM_TABS;
```

**Renderização das abas de site:**
- `pages` → `AIContentTabWrapper` com `contentType="site_pages"`
- `copy` → `AIContentTabWrapper` com `contentType="site_copy"`
- `seo` → `AIContentTabWrapper` com `contentType="site_seo"`
- `structure` → `AIContentTabWrapper` com `contentType="site_structure"`

**PromptsTab — adaptação por modo:**
Receber `isWebsite` como prop e usar:
```ts
const WEBSITE_PROMPT_TYPES_LIST = [
  { value: "site_master", label: "Mestre do Site", shortLabel: "Mestre", platform: "Lovable", desc: "..." },
  { value: "site_copy", label: "Copywriting", shortLabel: "Copy", platform: "Geral", desc: "..." },
  // ... 8 mais
];

// No componente:
const promptTypesList = isWebsite ? WEBSITE_PROMPT_TYPES_LIST : PROMPT_TYPES_LIST;
```

**Badge de modo no header do projeto:**
Após os badges existentes (status, niche, type), adicionar:
```tsx
{isWebsite && (
  <span className="px-2.5 py-1 rounded-full text-2xs font-medium bg-accent/10 text-accent border border-accent/20 flex items-center gap-1">
    <Globe className="w-2.5 h-2.5" />
    Site
  </span>
)}
```

---

### Bloco 7 — `TemplatesPage.tsx` + `ProjectCard.tsx`

**TemplatesPage:**
- Substituir Skeleton local por `import { Skeleton } from "@/components/ui/skeleton"`
- Adicionar `TemplateContent` expandido com campos `mode`, `website_*`
- Estado `modeFilter: "all" | "system" | "website"`
- Toggle buttons acima dos filtros de nicho
- `handleUseTemplate` para sites: chamar `setMode("website")` + `setWebsiteStyle`, `setWebsiteTone`, `toggleWebsiteSection` quando `content.mode === "website"`
- Filtro: `const matchMode = modeFilter === "all" || (templateContent.mode ?? "system") === modeFilter`

**ProjectCard.tsx:**
- Adicionar prop `mode?: "system" | "website"` à interface
- Adicionar import `Globe` de lucide-react
- Badge condicional após `niche`: se `mode === "website"` mostrar badge "Site" com Globe
- Sem mudança em outros aspectos do card

**Passar `mode` nos cards:**
- `DashboardPage`: `mode={(project.metadata as Record<string,unknown>)?.mode as "system"|"website" ?? "system"}`
- `ProjectsPage`: idem

---

### Templates SQL (inserir via Supabase insert tool)
8 templates de sites conforme especificado (SaaS Landing, Portfólio, Restaurante, Clínica, Evento, Blog, Agência, Loja Virtual) inseridos via ferramenta de insert.

---

### Ordem de execução

| Ordem | Arquivo | Impacto |
|---|---|---|
| 1 | `useProjectWizard.ts` | Base de tudo |
| 2 | `useProjects.ts` | Persistência de metadados |
| 3 | `NewProjectPage.tsx` | Wizard adaptativo (maior mudança) |
| 4 | `generate-prompt/index.ts` | 10 novos tipos site |
| 5 | `generate-ai-content/index.ts` | 4 novos content types site |
| 6 | `ProjectDetailPage.tsx` | TABS dinâmicas + PromptsTab adaptativa |
| 7 | `TemplatesPage.tsx` | Filtro modo + handleUseTemplate site |
| 8 | `ProjectCard.tsx` | Badge site |
| 9 | Insert SQL | 8 templates de sites |

**Garantia zero-regressão:** sistemas existentes continuam usando os mesmos fluxos — a lógica de `mode === "website"` é sempre aditiva com fallback para `"system"`.
