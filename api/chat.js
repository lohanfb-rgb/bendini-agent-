export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  // GET — buscar histórico do motorista
  if (req.method === "GET") {
    const { motorista } = req.query;
    if (!motorista) return res.status(400).json({ error: "Nome obrigatório" });
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/historico_conversa?motorista_nome=eq.${encodeURIComponent(motorista)}&order=created_at.asc&limit=100`,
        {
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const data = await response.json();
      return res.status(200).json(data);
    } catch {
      return res.status(500).json({ error: "Erro ao buscar histórico" });
    }
  }

  // POST — enviar mensagem, salvar e responder
  if (req.method === "POST") {
    const { messages, motorista, model, max_tokens, system } = req.body;
    if (!motorista) return res.status(400).json({ error: "Nome obrigatório" });

    try {
      // Salvar mensagem do usuário
      const lastMsg = messages[messages.length - 1];
      await fetch(`${SUPABASE_URL}/rest/v1/historico_conversa`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ motorista_nome: motorista, role: lastMsg.role, content: lastMsg.content }),
      });

      // Chamar Anthropic
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model, max_tokens, system, messages }),
      });

      const data = await anthropicRes.json();
      const reply = data.content?.[0]?.text || "";

      // Salvar resposta do BEN
      if (reply) {
        await fetch(`${SUPABASE_URL}/rest/v1/historico_conversa`, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ motorista_nome: motorista, role: "assistant", content: reply }),
        });
      }

      return res.status(anthropicRes.status).json(data);
    } catch {
      return res.status(500).json({ error: "Erro ao processar" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
