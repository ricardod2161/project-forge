
## Two fixes + visual upgrade for website project detail

### Root cause of the Prompts crash

`PromptsTab` (line 289) has **no awareness of project mode**. Three hard-coded issues:

1. **Line 300** — `promptsByType` builds groups from `PROMPT_TYPES_LIST` (system types only). Website prompts (`site_master`, `site_copy`…) are saved in DB with those type values, but the grouped map has no key for them → they're silently dropped → `activePrompt` is always `undefined`.
2. **Line 292** — `useState("master")` — initial selected type is always `"master"`, a system prompt type.
3. **Line 310** — `currentTypeMeta = PROMPT_TYPES_LIST.find(...)!` — non-null assertion. For website mode the selected type could not exist in `PROMPT_TYPES_LIST` if somehow a website type gets selected → `currentTypeMeta` is `undefined` → accessing `.label`, `.desc`, `.platform` crashes the component with "The app encountered an error".

### Missing website tab rendering

Lines 1526–1532 never render `pages`, `copy`, `seo`, `structure` tabs — those tabs appear in the nav but clicking them shows a blank `motion.div`.

### TypeScript: `AIContentTabWrapper` contentType union too narrow

Line 1071: `contentType: "modules" | "database" | "rules"` — using it with website content types (`"site_pages"`, `"site_copy"`, `"site_seo"`, `"site_structure"`) would be a TS error.

---

### Changes — only `src/pages/app/ProjectDetailPage.tsx`

**1. Fix `PromptsTab` signature** — add `isWebsite: boolean` prop:
```tsx
const PromptsTab = ({ projectId, isWebsite }: { projectId: string; isWebsite: boolean }) => {
```

**2. Fix initial selected type** — derive from the prop:
```tsx
const [selectedType, setSelectedType] = useState(() => isWebsite ? "site_master" : "master");
```

**3. Fix `promptsByType` grouping** — use the correct list based on `isWebsite`:
```tsx
const activeTypesList = isWebsite ? WEBSITE_PROMPT_TYPES_LIST : PROMPT_TYPES_LIST;

const promptsByType = useMemo(() => {
  const grouped: Record<string, ...> = {};
  activeTypesList.forEach(t => { grouped[t.value] = []; });
  (prompts ?? []).forEach(p => {
    if (grouped[p.type]) grouped[p.type].push(p);
    else if (!grouped[p.type] && p.type) grouped[p.type] = [p]; // safety
  });
  ...
  return grouped;
}, [prompts, activeTypesList]);
```

**4. Fix `currentTypeMeta` lookup** — use `activeTypesList`:
```tsx
const currentTypeMeta = activeTypesList.find(t => t.value === selectedType) ?? activeTypesList[0];
```

**5. Fix sub-tabs loop** — use `activeTypesList`:
```tsx
{activeTypesList.map(t => { ... })}
```

**6. Fix `AIContentTabWrapper` type** — widen the union:
```tsx
contentType: "modules" | "database" | "rules" | "site_pages" | "site_copy" | "site_seo" | "site_structure";
```

**7. Add missing tab rendering** — in the main AnimatePresence block, add website tab cases:
```tsx
{activeTab === "pages"     && isWebsite && <AIContentTabWrapper projectId={project.id} contentType="site_pages" ... />}
{activeTab === "copy"      && isWebsite && <AIContentTabWrapper projectId={project.id} contentType="site_copy" ... />}
{activeTab === "seo"       && isWebsite && <AIContentTabWrapper projectId={project.id} contentType="site_seo" ... />}
{activeTab === "structure" && isWebsite && <AIContentTabWrapper projectId={project.id} contentType="site_structure" ... />}
```

**8. Pass `isWebsite` to `PromptsTab` at callsite** (line 1524):
```tsx
{activeTab === "prompts" && <PromptsTab projectId={project.id} isWebsite={isWebsite} />}
```

**9. Visual: website-mode badge in header** — add a "Site" globe badge alongside the existing niche/type badges (after line ~1414):
```tsx
{isWebsite && (
  <span className="px-2.5 py-1 rounded-full text-2xs font-medium bg-accent/10 text-accent border border-accent/20 flex items-center gap-1.5">
    <Globe className="w-2.5 h-2.5" />
    Site
  </span>
)}
```

**10. Visual: website OverviewTab** — when `isWebsite`, render metadata fields from `projectMeta` (style, tone, sections, toggles). Add a `WebsiteOverviewTab` component below `OverviewTab` that displays:
- Grid of metadata chips: Tipo de site, Estilo, Tom, Seções
- Feature flags row: E-commerce / Blog / Formulário
- Pass to render: `{activeTab === "overview" && isWebsite ? <WebsiteOverviewTab project={project} /> : activeTab === "overview" && <OverviewTab project={project} />}`

### Files changed
Only `src/pages/app/ProjectDetailPage.tsx` — surgical edits to lines 289–560, 1060–1126, 1522–1533.
