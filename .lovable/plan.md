
## Auditoria Completa da PromptsPage — Upgrade 100% Premium

### Problemas identificados na página atual (imagem + código)

**1. CRÍTICO — Não há forma de VER o prompt completo**
O preview usa `line-clamp-4` no `<pre>` — corta o conteúdo após 4 linhas sem nenhum botão "Expandir" ou "Ver completo". O usuário quer ler o prompt inteiro mas não há modal, drawer, nem expansão inline. Isso é a principal reclamação.

**2. CRÍTICO — Prompt listado em fonte mono `text-2xs` (10px) num `<pre>` bruto**
O conteúdo é código/texto estruturado mas aparece em `<pre>` sem formatação — sem quebras visuais, sem highlights de seções `###`, sem hierarquia. Muito difícil de ler.

**3. IMPORTANTE — Nenhum indicador de data de criação nos cards**
O campo `created_at` existe no schema mas não é exibido. Usuário não sabe quando o prompt foi gerado.

**4. IMPORTANTE — Sem ordenação dos prompts**
Só existe a ordem padrão (created_at DESC). Sem opção de ordenar por projeto, tipo, tokens ou data.

**5. IMPORTANTE — Sem ação de "Excluir" um prompt**
Não há forma de deletar prompts antigos/duplicados. O botão de ações de cada card tem apenas "Copiar". Falta: Excluir, Ver projeto, e Ver prompt completo.

**6. IMPORTANTE — Busca limitada a `sm:max-w-sm`**
A busca fica espremida no lado esquerdo. Deveria ser full-width em mobile e ter botão de "limpar" inline.

**7. IMPORTANTE — Sem estatísticas/resumo no topo**
A tela não mostra quantos tokens totais, quantos projetos cobertos, qual o tipo mais usado. Dados valiosos que já existem.

**8. MENOR — `max-w-4xl` no container limita demais o espaço**
Com sidebar recolhida, a tela tem ~900px mas o conteúdo fica constrangido a `max-w-4xl` (896px). Com sidebar expandida fica ainda pior.

**9. MENOR — Filtros de tipo só aparecem quando há mais de 1 tipo**
Se o usuário tem prompts de apenas 1 tipo, os chips somem. Deveria mostrar sempre para dar contexto.

**10. MENOR — Ausência de ação rápida "Gerar Novo Prompt"**
O header tem "Ir para projetos" mas não tem um atalho direto para gerar prompt em um projeto específico.

---

### O que será implementado

#### 1. Modal "Ver Prompt Completo" — funcionalidade principal

Componente `PromptDetailModal` usando `Dialog` (shadcn já instalado):
- Abre ao clicar no card ou no botão "Ver completo"
- Exibe prompt formatado com **Markdown rendering** (usando o mesmo `MarkdownRenderer` do `ScreensWithMockups`)
- Header do modal: badge de tipo, título, platform, versão
- Footer: botão "Copiar", contador de tokens, link para o projeto
- Scroll interno com altura máxima (`max-h-[75vh] overflow-y-auto`)
- Botão `Esc` fecha, botão X no canto

#### 2. Formatação rica do preview no card

Ao invés de `<pre>` com `line-clamp-4`:
- Mostrar as primeiras 3 linhas não-vazias do conteúdo como texto normal
- Renderizar headers `###` em negrito
- Botão "Ver prompt completo →" no final do preview (sempre visível)
- Número de linhas totais como indicador: "247 linhas · 1.159 tokens"

#### 3. Ação de excluir prompts

- Mutation `useDeletePrompt` no `useProjectDetail.ts`
- Dropdown de ações no card: "Ver completo", "Copiar", "Ir para projeto", separador, "Excluir"
- `AlertDialog` de confirmação antes de excluir

#### 4. Barra de estatísticas no topo

Quando há prompts, mostrar 3 stats:
- Total de tokens estimados de todos os prompts
- Número de projetos com prompts
- Tipo mais gerado

#### 5. Busca full-width + clear inline

- Input de busca com width full no mobile, `max-w-md` no desktop
- Ícone de X inline quando há texto digitado (limpa com um clique)
- Contador de resultados: "3 de 12 prompts"

#### 6. Ordenação dos prompts

Dropdown "Ordenar por": Data (padrão), Tokens (maior), Tipo, Projeto — ordenação client-side no `useMemo`.

#### 7. Indicador de data nos cards

Data relativa no footer: "há 2 dias" usando `formatDistanceToNow` do `date-fns` (já instalado via shadcn calendar).

#### 8. Layout responsivo melhorado

- Remover `max-w-4xl` e usar `w-full` com padding adequado
- Cards com hover mais pronunciado (borda colorida, elevação sutil)
- Mobile: botões de ação empilhados verticalmente no card

#### 9. Hook `useDeletePrompt`

```ts
export function useDeletePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prompts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Prompt excluído.");
    },
  });
}
```

---

### Arquivos a modificar

| Arquivo | Ação |
|---|---|
| `src/pages/app/PromptsPage.tsx` | Reescrever completo — modal, stats, ordenação, exclusão, melhor preview |
| `src/hooks/useProjectDetail.ts` | Adicionar `useDeletePrompt` mutation |

### Detalhes da UI do modal

```
┌─────────────────────────────────────────────────────┐
│ [Master] Prompt Mestre Lovable          v1  [X]     │
│ Lovable · 1.159 tokens · Clínica — SaaS             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ## OBJETIVO DO CORE ENGINE                         │
│  Construir SaaS B2B para gestão de clínicas...      │
│  [conteúdo completo com scroll]                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Copiar]   [Ir para projeto ↗]                     │
└─────────────────────────────────────────────────────┘
```

### Ordem de execução
1. `useDeletePrompt` em `useProjectDetail.ts`
2. Reescrever `PromptsPage.tsx` completamente com todas as melhorias
