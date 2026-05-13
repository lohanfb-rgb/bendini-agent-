module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const SB  = process.env.VITE_SUPABASE_URL;
  const KEY = process.env.VITE_SUPABASE_KEY;
  const AI  = process.env.VITE_ANTHROPIC_API_KEY;

  const H = { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" };

  const sbGet = async (table, query = "") => {
    const decodedQuery = decodeURIComponent(query);
    const r = await fetch(`${SB}/rest/v1/${table}?${decodedQuery}`, { headers: H });
    return r.json();
  };
  const sbPost = async (table, body) => {
    const r = await fetch(`${SB}/rest/v1/${table}`, {
      method: "POST", headers: { ...H, "Prefer": "return=representation" },
      body: JSON.stringify(body),
    });
    return r.json();
  };
  const sbPatch = async (table, query, body) => {
    await fetch(`${SB}/rest/v1/${table}?${query}`, {
      method: "PATCH", headers: { ...H, "Prefer": "return=minimal" },
      body: JSON.stringify(body),
    });
  };
  const sbDelete = async (table, query) => {
    await fetch(`${SB}/rest/v1/${table}?${query}`, { method: "DELETE", headers: H });
  };

  // ── GET ──────────────────────────────────────────────────
  if (req.method === "GET") {
    const { action, table, query } = req.query;
    if (action === "sb_get") {
      try {
        const d = await sbGet(table, query || "");
        return res.status(200).json(d);
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }
    return res.status(400).json({ error: "Unknown action" });
  }

  // ── POST ─────────────────────────────────────────────────
  if (req.method === "POST") {
    const { action } = req.body;

    if (action === "sb_post") {
      try {
        const d = await sbPost(req.body.table, req.body.body);
        return res.status(200).json(d);
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }

    if (action === "sb_patch") {
      try {
        await sbPatch(req.body.table, req.body.query, req.body.body);
        return res.status(200).json({ ok: true });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }

    if (action === "sb_delete") {
      try {
        await sbDelete(req.body.table, req.body.query);
        return res.status(200).json({ ok: true });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }

    // ── Gerar Quiz com IA ────────────────────────────────
    if (action === "gerar_quiz") {
      const { regra_id, titulo, conteudo } = req.body;
      try {
        const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": AI, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2000,
            system: `Você é um especialista em criar questões de avaliação para motoristas de transportadora.
Crie exatamente 10 perguntas de múltipla escolha sobre a regra fornecida.
Retorne APENAS um JSON válido, sem texto antes ou depois, no formato:
{
  "perguntas": [
    {
      "pergunta": "texto da pergunta",
      "opcao_a": "opção A",
      "opcao_b": "opção B", 
      "opcao_c": "opção C",
      "opcao_d": "opção D",
      "correta": "a" ou "b" ou "c" ou "d",
      "explicacao": "explicação curta da resposta correta"
    }
  ]
}
As perguntas devem ser práticas e diretas. Varie as posições da resposta correta.`,
            messages: [{ role: "user", content: `Crie 10 perguntas sobre esta regra da Bendini Logística:\n\nTÍTULO: ${titulo}\n\nCONTEÚDO: ${conteudo}` }]
          })
        });

        const aiData = await aiRes.json();
        const txt = aiData.content?.[0]?.text || "";
        const json = JSON.parse(txt.replace(/```json|```/g, "").trim());

        // Criar o quiz
        const quizArr = await sbPost("quizzes", { regra_id, titulo: `Quiz: ${titulo}`, status: "ativo" });
        const quiz = Array.isArray(quizArr) ? quizArr[0] : quizArr;

        // Criar as questões
        for (let i = 0; i < json.perguntas.length; i++) {
          const p = json.perguntas[i];
          await sbPost("quiz_questoes", {
            quiz_id: quiz.id,
            pergunta: p.pergunta,
            opcao_a: p.opcao_a,
            opcao_b: p.opcao_b,
            opcao_c: p.opcao_c,
            opcao_d: p.opcao_d,
            correta: p.correta,
            explicacao: p.explicacao,
            ordem: i + 1,
          });
        }

        return res.status(200).json({ ok: true, quiz_id: quiz.id, total: json.perguntas.length });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // ── Chat IA ──────────────────────────────────────────
    if (action === "ai_chat") {
      const { messages, system, model, max_tokens, motorista } = req.body;
      try {
        const lastMsg = messages[messages.length - 1];
        await sbPost("historico_conversa", { motorista_nome: motorista, role: lastMsg.role, content: lastMsg.content });

        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": AI, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model, max_tokens, system, messages }),
        });
        const d = await r.json();
        const reply = d.content?.[0]?.text || "";

        if (reply) {
          await sbPost("historico_conversa", { motorista_nome: motorista, role: "assistant", content: reply });
        }
        return res.status(r.status).json(d);
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
