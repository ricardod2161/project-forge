import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Component hints per screen type ────────────────────────────────────────────
function getComponentHints(screenName: string, isMobile: boolean): string {
  const name = screenName.toLowerCase();
  if (name.includes("login") || name.includes("auth") || name.includes("cadastro") || name.includes("acesso"))
    return "centered card with logo, email/password fields, submit button, forgot password link, social login buttons";
  if (name.includes("dashboard") || name.includes("painel") || name.includes("início") || name.includes("home"))
    return isMobile
      ? "top stats row with 2 metric cards, activity feed list, bottom navigation bar, floating action button"
      : "top KPI row with 4 stat cards, main chart area, recent activity table, sidebar navigation, header with user avatar";
  if (name.includes("perfil") || name.includes("configuração") || name.includes("settings") || name.includes("conta"))
    return "profile avatar with edit button, form sections with labels and inputs, save button, danger zone section";
  if (name.includes("lista") || name.includes("list") || name.includes("projeto") || name.includes("items"))
    return "search bar and filter chips, sortable table/list with rows, action column with dropdown, pagination controls, empty state placeholder";
  if (name.includes("detalhe") || name.includes("detail") || name.includes("ver") || name.includes("show"))
    return "breadcrumb navigation, hero section with title and metadata, tabbed content sections, action buttons in header, sidebar with related info";
  if (name.includes("formulário") || name.includes("form") || name.includes("criar") || name.includes("novo") || name.includes("editar"))
    return "multi-step form with step indicator, labeled input fields, validation states, cancel and submit buttons, progress bar";
  if (name.includes("relatório") || name.includes("report") || name.includes("análise") || name.includes("analytic"))
    return "date range picker, multiple chart types (bar, line, pie), data table below charts, export button, filter sidebar";
  if (name.includes("notificação") || name.includes("notification") || name.includes("alerta"))
    return "notification list with unread indicators, category filter tabs, mark all read button, notification detail drawer";
  if (name.includes("onboarding") || name.includes("boas-vindas") || name.includes("welcome"))
    return "step-by-step wizard with progress dots, illustration or icon per step, back/next buttons, skip option";
  return isMobile
    ? "top navigation bar with back arrow, main content area with cards, bottom action button"
    : "left sidebar navigation, main content area with cards and sections, top action bar with buttons";
}

function getNavHints(isMobile: boolean, platform: string): string {
  if (isMobile || platform.toLowerCase().includes("mobile"))
    return "bottom tab bar with 5 icons, top header with title and back button, hamburger menu for secondary options";
  return "fixed left sidebar with logo, nav items grouped by section, top header with breadcrumbs and user dropdown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      project_id,
      screen_name,
      screen_description,
    } = await req.json() as {
      project_id: string;
      screen_name: string;
      screen_description: string;
    };

    if (!project_id || !screen_name) {
      return new Response(JSON.stringify({ error: "project_id e screen_name são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify project ownership and fetch full context
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, type, niche, platform, audience, features, integrations, monetization")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    const platform = project.platform ?? "Web";
    const isMobile = platform.toLowerCase().includes("mobile") || platform.toLowerCase().includes("ios") || platform.toLowerCase().includes("android");
    const features = (project.features ?? []).slice(0, 5).join(", ") || "general features";
    const integrations = (project.integrations ?? []).slice(0, 4).join(", ") || "none";
    const componentHints = getComponentHints(screen_name, isMobile);
    const navHints = getNavHints(isMobile, platform);
    const dimensionNote = isMobile ? "portrait 390×844px mobile screen" : "widescreen desktop 1440×900px layout";

    // ── High-fidelity engineering prompt ───────────────────────────────────────
    const imagePrompt = `You are a senior product designer at a top-tier SaaS company. Create a pixel-perfect, high-fidelity UI mockup screenshot.

PROJECT CONTEXT:
- App name: "${project.title}"
- Industry: ${project.niche ?? "technology"} — ${project.type ?? "SaaS web application"}
- Target audience: ${project.audience ?? "professional users"}
- Platform: ${platform} (${dimensionNote})
- Key features: ${features}
- Integrations: ${integrations}

SCREEN TO DESIGN: "${screen_name}"
Purpose: ${screen_description || `Main ${screen_name} interface for ${project.title}`}

MANDATORY VISUAL SPECIFICATIONS:
- Dark professional theme: backgrounds in deep charcoal/navy (#0d1117, #0f1117, #161b22, #1c2128)
- Primary accent: electric indigo/blue (#4F8EF7, #5B8AF5) for CTAs and active states
- Secondary accent: violet (#7B5CF0) for highlights and badges
- Success green (#22c55e), warning amber (#f59e0b), destructive red (#ef4444) for status indicators
- Typography: crisp sans-serif — bold 20-24px titles, 14-16px body, 11-12px labels
- 8px spacing grid throughout — consistent padding and alignment

UI COMPONENTS TO INCLUDE:
${componentHints}

NAVIGATION PATTERN:
${navHints}

CONTENT QUALITY:
- Use realistic, domain-specific ${project.niche ?? "tech"} placeholder data (NO lorem ipsum)
- Populate tables, lists, and cards with authentic-looking sample data
- Show hover/active states on interactive elements
- Display realistic metrics, names, dates relevant to ${project.niche ?? "the domain"}

TECHNICAL REQUIREMENTS:
- Fill the entire ${isMobile ? "390×844" : "1440×900"} canvas — no blank areas or cropping
- Show complete UI including status bars (mobile) or browser chrome (desktop) if appropriate  
- Pixel-perfect component alignment
- Subtle card shadows, glass morphism effects on modals, smooth gradients
- Include realistic icons (search, notification bell, settings gear, etc.)
- Active navigation state clearly highlighted
- Professional loading complete state — all content visible

OUTPUT: A single complete screenshot of the "${screen_name}" screen, photorealistic in quality, suitable for a design presentation to investors.`;

    // Call Lovable AI Gateway — model upgraded to gemini-3.1-flash-image-preview (faster + pro-quality)
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text().catch(() => "");
      console.error("AI Gateway error:", aiResponse.status, errText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Try multiple response shapes — different models return slightly different formats
    const imageUrl =
      aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
      aiData.choices?.[0]?.message?.content?.find?.((c: { type: string }) => c.type === "image_url")?.image_url?.url ||
      null;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("Nenhuma imagem foi gerada pelo modelo");
    }

    // Extract base64 data — support both data URL and raw base64
    let imageFormat = "png";
    let base64Data = imageUrl;

    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (base64Match) {
      imageFormat = base64Match[1];
      base64Data = base64Match[2];
    }

    // Decode base64 to bytes
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Use service role client to upload to storage
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Sanitize screen name for file path
    const sanitized = screen_name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const filePath = `${user.id}/${project_id}/${sanitized}-${Date.now()}.${imageFormat}`;

    const { error: uploadError } = await serviceClient.storage
      .from("screen-mockups")
      .upload(filePath, bytes.buffer, {
        contentType: `image/${imageFormat}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Fall back to returning base64 directly (temporary, not persisted)
      const fallbackUrl = base64Match ? imageUrl : `data:image/${imageFormat};base64,${base64Data}`;
      return new Response(
        JSON.stringify({ image_url: fallbackUrl, storage_path: null, persisted: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = serviceClient.storage
      .from("screen-mockups")
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        image_url: publicUrlData.publicUrl,
        storage_path: filePath,
        persisted: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-screen-mockup error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
