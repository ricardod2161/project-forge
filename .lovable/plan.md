
## Redesign da PromptsTab — Sub-abas por tipo com geração inline

### Estado atual (problema)
O `PromptsTab` atual (linhas 199–334 do ProjectDetailPage.tsx) funciona assim:
- Lista todos os prompts em cards empilhados, misturados por tipo
- Para gerar: clica em "Gerar Prompt com IA" → abre um painel flutuante com chips de tipo → clica "Gerar"
- Não há separação visual por tipo
- O preview usa `line-clamp-3` — trunca o conteúdo
- Não há como ver o prompt de um tipo específico sem rolar por todos

### O que será construído
Um componente `PromptsTab` completamente novo com:

**1. Sub-abas horizontais por tipo (10 tipos)**
Barra horizontal com os 10 tipos: Mestre, Frontend, Backend, Banco, Dashboard, MVP, Premium, Correção, Refatoração, Multiplataforma.

- Cada tab tem badge de status:
  - Cinza = "Não gerado"
  - Verde com número de versão = "Gerado v1, v2..."
  - Spinner animado = "Gerando..."
- Ao carregar, detecta quais tipos já têm prompts no banco para colorir os badges

**2. Painel de conteúdo por tipo selecionado**

Estado 1 — Não gerado:
- Card vazio com ícone do tipo + descrição do que o prompt faz
- Botão "Gerar com IA" centralizado
- Plataforma alvo indicada (Lovable / Supabase / Bubble)

Estado 2 — Gerando:
- `AIStreamingIndicator` centralizado
- Skeletons de linhas de texto

Estado 3 — Gerado:
- Header: tipo badge + versão badge + tokens + platform badge + botão "Copiar" + botão "Regenerar"
- Corpo: `<pre>` com `font-mono text-2xs` em `ScrollArea` com `max-h-[520px]` — sem truncamento, scroll completo
- Footer: data geração + contador de linhas + tokens estimados

**3. Histórico de versões por tipo**
Se o tipo tem múltiplas versões (ex: v1, v2, v3):
- Dropdown "Versão: v3 ▼" no header que lista versões anteriores
- Ao selecionar, exibe o conteúdo daquela versão (read-only para versões antigas)
- Versão mais recente = editável/regenerável

**4. Fluxo de geração**
- Clica "Gerar" → `isGenerating[tipo] = true` → chama Edge Function → `invalidateQueries` → exibe conteúdo
- Geração independente por tipo (um pode estar gerando enquanto outro já está pronto)
- `generatingTypes: Set<string>` para múltiplos estados simultâneos

### Estrutura de dados
```
prompts (do banco) agrupados por tipo:
{
  "master": [{ id, content, version: 2, tokens_estimate, created_at }, { version: 1, ... }],
  "frontend": [{ id, content, version: 1, ... }],
  "mvp": [],  // não gerado
  ...
}
```

### Arquivos a modificar
Apenas **`src/pages/app/ProjectDetailPage.tsx`** — apenas o componente `PromptsTab` (linhas 199–334).

### Layout visual
```
┌─────────────────────────────────────────────────────────────────┐
│ [Mestre ●v2] [Frontend ●v1] [Backend] [Banco] [Dashboard] ···  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ Header ────────────────────────────────────────────────────┐ │
│ │  [Mestre] [v2] [1.247 tokens] [Lovable]   [Copiar][Regen.] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─ Conteúdo (scroll) ─────────────────────────────────────────┐ │
│ │  ## 1. CONTEXTO DO PROJETO                                  │ │
│ │  Este sistema é uma plataforma SaaS B2B...                  │ │
│ │  ...                                                        │ │
│ │  [scroll]                                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Gerado em 15 mar 2026 · 312 linhas · Versão v2 de 3 versões    │
└─────────────────────────────────────────────────────────────────┘
```

### Implementação técnica

```tsx
const PromptsTab = ({ projectId }: { projectId: string }) => {
  const { data: prompts, isLoading } = useProjectPrompts(projectId);
  const [selectedType, setSelectedType] = useState("master");
  const [generatingTypes, setGeneratingTypes] = useState<Set<string>>(new Set());
  const [selectedVersions, setSelectedVersions] = useState<Record<string, number>>({}); 
  // { "master": 2, "frontend": 1 } = versão selecionada para exibição
  const queryClient = useQueryClient();

  // Agrupar prompts por tipo, ordenado por versão DESC
  const promptsByType = useMemo(() => {
    const grouped: Record<string, Prompt[]> = {};
    for (const type of PROMPT_TYPES_LIST.map(t => t.value)) {
      grouped[type] = [];
    }
    for (const p of (prompts ?? [])) {
      if (grouped[p.type]) {
        grouped[p.type].push(p);
      }
    }
    // Sort each type by version DESC
    for (const type in grouped) {
      grouped[type].sort((a, b) => b.version - a.version);
    }
    return grouped;
  }, [prompts]);

  // Prompt ativo = versão selecionada do tipo selecionado
  const typePrompts = promptsByType[selectedType] ?? [];
  const selectedVersion = selectedVersions[selectedType] ?? typePrompts[0]?.version;
  const activePrompt = typePrompts.find(p => p.version === selectedVersion) ?? typePrompts[0];

  const handleGenerate = async (type: string) => {
    setGeneratingTypes(prev => new Set(prev).add(type));
    try {
      const { data, error } = await supabase.functions.invoke("generate-prompt", {
        body: { project_id: projectId, prompt_type: type },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success("Prompt gerado e salvo!");
      queryClient.invalidateQueries({ queryKey: ["prompts", projectId] });
      queryClient.invalidateQueries({ queryKey: ["all-prompts"] });
    } catch { toast.error("Erro ao gerar prompt."); }
    finally {
      setGeneratingTypes(prev => { const s = new Set(prev); s.delete(type); return s; });
    }
  };
  // ... render
};
```

### Ordem de execução
1. Substituir o `PromptsTab` atual (linhas 199–334) pelo novo componente completo
2. Adicionar import de `useMemo` (já existe como import de react), `ScrollArea` do shadcn
3. Adicionar import de `ChevronDown` (já importado) e `DropdownMenu` (já importado)
4. Zero mudanças em outros arquivos — tudo contido no PromptsTab
