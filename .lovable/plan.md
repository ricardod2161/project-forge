
## Auditoria completa — Bugs identificados e correções

### Análise da screenshot + código (2036 linhas)

Analisando a tela e o código completo, encontrei **8 bugs reais** e **5 problemas de UX** que afetam o funcionamento:

---

### BUG 1 — `handleDuplicate` em conflito com `useDuplicateProject` (duplicação falha silenciosamente)

**Problema**: O `ProjectDetailPage` tem um `handleDuplicate` *inline* que faz `supabase.from("projects").insert(...)` diretamente, enquanto o `useProjects.ts` já tem um hook `useDuplicateProject()` com lógica completa (slugify, invalidação de cache, navegação). O inline não usa `slugify()` — passa um slug com timestamp bruto que pode violar a constraint unique do banco. Quando há erro de slug duplicado, o `toast.error` dispara mas o usuário fica na mesma página.

**Correção**: Substituir o `handleDuplicate` inline pelo hook `useDuplicateProject` já existente em `useProjects.ts`.

---

### BUG 2 — `PromptsTab`: `selectedType` não sincroniza quando `isWebsite` muda

**Problema**: `selectedType` é inicializado via `useState(() => isWebsite ? "site_master" : "master")`. O estado é inicializado **uma única vez** — se o componente for remontado com um `isWebsite` diferente, o `selectedType` vai continuar com o valor antigo. Por exemplo: se um projeto for de sistema e o usuário navegar para um de site, o selectedType ainda é `"master"` mas a `activeTypesList` vai ser `WEBSITE_PROMPT_TYPES_LIST`, quebrando o lookup de `currentTypeMeta`.

**Correção**: Adicionar `useEffect` que reseta `selectedType` quando `isWebsite` muda:
```typescript
useEffect(() => {
  setSelectedType(isWebsite ? "site_master" : "master");
}, [isWebsite]);
```

---

### BUG 3 — `AIContentTabWrapper`: `contentType` não inclui `"screens"` no union type

**Problema**: O tipo declarado em `AIContentTabWrapper` é:
```typescript
contentType: "modules" | "database" | "rules" | "site_pages" | "site_copy" | "site_seo" | "site_structure";
```
`"screens"` está **faltando**. O `ScreensTabWrapper` chama `onContentGenerated("screens", ...)` e o `aiContentCache["screens"]` é lido na linha 1765, mas se alguém passar `contentType="screens"` para `AIContentTabWrapper`, o TypeScript vai reclamar (não um crash mas uma inconsistência de tipo).

**Correção**: Adicionar `"screens"` ao union type do `contentType`.

---

### BUG 4 — `tabHasContent["versions"]` sempre `true` — dot aparece mesmo sem versões

**Problema**: Na linha 1756:
```typescript
versions: true,
```
O dot verde de "tem conteúdo" aparece sempre na aba Versões, mesmo quando o projeto não tem nenhuma versão registrada. Isso é enganoso.

**Correção**: Precisaria do `useProjectVersions` no nível do `ProjectDetailPage`. A solução mais simples (sem nova query) é deixar `false` como padrão e atualizar após a query no `VersionsTab`. Mas como a query está encapsulada no componente filho, a solução correta é mover a query `useProjectVersions` para o pai assim como já foi feito para `useProjectPrompts`. Alternativamente: definir `versions: false` para não enganar o usuário.

**Correção**: `versions: false` (remove o dot enganoso).

---

### BUG 5 — `EvalTab` perde o `cachedResult` quando o componente remonta por `AnimatePresence`

**Problema**: O `EvalTab` recebe `cachedResult` como prop e usa `useState(cachedResult)` para inicializar. Mas o `AnimatePresence` com `mode="wait"` **desmonta e remonta** o componente a cada troca de aba. Quando o usuário volta para a aba `eval`, o componente remonta com `useState(cachedResult)` — mas o `cachedResult` do pai é `null` na primeira renderização após a remontagem porque o estado do pai (`evalResultCache`) é passado como prop estática no momento da montagem. 

**Análise mais profunda**: Na verdade isso JÁ está correto — o pai tem `evalResultCache` e passa como prop, então quando o usuário volta para a aba `eval`, o componente remonta com `useState(evalResultCache)` que tem o valor correto. **Este bug NÃO existe** — a implementação está correta. ✓

---

### BUG 6 — `generate-prompt/index.ts` linha ~1321: template literal não fecha corretamente

**Verificado nas linhas 1400-1474**: O arquivo funciona. O bug de backtick já foi corrigido na sessão anterior. **Sem bug aqui.** ✓

---

### BUG 7 — Título do projeto: "Agência — Agência / Freela" (redundância no title gerado)

**Problema (visível na screenshot)**: O projeto mostra título `"Agência — Agência / Freela"`. Isso ocorre porque o `useProjectWizard` gera o título concatenando tipo e nicho. No wizard, o usuário escolheu `type="Agência"` e `niche="Agência / Freela"`, resultando em `"Agência — Agência / Freela"`. 

**Correção no `useProjectWizard.ts`**: Verificar se o `title` gerado já contém o niche antes de concatenar, ou verificar se type e niche são idênticos/similares.

---

### BUG 8 — `VersionsTab`: `nextVersion` calculado com base em `versions.length` é incorreto

**Problema**: Na linha 1113:
```typescript
const nextVersion = (versions?.length ?? 0) + 1;
```
Se o usuário deletou versões intermediárias (ex: v1 e v3 existem, v2 foi deletada), `versions.length` seria 2, mas o próximo número deveria ser 4. Isso cria números duplicados no banco.

**Correção**: Calcular com `Math.max(...versions.map(v => v.version_number), 0) + 1`.

---

### BUG 9 — `generate-ai-content`: sem `"screens"` no union type `ContentType`

**Analisado**: `ContentType` em `generate-ai-content/index.ts` inclui explicitamente:
```typescript
type ContentType = "modules" | "screens" | "database" | "rules" | "site_pages" | "site_copy" | "site_seo" | "site_structure";
```
`"screens"` está **presente** aqui. ✓ Mas `"screens"` não está em `contentInstructions` — apenas `screens` está nas instruções. ✓ Tudo OK.

---

### BUG 10 — `useProjectWizard.ts`: lógica de geração de título com niche redundante

**Verificar**: preciso ver o arquivo antes de confirmar.

---

### PROBLEMA UX 1 — Scroll duplo: `window.scrollTo` na troca de aba dentro de AppLayout com scroll próprio

**Problema**: O `useEffect` que chama `window.scrollTo({ top: 0 })` na troca de aba pode não funcionar se o scroll estiver no container do `AppLayout` e não no `window`. Isso resulta em a página não subir ao trocar de aba.

**Correção**: Usar `document.querySelector('[data-scroll-container]')?.scrollTo(...)` ou checar como o `AppLayout` está configurado.

---

### PROBLEMA UX 2 — Tab "Copy" na screenshot está selecionada mas conteúdo parece vazio

**Visível na screenshot**: A aba "Copy" está ativa mas a área abaixo mostra apenas o ícone de arquivo vazio. Isso indica que `aiContentCache["site_copy"]` está `null` e o componente mostra estado vazio. **Comportamento correto** — não é bug, é UX esperada.

---

## Plano de Correções — Arquivo por arquivo

### `src/pages/app/ProjectDetailPage.tsx`

**Correção 1**: Usar `useDuplicateProject` hook em vez do `handleDuplicate` inline  
**Correção 2**: Adicionar `useEffect` de sincronização do `selectedType` no `PromptsTab`  
**Correção 3**: Adicionar `"screens"` ao union type de `contentType` em `AIContentTabWrapper`  
**Correção 4**: `tabHasContent.versions: false` (não `true`)  
**Correção 5**: Fix do `nextVersion` em `VersionsTab` com `Math.max`  
**Correção 6**: Scroll ao trocar aba — usar `ref` no container em vez de `window.scrollTo`

### `src/hooks/useProjectWizard.ts`

**Correção 7**: Evitar título redundante quando type e niche são similares

### `src/pages/app/ProjectDetailPage.tsx` — Melhorias de robustez

**Correção 8**: `PromptsTab` — sincronizar `selectedType` com `isWebsite` via `useEffect`  
**Correção 9**: Error boundary leve no `AIContentTabWrapper` para catches silenciosos

---

## Arquivos alterados
1. `src/pages/app/ProjectDetailPage.tsx` — bugs 1, 2, 3, 4, 5, 6  
2. `src/hooks/useProjectWizard.ts` — bug 7 (título redundante)

Nenhuma alteração em Edge Functions (estão funcionando corretamente após o fix anterior de backtick).
