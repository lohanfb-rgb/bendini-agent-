module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const SB_URL = process.env.VITE_SUPABASE_URL;
  const SB_KEY = process.env.VITE_SUPABASE_KEY;
  const AI_KEY = process.env.VITE_ANTHROPIC_API_KEY;

  const sbH = {
    "apikey": SB_KEY,
    "Authorization": `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
  };

  // ── GET /api/chat?action=... ──────────────────────────────
  if (req.method === "GET") {
    const { action, table, query } = req.query;

    if (action === "sb_get") {
      try {
        const r = await fetch(`${SB_URL}/rest/v1/${table}?${query || ""}`, { headers: sbH });
        const d = await r.json();
        return res.status(r.status).json(d);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    return res.status(400).json({ error: "Unknown action" });
  }

  // ── POST /api/chat ────────────────────────────────────────
  if (req.method === "POST") {
    const { action } = req.body;

    // Supabase INSERT
    if (action === "sb_post") {
      const { table, body } = req.body;
      try {
        const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
          method: "POST",
          headers: { ...sbH, "Prefer": "return=minimal" },
          body: JSON.stringify(body),
        });
        return res.status(r.status).json({ ok: r.ok });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Supabase PATCH
    if (action === "sb_patch") {
      const { table, query, body } = req.body;
      try {
        const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
          method: "PATCH",
          headers: { ...sbH, "Prefer": "return=minimal" },
          body: JSON.stringify(body),
        });
        return res.status(r.status).json({ ok: r.ok });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Supabase DELETE
    if (action === "sb_delete") {
      const { table, query } = req.body;
      try {
        const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
          method: "DELETE",
          headers: sbH,
        });
        return res.status(r.status).json({ ok: r.ok });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Anthropic chat
    if (action === "ai_chat") {
      const { messages, system, model, max_tokens, motorista } = req.body;
      try {
        // Salvar mensagem do usuário
        const lastMsg = messages[messages.length - 1];
        await fetch(`${SB_URL}/rest/v1/historico_conversa`, {
          method: "POST",
          headers: { ...sbH, "Prefer": "return=minimal" },
          body: JSON.stringify({ motorista_nome: motorista, role: lastMsg.role, content: lastMsg.content }),
        });

        // Chamar Anthropic
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": AI_KEY, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model, max_tokens, system, messages }),
        });
        const d = await r.json();
        const reply = d.content?.[0]?.text || "";

        // Salvar resposta
        if (reply) {
          await fetch(`${SB_URL}/rest/v1/historico_conversa`, {
            method: "POST",
            headers: { ...sbH, "Prefer": "return=minimal" },
            body: JSON.stringify({ motorista_nome: motorista, role: "assistant", content: reply }),
          });
        }
        return res.status(r.status).json(d);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
