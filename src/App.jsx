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

const ONBOARDING = [
  { icon:"🚛", tag:"BOAS-VINDAS", title:"Bem-vindo à Bendini", sub:"Você agora é um Gestor de Unidade Móvel", body:"Essa é a denominação especial que damos aos nossos motoristas, reconhecendo sua importância estratégica.\n\n\"Desejamos as boas-vindas, muitas realizações e sucesso.\"\n— Everton Pereira Bendini" },
  { icon:"📋", tag:"INTEGRAÇÃO", title:"Primeiros 2 Dias", sub:"Apresentação em todos os setores", body:"Você será conduzido pelo seu gestor direto em uma integração completa.\n\nNo primeiro dia você recebe:\n— Kit de EPIs completo\n— Crachá e uniforme\n— Chip corporativo VIVO\n— Inclusão nos grupos de WhatsApp\n\nUso obrigatório: calça jeans ou brim + sapato de segurança + crachá." },
  { icon:"📡", tag:"COMUNICAÇÃO", title:"Grupos e Comunicação", sub:"Comunicação proativa é fundamental", body:"2 grupos de WhatsApp obrigatórios:\n\nFROTA/GESTOR: operações e status de viagem.\nUTILIDADES: informações gerais — sempre reagir com 👍🏻.\n\nChip VIVO: prefixo 15 (015 + DDD + número).\nReunião mensal todo segundo sábado — obrigatória." },
  { icon:"💰", tag:"REMUNERAÇÃO", title:"Salário e Prêmios", sub:"Seu desempenho define seu ganho", body:"FIXO: salário base + 30% periculosidade + DSR + Cartão Caju R$95/dia.\n\nPRÊMIOS VARIÁVEIS:\n— 3% Produtividade\n— 1% Comprometimento\n— 1% Não Avarias\n— 4% Extra Economia\n\nTotal: 9% sobre o faturamento." },
  { icon:"📊", tag:"RANKING", title:"Ranking de Desempenho", sub:"Média dos últimos 6 meses", body:"Critérios:\n— Faturamento: até 5 pontos\n— Extra Economia: até 1,5 pontos\n— Ocorrências: até 2 pontos\n\nMínimo: 8,5 pontos.\nAbaixo de 8,0 por 3 meses = risco de rescisão." },
  { icon:"⚠️", tag:"SEGURANÇA", title:"Segurança na Estrada", sub:"Regras inegociáveis", body:"VELOCIDADES:\n— Geral: 85 km/h\n— Chuva/neblina: 75 km/h\n— Químico: 80 km/h\n— Pedágios: 40 km/h\n\nJORNADA: parar até 23h / retomar às 04h.\nCinto sempre. Celular proibido ao volante." },
  { icon:"🗺️", tag:"OPERAÇÃO", title:"Viagem — Passo a Passo", sub:"Protocolo obrigatório", body:"1. Receber programação no grupo\n2. Enviar macro INÍCIO DE VIAGEM\n3. Aguardar 'LIBERADO'\n4. Comunicar cada etapa\n5. Reaperto das cintas a cada 200 km\n6. Macro de FIM só com canhotos assinados\n7. Foto dos comprovantes no grupo" },
  { icon:"🏆", tag:"CONCLUÍDO", title:"Pronto para o Trabalho!", sub:"Onboarding básico concluído", body:"Lembre sempre:\n— Comunicação proativa em cada etapa\n— Respeite velocidades e jornada\n— Cuide do veículo como se fosse seu\n— Ranking elevado = mais prêmios\n— Use o BEN para qualquer dúvida\n\nBem-vindo ao time Bendini!" },
];

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
      const data = await sb.get("motoristas", `cpf=eq.${c}&ativo=eq.true`);
      if (!Array.isArray(data) || data.length === 0) setErro("CPF não encontrado ou inativo. Fale com seu gestor.");
      else onLogin({ cpf: c, nome: data[0].nome });
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
  const [tentativas, setTentativas] = useState([]);
  const [motoristasList, setMotoristasList] = useState([]);

  const showMsg = (m, cor = C.GREEN) => { setMsg({ text: m, cor }); setTimeout(() => setMsg(""), 4000); };

  useEffect(() => { carregar(); }, [aba]);

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
    const t = await sb.get("quiz_tentativas", `quiz_id=eq.${quiz.id}&order=created_at.desc`);
    setTentativas(Array.isArray(t) ? t : []);
  };

  const ABAS = [
    { id:"motoristas", label:"Motoristas" },
    { id:"quizzes",    label:"Quizzes" },
    { id:"regras",     label:"Regras" },
  ];

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

      <div style={{ flex:1, overflowY:"auto", padding:20 }}>

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
            <button onClick={() => setQuizDetalhe(null)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"6px 14px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit", marginBottom:16 }}>← Voltar</button>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"16px 20px", marginBottom:16 }}>
              <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:4 }}>Quiz</div>
              <div style={{ fontSize:18, fontWeight:900, color:C.WHITE }}>{quizDetalhe.titulo}</div>
            </div>

            {/* Motoristas que responderam */}
            <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>
              ✓ Responderam ({tentativas.length})
            </div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden", marginBottom:16 }}>
              {tentativas.length === 0 ? <div style={{ padding:16, color:C.MUTED, fontSize:13 }}>Nenhum motorista respondeu ainda.</div> :
                tentativas.map((t, i) => (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderBottom:i<tentativas.length-1?`1px solid ${C.BORDER}`:"none" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.WHITE }}>{t.motorista_nome}</div>
                      <div style={{ fontSize:11, color:C.MUTED }}>{formatCPF(t.motorista_cpf)} — {new Date(t.created_at).toLocaleDateString("pt-BR")} {new Date(t.created_at).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:16, fontWeight:900, color:t.percentual>=80?C.GREEN:t.percentual>=60?C.YELLOW:C.RED }}>{Number(t.percentual).toFixed(0)}%</div>
                      <div style={{ fontSize:10, color:C.MUTED }}>{t.score}/{t.total}</div>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Motoristas que NÃO responderam */}
            {(() => {
              const responderam = new Set(tentativas.map(t => t.motorista_cpf));
              const pendentes = motoristasList.filter(m => !responderam.has(m.cpf));
              return (
                <>
                  <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>
                    ✗ Pendentes ({pendentes.length})
                  </div>
                  <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
                    {pendentes.length === 0 ? <div style={{ padding:16, color:C.GREEN, fontSize:13, fontWeight:700 }}>✓ Todos os motoristas responderam!</div> :
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
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.NAV}}::-webkit-scrollbar-thumb{background:${C.BORDER2};border-radius:2px}input::placeholder,textarea::placeholder{color:${C.MUTED2}}button:focus{outline:none}`}</style>
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

  const answer = (letra) => {
    if (qsel) return;
    setQsel(letra);
    setQshow(true);
    if (letra === questoes[qi].correta) setScore(s => s + 1);
  };

  const next = async () => {
    if (qi + 1 >= questoes.length) {
      const pct = ((score + (qsel === questoes[qi].correta ? 1 : 0)) / questoes.length) * 100;
      const finalScore = score + (qsel === questoes[qi].correta ? 1 : 0);
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
// LISTA DE QUIZZES DO MOTORISTA
// ══════════════════════════════════════════════════
function ListaQuizzes({ usuario, onIniciar }) {
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
          <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:10 }}>
            🔴 Pendentes ({pendentes.length})
          </div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden", marginBottom:20 }}>
            {pendentes.map((q, i) => (
              <div key={q.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i<pendentes.length-1?`1px solid ${C.BORDER}`:"none" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div>
                  <div style={{ fontSize:11, color:C.MUTED }}>10 perguntas — Não respondido</div>
                </div>
                <button onClick={() => onIniciar(q)} style={{ background:C.RED, border:"none", borderRadius:2, padding:"8px 16px", color:C.WHITE, cursor:"pointer", fontSize:10, letterSpacing:1.5, fontWeight:900, textTransform:"uppercase", fontFamily:"inherit" }}>
                  Responder →
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {feitos.length > 0 && (
        <>
          <div style={{ fontSize:10, color:C.GREEN, letterSpacing:2, fontWeight:800, textTransform:"uppercase", marginBottom:10 }}>
            ✓ Respondidos ({feitos.length})
          </div>
          <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
            {feitos.map((q, i) => {
              const ts = tentativasPorQuiz[q.id];
              const melhor = Math.max(...ts.map(t => t.percentual));
              const ultima = ts[0];
              return (
                <div key={q.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i<feitos.length-1?`1px solid ${C.BORDER}`:"none" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{q.titulo}</div>
                    <div style={{ fontSize:11, color:C.MUTED }}>Melhor: {Number(melhor).toFixed(0)}% — {ts.length}x respondido</div>
                  </div>
                  <div style={{ textAlign:"right", marginRight:10 }}>
                    <div style={{ fontSize:16, fontWeight:900, color:melhor>=80?C.GREEN:melhor>=60?C.YELLOW:C.RED }}>{Number(melhor).toFixed(0)}%</div>
                  </div>
                  <button onClick={() => onIniciar(q)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"6px 14px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>
                    Refazer
                  </button>
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
  const [quizzesCount, setQuizzesCount] = useState(0);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const handleLogin = async (user) => {
    setUsuario(user);
    setLoadingHist(true);
    try {
      const [hist, regs, qz, tent] = await Promise.all([
        sb.get("historico_conversa", `motorista_nome=eq.${encodeURIComponent(user.cpf)}&order=created_at.asc&limit=100`),
        sb.get("regras", "ativo=eq.true&order=ordem.asc"),
        sb.get("quizzes", "status=eq.ativo"),
        sb.get("quiz_tentativas", `motorista_cpf=eq.${user.cpf}`),
      ]);
      setRegrasAdm(Array.isArray(regs) ? regs : []);
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

    // Monta conteúdo da mensagem (com ou sem imagem)
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

    const newMsgs = [...msgs, { role:"user", content: userContent }];
    // Para exibir na tela, guarda versão simplificada
    const msgDisplay = { role:"user", content: txt, imagem: preview };
    setMsgs(p => [...p, msgDisplay]);
    setLoading(true);
    try {
      // Para a API, usa as msgs com o conteúdo correto
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
          <button key={t.id} onClick={() => { setTab(t.id); setQuizAtivo(null); }} style={{ flex:1, padding:"13px 4px", background:t.id===tab?C.CARD:"none", border:"none", borderBottom:t.id===tab?`2px solid ${C.RED}`:"2px solid transparent", color:t.id===tab?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", position:"relative" }}>
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
                    {m.imagem && (
                      <img src={m.imagem} alt="foto enviada" style={{ width:"100%", maxWidth:220, display:"block", borderRadius:"10px 10px 2px 2px" }} />
                    )}
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
            {/* Preview da imagem selecionada */}
            {imagemPreview && (
              <div style={{ padding:"8px 16px 0", background:C.NAV, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                <img src={imagemPreview} alt="preview" style={{ width:52, height:52, objectFit:"cover", borderRadius:4, border:`1px solid ${C.BORDER2}` }} />
                <div style={{ fontSize:11, color:C.MUTED, flex:1 }}>Imagem pronta para enviar</div>
                <button onClick={limparFoto} style={{ background:"none", border:"none", color:C.RED, cursor:"pointer", fontSize:16, padding:4 }}>✕</button>
              </div>
            )}
            <div style={{ padding:"10px 16px 12px", borderTop:`1px solid ${C.BORDER}`, display:"flex", gap:8, background:C.NAV, flexShrink:0 }}>
              {/* Input de arquivo oculto */}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFoto} style={{ display:"none" }} />
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()} placeholder={ouvindo?"Ouvindo... fale agora":imagemBase64?"Descreva sua dúvida sobre a foto...":"Digite ou use o microfone..."}
                style={{ flex:1, background:C.CARD, border:`1px solid ${ouvindo?C.RED:imagemBase64?"#f39c12":C.BORDER2}`, borderRadius:2, padding:"11px 14px", color:C.TEXT, fontSize:13, outline:"none", fontFamily:"inherit", transition:"border 0.2s" }} />
              {/* Botão câmera */}
              <button onClick={() => fileInputRef.current?.click()} title="Enviar foto" style={{ background:imagemBase64?"rgba(243,156,18,0.15)":"rgba(192,57,43,0.15)", border:`1px solid ${imagemBase64?"#f39c12":C.BORDER2}`, borderRadius:2, width:46, cursor:"pointer", color:imagemBase64?"#f39c12":C.MUTED, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                📷
              </button>
              {/* Botão microfone */}
              <button onClick={toggleMic} style={{ background:ouvindo?C.RED:"rgba(192,57,43,0.15)", border:`1px solid ${ouvindo?C.RED:C.BORDER2}`, borderRadius:2, width:46, cursor:"pointer", color:ouvindo?C.WHITE:C.MUTED, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", animation:ouvindo?"micPulse 1s infinite":"none", flexShrink:0 }}>
                {ouvindo?"⏹":"🎤"}
              </button>
              <button onClick={send} disabled={loading||(!input.trim()&&!imagemBase64)} style={{ background:(!loading&&(input.trim()||imagemBase64))?C.RED:C.CARD2, border:"none", borderRadius:2, width:46, cursor:(!loading&&(input.trim()||imagemBase64))?"pointer":"not-allowed", color:(!loading&&(input.trim()||imagemBase64))?C.WHITE:C.MUTED2, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, flexShrink:0 }}>›</button>
            </div>
            {semMic && <div style={{ padding:"6px 16px 10px", fontSize:11, color:C.RED, background:C.NAV }}>⚠️ Microfone não suportado. Use Chrome ou Edge.</div>}
          </div>
        )}

        {/* ONBOARDING */}
        {tab === "onboarding" && (
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:9, color:C.MUTED, letterSpacing:2, textTransform:"uppercase", fontWeight:700 }}>Progresso</span>
              <span style={{ fontSize:9, color:C.RED, letterSpacing:1, fontWeight:800 }}>{step+1} / {ONBOARDING.length}</span>
            </div>
            <div style={{ height:2, background:C.BORDER, borderRadius:1, marginBottom:20 }}>
              <div style={{ height:"100%", width:`${((step+1)/ONBOARDING.length)*100}%`, background:C.RED, transition:"width 0.4s", borderRadius:1 }} />
            </div>
            <div style={{ display:"flex", gap:5, marginBottom:22 }}>
              {ONBOARDING.map((_,i) => <div key={i} onClick={() => setStep(i)} style={{ width:i===step?24:8, height:3, background:i<=step?C.RED:C.BORDER2, cursor:"pointer", transition:"all 0.3s", borderRadius:2 }} />)}
            </div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"24px 20px", marginBottom:16 }}>
              <div style={{ fontSize:10, display:"inline-block", background:C.RED, color:C.WHITE, letterSpacing:2, fontWeight:900, padding:"3px 9px", marginBottom:16, textTransform:"uppercase" }}>{ONBOARDING[step].tag}</div>
              <div style={{ fontSize:28, marginBottom:10 }}>{ONBOARDING[step].icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:C.WHITE, marginBottom:6, letterSpacing:-0.5, lineHeight:1.2 }}>{ONBOARDING[step].title}</div>
              <div style={{ fontSize:11, color:C.MUTED, letterSpacing:1.5, textTransform:"uppercase", fontWeight:700, marginBottom:20 }}>{ONBOARDING[step].sub}</div>
              <div style={{ fontSize:14, color:C.TEXT, whiteSpace:"pre-line", lineHeight:1.85 }}>{ONBOARDING[step].body}</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep(s => Math.max(0,s-1))} disabled={step===0} style={{ flex:1, padding:"13px", background:"none", border:`1px solid ${step===0?C.BORDER:C.BORDER2}`, borderRadius:2, color:step===0?C.MUTED2:C.MUTED, cursor:step===0?"not-allowed":"pointer", fontWeight:800, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>← Anterior</button>
              <button onClick={() => setStep(s => Math.min(ONBOARDING.length-1,s+1))} disabled={step===ONBOARDING.length-1} style={{ flex:2, padding:"13px", background:step===ONBOARDING.length-1?C.CARD2:C.RED, border:"none", borderRadius:2, color:step===ONBOARDING.length-1?C.MUTED2:C.WHITE, cursor:step===ONBOARDING.length-1?"not-allowed":"pointer", fontWeight:900, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Próximo →</button>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {tab === "quiz" && !quizAtivo && <ListaQuizzes usuario={usuario} onIniciar={setQuizAtivo} />}
        {tab === "quiz" && quizAtivo && <QuizDinamico quiz={quizAtivo} usuario={usuario} onFim={() => setQuizAtivo(null)} onVoltar={() => setQuizAtivo(null)} />}

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
