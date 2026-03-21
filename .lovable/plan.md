
## Upgrade de Mockups — Imagens Ultra-Realistas v4.0

### Diagnóstico real do sistema atual

**O que está funcionando:**
- Edge Function `generate-screen-mockup` existe e faz upload no Storage
- Modelo já é `google/gemini-3.1-flash-image-preview` (correto)
- Parser de telas robusto com 6 padrões regex
- Persistência via `project.metadata.mockups`
- Lightbox, download, progresso em lote — tudo funcional

**O PROBLEMA REAL — por que as imagens não são realistas:**

O prompt atual, apesar de extenso, tem falhas críticas de engenharia de prompt para geração de imagens:

1. **Prompt não força o modelo a gerar uma IMAGEM REAL de UI** — o texto é longo mas não diz "create a SCREENSHOT", "render actual UI components as pixels", "photorealistic interface". O modelo pode interpretar como "descreva" ao invés de "renderize".

2. **Sem anchoring visual para o modelo de imagem** — prompts de geração de imagem precisam de âncoras como "as seen in Figma", "high-resolution product screenshot", "render exactly as it would appear on screen". Sem isso, o modelo gera ilustrações abstratas.

3. **`## Tela: NomeDaTela` no contentInstructions usa formato exato** mas o modelo IA pode variar — e o parser já lida com isso. Porém a `screen_description` que chega para a Edge Function de imagem está sendo truncada em 400 chars, cortando contexto visual crítico.

4. **Aspect ratio fixo 9/16** no card — mas se o projeto é Desktop (Web), gerar em 9/16 é errado. Precisa de `16/9` para Web e `9/16` para Mobile.

5. **Sem `style_preset` no card** — o usuário não pode pedir "mais claro", "mais colorido", "iOS style" — tudo vai dark por padrão.

6. **Prompt não usa técnica de "negative prompting"** — sem dizer o que NÃO gerar: "no text overlays, no Lorem ipsum, no wireframe sketches, no cartoon style".

7. **`screen_description` passa apenas 4 linhas de texto** ao invés de todo o contexto estruturado da tela (componentes, estados, navegação) que foi gerado pelo `generate-ai-content`.

8. **Nenhum context injection de features ricas** — se o projeto é "Clínica SaaS", o mockup deveria ter campos "Paciente", "CRM", "Agendamento" — mas o prompt apenas menciona o nicho sem aprofundar.

### Solução — 3 mudanças de alto impacto

#### 1. Edge Function `generate-screen-mockup` — Prompt de engenharia avançada

**Técnica: Hierarchical Photorealistic UI Prompt**

```
CRITICAL INSTRUCTION: Generate a PHOTOREALISTIC HIGH-FIDELITY screenshot of a real software application UI.
This must look like an ACTUAL SCREENSHOT taken from a real, production-ready software product.
NOT a wireframe. NOT a sketch. NOT an illustration. A REAL UI screenshot.

[contexto do projeto]

SCREEN: "${screen_name}"
DETAILED DESCRIPTION:
${screen_description}  ← agora passa MAIS contexto

PIXEL-LEVEL RENDERING REQUIREMENTS:
- Render as a REAL application screenshot at exact ${resolution} resolution
- Every UI component must be FULLY RENDERED with realistic colors, shadows, and typography
- NO placeholder boxes — replace with ACTUAL rendered components
- Text must be READABLE and REALISTIC (domain-specific, not Lorem ipsum)
- Background: ${bgColor} — SOLID rendered pixels, not a sketch
- Buttons must look CLICKABLE with proper states (hover/default)
- Icons must be ACTUAL icons (not shapes) — use recognizable icon designs
- Input fields must have REALISTIC borders, focus rings, placeholder text
- Show a COMPLETE screen — status bar at top (mobile) / window chrome (desktop)

NEGATIVE PROMPT: no wireframe lines, no hand-drawn style, no cartoon, no abstract art, 
no placeholder text, no grey boxes, no sketch lines, no Lorem ipsum, no flat icons only

STYLE REFERENCE: This should look like a screenshot from Linear, Vercel Dashboard, or Figma — 
professional SaaS tool at the highest visual quality level.
```

#### 2. Passar a descrição COMPLETA da tela (não truncada)

Atualmente `ScreensWithMockups` passa apenas as primeiras 4 linhas como `screen_description`. Vamos extrair **toda a seção da tela** do Markdown gerado pelo `generate-ai-content` e enviar completo para a Edge Function.

No `parseScreens()`, ao invés de coletar apenas 4 linhas, coletar até 800 chars da descrição completa da tela. Isso garante que todos os componentes UI, estados e dados listados pelo Gemini 2.5 Flash chegam ao modelo de imagem.

#### 3. Aspect ratio inteligente + Device Frame

- Detectar plataforma do projeto: se `platform` contém "mobile/ios/android" → `aspect-[9/16]`; caso contrário (Web/Desktop) → `aspect-[16/10]`
- Adicionar `platform_type` no payload da request para a Edge Function
- No prompt: adaptar resolução e layout conforme plataforma

### Arquivos a modificar

| Arquivo | Mudança | Impacto |
|---|---|---|
| `supabase/functions/generate-screen-mockup/index.ts` | Prompt ultra-realista com negative prompts + context completo | CRÍTICO |
| `src/components/ScreensWithMockups.tsx` | Parser coleta descrição completa (800 chars) + aspect ratio por plataforma + passa platform_type | ALTO |
| `src/pages/app/ProjectDetailPage.tsx` | Passar `projectPlatform` para `ScreensTabWrapper` → `ScreensWithMockups` → Edge Function | MÉDIO |

### Detalhes da nova arquitetura de prompt

**Prompt estruturado em 5 blocos:**
1. `CRITICAL INSTRUCTION` — instrução imperativa de "screenshot real"
2. `PROJECT CONTEXT` — nicho, título, público, plataforma, features
3. `SCREEN SPECIFICATION` — nome + descrição completa da tela
4. `VISUAL RENDERING REQUIREMENTS` — especificações pixel a pixel
5. `NEGATIVE PROMPT` — o que NÃO gerar
6. `STYLE REFERENCE` — âncoras visuais ("like Linear", "like Vercel", "like Figma")

**Contextualização por nicho** — nova função `getNicheContext()`:
- `clinica/saúde` → "patient records, appointment calendar, medical staff profiles, CPF/CRM fields"
- `ecommerce` → "product catalog, cart summary, order status, SKU, price variations"  
- `financeiro` → "charts, transaction history, balance cards, currency formatting BRL"
- `educação` → "course cards, progress bars, video player, quiz interface"
- etc.

**Âncoras visuais por tipo:**
- Web SaaS → "similar to Linear.app, Vercel dashboard, Notion"
- Mobile → "similar to Instagram, WhatsApp, Uber interface quality"
- Admin → "similar to Retool, Metabase, Grafana"

### Ordem de execução
1. Edge Function `generate-screen-mockup` — novo prompt completo
2. `ScreensWithMockups` — parser com mais contexto + aspect ratio inteligente
3. `ProjectDetailPage` — passar platform para ScreensTabWrapper
