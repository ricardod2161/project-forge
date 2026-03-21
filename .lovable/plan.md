
## Funcionalidade: Aprovar e Aplicar Findings da Revisão IA

### O que o usuário quer
Na aba "Revisão IA", cada finding (crítico, importante, sugestão) deve ter ações:
- **Aprovar/Aplicar melhoria** — a IA usa a recomendação do finding para atualizar os campos reais do projeto (audience, features, description, monetization, etc.)
- **Dispensar** — marcar o finding como ignorado (não volta na próxima análise)
- Contador de resolvidos no summary bar

### Arquitetura

**1. Estado local de findings com status**
Estender `Finding` com campo `status?: "pending" | "applied" | "dismissed"` — gerenciado em `useState` no `AIReviewTab`.

**2. Ação "Aplicar" — nova Edge Function `apply-finding`**
Cria `supabase/functions/apply-finding/index.ts`:
- Recebe `{ project_id, finding: { title, description, recommendation, category } }`
- Busca projeto do banco
- Chama `callLovableAI` com o contexto do projeto + o finding específico
- Pede à IA: *"Com base nesta recomendação, sugira os campos exatos do projeto para atualizar (JSON com os campos do projeto)"*
- Retorna `{ updates: Partial<Project> }` com apenas os campos alterados (ex: `{ audience: "novo valor", features: [...] }`)
- O frontend aplica via `useUpdateProject`

**3. Ação "Dispensar"**
Apenas atualiza o estado local — sem chamada ao backend. O finding recebe `status: "dismissed"` e fica visualmente riscado/opaco.

**4. Visual nos cards de finding**
Cada card ganha dois botões no rodapé:
- `Aplicar` (botão primário pequeno com ícone `Wand2`) — chama a edge function → atualiza projeto → finding fica `applied` com check verde
- `Dispensar` (botão ghost com ícone `X`) — marca como `dismissed`, aparece riscado

**5. Summary bar atualizado**
- Adicionar contador `{aplicados} de {total} resolvidos`
- Progress bar mini mostrando progresso de resolução
- Badge verde quando todos estão resolvidos: "Tudo revisado ✓"

**6. Estado de loading por finding**
`applyingId: string | null` — enquanto um finding está sendo aplicado, mostra spinner naquele card específico (não trava os outros).

### Arquivos alterados

1. **`supabase/functions/apply-finding/index.ts`** — nova edge function
2. **`src/pages/app/ProjectDetailPage.tsx`** — `AIReviewTab` com botões + estados, `Finding` interface estendida, `AIReviewTab` recebe `onProjectUpdate` callback do pai

### Detalhes técnicos

**`apply-finding` edge function — lógica da IA:**
```
System: "Você é um assistente que atualiza campos de projetos de software. 
Dado um projeto e uma recomendação específica, retorne APENAS um JSON com os campos 
do projeto que devem ser atualizados. Campos disponíveis: description, audience, 
features (array), monetization, integrations (array), platform, complexity (1-5)."

User: "Projeto: [contexto]
Finding: [titulo + recomendação]
Retorne JSON com apenas os campos a atualizar."
```

**Interface `FindingWithStatus`:**
```typescript
interface FindingWithStatus extends Finding {
  status: "pending" | "applying" | "applied" | "dismissed";
  appliedFields?: string[]; // campos que foram atualizados
}
```

**Fluxo no componente:**
```
handleApply(index) → setFindings com status "applying" → 
invoke("apply-finding") → 
onSuccess: updateProject.mutate(updates) + setFindings status "applied" + toast
onError: setFindings status "pending" + toast.error
```

**Callsite no pai:**
```tsx
{activeTab === "ai" && (
  <AIReviewTab 
    projectId={project.id}
    onProjectUpdate={(updates) => updateProject.mutate({ ...updates, _silent: true })}
  />
)}
```

### O que NÃO muda
- Edge function `review-project` — intocada
- Banco de dados — sem migration necessária (usa o `updateProject` existente)
- Nenhuma outra aba afetada
