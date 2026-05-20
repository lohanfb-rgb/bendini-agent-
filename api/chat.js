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

  // GET
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

  // POST
  if (req.method === "POST") {
    const { action } = req.body;

    if (action === "sb_post") {
      try { return res.status(200).json(await sbPost(req.body.table, req.body.body)); }
      catch (e) { return res.status(500).json({ error: e.message }); }
    }

    if (action === "sb_patch") {
      try { await sbPatch(req.body.table, req.body.query, req.body.body); return res.status(200).json({ ok: true }); }
      catch (e) { return res.status(500).json({ error: e.message }); }
    }

    if (action === "sb_delete") {
      try { await sbDelete(req.body.table, req.body.query); return res.status(200).json({ ok: true }); }
      catch (e) { return res.status(500).json({ error: e.message }); }
    }

    // GERAR QUIZ
    if (action === "gerar_quiz") {
      const { regra_id, titulo, conteudo } = req.body;
      try {
        // Truncar conteudo longo para evitar timeout (max 3000 chars)
        const conteudoFinal = (conteudo || "").length > 3000
          ? (conteudo || "").substring(0, 3000) + "..."
          : (conteudo || "");

        const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": AI, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 3000,
            system: `Voce cria questoes de avaliacao para motoristas de transportadora.
Retorne SOMENTE o JSON abaixo, sem nenhum texto antes ou depois, sem markdown:
{"perguntas":[{"pergunta":"...","opcao_a":"...","opcao_b":"...","opcao_c":"...","opcao_d":"...","correta":"a","explicacao":"..."}]}
Gere exatamente 10 perguntas praticas. Varie a posicao da resposta correta entre a, b, c e d.`,
            messages: [{ role: "user", content: `Regra da Bendini - ${titulo}:\n\n${conteudoFinal}\n\nGere 10 perguntas de multipla escolha sobre essa regra.` }]
          })
        });

        const aiData = await aiRes.json();
        const txt = (aiData.content?.[0]?.text || "").trim();

        // Extracao robusta do JSON
        let json;
        try {
          const start = txt.indexOf("{");
          const end = txt.lastIndexOf("}");
          if (start === -1 || end === -1) throw new Error("JSON nao encontrado");
          json = JSON.parse(txt.substring(start, end + 1));
        } catch (parseErr) {
          return res.status(500).json({ error: "IA nao retornou JSON valido. Tente novamente com uma regra menor.", raw: txt.substring(0, 300) });
        }

        if (!json.perguntas || !Array.isArray(json.perguntas) || json.perguntas.length === 0) {
          return res.status(500).json({ error: "IA nao gerou perguntas. Tente novamente." });
        }

        // Criar o quiz
        const quizArr = await sbPost("quizzes", { regra_id, titulo: `Quiz: ${titulo}`, status: "ativo" });
        const quiz = Array.isArray(quizArr) ? quizArr[0] : quizArr;

        // Criar as questoes
        for (let i = 0; i < json.perguntas.length; i++) {
          const p = json.perguntas[i];
          await sbPost("quiz_questoes", {
            quiz_id: quiz.id,
            pergunta: p.pergunta || "",
            opcao_a: p.opcao_a || "",
            opcao_b: p.opcao_b || "",
            opcao_c: p.opcao_c || "",
            opcao_d: p.opcao_d || "",
            correta: (p.correta || "a").toLowerCase().trim(),
            explicacao: p.explicacao || "",
            ordem: i + 1,
          });
        }

        return res.status(200).json({ ok: true, quiz_id: quiz.id, total: json.perguntas.length });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // CHAT IA
    if (action === "ai_chat") {
      const { messages, system, model, max_tokens, motorista } = req.body;
      try {
        const lastMsg = messages[messages.length - 1];
        // Salva texto da mensagem no histórico (extrai texto se for array com imagem)
        const textoHistorico = Array.isArray(lastMsg.content)
          ? (lastMsg.content.find(c => c.type === "text")?.text || "")
          : lastMsg.content;
        await sbPost("historico_conversa", { motorista_nome: motorista, role: lastMsg.role, content: textoHistorico });

        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": AI, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: max_tokens || 1000, system, messages }),
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
