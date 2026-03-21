
## Geração de Imagens de Mockup na Aba "Telas"

### O que o usuário quer
Quando a IA gera a documentação da aba "Telas", o usuário quer também **ver imagens visuais** de como cada tela vai ficar — mockups/wireframes gerados por IA.

### Abordagem técnica

**Fluxo atual:** botão "Gerar com IA" → chama Edge Function `generate-ai-content` → retorna Markdown → exibido no `AIContentTab`.

**Nova abordagem para "Telas":** após gerar o Markdown, uma segunda chamada (ou dentro da mesma Edge Function) usa o **Lovable AI Gateway com modelo de geração de imagens** (`google/gemini-3-pro-image-preview`) para criar wireframes/mockups de UI para cada tela principal descrita.

### Arquitetura da solução

**1. Nova Edge Function `generate-screen-mockup`**
- Recebe `{ project_id, screen_name, screen_description }`  
- Monta prompt de imagem: `"Wireframe profissional de alta fidelidade de uma tela [nome] para um sistema [nicho/tipo]. Estilo: clean, dark UI, mobile-first. Inclui [elementos da tela]. Resolução: 400x800. Sem texto."`
- Chama Lovable AI Gateway com `model: "google/gemini-3-pro-image-preview"` e `modalities: ["image"]`
- Retorna a imagem em base64
- Salva no Supabase Storage bucket `screen-mockups` (cria o bucket se não existir)
- Retorna URL pública da imagem

**2. Parser de telas no frontend**
- Quando o conteúdo Markdown da aba "Telas" é gerado, um parser extrai automaticamente os nomes das telas (`## Tela: NomeDaTela`)
- Para cada tela encontrada (até 6 para não sobrecarregar), exibe um card com botão "Gerar Mockup"
- Ao clicar, chama `generate-screen-mockup` para aquela tela específica
- Exibe a imagem gerada no card com animação de fade-in
- Botão "Regenerar" para nova tentativa

**3. Novo componente `ScreensWithMockups`**
- Renderizado apenas na aba "screens" (ao invés do `AIContentTab` genérico)
- Layout de dois painéis: esquerda = lista Markdown das telas, direita = galeria de mockups
- Em mobile: empilhado (texto → mockups)
- Estado: `mockups: Record<screenName, { url: string | null; isLoading: boolean }>`

**4. Supabase Storage**
- Migration para criar bucket público `screen-mockups`
- RLS policy: usuário autenticado pode fazer upload, leitura pública

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `supabase/functions/generate-screen-mockup/index.ts` | Criar — gera imagem via Gemini Image e salva no Storage |
| `supabase/config.toml` | Editar — adicionar bloco `[functions.generate-screen-mockup]` |
| `supabase/migrations/[ts]_screen_mockups_bucket.sql` | Criar — bucket `screen-mockups` + policy |
| `src/components/ScreensWithMockups.tsx` | Criar — componente especializado para aba Telas com mockups |
| `src/pages/app/ProjectDetailPage.tsx` | Editar — substituir `AIContentTabWrapper` da aba `screens` por `ScreensWithMockups` |

### UX do componente

**Estado vazio** (nunca gerou texto):
- Botão "Gerar Telas com IA" central (igual ao `AIContentTab` atual)

**Após gerar texto:**
- Toolbar: "Gerado por IA | Copiar | Regenerar"
- Layout dividido:
  - Coluna principal: lista das telas em Markdown (renderizador existente)
  - Seção "Mockups Visuais" abaixo: grid de cards por tela
    - Cada card: nome da tela + botão "Gerar Mockup" ou imagem gerada
    - Badge de loading individual por tela
    - Imagem com aspect-ratio 9/16 (estilo mobile) ou 16/9 (desktop)
    - Overlay com nome da tela

**Loading individual por tela:** não bloqueia outras telas — cada card tem seu próprio estado de loading.
