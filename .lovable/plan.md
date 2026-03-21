
## Auditoria Rigorosa da Aba "Telas" + Upgrade Máximo v3.1

### Diagnóstico completo após leitura de 7 arquivos

**Problemas identificados na página atual (imagem + código):**

**1. CRÍTICO — Edge Function usa `google/gemini-3-pro-image-preview` mas o modelo mais robusto disponível é `google/gemini-3.1-flash-image-preview`**
O `generate-screen-mockup` usa `google/gemini-3-pro-image-preview`. Porém, o catálogo de modelos disponíveis inclui `google/gemini-3.1-flash-image-preview` que é descrito como "Fast image generation and editing model with pro-level quality". O prompt atual também é genérico demais — não aproveita o contexto completo do projeto (features, integrações, monetização, público) para gerar mockups ricos e contextualizados.

**2. CRÍTICO — O prompt de imagem não tem especificidade visual suficiente**
O prompt atual é texto simples sem instruções de composição, paleta de cores específica do projeto, estrutura de navegação, ou indicação do nicho. Isso resulta em mockups genéricos. Um prompt de engenharia mais robusto com instruções visuais precisas produzirá mockups muito mais ricos.

**3. CRÍTICO — Parser de telas muito restritivo (`## Tela: NomeDaTela`)**
O parser só reconhece `## Tela: NomeDaTela` exatamente. Mas a IA pode gerar `## Tela 1: Login`, `## Screen:`, `### Tela:`, etc. Isso faz com que 0 telas sejam detectadas se o formato variar. O parser precisa ser mais robusto com múltiplos padrões.

**4. IMPORTANTE — Nenhuma persistência de mockups gerados ao recarregar a página**
Os mockups ficam apenas em `useState` local do `ScreensWithMockups`. Ao trocar de aba e voltar, ou recarregar a página, todos os mockups somem. O banco já tem a tabela `projects.metadata` (JSON) — podemos salvar os URLs ali sem nova migration.

**5. IMPORTANTE — `generate-ai-content` para a aba `screens` usa `google/gemini-3-flash-preview`**
O model atual para gerar a documentação de telas é flash simples. Podemos usar `google/gemini-2.5-flash` para documentação mais rica e detalhada, que vai gerar melhores descrições para os mockups subsequentes.

**6. IMPORTANTE — UI: imagens sem estado "gerado previamente" claro**
Quando um mockup existe, o card mostra a imagem mas o botão "Regenerar" não tem confirmação de que isso vai apagar a imagem atual. Sem aviso. Usuário pode clicar acidentalmente.

**7. IMPORTANTE — Grid de mockups muito pequeno em desktop**
`grid-cols-4` em desktop produz cards de ~200px de largura — muito pequenos para avaliar a UI. Cards deveriam ser maiores com aspect-ratio mais generoso.

**8. IMPORTANTE — Sem visualização do histórico de mockups por tela**
Se o usuário regenerar um mockup, o anterior é perdido silenciosamente. Deveríamos manter ao menos a versão anterior no estado local.

**9. MENOR — Toolbar da aba não mostra progresso de geração em lote**
"Gerar Todos" não mostra qual tela está sendo gerada no momento — apenas um spinner genérico. Precisa de indicador de progresso com nome da tela atual.

**10. MENOR — Erro na UI: `MarkdownRenderer` usa `text-2xs` para parágrafos, difícil de ler**
A documentação de telas fica em `text-2xs` (10px), muito pequena. Texto da documentação deve ser `text-xs` (12px) para legibilidade.

**11. MENOR — Falta indicador de "salvo no Storage" vs "base64 local"**
A função tem um fallback que retorna base64 diretamente se o upload no Storage falhar. O frontend não diferencia — não sabe se a imagem está persistida ou temporária.

---

### O que será implementado

#### 1. Edge Function `generate-screen-mockup` — Upgrade massivo do prompt de IA

**Antes:** prompt genérico de 10 linhas sem contexto do projeto
**Depois:** prompt de engenharia estruturado com:
- Contexto completo do projeto (nicho, tipo, público, features, plataforma)
- Especificação visual precisa (paleta de cores adaptada ao nicho, componentes específicos da tela)
- Instruções de layout baseadas na plataforma (mobile portrait vs desktop widescreen)
- Descrição de hierarquia visual e navegação esperada
- Indicação do estado da tela (logado/não logado, lista cheia, formulário ativo)
- Modelo atualizado para `google/gemini-3.1-flash-image-preview` (mais rápido + pro-quality)

**Novo prompt template:**
```
You are a senior UI/UX designer creating a high-fidelity screen mockup.

PROJECT CONTEXT:
- Application: ${project.title} — ${project.type} for ${project.niche} industry
- Target audience: ${project.audience}
- Platform: ${platform} (${isMobile ? "portrait 390×844" : "desktop 1440×900 widescreen"})
- Key features: ${features.join(", ")}
- Integrations: ${integrations.join(", ")}

SCREEN TO DESIGN: "${screen_name}"
Screen purpose: ${screen_description}

VISUAL REQUIREMENTS:
- Professional SaaS dark theme: deep navy/charcoal background (#0d1117 to #161b22)
- Accent: electric blue (#4F8EF7) with indigo secondary (#7B5CF0)
- Typography: clean sans-serif hierarchy — large title, medium subtitles, small body
- Show REAL UI components: ${componentHints}
- Realistic data: use domain-specific placeholder content (not "Lorem ipsum")
- Navigation: ${navHints}
- Status indicators, badges, and action buttons clearly visible
- Pixel-perfect spacing with consistent 8px grid
- Show full screen, no cropping, all elements visible
```

#### 2. `generate-ai-content` — Upgrade de modelo para documentação de telas

Trocar `google/gemini-3-flash-preview` para `google/gemini-2.5-flash` especificamente para `content_type === "screens"` — documentação mais rica alimenta melhores mockups.

Melhorar o `contentInstructions.screens` para exigir mais detalhes visuais em cada tela:
- Componentes UI específicos (não genéricos)
- Hierarquia de informação
- Cores e estados

#### 3. `ScreensWithMockups.tsx` — Redesign completo

**Parser mais robusto:** aceita `## Tela: X`, `## Tela X:`, `## Screen:`, `### Tela:`, etc.

**Persistência em `projects.metadata`:** ao gerar um mockup, salvar `{ screen_name: url }` no campo `metadata` do projeto via `updateProject`. Ao montar o componente, ler de `metadata.mockups`. Desta forma sobrevive a recarregamentos.

**UI melhorada:**
- Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (3 colunas no máximo, não 4) — cards maiores
- `aspect-ratio: 9/16` mantido mas com `min-h-[280px]` para cards mais altos
- Indicador de progresso no "Gerar Todos" com nome da tela atual
- Confirmação antes de regenerar quando já existe imagem
- Badge "Salvo" vs "Temporário" quando URL é base64
- Botão de zoom no lightbox com scroll zoom
- Texto da documentação em `text-xs` (não `text-2xs`)
- Contador de progresso: "3/8 mockups gerados"

**Novo componente `MockupProgressBar`:** barra de progresso horizontal quando "Gerar Todos" está ativo, mostrando tela atual.

#### 4. `ProjectDetailPage.tsx` — Persistência de mockups via metadata

Criar hook `useMockupPersistence` inline que:
- Ao receber novo mockup, chama `updateProject.mutate({ metadata: { ...existingMeta, mockups: { ...existingMockups, [name]: url } } })`
- Ao montar `ScreensTabWrapper`, passa mockups já salvos em `project.metadata?.mockups`
- Passa função `onMockupSaved` para o `ScreensWithMockups`

#### 5. Melhorias de qualidade e tipagem

- Remover `text-2xs` da documentação Markdown, usar `text-xs`
- Adicionar `title` nos botões de ação para acessibilidade
- Corrigir espaçamento inconsistente no grid
- Adicionar `loading="lazy"` nas imagens geradas
- Tratar fallback base64 com aviso visual

---

### Arquivos a criar/modificar

| Arquivo | Ação | Impacto |
|---|---|---|
| `supabase/functions/generate-screen-mockup/index.ts` | Reescrever — prompt muito mais inteligente + modelo 3.1-flash-image | CRÍTICO |
| `supabase/functions/generate-ai-content/index.ts` | Editar — modelo melhor para screens + instruções visuais mais ricas | ALTO |
| `src/components/ScreensWithMockups.tsx` | Reescrever — parser robusto, cards maiores, persistência, progresso | ALTO |
| `src/pages/app/ProjectDetailPage.tsx` | Editar — persistir mockups em metadata, passar mockups salvos | ALTO |

### Ordem de execução
1. Edge Function `generate-screen-mockup` — novo prompt de IA
2. Edge Function `generate-ai-content` — upgrade para screens
3. `ScreensWithMockups` — redesign + parser robusto + persistência
4. `ProjectDetailPage` — integração de persistência via metadata
