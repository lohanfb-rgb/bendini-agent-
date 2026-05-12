import { useState, useRef, useEffect } from "react";

// ── Configuração ───────────────────────────────────────────
const SB_URL = import.meta.env.SUPABASE_URL || "https://vqdkkqpxvszbdviljskn.supabase.co";
const SB_KEY = import.meta.env.SUPABASE_KEY;
const ADM_SENHA = "Bendini@2026";

const sbH = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

const sb = {
  get: async (table, query = "") => {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbH });
    return r.json();
  },
  post: async (table, body) => {
    await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: "POST", headers: { ...sbH, "Prefer": "return=minimal" },
      body: JSON.stringify(body),
    });
  },
  patch: async (table, query, body) => {
    await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
      method: "PATCH", headers: { ...sbH, "Prefer": "return=minimal" },
      body: JSON.stringify(body),
    });
  },
  delete: async (table, query) => {
    await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
      method: "DELETE", headers: sbH,
    });
  },
};

// ── Perguntas do Quiz (completo) ───────────────────────────
const QUIZ_BASE = [
  { q: "Qual é a velocidade máxima permitida pelo sistema de telemetria?", opts: ["80 km/h", "85 km/h", "90 km/h", "100 km/h"], c: 1, exp: "Máximo de 85 km/h, tolerância de até 8 picos por semana." },
  { q: "Com que frequência deve ser feito o reaperto das cintas de amarração?", opts: ["A cada 100 km", "A cada 150 km", "A cada 200 km", "A cada 300 km"], c: 2, exp: "Reaperto a cada 200 km. Nos primeiros 80 km, parada obrigatória." },
  { q: "Nota abaixo de 8,0 no ranking por 3 meses consecutivos resulta em:", opts: ["Desconto no salário", "Treinamento obrigatório", "Possível rescisão do contrato", "Advertência verbal"], c: 2, exp: "Nota inferior a 8,0 por 3 meses consecutivos pode resultar em rescisão contratual." },
  { q: "Ao ver luz VERMELHA no painel do Volvo, você deve:", opts: ["Continuar e avisar na base", "Parar, acionar VAS e comunicar a oficina", "Reduzir velocidade e continuar", "Ligar para o programador"], c: 1, exp: "Vermelho = parar imediatamente + acionar VAS + comunicar oficina." },
  { q: "Qual é o horário máximo de parada das atividades noturnas?", opts: ["22h, retorno às 5h", "23h, retorno às 4h", "00h, retorno às 5h", "21h, retorno às 6h"], c: 1, exp: "Parar até 23h. Retorno somente a partir das 04h." },
  { q: "Qual é o percentual total máximo de prêmios variáveis?", opts: ["5%", "7%", "9%", "12%"], c: 2, exp: "9% total: 3% produtividade + 1% comprometimento + 1% não avarias + 4% extra economia." },
  { q: "Velocidade máxima com produto químico em dia de chuva:", opts: ["80 km/h", "75 km/h", "70 km/h", "60 km/h"], c: 2, exp: "Chuva com produto químico: máximo 70 km/h. Curvas: abaixo de 60 km/h." },
  { q: "Onde ficam as chaves ao deixar o caminhão no pátio Bendini?", opts: ["No bolso", "Na ignição", "No painel de chaves da Oficina", "Com o programador"], c: 2, exp: "Sempre no Painel de Chaves da Oficina, conforme número de cada frota." },
  { q: "Qual é o valor do Cartão Caju por dia trabalhado?", opts: ["R$ 75,00", "R$ 85,00", "R$ 95,00", "R$ 105,00"], c: 2, exp: "O Cartão Caju vale R$ 95,00 por dia trabalhado." },
  { q: "Qual é a tolerância de picos de velocidade acima do limite por semana?", opts: ["Até 3 picos", "Até 5 picos", "Até 8 picos", "Até 10 picos"], c: 2, exp: "A telemetria permite até 8 picos por semana acima de 85 km/h." },
  { q: "O que deve ser feito antes de partir em viagem após o carregamento?", opts: ["Ligar para o cliente", "Enviar macro de início e aguardar 'LIBERADO'", "Verificar o combustível", "Avisar a família"], c: 1, exp: "Obrigatório enviar macro de início de viagem e aguardar a mensagem 'LIBERADO'." },
  { q: "Qual é a velocidade máxima em pedágios?", opts: ["20 km/h", "30 km/h", "40 km/h", "50 km/h"], c: 2, exp: "Velocidade máxima em pedágios é de 40 km/h." },
  { q: "Qual é o percentual de periculosidade sobre o salário base?", opts: ["20%", "25%", "30%", "35%"], c: 2, exp: "O adicional de periculosidade é de 30% sobre o salário base." },
  { q: "O que acontece com falta injustificada na reunião mensal?", opts: ["Advertência verbal", "Desconto no salário", "Desclassificação da premiação mensal", "Nenhuma consequência"], c: 2, exp: "Falta injustificada na reunião = desclassificação da premiação mensal." },
  { q: "Qual é o peso máximo de tração para caminhão toco?", opts: ["8 toneladas", "10 toneladas", "12 toneladas", "15 toneladas"], c: 1, exp: "Peso máximo de tração para toco é 10 toneladas." },
  { q: "O que é PROIBIDO fazer com a câmera interna do veículo?", opts: ["Deixar ligada", "Obstruir ou cobrir", "Filmar a carga", "Nada, pode tudo"], c: 1, exp: "Obstruir ou cobrir a câmera interna resulta em advertência por escrito e perda da premiação." },
  { q: "Quando deve ser feita a Macro de Fim de Viagem?", opts: ["Ao chegar na cidade destino", "Somente com canhotos assinados", "Ao descarregar", "A qualquer momento"], c: 1, exp: "A Macro de Fim de Viagem só pode ser enviada com os canhotos devidamente assinados." },
  { q: "Qual é a velocidade máxima em chuva ou neblina (sem produto químico)?", opts: ["65 km/h", "70 km/h", "75 km/h", "80 km/h"], c: 2, exp: "Em chuva ou neblina a velocidade máxima é 75 km/h." },
  { q: "Qual certificação a Bendini possui relacionada ao meio ambiente?", opts: ["ISO 9001", "ISO 14001", "SASSMAQ", "OEA"], c: 1, exp: "A ISO 14001 é a certificação de gestão ambiental da Bendini." },
  { q: "Pernoites durante as viagens devem ser feitos:", opts: ["Em qualquer posto de combustível", "Apenas em locais homologados", "Onde o motorista preferir", "Somente em hotéis"], c: 1, exp: "Pernoites são permitidos apenas em locais previamente homologados pela empresa." },
  { q: "O que deve ser feito ao retornar de férias no primeiro dia?", opts: ["Pegar as chaves do caminhão", "Realizar exame periódico (ASO)", "Participar de reunião", "Checar o veículo"], c: 1, exp: "No retorno de férias é obrigatório realizar o exame periódico (ASO) no primeiro dia." },
  { q: "Qual é a distância mínima entre caminhões da frota Bendini em comboio?", opts: ["500 metros", "800 metros", "1000 metros", "1500 metros"], c: 2, exp: "É proibido fazer comboio com menos de 1000 metros de distância entre os caminhões." },
  { q: "Quanto tempo máximo o veículo pode ficar ligado parado?", opts: ["1 minuto", "2 minutos", "3 minutos", "5 minutos"], c: 2, exp: "É proibido deixar o veículo ligado por mais de 3 minutos parado." },
  { q: "O que deve ser feito com a carreta quando está no pátio (vazia ou carregada)?", opts: ["Deixar os eixos levantados", "Deixar os eixos baixados", "Não importa a posição", "Depende da carga"], c: 1, exp: "A carreta deve ficar sempre com os eixos baixados quando estiver no pátio." },
  { q: "Qual é a pontuação mínima desejada no ranking de desempenho?", opts: ["7,5 pontos", "8,0 pontos", "8,5 pontos", "9,0 pontos"], c: 2, exp: "A pontuação mínima desejada é 8,5 pontos. Abaixo de 8,0 por 3 meses = risco de rescisão." },
];

const ONBOARDING = [
  { icon: "🚛", tag: "BOAS-VINDAS", title: "Bem-vindo à Bendini", sub: "Você agora é um Gestor de Unidade Móvel", body: "Essa é a denominação especial que damos aos nossos motoristas, reconhecendo sua importância estratégica para as operações.\n\n\"Desejamos as boas-vindas, muitas realizações e sucesso.\"\n— Everton Pereira Bendini\n\nNos próximos passos, você vai aprender tudo que precisa saber para começar com segurança e excelência na Bendini." },
  { icon: "📋", tag: "INTEGRAÇÃO", title: "Primeiros 2 Dias", sub: "Apresentação em todos os setores", body: "Você será conduzido pelo seu gestor direto em uma integração completa.\n\nNo primeiro dia você recebe:\n— Kit de EPIs completo\n— Crachá e uniforme\n— Chip corporativo VIVO\n— Inclusão nos grupos de WhatsApp\n\nUso obrigatório: calça jeans ou brim + sapato de segurança + crachá." },
  { icon: "📡", tag: "COMUNICAÇÃO", title: "Grupos e Comunicação", sub: "Comunicação proativa é fundamental", body: "2 grupos de WhatsApp obrigatórios:\n\nFROTA/GESTOR: operações e status de viagem.\n\nUTILIDADES: informações gerais — sempre reagir com 👍🏻.\n\nChip VIVO: prefixo 15 (015 + DDD + número).\n\nReunião mensal todo segundo sábado — obrigatória." },
  { icon: "💰", tag: "REMUNERAÇÃO", title: "Salário e Prêmios", sub: "Seu desempenho define seu ganho", body: "FIXO: salário base + 30% periculosidade + DSR + Cartão Caju R$95/dia.\n\nPRÊMIOS VARIÁVEIS:\n— 3% Produtividade\n— 1% Comprometimento\n— 1% Não Avarias\n— 4% Extra Economia\n\nTotal: 9% sobre o faturamento.\nEx: R$56.000 = R$5.040 em prêmios." },
  { icon: "📊", tag: "RANKING", title: "Ranking de Desempenho", sub: "Média dos últimos 6 meses", body: "Critérios:\n— Faturamento: até 5 pontos\n— Extra Economia: até 1,5 pontos\n— Ocorrências: até 2 pontos\n\nMínimo: 8,5 pontos.\nAbaixo de 8,0 por 3 meses = risco de rescisão.\n\nDisponível no 8quali e no WhatsApp." },
  { icon: "⚠️", tag: "SEGURANÇA", title: "Segurança na Estrada", sub: "Regras inegociáveis", body: "VELOCIDADES:\n— Geral: 85 km/h\n— Chuva/neblina: 75 km/h\n— Químico: 80 km/h\n— Pedágios: 40 km/h\n\nJORNADA: parar até 23h / retomar às 04h.\n\nCinto sempre. Celular proibido ao volante. Nunca obstruir câmera." },
  { icon: "🗺️", tag: "OPERAÇÃO", title: "Viagem — Passo a Passo", sub: "Protocolo obrigatório", body: "1. Receber programação no grupo\n2. Enviar macro INÍCIO DE VIAGEM\n3. Aguardar 'LIBERADO'\n4. Comunicar cada etapa\n5. Reaperto das cintas a cada 200 km\n6. Macro de FIM só com canhotos assinados\n7. Foto dos comprovantes no grupo" },
  { icon: "🏆", tag: "CONCLUÍDO", title: "Pronto para o Trabalho!", sub: "Onboarding básico concluído", body: "Lembre sempre:\n— Comunicação proativa em cada etapa\n— Respeite velocidades e jornada\n— Cuide do veículo como se fosse seu\n— Ranking elevado = mais prêmios\n— Use o BEN para qualquer dúvida\n\nBem-vindo ao time Bendini!" },
];

const C = {
  BG:"#0e1a2b", NAV:"#091520", CARD:"#13223a", CARD2:"#182d4a",
  BORDER:"#1c3050", BORDER2:"#254070", RED:"#c0392b",
  WHITE:"#ffffff", TEXT:"#d8e8f5", MUTED:"#5c7d9e", MUTED2:"#3a5a7a", GREEN:"#2ecc71",
};

const fmt = (txt) => txt.split("\n").map((l, i) => {
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
// TELA DE LOGIN
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
      if (!data || data.length === 0) {
        setErro("CPF não encontrado ou inativo. Fale com seu gestor.");
      } else {
        onLogin({ cpf: c, nome: data[0].nome });
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

      <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"36px 32px", width:"100%", maxWidth:380 }}>
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
              {loading ? "Verificando..." : "Acessar →"}
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
            <button onClick={entrarAdm} style={{ width:"100%", padding:"13px", background:C.RED, border:"none", borderRadius:2, color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:11, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit", marginTop:8 }}>
              Entrar →
            </button>
            <button onClick={() => { setAdmMode(false); setErro(""); setSenha(""); }} style={{ width:"100%", padding:"10px", background:"none", border:`1px solid ${C.BORDER}`, borderRadius:2, color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", fontFamily:"inherit", marginTop:10 }}>
              ← Voltar
            </button>
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
  const [rankings, setRankings] = useState([]);
  const [regras, setRegras] = useState([]);
  const [novoCpf, setNovoCpf] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novaRegra, setNovaRegra] = useState({ titulo:"", conteudo:"" });
  const [editandoRegra, setEditandoRegra] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  useEffect(() => { carregarDados(); }, [aba]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      if (aba === "motoristas") {
        const d = await sb.get("motoristas", "order=nome.asc");
        setMotoristas(Array.isArray(d) ? d : []);
      } else if (aba === "ranking") {
        const d = await sb.get("quiz_resultados", "order=percentual.desc");
        setRankings(Array.isArray(d) ? d : []);
      } else if (aba === "regras") {
        const d = await sb.get("regras", "order=ordem.asc");
        setRegras(Array.isArray(d) ? d : []);
      }
    } catch {}
    setLoading(false);
  };

  const adicionarMotorista = async () => {
    const c = cleanCPF(novoCpf);
    if (c.length !== 11 || !novoNome.trim()) { showMsg("Preencha CPF e nome completo."); return; }
    try {
      await sb.post("motoristas", { cpf: c, nome: novoNome.trim() });
      setNovoCpf(""); setNovoNome("");
      showMsg("Motorista cadastrado com sucesso!");
      carregarDados();
    } catch { showMsg("Erro ao cadastrar."); }
  };

  const toggleMotorista = async (id, ativo) => {
    await sb.patch("motoristas", `id=eq.${id}`, { ativo: !ativo });
    carregarDados();
  };

  const salvarRegra = async () => {
    if (!novaRegra.titulo.trim() || !novaRegra.conteudo.trim()) { showMsg("Preencha título e conteúdo."); return; }
    if (editandoRegra) {
      await sb.patch("regras", `id=eq.${editandoRegra}`, { titulo: novaRegra.titulo, conteudo: novaRegra.conteudo, updated_at: new Date().toISOString() });
      setEditandoRegra(null);
    } else {
      await sb.post("regras", { titulo: novaRegra.titulo, conteudo: novaRegra.conteudo, ordem: regras.length });
    }
    setNovaRegra({ titulo:"", conteudo:"" });
    showMsg("Regra salva!");
    carregarDados();
  };

  const excluirRegra = async (id) => {
    await sb.delete("regras", `id=eq.${id}`);
    showMsg("Regra excluída.");
    carregarDados();
  };

  const ABAS = [
    { id:"motoristas", label:"Motoristas" },
    { id:"ranking", label:"Ranking Quiz" },
    { id:"regras", label:"Regras" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.BG, fontFamily:"'Barlow','Segoe UI',sans-serif", color:C.TEXT, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.NAV, borderBottom:`1px solid ${C.BORDER}`, padding:"0 20px", display:"flex", alignItems:"center", height:62, gap:14, flexShrink:0 }}>
        <div style={{ width:3, height:36, background:C.RED, flexShrink:0 }} />
        <div>
          <div style={{ fontSize:18, fontWeight:900, letterSpacing:2, color:C.WHITE, textTransform:"uppercase", lineHeight:1 }}>Bendini</div>
          <div style={{ fontSize:8, letterSpacing:3, color:C.MUTED, textTransform:"uppercase", marginTop:3, fontWeight:600 }}>Painel ADM</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          {msg && <span style={{ fontSize:11, color:C.GREEN, fontWeight:700 }}>{msg}</span>}
          <button onClick={onSair} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"4px 10px", color:C.MUTED, cursor:"pointer", fontSize:9, letterSpacing:1.5, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>Sair</button>
        </div>
      </div>

      <div style={{ background:C.NAV, borderBottom:`1px solid ${C.BORDER}`, display:"flex", flexShrink:0 }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{ flex:1, padding:"13px 4px", background:a.id===aba?C.CARD:"none", border:"none", borderBottom:a.id===aba?`2px solid ${C.RED}`:"2px solid transparent", color:a.id===aba?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>{a.label}</button>
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

            <div style={{ fontSize:10, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>{motoristas.length} motoristas cadastrados</div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
              {loading ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Carregando...</div> :
                motoristas.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhum motorista cadastrado.</div> :
                motoristas.map((m, i) => (
                  <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:i<motoristas.length-1?`1px solid ${C.BORDER}`:"none", background:m.ativo?"transparent":"rgba(192,57,43,0.05)" }}>
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

        {/* RANKING QUIZ */}
        {aba === "ranking" && (
          <div>
            <div style={{ fontSize:10, color:C.MUTED, letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Ranking por melhor desempenho</div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
              {loading ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Carregando...</div> :
                rankings.length === 0 ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Nenhum resultado ainda.</div> :
                rankings.map((r, i) => (
                  <div key={r.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderBottom:i<rankings.length-1?`1px solid ${C.BORDER}`:"none" }}>
                    <div style={{ fontSize:18, fontWeight:900, color:i===0?"#f1c40f":i===1?C.MUTED:i===2?"#cd7f32":C.MUTED2, minWidth:28 }}>#{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.WHITE }}>{r.nome}</div>
                      <div style={{ fontSize:11, color:C.MUTED }}>{formatCPF(r.cpf)} — {new Date(r.created_at).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:18, fontWeight:900, color:r.percentual>=80?C.GREEN:r.percentual>=60?"#f39c12":C.RED }}>{r.percentual.toFixed(0)}%</div>
                      <div style={{ fontSize:10, color:C.MUTED }}>{r.score}/{r.total}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* REGRAS */}
        {aba === "regras" && (
          <div>
            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:10, color:C.RED, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:14 }}>
                {editandoRegra ? "Editar Regra" : "Nova Regra"}
              </div>
              <input value={novaRegra.titulo} onChange={e => setNovaRegra(p => ({...p, titulo:e.target.value}))} placeholder="Título da regra"
                style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:8 }} />
              <textarea value={novaRegra.conteudo} onChange={e => setNovaRegra(p => ({...p, conteudo:e.target.value}))} placeholder="Conteúdo da regra..." rows={4}
                style={{ width:"100%", background:C.NAV, border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"10px 12px", color:C.WHITE, fontSize:13, outline:"none", fontFamily:"inherit", marginBottom:12, resize:"vertical", lineHeight:1.6 }} />
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={salvarRegra} style={{ background:C.RED, border:"none", borderRadius:2, padding:"11px 20px", color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
                  {editandoRegra ? "Salvar Edição" : "+ Adicionar"}
                </button>
                {editandoRegra && (
                  <button onClick={() => { setEditandoRegra(null); setNovaRegra({titulo:"",conteudo:""}); }} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"11px 16px", color:C.MUTED, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>Cancelar</button>
                )}
              </div>
            </div>

            <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, overflow:"hidden" }}>
              {loading ? <div style={{ padding:20, color:C.MUTED, fontSize:13 }}>Carregando...</div> :
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
// APP PRINCIPAL (MOTORISTA)
// ══════════════════════════════════════════════════
export default function App() {
  const [usuario, setUsuario] = useState(null); // { cpf, nome }
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
  // Onboarding
  const [step, setStep] = useState(0);
  // Quiz
  const [qi, setQi] = useState(0);
  const [qsel, setQsel] = useState(null);
  const [qscore, setQscore] = useState(0);
  const [qdone, setQdone] = useState(false);
  const [qshow, setQshow] = useState(false);
  const [quizSalvo, setQuizSalvo] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const handleLogin = async (user) => {
    setUsuario(user);
    setLoadingHist(true);
    try {
      const [hist, regs] = await Promise.all([
        sb.get("historico_conversa", `motorista_nome=eq.${encodeURIComponent(user.cpf)}&order=created_at.asc&limit=100`),
        sb.get("regras", "ativo=eq.true&order=ordem.asc"),
      ]);
      setRegrasAdm(Array.isArray(regs) ? regs : []);
      if (Array.isArray(hist) && hist.length > 0) {
        setMsgs(hist.map(m => ({ role:m.role, content:m.content })));
      } else {
        setMsgs([{ role:"assistant", content:`Olá, **${user.nome}**! Sou o **BEN**, assistente oficial da Bendini Logística.\n\nEstou aqui para responder suas dúvidas sobre regras, procedimentos e tudo que você precisa saber para trabalhar na Bendini.\n\nComo posso ajudar?` }]);
      }
    } catch {
      setMsgs([{ role:"assistant", content:`Olá, **${user.nome}**! Sou o **BEN**.\n\nComo posso ajudar?` }]);
    }
    setLoadingHist(false);
  };

  // Constrói knowledge base com regras do ADM
  const buildKnowledge = () => {
    let base = `Você é o BEN, Assistente Oficial da Bendini Logística — agente de onboarding e instrução para Gestores de Unidade Móvel (motoristas próprios da Bendini). Responda sempre em português brasileiro.\n\nTOM E PERSONALIDADE:\nSeja firme e direto, mas acolhedor. Fale como um consultor experiente que respeita quem está do outro lado — nunca arrogante, nunca julgando. O objetivo é que o motorista saia da conversa se sentindo orientado e capaz, não constrangido.\n\n`;
    if (regrasAdm.length > 0) {
      base += "=== REGRAS E PROCEDIMENTOS BENDINI ===\n";
      regrasAdm.forEach(r => { base += `\n${r.titulo.toUpperCase()}:\n${r.conteudo}\n`; });
    } else {
      base += `=== SOBRE A BENDINI ===\nFundada em 1986 por Everton Bendini. Sede: Penha/SC, BR-101. Certificações: ISO 9001, ISO 14001, SASSMAQ.\n\n=== VELOCIDADE ===\n- Máximo: 85 km/h. Tolerância: até 8 picos/semana.\n- Produto químico: máx 80 km/h. Chuva/neblina: 75 km/h. Pedágios: 40 km/h.\n\n=== PRÊMIOS VARIÁVEIS ===\n- 3% Produtividade + 1% Comprometimento + 1% Não Avarias + 4% Extra Economia = 9% total.\n- Cartão Caju: R$95/dia trabalhado.\n\n=== JORNADA ===\n- Parar até 23h. Retorno somente a partir das 04h.\n\n=== PROIBIÇÕES ===\n- Obstruir câmera interna, comboio < 1000m, veículo ligado > 3 min parado, calça de moletom, dirigir de chinelo, recusar cargas.`;
    }
    return base;
  };

  const saveMsg = async (role, content) => {
    try { await sb.post("historico_conversa", { motorista_nome: usuario.cpf, role, content }); } catch {}
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    const newMsgs = [...msgs, { role:"user", content:txt }];
    setMsgs(newMsgs);
    setLoading(true);
    await saveMsg("user", txt);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers: { "Content-Type":"application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:1000, system:buildKnowledge(), messages:newMsgs }),
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || "Não foi possível processar. Tente novamente.";
      setMsgs(p => [...p, { role:"assistant", content:reply }]);
      await saveMsg("assistant", reply);
    } catch { setMsgs(p => [...p, { role:"assistant", content:"Erro de conexão. Tente novamente." }]); }
    setLoading(false);
  };

  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSemMic(true); return; }

    if (ouvindo) {
      recognitionRef.current?.stop();
      setOuvindo(false);
      return;
    }

    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    recognitionRef.current = rec;

    rec.onstart = () => setOuvindo(true);
    rec.onend = () => setOuvindo(false);
    rec.onerror = () => setOuvindo(false);
    rec.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      setInput(prev => prev ? prev + " " + txt : txt);
    };
    rec.start();
  };

  const answerQuiz = (idx) => {
    if (qsel !== null) return;
    setQsel(idx); setQshow(true);
    if (idx === QUIZ_BASE[qi].c) setQscore(s => s + 1);
  };

  const nextQ = () => {
    if (qi + 1 >= QUIZ_BASE.length) setQdone(true);
    else { setQi(i => i+1); setQsel(null); setQshow(false); }
  };

  const resetQ = () => { setQi(0); setQsel(null); setQscore(0); setQdone(false); setQshow(false); setQuizSalvo(false); };

  const salvarResultado = async () => {
    if (quizSalvo) return;
    const pct = (qscore / QUIZ_BASE.length) * 100;
    await sb.post("quiz_resultados", { cpf:usuario.cpf, nome:usuario.nome, score:qscore, total:QUIZ_BASE.length, percentual:pct });
    setQuizSalvo(true);
  };

  useEffect(() => { if (qdone && !quizSalvo) salvarResultado(); }, [qdone]);

  const TABS = [
    { id:"chat", label:"Assistente IA" },
    { id:"onboarding", label:"Onboarding" },
    { id:"quiz", label:"Quiz" },
  ];

  if (isAdm) return <PainelAdm onSair={() => setIsAdm(false)} />;
  if (!usuario) return <LoginScreen onLogin={handleLogin} onAdm={() => setIsAdm(true)} />;
  if (loadingHist) return (
    <div style={{ minHeight:"100vh", background:C.BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow','Segoe UI',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:13, color:C.MUTED, letterSpacing:2, textTransform:"uppercase", fontWeight:700 }}>Carregando histórico...</div>
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
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:"13px 4px", background:t.id===tab?C.CARD:"none", border:"none", borderBottom:t.id===tab?`2px solid ${C.RED}`:"2px solid transparent", color:t.id===tab?C.WHITE:C.MUTED, cursor:"pointer", fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase" }}>{t.label}</button>
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
                  <div style={{ maxWidth:"78%", padding:"10px 14px", borderRadius:m.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px", background:m.role==="user"?C.RED:C.CARD, border:m.role==="assistant"?`1px solid ${C.BORDER}`:"none", fontSize:14, color:C.TEXT }}>
                    {fmt(m.content)}
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
              {["Como funcionam os prêmios?", "Quais são as proibições?", "Como é o ranking?", "Velocidades na estrada"].map(q => (
                <button key={q} onClick={() => setInput(q)} style={{ background:"none", border:`1px solid ${C.BORDER2}`, borderRadius:2, padding:"5px 12px", color:C.MUTED, fontSize:10, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, letterSpacing:0.8, fontWeight:700, textTransform:"uppercase", fontFamily:"inherit" }}>{q}</button>
              ))}
            </div>
            <div style={{ padding:"10px 16px 12px", borderTop:`1px solid ${C.BORDER}`, display:"flex", gap:8, background:C.NAV, flexShrink:0 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()} placeholder={ouvindo ? "Ouvindo... fale agora" : "Digite ou use o microfone..."}
                style={{ flex:1, background:C.CARD, border:`1px solid ${ouvindo?C.RED:C.BORDER2}`, borderRadius:2, padding:"11px 14px", color:C.TEXT, fontSize:13, outline:"none", fontFamily:"inherit", transition:"border 0.2s" }} />
              {/* Botão microfone */}
              <button onClick={toggleMic} title={semMic?"Microfone não suportado neste navegador":ouvindo?"Parar gravação":"Falar"} style={{
                background: ouvindo ? C.RED : "rgba(192,57,43,0.15)",
                border: `1px solid ${ouvindo?C.RED:C.BORDER2}`,
                borderRadius:2, width:46, cursor:"pointer",
                color: ouvindo ? C.WHITE : C.MUTED,
                fontSize:18, display:"flex", alignItems:"center", justifyContent:"center",
                animation: ouvindo ? "micPulse 1s infinite" : "none",
                flexShrink:0,
              }}>
                {ouvindo ? "⏹" : "🎤"}
              </button>
              {/* Botão enviar */}
              <button onClick={send} disabled={loading||!input.trim()} style={{ background:(!loading&&input.trim())?C.RED:C.CARD2, border:"none", borderRadius:2, width:46, cursor:(!loading&&input.trim())?"pointer":"not-allowed", color:(!loading&&input.trim())?C.WHITE:C.MUTED2, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, flexShrink:0 }}>›</button>
            </div>
            {semMic && (
              <div style={{ padding:"6px 16px 10px", fontSize:11, color:C.RED, background:C.NAV }}>
                ⚠️ Microfone não suportado. Use Chrome ou Edge.
              </div>
            )}
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
        {tab === "quiz" && (
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>
            {qdone ? (
              <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:32, textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:16 }}>{qscore/QUIZ_BASE.length>=0.8?"🏆":qscore/QUIZ_BASE.length>=0.6?"👍":"📚"}</div>
                <div style={{ fontSize:9, color:C.RED, letterSpacing:2.5, fontWeight:900, textTransform:"uppercase", marginBottom:12 }}>Resultado Final</div>
                <div style={{ fontSize:54, fontWeight:900, color:C.WHITE, lineHeight:1 }}>{qscore}<span style={{ fontSize:20, color:C.MUTED, fontWeight:400 }}>/{QUIZ_BASE.length}</span></div>
                <div style={{ fontSize:22, fontWeight:900, color:qscore/QUIZ_BASE.length>=0.8?C.GREEN:qscore/QUIZ_BASE.length>=0.6?"#f39c12":C.RED, marginTop:6 }}>{((qscore/QUIZ_BASE.length)*100).toFixed(0)}%</div>
                <div style={{ fontSize:13, color:C.MUTED, marginTop:14, marginBottom:8, lineHeight:1.7 }}>
                  {qscore/QUIZ_BASE.length>=0.8?"Excelente! Você conhece bem as regras da Bendini.":qscore/QUIZ_BASE.length>=0.6?"Bom resultado. Vale revisar alguns pontos.":"Revise o onboarding e tente novamente."}
                </div>
                {quizSalvo && <div style={{ fontSize:11, color:C.GREEN, marginBottom:20, fontWeight:700, letterSpacing:1 }}>✓ Resultado salvo no ranking</div>}
                <button onClick={resetQ} style={{ background:C.RED, border:"none", borderRadius:2, padding:"13px 32px", color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>↺ Tentar Novamente</button>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:9, color:C.MUTED, letterSpacing:2, fontWeight:800, textTransform:"uppercase" }}>Pergunta {qi+1} de {QUIZ_BASE.length}</span>
                  <span style={{ fontSize:9, color:C.GREEN, letterSpacing:1, fontWeight:800 }}>{qscore} corretas</span>
                </div>
                <div style={{ height:2, background:C.BORDER, borderRadius:1, marginBottom:22 }}>
                  <div style={{ height:"100%", width:`${(qi/QUIZ_BASE.length)*100}%`, background:C.RED, borderRadius:1 }} />
                </div>
                <div style={{ background:C.CARD, border:`1px solid ${C.BORDER}`, borderRadius:2, padding:"20px 18px", marginBottom:14 }}>
                  <div style={{ fontSize:9, color:C.RED, letterSpacing:2, fontWeight:900, textTransform:"uppercase", marginBottom:12 }}>Questão {qi+1}</div>
                  <div style={{ fontSize:16, fontWeight:700, lineHeight:1.5, color:C.WHITE }}>{QUIZ_BASE[qi].q}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                  {QUIZ_BASE[qi].opts.map((opt, idx) => {
                    const isC=idx===QUIZ_BASE[qi].c, isSel=idx===qsel;
                    let bg=C.CARD, border=`1px solid ${C.BORDER}`, color=C.TEXT;
                    if (qshow) {
                      if (isC) { bg="rgba(46,204,113,0.07)"; border="1px solid #2ecc71"; color="#2ecc71"; }
                      else if (isSel) { bg="rgba(192,57,43,0.08)"; border=`1px solid ${C.RED}`; color="#e07070"; }
                    }
                    return (
                      <button key={idx} onClick={() => answerQuiz(idx)} style={{ background:bg, border, borderRadius:2, padding:"12px 16px", color, textAlign:"left", cursor:qsel!==null?"default":"pointer", fontSize:14, lineHeight:1.4, width:"100%", display:"block", fontFamily:"inherit", fontWeight:isSel&&qshow?700:400, transition:"all 0.15s" }}>
                        <span style={{ fontWeight:900, marginRight:10, color:C.MUTED2, fontSize:12 }}>{["A","B","C","D"][idx]}.</span>{opt}
                      </button>
                    );
                  })}
                </div>
                {qshow && (
                  <>
                    <div style={{ background:qsel===QUIZ_BASE[qi].c?"rgba(46,204,113,0.07)":"rgba(192,57,43,0.08)", border:`1px solid ${qsel===QUIZ_BASE[qi].c?"#2ecc71":C.RED}`, borderRadius:2, padding:"12px 14px", marginBottom:14, fontSize:13, color:qsel===QUIZ_BASE[qi].c?"#2ecc71":"#e07070", lineHeight:1.65 }}>
                      {qsel===QUIZ_BASE[qi].c?"✓ Correto — ":"✗ Incorreto — "}{QUIZ_BASE[qi].exp}
                    </div>
                    <button onClick={nextQ} style={{ width:"100%", padding:"14px", background:C.RED, border:"none", borderRadius:2, color:C.WHITE, fontWeight:900, cursor:"pointer", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"inherit" }}>
                      {qi+1>=QUIZ_BASE.length?"Ver Resultado":"Próxima →"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
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
