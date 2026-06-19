import { useState, useRef, useEffect } from "react";

const ADM_SENHA = "Bendini@2026";

const api = async (action, params = {}) => {
  if (action === "sb_get") {
    const r = await fetch(`/api/chat?action=sb_get&table=${params.table}&query=${encodeURIComponent(params.query || "")}`);
    return r.json();
  }
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  return r.json();
};

const sb = {
  get:    (table, query = "")      => api("sb_get",    { table, query }),
  post:   (table, body)            => api("sb_post",   { table, body }),
  patch:  (table, query, body)     => api("sb_patch",  { table, query, body }),
  delete: (table, query)           => api("sb_delete", { table, query }),
};

const C = {
  BG:"#0e1a2b", NAV:"#091520", CARD:"#13223a", CARD2:"#182d4a",
  BORDER:"#1c3050", BORDER2:"#254070", RED:"#c0392b",
  WHITE:"#ffffff", TEXT:"#d8e8f5", MUTED:"#5c7d9e", MUTED2:"#3a5a7a", GREEN:"#2ecc71",
  YELLOW:"#f39c12",
};

const fmt = (txt) => String(txt || "").split("\n").map((l, i) => {
  const b = l.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  return <p key={i} dangerouslySetInnerHTML={{ __html: b }} style={{ margin: "1px 0", lineHeight: 1.65 }} />;
});

const formatCPF = (v) => {
  const n = v.replace(/\D/g, "").slice(0, 11);
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
          .replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
          .replace(/(\d{3})(\d{3})/, "$1.$2")
          .replace(/(\d{3})/, "$1");
};
const cleanCPF = (v) => v.replace(/\D/g, "");

// ══════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════
function LoginScreen({ onLogin, onAdm }) {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [admMode, setAdmMode] = useState(false);
  const [senha, setSenha] = useState("");

  const entrar = async () => {
    const c = cleanCPF(cpf);
    if (c.length !== 11) { setErro("Digite um CPF válido com 11 dígitos."); return; }
    setLoading(true); setErro("");
    try {
      // Verifica motoristas e mecânicos simultaneamente
      const [motorista, mecanico, programador] = await Promise.all([
        sb.get("motoristas", `cpf=eq.${c}&ativo=eq.true`),
        sb.get("mecanicos", `cpf=eq.${c}&ativo=eq.true`),
        sb.get("programadores", `cpf=eq.${c}&ativo=eq.true`),
      ]);
      const isMotorista   = Array.isArray(motorista)   && motorista.length   > 0;
      const isMecanico    = Array.isArray(mecanico)    && mecanico.length    > 0;
      const isProgramador = Array.isArray(programador) && programador.length > 0;
      if (!isMotorista && !isMecanico && !isProgramador) {
        setErro("CPF não encontrado ou inativo. Fale com seu gestor.");
      } else {
        const nome = isMotorista ? motorista[0].nome : isMecanico ? mecanico[0].nome : programador[0].nome;
        // Auto-perfil se só tem um perfil
        let perfilAuto = null;
        if (!isMotorista && !isMecanico && isProgramador) perfilAuto = "programador";
        if (!isMotorista && isMecanico && !isProgramador) perfilAuto = "oficina";
        onLogin({ cpf: c, nome, perfilAuto });
      }
    } catch { setErro("Erro de conexão. Tente novamente."); }
    setLoading(false);
  };

  const entrarAdm = () => {
    if (senha === ADM_SENHA) onAdm();
    else setErro("Senha incorreta.");
  };

  return (
    <div style={{ minHeight:"100vh", background:C.BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow','Segoe UI',sans-serif", padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:48 }}>
        <div style={{ width:3, height:40, background:C.RED }} />
        <div>
          <div style={{ fontSize:24, fontWeight:900, letterSpacing:2, color:C.WHITE, textTransform:"uppercase" }}>Bendini</div>
          <div style={{ fontSize:9, letterSpacing:3.5, color:C.MUTED, textTransform:"uppercase", marginTop:2, fontWeight:600 }}>Operador Logístico</div>
        </div>
      </div>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"36px 32px", width:"100%", maxWidth:400 }}>
        {!admMode ? (
          <>
            <div style={{ fontSize:10, color:C.RED, letterSpacing:2.5, fontWeight:900, textTransform:"uppercase", marginBottom:10 }}>Acesso ao Agente BEN</div>
            <div style={{ fontSize:22, fontWeight:900, color:C.WHITE, marginBottom:6 }}>Olá, Gestor!</div>
            <div style={{ fontSize:13, color:C.MUTED, marginBottom:28, lineHeight:1.6 }}>Digite seu CPF para acessar o assistente e carregar seu histórico.</div>
            <div style={{ fontSize:9, color:C.MUTED, letterSpacing:2, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>CPF</div>
            <input value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} onKeyDown={e => e.key==="Enter" && entrar()} placeholder="000.000.000-00" autoFocus
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"12px 14px", color:C.WHITE, fontSize:16, outline:"none", fontFamily:"inherit", marginBottom:8, letterSpacing:2 }} />
            {erro && <div style={{ fontSize:12, color:C.RED, marginBottom:8 }}>{erro}</div>}
            <button onClick={entrar} disabled={loading} style={{ width:"100%", padding:"13px", background:loading?C.CARD2:C.RED, border:"none", borderRadius:2, color:C.WHITE, fontWeight:900, cursor:loading?"not-allowed":"pointer", fontSize:11, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit", marginTop:8 }}>
              {loading?"Verificando...":"Acessar →"}
            </button>
            <button onClick={() => { setAdmMode(true); setErro(""); }} style={{ width:"100%", padding:"10px", background:"none", border:`1px solid ${C.BORDER}`, borderRadius:2, color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", fontFamily:"inherit", marginTop:10 }}>
              Acesso ADM
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize:10, color:C.RED, letterSpacing:2.5, fontWeight:900, textTransform:"uppercase", marginBottom:10 }}>Painel Administrativo</div>
            <div style={{ fontSize:22, fontWeight:900, color:C.WHITE, marginBottom:20 }}>Acesso ADM</div>
            <div style={{ fontSize:9, color:C.MUTED, letterSpacing:2, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>Senha</div>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key==="Enter" && entrarAdm()} placeholder="••••••••••" autoFocus
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"12px 14px", color:C.WHITE, fontSize:15, outline:"none", fontFamily:"inherit", marginBottom:8 }} />
            {erro && <div style={{ fontSize:12, color:C.RED, marginBottom:8 }}>{erro}</div>}
            <button onClick={entrarAdm} style={{ width:"100%", padding:"13px", background:C.RED, border:"none", borderRadius:2, color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:11, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit", marginTop:8 }}>Entrar →</button>
            <button onClick={() => { setAdmMode(false); setErro(""); setSenha(""); }} style={{ width:"100%", padding:"10px", background:"none", border:`1px solid ${C.BORDER}`, borderRadius:2, color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", fontFamily:"inherit", marginTop:10 }}>← Voltar</button>
          </>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}input::placeholder{color:#3a5a7a}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════
// PAINEL ADM
// ══════════════════════════════════════════════════
function PainelAdm({ onSair }) {
  const [aba, setAba] = useState("motoristas");
  const [motoristas, setMotoristas] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [regras, setRegras] = useState([]);
  const [novoCpf, setNovoCpf] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novaRegra, setNovaRegra] = useState({ titulo:"", conteudo:"" });
  const [editandoRegra, setEditandoRegra] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [msg, setMsg] = useState("");
  const [quizDetalhe, setQuizDetalhe] = useState(null);
  const [quizView, setQuizView] = useState("respostas"); // "respostas" | "questoes"
  const [tentativas, setTentativas] = useState([]);
  const [motoristasList, setMotoristasList] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [editandoQuestao, setEditandoQuestao] = useState(null); // null | questao obj
  const [novaQuestao, setNovaQuestao] = useState({ pergunta:"", opcao_a:"", opcao_b:"", opcao_c:"", opcao_d:"", correta:"a", explicacao:"" });
  const [addingQuestao, setAddingQuestao] = useState(false);
  const [iMsgs, setIMsgs] = useState([{ role:"assistant", content:"Olá! Sou seu assistente de inteligência. Pode me perguntar sobre motoristas, quizzes e resultados.\n\nExemplos:\n— Quais motoristas não responderam o quiz de velocidades?\n— Qual a média geral dos quizzes?\n— Quem tirou menos de 60%?\n— Quais perguntas o motorista X errou?" }]);
  const [iInput, setIInput] = useState("");
  const [iLoading, setILoading] = useState(false);
  const iEndRef = useRef(null);

  const showMsg = (m, cor = C.GREEN) => { setMsg({ text: m, cor }); setTimeout(() => setMsg(""), 4000); };

  useEffect(() => { carregar(); }, [aba]);
  useEffect(() => { iEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [iMsgs]);

  const carregar = async () => {
    setLoading(true);
    try {
      if (aba === "motoristas") {
        const d = await sb.get("motoristas", "order=nome.asc");
        setMotoristas(Array.isArray(d) ? d : []);
      } else if (aba === "quizzes") {
        const d = await sb.get("quizzes", "order=created_at.desc");
        setQuizzes(Array.isArray(d) ? d : []);
        const m = await sb.get("motoristas", "ativo=eq.true&order=nome.asc");
        setMotoristasList(Array.isArray(m) ? m : []);
      } else if (aba === "regras") {
        const d = await sb.get("regras", "order=ordem.asc");
        setRegras(Array.isArray(d) ? d : []);
      }
    } catch {}
    setLoading(false);
  };

  const adicionarMotorista = async () => {
    const c = cleanCPF(novoCpf);
    if (c.length !== 11 || !novoNome.trim()) { showMsg("Preencha CPF e nome.", C.RED); return; }
    try {
      await sb.post("motoristas", { cpf: c, nome: novoNome.trim() });
      setNovoCpf(""); setNovoNome("");
      showMsg("Motorista cadastrado!");
      carregar();
    } catch { showMsg("Erro ao cadastrar.", C.RED); }
  };

  const toggleMotorista = async (id, ativo) => {
    await sb.patch("motoristas", `id=eq.${id}`, { ativo: !ativo });
    carregar();
  };

  const salvarRegra = async () => {
    if (!novaRegra.titulo.trim() || !novaRegra.conteudo.trim()) { showMsg("Preencha título e conteúdo.", C.RED); return; }
    try {
      if (editandoRegra) {
        await sb.patch("regras", `id=eq.${editandoRegra}`, { titulo: novaRegra.titulo, conteudo: novaRegra.conteudo, updated_at: new Date().toISOString() });
        setEditandoRegra(null);
        showMsg("Regra atualizada!");
      } else {
        const result = await sb.post("regras", { titulo: novaRegra.titulo, conteudo: novaRegra.conteudo, ordem: regras.length, ativo: true });
        const regra = Array.isArray(result) ? result[0] : result;
        showMsg("Regra salva! Gerando quiz com IA...", C.YELLOW);
        setGerando(true);
        try {
          const qr = await api("gerar_quiz", { regra_id: regra.id, titulo: novaRegra.titulo, conteudo: novaRegra.conteudo });
          if (qr.ok) showMsg(`Quiz gerado com ${qr.total} perguntas! ✓`);
          else showMsg("Regra salva, mas erro ao gerar quiz.", C.YELLOW);
        } catch { showMsg("Regra salva, mas erro ao gerar quiz.", C.YELLOW); }
        setGerando(false);
      }
      setNovaRegra({ titulo:"", conteudo:"" });
      carregar();
    } catch { showMsg("Erro ao salvar.", C.RED); }
  };

  const excluirRegra = async (id) => {
    await sb.delete("regras", `id=eq.${id}`);
    showMsg("Regra excluída.");
    carregar();
  };

  const verDetalheQuiz = async (quiz) => {
    setQuizDetalhe(quiz);
    setQuizView("respostas");
    setEditandoQuestao(null);
    setAddingQuestao(false);
    const [t, q] = await Promise.all([
      sb.get("quiz_tentativas", `quiz_id=eq.${quiz.id}&order=created_at.desc`),
      sb.get("quiz_questoes", `quiz_id=eq.${quiz.id}&order=ordem.asc`),
    ]);
    setTentativas(Array.isArray(t) ? t : []);
    setQuestoes(Array.isArray(q) ? q : []);
  };

  const salvarQuestao = async () => {
    const dados = editandoQuestao || novaQuestao;
    if (!dados.pergunta.trim()) { showMsg("Digite a pergunta.", C.RED); return; }
    try {
      if (editandoQuestao) {
        await sb.patch("quiz_questoes", `id=eq.${editandoQuestao.id}`, {
          pergunta: editandoQuestao.pergunta, opcao_a: editandoQuestao.opcao_a,
          opcao_b: editandoQuestao.opcao_b, opcao_c: editandoQuestao.opcao_c,
          opcao_d: editandoQuestao.opcao_d, correta: editandoQuestao.correta,
          explicacao: editandoQuestao.explicacao,
        });
        showMsg("Questão atualizada!");
        setEditandoQuestao(null);
      } else {
        await sb.post("quiz_questoes", {
          quiz_id: quizDetalhe.id, pergunta: novaQuestao.pergunta,
          opcao_a: novaQuestao.opcao_a, opcao_b: novaQuestao.opcao_b,
          opcao_c: novaQuestao.opcao_c, opcao_d: novaQuestao.opcao_d,
          correta: novaQuestao.correta, explicacao: novaQuestao.explicacao,
          ordem: questoes.length + 1,
        });
        showMsg("Questão adicionada!");
        setNovaQuestao({ pergunta:"", opcao_a:"", opcao_b:"", opcao_c:"", opcao_d:"", correta:"a", explicacao:"" });
        setAddingQuestao(false);
      }
      const q2 = await sb.get("quiz_questoes", `quiz_id=eq.${quizDetalhe.id}&order=ordem.asc`);
      setQuestoes(Array.isArray(q2) ? q2 : []);
    } catch { showMsg("Erro ao salvar questão.", C.RED); }
  };

  const excluirQuestao = async (id) => {
    if (!window.confirm("Excluir esta questão?")) return;
    await sb.delete("quiz_questoes", `id=eq.${id}`);
    showMsg("Questão excluída.");
    const q = await sb.get("quiz_questoes", `quiz_id=eq.${quizDetalhe.id}&order=ordem.asc`);
    setQuestoes(Array.isArray(q) ? q : []);
  };

  const ABAS = [
    { id:"motoristas",   label:"Motoristas" },
    { id:"quizzes",      label:"Quizzes" },
    { id:"regras",       label:"Regras" },
    { id:"oficina",      label:"🔧 Oficina" },
    { id:"prog",         label:"📋 Prog" },
    { id:"onboarding",   label:"🎓 Onboarding" },
    { id:"inteligencia", label:"Inteligência IA" },
  ];

  // ── PATCH 1: sendInteligencia atualizado com quiz_respostas ──
  const sendInteligencia = async () => {
    if (!iInput.trim() || iLoading) return;
    const pergunta = iInput.trim();
    setIInput("");
    setIMsgs(p => [...p, { role:"user", content: pergunta }]);
    setILoading(true);
    try {
      const [mots, quizList, tentList, respostasList] = await Promise.all([
        sb.get("motoristas", "order=nome.asc"),
        sb.get("quizzes", "order=titulo.asc"),
        sb.get("quiz_tentativas", "order=created_at.desc&limit=500"),
        sb.get("quiz_respostas", "order=created_at.desc&limit=2000"),
      ]);

      const motoristasData  = Array.isArray(mots)          ? mots          : [];
      const quizzesData     = Array.isArray(quizList)       ? quizList       : [];
      const tentativasData  = Array.isArray(tentList)       ? tentList       : [];
      const respostasData   = Array.isArray(respostasList)  ? respostasList  : [];

      // Resumo de motoristas
      const resumoMotoristas = motoristasData
        .map(m => `${m.nome} (CPF: ${m.cpf}, ${m.ativo ? "ativo" : "inativo"})`)
        .join("\n");

      // Resumo de quizzes
      const resumoQuizzes = quizzesData.map(q => {
        const tents = tentativasData.filter(t => t.quiz_id === q.id);
        const responderam = [...new Set(tents.map(t => t.motorista_cpf))];
        const ativos = motoristasData.filter(m => m.ativo);
        const naoResponderam = ativos.filter(m => !responderam.includes(m.cpf));
        const media = tents.length > 0
          ? (tents.reduce((s, t) => s + Number(t.percentual), 0) / tents.length).toFixed(1)
          : "0";
        return `Quiz: ${q.titulo}\n  Responderam: ${responderam.length} | Média: ${media}%\n  Pendentes: ${naoResponderam.map(m => m.nome).join(", ") || "nenhum"}`;
      }).join("\n\n");

      // Últimas tentativas
      const resumoTentativas = tentativasData.slice(0, 100).map(t =>
        `${t.motorista_nome} | Quiz: ${quizzesData.find(q => q.id === t.quiz_id)?.titulo || "?"} | Nota: ${Number(t.percentual).toFixed(0)}% (${t.score}/${t.total}) | ${new Date(t.created_at).toLocaleDateString("pt-BR")}`
      ).join("\n");

      // Erros por motorista (perguntas específicas)
      const erros = respostasData.filter(r => r.acertou === false);
      const acertos = respostasData.filter(r => r.acertou === true);

      const errosPorMotorista = {};
      erros.forEach(r => {
        const nome = r.motorista_nome || "desconhecido";
        if (!errosPorMotorista[nome]) errosPorMotorista[nome] = [];
        errosPorMotorista[nome].push(
          `[${r.quiz_titulo || "Quiz"}] Pergunta: "${r.pergunta}" | Respondeu: "${r.resposta_dada}" | Correta: "${r.correta}"`
        );
      });

      const resumoErros = Object.entries(errosPorMotorista)
        .map(([nome, lista]) => `${nome} — ${lista.length} erro(s):\n  ${lista.slice(0, 15).join("\n  ")}`)
        .join("\n\n");

      // Perguntas com mais erros
      const errosPorPergunta = {};
      erros.forEach(r => {
        const key = r.pergunta || "?";
        errosPorPergunta[key] = (errosPorPergunta[key] || 0) + 1;
      });
      const topErros = Object.entries(errosPorPergunta)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([p, n]) => `${n}x erros — "${p}"`)
        .join("\n");

      const contexto = `Você é um assistente de BI para o painel ADM da Bendini Logística.
Responda perguntas sobre motoristas, quizzes e resultados com base nos dados abaixo.
Seja direto e objetivo. Use listas quando necessário.

=== MOTORISTAS CADASTRADOS ===
${resumoMotoristas}

=== SITUAÇÃO DOS QUIZZES ===
${resumoQuizzes}

=== ÚLTIMAS TENTATIVAS (últimas 100) ===
${resumoTentativas || "Nenhuma tentativa registrada."}

=== ERROS POR MOTORISTA (perguntas específicas erradas) ===
${resumoErros || "Nenhum dado de erros por pergunta ainda."}

=== PERGUNTAS COM MAIS ERROS (top 10) ===
${topErros || "Nenhum dado disponível ainda."}

=== TOTAIS GERAIS ===
Total de respostas por questão: ${respostasData.length}
Total de erros: ${erros.length}
Total de acertos: ${acertos.length}
Taxa de acerto geral: ${respostasData.length > 0 ? ((acertos.length / respostasData.length) * 100).toFixed(1) : 0}%`;

      const res = await api("ai_chat", {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: contexto,
        messages: [{ role: "user", content: pergunta }],
        motorista: "adm_inteligencia"
      });
      const reply = res.content?.[0]?.text || "Não foi possível processar.";
      setIMsgs(p => [...p, { role:"assistant", content: reply }]);
    } catch {
      setIMsgs(p => [...p, { role:"assistant", content: "Erro de conexão. Tente novamente." }]);
    }
    setILoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.BG, fontFamily:"'Barlow','Segoe UI',sans-serif", color:C.TEXT, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.NAV, borderBottom:`1px solid ${C.BORDER}`, padding:"0 20px", display:"flex", alignItems:"center", height:62, gap:14, flexShrink:0 }}>
        <div style={{ width:3, height:36, background:C.RED, flexShrink:0 }} />
        <div>
          <div style={{ fontSize:18, fontWeight:900, letterSpacing:2, color:C.WHITE, textTransform:"uppercase", lineHeight:1 }}>Bendini</div>
          <div style={{ fontSize:8, letterSpacing:3, color:C.MUTED, textTransform:"uppercase", marginTop:3, fontWeight:600 }}>Painel ADM</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
          {msg && <span style={{ fontSize:11, color:msg.cor||C.GREEN, fontWeight:700 }}>{msg.text}</span>}
          {gerando && <span style={{ fontSize:11, color:C.YELLOW, fontWeight:700 }}>⚙️ Gerando quiz...</span>}
          <button onClick={onSair} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"4px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>Sair</button>
        </div>
      </div>

      <div style={{ background:C.NAV, borderBottom:`1px solid ${C.BORDER}`, display:"flex", flexShrink:0 }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => { setAba(a.id); setQuizDetalhe(null); }} style={{ flex:1, padding:"13px 4px", background:a.id===aba?C.CARD:"none", border:"none", borderBottom:a.id===aba?`2px solid ${C.RED}`:"2px solid transparent", color:a.id===aba?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>{a.label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding: aba === "inteligencia" ? 0 : 20, display:"flex", flexDirection:"column" }}>

        {/* MOTORISTAS */}
        {aba === "motoristas" && (
          <div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>Cadastrar Motorista</div>
              <input value={novoCpf} onChange={e => setNovoCpf(formatCPF(e.target.value))} placeholder="CPF — 000.000.000-00"
                style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:8, letterSpacing:1 }} />
              <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome completo"
                style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:12 }} />
              <button onClick={adicionarMotorista} style={{ background:C.RED, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>+ Cadastrar</button>
            </div>
            <div style={{ fontSize:10, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>{motoristas.length} motoristas</div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
              {loading ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Carregando...</div> :
                motoristas.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhum motorista cadastrado.</div> :
                motoristas.map((m, i) => (
                  <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:i<motoristas.length-1?`1px solid ${C.BORDER}`:"none" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:m.ativo?C.WHITE:C.MUTED }}>{m.nome}</div>
                      <div style={{ fontSize:11, color:C.MUTED, letterSpacing:1 }}>{formatCPF(m.cpf)}</div>
                    </div>
                    <div style={{ fontSize:9, color:m.ativo?C.GREEN:C.RED, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>{m.ativo?"Ativo":"Inativo"}</div>
                    <button onClick={() => toggleMotorista(m.id, m.ativo)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"4px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>
                      {m.ativo?"Desativar":"Ativar"}
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* QUIZZES */}
        {aba === "quizzes" && !quizDetalhe && (
          <div>
            <div style={{ fontSize:10, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>
              {quizzes.length} quizzes gerados pela IA
            </div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
              {loading ? <div style={{ padding:20, color:C.MUTED }}>Carregando...</div> :
                quizzes.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhum quiz ainda. Adicione regras para gerar quizzes automaticamente.</div> :
                quizzes.map((q, i) => (
                  <div key={q.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i<quizzes.length-1?`1px solid ${C.BORDER}`:"none" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div>
                      <div style={{ fontSize:11, color:C.MUTED }}>{new Date(q.created_at).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <div style={{ fontSize:9, color:C.GREEN, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>{q.status}</div>
                    <button onClick={() => verDetalheQuiz(q)} style={{ background:C.RED, border:"none", borderRadius:2, padding:"6px 14px", color:C.WHITE, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>
                      Ver Respostas
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* DETALHE QUIZ */}
        {aba === "quizzes" && quizDetalhe && (
          <div>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <button onClick={() => { setQuizDetalhe(null); setEditandoQuestao(null); setAddingQuestao(false); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"6px 14px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>← Voltar</button>
              <div style={{ flex:1, fontSize:16, fontWeight:900, color:C.WHITE }}>{quizDetalhe.titulo}</div>
            </div>

            {/* Sub-abas */}
            <div style={{ display:"flex", gap:0, marginBottom:20, background:C.NAV, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
              {[{id:"respostas",label:`📊 Respostas (${tentativas.length})`},{id:"questoes",label:`✏️ Questões (${questoes.length})`}].map(v => (
                <button key={v.id} onClick={() => { setQuizView(v.id); setEditandoQuestao(null); setAddingQuestao(false); }}
                  style={{ flex:1, padding:"11px 8px", background:quizView===v.id?C.CARD:"none", border:"none", borderBottom:quizView===v.id?`2px solid ${C.RED}`:"2px solid transparent", color:quizView===v.id?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>
                  {v.label}
                </button>
              ))}
            </div>

            {/* ABA: RESPOSTAS */}
            {quizView === "respostas" && (
              <div>
                <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>✓ Responderam ({tentativas.length})</div>
                <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden", marginBottom:16 }}>
                  {tentativas.length === 0 ? <div style={{ padding:16, color:C.MUTED, fontSize:13 }}>Nenhum motorista respondeu ainda.</div> :
                    tentativas.map((t, i) => (
                      <div key={t.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderBottom:i<tentativas.length-1?`1px solid ${C.BORDER}`:"none" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:C.WHITE }}>{t.motorista_nome}</div>
                          <div style={{ fontSize:11, color:C.MUTED }}>{formatCPF(t.motorista_cpf)} — {new Date(t.created_at).toLocaleDateString("pt-BR")} {new Date(t.created_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:16, fontWeight:900, color:t.percentual>=80?C.GREEN:t.percentual>=60?C.YELLOW:C.RED }}>{Number(t.percentual).toFixed(0)}%</div>
                          <div style={{ fontSize:10, color:C.MUTED }}>{t.score}/{t.total}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
                {(() => {
                  const responderam = new Set(tentativas.map(t => t.motorista_cpf));
                  const pendentes = motoristasList.filter(m => !responderam.has(m.cpf));
                  return (
                    <>
                      <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>✗ Pendentes ({pendentes.length})</div>
                      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
                        {pendentes.length === 0
                          ? <div style={{ padding:16, color:C.GREEN, fontSize:13, fontWeight:700 }}>✓ Todos responderam!</div>
                          : pendentes.map((m, i) => (
                            <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:i<pendentes.length-1?`1px solid ${C.BORDER}`:"none" }}>
                              <div style={{ width:8, height:8, borderRadius:"50%", background:C.RED, flexShrink:0 }} />
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, fontWeight:700, color:C.WHITE }}>{m.nome}</div>
                                <div style={{ fontSize:11, color:C.MUTED }}>{formatCPF(m.cpf)}</div>
                              </div>
                              <div style={{ fontSize:9, color:C.RED, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>Pendente</div>
                            </div>
                          ))
                        }
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ABA: QUESTÕES */}
            {quizView === "questoes" && (
              <div>
                {/* Formulário editar/adicionar */}
                {(editandoQuestao || addingQuestao) && (() => {
                  const q = editandoQuestao || novaQuestao;
                  const setQ = editandoQuestao
                    ? (field, val) => setEditandoQuestao(p => ({...p, [field]:val}))
                    : (field, val) => setNovaQuestao(p => ({...p, [field]:val}));
                  return (
                    <div style={{ background:C.CARD, border:`2px solid ${C.RED}`, borderRadius:2, padding:20, marginBottom:20 }}>
                      <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>
                        {editandoQuestao ? "✏️ Editar Questão" : "➕ Nova Questão"}
                      </div>
                      <textarea value={q.pergunta} onChange={e => setQ("pergunta", e.target.value)} placeholder="Texto da pergunta..." rows={2}
                        style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:10, resize:"vertical", lineHeight:1.5 }} />
                      {["a","b","c","d"].map(l => (
                        <div key={l} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                          <div style={{ width:24, height:24, borderRadius:2, background:q.correta===l?C.RED:C.BORDER2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:C.WHITE, flexShrink:0, cursor:"pointer" }}
                            onClick={() => setQ("correta", l)}>{l.toUpperCase()}</div>
                          <input value={q[`opcao_${l}`]} onChange={e => setQ(`opcao_${l}`, e.target.value)} placeholder={`Opção ${l.toUpperCase()}`}
                            style={{ flex:1, background:q.correta===l?"rgba(192,57,43,0.08)":C.NAV, border:`1px solid ${q.correta===l?C.RED:C.BORDER2}`, borderRadius:2, padding:"8px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit" }} />
                          {q.correta===l && <span style={{ fontSize:9, color:C.RED, fontWeight:900, letterSpacing:1 }}>✓ CORRETA</span>}
                        </div>
                      ))}
                      <textarea value={q.explicacao} onChange={e => setQ("explicacao", e.target.value)} placeholder="Explicação da resposta correta (opcional)..." rows={2}
                        style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", marginTop:4, marginBottom:14, resize:"vertical", lineHeight:1.5 }} />
                      <div style={{ fontSize:11, color:C.MUTED, marginBottom:12 }}>Clique na letra para definir a resposta correta.</div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={salvarQuestao} style={{ background:C.RED, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
                          {editandoQuestao ? "Salvar Alteração" : "Adicionar Questão"}
                        </button>
                        <button onClick={() => { setEditandoQuestao(null); setAddingQuestao(false); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 16px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Cancelar</button>
                      </div>
                    </div>
                  );
                })()}

                {/* Botão adicionar */}
                {!editandoQuestao && !addingQuestao && (
                  <button onClick={() => setAddingQuestao(true)} style={{ background:"none", border:`1px dashed ${C.RED}`, borderRadius:2, padding:"10px 20px", color:C.RED, cursor:"pointer", fontSize:10, letterSpacing:2, fontWeight:800, textTransform:"uppercase", fontFamily:"inherit", width:"100%", marginBottom:16 }}>
                    + Adicionar Nova Questão
                  </button>
                )}

                {/* Lista de questões */}
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {questoes.length === 0
                    ? <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:20, color:C.MUTED, fontSize:13 }}>Nenhuma questão cadastrada.</div>
                    : questoes.map((q, i) => (
                      <div key={q.id} style={{ background:editandoQuestao?.id===q.id?C.CARD2:C.CARD, border:`1px solid ${editandoQuestao?.id===q.id?C.RED:C.BORDER}`, borderRadius:2, padding:"14px 16px" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                          <div style={{ fontSize:10, color:C.MUTED, fontWeight:800, letterSpacing:1, minWidth:22, paddingTop:2 }}>#{i+1}</div>
                          <div style={{ flex:1, fontSize:14, fontWeight:700, color:C.WHITE, lineHeight:1.5 }}>{q.pergunta}</div>
                          <button onClick={() => { setEditandoQuestao({...q}); setAddingQuestao(false); window.scrollTo(0,0); }}
                            style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"3px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit", flexShrink:0 }}>Editar</button>
                          <button onClick={() => excluirQuestao(q.id)}
                            style={{ background:"none", border:`1px solid rgba(192,57,43,0.4)`, borderRadius:2, padding:"3px 10px", color:C.RED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit", flexShrink:0 }}>Excluir</button>
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6, paddingLeft:32 }}>
                          {["a","b","c","d"].map(l => (
                            <div key={l} style={{ padding:"4px 10px", borderRadius:2, background:q.correta===l?"rgba(46,204,113,0.1)":C.NAV, border:`1px solid ${q.correta===l?"#2ecc71":C.BORDER}`, fontSize:12, color:q.correta===l?"#2ecc71":C.MUTED, display:"flex", gap:6, alignItems:"center" }}>
                              <span style={{ fontWeight:900, fontSize:10 }}>{l.toUpperCase()}.</span> {q[`opcao_${l}`] || "—"}
                              {q.correta===l && <span style={{ fontSize:9, fontWeight:900 }}>✓</span>}
                            </div>
                          ))}
                        </div>
                        {q.explicacao && (
                          <div style={{ marginTop:8, paddingLeft:32, fontSize:12, color:C.MUTED, fontStyle:"italic", lineHeight:1.5 }}>💡 {q.explicacao}</div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* REGRAS */}
        {aba === "regras" && (
          <div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>
                {editandoRegra ? "Editar Regra" : "Nova Regra"}
              </div>
              {!editandoRegra && (
                <div style={{ fontSize:12, color:C.YELLOW, marginBottom:12, lineHeight:1.5 }}>
                  ⚡ Ao salvar uma regra nova, a IA gera automaticamente 10 perguntas de quiz para os motoristas.
                </div>
              )}
              <input value={novaRegra.titulo} onChange={e => setNovaRegra(p => ({...p, titulo:e.target.value}))} placeholder="Título da regra"
                style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:8 }} />
              <textarea value={novaRegra.conteudo} onChange={e => setNovaRegra(p => ({...p, conteudo:e.target.value}))} placeholder="Conteúdo da regra..." rows={4}
                style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", marginBottom:12, resize:"vertical", lineHeight:1.6 }} />
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={salvarRegra} disabled={gerando} style={{ background:gerando?C.CARD2:C.RED, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:gerando?"not-allowed":"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
                  {gerando?"Gerando quiz...":editandoRegra?"Salvar Edição":"+ Salvar e Gerar Quiz"}
                </button>
                {editandoRegra && (
                  <button onClick={() => { setEditandoRegra(null); setNovaRegra({titulo:"",conteudo:""}); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 16px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Cancelar</button>
                )}
              </div>
            </div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
              {loading ? <div style={{ padding:20, color:C.MUTED }}>Carregando...</div> :
                regras.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhuma regra cadastrada.</div> :
                regras.map((r, i) => (
                  <div key={r.id} style={{ padding:"14px 16px", borderBottom:i<regras.length-1?`1px solid ${C.BORDER}`:"none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                      <div style={{ flex:1, fontSize:14, fontWeight:800, color:C.WHITE }}>{r.titulo}</div>
                      <button onClick={() => { setEditandoRegra(r.id); setNovaRegra({titulo:r.titulo, conteudo:r.conteudo}); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"3px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>Editar</button>
                      <button onClick={() => excluirRegra(r.id)} style={{ background:"none", border:`1px solid rgba(192,57,43,0.4)`, borderRadius:2, padding:"3px 10px", color:C.RED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>Excluir</button>
                    </div>
                    <div style={{ fontSize:13, color:C.MUTED, lineHeight:1.6, whiteSpace:"pre-line" }}>{r.conteudo}</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* OFICINA ADM */}
        {aba === "oficina" && (
          <PainelOficinaAdm showMsg={showMsg} />
        )}

        {/* PROG ADM */}
        {aba === "prog" && (
          <PainelProgAdm showMsg={showMsg} />
        )}

        {/* ONBOARDING ADM */}
        {aba === "onboarding" && (
          <PainelOnboardingAdm showMsg={showMsg} />
        )}

        {/* INTELIGÊNCIA IA */}
        {aba === "inteligencia" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", height:"calc(100vh - 124px)" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
              {iMsgs.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:8, alignItems:"flex-end" }}>
                  {m.role==="assistant" && (
                    <div style={{ width:30, height:30, borderRadius:2, background:C.RED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:900, color:C.WHITE, flexShrink:0, letterSpacing:0.5 }}>ADM</div>
                  )}
                  <div style={{ maxWidth:"80%", padding:"10px 14px", borderRadius:m.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px", background:m.role==="user"?C.RED:C.CARD, border:m.role==="assistant"?`1px solid ${C.BORDER}`:"none", fontSize:13, color:C.TEXT, whiteSpace:"pre-line", lineHeight:1.65 }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {iLoading && (
                <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
                  <div style={{ width:30, height:30, borderRadius:2, background:C.RED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:900, color:C.WHITE }}>ADM</div>
                  <div style={{ padding:"10px 14px", background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:"10px 10px 10px 2px", display:"flex", gap:4 }}>
                    {[0,1,2].map(j => <div key={j} style={{ width:5, height:5, borderRadius:"50%", background:C.RED, animation:`bpulse 1s ${j*0.22}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={iEndRef} />
            </div>
            <div style={{ padding:"6px 14px 8px", display:"flex", gap:6, overflowX:"auto", flexShrink:0, background:C.NAV, borderTop:`1px solid ${C.BORDER}` }}>
              {["Quem não respondeu algum quiz?","Qual a média geral dos quizzes?","Quem tirou menos de 60%?","Quantos motoristas ativos?"].map(q => (
                <button key={q} onClick={() => setIInput(q)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"5px 10px", color:C.MUTED, fontSize:10, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>{q}</button>
              ))}
            </div>
            <div style={{ padding:"10px 14px 12px", borderTop:`1px solid ${C.BORDER}`, display:"flex", gap:8, background:C.NAV, flexShrink:0 }}>
              <input value={iInput} onChange={e => setIInput(e.target.value)} onKeyDown={e => e.key==="Enter" && sendInteligencia()} placeholder="Pergunte sobre motoristas, quizzes e resultados..."
                style={{ flex:1, background:C.CARD, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 14px", color:C.TEXT, fontSize:13, outline:"none", fontFamily:"inherit" }} />
              <button onClick={sendInteligencia} disabled={iLoading||!iInput.trim()} style={{ background:(!iLoading&&iInput.trim())?C.RED:C.CARD2, border:"none", borderRadius:2, width:44, cursor:(!iLoading&&iInput.trim())?"pointer":"not-allowed", color:(!iLoading&&iInput.trim())?C.WHITE:C.MUTED2, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900 }}>›</button>
            </div>
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.NAV}}::-webkit-scrollbar-thumb{background:${C.BORDER2};border-radius:2px}input::placeholder,textarea::placeholder{color:${C.MUTED2}}button:focus{outline:none}@keyframes bpulse{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════
// QUIZ DINÂMICO (por quiz_id)
// ══════════════════════════════════════════════════
function QuizDinamico({ quiz, usuario, onFim, onVoltar }) {
  const [questoes, setQuestoes] = useState([]);
  const [qi, setQi] = useState(0);
  const [qsel, setQsel] = useState(null);
  const [qshow, setQshow] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.get("quiz_questoes", `quiz_id=eq.${quiz.id}&order=ordem.asc`).then(d => {
      setQuestoes(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, [quiz.id]);

  // ── PATCH 2: salvar cada resposta individualmente em quiz_respostas ──
  const answer = async (letra) => {
    if (qsel) return;
    const q = questoes[qi];
    setQsel(letra);
    setQshow(true);
    const acertou = letra === q.correta;
    if (acertou) setScore(s => s + 1);

    // Salva a resposta desta questão no banco
    try {
      const payload = {
        motorista_nome: usuario.nome,
        quiz_titulo:    quiz.titulo,
        questao_id:     q.id || null,
        pergunta:       q.pergunta,
        resposta_dada:  letra,
        correta:        q.correta,
        acertou:        acertou,
      };
      console.log("📤 Enviando para quiz_respostas:", payload);
      const resultado = await sb.post("quiz_respostas", payload);
      console.log("✅ Resposta do servidor:", JSON.stringify(resultado));
    } catch (err) {
      console.error("❌ Erro ao salvar quiz_respostas:", err);
    }
  };

  const next = async () => {
    if (qi + 1 >= questoes.length) {
      const finalScore = score + (qsel === questoes[qi].correta ? 1 : 0);
      const pct = (finalScore / questoes.length) * 100;
      await sb.post("quiz_tentativas", {
        quiz_id: quiz.id,
        motorista_cpf: usuario.cpf,
        motorista_nome: usuario.nome,
        score: finalScore,
        total: questoes.length,
        percentual: pct,
      });
      setDone(true);
    } else {
      setQi(i => i + 1);
      setQsel(null);
      setQshow(false);
    }
  };

  const finalScore = done ? score : score + (qsel === questoes[qi]?.correta ? 1 : 0);
  const pct = questoes.length > 0 ? (finalScore / questoes.length) * 100 : 0;

  if (loading) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:C.MUTED, fontSize:13, letterSpacing:1 }}>Carregando questões...</div>
    </div>
  );

  if (done) return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:32, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>{pct>=80?"🏆":pct>=60?"👍":"📚"}</div>
        <div style={{ fontSize:9, color:C.RED, letterSpacing:2.5, fontWeight:900, textTransform:"uppercase", marginBottom:12 }}>Resultado</div>
        <div style={{ fontSize:48, fontWeight:900, color:C.WHITE, lineHeight:1 }}>{finalScore}<span style={{ fontSize:20, color:C.MUTED, fontWeight:400 }}>/{questoes.length}</span></div>
        <div style={{ fontSize:22, fontWeight:900, color:pct>=80?C.GREEN:pct>=60?C.YELLOW:C.RED, marginTop:6 }}>{pct.toFixed(0)}%</div>
        <div style={{ fontSize:13, color:C.MUTED, marginTop:14, marginBottom:8 }}>{quiz.titulo}</div>
        <div style={{ fontSize:13, color:C.MUTED, marginBottom:24 }}>{pct>=80?"Excelente!":pct>=60?"Bom resultado. Revise os pontos errados.":"Revise a regra e tente novamente."}</div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={onVoltar} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 20px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>← Voltar</button>
          <button onClick={() => { setQi(0); setQsel(null); setQshow(false); setScore(0); setDone(false); }} style={{ background:C.RED, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit", fontWeight:900 }}>↺ Refazer</button>
        </div>
      </div>
    </div>
  );

  const q = questoes[qi];
  const opts = [
    { letra:"a", texto:q.opcao_a },
    { letra:"b", texto:q.opcao_b },
    { letra:"c", texto:q.opcao_c },
    { letra:"d", texto:q.opcao_d },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      <button onClick={onVoltar} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"5px 12px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit", marginBottom:16 }}>← Voltar</button>
      <div style={{ fontSize:11, color:C.MUTED, marginBottom:4 }}>{quiz.titulo}</div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:9, color:C.MUTED, letterSpacing:2, fontWeight:800, textTransform:"uppercase" }}>Pergunta {qi+1} de {questoes.length}</span>
        <span style={{ fontSize:9, color:C.GREEN, letterSpacing:1, fontWeight:800 }}>{score} corretas</span>
      </div>
      <div style={{ height:2, background:C.BORDER, borderRadius:1, marginBottom:22 }}>
        <div style={{ height:"100%", width:`${(qi/questoes.length)*100}%`, background:C.RED, borderRadius:1 }} />
      </div>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"20px 18px", marginBottom:14 }}>
        <div style={{ fontSize:9, color:C.RED, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:12 }}>Questão {qi+1}</div>
        <div style={{ fontSize:16, fontWeight:700, lineHeight:1.5, color:C.WHITE }}>{q.pergunta}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
        {opts.map(o => {
          const isC = o.letra === q.correta;
          const isSel = o.letra === qsel;
          let bg=C.CARD, border=`1px solid ${C.BORDER}`, color=C.TEXT;
          if (qshow) {
            if (isC) { bg="rgba(46,204,113,0.07)"; border="1px solid #2ecc71"; color="#2ecc71"; }
            else if (isSel) { bg="rgba(192,57,43,0.08)"; border=`1px solid ${C.RED}`; color="#e07070"; }
          }
          return (
            <button key={o.letra} onClick={() => answer(o.letra)} style={{ background:bg, border, borderRadius:2, padding:"12px 16px", color, textAlign:"left", cursor:qsel?"default":"pointer", fontSize:14, lineHeight:1.4, width:"100%", display:"block", fontFamily:"inherit", transition:"all 0.15s" }}>
              <span style={{ fontWeight:900, marginRight:10, color:C.MUTED2, fontSize:12 }}>{o.letra.toUpperCase()}.</span>{o.texto}
            </button>
          );
        })}
      </div>
      {qshow && (
        <>
          <div style={{ background:qsel===q.correta?"rgba(46,204,113,0.07)":"rgba(192,57,43,0.08)", border:`1px solid ${qsel===q.correta?"#2ecc71":C.RED}`, borderRadius:2, padding:"12px 14px", marginBottom:14, fontSize:13, color:qsel===q.correta?"#2ecc71":"#e07070", lineHeight:1.65 }}>
            {qsel===q.correta?"✓ Correto — ":"✗ Incorreto — "}{q.explicacao}
          </div>
          <button onClick={next} style={{ width:"100%", padding:"14px", background:C.RED, border:"none", borderRadius:2, color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
            {qi+1>=questoes.length?"Ver Resultado":"Próxima →"}
          </button>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// REVISÃO DE ERROS DO QUIZ
// ══════════════════════════════════════════════════
function RevisaoQuiz({ quiz, usuario, onVoltar }) {
  const [respostas, setRespostas] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sb.get("quiz_respostas", `motorista_nome=eq.${encodeURIComponent(usuario.nome)}&quiz_titulo=eq.${encodeURIComponent(quiz.titulo)}&order=created_at.desc&limit=100`),
      sb.get("quiz_questoes", `quiz_id=eq.${quiz.id}&order=ordem.asc`),
    ]).then(([r, q]) => {
      setRespostas(Array.isArray(r) ? r : []);
      setQuestoes(Array.isArray(q) ? q : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Carregando revisão...</div>;

  const ultimaResposta = {};
  respostas.forEach(r => { if (!ultimaResposta[r.questao_id]) ultimaResposta[r.questao_id] = r; });

  const erros = Object.values(ultimaResposta).filter(r => !r.acertou);
  const acertos = Object.values(ultimaResposta).filter(r => r.acertou);
  const total = Object.values(ultimaResposta).length;
  const pct = total > 0 ? Math.round((acertos.length / total) * 100) : 0;
  const semDados = respostas.length === 0;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      <button onClick={onVoltar} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"6px 14px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit", marginBottom:16 }}>← Voltar</button>

      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:4 }}>Revisão</div>
        <div style={{ fontSize:17, fontWeight:900, color:C.WHITE, marginBottom:12 }}>{quiz.titulo}</div>
        {!semDados && (
          <div style={{ display:"flex", gap:20 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:24, fontWeight:900, color:pct>=80?C.GREEN:pct>=60?C.YELLOW:C.RED }}>{pct}%</div>
              <div style={{ fontSize:10, color:C.MUTED, letterSpacing:1, textTransform:"uppercase" }}>Aproveitamento</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:24, fontWeight:900, color:C.GREEN }}>{acertos.length}</div>
              <div style={{ fontSize:10, color:C.MUTED, letterSpacing:1, textTransform:"uppercase" }}>Acertos</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:24, fontWeight:900, color:C.RED }}>{erros.length}</div>
              <div style={{ fontSize:10, color:C.MUTED, letterSpacing:1, textTransform:"uppercase" }}>Erros</div>
            </div>
          </div>
        )}
      </div>

      {semDados ? (
        <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:24 }}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
            <div style={{ fontSize:14, color:C.WHITE, fontWeight:700, marginBottom:6 }}>Gabarito das questões</div>
            <div style={{ fontSize:12, color:C.MUTED, lineHeight:1.6 }}>Esta tentativa foi feita antes do sistema de revisão. Refaça o quiz para ver seus erros em detalhes.</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {questoes.map((q, i) => (
              <div key={q.id} style={{ background:C.NAV, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"12px 14px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.WHITE, marginBottom:8 }}>#{i+1} {q.pergunta}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {["a","b","c","d"].map(l => (
                    <div key={l} style={{ padding:"4px 10px", borderRadius:2, background:q.correta===l?"rgba(46,204,113,0.1)":C.CARD, border:`1px solid ${q.correta===l?"#2ecc71":C.BORDER}`, fontSize:12, color:q.correta===l?"#2ecc71":C.MUTED }}>
                      <span style={{ fontWeight:900 }}>{l.toUpperCase()}.</span> {q[`opcao_${l}`]} {q.correta===l && "✓"}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {erros.length > 0 && (
            <>
              <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:4 }}>✗ O que você errou ({erros.length})</div>
              {erros.map((r, i) => {
                const q = questoes.find(q => q.id === r.questao_id) || {};
                return (
                  <div key={i} style={{ background:C.CARD, border:`1px solid rgba(192,57,43,0.4)`, borderRadius:2, padding:"14px 16px" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.WHITE, marginBottom:12, lineHeight:1.5 }}>{r.pergunta}</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
                      {["a","b","c","d"].map(l => {
                        const isCorreta = l === r.correta;
                        const isErrada = l === r.resposta_dada;
                        if (!isCorreta && !isErrada) return null;
                        return (
                          <div key={l} style={{ padding:"8px 12px", borderRadius:2, background:isCorreta?"rgba(46,204,113,0.08)":"rgba(192,57,43,0.08)", border:`1px solid ${isCorreta?"#2ecc71":C.RED}`, fontSize:13, color:isCorreta?"#2ecc71":"#e07070", display:"flex", gap:8, alignItems:"center" }}>
                            <span style={{ fontWeight:900, fontSize:11 }}>{l.toUpperCase()}.</span>
                            <span style={{ flex:1 }}>{q[`opcao_${l}`] || ""}</span>
                            <span style={{ fontSize:10, fontWeight:900 }}>{isCorreta?"✓ Correta":"✗ Sua resposta"}</span>
                          </div>
                        );
                      })}
                    </div>
                    {q.explicacao && <div style={{ fontSize:12, color:C.MUTED, lineHeight:1.6, fontStyle:"italic" }}>💡 {q.explicacao}</div>}
                  </div>
                );
              })}
            </>
          )}
          {acertos.length > 0 && (
            <>
              <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginTop:8, marginBottom:4 }}>✓ O que você acertou ({acertos.length})</div>
              {acertos.map((r, i) => (
                <div key={i} style={{ background:C.CARD, border:`1px solid rgba(46,204,113,0.2)`, borderRadius:2, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(46,204,113,0.15)", border:"1px solid #2ecc71", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#2ecc71", flexShrink:0 }}>✓</div>
                  <div style={{ fontSize:13, color:C.TEXT, lineHeight:1.5 }}>{r.pergunta}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// LISTA DE QUIZZES DO MOTORISTA
// ══════════════════════════════════════════════════
function ListaQuizzes({ usuario, onIniciar, onRevisar }) {
  const [quizzes, setQuizzes] = useState([]);
  const [tentativas, setTentativas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sb.get("quizzes", "status=eq.ativo&order=created_at.desc"),
      sb.get("quiz_tentativas", `motorista_cpf=eq.${usuario.cpf}&order=created_at.desc`),
    ]).then(([q, t]) => {
      setQuizzes(Array.isArray(q) ? q : []);
      setTentativas(Array.isArray(t) ? t : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Carregando quizzes...</div>;

  const tentativasPorQuiz = tentativas.reduce((acc, t) => {
    if (!acc[t.quiz_id]) acc[t.quiz_id] = [];
    acc[t.quiz_id].push(t);
    return acc;
  }, {});

  const pendentes = quizzes.filter(q => !tentativasPorQuiz[q.id]);
  const feitos = quizzes.filter(q => tentativasPorQuiz[q.id]);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      {pendentes.length > 0 && (
        <>
          <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:10 }}>🔴 Pendentes ({pendentes.length})</div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden", marginBottom:20 }}>
            {pendentes.map((q, i) => (
              <div key={q.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i<pendentes.length-1?`1px solid ${C.BORDER}`:"none" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div>
                  <div style={{ fontSize:11, color:C.MUTED }}>10 perguntas — Não respondido</div>
                </div>
                <button onClick={() => onIniciar(q)} style={{ background:C.RED, border:"none", borderRadius:2, padding:"8px 16px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:1.5, fontWeight:900, textTransform:"uppercase", fontFamily:"inherit" }}>Responder →</button>
              </div>
            ))}
          </div>
        </>
      )}
      {feitos.length > 0 && (
        <>
          <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:10 }}>✓ Respondidos ({feitos.length})</div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {feitos.map((q, i) => {
              const ts = tentativasPorQuiz[q.id];
              const melhor = Math.max(...ts.map(t => t.percentual));
              return (
                <div key={q.id} style={{ padding:"14px 16px", borderBottom:i<feitos.length-1?`1px solid ${C.BORDER}`:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div>
                      <div style={{ fontSize:11, color:C.MUTED }}>Melhor: {Number(melhor).toFixed(0)}% — {ts.length}x respondido</div>
                    </div>
                    <div style={{ fontSize:18, fontWeight:900, color:melhor>=80?C.GREEN:melhor>=60?C.YELLOW:C.RED }}>{Number(melhor).toFixed(0)}%</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => onRevisar(q)} style={{ flex:1, background:"rgba(192,57,43,0.1)", border:`1px solid rgba(192,57,43,0.4)`, borderRadius:2, padding:"8px 12px", color:C.RED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:800, textTransform:"uppercase", fontFamily:"inherit" }}>📋 Ver Erros</button>
                    <button onClick={() => onIniciar(q)} style={{ flex:1, background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"8px 12px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>↺ Refazer</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {quizzes.length === 0 && (
        <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:32, textAlign:"center", color:C.MUTED, fontSize:13 }}>
          Nenhum quiz disponível ainda. Aguarde o gestor adicionar novas regras.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [isAdm, setIsAdm] = useState(false);
  const [tab, setTab] = useState("chat");
  const [msgs, setMsgs] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [regrasAdm, setRegrasAdm] = useState([]);
  const [ouvindo, setOuvindo] = useState(false);
  const [semMic, setSemMic] = useState(false);
  const recognitionRef = useRef(null);
  const [imagemBase64, setImagemBase64] = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [quizAtivo, setQuizAtivo] = useState(null);
  const [quizRevisando, setQuizRevisando] = useState(null);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [obSlides, setObSlides] = useState([]);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const handleLogin = async (user) => {
    setUsuario(user);
    // Se só mecânico, pula seleção de perfil
    if (user.perfilAuto) setPerfil(user.perfilAuto);
    setLoadingHist(true);
    try {
      const [hist, regs, qz, tent, ob] = await Promise.all([
        sb.get("historico_conversa", `motorista_nome=eq.${encodeURIComponent(user.cpf)}&order=created_at.asc&limit=100`),
        sb.get("regras", "ativo=eq.true&order=ordem.asc"),
        sb.get("quizzes", "status=eq.ativo"),
        sb.get("quiz_tentativas", `motorista_cpf=eq.${user.cpf}`),
        sb.get("onboarding_slides", "modulo=eq.motorista&ativo=eq.true&order=ordem.asc"),
      ]);
      setRegrasAdm(Array.isArray(regs) ? regs : []);
      setObSlides(Array.isArray(ob) ? ob : []);
      const quizzesAtivos = Array.isArray(qz) ? qz : [];
      const respondidos = new Set((Array.isArray(tent) ? tent : []).map(t => t.quiz_id));
      const pendentes = quizzesAtivos.filter(q => !respondidos.has(q.id)).length;
      setQuizzesCount(pendentes);
      if (Array.isArray(hist) && hist.length > 0) {
        setMsgs(hist.map(m => ({ role:m.role, content:m.content })));
      } else {
        setMsgs([{ role:"assistant", content:`Olá, **${user.nome}**! Sou o **BEN**, assistente oficial da Bendini Logística.\n\nEstou aqui para responder suas dúvidas sobre regras e procedimentos.\n\nComo posso ajudar?` }]);
      }
    } catch {
      setMsgs([{ role:"assistant", content:`Olá, **${user.nome}**! Sou o **BEN**.\n\nComo posso ajudar?` }]);
    }
    setLoadingHist(false);
  };

  const buildKnowledge = () => {
    let base = `Você é o BEN, Assistente Oficial da Bendini Logística — agente de onboarding e instrução para Gestores de Unidade Móvel. Responda sempre em português brasileiro.\n\nTOM: Seja firme e direto, mas acolhedor. Fale como um consultor experiente.\n\n`;
    if (regrasAdm.length > 0) {
      base += "=== REGRAS E PROCEDIMENTOS BENDINI ===\n";
      regrasAdm.forEach(r => { base += `\n${r.titulo.toUpperCase()}:\n${r.conteudo}\n`; });
    }
    return base;
  };

  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(",")[1];
      const mediaType = file.type || "image/jpeg";
      setImagemBase64({ data: base64, mediaType });
      setImagemPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const limparFoto = () => {
    setImagemBase64(null);
    setImagemPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const send = async () => {
    if ((!input.trim() && !imagemBase64) || loading) return;
    const txt = input.trim() || "O que você vê nessa imagem? Me ajude com isso.";
    setInput("");
    let userContent;
    if (imagemBase64) {
      userContent = [
        { type: "image", source: { type: "base64", media_type: imagemBase64.mediaType, data: imagemBase64.data } },
        { type: "text", text: txt }
      ];
    } else {
      userContent = txt;
    }
    const preview = imagemPreview;
    limparFoto();
    const msgDisplay = { role:"user", content: txt, imagem: preview };
    setMsgs(p => [...p, msgDisplay]);
    setLoading(true);
    try {
      const msgsParaApi = [...msgs.map(m => ({
        role: m.role,
        content: Array.isArray(m.content) ? m.content : m.content
      })), { role:"user", content: userContent }];
      const res = await api("ai_chat", { model:"claude-haiku-4-5-20251001", max_tokens:1000, system:buildKnowledge(), messages:msgsParaApi, motorista:usuario.cpf });
      const reply = res.content?.[0]?.text || "Não foi possível processar. Tente novamente.";
      setMsgs(p => [...p, { role:"assistant", content:reply }]);
    } catch { setMsgs(p => [...p, { role:"assistant", content:"Erro de conexão. Tente novamente." }]); }
    setLoading(false);
  };

  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSemMic(true); return; }
    if (ouvindo) { recognitionRef.current?.stop(); setOuvindo(false); return; }
    const rec = new SR();
    rec.lang = "pt-BR"; rec.continuous = false; rec.interimResults = false;
    recognitionRef.current = rec;
    rec.onstart = () => setOuvindo(true);
    rec.onend = () => setOuvindo(false);
    rec.onerror = () => setOuvindo(false);
    rec.onresult = (e) => { const txt = e.results[0][0].transcript; setInput(prev => prev ? prev + " " + txt : txt); };
    rec.start();
  };

  const TABS = [
    { id:"chat", label:"Assistente IA" },
    { id:"onboarding", label:"Onboarding" },
    { id:"quiz", label:"Quiz", badge: quizzesCount > 0 ? quizzesCount : null },
  ];

  if (isAdm) return <PainelAdm onSair={() => setIsAdm(false)} />;
  if (!usuario) return <LoginScreen onLogin={handleLogin} onAdm={() => setIsAdm(true)} />;
  if (perfil === "oficina") return <ModuloOficina usuario={usuario} onSair={() => { setUsuario(null); setPerfil(null); }} />;
  if (perfil === "programador") return <ModuloProg usuario={usuario} onSair={() => { setUsuario(null); setPerfil(null); }} />;
  if (!perfil) return <SelecionarPerfil usuario={usuario} onPerfil={setPerfil} onSair={() => setUsuario(null)} />;
  if (loadingHist) return (
    <div style={{ minHeight:"100vh", background:C.BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow','Segoe UI',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:13, color:C.MUTED, letterSpacing:2, textTransform:"uppercase", fontWeight:700 }}>Carregando...</div>
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:16 }}>
          {[0,1,2].map(j => <div key={j} style={{ width:8, height:8, borderRadius:"50%", background:C.RED, animation:`bpulse 1s ${j*0.22}s infinite` }} />)}
        </div>
      </div>
      <style>{`@keyframes bpulse{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.BG, fontFamily:"'Barlow','Segoe UI',sans-serif", color:C.TEXT, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.NAV, borderBottom:`1px solid ${C.BORDER}`, padding:"0 20px", display:"flex", alignItems:"center", height:62, gap:14, flexShrink:0 }}>
        <div style={{ width:3, height:36, background:C.RED, flexShrink:0 }} />
        <div>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:2, color:C.WHITE, textTransform:"uppercase", lineHeight:1 }}>Bendini</div>
          <div style={{ fontSize:8, letterSpacing:3.5, color:C.MUTED, textTransform:"uppercase", marginTop:3, fontWeight:600 }}>Operador Logístico</div>
        </div>
        <div style={{ width:1, height:28, background:C.BORDER2, margin:"0 10px" }} />
        <div style={{ fontSize:10, color:C.MUTED2, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase" }}>Agente BEN</div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:11, color:C.MUTED, fontWeight:700 }}>👤 {usuario.nome}</div>
          <div style={{ width:1, height:16, background:C.BORDER2 }} />
          <button onClick={() => setUsuario(null)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"4px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>Sair</button>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.GREEN }} />
            <span style={{ fontSize:9, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase" }}>Online</span>
          </div>
        </div>
      </div>

      <div style={{ background:C.NAV, borderBottom:`1px solid ${C.BORDER}`, display:"flex", flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setQuizAtivo(null); setQuizRevisando(null); }} style={{ flex:1, padding:"13px 4px", background:t.id===tab?C.CARD:"none", border:"none", borderBottom:t.id===tab?`2px solid ${C.RED}`:"2px solid transparent", color:t.id===tab?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", position:"relative" }}>
            {t.label}
            {t.badge && <span style={{ position:"absolute", top:6, right:"calc(50% - 20px)", background:C.RED, color:C.WHITE, borderRadius:"50%", width:16, height:16, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {/* CHAT */}
        {tab === "chat" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:10, alignItems:"flex-end" }}>
                  {m.role==="assistant" && <div style={{ width:32, height:32, borderRadius:2, background:C.RED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:C.WHITE, flexShrink:0 }}>BEN</div>}
                  <div style={{ maxWidth:"78%", borderRadius:m.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px", overflow:"hidden" }}>
                    {m.imagem && <img src={m.imagem} alt="foto" style={{ width:"100%", maxWidth:220, display:"block", borderRadius:"10px 10px 2px 2px" }} />}
                    <div style={{ padding:"10px 14px", background:m.role==="user"?C.RED:C.CARD, border:m.role==="assistant"?`1px solid ${C.BORDER}`:"none", fontSize:14, color:C.TEXT }}>
                      {fmt(typeof m.content === "string" ? m.content : m.content?.[1]?.text || m.content?.[0]?.text || "")}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:2, background:C.RED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:C.WHITE, flexShrink:0 }}>BEN</div>
                  <div style={{ padding:"12px 16px", background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:"10px 10px 10px 2px", display:"flex", gap:5, alignItems:"center" }}>
                    {[0,1,2].map(j => <div key={j} style={{ width:5, height:5, borderRadius:"50%", background:C.RED, animation:`bpulse 1s ${j*0.22}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <div style={{ padding:"6px 16px 8px", display:"flex", gap:7, overflowX:"auto", flexShrink:0 }}>
              {["Como funcionam os prêmios?","Quais são as proibições?","Como é o ranking?","Velocidades na estrada"].map(q => (
                <button key={q} onClick={() => setInput(q)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"5px 12px", color:C.MUTED, fontSize:10, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, letterSpacing:0.8, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>{q}</button>
              ))}
            </div>
            {imagemPreview && (
              <div style={{ padding:"8px 16px 0", background:C.NAV, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                <img src={imagemPreview} alt="preview" style={{ width:52, height:52, objectFit:"cover", borderRadius:4, border:`1px solid ${C.BORDER2}` }} />
                <div style={{ fontSize:11, color:C.MUTED, flex:1 }}>Imagem pronta para enviar</div>
                <button onClick={limparFoto} style={{ background:"none", border:"none", color:C.RED, cursor:"pointer", fontSize:16, padding:4 }}>✕</button>
              </div>
            )}
            <div style={{ padding:"10px 16px 12px", borderTop:`1px solid ${C.BORDER}`, display:"flex", gap:8, background:C.NAV, flexShrink:0 }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFoto} style={{ display:"none" }} />
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()} placeholder={ouvindo?"Ouvindo... fale agora":imagemBase64?"Descreva sua dúvida sobre a foto...":"Digite ou use o microfone..."}
                style={{ flex:1, background:C.CARD, border:`1px solid ${ouvindo?C.RED:imagemBase64?"#f39c12":C.BORDER2}`, borderRadius:2, padding:"11px 14px", color:C.TEXT, fontSize:13, outline:"none", fontFamily:"inherit", transition:"border 0.2s" }} />
              <button onClick={() => fileInputRef.current?.click()} style={{ background:imagemBase64?"rgba(243,156,18,0.15)":"rgba(192,57,43,0.15)", border:`1px solid ${imagemBase64?"#f39c12":C.BORDER2}`, borderRadius:2, width:46, cursor:"pointer", color:imagemBase64?"#f39c12":C.MUTED, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>📷</button>
              <button onClick={toggleMic} style={{ background:ouvindo?C.RED:"rgba(192,57,43,0.15)", border:`1px solid ${ouvindo?C.RED:C.BORDER2}`, borderRadius:2, width:46, cursor:"pointer", color:ouvindo?C.WHITE:C.MUTED, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", animation:ouvindo?"micPulse 1s infinite":"none", flexShrink:0 }}>
                {ouvindo?"⏹":"🎤"}
              </button>
              <button onClick={send} disabled={loading||(!input.trim()&&!imagemBase64)} style={{ background:(!loading&&(input.trim()||imagemBase64))?C.RED:C.CARD2, border:"none", borderRadius:2, width:46, cursor:(!loading&&(input.trim()||imagemBase64))?"pointer":"not-allowed", color:(!loading&&(input.trim()||imagemBase64))?C.WHITE:C.MUTED2, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, flexShrink:0 }}>›</button>
            </div>
            {semMic && <div style={{ padding:"6px 16px 10px", fontSize:11, color:C.RED, background:C.NAV }}>⚠️ Microfone não suportado. Use Chrome ou Edge.</div>}
          </div>
        )}

        {/* ONBOARDING */}
        {tab === "onboarding" && obSlides.length === 0 && (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ color:C.MUTED, fontSize:13 }}>Nenhum conteúdo de onboarding cadastrado ainda.</div>
          </div>
        )}
        {tab === "onboarding" && obSlides.length > 0 && (
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:9, color:C.MUTED, letterSpacing:2, textTransform:"uppercase", fontWeight:700 }}>Progresso</span>
              <span style={{ fontSize:9, color:C.RED, letterSpacing:1, fontWeight:800 }}>{step+1} / {obSlides.length}</span>
            </div>
            <div style={{ height:2, background:C.BORDER, borderRadius:1, marginBottom:20 }}>
              <div style={{ height:"100%", width:`${((step+1)/obSlides.length)*100}%`, background:C.RED, transition:"width 0.4s", borderRadius:1 }} />
            </div>
            <div style={{ display:"flex", gap:5, marginBottom:22, flexWrap:"wrap" }}>
              {obSlides.map((_,i) => <div key={i} onClick={() => setStep(i)} style={{ width:i===step?24:8, height:3, background:i<=step?C.RED:C.BORDER2, cursor:"pointer", transition:"all 0.3s", borderRadius:2 }} />)}
            </div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"24px 20px", marginBottom:16 }}>
              <div style={{ fontSize:10, display:"inline-block", background:C.RED, color:C.WHITE, letterSpacing:2, fontWeight:900, padding:"3px 9px", marginBottom:16, textTransform:"uppercase" }}>{obSlides[step].tag}</div>
              <div style={{ fontSize:28, marginBottom:10 }}>{obSlides[step].icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:C.WHITE, marginBottom:6, letterSpacing:-0.5, lineHeight:1.2 }}>{obSlides[step].title}</div>
              <div style={{ fontSize:11, color:C.MUTED, letterSpacing:1.5, textTransform:"uppercase", fontWeight:700, marginBottom:20 }}>{obSlides[step].sub}</div>
              <div style={{ fontSize:14, color:C.TEXT, whiteSpace:"pre-line", lineHeight:1.85 }}>{obSlides[step].body}</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep(s => Math.max(0,s-1))} disabled={step===0} style={{ flex:1, padding:"13px", background:"none", border:`1px solid ${step===0?C.BORDER:C.BORDER2}`, borderRadius:2, color:step===0?C.MUTED2:C.MUTED, cursor:step===0?"not-allowed":"pointer", fontWeight:800, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>← Anterior</button>
              <button onClick={() => setStep(s => Math.min(obSlides.length-1,s+1))} disabled={step===obSlides.length-1} style={{ flex:2, padding:"13px", background:step===obSlides.length-1?C.CARD2:C.RED, border:"none", borderRadius:2, color:step===obSlides.length-1?C.MUTED2:C.WHITE, cursor:step===obSlides.length-1?"not-allowed":"pointer", fontWeight:900, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Próximo →</button>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {tab === "quiz" && !quizAtivo && !quizRevisando && <ListaQuizzes usuario={usuario} onIniciar={setQuizAtivo} onRevisar={setQuizRevisando} />}
        {tab === "quiz" && quizAtivo && <QuizDinamico quiz={quizAtivo} usuario={usuario} onFim={() => setQuizAtivo(null)} onVoltar={() => setQuizAtivo(null)} />}
        {tab === "quiz" && quizRevisando && <RevisaoQuiz quiz={quizRevisando} usuario={usuario} onVoltar={() => setQuizRevisando(null)} />}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');
        @keyframes bpulse{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}
        @keyframes micPulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,0.5)}50%{box-shadow:0 0 0 6px rgba(192,57,43,0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.NAV}}::-webkit-scrollbar-thumb{background:${C.BORDER2};border-radius:2px}
        input::placeholder{color:${C.MUTED2}}button:focus{outline:none}
      `}</style>
    </div>
  );
}


// ══════════════════════════════════════════════════
// SELEÇÃO DE PERFIL
// ══════════════════════════════════════════════════
function SelecionarPerfil({ usuario, onPerfil, onSair }) {
  return (
    <div style={{ minHeight:"100vh", background:C.BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow','Segoe UI',sans-serif", padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:48 }}>
        <div style={{ width:3, height:40, background:C.RED }} />
        <div>
          <div style={{ fontSize:24, fontWeight:900, letterSpacing:2, color:C.WHITE, textTransform:"uppercase" }}>Bendini</div>
          <div style={{ fontSize:9, letterSpacing:3.5, color:C.MUTED, textTransform:"uppercase", marginTop:2, fontWeight:600 }}>Operador Logístico</div>
        </div>
      </div>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"36px 32px", width:"100%", maxWidth:420 }}>
        <div style={{ fontSize:10, color:C.RED, letterSpacing:2.5, fontWeight:900, textTransform:"uppercase", marginBottom:10 }}>Bem-vindo</div>
        <div style={{ fontSize:20, fontWeight:900, color:C.WHITE, marginBottom:6 }}>{usuario.nome}</div>
        <div style={{ fontSize:13, color:C.MUTED, marginBottom:28, lineHeight:1.6 }}>Selecione seu perfil de acesso:</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <button onClick={() => onPerfil("motorista")}
            style={{ background:C.NAV, border:`2px solid ${C.BORDER2}`, borderRadius:2, padding:"20px 24px", cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"border 0.15s" }}
            onMouseOver={e => e.currentTarget.style.borderColor=C.RED}
            onMouseOut={e => e.currentTarget.style.borderColor=C.BORDER2}>
            <div style={{ fontSize:28, marginBottom:8 }}>🚛</div>
            <div style={{ fontSize:15, fontWeight:900, color:C.WHITE, marginBottom:4 }}>Gestor de Unidade Móvel</div>
            <div style={{ fontSize:12, color:C.MUTED }}>Motorista — acesso ao BEN, onboarding e quizzes da frota</div>
          </button>
          <button onClick={() => onPerfil("oficina")}
            style={{ background:C.NAV, border:`2px solid ${C.BORDER2}`, borderRadius:2, padding:"20px 24px", cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"border 0.15s" }}
            onMouseOver={e => e.currentTarget.style.borderColor="#e67e22"}
            onMouseOut={e => e.currentTarget.style.borderColor=C.BORDER2}>
            <div style={{ fontSize:28, marginBottom:8 }}>🔧</div>
            <div style={{ fontSize:15, fontWeight:900, color:C.WHITE, marginBottom:4 }}>Mecânico de Oficina</div>
            <div style={{ fontSize:12, color:C.MUTED }}>Acesso ao BEN da oficina, procedimentos e quizzes de manutenção</div>
          </button>
          <button onClick={() => onPerfil("programador")}
            style={{ background:C.NAV, border:`2px solid ${C.BORDER2}`, borderRadius:2, padding:"20px 24px", cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"border 0.15s" }}
            onMouseOver={e => e.currentTarget.style.borderColor="#1a7a4a"}
            onMouseOut={e => e.currentTarget.style.borderColor=C.BORDER2}>
            <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
            <div style={{ fontSize:15, fontWeight:900, color:C.WHITE, marginBottom:4 }}>Programador Operacional</div>
            <div style={{ fontSize:12, color:C.MUTED }}>Acesso ao BEN operacional, regras de clientes e quizzes</div>
          </button>
        </div>
        <button onClick={onSair} style={{ width:"100%", padding:"10px", background:"none", border:`1px solid ${C.BORDER}`, borderRadius:2, color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", fontFamily:"inherit", marginTop:16 }}>← Trocar CPF</button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MÓDULO OFICINA — CHAT + QUIZ MECÂNICOS
// ══════════════════════════════════════════════════
function ModuloOficina({ usuario, onSair }) {
  const [tab, setTab] = useState("chat");
  const [msgs, setMsgs] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [regras, setRegras] = useState([]);
  const [quizAtivo, setQuizAtivo] = useState(null);
  const [quizRevisando, setQuizRevisando] = useState(null);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [obStep, setObStep] = useState(0);
  const [obSlides, setObSlides] = useState([]);
  const endRef = useRef(null);
  const OC = "#e67e22";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  useEffect(() => {
    const init = async () => {
      try {
        const [hist, regs, qz, tent, mecReg, ob] = await Promise.all([
          sb.get("oficina_historico", `mecanico_cpf=eq.${encodeURIComponent(usuario.cpf)}&order=created_at.asc&limit=100`),
          sb.get("oficina_regras", "ativo=eq.true&order=ordem.asc"),
          sb.get("oficina_quizzes", "status=eq.ativo"),
          sb.get("oficina_tentativas", `mecanico_cpf=eq.${usuario.cpf}`),
          sb.get("mecanicos", `cpf=eq.${usuario.cpf}`),
          sb.get("onboarding_slides", "modulo=eq.oficina&ativo=eq.true&order=ordem.asc"),
        ]);
        setRegras(Array.isArray(regs) ? regs : []);
        const ativos = Array.isArray(qz) ? qz : [];
        const respondidos = new Set((Array.isArray(tent) ? tent : []).map(t => t.quiz_id));
        setQuizzesCount(ativos.filter(q => !respondidos.has(q.id)).length);

        setObSlides(Array.isArray(ob) ? ob : []);
        const mecData = Array.isArray(mecReg) && mecReg.length > 0 ? mecReg[0] : null;
        const done = mecData?.onboarding_completo === true;
        setOnboardingDone(done);
        if (!done && Array.isArray(ob) && ob.length > 0) setTab("onboarding");

        if (Array.isArray(hist) && hist.length > 0) {
          setMsgs(hist.map(m => ({ role: m.role, content: m.content })));
        } else {
          setMsgs([{ role:"assistant", content:`Olá, **${usuario.nome}**! Sou o **BEN**, assistente da Oficina Bendini.\n\nEstou aqui para responder suas dúvidas sobre procedimentos de manutenção, checklists e normas de segurança.\n\nComo posso ajudar?` }]);
        }
      } catch {
        setMsgs([{ role:"assistant", content:`Olá, **${usuario.nome}**! Sou o **BEN** da Oficina.\n\nComo posso ajudar?` }]);
      }
      setLoadingHist(false);
    };
    init();
  }, []);

  const concluirOnboarding = async () => {
    try { await sb.patch("mecanicos", `cpf=eq.${usuario.cpf}`, { onboarding_completo: true }); } catch {}
    setOnboardingDone(true);
    setTab("chat");
  };

  const buildKnowledge = () => {
    let base = `Você é o BEN, Assistente Oficial da Oficina Bendini Logística — agente de treinamento e suporte para mecânicos. Responda sempre em português brasileiro.\n\nTOM: Técnico, preciso e didático. Fale como um mecânico sênior experiente.\n\n`;
    if (regras.length > 0) {
      base += "=== PROCEDIMENTOS E NORMAS DA OFICINA BENDINI ===\n";
      regras.forEach(r => { base += `\n${r.titulo.toUpperCase()}:\n${r.conteudo}\n`; });
    }
    return base;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    setMsgs(p => [...p, { role:"user", content: txt }]);
    setLoading(true);
    try {
      const msgsParaApi = [...msgs.map(m => ({ role: m.role, content: m.content })), { role:"user", content: txt }];
      const res = await api("ai_chat", {
        model: "claude-haiku-4-5-20251001", max_tokens: 1000,
        system: buildKnowledge(), messages: msgsParaApi,
        mecanico: usuario.cpf, historico_table: "oficina_historico"
      });
      const reply = res.content?.[0]?.text || "Não foi possível processar. Tente novamente.";
      setMsgs(p => [...p, { role:"assistant", content: reply }]);
    } catch { setMsgs(p => [...p, { role:"assistant", content:"Erro de conexão. Tente novamente." }]); }
    setLoading(false);
  };

  const TABS = [
    ...(obSlides.length > 0 ? [{ id:"onboarding", label:"Onboarding", badge: !onboardingDone ? "!" : null }] : []),
    { id:"chat", label:"Assistente IA" },
    { id:"quiz", label:"Quiz", badge: quizzesCount > 0 ? quizzesCount : null },
  ];

  if (loadingHist) return (
    <div style={{ minHeight:"100vh", background:C.BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow','Segoe UI',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:13, color:C.MUTED, letterSpacing:2, textTransform:"uppercase", fontWeight:700 }}>Carregando...</div>
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:16 }}>
          {[0,1,2].map(j => <div key={j} style={{ width:8, height:8, borderRadius:"50%", background:"#e67e22", animation:`bpulse 1s ${j*0.22}s infinite` }} />)}
        </div>
      </div>
      <style>{`@keyframes bpulse{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.BG, fontFamily:"'Barlow','Segoe UI',sans-serif", color:C.TEXT, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:C.NAV, borderBottom:`1px solid ${C.BORDER}`, padding:"0 20px", display:"flex", alignItems:"center", height:62, gap:14, flexShrink:0 }}>
        <div style={{ width:3, height:36, background:"#e67e22", flexShrink:0 }} />
        <div>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:2, color:C.WHITE, textTransform:"uppercase", lineHeight:1 }}>Bendini</div>
          <div style={{ fontSize:8, letterSpacing:3.5, color:C.MUTED, textTransform:"uppercase", marginTop:3, fontWeight:600 }}>Oficina</div>
        </div>
        <div style={{ width:1, height:28, background:C.BORDER2, margin:"0 10px" }} />
        <div style={{ fontSize:10, color:C.MUTED2, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase" }}>Agente BEN</div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:11, color:C.MUTED, fontWeight:700 }}>🔧 {usuario.nome}</div>
          <div style={{ width:1, height:16, background:C.BORDER2 }} />
          <button onClick={onSair} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"4px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>Sair</button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ background:C.NAV, borderBottom:`1px solid ${C.BORDER}`, display:"flex", flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setQuizAtivo(null); setQuizRevisando(null); }}
            style={{ flex:1, padding:"13px 4px", background:t.id===tab?C.CARD:"none", border:"none", borderBottom:t.id===tab?"2px solid #e67e22":"2px solid transparent", color:t.id===tab?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", position:"relative" }}>
            {t.label}
            {t.badge && <span style={{ position:"absolute", top:6, right:"calc(50% - 20px)", background:"#e67e22", color:C.WHITE, borderRadius:"50%", width:16, height:16, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {/* CHAT */}
        {tab === "chat" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:10, alignItems:"flex-end" }}>
                  {m.role==="assistant" && <div style={{ width:32, height:32, borderRadius:2, background:"#e67e22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:C.WHITE, flexShrink:0 }}>BEN</div>}
                  <div style={{ maxWidth:"78%", padding:"10px 14px", borderRadius:m.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px", background:m.role==="user"?"#e67e22":C.CARD, border:m.role==="assistant"?`1px solid ${C.BORDER}`:"none", fontSize:14, color:C.TEXT }}>
                    {fmt(m.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:2, background:"#e67e22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:C.WHITE, flexShrink:0 }}>BEN</div>
                  <div style={{ padding:"12px 16px", background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:"10px 10px 10px 2px", display:"flex", gap:5, alignItems:"center" }}>
                    {[0,1,2].map(j => <div key={j} style={{ width:5, height:5, borderRadius:"50%", background:"#e67e22", animation:`bpulse 1s ${j*0.22}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <div style={{ padding:"6px 16px 8px", display:"flex", gap:7, overflowX:"auto", flexShrink:0 }}>
              {["Como fazer revisão preventiva?","Checklist de inspeção do veículo","Normas de segurança na oficina","Troca de óleo — procedimento"].map(q => (
                <button key={q} onClick={() => setInput(q)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"5px 12px", color:C.MUTED, fontSize:10, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, letterSpacing:0.8, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>{q}</button>
              ))}
            </div>
            <div style={{ padding:"10px 16px 12px", borderTop:`1px solid ${C.BORDER}`, display:"flex", gap:8, background:C.NAV, flexShrink:0 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()} placeholder="Digite sua dúvida sobre manutenção..."
                style={{ flex:1, background:C.CARD, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 14px", color:C.TEXT, fontSize:13, outline:"none", fontFamily:"inherit" }} />
              <button onClick={send} disabled={loading||!input.trim()} style={{ background:(!loading&&input.trim())?"#e67e22":C.CARD2, border:"none", borderRadius:2, width:46, cursor:(!loading&&input.trim())?"pointer":"not-allowed", color:(!loading&&input.trim())?C.WHITE:C.MUTED2, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, flexShrink:0 }}>›</button>
            </div>
          </div>
        )}

        {/* ONBOARDING */}
        {tab === "onboarding" && obSlides.length > 0 && (
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:9, color:C.MUTED, letterSpacing:2, textTransform:"uppercase", fontWeight:700 }}>Progresso</span>
              <span style={{ fontSize:9, color:OC, letterSpacing:1, fontWeight:800 }}>{obStep+1} / {obSlides.length}</span>
            </div>
            <div style={{ height:2, background:C.BORDER, borderRadius:1, marginBottom:20 }}>
              <div style={{ height:"100%", width:`${((obStep+1)/obSlides.length)*100}%`, background:OC, transition:"width 0.4s", borderRadius:1 }} />
            </div>
            <div style={{ display:"flex", gap:5, marginBottom:22, flexWrap:"wrap" }}>
              {obSlides.map((_,i) => <div key={i} onClick={() => setObStep(i)} style={{ width:i===obStep?24:8, height:3, background:i<=obStep?OC:C.BORDER2, cursor:"pointer", transition:"all 0.3s", borderRadius:2 }} />)}
            </div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"24px 20px", marginBottom:16 }}>
              <div style={{ fontSize:10, display:"inline-block", background:OC, color:C.WHITE, letterSpacing:2, fontWeight:900, padding:"3px 9px", marginBottom:16, textTransform:"uppercase" }}>{obSlides[obStep].tag}</div>
              <div style={{ fontSize:28, marginBottom:10 }}>{obSlides[obStep].icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:C.WHITE, marginBottom:6, letterSpacing:-0.5, lineHeight:1.2 }}>{obSlides[obStep].title}</div>
              <div style={{ fontSize:11, color:C.MUTED, letterSpacing:1.5, textTransform:"uppercase", fontWeight:700, marginBottom:20 }}>{obSlides[obStep].sub}</div>
              <div style={{ fontSize:14, color:C.TEXT, whiteSpace:"pre-line", lineHeight:1.85 }}>{obSlides[obStep].body}</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setObStep(s => Math.max(0,s-1))} disabled={obStep===0} style={{ flex:1, padding:"13px", background:"none", border:`1px solid ${obStep===0?C.BORDER:C.BORDER2}`, borderRadius:2, color:obStep===0?C.MUTED2:C.MUTED, cursor:obStep===0?"not-allowed":"pointer", fontWeight:800, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>← Anterior</button>
              {obStep < obSlides.length - 1 ? (
                <button onClick={() => setObStep(s => Math.min(obSlides.length-1,s+1))} style={{ flex:2, padding:"13px", background:OC, border:"none", borderRadius:2, color:C.WHITE, cursor:"pointer", fontWeight:900, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Próximo →</button>
              ) : (
                <button onClick={concluirOnboarding} style={{ flex:2, padding:"13px", background:OC, border:"none", borderRadius:2, color:C.WHITE, cursor:"pointer", fontWeight:900, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>✓ Concluir Onboarding</button>
              )}
            </div>
            {onboardingDone && (
              <div style={{ marginTop:16, textAlign:"center", fontSize:11, color:C.GREEN, fontWeight:700 }}>✓ Você já concluiu este onboarding. Pode revisar à vontade.</div>
            )}
          </div>
        )}

        {/* QUIZ */}
        {tab === "quiz" && obSlides.length > 0 && !onboardingDone && (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ background:C.CARD, border:`1px solid ${OC}`, borderRadius:2, padding:32, textAlign:"center", maxWidth:380 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔒</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.WHITE, marginBottom:8 }}>Complete o Onboarding primeiro</div>
              <div style={{ fontSize:13, color:C.MUTED, marginBottom:20, lineHeight:1.6 }}>Antes de responder os quizzes, é necessário concluir o treinamento inicial de onboarding.</div>
              <button onClick={() => setTab("onboarding")} style={{ background:OC, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit", fontWeight:900 }}>Ir para o Onboarding →</button>
            </div>
          </div>
        )}
        {tab === "quiz" && (obSlides.length === 0 || onboardingDone) && !quizAtivo && !quizRevisando && (
          <ListaQuizzesOficina usuario={usuario} onIniciar={setQuizAtivo} onRevisar={setQuizRevisando} />
        )}
        {tab === "quiz" && (obSlides.length === 0 || onboardingDone) && quizAtivo && (
          <QuizOficina quiz={quizAtivo} usuario={usuario} onVoltar={() => setQuizAtivo(null)} />
        )}
        {tab === "quiz" && (obSlides.length === 0 || onboardingDone) && quizRevisando && (
          <RevisaoOficina quiz={quizRevisando} usuario={usuario} onVoltar={() => setQuizRevisando(null)} />
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');@keyframes bpulse{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.NAV}}::-webkit-scrollbar-thumb{background:${C.BORDER2};border-radius:2px}input::placeholder{color:${C.MUTED2}}button:focus{outline:none}`}</style>
    </div>
  );
}

// Lista de quizzes da oficina
function ListaQuizzesOficina({ usuario, onIniciar, onRevisar }) {
  const [quizzes, setQuizzes] = useState([]);
  const [tentativas, setTentativas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sb.get("oficina_quizzes", "status=eq.ativo&order=created_at.desc"),
      sb.get("oficina_tentativas", `mecanico_cpf=eq.${usuario.cpf}&order=created_at.desc`),
    ]).then(([q, t]) => {
      setQuizzes(Array.isArray(q) ? q : []);
      setTentativas(Array.isArray(t) ? t : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Carregando quizzes...</div>;

  const tentPorQuiz = tentativas.reduce((acc, t) => {
    if (!acc[t.quiz_id]) acc[t.quiz_id] = [];
    acc[t.quiz_id].push(t);
    return acc;
  }, {});

  const pendentes = quizzes.filter(q => !tentPorQuiz[q.id]);
  const feitos = quizzes.filter(q => tentPorQuiz[q.id]);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      {pendentes.length > 0 && (
        <>
          <div style={{ fontSize:10, color:"#e67e22", letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:10 }}>🔴 Pendentes ({pendentes.length})</div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden", marginBottom:20 }}>
            {pendentes.map((q, i) => (
              <div key={q.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i<pendentes.length-1?`1px solid ${C.BORDER}`:"none" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div>
                  <div style={{ fontSize:11, color:C.MUTED }}>10 perguntas — Não respondido</div>
                </div>
                <button onClick={() => onIniciar(q)} style={{ background:"#e67e22", border:"none", borderRadius:2, padding:"8px 16px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:1.5, fontWeight:900, textTransform:"uppercase", fontFamily:"inherit" }}>Responder →</button>
              </div>
            ))}
          </div>
        </>
      )}
      {feitos.length > 0 && (
        <>
          <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:10 }}>✓ Respondidos ({feitos.length})</div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {feitos.map((q, i) => {
              const ts = tentPorQuiz[q.id];
              const melhor = Math.max(...ts.map(t => t.percentual));
              return (
                <div key={q.id} style={{ padding:"14px 16px", borderBottom:i<feitos.length-1?`1px solid ${C.BORDER}`:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div>
                      <div style={{ fontSize:11, color:C.MUTED }}>Melhor: {Number(melhor).toFixed(0)}% — {ts.length}x respondido</div>
                    </div>
                    <div style={{ fontSize:18, fontWeight:900, color:melhor>=80?C.GREEN:melhor>=60?C.YELLOW:C.RED }}>{Number(melhor).toFixed(0)}%</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => onRevisar(q)} style={{ flex:1, background:"rgba(230,126,34,0.1)", border:"1px solid rgba(230,126,34,0.4)", borderRadius:2, padding:"8px 12px", color:"#e67e22", cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:800, textTransform:"uppercase", fontFamily:"inherit" }}>📋 Ver Erros</button>
                    <button onClick={() => onIniciar(q)} style={{ flex:1, background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"8px 12px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>↺ Refazer</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {quizzes.length === 0 && (
        <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:32, textAlign:"center", color:C.MUTED, fontSize:13 }}>
          Nenhum quiz disponível ainda. Aguarde o gestor adicionar procedimentos.
        </div>
      )}
    </div>
  );
}

// Quiz da oficina
function QuizOficina({ quiz, usuario, onVoltar }) {
  const [questoes, setQuestoes] = useState([]);
  const [qi, setQi] = useState(0);
  const [qsel, setQsel] = useState(null);
  const [qshow, setQshow] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.get("oficina_questoes", `quiz_id=eq.${quiz.id}&order=ordem.asc`).then(d => {
      console.log("oficina_questoes:", JSON.stringify(d));
      setQuestoes(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(e => {
      console.error("Erro ao carregar questoes oficina:", e);
      setLoading(false);
    });
  }, [quiz.id]);

  const answer = async (letra) => {
    if (qsel) return;
    const q = questoes[qi];
    setQsel(letra);
    setQshow(true);
    const acertou = letra === q.correta;
    if (acertou) setScore(s => s + 1);
    try {
      await sb.post("oficina_respostas", {
        mecanico_nome: usuario.nome, quiz_titulo: quiz.titulo,
        questao_id: q.id || null, pergunta: q.pergunta,
        resposta_dada: letra, correta: q.correta, acertou,
      });
    } catch {}
  };

  const next = async () => {
    if (qi + 1 >= questoes.length) {
      const finalScore = score + (qsel === questoes[qi]?.correta ? 1 : 0);
      const pct = (finalScore / questoes.length) * 100;
      await sb.post("oficina_tentativas", {
        quiz_id: quiz.id, mecanico_cpf: usuario.cpf,
        mecanico_nome: usuario.nome, score: finalScore,
        total: questoes.length, percentual: pct,
      });
      setDone(true);
    } else {
      setQi(i => i + 1); setQsel(null); setQshow(false);
    }
  };

  const finalScore = done ? score : score + (qsel === questoes[qi]?.correta ? 1 : 0);
  const pct = questoes.length > 0 ? (finalScore / questoes.length) * 100 : 0;

  if (loading) return <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ color:C.MUTED, fontSize:13 }}>Carregando questões...</div></div>;

  // Proteção: sem questões carregadas
  if (!questoes.length) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:32, textAlign:"center", maxWidth:360 }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:14, fontWeight:700, color:C.WHITE, marginBottom:8 }}>Questões não encontradas</div>
        <div style={{ fontSize:13, color:C.MUTED, marginBottom:20, lineHeight:1.6 }}>Este quiz ainda não tem questões cadastradas. Fale com o gestor.</div>
        <button onClick={onVoltar} style={{ background:"#e67e22", border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit", fontWeight:900 }}>← Voltar</button>
      </div>
    </div>
  );

  if (done) return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:32, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>{pct>=80?"🏆":pct>=60?"👍":"📚"}</div>
        <div style={{ fontSize:9, color:"#e67e22", letterSpacing:2.5, fontWeight:900, textTransform:"uppercase", marginBottom:12 }}>Resultado</div>
        <div style={{ fontSize:48, fontWeight:900, color:C.WHITE, lineHeight:1 }}>{finalScore}<span style={{ fontSize:20, color:C.MUTED }}> /{questoes.length}</span></div>
        <div style={{ fontSize:22, fontWeight:900, color:pct>=80?C.GREEN:pct>=60?C.YELLOW:C.RED, marginTop:6 }}>{pct.toFixed(0)}%</div>
        <div style={{ fontSize:13, color:C.MUTED, marginTop:14, marginBottom:24 }}>{pct>=80?"Excelente!":pct>=60?"Bom resultado. Revise os pontos errados.":"Revise o procedimento e tente novamente."}</div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={onVoltar} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 20px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>← Voltar</button>
          <button onClick={() => { setQi(0); setQsel(null); setQshow(false); setScore(0); setDone(false); }} style={{ background:"#e67e22", border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit", fontWeight:900 }}>↺ Refazer</button>
        </div>
      </div>
    </div>
  );

  const q = questoes[qi] || {};
  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      <button onClick={onVoltar} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"5px 12px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit", marginBottom:16 }}>← Voltar</button>
      <div style={{ fontSize:11, color:C.MUTED, marginBottom:4 }}>{quiz.titulo}</div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:9, color:C.MUTED, letterSpacing:2, fontWeight:800, textTransform:"uppercase" }}>Pergunta {qi+1} de {questoes.length}</span>
        <span style={{ fontSize:9, color:C.GREEN, letterSpacing:1, fontWeight:800 }}>{score} corretas</span>
      </div>
      <div style={{ height:2, background:C.BORDER, borderRadius:1, marginBottom:22 }}>
        <div style={{ height:"100%", width:`${(qi/questoes.length)*100}%`, background:"#e67e22", borderRadius:1 }} />
      </div>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"20px 18px", marginBottom:14 }}>
        <div style={{ fontSize:9, color:"#e67e22", letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:12 }}>Questão {qi+1}</div>
        <div style={{ fontSize:16, fontWeight:700, lineHeight:1.5, color:C.WHITE }}>{q.pergunta}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
        {["a","b","c","d"].map(l => {
          const isC = l === q.correta, isSel = l === qsel;
          let bg=C.CARD, border=`1px solid ${C.BORDER}`, color=C.TEXT;
          if (qshow) {
            if (isC) { bg="rgba(46,204,113,0.07)"; border="1px solid #2ecc71"; color="#2ecc71"; }
            else if (isSel) { bg="rgba(230,126,34,0.08)"; border="1px solid #e67e22"; color="#f0a060"; }
          }
          return (
            <button key={l} onClick={() => answer(l)} style={{ background:bg, border, borderRadius:2, padding:"12px 16px", color, textAlign:"left", cursor:qsel?"default":"pointer", fontSize:14, lineHeight:1.4, width:"100%", fontFamily:"inherit" }}>
              <span style={{ fontWeight:900, marginRight:10, color:C.MUTED2, fontSize:12 }}>{l.toUpperCase()}.</span>{q[`opcao_${l}`]}
            </button>
          );
        })}
      </div>
      {qshow && (
        <>
          <div style={{ background:qsel===q.correta?"rgba(46,204,113,0.07)":"rgba(230,126,34,0.08)", border:`1px solid ${qsel===q.correta?"#2ecc71":"#e67e22"}`, borderRadius:2, padding:"12px 14px", marginBottom:14, fontSize:13, color:qsel===q.correta?"#2ecc71":"#f0a060", lineHeight:1.65 }}>
            {qsel===q.correta?"✓ Correto — ":"✗ Incorreto — "}{q.explicacao}
          </div>
          <button onClick={next} style={{ width:"100%", padding:"14px", background:"#e67e22", border:"none", borderRadius:2, color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
            {qi+1>=questoes.length?"Ver Resultado":"Próxima →"}
          </button>
        </>
      )}
    </div>
  );
}

// Revisão de erros da oficina
function RevisaoOficina({ quiz, usuario, onVoltar }) {
  const [respostas, setRespostas] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sb.get("oficina_respostas", `mecanico_nome=eq.${encodeURIComponent(usuario.nome)}&quiz_titulo=eq.${encodeURIComponent(quiz.titulo)}&order=created_at.desc&limit=100`),
      sb.get("oficina_questoes", `quiz_id=eq.${quiz.id}&order=ordem.asc`),
    ]).then(([r, q]) => {
      setRespostas(Array.isArray(r) ? r : []);
      setQuestoes(Array.isArray(q) ? q : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Carregando revisão...</div>;

  const ultimaResposta = {};
  respostas.forEach(r => { if (!ultimaResposta[r.questao_id]) ultimaResposta[r.questao_id] = r; });
  const erros = Object.values(ultimaResposta).filter(r => !r.acertou);
  const acertos = Object.values(ultimaResposta).filter(r => r.acertou);
  const total = Object.values(ultimaResposta).length;
  const pct = total > 0 ? Math.round((acertos.length / total) * 100) : 0;
  const semDados = respostas.length === 0;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      <button onClick={onVoltar} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"6px 14px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit", marginBottom:16 }}>← Voltar</button>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ fontSize:10, color:"#e67e22", letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:4 }}>Revisão</div>
        <div style={{ fontSize:17, fontWeight:900, color:C.WHITE, marginBottom:12 }}>{quiz.titulo}</div>
        {!semDados && (
          <div style={{ display:"flex", gap:20 }}>
            {[{v:`${pct}%`,l:"Aproveitamento",cor:pct>=80?C.GREEN:pct>=60?C.YELLOW:C.RED},{v:acertos.length,l:"Acertos",cor:C.GREEN},{v:erros.length,l:"Erros",cor:C.RED}].map(x => (
              <div key={x.l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:24, fontWeight:900, color:x.cor }}>{x.v}</div>
                <div style={{ fontSize:10, color:C.MUTED, letterSpacing:1, textTransform:"uppercase" }}>{x.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {semDados ? (
        <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:24, textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
          <div style={{ fontSize:14, color:C.WHITE, fontWeight:700, marginBottom:6 }}>Gabarito das questões</div>
          <div style={{ fontSize:12, color:C.MUTED, marginBottom:20, lineHeight:1.6 }}>Refaça o quiz para ver seus erros em detalhes.</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, textAlign:"left" }}>
            {questoes.map((q, i) => (
              <div key={q.id} style={{ background:C.NAV, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"12px 14px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.WHITE, marginBottom:8 }}>#{i+1} {q.pergunta}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {["a","b","c","d"].map(l => (
                    <div key={l} style={{ padding:"4px 10px", borderRadius:2, background:q.correta===l?"rgba(46,204,113,0.1)":C.CARD, border:`1px solid ${q.correta===l?"#2ecc71":C.BORDER}`, fontSize:12, color:q.correta===l?"#2ecc71":C.MUTED }}>
                      <span style={{ fontWeight:900 }}>{l.toUpperCase()}.</span> {q[`opcao_${l}`]} {q.correta===l && "✓"}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {erros.length > 0 && (
            <>
              <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:4 }}>✗ O que você errou ({erros.length})</div>
              {erros.map((r, i) => {
                const q = questoes.find(q => q.id === r.questao_id) || {};
                return (
                  <div key={i} style={{ background:C.CARD, border:"1px solid rgba(192,57,43,0.4)", borderRadius:2, padding:"14px 16px" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.WHITE, marginBottom:12, lineHeight:1.5 }}>{r.pergunta}</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
                      {["a","b","c","d"].map(l => {
                        const isCorreta = l === r.correta, isErrada = l === r.resposta_dada;
                        if (!isCorreta && !isErrada) return null;
                        return (
                          <div key={l} style={{ padding:"8px 12px", borderRadius:2, background:isCorreta?"rgba(46,204,113,0.08)":"rgba(192,57,43,0.08)", border:`1px solid ${isCorreta?"#2ecc71":C.RED}`, fontSize:13, color:isCorreta?"#2ecc71":"#e07070", display:"flex", gap:8, alignItems:"center" }}>
                            <span style={{ fontWeight:900, fontSize:11 }}>{l.toUpperCase()}.</span>
                            <span style={{ flex:1 }}>{q[`opcao_${l}`] || ""}</span>
                            <span style={{ fontSize:10, fontWeight:900 }}>{isCorreta?"✓ Correta":"✗ Sua resposta"}</span>
                          </div>
                        );
                      })}
                    </div>
                    {q.explicacao && <div style={{ fontSize:12, color:C.MUTED, lineHeight:1.6, fontStyle:"italic" }}>💡 {q.explicacao}</div>}
                  </div>
                );
              })}
            </>
          )}
          {acertos.length > 0 && (
            <>
              <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginTop:8, marginBottom:4 }}>✓ O que você acertou ({acertos.length})</div>
              {acertos.map((r, i) => (
                <div key={i} style={{ background:C.CARD, border:"1px solid rgba(46,204,113,0.2)", borderRadius:2, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(46,204,113,0.15)", border:"1px solid #2ecc71", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#2ecc71", flexShrink:0 }}>✓</div>
                  <div style={{ fontSize:13, color:C.TEXT, lineHeight:1.5 }}>{r.pergunta}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// PAINEL ADM — ABA OFICINA
// ══════════════════════════════════════════════════
function PainelOficinaAdm({ showMsg }) {
  const [subAba, setSubAba] = useState("mecanicos");
  const [mecanicos, setMecanicos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [regras, setRegras] = useState([]);
  const [novoCpf, setNovoCpf] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novaRegra, setNovaRegra] = useState({ titulo:"", conteudo:"" });
  const [editandoRegra, setEditandoRegra] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [quizDetalhe, setQuizDetalhe] = useState(null);
  const [quizView, setQuizView] = useState("respostas");
  const [tentativas, setTentativas] = useState([]);
  const [mecList, setMecList] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [editandoQuestao, setEditandoQuestao] = useState(null);
  const [novaQuestao, setNovaQuestao] = useState({ pergunta:"", opcao_a:"", opcao_b:"", opcao_c:"", opcao_d:"", correta:"a", explicacao:"" });
  const [addingQuestao, setAddingQuestao] = useState(false);

  useEffect(() => { carregarOficina(); }, [subAba]);

  const carregarOficina = async () => {
    setLoading(true);
    try {
      if (subAba === "mecanicos") {
        const d = await sb.get("mecanicos", "order=nome.asc");
        console.log("mecanicos:", d);
        setMecanicos(Array.isArray(d) ? d : []);
      } else if (subAba === "quizzes") {
        const [q, m] = await Promise.all([
          sb.get("oficina_quizzes", "order=created_at.desc"),
          sb.get("mecanicos", "ativo=eq.true&order=nome.asc"),
        ]);
        setQuizzes(Array.isArray(q) ? q : []);
        setMecList(Array.isArray(m) ? m : []);
      } else if (subAba === "regras") {
        const d = await sb.get("oficina_regras", "order=ordem.asc");
        setRegras(Array.isArray(d) ? d : []);
      }
    } catch (e) { console.error("carregarOficina erro:", e); }
    setLoading(false);
  };

  const adicionarMecanico = async () => {
    const c = cleanCPF(novoCpf);
    if (c.length !== 11 || !novoNome.trim()) { showMsg("Preencha CPF e nome.", C.RED); return; }
    try {
      const resultado = await sb.post("mecanicos", { cpf: c, nome: novoNome.trim() });
      console.log("POST mecanicos resultado:", JSON.stringify(resultado));
      // Verifica se realmente salvou (Supabase retorna array com o item criado)
      if (Array.isArray(resultado) && resultado.length > 0) {
        setNovoCpf(""); setNovoNome("");
        showMsg("Mecânico cadastrado!");
        // Força reload buscando direto
        const lista = await sb.get("mecanicos", "order=nome.asc");
        setMecanicos(Array.isArray(lista) ? lista : []);
      } else if (resultado?.message || resultado?.error) {
        showMsg(`Erro: ${resultado.message || resultado.error}`, C.RED);
      } else {
        showMsg("Erro ao cadastrar. Verifique o console.", C.RED);
        console.error("Resposta inesperada:", resultado);
      }
    } catch (e) {
      showMsg("Erro de conexão.", C.RED);
      console.error("adicionarMecanico erro:", e);
    }
  };

  const toggleMecanico = async (id, ativo) => {
    await sb.patch("mecanicos", `id=eq.${id}`, { ativo: !ativo });
    carregarOficina();
  };

  const salvarRegra = async () => {
    if (!novaRegra.titulo.trim() || !novaRegra.conteudo.trim()) { showMsg("Preencha título e conteúdo.", C.RED); return; }
    if (editandoRegra) {
      await sb.patch("oficina_regras", `id=eq.${editandoRegra}`, { titulo: novaRegra.titulo, conteudo: novaRegra.conteudo, updated_at: new Date().toISOString() });
      setEditandoRegra(null);
      showMsg("Procedimento atualizado!");
    } else {
      const result = await sb.post("oficina_regras", { titulo: novaRegra.titulo, conteudo: novaRegra.conteudo, ordem: regras.length, ativo: true });
      const regra = Array.isArray(result) ? result[0] : result;
      showMsg("Procedimento salvo! Gerando quiz...", C.YELLOW);
      setGerando(true);
      try {
        const qr = await api("gerar_quiz_oficina", { regra_id: regra.id, titulo: novaRegra.titulo, conteudo: novaRegra.conteudo });
        if (qr.ok) showMsg(`Quiz gerado com ${qr.total} perguntas! ✓`);
        else showMsg("Procedimento salvo, mas erro ao gerar quiz.", C.YELLOW);
      } catch { showMsg("Procedimento salvo, mas erro ao gerar quiz.", C.YELLOW); }
      setGerando(false);
    }
    setNovaRegra({ titulo:"", conteudo:"" });
    carregarOficina();
  };

  const verDetalheQuiz = async (quiz) => {
    setQuizDetalhe(quiz);
    setQuizView("respostas");
    setEditandoQuestao(null);
    setAddingQuestao(false);
    const [t, q] = await Promise.all([
      sb.get("oficina_tentativas", `quiz_id=eq.${quiz.id}&order=created_at.desc`),
      sb.get("oficina_questoes", `quiz_id=eq.${quiz.id}&order=ordem.asc`),
    ]);
    setTentativas(Array.isArray(t) ? t : []);
    setQuestoes(Array.isArray(q) ? q : []);
  };

  const salvarQuestao = async () => {
    const dados = editandoQuestao || novaQuestao;
    if (!dados.pergunta.trim()) { showMsg("Digite a pergunta.", C.RED); return; }
    try {
      if (editandoQuestao) {
        await sb.patch("oficina_questoes", `id=eq.${editandoQuestao.id}`, {
          pergunta: editandoQuestao.pergunta, opcao_a: editandoQuestao.opcao_a,
          opcao_b: editandoQuestao.opcao_b, opcao_c: editandoQuestao.opcao_c,
          opcao_d: editandoQuestao.opcao_d, correta: editandoQuestao.correta,
          explicacao: editandoQuestao.explicacao,
        });
        showMsg("Questão atualizada!");
        setEditandoQuestao(null);
      } else {
        await sb.post("oficina_questoes", {
          quiz_id: quizDetalhe.id, pergunta: novaQuestao.pergunta,
          opcao_a: novaQuestao.opcao_a, opcao_b: novaQuestao.opcao_b,
          opcao_c: novaQuestao.opcao_c, opcao_d: novaQuestao.opcao_d,
          correta: novaQuestao.correta, explicacao: novaQuestao.explicacao,
          ordem: questoes.length + 1,
        });
        showMsg("Questão adicionada!");
        setNovaQuestao({ pergunta:"", opcao_a:"", opcao_b:"", opcao_c:"", opcao_d:"", correta:"a", explicacao:"" });
        setAddingQuestao(false);
      }
      const q2 = await sb.get("oficina_questoes", `quiz_id=eq.${quizDetalhe.id}&order=ordem.asc`);
      setQuestoes(Array.isArray(q2) ? q2 : []);
    } catch { showMsg("Erro ao salvar questão.", C.RED); }
  };

  const excluirQuestao = async (id) => {
    if (!window.confirm("Excluir esta questão?")) return;
    await sb.delete("oficina_questoes", `id=eq.${id}`);
    showMsg("Questão excluída.");
    const q = await sb.get("oficina_questoes", `quiz_id=eq.${quizDetalhe.id}&order=ordem.asc`);
    setQuestoes(Array.isArray(q) ? q : []);
  };

  const OC = "#e67e22";
  const SUBS = [
    { id:"mecanicos", label:"Mecânicos" },
    { id:"quizzes",   label:"Quizzes" },
    { id:"regras",    label:"Procedimentos" },
  ];

  return (
    <div>
      {/* Sub-abas */}
      <div style={{ display:"flex", gap:0, marginBottom:20, background:C.NAV, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
        {SUBS.map(s => (
          <button key={s.id} onClick={() => { setSubAba(s.id); setQuizDetalhe(null); }}
            style={{ flex:1, padding:"11px 8px", background:subAba===s.id?C.CARD:"none", border:"none", borderBottom:subAba===s.id?`2px solid ${OC}`:"2px solid transparent", color:subAba===s.id?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* MECÂNICOS */}
      {subAba === "mecanicos" && (
        <div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:20, marginBottom:20 }}>
            <div style={{ fontSize:10, color:OC, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>Cadastrar Mecânico</div>
            <input value={novoCpf} onChange={e => setNovoCpf(formatCPF(e.target.value))} placeholder="CPF — 000.000.000-00"
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:8, letterSpacing:1 }} />
            <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome completo"
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:12 }} />
            <button onClick={adicionarMecanico} style={{ background:OC, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>+ Cadastrar</button>
          </div>
          <div style={{ fontSize:10, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>{mecanicos.length} mecânicos</div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {loading ? <div style={{ padding:20, color:C.MUTED }}>Carregando...</div> :
              mecanicos.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhum mecânico cadastrado.</div> :
              mecanicos.map((m, i) => (
                <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:i<mecanicos.length-1?`1px solid ${C.BORDER}`:"none" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:m.ativo?C.WHITE:C.MUTED }}>{m.nome}</div>
                    <div style={{ fontSize:11, color:C.MUTED }}>{formatCPF(m.cpf)}</div>
                  </div>
                  <div style={{ fontSize:9, color:m.ativo?C.GREEN:C.RED, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>{m.ativo?"Ativo":"Inativo"}</div>
                  <button onClick={() => toggleMecanico(m.id, m.ativo)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"4px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>
                    {m.ativo?"Desativar":"Ativar"}
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* QUIZZES OFICINA */}
      {subAba === "quizzes" && !quizDetalhe && (
        <div>
          <div style={{ fontSize:10, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>{quizzes.length} quizzes da oficina</div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {loading ? <div style={{ padding:20, color:C.MUTED }}>Carregando...</div> :
              quizzes.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhum quiz ainda. Adicione procedimentos para gerar quizzes.</div> :
              quizzes.map((q, i) => (
                <div key={q.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i<quizzes.length-1?`1px solid ${C.BORDER}`:"none" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div>
                    <div style={{ fontSize:11, color:C.MUTED }}>{new Date(q.created_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <button onClick={() => verDetalheQuiz(q)} style={{ background:OC, border:"none", borderRadius:2, padding:"6px 14px", color:C.WHITE, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>Ver Respostas</button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* DETALHE QUIZ OFICINA */}
      {subAba === "quizzes" && quizDetalhe && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <button onClick={() => { setQuizDetalhe(null); setEditandoQuestao(null); setAddingQuestao(false); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"6px 14px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>← Voltar</button>
            <div style={{ flex:1, fontSize:16, fontWeight:900, color:C.WHITE }}>{quizDetalhe.titulo}</div>
          </div>

          <div style={{ display:"flex", gap:0, marginBottom:20, background:C.NAV, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {[{id:"respostas",label:`📊 Respostas (${tentativas.length})`},{id:"questoes",label:`✏️ Questões (${questoes.length})`}].map(v => (
              <button key={v.id} onClick={() => { setQuizView(v.id); setEditandoQuestao(null); setAddingQuestao(false); }}
                style={{ flex:1, padding:"11px 8px", background:quizView===v.id?C.CARD:"none", border:"none", borderBottom:quizView===v.id?`2px solid ${OC}`:"2px solid transparent", color:quizView===v.id?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>
                {v.label}
              </button>
            ))}
          </div>

          {quizView === "respostas" && (
            <div>
              <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>✓ Responderam ({tentativas.length})</div>
              <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden", marginBottom:16 }}>
                {tentativas.length === 0 ? <div style={{ padding:16, color:C.MUTED, fontSize:13 }}>Nenhum mecânico respondeu ainda.</div> :
                  tentativas.map((t, i) => (
                    <div key={t.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderBottom:i<tentativas.length-1?`1px solid ${C.BORDER}`:"none" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.WHITE }}>{t.mecanico_nome}</div>
                        <div style={{ fontSize:11, color:C.MUTED }}>{formatCPF(t.mecanico_cpf)} — {new Date(t.created_at).toLocaleDateString("pt-BR")}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:16, fontWeight:900, color:t.percentual>=80?C.GREEN:t.percentual>=60?C.YELLOW:C.RED }}>{Number(t.percentual).toFixed(0)}%</div>
                        <div style={{ fontSize:10, color:C.MUTED }}>{t.score}/{t.total}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
              {(() => {
                const responderam = new Set(tentativas.map(t => t.mecanico_cpf));
                const pendentes = mecList.filter(m => !responderam.has(m.cpf));
                return (
                  <>
                    <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>✗ Pendentes ({pendentes.length})</div>
                    <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
                      {pendentes.length === 0 ? <div style={{ padding:16, color:C.GREEN, fontSize:13, fontWeight:700 }}>✓ Todos responderam!</div> :
                        pendentes.map((m, i) => (
                          <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:i<pendentes.length-1?`1px solid ${C.BORDER}`:"none" }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:C.RED, flexShrink:0 }} />
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:700, color:C.WHITE }}>{m.nome}</div>
                              <div style={{ fontSize:11, color:C.MUTED }}>{formatCPF(m.cpf)}</div>
                            </div>
                            <div style={{ fontSize:9, color:C.RED, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>Pendente</div>
                          </div>
                        ))
                      }
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {quizView === "questoes" && (
            <div>
              {(editandoQuestao || addingQuestao) && (() => {
                const q = editandoQuestao || novaQuestao;
                const setQ = editandoQuestao
                  ? (field, val) => setEditandoQuestao(p => ({...p, [field]:val}))
                  : (field, val) => setNovaQuestao(p => ({...p, [field]:val}));
                return (
                  <div style={{ background:C.CARD, border:`2px solid ${OC}`, borderRadius:2, padding:20, marginBottom:20 }}>
                    <div style={{ fontSize:10, color:OC, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>
                      {editandoQuestao ? "✏️ Editar Questão" : "➕ Nova Questão"}
                    </div>
                    <textarea value={q.pergunta} onChange={e => setQ("pergunta", e.target.value)} placeholder="Texto da pergunta..." rows={2}
                      style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:10, resize:"vertical", lineHeight:1.5 }} />
                    {["a","b","c","d"].map(l => (
                      <div key={l} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                        <div style={{ width:24, height:24, borderRadius:2, background:q.correta===l?OC:C.BORDER2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:C.WHITE, flexShrink:0, cursor:"pointer" }}
                          onClick={() => setQ("correta", l)}>{l.toUpperCase()}</div>
                        <input value={q[`opcao_${l}`]} onChange={e => setQ(`opcao_${l}`, e.target.value)} placeholder={`Opção ${l.toUpperCase()}`}
                          style={{ flex:1, background:q.correta===l?"rgba(230,126,34,0.08)":C.NAV, border:`1px solid ${q.correta===l?OC:C.BORDER2}`, borderRadius:2, padding:"8px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit" }} />
                        {q.correta===l && <span style={{ fontSize:9, color:OC, fontWeight:900, letterSpacing:1 }}>✓ CORRETA</span>}
                      </div>
                    ))}
                    <textarea value={q.explicacao} onChange={e => setQ("explicacao", e.target.value)} placeholder="Explicação da resposta correta (opcional)..." rows={2}
                      style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", marginTop:4, marginBottom:14, resize:"vertical", lineHeight:1.5 }} />
                    <div style={{ fontSize:11, color:C.MUTED, marginBottom:12 }}>Clique na letra para definir a resposta correta.</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={salvarQuestao} style={{ background:OC, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
                        {editandoQuestao ? "Salvar Alteração" : "Adicionar Questão"}
                      </button>
                      <button onClick={() => { setEditandoQuestao(null); setAddingQuestao(false); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 16px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Cancelar</button>
                    </div>
                  </div>
                );
              })()}

              {!editandoQuestao && !addingQuestao && (
                <button onClick={() => setAddingQuestao(true)} style={{ background:"none", border:`1px dashed ${OC}`, borderRadius:2, padding:"10px 20px", color:OC, cursor:"pointer", fontSize:10, letterSpacing:2, fontWeight:800, textTransform:"uppercase", fontFamily:"inherit", width:"100%", marginBottom:16 }}>
                  + Adicionar Nova Questão
                </button>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {questoes.length === 0
                  ? <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:20, color:C.MUTED, fontSize:13 }}>Nenhuma questão cadastrada.</div>
                  : questoes.map((q, i) => (
                    <div key={q.id} style={{ background:editandoQuestao?.id===q.id?C.CARD2:C.CARD, border:`1px solid ${editandoQuestao?.id===q.id?OC:C.BORDER}`, borderRadius:2, padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                        <div style={{ fontSize:10, color:C.MUTED, fontWeight:800, letterSpacing:1, minWidth:22, paddingTop:2 }}>#{i+1}</div>
                        <div style={{ flex:1, fontSize:14, fontWeight:700, color:C.WHITE, lineHeight:1.5 }}>{q.pergunta}</div>
                        <button onClick={() => { setEditandoQuestao({...q}); setAddingQuestao(false); window.scrollTo(0,0); }}
                          style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"3px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit", flexShrink:0 }}>Editar</button>
                        <button onClick={() => excluirQuestao(q.id)}
                          style={{ background:"none", border:`1px solid rgba(192,57,43,0.4)`, borderRadius:2, padding:"3px 10px", color:C.RED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit", flexShrink:0 }}>Excluir</button>
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6, paddingLeft:32 }}>
                        {["a","b","c","d"].map(l => (
                          <div key={l} style={{ padding:"4px 10px", borderRadius:2, background:q.correta===l?"rgba(46,204,113,0.1)":C.NAV, border:`1px solid ${q.correta===l?"#2ecc71":C.BORDER}`, fontSize:12, color:q.correta===l?"#2ecc71":C.MUTED, display:"flex", gap:6, alignItems:"center" }}>
                            <span style={{ fontWeight:900, fontSize:10 }}>{l.toUpperCase()}.</span> {q[`opcao_${l}`] || "—"}
                            {q.correta===l && <span style={{ fontSize:9, fontWeight:900 }}>✓</span>}
                          </div>
                        ))}
                      </div>
                      {q.explicacao && (
                        <div style={{ marginTop:8, paddingLeft:32, fontSize:12, color:C.MUTED, fontStyle:"italic", lineHeight:1.5 }}>💡 {q.explicacao}</div>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROCEDIMENTOS */}
      {subAba === "regras" && (
        <div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:20, marginBottom:20 }}>
            <div style={{ fontSize:10, color:OC, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>
              {editandoRegra ? "Editar Procedimento" : "Novo Procedimento"}
            </div>
            {!editandoRegra && (
              <div style={{ fontSize:12, color:C.YELLOW, marginBottom:12, lineHeight:1.5 }}>
                ⚡ Ao salvar, a IA gera automaticamente 10 perguntas de quiz para os mecânicos.
              </div>
            )}
            <input value={novaRegra.titulo} onChange={e => setNovaRegra(p => ({...p, titulo:e.target.value}))} placeholder="Título do procedimento"
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:8 }} />
            <textarea value={novaRegra.conteudo} onChange={e => setNovaRegra(p => ({...p, conteudo:e.target.value}))} placeholder="Descreva o procedimento, checklist ou norma..." rows={4}
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", marginBottom:12, resize:"vertical", lineHeight:1.6 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={salvarRegra} disabled={gerando} style={{ background:gerando?C.CARD2:OC, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:gerando?"not-allowed":"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
                {gerando?"Gerando quiz...":editandoRegra?"Salvar Edição":"+ Salvar e Gerar Quiz"}
              </button>
              {editandoRegra && (
                <button onClick={() => { setEditandoRegra(null); setNovaRegra({titulo:"",conteudo:""}); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 16px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Cancelar</button>
              )}
            </div>
          </div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {loading ? <div style={{ padding:20, color:C.MUTED }}>Carregando...</div> :
              regras.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhum procedimento cadastrado.</div> :
              regras.map((r, i) => (
                <div key={r.id} style={{ padding:"14px 16px", borderBottom:i<regras.length-1?`1px solid ${C.BORDER}`:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                    <div style={{ flex:1, fontSize:14, fontWeight:800, color:C.WHITE }}>{r.titulo}</div>
                    <button onClick={() => { setEditandoRegra(r.id); setNovaRegra({titulo:r.titulo, conteudo:r.conteudo}); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"3px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>Editar</button>
                    <button onClick={async () => { await sb.delete("oficina_regras", `id=eq.${r.id}`); showMsg("Procedimento excluído."); carregarOficina(); }} style={{ background:"none", border:"1px solid rgba(192,57,43,0.4)", borderRadius:2, padding:"3px 10px", color:C.RED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>Excluir</button>
                  </div>
                  <div style={{ fontSize:13, color:C.MUTED, lineHeight:1.6, whiteSpace:"pre-line" }}>{r.conteudo}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// MÓDULO PROGRAMADORES OPERACIONAIS
// ══════════════════════════════════════════════════
function ModuloProg({ usuario, onSair }) {
  const [tab, setTab] = useState("chat");
  const [msgs, setMsgs] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [regras, setRegras] = useState([]);
  const [quizAtivo, setQuizAtivo] = useState(null);
  const [quizRevisando, setQuizRevisando] = useState(null);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [showSugestao, setShowSugestao] = useState(false);
  const [sugestao, setSugestao] = useState({ titulo:"", conteudo:"" });
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);
  const [msgSugestao, setMsgSugestao] = useState("");
  const [onboardingDone, setOnboardingDone] = useState(true); // assume true até checar no banco
  const [obStep, setObStep] = useState(0);
  const [obSlides, setObSlides] = useState([]);
  const endRef = useRef(null);
  const PC = "#1a7a4a"; // verde para programadores

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  useEffect(() => {
    const init = async () => {
      try {
        const [hist, regs, qz, tent, progReg, ob] = await Promise.all([
          sb.get("prog_historico", `programador_cpf=eq.${encodeURIComponent(usuario.cpf)}&order=created_at.asc&limit=100`),
          sb.get("prog_regras", "ativo=eq.true&order=ordem.asc"),
          sb.get("prog_quizzes", "status=eq.ativo"),
          sb.get("prog_tentativas", `programador_cpf=eq.${usuario.cpf}`),
          sb.get("programadores", `cpf=eq.${usuario.cpf}`),
          sb.get("onboarding_slides", "modulo=eq.programador&ativo=eq.true&order=ordem.asc"),
        ]);
        setObSlides(Array.isArray(ob) ? ob : []);
        setRegras(Array.isArray(regs) ? regs : []);
        const ativos = Array.isArray(qz) ? qz : [];
        const respondidos = new Set((Array.isArray(tent) ? tent : []).map(t => t.quiz_id));
        setQuizzesCount(ativos.filter(q => !respondidos.has(q.id)).length);

        // Verifica se já concluiu o onboarding
        const progData = Array.isArray(progReg) && progReg.length > 0 ? progReg[0] : null;
        const done = progData?.onboarding_completo === true;
        setOnboardingDone(done);
        if (!done) setTab("onboarding");

        if (Array.isArray(hist) && hist.length > 0) {
          setMsgs(hist.map(m => ({ role: m.role, content: m.content })));
        } else {
          setMsgs([{ role:"assistant", content:`Olá, **${usuario.nome}**! Sou o **BEN**, assistente operacional da Bendini.\n\nEstou treinado em todos os procedimentos internos e regras de clientes. Pode me perguntar sobre qualquer operação, cliente ou processo.\n\nComo posso ajudar?` }]);
        }
      } catch {
        setMsgs([{ role:"assistant", content:`Olá, **${usuario.nome}**! Sou o **BEN** Operacional.\n\nComo posso ajudar?` }]);
      }
      setLoadingHist(false);
    };
    init();
  }, []);

  const concluirOnboarding = async () => {
    try {
      await sb.patch("programadores", `cpf=eq.${usuario.cpf}`, { onboarding_completo: true });
    } catch {}
    setOnboardingDone(true);
    setTab("chat");
  };

  const buildKnowledge = () => {
    let base = `Você é o BEN, Assistente Operacional da Bendini Logística — especialista em programação de cargas, regras de clientes e procedimentos internos. Responda sempre em português brasileiro.\n\nTOM: Técnico, preciso e objetivo. Fale como um especialista operacional sênior.\n\nQuando perguntado sobre regras de um cliente específico, busque nas regras cadastradas e responda com base nelas. Se não houver regra cadastrada para o cliente, informe que não há procedimento registrado ainda.\n\n`;
    if (regras.length > 0) {
      base += "=== PROCEDIMENTOS OPERACIONAIS E REGRAS DE CLIENTES ===\n";
      regras.forEach(r => { base += `\n${r.titulo.toUpperCase()}:\n${r.conteudo}\n`; });
    }
    return base;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    setMsgs(p => [...p, { role:"user", content: txt }]);
    setLoading(true);
    try {
      const msgsParaApi = [...msgs.map(m => ({ role: m.role, content: m.content })), { role:"user", content: txt }];
      const res = await api("ai_chat", {
        model: "claude-haiku-4-5-20251001", max_tokens: 1500,
        system: buildKnowledge(), messages: msgsParaApi,
        mecanico: usuario.cpf, historico_table: "prog_historico"
      });
      const reply = res.content?.[0]?.text || "Não foi possível processar. Tente novamente.";
      setMsgs(p => [...p, { role:"assistant", content: reply }]);
    } catch { setMsgs(p => [...p, { role:"assistant", content:"Erro de conexão. Tente novamente." }]); }
    setLoading(false);
  };

  const enviarSugestao = async () => {
    if (!sugestao.titulo.trim() || !sugestao.conteudo.trim()) { setMsgSugestao("Preencha título e conteúdo."); return; }
    setEnviandoSugestao(true);
    try {
      await sb.post("prog_sugestoes", {
        programador_cpf: usuario.cpf,
        programador_nome: usuario.nome,
        titulo: sugestao.titulo.trim(),
        conteudo: sugestao.conteudo.trim(),
        status: "pendente",
      });
      setSugestao({ titulo:"", conteudo:"" });
      setMsgSugestao("✅ Sugestão enviada! O gestor vai analisar.");
      setTimeout(() => { setMsgSugestao(""); setShowSugestao(false); }, 3000);
    } catch { setMsgSugestao("Erro ao enviar. Tente novamente."); }
    setEnviandoSugestao(false);
  };

  const TABS = [
    { id:"onboarding", label:"Onboarding", badge: !onboardingDone ? "!" : null },
    { id:"chat", label:"Assistente IA" },
    { id:"quiz", label:"Quiz", badge: quizzesCount > 0 ? quizzesCount : null },
  ];

  if (loadingHist) return (
    <div style={{ minHeight:"100vh", background:C.BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow','Segoe UI',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:13, color:C.MUTED, letterSpacing:2, textTransform:"uppercase", fontWeight:700 }}>Carregando...</div>
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:16 }}>
          {[0,1,2].map(j => <div key={j} style={{ width:8, height:8, borderRadius:"50%", background:PC, animation:`bpulse 1s ${j*0.22}s infinite` }} />)}
        </div>
      </div>
      <style>{`@keyframes bpulse{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.BG, fontFamily:"'Barlow','Segoe UI',sans-serif", color:C.TEXT, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:C.NAV, borderBottom:`1px solid ${C.BORDER}`, padding:"0 20px", display:"flex", alignItems:"center", height:62, gap:14, flexShrink:0 }}>
        <div style={{ width:3, height:36, background:PC, flexShrink:0 }} />
        <div>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:2, color:C.WHITE, textTransform:"uppercase", lineHeight:1 }}>Bendini</div>
          <div style={{ fontSize:8, letterSpacing:3.5, color:C.MUTED, textTransform:"uppercase", marginTop:3, fontWeight:600 }}>Programação Operacional</div>
        </div>
        <div style={{ width:1, height:28, background:C.BORDER2, margin:"0 10px" }} />
        <div style={{ fontSize:10, color:C.MUTED2, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase" }}>Agente BEN</div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:11, color:C.MUTED, fontWeight:700 }}>📋 {usuario.nome}</div>
          <button onClick={() => setShowSugestao(true)} style={{ background:`rgba(26,122,74,0.15)`, border:`1px solid ${PC}`, borderRadius:2, padding:"4px 10px", color:PC, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>💡 Sugerir Regra</button>
          <div style={{ width:1, height:16, background:C.BORDER2 }} />
          <button onClick={onSair} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"4px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>Sair</button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ background:C.NAV, borderBottom:`1px solid ${C.BORDER}`, display:"flex", flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setQuizAtivo(null); setQuizRevisando(null); }}
            style={{ flex:1, padding:"13px 4px", background:t.id===tab?C.CARD:"none", border:"none", borderBottom:t.id===tab?`2px solid ${PC}`:"2px solid transparent", color:t.id===tab?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", position:"relative" }}>
            {t.label}
            {t.badge && <span style={{ position:"absolute", top:6, right:"calc(50% - 20px)", background:PC, color:C.WHITE, borderRadius:"50%", width:16, height:16, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>

        {/* Modal Sugestão */}
        {showSugestao && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ background:C.CARD, border:`1px solid ${PC}`, borderRadius:2, padding:28, width:"100%", maxWidth:500 }}>
              <div style={{ fontSize:10, color:PC, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:6 }}>💡 Sugerir Nova Regra</div>
              <div style={{ fontSize:13, color:C.MUTED, marginBottom:20, lineHeight:1.6 }}>Identifiquei um procedimento ou regra que deveria estar na base? Descreva abaixo — o gestor vai analisar e aprovar.</div>
              <input value={sugestao.titulo} onChange={e => setSugestao(p => ({...p, titulo:e.target.value}))} placeholder="Título da regra ou procedimento"
                style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:10 }} />
              <textarea value={sugestao.conteudo} onChange={e => setSugestao(p => ({...p, conteudo:e.target.value}))} placeholder="Descreva o procedimento, regra ou informação que deveria ser incluída..." rows={5}
                style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", marginBottom:10, resize:"vertical", lineHeight:1.6 }} />
              {msgSugestao && <div style={{ fontSize:12, color: msgSugestao.startsWith("✅") ? C.GREEN : C.RED, marginBottom:10 }}>{msgSugestao}</div>}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={enviarSugestao} disabled={enviandoSugestao} style={{ background:enviandoSugestao?C.CARD2:PC, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:enviandoSugestao?"not-allowed":"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
                  {enviandoSugestao ? "Enviando..." : "Enviar Sugestão"}
                </button>
                <button onClick={() => { setShowSugestao(false); setSugestao({titulo:"",conteudo:""}); setMsgSugestao(""); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 16px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT */}
        {tab === "chat" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:10, alignItems:"flex-end" }}>
                  {m.role==="assistant" && <div style={{ width:32, height:32, borderRadius:2, background:PC, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:C.WHITE, flexShrink:0 }}>BEN</div>}
                  <div style={{ maxWidth:"78%", padding:"10px 14px", borderRadius:m.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px", background:m.role==="user"?PC:C.CARD, border:m.role==="assistant"?`1px solid ${C.BORDER}`:"none", fontSize:14, color:C.TEXT }}>
                    {fmt(m.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:2, background:PC, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:C.WHITE, flexShrink:0 }}>BEN</div>
                  <div style={{ padding:"12px 16px", background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:"10px 10px 10px 2px", display:"flex", gap:5, alignItems:"center" }}>
                    {[0,1,2].map(j => <div key={j} style={{ width:5, height:5, borderRadius:"50%", background:PC, animation:`bpulse 1s ${j*0.22}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <div style={{ padding:"6px 16px 8px", display:"flex", gap:7, overflowX:"auto", flexShrink:0 }}>
              {["Regras do cliente X","Como emitir CT-e?","Janela de entrega — Dow","Procedimento de coleta"].map(q => (
                <button key={q} onClick={() => setInput(q)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"5px 12px", color:C.MUTED, fontSize:10, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, letterSpacing:0.8, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>{q}</button>
              ))}
            </div>
            <div style={{ padding:"10px 16px 12px", borderTop:`1px solid ${C.BORDER}`, display:"flex", gap:8, background:C.NAV, flexShrink:0 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()} placeholder="Pergunte sobre regras, clientes ou procedimentos..."
                style={{ flex:1, background:C.CARD, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 14px", color:C.TEXT, fontSize:13, outline:"none", fontFamily:"inherit" }} />
              <button onClick={send} disabled={loading||!input.trim()} style={{ background:(!loading&&input.trim())?PC:C.CARD2, border:"none", borderRadius:2, width:46, cursor:(!loading&&input.trim())?"pointer":"not-allowed", color:(!loading&&input.trim())?C.WHITE:C.MUTED2, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, flexShrink:0 }}>›</button>
            </div>
          </div>
        )}

        {/* ONBOARDING */}
        {tab === "onboarding" && obSlides.length === 0 && (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ color:C.MUTED, fontSize:13 }}>Nenhum conteúdo de onboarding cadastrado ainda.</div>
          </div>
        )}
        {tab === "onboarding" && obSlides.length > 0 && (
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:9, color:C.MUTED, letterSpacing:2, textTransform:"uppercase", fontWeight:700 }}>Progresso</span>
              <span style={{ fontSize:9, color:PC, letterSpacing:1, fontWeight:800 }}>{obStep+1} / {obSlides.length}</span>
            </div>
            <div style={{ height:2, background:C.BORDER, borderRadius:1, marginBottom:20 }}>
              <div style={{ height:"100%", width:`${((obStep+1)/obSlides.length)*100}%`, background:PC, transition:"width 0.4s", borderRadius:1 }} />
            </div>
            <div style={{ display:"flex", gap:5, marginBottom:22, flexWrap:"wrap" }}>
              {obSlides.map((_,i) => <div key={i} onClick={() => setObStep(i)} style={{ width:i===obStep?24:8, height:3, background:i<=obStep?PC:C.BORDER2, cursor:"pointer", transition:"all 0.3s", borderRadius:2 }} />)}
            </div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"24px 20px", marginBottom:16 }}>
              <div style={{ fontSize:10, display:"inline-block", background:PC, color:C.WHITE, letterSpacing:2, fontWeight:900, padding:"3px 9px", marginBottom:16, textTransform:"uppercase" }}>{obSlides[obStep].tag}</div>
              <div style={{ fontSize:28, marginBottom:10 }}>{obSlides[obStep].icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:C.WHITE, marginBottom:6, letterSpacing:-0.5, lineHeight:1.2 }}>{obSlides[obStep].title}</div>
              <div style={{ fontSize:11, color:C.MUTED, letterSpacing:1.5, textTransform:"uppercase", fontWeight:700, marginBottom:20 }}>{obSlides[obStep].sub}</div>
              <div style={{ fontSize:14, color:C.TEXT, whiteSpace:"pre-line", lineHeight:1.85 }}>{obSlides[obStep].body}</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setObStep(s => Math.max(0,s-1))} disabled={obStep===0} style={{ flex:1, padding:"13px", background:"none", border:`1px solid ${obStep===0?C.BORDER:C.BORDER2}`, borderRadius:2, color:obStep===0?C.MUTED2:C.MUTED, cursor:obStep===0?"not-allowed":"pointer", fontWeight:800, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>← Anterior</button>
              {obStep < obSlides.length - 1 ? (
                <button onClick={() => setObStep(s => Math.min(obSlides.length-1,s+1))} style={{ flex:2, padding:"13px", background:PC, border:"none", borderRadius:2, color:C.WHITE, cursor:"pointer", fontWeight:900, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Próximo →</button>
              ) : (
                <button onClick={concluirOnboarding} style={{ flex:2, padding:"13px", background:PC, border:"none", borderRadius:2, color:C.WHITE, cursor:"pointer", fontWeight:900, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>✓ Concluir Onboarding</button>
              )}
            </div>
            {onboardingDone && (
              <div style={{ marginTop:16, textAlign:"center", fontSize:11, color:C.GREEN, fontWeight:700 }}>✓ Você já concluiu este onboarding. Pode revisar à vontade.</div>
            )}
          </div>
        )}


        {/* QUIZ */}
        {tab === "quiz" && !onboardingDone && (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ background:C.CARD, border:`1px solid ${PC}`, borderRadius:2, padding:32, textAlign:"center", maxWidth:380 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔒</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.WHITE, marginBottom:8 }}>Complete o Onboarding primeiro</div>
              <div style={{ fontSize:13, color:C.MUTED, marginBottom:20, lineHeight:1.6 }}>Antes de responder os quizzes, é necessário concluir o treinamento inicial de onboarding.</div>
              <button onClick={() => setTab("onboarding")} style={{ background:PC, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit", fontWeight:900 }}>Ir para o Onboarding →</button>
            </div>
          </div>
        )}
        {tab === "quiz" && onboardingDone && !quizAtivo && !quizRevisando && <ListaQuizzesProg usuario={usuario} onIniciar={setQuizAtivo} onRevisar={setQuizRevisando} pc={PC} />}
        {tab === "quiz" && onboardingDone && quizAtivo && <QuizProg quiz={quizAtivo} usuario={usuario} onVoltar={() => setQuizAtivo(null)} pc={PC} />}
        {tab === "quiz" && onboardingDone && quizRevisando && <RevisaoProg quiz={quizRevisando} usuario={usuario} onVoltar={() => setQuizRevisando(null)} pc={PC} />}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');@keyframes bpulse{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.NAV}}::-webkit-scrollbar-thumb{background:${C.BORDER2};border-radius:2px}input::placeholder,textarea::placeholder{color:${C.MUTED2}}button:focus{outline:none}`}</style>
    </div>
  );
}

function ListaQuizzesProg({ usuario, onIniciar, onRevisar, pc }) {
  const [quizzes, setQuizzes] = useState([]);
  const [tentativas, setTentativas] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      sb.get("prog_quizzes", "status=eq.ativo&order=created_at.desc"),
      sb.get("prog_tentativas", `programador_cpf=eq.${usuario.cpf}&order=created_at.desc`),
    ]).then(([q, t]) => { setQuizzes(Array.isArray(q)?q:[]); setTentativas(Array.isArray(t)?t:[]); setLoading(false); });
  }, []);
  if (loading) return <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Carregando quizzes...</div>;
  const tentPorQuiz = tentativas.reduce((acc, t) => { if (!acc[t.quiz_id]) acc[t.quiz_id]=[]; acc[t.quiz_id].push(t); return acc; }, {});
  const pendentes = quizzes.filter(q => !tentPorQuiz[q.id]);
  const feitos = quizzes.filter(q => tentPorQuiz[q.id]);
  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      {pendentes.length > 0 && (<>
        <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:10 }}>🔴 Pendentes ({pendentes.length})</div>
        <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden", marginBottom:20 }}>
          {pendentes.map((q,i) => (
            <div key={q.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i<pendentes.length-1?`1px solid ${C.BORDER}`:"none" }}>
              <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div><div style={{ fontSize:11, color:C.MUTED }}>10 perguntas — Não respondido</div></div>
              <button onClick={() => onIniciar(q)} style={{ background:pc, border:"none", borderRadius:2, padding:"8px 16px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:1.5, fontWeight:900, textTransform:"uppercase", fontFamily:"inherit" }}>Responder →</button>
            </div>
          ))}
        </div>
      </>)}
      {feitos.length > 0 && (<>
        <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:10 }}>✓ Respondidos ({feitos.length})</div>
        <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
          {feitos.map((q,i) => {
            const ts = tentPorQuiz[q.id];
            const melhor = Math.max(...ts.map(t => t.percentual));
            return (
              <div key={q.id} style={{ padding:"14px 16px", borderBottom:i<feitos.length-1?`1px solid ${C.BORDER}`:"none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div><div style={{ fontSize:11, color:C.MUTED }}>Melhor: {Number(melhor).toFixed(0)}% — {ts.length}x respondido</div></div>
                  <div style={{ fontSize:18, fontWeight:900, color:melhor>=80?C.GREEN:melhor>=60?C.YELLOW:C.RED }}>{Number(melhor).toFixed(0)}%</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => onRevisar(q)} style={{ flex:1, background:`rgba(26,122,74,0.1)`, border:`1px solid rgba(26,122,74,0.4)`, borderRadius:2, padding:"8px 12px", color:pc, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:800, textTransform:"uppercase", fontFamily:"inherit" }}>📋 Ver Erros</button>
                  <button onClick={() => onIniciar(q)} style={{ flex:1, background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"8px 12px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>↺ Refazer</button>
                </div>
              </div>
            );
          })}
        </div>
      </>)}
      {quizzes.length === 0 && <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:32, textAlign:"center", color:C.MUTED, fontSize:13 }}>Nenhum quiz disponível ainda.</div>}
    </div>
  );
}

function QuizProg({ quiz, usuario, onVoltar, pc }) {
  const [questoes, setQuestoes] = useState([]);
  const [qi, setQi] = useState(0);
  const [qsel, setQsel] = useState(null);
  const [qshow, setQshow] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    sb.get("prog_questoes", `quiz_id=eq.${quiz.id}&order=ordem.asc`).then(d => {
      setQuestoes(Array.isArray(d)?d:[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [quiz.id]);
  const answer = async (letra) => {
    if (qsel) return;
    const q = questoes[qi];
    setQsel(letra); setQshow(true);
    const acertou = letra === q.correta;
    if (acertou) setScore(s => s+1);
    try { await sb.post("prog_respostas", { programador_nome:usuario.nome, quiz_titulo:quiz.titulo, questao_id:q.id||null, pergunta:q.pergunta, resposta_dada:letra, correta:q.correta, acertou }); } catch {}
  };
  const next = async () => {
    if (qi+1 >= questoes.length) {
      const finalScore = score + (qsel === questoes[qi]?.correta ? 1 : 0);
      const pct = (finalScore/questoes.length)*100;
      await sb.post("prog_tentativas", { quiz_id:quiz.id, programador_cpf:usuario.cpf, programador_nome:usuario.nome, score:finalScore, total:questoes.length, percentual:pct });
      setDone(true);
    } else { setQi(i=>i+1); setQsel(null); setQshow(false); }
  };
  const finalScore = done ? score : score + (qsel === questoes[qi]?.correta ? 1 : 0);
  const pct = questoes.length > 0 ? (finalScore/questoes.length)*100 : 0;
  if (loading) return <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ color:C.MUTED, fontSize:13 }}>Carregando questões...</div></div>;
  if (!questoes.length) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:32, textAlign:"center", maxWidth:360 }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:14, fontWeight:700, color:C.WHITE, marginBottom:8 }}>Questões não encontradas</div>
        <div style={{ fontSize:13, color:C.MUTED, marginBottom:20 }}>Este quiz ainda não tem questões cadastradas.</div>
        <button onClick={onVoltar} style={{ background:pc, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit", fontWeight:900 }}>← Voltar</button>
      </div>
    </div>
  );
  if (done) return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:32, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>{pct>=80?"🏆":pct>=60?"👍":"📚"}</div>
        <div style={{ fontSize:9, color:pc, letterSpacing:2.5, fontWeight:900, textTransform:"uppercase", marginBottom:12 }}>Resultado</div>
        <div style={{ fontSize:48, fontWeight:900, color:C.WHITE, lineHeight:1 }}>{finalScore}<span style={{ fontSize:20, color:C.MUTED }}> /{questoes.length}</span></div>
        <div style={{ fontSize:22, fontWeight:900, color:pct>=80?C.GREEN:pct>=60?C.YELLOW:C.RED, marginTop:6 }}>{pct.toFixed(0)}%</div>
        <div style={{ fontSize:13, color:C.MUTED, marginTop:14, marginBottom:24 }}>{pct>=80?"Excelente!":pct>=60?"Bom resultado. Revise os pontos errados.":"Revise o procedimento e tente novamente."}</div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={onVoltar} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 20px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>← Voltar</button>
          <button onClick={() => { setQi(0); setQsel(null); setQshow(false); setScore(0); setDone(false); }} style={{ background:pc, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit", fontWeight:900 }}>↺ Refazer</button>
        </div>
      </div>
    </div>
  );
  const q = questoes[qi] || {};
  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      <button onClick={onVoltar} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"5px 12px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit", marginBottom:16 }}>← Voltar</button>
      <div style={{ fontSize:11, color:C.MUTED, marginBottom:4 }}>{quiz.titulo}</div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:9, color:C.MUTED, letterSpacing:2, fontWeight:800, textTransform:"uppercase" }}>Pergunta {qi+1} de {questoes.length}</span>
        <span style={{ fontSize:9, color:C.GREEN, letterSpacing:1, fontWeight:800 }}>{score} corretas</span>
      </div>
      <div style={{ height:2, background:C.BORDER, borderRadius:1, marginBottom:22 }}>
        <div style={{ height:"100%", width:`${(qi/questoes.length)*100}%`, background:pc, borderRadius:1 }} />
      </div>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"20px 18px", marginBottom:14 }}>
        <div style={{ fontSize:9, color:pc, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:12 }}>Questão {qi+1}</div>
        <div style={{ fontSize:16, fontWeight:700, lineHeight:1.5, color:C.WHITE }}>{q.pergunta}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
        {["a","b","c","d"].map(l => {
          const isC = l===q.correta, isSel = l===qsel;
          let bg=C.CARD, border=`1px solid ${C.BORDER}`, color=C.TEXT;
          if (qshow) { if (isC) { bg="rgba(46,204,113,0.07)"; border="1px solid #2ecc71"; color="#2ecc71"; } else if (isSel) { bg="rgba(26,122,74,0.08)"; border=`1px solid ${pc}`; color="#5dba8a"; } }
          return (
            <button key={l} onClick={() => answer(l)} style={{ background:bg, border, borderRadius:2, padding:"12px 16px", color, textAlign:"left", cursor:qsel?"default":"pointer", fontSize:14, lineHeight:1.4, width:"100%", fontFamily:"inherit" }}>
              <span style={{ fontWeight:900, marginRight:10, color:C.MUTED2, fontSize:12 }}>{l.toUpperCase()}.</span>{q[`opcao_${l}`]}
            </button>
          );
        })}
      </div>
      {qshow && (<>
        <div style={{ background:qsel===q.correta?"rgba(46,204,113,0.07)":"rgba(26,122,74,0.08)", border:`1px solid ${qsel===q.correta?"#2ecc71":pc}`, borderRadius:2, padding:"12px 14px", marginBottom:14, fontSize:13, color:qsel===q.correta?"#2ecc71":"#5dba8a", lineHeight:1.65 }}>
          {qsel===q.correta?"✓ Correto — ":"✗ Incorreto — "}{q.explicacao}
        </div>
        <button onClick={next} style={{ width:"100%", padding:"14px", background:pc, border:"none", borderRadius:2, color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
          {qi+1>=questoes.length?"Ver Resultado":"Próxima →"}
        </button>
      </>)}
    </div>
  );
}

function RevisaoProg({ quiz, usuario, onVoltar, pc }) {
  const [respostas, setRespostas] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      sb.get("prog_respostas", `programador_nome=eq.${encodeURIComponent(usuario.nome)}&quiz_titulo=eq.${encodeURIComponent(quiz.titulo)}&order=created_at.desc&limit=100`),
      sb.get("prog_questoes", `quiz_id=eq.${quiz.id}&order=ordem.asc`),
    ]).then(([r,q]) => { setRespostas(Array.isArray(r)?r:[]); setQuestoes(Array.isArray(q)?q:[]); setLoading(false); });
  }, []);
  if (loading) return <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Carregando revisão...</div>;
  const ultima = {};
  respostas.forEach(r => { if (!ultima[r.questao_id]) ultima[r.questao_id]=r; });
  const erros = Object.values(ultima).filter(r => !r.acertou);
  const acertos = Object.values(ultima).filter(r => r.acertou);
  const total = Object.values(ultima).length;
  const pct = total > 0 ? Math.round((acertos.length/total)*100) : 0;
  const semDados = respostas.length === 0;
  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      <button onClick={onVoltar} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"6px 14px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit", marginBottom:16 }}>← Voltar</button>
      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ fontSize:10, color:pc, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:4 }}>Revisão</div>
        <div style={{ fontSize:17, fontWeight:900, color:C.WHITE, marginBottom:12 }}>{quiz.titulo}</div>
        {!semDados && (
          <div style={{ display:"flex", gap:20 }}>
            {[{v:`${pct}%`,l:"Aproveitamento",cor:pct>=80?C.GREEN:pct>=60?C.YELLOW:C.RED},{v:acertos.length,l:"Acertos",cor:C.GREEN},{v:erros.length,l:"Erros",cor:C.RED}].map(x => (
              <div key={x.l} style={{ textAlign:"center" }}><div style={{ fontSize:24, fontWeight:900, color:x.cor }}>{x.v}</div><div style={{ fontSize:10, color:C.MUTED, letterSpacing:1, textTransform:"uppercase" }}>{x.l}</div></div>
            ))}
          </div>
        )}
      </div>
      {semDados ? (
        <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:24, textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
          <div style={{ fontSize:14, color:C.WHITE, fontWeight:700, marginBottom:6 }}>Gabarito das questões</div>
          <div style={{ fontSize:12, color:C.MUTED, marginBottom:20 }}>Refaça o quiz para ver seus erros em detalhes.</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, textAlign:"left" }}>
            {questoes.map((q,i) => (
              <div key={q.id} style={{ background:C.NAV, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"12px 14px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.WHITE, marginBottom:8 }}>#{i+1} {q.pergunta}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {["a","b","c","d"].map(l => (
                    <div key={l} style={{ padding:"4px 10px", borderRadius:2, background:q.correta===l?"rgba(46,204,113,0.1)":C.CARD, border:`1px solid ${q.correta===l?"#2ecc71":C.BORDER}`, fontSize:12, color:q.correta===l?"#2ecc71":C.MUTED }}>
                      <span style={{ fontWeight:900 }}>{l.toUpperCase()}.</span> {q[`opcao_${l}`]} {q.correta===l && "✓"}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {erros.length > 0 && (<>
            <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:4 }}>✗ O que você errou ({erros.length})</div>
            {erros.map((r,i) => {
              const q = questoes.find(q => q.id===r.questao_id) || {};
              return (
                <div key={i} style={{ background:C.CARD, border:"1px solid rgba(192,57,43,0.4)", borderRadius:2, padding:"14px 16px" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.WHITE, marginBottom:12, lineHeight:1.5 }}>{r.pergunta}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
                    {["a","b","c","d"].map(l => {
                      const isCorreta = l===r.correta, isErrada = l===r.resposta_dada;
                      if (!isCorreta && !isErrada) return null;
                      return (
                        <div key={l} style={{ padding:"8px 12px", borderRadius:2, background:isCorreta?"rgba(46,204,113,0.08)":"rgba(192,57,43,0.08)", border:`1px solid ${isCorreta?"#2ecc71":C.RED}`, fontSize:13, color:isCorreta?"#2ecc71":"#e07070", display:"flex", gap:8, alignItems:"center" }}>
                          <span style={{ fontWeight:900, fontSize:11 }}>{l.toUpperCase()}.</span>
                          <span style={{ flex:1 }}>{q[`opcao_${l}`]||""}</span>
                          <span style={{ fontSize:10, fontWeight:900 }}>{isCorreta?"✓ Correta":"✗ Sua resposta"}</span>
                        </div>
                      );
                    })}
                  </div>
                  {q.explicacao && <div style={{ fontSize:12, color:C.MUTED, lineHeight:1.6, fontStyle:"italic" }}>💡 {q.explicacao}</div>}
                </div>
              );
            })}
          </>)}
          {acertos.length > 0 && (<>
            <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginTop:8, marginBottom:4 }}>✓ O que você acertou ({acertos.length})</div>
            {acertos.map((r,i) => (
              <div key={i} style={{ background:C.CARD, border:"1px solid rgba(46,204,113,0.2)", borderRadius:2, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(46,204,113,0.15)", border:"1px solid #2ecc71", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#2ecc71", flexShrink:0 }}>✓</div>
                <div style={{ fontSize:13, color:C.TEXT, lineHeight:1.5 }}>{r.pergunta}</div>
              </div>
            ))}
          </>)}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// PAINEL ADM — ABA PROG
// ══════════════════════════════════════════════════
function PainelProgAdm({ showMsg }) {
  const [subAba, setSubAba] = useState("programadores");
  const [programadores, setProgramadores] = useState([]);
  const [regras, setRegras] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [sugestoes, setSugestoes] = useState([]);
  const [novoCpf, setNovoCpf] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novaRegra, setNovaRegra] = useState({ titulo:"", conteudo:"" });
  const [editandoRegra, setEditandoRegra] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [quizDetalhe, setQuizDetalhe] = useState(null);
  const [quizView, setQuizView] = useState("respostas");
  const [tentativas, setTentativas] = useState([]);
  const [progList, setProgList] = useState([]);
  const [feedbackRejeitar, setFeedbackRejeitar] = useState({});
  const [questoes, setQuestoes] = useState([]);
  const [editandoQuestao, setEditandoQuestao] = useState(null);
  const [novaQuestao, setNovaQuestao] = useState({ pergunta:"", opcao_a:"", opcao_b:"", opcao_c:"", opcao_d:"", correta:"a", explicacao:"" });
  const [addingQuestao, setAddingQuestao] = useState(false);
  const PC = "#1a7a4a";

  useEffect(() => { carregarProg(); }, [subAba]);

  const carregarProg = async () => {
    setLoading(true);
    try {
      if (subAba === "programadores") {
        const d = await sb.get("programadores", "order=nome.asc");
        setProgramadores(Array.isArray(d)?d:[]);
      } else if (subAba === "regras") {
        const d = await sb.get("prog_regras", "order=ordem.asc");
        setRegras(Array.isArray(d)?d:[]);
      } else if (subAba === "quizzes") {
        const [q, p] = await Promise.all([
          sb.get("prog_quizzes", "order=created_at.desc"),
          sb.get("programadores", "ativo=eq.true&order=nome.asc"),
        ]);
        setQuizzes(Array.isArray(q)?q:[]);
        setProgList(Array.isArray(p)?p:[]);
      } else if (subAba === "sugestoes") {
        const d = await sb.get("prog_sugestoes", "order=created_at.desc");
        setSugestoes(Array.isArray(d)?d:[]);
      }
    } catch {}
    setLoading(false);
  };

  const adicionarProgramador = async () => {
    const c = cleanCPF(novoCpf);
    if (c.length !== 11 || !novoNome.trim()) { showMsg("Preencha CPF e nome.", C.RED); return; }
    try {
      const res = await sb.post("programadores", { cpf:c, nome:novoNome.trim() });
      if (Array.isArray(res) && res.length > 0) {
        setNovoCpf(""); setNovoNome("");
        showMsg("Programador cadastrado!");
        const lista = await sb.get("programadores", "order=nome.asc");
        setProgramadores(Array.isArray(lista)?lista:[]);
      } else { showMsg("Erro ao cadastrar. Verifique o console.", C.RED); }
    } catch { showMsg("Erro de conexão.", C.RED); }
  };

  const toggleProg = async (id, ativo) => {
    await sb.patch("programadores", `id=eq.${id}`, { ativo: !ativo });
    carregarProg();
  };

  const salvarRegra = async () => {
    if (!novaRegra.titulo.trim() || !novaRegra.conteudo.trim()) { showMsg("Preencha título e conteúdo.", C.RED); return; }
    if (editandoRegra) {
      await sb.patch("prog_regras", `id=eq.${editandoRegra}`, { titulo:novaRegra.titulo, conteudo:novaRegra.conteudo, updated_at:new Date().toISOString() });
      setEditandoRegra(null);
      showMsg("Procedimento atualizado!");
    } else {
      const result = await sb.post("prog_regras", { titulo:novaRegra.titulo, conteudo:novaRegra.conteudo, ordem:regras.length, ativo:true });
      const regra = Array.isArray(result)?result[0]:result;
      showMsg("Procedimento salvo! Gerando quiz...", C.YELLOW);
      setGerando(true);
      try {
        const qr = await api("gerar_quiz_prog", { regra_id:regra.id, titulo:novaRegra.titulo, conteudo:novaRegra.conteudo });
        if (qr.ok) showMsg(`Quiz gerado com ${qr.total} perguntas! ✓`);
        else showMsg("Salvo, mas erro ao gerar quiz.", C.YELLOW);
      } catch { showMsg("Salvo, mas erro ao gerar quiz.", C.YELLOW); }
      setGerando(false);
    }
    setNovaRegra({ titulo:"", conteudo:"" });
    carregarProg();
  };

  const aprovarSugestao = async (s) => {
    // Cria a regra a partir da sugestão
    const result = await sb.post("prog_regras", { titulo:s.titulo, conteudo:s.conteudo, ordem:0, ativo:true });
    const regra = Array.isArray(result)?result[0]:result;
    // Atualiza status da sugestão
    await sb.patch("prog_sugestoes", `id=eq.${s.id}`, { status:"aprovada", updated_at:new Date().toISOString() });
    showMsg("Sugestão aprovada e regra criada! Gerando quiz...", C.YELLOW);
    try {
      const qr = await api("gerar_quiz_prog", { regra_id:regra.id, titulo:s.titulo, conteudo:s.conteudo });
      if (qr.ok) showMsg(`Regra aprovada! Quiz gerado com ${qr.total} perguntas ✓`);
    } catch {}
    carregarProg();
  };

  const rejeitarSugestao = async (s) => {
    const feedback = feedbackRejeitar[s.id] || "";
    await sb.patch("prog_sugestoes", `id=eq.${s.id}`, { status:"rejeitada", feedback_adm:feedback, updated_at:new Date().toISOString() });
    showMsg("Sugestão rejeitada.");
    setFeedbackRejeitar(p => ({...p, [s.id]:""}));
    carregarProg();
  };

  const verDetalheQuiz = async (quiz) => {
    setQuizDetalhe(quiz);
    setQuizView("respostas");
    setEditandoQuestao(null);
    setAddingQuestao(false);
    const [t, q] = await Promise.all([
      sb.get("prog_tentativas", `quiz_id=eq.${quiz.id}&order=created_at.desc`),
      sb.get("prog_questoes", `quiz_id=eq.${quiz.id}&order=ordem.asc`),
    ]);
    setTentativas(Array.isArray(t)?t:[]);
    setQuestoes(Array.isArray(q) ? q : []);
  };

  const salvarQuestao = async () => {
    const dados = editandoQuestao || novaQuestao;
    if (!dados.pergunta.trim()) { showMsg("Digite a pergunta.", C.RED); return; }
    try {
      if (editandoQuestao) {
        await sb.patch("prog_questoes", `id=eq.${editandoQuestao.id}`, {
          pergunta: editandoQuestao.pergunta, opcao_a: editandoQuestao.opcao_a,
          opcao_b: editandoQuestao.opcao_b, opcao_c: editandoQuestao.opcao_c,
          opcao_d: editandoQuestao.opcao_d, correta: editandoQuestao.correta,
          explicacao: editandoQuestao.explicacao,
        });
        showMsg("Questão atualizada!");
        setEditandoQuestao(null);
      } else {
        await sb.post("prog_questoes", {
          quiz_id: quizDetalhe.id, pergunta: novaQuestao.pergunta,
          opcao_a: novaQuestao.opcao_a, opcao_b: novaQuestao.opcao_b,
          opcao_c: novaQuestao.opcao_c, opcao_d: novaQuestao.opcao_d,
          correta: novaQuestao.correta, explicacao: novaQuestao.explicacao,
          ordem: questoes.length + 1,
        });
        showMsg("Questão adicionada!");
        setNovaQuestao({ pergunta:"", opcao_a:"", opcao_b:"", opcao_c:"", opcao_d:"", correta:"a", explicacao:"" });
        setAddingQuestao(false);
      }
      const q2 = await sb.get("prog_questoes", `quiz_id=eq.${quizDetalhe.id}&order=ordem.asc`);
      setQuestoes(Array.isArray(q2) ? q2 : []);
    } catch { showMsg("Erro ao salvar questão.", C.RED); }
  };

  const excluirQuestao = async (id) => {
    if (!window.confirm("Excluir esta questão?")) return;
    await sb.delete("prog_questoes", `id=eq.${id}`);
    showMsg("Questão excluída.");
    const q = await sb.get("prog_questoes", `quiz_id=eq.${quizDetalhe.id}&order=ordem.asc`);
    setQuestoes(Array.isArray(q) ? q : []);
  };

  const SUBS = [
    { id:"programadores", label:"Programadores" },
    { id:"regras", label:"Procedimentos" },
    { id:"quizzes", label:"Quizzes" },
    { id:"sugestoes", label:`💡 Sugestões${sugestoes.filter(s=>s.status==="pendente").length>0?" ("+sugestoes.filter(s=>s.status==="pendente").length+")":""}` },
  ];

  return (
    <div>
      {/* Sub-abas */}
      <div style={{ display:"flex", gap:0, marginBottom:20, background:C.NAV, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
        {SUBS.map(s => (
          <button key={s.id} onClick={() => { setSubAba(s.id); setQuizDetalhe(null); }}
            style={{ flex:1, padding:"11px 8px", background:subAba===s.id?C.CARD:"none", border:"none", borderBottom:subAba===s.id?`2px solid ${PC}`:"2px solid transparent", color:subAba===s.id?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* PROGRAMADORES */}
      {subAba === "programadores" && (
        <div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:20, marginBottom:20 }}>
            <div style={{ fontSize:10, color:PC, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>Cadastrar Programador</div>
            <input value={novoCpf} onChange={e => setNovoCpf(formatCPF(e.target.value))} placeholder="CPF — 000.000.000-00"
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:8, letterSpacing:1 }} />
            <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome completo"
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:12 }} />
            <button onClick={adicionarProgramador} style={{ background:PC, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>+ Cadastrar</button>
          </div>
          <div style={{ fontSize:10, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>{programadores.length} programadores</div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {loading ? <div style={{ padding:20, color:C.MUTED }}>Carregando...</div> :
              programadores.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhum programador cadastrado.</div> :
              programadores.map((p, i) => (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:i<programadores.length-1?`1px solid ${C.BORDER}`:"none" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:p.ativo?C.WHITE:C.MUTED }}>{p.nome}</div>
                    <div style={{ fontSize:11, color:C.MUTED }}>{formatCPF(p.cpf)}</div>
                  </div>
                  <div style={{ fontSize:9, color:p.ativo?C.GREEN:C.RED, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>{p.ativo?"Ativo":"Inativo"}</div>
                  <button onClick={() => toggleProg(p.id, p.ativo)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"4px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>
                    {p.ativo?"Desativar":"Ativar"}
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* PROCEDIMENTOS */}
      {subAba === "regras" && (
        <div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:20, marginBottom:20 }}>
            <div style={{ fontSize:10, color:PC, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>
              {editandoRegra ? "Editar Procedimento" : "Novo Procedimento / Regra de Cliente"}
            </div>
            {!editandoRegra && <div style={{ fontSize:12, color:C.YELLOW, marginBottom:12, lineHeight:1.5 }}>⚡ Ao salvar, a IA gera automaticamente 10 perguntas de quiz. Use o título para identificar o cliente: ex: "Regras Cliente Dow Chemical"</div>}
            <input value={novaRegra.titulo} onChange={e => setNovaRegra(p => ({...p, titulo:e.target.value}))} placeholder="Ex: Regras Cliente Dow Chemical | Procedimento de Emissão CT-e"
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:8 }} />
            <textarea value={novaRegra.conteudo} onChange={e => setNovaRegra(p => ({...p, conteudo:e.target.value}))} placeholder="Descreva o procedimento completo ou as regras do cliente..." rows={6}
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", marginBottom:12, resize:"vertical", lineHeight:1.6 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={salvarRegra} disabled={gerando} style={{ background:gerando?C.CARD2:PC, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:gerando?"not-allowed":"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
                {gerando?"Gerando quiz...":editandoRegra?"Salvar Edição":"+ Salvar e Gerar Quiz"}
              </button>
              {editandoRegra && <button onClick={() => { setEditandoRegra(null); setNovaRegra({titulo:"",conteudo:""}); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 16px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Cancelar</button>}
            </div>
          </div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {loading ? <div style={{ padding:20, color:C.MUTED }}>Carregando...</div> :
              regras.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhum procedimento cadastrado.</div> :
              regras.map((r, i) => (
                <div key={r.id} style={{ padding:"14px 16px", borderBottom:i<regras.length-1?`1px solid ${C.BORDER}`:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                    <div style={{ flex:1, fontSize:14, fontWeight:800, color:C.WHITE }}>{r.titulo}</div>
                    <button onClick={() => { setEditandoRegra(r.id); setNovaRegra({titulo:r.titulo, conteudo:r.conteudo}); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"3px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>Editar</button>
                    <button onClick={async () => { await sb.delete("prog_regras", `id=eq.${r.id}`); showMsg("Procedimento excluído."); carregarProg(); }} style={{ background:"none", border:"1px solid rgba(192,57,43,0.4)", borderRadius:2, padding:"3px 10px", color:C.RED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>Excluir</button>
                  </div>
                  <div style={{ fontSize:13, color:C.MUTED, lineHeight:1.6, whiteSpace:"pre-line", maxHeight:80, overflow:"hidden" }}>{r.conteudo}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* QUIZZES */}
      {subAba === "quizzes" && !quizDetalhe && (
        <div>
          <div style={{ fontSize:10, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>{quizzes.length} quizzes</div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {loading ? <div style={{ padding:20, color:C.MUTED }}>Carregando...</div> :
              quizzes.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhum quiz ainda.</div> :
              quizzes.map((q, i) => (
                <div key={q.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i<quizzes.length-1?`1px solid ${C.BORDER}`:"none" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div>
                    <div style={{ fontSize:11, color:C.MUTED }}>{new Date(q.created_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <button onClick={() => verDetalheQuiz(q)} style={{ background:PC, border:"none", borderRadius:2, padding:"6px 14px", color:C.WHITE, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>Ver Respostas</button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* DETALHE QUIZ */}
      {subAba === "quizzes" && quizDetalhe && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <button onClick={() => { setQuizDetalhe(null); setEditandoQuestao(null); setAddingQuestao(false); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"6px 14px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>← Voltar</button>
            <div style={{ flex:1, fontSize:16, fontWeight:900, color:C.WHITE }}>{quizDetalhe.titulo}</div>
          </div>

          <div style={{ display:"flex", gap:0, marginBottom:20, background:C.NAV, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {[{id:"respostas",label:`📊 Respostas (${tentativas.length})`},{id:"questoes",label:`✏️ Questões (${questoes.length})`}].map(v => (
              <button key={v.id} onClick={() => { setQuizView(v.id); setEditandoQuestao(null); setAddingQuestao(false); }}
                style={{ flex:1, padding:"11px 8px", background:quizView===v.id?C.CARD:"none", border:"none", borderBottom:quizView===v.id?`2px solid ${PC}`:"2px solid transparent", color:quizView===v.id?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>
                {v.label}
              </button>
            ))}
          </div>

          {quizView === "respostas" && (
            <div>
              <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>✓ Responderam ({tentativas.length})</div>
              <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden", marginBottom:16 }}>
                {tentativas.length === 0 ? <div style={{ padding:16, color:C.MUTED, fontSize:13 }}>Nenhum programador respondeu ainda.</div> :
                  tentativas.map((t, i) => (
                    <div key={t.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderBottom:i<tentativas.length-1?`1px solid ${C.BORDER}`:"none" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.WHITE }}>{t.programador_nome}</div>
                        <div style={{ fontSize:11, color:C.MUTED }}>{formatCPF(t.programador_cpf)} — {new Date(t.created_at).toLocaleDateString("pt-BR")}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:16, fontWeight:900, color:t.percentual>=80?C.GREEN:t.percentual>=60?C.YELLOW:C.RED }}>{Number(t.percentual).toFixed(0)}%</div>
                        <div style={{ fontSize:10, color:C.MUTED }}>{t.score}/{t.total}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
              {(() => {
                const responderam = new Set(tentativas.map(t => t.programador_cpf));
                const pendentes = progList.filter(p => !responderam.has(p.cpf));
                return (<>
                  <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>✗ Pendentes ({pendentes.length})</div>
                  <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
                    {pendentes.length === 0 ? <div style={{ padding:16, color:C.GREEN, fontSize:13, fontWeight:700 }}>✓ Todos responderam!</div> :
                      pendentes.map((p, i) => (
                        <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:i<pendentes.length-1?`1px solid ${C.BORDER}`:"none" }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:C.RED, flexShrink:0 }} />
                          <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:C.WHITE }}>{p.nome}</div><div style={{ fontSize:11, color:C.MUTED }}>{formatCPF(p.cpf)}</div></div>
                          <div style={{ fontSize:9, color:C.RED, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>Pendente</div>
                        </div>
                      ))
                    }
                  </div>
                </>);
              })()}
            </div>
          )}

          {quizView === "questoes" && (
            <div>
              {(editandoQuestao || addingQuestao) && (() => {
                const q = editandoQuestao || novaQuestao;
                const setQ = editandoQuestao
                  ? (field, val) => setEditandoQuestao(p => ({...p, [field]:val}))
                  : (field, val) => setNovaQuestao(p => ({...p, [field]:val}));
                return (
                  <div style={{ background:C.CARD, border:`2px solid ${PC}`, borderRadius:2, padding:20, marginBottom:20 }}>
                    <div style={{ fontSize:10, color:PC, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>
                      {editandoQuestao ? "✏️ Editar Questão" : "➕ Nova Questão"}
                    </div>
                    <textarea value={q.pergunta} onChange={e => setQ("pergunta", e.target.value)} placeholder="Texto da pergunta..." rows={2}
                      style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:10, resize:"vertical", lineHeight:1.5 }} />
                    {["a","b","c","d"].map(l => (
                      <div key={l} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                        <div style={{ width:24, height:24, borderRadius:2, background:q.correta===l?PC:C.BORDER2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:C.WHITE, flexShrink:0, cursor:"pointer" }}
                          onClick={() => setQ("correta", l)}>{l.toUpperCase()}</div>
                        <input value={q[`opcao_${l}`]} onChange={e => setQ(`opcao_${l}`, e.target.value)} placeholder={`Opção ${l.toUpperCase()}`}
                          style={{ flex:1, background:q.correta===l?"rgba(26,122,74,0.08)":C.NAV, border:`1px solid ${q.correta===l?PC:C.BORDER2}`, borderRadius:2, padding:"8px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit" }} />
                        {q.correta===l && <span style={{ fontSize:9, color:PC, fontWeight:900, letterSpacing:1 }}>✓ CORRETA</span>}
                      </div>
                    ))}
                    <textarea value={q.explicacao} onChange={e => setQ("explicacao", e.target.value)} placeholder="Explicação da resposta correta (opcional)..." rows={2}
                      style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", marginTop:4, marginBottom:14, resize:"vertical", lineHeight:1.5 }} />
                    <div style={{ fontSize:11, color:C.MUTED, marginBottom:12 }}>Clique na letra para definir a resposta correta.</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={salvarQuestao} style={{ background:PC, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
                        {editandoQuestao ? "Salvar Alteração" : "Adicionar Questão"}
                      </button>
                      <button onClick={() => { setEditandoQuestao(null); setAddingQuestao(false); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 16px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Cancelar</button>
                    </div>
                  </div>
                );
              })()}

              {!editandoQuestao && !addingQuestao && (
                <button onClick={() => setAddingQuestao(true)} style={{ background:"none", border:`1px dashed ${PC}`, borderRadius:2, padding:"10px 20px", color:PC, cursor:"pointer", fontSize:10, letterSpacing:2, fontWeight:800, textTransform:"uppercase", fontFamily:"inherit", width:"100%", marginBottom:16 }}>
                  + Adicionar Nova Questão
                </button>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {questoes.length === 0
                  ? <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:20, color:C.MUTED, fontSize:13 }}>Nenhuma questão cadastrada.</div>
                  : questoes.map((q, i) => (
                    <div key={q.id} style={{ background:editandoQuestao?.id===q.id?C.CARD2:C.CARD, border:`1px solid ${editandoQuestao?.id===q.id?PC:C.BORDER}`, borderRadius:2, padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                        <div style={{ fontSize:10, color:C.MUTED, fontWeight:800, letterSpacing:1, minWidth:22, paddingTop:2 }}>#{i+1}</div>
                        <div style={{ flex:1, fontSize:14, fontWeight:700, color:C.WHITE, lineHeight:1.5 }}>{q.pergunta}</div>
                        <button onClick={() => { setEditandoQuestao({...q}); setAddingQuestao(false); window.scrollTo(0,0); }}
                          style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"3px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit", flexShrink:0 }}>Editar</button>
                        <button onClick={() => excluirQuestao(q.id)}
                          style={{ background:"none", border:`1px solid rgba(192,57,43,0.4)`, borderRadius:2, padding:"3px 10px", color:C.RED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit", flexShrink:0 }}>Excluir</button>
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6, paddingLeft:32 }}>
                        {["a","b","c","d"].map(l => (
                          <div key={l} style={{ padding:"4px 10px", borderRadius:2, background:q.correta===l?"rgba(46,204,113,0.1)":C.NAV, border:`1px solid ${q.correta===l?"#2ecc71":C.BORDER}`, fontSize:12, color:q.correta===l?"#2ecc71":C.MUTED, display:"flex", gap:6, alignItems:"center" }}>
                            <span style={{ fontWeight:900, fontSize:10 }}>{l.toUpperCase()}.</span> {q[`opcao_${l}`] || "—"}
                            {q.correta===l && <span style={{ fontSize:9, fontWeight:900 }}>✓</span>}
                          </div>
                        ))}
                      </div>
                      {q.explicacao && (
                        <div style={{ marginTop:8, paddingLeft:32, fontSize:12, color:C.MUTED, fontStyle:"italic", lineHeight:1.5 }}>💡 {q.explicacao}</div>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUGESTÕES */}
      {subAba === "sugestoes" && (
        <div>
          <div style={{ fontSize:10, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:16 }}>
            {sugestoes.filter(s => s.status==="pendente").length} pendentes · {sugestoes.filter(s => s.status==="aprovada").length} aprovadas · {sugestoes.filter(s => s.status==="rejeitada").length} rejeitadas
          </div>
          {loading ? <div style={{ padding:20, color:C.MUTED }}>Carregando...</div> :
            sugestoes.length === 0 ? <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:24, textAlign:"center", color:C.MUTED, fontSize:13 }}>Nenhuma sugestão recebida ainda.</div> :
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {sugestoes.map(s => (
                <div key={s.id} style={{ background:C.CARD, border:`1px solid ${s.status==="pendente"?PC:s.status==="aprovada"?"#2ecc71":"rgba(192,57,43,0.4)"}`, borderRadius:2, padding:"16px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:C.WHITE }}>{s.titulo}</div>
                      <div style={{ fontSize:11, color:C.MUTED }}>{s.programador_nome} · {new Date(s.created_at).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <div style={{ fontSize:9, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", color:s.status==="pendente"?PC:s.status==="aprovada"?C.GREEN:C.RED, border:`1px solid ${s.status==="pendente"?PC:s.status==="aprovada"?"#2ecc71":"rgba(192,57,43,0.5)"}`, borderRadius:2, padding:"3px 8px" }}>
                      {s.status==="pendente"?"⏳ Pendente":s.status==="aprovada"?"✓ Aprovada":"✗ Rejeitada"}
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:C.MUTED, lineHeight:1.6, whiteSpace:"pre-line", maxHeight:100, overflow:"hidden", marginBottom:12 }}>{s.conteudo}</div>
                  {s.feedback_adm && <div style={{ fontSize:12, color:C.MUTED, fontStyle:"italic", marginBottom:12 }}>Feedback: {s.feedback_adm}</div>}
                  {s.status === "pendente" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <input value={feedbackRejeitar[s.id]||""} onChange={e => setFeedbackRejeitar(p => ({...p, [s.id]:e.target.value}))} placeholder="Feedback ao rejeitar (opcional)..."
                        style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"8px 12px", color:C.WHITE, fontSize:12, outline:"none", fontFamily:"inherit" }} />
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => aprovarSugestao(s)} style={{ flex:1, background:PC, border:"none", borderRadius:2, padding:"10px", color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>✓ Aprovar e Criar Regra</button>
                        <button onClick={() => rejeitarSugestao(s)} style={{ flex:1, background:"none", border:"1px solid rgba(192,57,43,0.5)", borderRadius:2, padding:"10px", color:C.RED, fontWeight:700, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>✗ Rejeitar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          }
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// PAINEL ADM — EDITOR DE ONBOARDING (todos os módulos)
// ══════════════════════════════════════════════════
function PainelOnboardingAdm({ showMsg }) {
  const [modulo, setModulo] = useState("motorista");
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null); // null | slide obj
  const [novoSlide, setNovoSlide] = useState({ icon:"📋", tag:"", title:"", sub:"", body:"" });
  const [adding, setAdding] = useState(false);

  const MODULOS = [
    { id:"motorista",   label:"🚛 Motoristas",     cor:C.RED },
    { id:"oficina",     label:"🔧 Oficina",         cor:"#e67e22" },
    { id:"programador", label:"📋 Programadores",   cor:"#1a7a4a" },
  ];
  const corAtual = MODULOS.find(m => m.id === modulo)?.cor || C.RED;

  useEffect(() => { carregar(); }, [modulo]);

  const carregar = async () => {
    setLoading(true);
    try {
      const d = await sb.get("onboarding_slides", `modulo=eq.${modulo}&order=ordem.asc`);
      setSlides(Array.isArray(d) ? d : []);
    } catch {}
    setLoading(false);
  };

  const salvarSlide = async () => {
    const dados = editando || novoSlide;
    if (!dados.title.trim() || !dados.body.trim()) { showMsg("Preencha pelo menos título e conteúdo.", C.RED); return; }
    try {
      if (editando) {
        await sb.patch("onboarding_slides", `id=eq.${editando.id}`, {
          icon: editando.icon, tag: editando.tag, title: editando.title,
          sub: editando.sub, body: editando.body,
        });
        showMsg("Slide atualizado!");
        setEditando(null);
      } else {
        const maxOrdem = slides.length > 0 ? Math.max(...slides.map(s => s.ordem || 0)) : 0;
        await sb.post("onboarding_slides", {
          modulo, ordem: maxOrdem + 1,
          icon: novoSlide.icon || "📋", tag: novoSlide.tag, title: novoSlide.title,
          sub: novoSlide.sub, body: novoSlide.body, ativo: true,
        });
        showMsg("Slide adicionado!");
        setNovoSlide({ icon:"📋", tag:"", title:"", sub:"", body:"" });
        setAdding(false);
      }
      carregar();
    } catch { showMsg("Erro ao salvar slide.", C.RED); }
  };

  const excluirSlide = async (id) => {
    if (!window.confirm("Excluir este slide do onboarding?")) return;
    await sb.delete("onboarding_slides", `id=eq.${id}`);
    showMsg("Slide excluído.");
    carregar();
  };

  const mover = async (index, direcao) => {
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= slides.length) return;
    const a = slides[index], b = slides[alvo];
    await Promise.all([
      sb.patch("onboarding_slides", `id=eq.${a.id}`, { ordem: b.ordem }),
      sb.patch("onboarding_slides", `id=eq.${b.id}`, { ordem: a.ordem }),
    ]);
    carregar();
  };

  return (
    <div>
      {/* Seletor de módulo */}
      <div style={{ display:"flex", gap:0, marginBottom:20, background:C.NAV, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
        {MODULOS.map(m => (
          <button key={m.id} onClick={() => { setModulo(m.id); setEditando(null); setAdding(false); }}
            style={{ flex:1, padding:"11px 8px", background:modulo===m.id?C.CARD:"none", border:"none", borderBottom:modulo===m.id?`2px solid ${m.cor}`:"2px solid transparent", color:modulo===m.id?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize:10, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:16 }}>
        {slides.length} slide{slides.length !== 1 ? "s" : ""} cadastrado{slides.length !== 1 ? "s" : ""}
      </div>

      {/* Formulário de edição/adição */}
      {(editando || adding) && (() => {
        const s = editando || novoSlide;
        const setS = editando
          ? (field, val) => setEditando(p => ({...p, [field]:val}))
          : (field, val) => setNovoSlide(p => ({...p, [field]:val}));
        return (
          <div style={{ background:C.CARD, border:`2px solid ${corAtual}`, borderRadius:2, padding:20, marginBottom:20 }}>
            <div style={{ fontSize:10, color:corAtual, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>
              {editando ? "✏️ Editar Slide" : "➕ Novo Slide"}
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <input value={s.icon} onChange={e => setS("icon", e.target.value)} placeholder="🚛"
                style={{ width:60, background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:20, outline:"none", fontFamily:"inherit", textAlign:"center" }} />
              <input value={s.tag} onChange={e => setS("tag", e.target.value)} placeholder="TAG (ex: BOAS-VINDAS)"
                style={{ flex:1, background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", textTransform:"uppercase" }} />
            </div>
            <input value={s.title} onChange={e => setS("title", e.target.value)} placeholder="Título do slide"
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:15, fontWeight:700, outline:"none", fontFamily:"inherit", marginBottom:8 }} />
            <input value={s.sub} onChange={e => setS("sub", e.target.value)} placeholder="Subtítulo (linha de apoio)"
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", marginBottom:8 }} />
            <textarea value={s.body} onChange={e => setS("body", e.target.value)} placeholder="Conteúdo do slide... (use quebras de linha para separar parágrafos)" rows={6}
              style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", marginBottom:14, resize:"vertical", lineHeight:1.6 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={salvarSlide} style={{ background:corAtual, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
                {editando ? "Salvar Alteração" : "Adicionar Slide"}
              </button>
              <button onClick={() => { setEditando(null); setAdding(false); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 16px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Cancelar</button>
            </div>
          </div>
        );
      })()}

      {!editando && !adding && (
        <button onClick={() => setAdding(true)} style={{ background:"none", border:`1px dashed ${corAtual}`, borderRadius:2, padding:"10px 20px", color:corAtual, cursor:"pointer", fontSize:10, letterSpacing:2, fontWeight:800, textTransform:"uppercase", fontFamily:"inherit", width:"100%", marginBottom:16 }}>
          + Adicionar Novo Slide
        </button>
      )}

      {/* Lista de slides */}
      {loading ? <div style={{ padding:20, color:C.MUTED }}>Carregando...</div> :
        slides.length === 0 ? (
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:24, textAlign:"center", color:C.MUTED, fontSize:13 }}>
            Nenhum slide cadastrado para este módulo ainda.
            {modulo === "oficina" && " A aba de Onboarding só aparece para o mecânico quando houver pelo menos 1 slide."}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {slides.map((s, i) => (
              <div key={s.id} style={{ background:editando?.id===s.id?C.CARD2:C.CARD, border:`1px solid ${editando?.id===s.id?corAtual:C.BORDER}`, borderRadius:2, padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:2, flexShrink:0 }}>
                    <button onClick={() => mover(i, -1)} disabled={i===0} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, width:22, height:18, color:i===0?C.MUTED2:C.MUTED, cursor:i===0?"not-allowed":"pointer", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
                    <button onClick={() => mover(i, 1)} disabled={i===slides.length-1} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, width:22, height:18, color:i===slides.length-1?C.MUTED2:C.MUTED, cursor:i===slides.length-1?"not-allowed":"pointer", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
                  </div>
                  <div style={{ fontSize:20, flexShrink:0 }}>{s.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:9, color:corAtual, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>#{i+1} · {s.tag}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.WHITE, marginBottom:2 }}>{s.title}</div>
                    <div style={{ fontSize:11, color:C.MUTED, marginBottom:6 }}>{s.sub}</div>
                    <div style={{ fontSize:12, color:C.MUTED, lineHeight:1.6, whiteSpace:"pre-line", maxHeight:60, overflow:"hidden" }}>{s.body}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                    <button onClick={() => { setEditando({...s}); setAdding(false); window.scrollTo(0,0); }}
                      style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"3px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>Editar</button>
                    <button onClick={() => excluirSlide(s.id)}
                      style={{ background:"none", border:`1px solid rgba(192,57,43,0.4)`, borderRadius:2, padding:"3px 10px", color:C.RED, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", fontFamily:"inherit" }}>Excluir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
