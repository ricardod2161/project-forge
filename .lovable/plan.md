
## Auditoria Completa + Plano de Produção — Arquiteto IA

### Estado atual do sistema (diagnóstico honesto)

**O que funciona:**
- Auth (login/cadastro) operando com Supabase — confirmado pelas network requests
- Wizard cria projetos e salva no banco (HTTP 201 confirmado nos logs)
- Dashboard carrega métricas reais
- ProjectsPage com busca/filtros funcional
- Design system visual consistente

**O que está quebrado ou incompleto (8 problemas críticos):**

1. **`ProjectDetailPage`** — Exibe apenas `Projeto #ID` hardcoded. Não carrega dados do Supabase. Abas são decorativas sem conteúdo. Prioridade máxima.

2. **`PromptsPage`** — Placeholder total. Mensagem "disponível após Etapa 5". Precisa mostrar todos os prompts do usuário por projeto.

3. **`TemplatesPage`** — Placeholder. Precisa carregar da tabela `templates` (existe no banco).

4. **`VersionsPage`** — Placeholder. Precisa listar versões da tabela `project_versions`.

5. **`EvaluationsPage`** — Placeholder. Precisa listar projetos com scores.

6. **`SettingsPage`** — Cards decorativos sem ação. Perfil não edita nem salva.

7. **`ExportsPage`** — Placeholder total.

8. **`ProjectCard`** — Botão "Opções" (MoreHorizontal) não tem menu dropdown. Favoritar não chama API.

**Triggers ausentes no banco:** As funções `update_updated_at_column` existem mas sem triggers registrados — o campo `updated_at` não está sendo atualizado automaticamente.

---

### O que será implementado

**1. Migration — triggers `updated_at` em todas as tabelas**
- Criar trigger `update_updated_at` para `projects`, `prompts`, `project_versions`, `templates`, `profiles`

**2. `ProjectDetailPage` — completamente reescrita**
- Carrega dados reais via `useQuery` na tabela `projects` por `id`
- Header com título real, status real, score ring animado
- Abas com state local (`activeTab`)
- **Aba "Visão Geral"**: exibe todos os campos do projeto (ideia, tipo, nicho, público, features, integrações, monetização)
- **Aba "Ideia Original"**: textarea com texto bruto preservado
- **Aba "Prompts"**: lista prompts do projeto com botão copiar
- **Demais abas**: empty state elegante com CTA contextual (não "disponível na Etapa X")
- Botão Favoritar funcional (chama `useToggleFavorite`)
- Botão "Editar status" dropdown

**3. `PromptsPage` — funcional**
- Lista todos os prompts do usuário agrupados por projeto
- Busca textual
- Botão copiar com feedback visual ("Copiado!" 2s)
- Empty state: "Crie um projeto e gere seus primeiros prompts"

**4. `TemplatesPage` — funcional com dados reais**
- Carrega da tabela `templates` via React Query
- Filtros por nicho (chips)
- Cards por template com título, descrição, nicho badge
- Empty state enquanto não há templates seed
- Seed: inserir 6 templates iniciais na migration

**5. `VersionsPage` — funcional**
- Lista versões agrupadas por projeto via React Query
- Exibe `version_number`, `changes_summary`, `created_at`
- Empty state contextual

**6. `EvaluationsPage` — funcional**
- Lista projetos com `quality_score` não nulo
- Score ring (componente já existe) para cada projeto
- Projetos sem score: empty state "Execute uma avaliação no projeto"

**7. `SettingsPage` — funcional com persistência**
- Seção "Perfil": input nome + email read-only + botão salvar → UPDATE na tabela `profiles`
- Seção "Aparência": toggle dark/light (já funciona no header, replicar aqui)
- Seção "Plano": carrega `plan` da tabela `profiles`
- Demais seções: UI polida mas sem funcionalidade back-end ainda (scope claro)

**8. `ExportsPage` — funcional com exportação real**
- Carrega projetos do usuário
- Seleciona projeto → exporta documentação técnica em texto estruturado
- Botão "Copiar tudo" e "Baixar .txt"
- Conteúdo gerado client-side a partir dos dados do projeto (sem Edge Function necessária)

**9. `ProjectCard` — dropdown de ações**
- Menu dropdown no botão MoreHorizontal: Favoritar/Desfavoritar, Arquivar, Ver detalhes
- Favoritar chama `useToggleFavorite`

**10. Hook `useProjectDetail` — novo hook**
- `useProjectDetail(id)` → query `projects` por id + query `prompts` por project_id
- Tipos corretos (sem `any`)

---

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/[ts]_triggers.sql` | Criar — triggers updated_at + seed templates |
| `src/hooks/useProjectDetail.ts` | Criar — hook para detalhes do projeto |
| `src/pages/app/ProjectDetailPage.tsx` | Reescrever — real e funcional |
| `src/pages/app/PromptsPage.tsx` | Reescrever — lista real de prompts |
| `src/pages/app/TemplatesPage.tsx` | Reescrever — templates do banco |
| `src/pages/app/VersionsPage.tsx` | Reescrever — versões reais |
| `src/pages/app/EvaluationsPage.tsx` | Reescrever — scores reais |
| `src/pages/app/SettingsPage.tsx` | Reescrever — perfil editável |
| `src/pages/app/ExportsPage.tsx` | Reescrever — exportação funcional |
| `src/components/ProjectCard.tsx` | Editar — dropdown de ações |

### Ordem de execução
1. Migration (triggers + seed templates)
2. Hook `useProjectDetail`
3. `ProjectDetailPage` (maior prioridade — usuário acabou de criar projeto)
4. `ProjectCard` dropdown
5. `PromptsPage`, `TemplatesPage`, `VersionsPage`, `EvaluationsPage`
6. `SettingsPage`, `ExportsPage`
