import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Niche context injection ─────────────────────────────────────────────────────
function getNicheContext(niche: string): string {
  const n = niche.toLowerCase();
  if (n.includes("clínica") || n.includes("clinica") || n.includes("saúde") || n.includes("saude") || n.includes("médic") || n.includes("medic") || n.includes("hospital") || n.includes("health"))
    return "Patient records with name, CPF, CRM, appointment calendar, medical staff profiles, consultation history, prescription forms, insurance fields, SOAP notes, vital signs charts";
  if (n.includes("ecommerce") || n.includes("e-commerce") || n.includes("loja") || n.includes("varejo") || n.includes("store") || n.includes("shop"))
    return "Product catalog grid with photos, prices in BRL, cart summary, checkout steps, order tracking, SKU codes, inventory levels, customer reviews with stars, flash sale countdown timers";
  if (n.includes("financ") || n.includes("banco") || n.includes("pagamento") || n.includes("invest") || n.includes("contabil"))
    return "Balance cards with BRL values, line/bar charts with historical data, transaction list with dates and categories, portfolio pie chart, income vs expense comparison, bank account selector";
  if (n.includes("educa") || n.includes("curso") || n.includes("aula") || n.includes("school") || n.includes("learn") || n.includes("ensino"))
    return "Course card grid with thumbnails and progress bars, video player with timeline, lesson list with check marks, quiz interface with multiple choice, certificate badges, student progress charts";
  if (n.includes("imob") || n.includes("imóvel") || n.includes("imovel") || n.includes("aluguel") || n.includes("real estate"))
    return "Property cards with photos, price, address, sqm, bedrooms, map view with pins, filter sidebar with price range slider, virtual tour button, agent contact card";
  if (n.includes("restaur") || n.includes("food") || n.includes("delivery") || n.includes("cardápio") || n.includes("cardapio"))
    return "Menu categories with dish photos and prices, cart drawer, item customization modal, order status tracker with steps, delivery time estimate, rating stars, promo code input";
  if (n.includes("rh") || n.includes("recursos humanos") || n.includes("hr") || n.includes("recrutamento") || n.includes("people"))
    return "Employee directory with avatar grid, org chart, vacation calendar, payroll summary cards, performance review form with ratings, recruitment pipeline kanban, time tracking table";
  if (n.includes("logística") || n.includes("logistica") || n.includes("transpor") || n.includes("frota") || n.includes("entrega"))
    return "Route map with vehicle pins, shipment status cards, driver list with avatar and status badge, delivery timeline, package tracking code, fleet metrics dashboard";
  if (n.includes("agro") || n.includes("fazend") || n.includes("rural") || n.includes("farm"))
    return "Field map with crop zones, harvest progress bars, weather widget, pesticide application calendar, production yield charts, equipment maintenance schedule";
  if (n.includes("jurídic") || n.includes("juridic") || n.includes("advog") || n.includes("law") || n.includes("legal"))
    return "Case management list with status badges, document repository with file icons, deadline calendar, client profile with case history, billing hours tracker, court date alerts";
  return "Dashboard metrics with KPI cards, data table with sorting and filters, user management list, notification center, activity feed, settings form with toggles";
}

// ── Visual anchors per project type ────────────────────────────────────────────
function getStyleAnchors(type: string, niche: string): string {
  const t = (type + niche).toLowerCase();
  if (t.includes("saas") || t.includes("b2b") || t.includes("plataforma") || t.includes("platform"))
    return "Linear.app, Vercel Dashboard, Notion, Retool — clean SaaS with excellent typography and generous whitespace";
  if (t.includes("mobile") || t.includes("ios") || t.includes("android") || t.includes("app"))
    return "Instagram, Uber, Nubank, iFood — polished native mobile apps with smooth gradients and clear tap targets";
  if (t.includes("ecommerce") || t.includes("loja") || t.includes("store"))
    return "Shopify, VTEX, Mercado Livre — modern e-commerce with clear product hierarchy and conversion-optimized layouts";
  if (t.includes("admin") || t.includes("backoffice") || t.includes("erp") || t.includes("crm"))
    return "Metabase, Grafana, HubSpot — data-dense admin panels with tight spacing and information-rich grids";
  if (t.includes("fintech") || t.includes("financ") || t.includes("banco"))
    return "Nubank, Inter, XP Investimentos — polished fintech with trust-building colors and clear numeric hierarchy";
  return "Figma, Linear, Vercel — professional software products with crisp typography and thoughtful component design";
}

// ── Component hints per screen type ────────────────────────────────────────────
function getComponentHints(screenName: string, isMobile: boolean): string {
  const name = screenName.toLowerCase();
  if (name.includes("login") || name.includes("auth") || name.includes("cadastro") || name.includes("acesso") || name.includes("sign"))
    return "centered card with logo at top, email input field with label, password field with show/hide toggle, primary CTA button, 'Forgot password' link below, divider with 'or', social login buttons (Google/GitHub), footer link to signup";
  if (name.includes("dashboard") || name.includes("painel") || name.includes("início") || name.includes("home") || name.includes("overview"))
    return isMobile
      ? "top greeting with user avatar, 2-column KPI cards row with numbers and trend arrows, scrollable recent activity list with avatar and action text, floating action button, bottom tab navigation"
      : "4 KPI stat cards in a row with icon, value and percentage change, large primary chart below (line or bar), recent activity table with avatar, date, description and status badge, quick action buttons in header";
  if (name.includes("perfil") || name.includes("configuração") || name.includes("settings") || name.includes("conta") || name.includes("profile"))
    return "profile header with large avatar circle, editable name and bio fields, section dividers with labels, toggle switches for notifications, plan badge, save button with loading state, danger zone section at bottom with red delete button";
  if (name.includes("lista") || name.includes("list") || name.includes("gerencia") || name.includes("items") || name.includes("registros"))
    return "search bar with filter icon, filter chips row (All, Active, Archived), sortable data table with checkbox column, avatar, name, date, status badge and action kebab menu, pagination controls with page numbers, row count indicator";
  if (name.includes("detalhe") || name.includes("detail") || name.includes("ver ") || name.includes("show") || name.includes("visualizar"))
    return "breadcrumb navigation at top, hero section with large title, metadata chips row, tab bar (Overview, Activity, Settings), content sections in cards, action button group in top right, sidebar with related information panel";
  if (name.includes("formulário") || name.includes("form") || name.includes("criar") || name.includes("novo") || name.includes("editar") || name.includes("cadastrar"))
    return "multi-section form with section headers, labeled input fields with helper text, select dropdowns, date pickers, file upload area with dashed border, form validation error messages in red, sticky footer with Cancel and Save buttons";
  if (name.includes("relatório") || name.includes("report") || name.includes("análise") || name.includes("analytic") || name.includes("métricas"))
    return "date range picker in header, summary stats row, primary line chart with tooltip, secondary bar chart, data breakdown table with sortable columns, export CSV/PDF button, filter sidebar panel";
  if (name.includes("notificação") || name.includes("notification") || name.includes("alertas") || name.includes("inbox"))
    return "segmented filter tabs (All, Unread, Mentions), notification items with left colored dot indicator, sender avatar, message preview, relative timestamp, mark-all-read button, empty state illustration when no notifications";
  if (name.includes("onboarding") || name.includes("boas-vindas") || name.includes("welcome") || name.includes("setup"))
    return "top step progress bar with numbered dots, large illustration or icon for current step, bold step title, description paragraph, back/next navigation buttons, skip option in corner";
  if (name.includes("calendar") || name.includes("calendário") || name.includes("agenda") || name.includes("schedule"))
    return "month/week/day view toggle, calendar grid with event blocks in different colors, today highlighted, event creation button, event detail popup on click, mini month navigator sidebar";
  if (name.includes("chat") || name.includes("mensage") || name.includes("message") || name.includes("conversa"))
    return "left sidebar with conversation list and search, main chat area with message bubbles (left/right), timestamp labels, typing indicator, attachment and emoji buttons in input, send button";
  return isMobile
    ? "sticky header with back arrow and title, scrollable main content with cards, pull-to-refresh indicator, floating action button at bottom right"
    : "left sidebar with navigation items and active state highlighting, main content area with cards and data sections, breadcrumb in top bar, user dropdown in header right";
}

function getNavHints(isMobile: boolean, platform: string): string {
  if (isMobile || platform.toLowerCase().includes("mobile") || platform.toLowerCase().includes("ios") || platform.toLowerCase().includes("android"))
    return "bottom tab bar with 4-5 icons and labels, top status bar with time and battery, back arrow in header, floating action button";
  return "fixed left sidebar (240px wide) with logo at top, grouped nav items with icons and labels, active item highlighted with primary color, top header bar with breadcrumbs, search icon and user avatar dropdown";
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
      platform_type,
    } = await req.json() as {
      project_id: string;
      screen_name: string;
      screen_description: string;
      platform_type?: string;
    };

    if (!project_id || !screen_name) {
      return new Response(JSON.stringify({ error: "project_id e screen_name são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch full project context
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, type, niche, platform, audience, features, integrations, monetization, description")
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

    // Determine platform
    const effectivePlatform = platform_type ?? project.platform ?? "Web";
    const isMobile = ["mobile", "ios", "android", "react native", "flutter"].some(k => effectivePlatform.toLowerCase().includes(k));
    // Context enrichment
    const nicheContext = getNicheContext(project.niche ?? "");
    const styleAnchors = getStyleAnchors(`${project.type ?? ""} ${project.niche ?? ""}`, project.niche ?? "");
    const componentHints = getComponentHints(screen_name, isMobile);
    const navHints = getNavHints(isMobile, effectivePlatform);

    // ── CONCISE HIGH-IMPACT PROMPT (shorter = better for image models) ────────────
    const imagePrompt = `Photorealistic UI screenshot of "${screen_name}" screen for "${project.title}", a ${project.type ?? "SaaS"} app in the ${project.niche ?? "tech"} industry.

Platform: ${effectivePlatform} — ${isMobile ? "mobile portrait 390×844px" : "desktop widescreen 1440×900px"}.

STYLE: Look exactly like a real production app screenshot (similar to ${styleAnchors}). Dark theme with deep navy/charcoal backgrounds (#0d1117, #161b22), electric blue accents (#4F8EF7), crisp white text, subtle card borders.

SCREEN COMPONENTS: ${componentHints}

NAVIGATION: ${navHints}

DOMAIN DATA: ${nicheContext}

${screen_description ? `SCREEN DETAILS: ${screen_description.slice(0, 400)}` : ""}

REQUIREMENTS:
- Photorealistic, pixel-perfect — looks like an ACTUAL SCREENSHOT from a live app
- Fill entire canvas, no blank areas, no white padding
- All text readable, domain-specific data (no Lorem ipsum)
- Fully rendered buttons, inputs, cards, charts with realistic data
- ${isMobile ? "iOS status bar at top (9:41, battery, signal)" : "App window chrome with titlebar"}

NOT: wireframe, sketch, illustration, cartoon, placeholder boxes, abstract art.`;


    // Call Lovable AI Gateway

    // Call Lovable AI Gateway
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

    // Extract image from response — try multiple shapes
    const imageUrl =
      aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
      aiData.choices?.[0]?.message?.content?.find?.((c: { type: string }) => c.type === "image_url")?.image_url?.url ||
      null;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("Nenhuma imagem foi gerada pelo modelo");
    }

    // Parse base64 data
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

    // Upload to Storage using service role
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const sanitized = screen_name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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
      // Fallback: return base64 directly (temporary)
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
