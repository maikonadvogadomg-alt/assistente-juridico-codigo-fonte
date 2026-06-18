// Interceptor de API para modo offline/APK
// Redireciona chamadas /api/ para localStorage + APIs diretas com SSE real

import type { Snippet, CustomAction, Ementa, PromptTemplate, DocTemplate, AiHistory } from "@shared/schema";

// ── Storage helpers ─────────────────────────────────────────────────────────
function ls<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function lsSave(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function uid(): string { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2); }

// ── Responses helpers ───────────────────────────────────────────────────────
function jsonRes(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json" },
  });
}
function emptyOk(): Response { return jsonRes({ ok: true }); }

// ── AI Config (chaves salvas localmente) ────────────────────────────────────
type AiConfig = {
  gemini_api_key: string; openai_api_key: string; perplexity_api_key: string;
  demo_api_key: string; demo_api_url: string; demo_api_model: string; database_url: string;
};
const AI_CONFIG_KEY = "apk_ai_config";
function getAiConfig(): AiConfig {
  return ls(AI_CONFIG_KEY, {
    gemini_api_key: "", openai_api_key: "", perplexity_api_key: "",
    demo_api_key: "", demo_api_url: "", demo_api_model: "", database_url: "",
  });
}

// Auto-detect provider from key prefix
function autoDetectUrl(key: string): { url: string; model: string } | null {
  if (key.startsWith("gsk_")) return { url: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" };
  if (key.startsWith("sk-or-")) return { url: "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini" };
  if (key.startsWith("pplx-")) return { url: "https://api.perplexity.ai", model: "sonar-pro" };
  if (key.startsWith("sk-ant-")) return { url: "https://api.anthropic.com/v1", model: "claude-3-5-sonnet-20241022" };
  if (key.startsWith("xai-")) return { url: "https://api.x.ai/v1", model: "grok-2-latest" };
  if (key.startsWith("sk-") && key.length > 40) return { url: "https://api.openai.com/v1", model: "gpt-4o-mini" };
  return null;
}

// ── SSE streaming direto ao provedor de IA ───────────────────────────────────
// Retorna um Response com Content-Type: text/event-stream
// Compatível com o leitor SSE do legal-assistant.tsx
async function callAiSSE(body: {
  messages?: Array<{ role: string; content: string }>;
  text?: string; input?: string;
  provider?: string; model?: string;
  systemPrompt?: string;
  customKey?: string; customUrl?: string; customModel?: string;
}): Promise<Response> {
  const cfg = getAiConfig();
  const system = body.systemPrompt ||
    "Você é uma assistente jurídica especializada em Direito brasileiro. Produza documentos completos, extensos e prontos para uso imediato. Responda sempre em português.";

  let messages = body.messages || [];
  if (messages.length === 0 && (body.text || body.input)) {
    messages = [{ role: "user", content: body.text || body.input || "" }];
  }

  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      function enqueueContent(text: string) {
        if (cancelled) return;
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify({ content: text })}\n\n`)); } catch {}
      }

      function enqueueError(msg: string) {
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify({ content: msg })}\n\n`)); } catch {}
        try { controller.close(); } catch {}
      }

      async function readOpenAIStream(r: Response) {
        const reader = r.body?.getReader();
        if (!reader) { enqueueError("Sem reader da API."); return; }
        const dec = new TextDecoder();
        let buf = "";
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") continue;
            try {
              const d = JSON.parse(payload);
              const text = d?.choices?.[0]?.delta?.content;
              if (text) enqueueContent(text);
              if (d?.citations) {
                try { controller.enqueue(enc.encode(`data: ${JSON.stringify({ citations: d.citations })}\n\n`)); } catch {}
              }
            } catch {}
          }
        }
      }

      async function callOpenAICompat(apiKey: string, apiUrl: string, model: string) {
        const r = await fetch(`${apiUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: system }, ...messages.map(m => ({ role: m.role, content: m.content }))],
            stream: true,
            max_tokens: 8192,
            temperature: 0.7,
          }),
        });
        if (!r.ok) {
          const errText = await r.text().catch(() => r.statusText);
          enqueueError(`Erro ${r.status}: ${errText.slice(0, 300)}`);
          return;
        }
        await readOpenAIStream(r);
      }

      try {
        // 1. Custom key + URL (demo/OpenRouter/LM Studio/etc)
        const customKey = body.customKey || cfg.demo_api_key;
        const customUrl = body.customUrl || cfg.demo_api_url;
        const customModel = body.customModel || cfg.demo_api_model;

        if (customKey && customUrl) {
          await callOpenAICompat(customKey, customUrl, customModel || body.model || "gpt-4o-mini");
          try { controller.close(); } catch {}
          return;
        }

        // 2. Custom key com URL auto-detectada
        if (customKey && !customUrl) {
          const detected = autoDetectUrl(customKey);
          if (detected) {
            await callOpenAICompat(customKey, detected.url, customModel || body.model || detected.model);
            try { controller.close(); } catch {}
            return;
          }
        }

        // 3. Gemini
        if (cfg.gemini_api_key) {
          const contents = messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          }));
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${cfg.gemini_api_key}&alt=sse`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
              }),
            }
          );
          if (!r.ok) {
            const errText = await r.text().catch(() => r.statusText);
            enqueueError(`Erro Gemini (${r.status}): ${errText.slice(0, 300)}`);
            return;
          }
          const reader = r.body?.getReader();
          if (!reader) { enqueueError("Sem reader Gemini."); return; }
          const dec = new TextDecoder();
          let buf = "";
          while (!cancelled) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() || "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const d = JSON.parse(payload);
                const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) enqueueContent(text);
              } catch {}
            }
          }
          try { controller.close(); } catch {}
          return;
        }

        // 4. OpenAI
        if (cfg.openai_api_key) {
          const detected = autoDetectUrl(cfg.openai_api_key);
          const url = detected?.url || "https://api.openai.com/v1";
          const mdl = body.model || detected?.model || "gpt-4o-mini";
          await callOpenAICompat(cfg.openai_api_key, url, mdl);
          try { controller.close(); } catch {}
          return;
        }

        // 5. Perplexity
        if (cfg.perplexity_api_key) {
          await callOpenAICompat(cfg.perplexity_api_key, "https://api.perplexity.ai", body.model || "sonar-pro");
          try { controller.close(); } catch {}
          return;
        }

        // Nenhuma chave configurada
        enqueueError(
          "⚠️ Nenhuma chave de IA configurada.\n\n" +
          "Acesse Configurações (ícone ⚙️ no menu) e adicione sua chave:\n" +
          "• Google Gemini: gratuito em aistudio.google.com\n" +
          "• OpenAI: platform.openai.com\n" +
          "• Groq (gratuito): console.groq.com\n" +
          "• OpenRouter: openrouter.ai"
        );
      } catch (e) {
        enqueueError(`\n\nErro de conexão: ${String(e)}`);
        try { controller.close(); } catch {}
      }
    },
    cancel() { cancelled = true; }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

// ── AI direto (não-streaming) para uso interno ──────────────────────────────
async function callAiDirect(body: {
  messages?: Array<{ role: string; content: string }>;
  provider?: string; model?: string; systemPrompt?: string;
  text?: string; input?: string;
  forceKey?: string; forceUrl?: string;
}): Promise<{ text: string; error?: string }> {
  const cfg = getAiConfig();
  const system = body.systemPrompt || "Você é um assistente jurídico especializado em direito brasileiro.";
  let messages = body.messages || [];
  if (messages.length === 0 && (body.text || body.input)) {
    messages = [{ role: "user", content: body.text || body.input || "" }];
  }

  // Usa chave forçada (ex: para teste)
  const useKey = body.forceKey || "";
  const useUrl = body.forceUrl || "";

  async function tryOpenAI(apiKey: string, apiUrl: string, model: string): Promise<string> {
    const r = await fetch(`${apiUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model, temperature: 0.7, max_tokens: 512,
        messages: [{ role: "system", content: system }, ...messages.map(m => ({ role: m.role, content: m.content }))],
      }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `HTTP ${r.status}`);
    return d?.choices?.[0]?.message?.content || "";
  }

  async function tryGemini(apiKey: string): Promise<string> {
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      }
    );
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `HTTP ${r.status}`);
    return d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  try {
    // Chave forçada (teste direto)
    if (useKey && useUrl) {
      const text = await tryOpenAI(useKey, useUrl, body.model || "gpt-4o-mini");
      return { text };
    }
    if (useKey) {
      if (useKey.startsWith("AIza")) {
        const text = await tryGemini(useKey);
        return { text };
      }
      const detected = autoDetectUrl(useKey);
      if (detected) {
        const text = await tryOpenAI(useKey, detected.url, body.model || detected.model);
        return { text };
      }
    }

    // Gemini
    if (cfg.gemini_api_key) {
      const text = await tryGemini(cfg.gemini_api_key);
      return { text };
    }
    // OpenAI
    if (cfg.openai_api_key) {
      const detected = autoDetectUrl(cfg.openai_api_key);
      const url = detected?.url || "https://api.openai.com/v1";
      const text = await tryOpenAI(cfg.openai_api_key, url, body.model || detected?.model || "gpt-4o-mini");
      return { text };
    }
    // Demo/custom
    if (cfg.demo_api_key && cfg.demo_api_url) {
      const text = await tryOpenAI(cfg.demo_api_key, cfg.demo_api_url, cfg.demo_api_model || "gpt-4o-mini");
      return { text };
    }
    // Perplexity
    if (cfg.perplexity_api_key) {
      const text = await tryOpenAI(cfg.perplexity_api_key, "https://api.perplexity.ai", "sonar-pro");
      return { text };
    }
    return { text: "", error: "Nenhuma chave configurada." };
  } catch (e: any) {
    return { text: "", error: e?.message || String(e) };
  }
}

// ── Snippets CRUD (localStorage) ─────────────────────────────────────────────
const SNIP_KEY = "apk_snippets";
function getSnippets(): Snippet[] { return ls(SNIP_KEY, []); }
function saveSnippets(s: Snippet[]) { lsSave(SNIP_KEY, s); }

function handleSnippets(url: string, opts: RequestInit | undefined): Response {
  const path = new URL(url, "http://x").pathname;
  const idMatch = path.match(/\/api\/snippets\/([^/]+)/);
  const id = idMatch?.[1];
  const method = opts?.method?.toUpperCase() || "GET";

  if (method === "GET" && !id) return jsonRes(getSnippets());
  if (method === "POST" && !id) {
    const data = JSON.parse((opts?.body as string) || "{}");
    const snip: Snippet = { id: uid(), title: data.title || "Sem título", html: data.html || "", css: data.css || "", js: data.js || "", mode: data.mode || "html" };
    saveSnippets([...getSnippets(), snip]);
    return jsonRes(snip, 201);
  }
  if (method === "PATCH" && id) {
    const data = JSON.parse((opts?.body as string) || "{}");
    const snips = getSnippets().map(s => s.id === id ? { ...s, ...data } : s);
    saveSnippets(snips);
    return jsonRes(snips.find(s => s.id === id) || {});
  }
  if (method === "DELETE" && id) {
    saveSnippets(getSnippets().filter(s => s.id !== id));
    return emptyOk();
  }
  return jsonRes(getSnippets());
}

// ── Custom Actions CRUD ───────────────────────────────────────────────────────
const CA_KEY = "apk_custom_actions";
function getCustomActions(): CustomAction[] { return ls(CA_KEY, []); }
function handleCustomActions(url: string, opts: RequestInit | undefined): Response {
  const path = new URL(url, "http://x").pathname;
  const id = path.match(/\/api\/custom-actions\/([^/]+)/)?.[1];
  const method = opts?.method?.toUpperCase() || "GET";
  let items = getCustomActions();
  if (method === "GET") return jsonRes(items);
  if (method === "POST") {
    const data = JSON.parse((opts?.body as string) || "{}");
    const item: CustomAction = { id: uid(), label: data.label || "", description: data.description || "", prompt: data.prompt || "" };
    lsSave(CA_KEY, [...items, item]);
    return jsonRes(item, 201);
  }
  if (method === "PATCH" && id) {
    const data = JSON.parse((opts?.body as string) || "{}");
    items = items.map(i => i.id === id ? { ...i, ...data } : i);
    lsSave(CA_KEY, items);
    return jsonRes(items.find(i => i.id === id) || {});
  }
  if (method === "DELETE" && id) { lsSave(CA_KEY, items.filter(i => i.id !== id)); return emptyOk(); }
  return jsonRes(items);
}

// ── Ementas CRUD ──────────────────────────────────────────────────────────────
const EM_KEY = "apk_ementas";
function getEmentas(): Ementa[] { return ls(EM_KEY, []); }
function handleEmentas(url: string, opts: RequestInit | undefined): Response {
  const path = new URL(url, "http://x").pathname;
  const id = path.match(/\/api\/ementas\/([^/]+)/)?.[1];
  const method = opts?.method?.toUpperCase() || "GET";
  let items = getEmentas();
  if (method === "GET") return jsonRes(items);
  if (method === "POST") {
    const data = JSON.parse((opts?.body as string) || "{}");
    const item: Ementa = { id: uid(), titulo: data.titulo || "", categoria: data.categoria || "Geral", texto: data.texto || "" };
    lsSave(EM_KEY, [...items, item]);
    return jsonRes(item, 201);
  }
  if (method === "PATCH" && id) {
    const data = JSON.parse((opts?.body as string) || "{}");
    items = items.map(i => i.id === id ? { ...i, ...data } : i);
    lsSave(EM_KEY, items);
    return jsonRes(items.find(i => i.id === id) || {});
  }
  if (method === "DELETE" && id) { lsSave(EM_KEY, items.filter(i => i.id !== id)); return emptyOk(); }
  return jsonRes(items);
}

// ── Prompt Templates CRUD ─────────────────────────────────────────────────────
const PT_KEY = "apk_prompt_templates";
function getPromptTemplates(): PromptTemplate[] { return ls(PT_KEY, []); }
function handlePromptTemplates(url: string, opts: RequestInit | undefined): Response {
  const path = new URL(url, "http://x").pathname;
  const id = path.match(/\/api\/prompt-templates\/([^/]+)/)?.[1];
  const method = opts?.method?.toUpperCase() || "GET";
  let items = getPromptTemplates();
  if (method === "GET") return jsonRes(items);
  if (method === "POST") {
    const data = JSON.parse((opts?.body as string) || "{}");
    const item: PromptTemplate = { id: uid(), titulo: data.titulo || "", categoria: data.categoria || "Geral", texto: data.texto || "" };
    lsSave(PT_KEY, [...items, item]);
    return jsonRes(item, 201);
  }
  if (method === "PATCH" && id) {
    const data = JSON.parse((opts?.body as string) || "{}");
    items = items.map(i => i.id === id ? { ...i, ...data } : i);
    lsSave(PT_KEY, items);
    return jsonRes(items.find(i => i.id === id) || {});
  }
  if (method === "DELETE" && id) { lsSave(PT_KEY, items.filter(i => i.id !== id)); return emptyOk(); }
  return jsonRes(items);
}

// ── Doc Templates CRUD ────────────────────────────────────────────────────────
const DT_KEY = "apk_doc_templates";
function getDocTemplates(): DocTemplate[] { return ls(DT_KEY, []); }
function handleDocTemplates(url: string, opts: RequestInit | undefined): Response {
  const path = new URL(url, "http://x").pathname;
  const id = path.match(/\/api\/doc-templates\/([^/]+)/)?.[1];
  const method = opts?.method?.toUpperCase() || "GET";
  let items = getDocTemplates();
  if (method === "GET") return jsonRes(items);
  if (method === "POST") {
    const data = JSON.parse((opts?.body as string) || "{}");
    const item: DocTemplate = { id: uid(), titulo: data.titulo || "", categoria: data.categoria || "Geral", conteudo: data.conteudo || "", docxBase64: data.docxBase64 || null, docxFilename: data.docxFilename || null };
    lsSave(DT_KEY, [...items, item]);
    return jsonRes(item, 201);
  }
  if (method === "PATCH" && id) {
    const data = JSON.parse((opts?.body as string) || "{}");
    items = items.map(i => i.id === id ? { ...i, ...data } : i);
    lsSave(DT_KEY, items);
    return jsonRes(items.find(i => i.id === id) || {});
  }
  if (method === "DELETE" && id) { lsSave(DT_KEY, items.filter(i => i.id !== id)); return emptyOk(); }
  return jsonRes(items);
}

// ── AI History CRUD ───────────────────────────────────────────────────────────
const AH_KEY = "apk_ai_history";
function getAiHistory(): AiHistory[] { return ls(AH_KEY, []); }
function handleAiHistory(url: string, opts: RequestInit | undefined): Response {
  const path = new URL(url, "http://x").pathname;
  const id = path.match(/\/api\/ai-history\/([^/]+)/)?.[1];
  const method = opts?.method?.toUpperCase() || "GET";
  let items = getAiHistory();
  if (method === "GET") return jsonRes(items);
  if (method === "POST") {
    const data = JSON.parse((opts?.body as string) || "{}");
    const item: AiHistory = { id: uid(), createdAt: new Date(), ...data };
    lsSave(AH_KEY, [item, ...items].slice(0, 200));
    return jsonRes(item, 201);
  }
  if (method === "DELETE" && id) { lsSave(AH_KEY, items.filter(i => i.id !== id)); return emptyOk(); }
  if (method === "DELETE" && !id) { lsSave(AH_KEY, []); return emptyOk(); }
  return jsonRes(items);
}

// ── Processos ─────────────────────────────────────────────────────────────────
const PROC_KEY = "apk_processos";
function handleProcessos(url: string, opts: RequestInit | undefined): Response {
  const path = new URL(url, "http://x").pathname;
  const id = path.match(/\/api\/processos\/([^/]+)/)?.[1];
  const method = opts?.method?.toUpperCase() || "GET";
  let items = ls(PROC_KEY, []);
  if (method === "GET") return jsonRes(items);
  if (method === "POST") {
    const data = JSON.parse((opts?.body as string) || "{}");
    const item = { id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
    lsSave(PROC_KEY, [...items, item]);
    return jsonRes(item, 201);
  }
  if (method === "DELETE" && id) {
    lsSave(PROC_KEY, items.filter((i: { id: string }) => i.id !== id));
    return emptyOk();
  }
  return jsonRes(items);
}

// ── Tramitação CRUD (localStorage) ───────────────────────────────────────────
const TRAM_CLIENTES_KEY = "apk_tram_clientes";
const TRAM_NOTAS_KEY = "apk_tram_notas";
const TRAM_PUBS_KEY = "apk_tram_publicacoes";

function handleTramitacao(url: string, opts: RequestInit | undefined): Response {
  const method = opts?.method?.toUpperCase() || "GET";
  const path = new URL(url, "http://x").pathname;

  // Test connection
  if (url.includes("/test")) {
    return jsonRes({ ok: true, message: "Modo offline ativo. Configure o token para conectar ao Tramitação Inteligente." });
  }

  // Usuários
  if (url.includes("/usuarios")) {
    return jsonRes({ data: [{ id: 1, nome: "Usuário Local", email: "local@juridico.app" }] });
  }

  // Sync publicações
  if (url.includes("/sync-publicacoes")) {
    return jsonRes({ ok: true, message: "Sincronização simulada. Configure o servidor + token para dados reais." });
  }

  // Publicações
  if (url.includes("/publicacoes")) {
    const idMatch = path.match(/\/publicacoes\/([^/]+)\/lida/);
    const pubId = idMatch?.[1];
    if (pubId && method === "PATCH") {
      const data = JSON.parse((opts?.body as string) || "{}");
      const pubs = ls(TRAM_PUBS_KEY, []);
      const updated = pubs.map((p: any) => p.id === pubId ? { ...p, lida: data.lida } : p);
      lsSave(TRAM_PUBS_KEY, updated);
      return jsonRes({ ok: true });
    }
    return jsonRes({ data: ls(TRAM_PUBS_KEY, []), total: 0, page: 1 });
  }

  // Notas
  if (url.includes("/notas")) {
    const idMatch = path.match(/\/notas\/([^/]+)/);
    const id = idMatch?.[1];
    let notas = ls(TRAM_NOTAS_KEY, []);
    if (method === "GET") return jsonRes({ data: notas });
    if (method === "POST") {
      const data = JSON.parse((opts?.body as string) || "{}");
      const nota = { id: uid(), createdAt: new Date().toISOString(), ...data };
      lsSave(TRAM_NOTAS_KEY, [...notas, nota]);
      return jsonRes(nota, 201);
    }
    if (method === "DELETE" && id) {
      lsSave(TRAM_NOTAS_KEY, notas.filter((n: any) => String(n.id) !== id));
      return emptyOk();
    }
    return jsonRes({ data: notas });
  }

  // Clientes
  if (url.includes("/clientes")) {
    const idMatch = path.match(/\/clientes\/([^/]+)/);
    const id = idMatch?.[1];
    let clientes = ls(TRAM_CLIENTES_KEY, []);
    if (method === "GET" && id) {
      const c = clientes.find((c: any) => String(c.id) === id);
      return jsonRes(c || {});
    }
    if (method === "GET") return jsonRes({ data: clientes, total: clientes.length, page: 1 });
    if (method === "POST") {
      const data = JSON.parse((opts?.body as string) || "{}");
      const cliente = { id: uid(), createdAt: new Date().toISOString(), ...data };
      lsSave(TRAM_CLIENTES_KEY, [...clientes, cliente]);
      return jsonRes(cliente, 201);
    }
    if (method === "DELETE" && id) {
      lsSave(TRAM_CLIENTES_KEY, clientes.filter((c: any) => String(c.id) !== id));
      return emptyOk();
    }
    return jsonRes({ data: clientes, total: clientes.length });
  }

  return jsonRes({ data: [], ok: true });
}

// ── DJEN CRUD (localStorage) ──────────────────────────────────────────────────
const DJEN_CLIENTES_KEY = "apk_djen_clientes";
const DJEN_PUBS_KEY = "apk_djen_publicacoes";
const DJEN_EXEC_KEY = "apk_djen_execucoes";
const DJEN_CFG_KEY = "apk_djen_config";

function handleDjen(url: string, opts: RequestInit | undefined): Response {
  const method = opts?.method?.toUpperCase() || "GET";
  const path = new URL(url, "http://x").pathname;

  // Config
  if (url.includes("/config")) {
    if (method === "PUT" || method === "POST") {
      const data = JSON.parse((opts?.body as string) || "{}");
      lsSave(DJEN_CFG_KEY, { ...ls(DJEN_CFG_KEY, {}), ...data });
      return jsonRes({ ok: true });
    }
    return jsonRes(ls(DJEN_CFG_KEY, { apiToken: "", webhookUrl: "", email: "" }));
  }

  // Gerar token
  if (url.includes("/gerar-token")) {
    return jsonRes({ token: "TKN_OFFLINE_" + Date.now(), message: "Token gerado em modo offline (não funcional para integração externa)." });
  }

  // Executar robô
  if (url.includes("/executar")) {
    const execId = uid();
    const execucoes = ls(DJEN_EXEC_KEY, []);
    const exec = { id: execId, status: "concluido", totalPublicacoes: "0", processadas: "0", comErro: "0", ignoradas: "0", log: "Execução em modo offline — sem publicações reais. Configure o servidor e o token DJEN para dados reais.", createdAt: new Date().toISOString() };
    lsSave(DJEN_EXEC_KEY, [exec, ...execucoes].slice(0, 20));
    return jsonRes({
      ok: true,
      sucesso: true,
      execucaoId: execId,
      mensagem: "Modo offline ativo. Configure o servidor + token DJEN para publicações reais.",
      estatisticas: { total: 0, processadas: 0, comErro: 0, ignoradas: 0 },
      log: ["[offline] Execução simulada. Nenhuma publicação real foi processada.", "[offline] Para usar o Robô DJEN com dados reais, ative o servidor e configure o token."],
    });
  }

  // Clientes
  if (url.includes("/clientes")) {
    const idMatch = path.match(/\/clientes\/([^/]+)/);
    const id = idMatch?.[1];
    let clientes = ls(DJEN_CLIENTES_KEY, []);
    if (method === "GET") return jsonRes(clientes);
    if (method === "POST") {
      const data = JSON.parse((opts?.body as string) || "{}");
      const cliente = { id: uid(), createdAt: new Date().toISOString(), ...data };
      lsSave(DJEN_CLIENTES_KEY, [...clientes, cliente]);
      return jsonRes(cliente, 201);
    }
    if (method === "DELETE" && id) {
      lsSave(DJEN_CLIENTES_KEY, clientes.filter((c: any) => c.id !== id));
      return emptyOk();
    }
    return jsonRes(clientes);
  }

  // Publicações
  if (url.includes("/publicacoes")) return jsonRes(ls(DJEN_PUBS_KEY, []));

  return jsonRes({ ok: true, data: [] });
}

// ── AI Usage ─────────────────────────────────────────────────────────────────
function getAiUsage(): Response {
  const history = getAiHistory();
  const totalCost = history.reduce((sum, h) => sum + (h.estimatedCost || 0), 0);
  return jsonRes({ totalCost, creditsRemaining: 999, unlimited: true });
}

// ── Interceptor Principal ──────────────────────────────────────────────────────
export function installOfflineApi() {
  const originalFetch = window.fetch.bind(window);

  // Patch BASE path para que fetch("/api/...") funcione com /juridico/ base
  const _BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url = typeof input === "string" ? input
      : input instanceof URL ? input.href
      : (input as Request).url;
    const opts = init || (input instanceof Request
      ? { method: (input as Request).method, body: (input as Request).body, headers: (input as Request).headers }
      : {});

    // Adiciona base path se necessário
    if (_BASE && url.startsWith("/api/")) {
      url = _BASE + url;
    }

    // Só interceptar chamadas de API relativas (não URLs externas HTTP/HTTPS)
    const isAbsoluteUrl = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//");
    const isApi = !isAbsoluteUrl && url.includes("/api/");
    if (!isApi) return originalFetch(input, init);

    try {
      // ── Auth ──────────────────────────────────────────────────────────────
      if (url.includes("/api/auth/check")) return jsonRes({ authenticated: true, passwordRequired: false });
      if (url.includes("/api/auth/login")) return jsonRes({ ok: true, authenticated: true });
      if (url.includes("/api/auth/logout")) return jsonRes({ ok: true });

      // ── Settings ──────────────────────────────────────────────────────────
      if (url.includes("/api/settings/ai-config")) {
        const method = opts?.method?.toUpperCase() || "GET";
        if (method === "POST" || method === "PUT") {
          const data = JSON.parse((opts?.body as string) || "{}");
          lsSave(AI_CONFIG_KEY, { ...getAiConfig(), ...data });
          return jsonRes({ ok: true });
        }
        return jsonRes(getAiConfig());
      }

      if (url.includes("/api/settings/system-status")) {
        const cfg = getAiConfig();
        return jsonRes({
          dbMode: "memory", hasDbUrl: false,
          hasGeminiKey: !!cfg.gemini_api_key,
          hasOpenAiKey: !!cfg.openai_api_key,
          hasPerplexityKey: !!cfg.perplexity_api_key,
          hasDemoKey: !!cfg.demo_api_key,
          hasAppPassword: false, hasSessionSecret: false,
        });
      }

      if (url.includes("/api/settings/database-status")) {
        return jsonRes({ connected: false, mode: "memory" });
      }

      if (url.includes("/api/settings/database-reconnect")) {
        const data = JSON.parse((opts?.body as string) || "{}");
        if (data.database_url) {
          const cfg = getAiConfig();
          lsSave(AI_CONFIG_KEY, { ...cfg, database_url: data.database_url });
        }
        return jsonRes({ ok: true, message: "URL salva localmente. Conexão com banco requer o servidor ativo." });
      }

      if (url.includes("/api/settings/test-ai-key")) {
        const data = JSON.parse((opts?.body as string) || "{}");
        const testKey = (data.key || "").trim();
        const provider = (data.provider || "gemini") as string;

        if (!testKey) {
          return jsonRes({ ok: false, message: "Insira a chave antes de testar." });
        }

        try {
          let forceUrl = "";
          if (provider === "openai" || (testKey.startsWith("sk-") && !testKey.startsWith("sk-ant-") && !testKey.startsWith("sk-or-"))) {
            forceUrl = "https://api.openai.com/v1";
          }
          const detected = autoDetectUrl(testKey);
          if (detected) forceUrl = detected.url;

          const result = await callAiDirect({
            messages: [{ role: "user", content: "Responda apenas: OK" }],
            forceKey: testKey,
            forceUrl: forceUrl || (testKey.startsWith("AIza") ? "" : forceUrl),
          });

          if (result.error) {
            const friendly = result.error.includes("API_KEY_INVALID") || result.error.includes("invalid")
              ? "Chave inválida — verifique se copiou corretamente."
              : result.error.includes("quota") || result.error.includes("429")
              ? "Limite atingido — aguarde alguns minutos."
              : result.error.includes("PERMISSION_DENIED")
              ? "Sem permissão — ative a API no painel do provedor."
              : result.error.slice(0, 200);
            return jsonRes({ ok: false, message: friendly });
          }
          return jsonRes({ ok: true, message: `Chave funcionando! Resposta: "${result.text.trim().slice(0, 50)}"` });
        } catch (e: any) {
          return jsonRes({ ok: false, message: e?.message || String(e) });
        }
      }

      if (url.includes("/api/settings/tramitacao_token")) {
        if ((opts?.method?.toUpperCase() || "GET") === "PUT") {
          const data = JSON.parse((opts?.body as string) || "{}");
          lsSave("apk_tramitacao_token", data.value || "");
          return jsonRes({ ok: true });
        }
        return jsonRes({ key: "tramitacao_token", value: ls("apk_tramitacao_token", "") });
      }

      if (url.includes("/api/settings/")) {
        return jsonRes({ ok: true });
      }

      // ── Demo key ──────────────────────────────────────────────────────────
      if (url.includes("/api/demo-key")) return jsonRes({ available: false, configured: false });

      // ── AI Usage ──────────────────────────────────────────────────────────
      if (url.includes("/api/ai-usage")) return getAiUsage();

      // ── AI Process / Refine / Chat — SSE STREAMING ────────────────────────
      if (url.includes("/api/ai/process") || url.includes("/api/ai/refine") ||
          url.includes("/api/ai/chat") || url.includes("/api/ai/")) {
        let bodyData: any = {};
        try {
          const rawBody = opts?.body;
          if (rawBody instanceof FormData) {
            // Não é JSON, ignora
          } else {
            bodyData = JSON.parse((rawBody as string) || "{}");
          }
        } catch {}
        return callAiSSE({
          messages: bodyData.messages || (bodyData.text ? [{ role: "user", content: bodyData.text }] : bodyData.input ? [{ role: "user", content: bodyData.input }] : []),
          text: bodyData.text,
          input: bodyData.input,
          provider: bodyData.provider,
          model: bodyData.model,
          systemPrompt: bodyData.systemPrompt,
          customKey: bodyData.customKey,
          customUrl: bodyData.customUrl,
          customModel: bodyData.customModel,
        });
      }

      // ── Code Assistant (SSE) ──────────────────────────────────────────────
      if (url.includes("/api/code-assistant")) {
        let bodyData: any = {};
        try { bodyData = JSON.parse((opts?.body as string) || "{}"); } catch {}
        return callAiSSE({
          messages: [{ role: "user", content: bodyData.input || bodyData.code || "" }],
          systemPrompt: "Você é um assistente de código especializado. Analise, corrija ou explique o código fornecido em português.",
        });
      }

      // ── Code Run (Python/JS) ──────────────────────────────────────────────
      if (url.includes("/api/code/run")) {
        let bodyData: any = {};
        try { bodyData = JSON.parse((opts?.body as string) || "{}"); } catch {}
        const code = bodyData.code || "";
        const language = bodyData.language || "python";
        if (!code.trim()) return jsonRes({ output: "", error: "" });

        const result = await callAiDirect({
          messages: [{
            role: "user",
            content: `Execute mentalmente este código ${language} e retorne APENAS a saída que print() produziria, sem explicações, sem markdown:\n\n${code}`
          }],
          systemPrompt: `Você é um interpretador de ${language}. Execute o código e retorne somente o output de print() ou console.log(), exatamente como apareceria no terminal. Se houver erro de sintaxe, retorne "Erro: " seguido da mensagem de erro.`,
        });
        return jsonRes({
          output: result.error ? "" : result.text,
          error: result.error || "",
        });
      }

      // ── Snippets ─────────────────────────────────────────────────────────
      if (url.includes("/api/snippets")) return handleSnippets(url, opts);

      // ── Custom Actions ───────────────────────────────────────────────────
      if (url.includes("/api/custom-actions")) return handleCustomActions(url, opts);

      // ── Ementas ──────────────────────────────────────────────────────────
      if (url.includes("/api/ementas")) return handleEmentas(url, opts);

      // ── Prompt Templates ─────────────────────────────────────────────────
      if (url.includes("/api/prompt-templates")) return handlePromptTemplates(url, opts);

      // ── Doc Templates ────────────────────────────────────────────────────
      if (url.includes("/api/doc-templates")) {
        // Upload DOCX — retorna erro amigável
        if (url.includes("/upload-docx") || url.includes("/upload")) {
          return jsonRes({ ok: false, message: "Upload de DOCX requer o servidor ativo. Use o editor de texto para colar o conteúdo." }, 200);
        }
        return handleDocTemplates(url, opts);
      }

      // ── AI History ───────────────────────────────────────────────────────
      if (url.includes("/api/ai-history")) return handleAiHistory(url, opts);

      // ── Processos ────────────────────────────────────────────────────────
      if (url.includes("/api/processos")) return handleProcessos(url, opts);

      // ── JWT / Token ──────────────────────────────────────────────────────
      if (url.includes("/api/jwt/status")) {
        return jsonRes({ configured: false, hasPem: false, message: "Modo offline: token JWT requer servidor ativo com certificado PEM." });
      }
      if (url.includes("/api/jwt")) {
        return jsonRes({ ok: false, token: null, message: "Geração de token JWT requer o servidor ativo com certificado PEM configurado." }, 200);
      }
      if (url.includes("/api/token")) {
        return jsonRes({ ok: false, token: null, message: "Geração de token requer o servidor ativo." }, 200);
      }

      // ── Upload / Extract Text ────────────────────────────────────────────
      if (url.includes("/api/upload/extract-text")) {
        return jsonRes({
          text: "",
          message: "Extração de texto de PDF usa processamento local — use o botão de upload na página diretamente.",
        }, 200);
      }

      if (url.includes("/api/upload/transcribe")) {
        return jsonRes({ text: "", message: "Transcrição de áudio requer o servidor ativo." }, 200);
      }

      // ── Import URL ──────────────────────────────────────────────────────
      if (url.includes("/api/import/url")) {
        return jsonRes({ content: "", message: "Import via URL requer o servidor ativo." });
      }

      // ── Jurisprudência ──────────────────────────────────────────────────
      if (url.includes("/api/jurisprudencia")) {
        let bodyData: any = {};
        try { bodyData = JSON.parse((opts?.body as string) || "{}"); } catch {}
        if (bodyData.query || bodyData.termo) {
          const result = await callAiDirect({
            messages: [{ role: "user", content: `Pesquise jurisprudência sobre: ${bodyData.query || bodyData.termo}` }],
            systemPrompt: "Você é um especialista em jurisprudência brasileira. Forneça as principais decisões e entendimentos jurisprudenciais sobre o tema solicitado.",
          });
          return jsonRes({ results: [{ titulo: "Jurisprudência IA", conteudo: result.text, fonte: "IA" }], total: 1 });
        }
        return jsonRes({ results: [], message: "Informe um termo para pesquisar." });
      }

      // ── Previdenciário ──────────────────────────────────────────────────
      if (url.includes("/api/previdenciario")) {
        let bodyData: any = {};
        try { bodyData = JSON.parse((opts?.body as string) || "{}"); } catch {}
        const result = await callAiDirect({
          messages: [{ role: "user", content: `Analise os dados previdenciários: ${bodyData.texto || bodyData.text || ""}` }],
          systemPrompt: "Você é especialista em direito previdenciário brasileiro. Analise os dados e forneça informações relevantes.",
        });
        return jsonRes({ resultado: result.text, error: result.error });
      }

      // ── Tramitação ──────────────────────────────────────────────────────
      if (url.includes("/api/tramitacao")) return handleTramitacao(url, opts);

      // ── DJEN / Publicações ──────────────────────────────────────────────
      if (url.includes("/api/djen")) return handleDjen(url, opts);
      if (url.includes("/api/publicacoes")) {
        return jsonRes({ ok: false, publicacoes: [], message: "Monitoramento de publicações requer o servidor ativo." });
      }

      // ── Pesquisa OAB / Processo ──────────────────────────────────────────
      if (url.includes("/api/pesquisa/oab") || url.includes("/api/pesquisa/processo")) {
        let bodyData: any = {};
        try { bodyData = JSON.parse((opts?.body as string) || "{}"); } catch {}
        const urlObj = new URL(url, "http://x");
        const query = urlObj.searchParams.get("q") || urlObj.searchParams.get("numero") || urlObj.searchParams.get("oab") || bodyData.q || bodyData.numero || "";
        if (query) {
          const result = await callAiDirect({
            messages: [{ role: "user", content: `Pesquise informações sobre: ${query}` }],
            systemPrompt: "Você é um assistente jurídico. Forneça informações relevantes sobre o advogado ou processo solicitado. Se não tiver dados reais, informe que a consulta requer conexão com os sistemas oficiais.",
          });
          return jsonRes({ resultado: result.text, fonte: "IA (offline)", aviso: "Dados simulados — consulta real requer servidor ativo." });
        }
        return jsonRes({ resultado: "", message: "Informe os dados para pesquisa. Consulta real requer servidor ativo." });
      }

      // ── DataJud / PDPJ / CNJ ─────────────────────────────────────────────
      if (url.includes("/api/pdpj")) {
        if (url.includes("/status")) return jsonRes({ configured: false, mode: "offline", message: "PDPJ requer certificado PEM e servidor ativo." });
        if (url.includes("/test-connection")) return jsonRes({ ok: false, error: "PDPJ/PJUD requer certificado digital PEM e servidor ativo. No modo offline/APK esta funcionalidade não está disponível." });
        return jsonRes({ ok: false, data: null, comunicacoes: [], representados: [], message: "PDPJ requer servidor ativo e certificado PEM configurado.", totalElements: 0 });
      }
      if (url.includes("/api/datajud") || url.includes("/api/cnj") || url.includes("/api/comunicacoes")) {
        return jsonRes({ error: "API externa não disponível sem servidor.", data: null, processos: [], totalElements: 0 });
      }

      // ── Export Word ──────────────────────────────────────────────────────
      if (url.includes("/api/export/")) {
        return jsonRes({ error: "Exportação Word requer o servidor ativo. Use Ctrl+A, Ctrl+C para copiar o texto e cole no Word." }, 501);
      }

      // ── TTS / Voice ──────────────────────────────────────────────────────
      // Retorna 200 sem áudio → frontend detecta "não é audio" e usa SpeechSynthesis do navegador
      if (url.includes("/api/tts")) {
        return jsonRes({ offline: true, message: "Modo offline: usando síntese de voz do navegador." });
      }
      if (url.includes("/api/voice-chat")) {
        // Resposta mínima para voice-chat offline — frontend faz fallback via speakText/SpeechSynthesis
        return jsonRes({ offline: true, text: "", message: "Voice chat em modo offline não disponível." });
      }
      if (url.includes("/api/voice")) {
        return jsonRes({ offline: true, message: "Modo offline: usando síntese de voz do navegador." });
      }

      // ── Git push ─────────────────────────────────────────────────────────
      if (url.includes("/api/git-push")) {
        return jsonRes({ ok: false, message: "Git push requer o servidor ativo." });
      }

      // ── Fallback ─────────────────────────────────────────────────────────
      console.warn("[offline-api] Endpoint não mapeado:", url);
      return jsonRes([]);

    } catch (err) {
      console.error("[offline-api] Erro:", err);
      return jsonRes({ error: String(err) }, 500);
    }
  };
}
