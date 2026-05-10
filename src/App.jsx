import { useState, useRef, useEffect } from "react";

const BENDINI_KNOWLEDGE = `
Você é o BEN, Assistente Oficial da Bendini Logística — agente de onboarding e instrução para Gestores de Unidade Móvel. Seja profissional, direto, claro e motivador. Responda sempre em português brasileiro.

=== SOBRE A BENDINI ===
Fundada em 1986 por Everton Bendini. Sede: Penha/SC, BR-101. Certificações: ISO 9001, ISO 14001, SASSMAQ. ~9.000m² de armazém.

=== PRIMEIROS PASSOS ===
- Integração: 2 primeiros dias com gestor direto, visita a todos os setores.
- Uniforme obrigatório: calça jeans/brim, sapato de segurança, crachá.
- Kit EPIs entregue na integração.
- Chip corporativo VIVO: prefixo 15 (015 + DDD + número).
- WhatsApp: grupo "FROTA/GESTOR DE UNIDADE MÓVEL" (operações) e "UTILIDADES" (reagir com 👍🏻).
- Restaurante DORA: seg-sex 11:30-13:15, assinar lista de almoço.

=== COMPOSIÇÃO SALARIAL ===
- Salário base + 30% periculosidade + DSR + Cartão Caju R$95/dia trabalhado.
- Horas extras + adicional noturno + tempo de espera conforme o caso.
PRÊMIOS VARIÁVEIS (sobre faturamento do veículo):
- 3% Produtividade | 1% Comprometimento (sem ocorrências) | 1% Não Avarias | 4% Extra Economia
- TOTAL POSSÍVEL: 9% — Ex: faturamento R$56.000 = R$5.040 em prêmios.

=== RANKING ===
- Avaliação mensal, média dos últimos 6 meses.
- Faturamento: até 5 pts | Extra Economia: até 1,5 pts | Ocorrências: até 2 pts.
- Mínimo desejado: 8,5 pts. Abaixo de 8,0 por 3 meses consecutivos = risco de rescisão.
- Disponível no 8quali e compartilhado no WhatsApp.

=== COMUNICAÇÃO ===
- Informar no grupo da frota cada etapa: saída, chegada, carregamento, descarga, imprevistos.
- Reunião mensal: segundo sábado. OBRIGATÓRIA. Falta injustificada = perda da premiação.
- Grupo "Bendini Utilidades": sempre reagir com 👍🏻 para confirmar ciência.

=== GERENCIAMENTO DE RISCO ===
- Enviar macro início de viagem, aguardar "LIBERADO", partir.
- Informar paradas e reinícios via macro.
- Macro de Fim de Viagem SOMENTE com canhotos assinados.
- PROIBIDO dar carona (exceto colegas com autorização do líder).
- Pernoites apenas em locais homologados.

=== CHECKLIST DIÁRIO (SASSMAQ) ===
- Verificar: danos no veículo, nível/pressão do óleo, freios, pneus, luzes, vazamentos, parafusos das rodas, extintores.
- Registrar na Ficha de Viagem e assinar.

=== CARREGAMENTO ===
- Inspecionar compartimento antes de carregar.
- Reaperto das cintas a cada 200km (nos primeiros 80km: parada obrigatória).
- Amarração obrigatória em sider/grade baixa — sem exceção.
- Primeiros pallets: 2 cintas + "X". Últimos pallets: 2 cintas.
- Peso máximo tração: 10 ton (toco) / 17 ton (trucado).
- Após descarga: varrer carreta. Baú: amarrar portas com corda por dentro.

=== DOCUMENTOS DE VIAGEM ===
- MDFE, CTE, todas as NFs listadas.
- Canhotos: verificar carimbo + assinatura (ou nome completo + RG do recebedor).
- Enviar foto legível dos comprovantes no grupo da frota.

=== HORÁRIO DOMINGOS ===
- Saída até 13h. Destino SP: até 13h. Restrição de rodagem (ex: DOW): até 08h.
- Apresentação no cliente às 07h nas segundas (independente do agendamento).

=== PRODUTOS QUÍMICOS ===
- Manga longa obrigatória durante todo o trajeto.
- Velocidade: máx 80km/h. Chuva: 70km/h. Pedágios: 40km/h.
- Placas de sinalização SOMENTE nos suportes próprios — NUNCA colar na lataria.
- Após descarga: remover adesivos e limpar placas.
- Caminhões vazios NÃO circulam com placas (exceto ISOTANQUEs).
- Verificar compatibilidade de produtos antes de novo carregamento.
- Estacionar veículos com químico: somente em frente à oficina.

=== ABASTECIMENTO ===
- Presença do Gestor OBRIGATÓRIA. PROIBIDO o gestor abastecer sozinho.
- Priorizar abastecimento na Bendini (70% da capacidade).
- Nos postos externos: colocar o mínimo para chegar à base.
- ARLA: ticket grampeado na ficha de viagem.

=== VELOCIDADE ===
- Máximo: 85 km/h (telemetria). Tolerância: até 8 picos/semana.
- Produto químico: máx 80 km/h. Chuva/neblina: 75 km/h. Curvas: abaixo de 60 km/h. Pedágios: 40 km/h.

=== JORNADA ===
- Parar até 23h. Retorno somente a partir das 04h. Exceções com autorização prévia.

=== PROIBIÇÕES PRINCIPAIS ===
- Acessórios/adesivos/alterações no veículo sem autorização.
- Desligar chave geral da bateria.
- Cinta por fora do sider.
- Consertar pneu em viagem (usar estepe).
- Veículo em banguela em serra.
- Veículo ligado mais de 3 min parado.
- Comentar rotas/clientes/valores com terceiros.
- Calça de moletom. Dirigir de chinelo.
- Caminhão pernoitar sozinho.
- Recusar cargas (equivale a pedir demissão).
- Comboio (distância mínima entre caminhões: 1000m).
- Patinar a tração.
- Obstruir câmera interna (advertência + perda da premiação).

=== MANUTENÇÃO ===
- Barulho, ruído, cheiro anormal: parar e comunicar imediatamente.
- Toda manutenção precisa de autorização prévia do chefe de oficina.
- Bater pneus a cada 200km — martelo de madeira na escada da porta.
- Volvo VAS: amarelo = consultar | vermelho = parar imediatamente + acionar VAS + comunicar oficina.
- Chaves no painel de chaves da oficina quando no pátio.

=== FÉRIAS E AFASTAMENTOS ===
- Solicitar com mínimo 30 dias de antecedência.
- Retorno de férias: ASO obrigatório no primeiro dia.
- Ao entrar em férias: retirar pertences e limpar cabine completamente.

=== PASTA PRETA ===
- Certificados e licenças no veículo (IBAMA, FATMA, Cronotacógrafo).
- Verificar vencimentos. Comunicar gestão de frota 15 dias antes do vencimento.
- Versão digital disponível via link no grupo da frota.

=== SISTEMA DE MONITORAMENTO ===
- 4 câmeras por veículo: cabine (IA), laterais e frontal.
- IA detecta: fadiga (níveis 1-3), uso de celular, ausência de cinto.
- Sem gravação de áudio. PROIBIDO obstruir câmera.

Sempre responda com base nessas informações. Se não souber, oriente o motorista a consultar o gestor direto. Use listas quando necessário para facilitar a leitura.
`;

const CHECKLIST_ITEMS = [
  { id: 1, cat: "Documentos", text: "MDFE — Manifesto Eletrônico de Cargas em mãos" },
  { id: 2, cat: "Documentos", text: "CTE — Conhecimento de Transporte conferido" },
  { id: 3, cat: "Documentos", text: "Todas as NFs listadas no conhecimento presentes" },
  { id: 4, cat: "Documentos", text: "Pasta Preta com certificados do veículo" },
  { id: 5, cat: "Veículo", text: "Nível e pressão do óleo verificados" },
  { id: 6, cat: "Veículo", text: "Freios testados e funcionando" },
  { id: 7, cat: "Veículo", text: "Pneus — pressão e condição verificadas" },
  { id: 8, cat: "Veículo", text: "Todas as luzes funcionando" },
  { id: 9, cat: "Veículo", text: "Sem vazamentos de ar ou líquidos" },
  { id: 10, cat: "Veículo", text: "Parafusos das rodas apertados" },
  { id: 11, cat: "Veículo", text: "Extintor de incêndio presente e válido" },
  { id: 12, cat: "Veículo", text: "Kit de emergência completo" },
  { id: 13, cat: "Carga", text: "Compartimento de carga limpo e inspecionado" },
  { id: 14, cat: "Carga", text: "Cintas e catracas em bom estado" },
  { id: 15, cat: "Carga", text: "Amarração realizada conforme procedimento" },
  { id: 16, cat: "Segurança", text: "Uniforme completo (calça, sapato, crachá)" },
  { id: 17, cat: "Segurança", text: "Kit EPI pessoal dentro da cabine" },
  { id: 18, cat: "Segurança", text: "Câmera interna sem obstrução" },
  { id: 19, cat: "Comunicação", text: "Programação recebida e lida no grupo da frota" },
  { id: 20, cat: "Comunicação", text: "Macro de início enviada — aguardando 'LIBERADO'" },
];

const QUIZ = [
  { q: "Qual é a velocidade máxima permitida pelo sistema de telemetria?", opts: ["80 km/h", "85 km/h", "90 km/h", "100 km/h"], c: 1, exp: "Máximo de 85 km/h, com tolerância de até 8 picos por semana acima desse limite." },
  { q: "Com que frequência deve ser feito o reaperto das cintas de amarração?", opts: ["A cada 100 km", "A cada 150 km", "A cada 200 km", "A cada 300 km"], c: 2, exp: "Reaperto a cada 200 km. Nos primeiros 80 km, parada obrigatória para o primeiro reaperto." },
  { q: "Nota abaixo de 8,0 no ranking por 3 meses consecutivos resulta em:", opts: ["Desconto no salário", "Treinamento obrigatório", "Possível rescisão do contrato", "Advertência verbal"], c: 2, exp: "Conforme política interna, nota inferior a 8,0 por 3 meses consecutivos pode resultar em rescisão contratual." },
  { q: "Ao ver luz VERMELHA no painel do Volvo, você deve:", opts: ["Continuar e avisar na base", "Parar imediatamente, acionar VAS e comunicar a oficina", "Reduzir velocidade e continuar", "Ligar para o programador"], c: 1, exp: "Vermelho = parar imediatamente + acionar botão VAS + comunicar a oficina. Seguir orientações de ambos." },
  { q: "Qual é o horário máximo de parada das atividades noturnas?", opts: ["22h, retorno às 5h", "23h, retorno às 4h", "00h, retorno às 5h", "21h, retorno às 6h"], c: 1, exp: "Parar atividades até às 23h. Retorno permitido somente a partir das 04h do dia seguinte." },
  { q: "Qual é o percentual total máximo de prêmios variáveis?", opts: ["5%", "7%", "9%", "12%"], c: 2, exp: "Total: 9% — 3% produtividade + 1% comprometimento + 1% não avarias + 4% extra economia." },
  { q: "Velocidade máxima ao transportar produto químico em dia de chuva:", opts: ["80 km/h", "75 km/h", "70 km/h", "60 km/h"], c: 2, exp: "Chuva ou neblina com produto químico: máximo 70 km/h. Nas curvas: abaixo de 60 km/h." },
  { q: "Onde devem ficar as chaves ao deixar o caminhão no pátio Bendini?", opts: ["No bolso do motorista", "Na ignição do veículo", "No painel de chaves da Oficina", "Com o programador de turno"], c: 2, exp: "Sempre no Painel de Chaves da Oficina, conforme o número identificador de cada frota." },
];

const ONBOARDING = [
  { icon: "🚛", tag: "BOAS-VINDAS", title: "Bem-vindo à Bendini", sub: "Você agora é um Gestor de Unidade Móvel", body: "Essa é a denominação especial que damos aos nossos motoristas, reconhecendo sua importância estratégica para as operações.\n\n\"Desejamos as boas-vindas, muitas realizações e sucesso.\"\n— Everton Pereira Bendini\n\nNos próximos passos, você vai aprender tudo que precisa saber para começar com segurança e excelência na Bendini." },
  { icon: "📋", tag: "INTEGRAÇÃO", title: "Primeiros 2 Dias", sub: "Apresentação em todos os setores", body: "Você será conduzido pelo seu gestor direto em uma integração completa pela empresa.\n\nNo primeiro dia você recebe:\n— Kit de EPIs completo\n— Crachá e uniforme\n— Chip corporativo VIVO\n— Inclusão nos grupos de WhatsApp\n\nUso obrigatório desde o primeiro dia: calça jeans ou brim + sapato de segurança + crachá." },
  { icon: "📡", tag: "COMUNICAÇÃO", title: "Grupos e Comunicação", sub: "Comunicação proativa é fundamental", body: "2 grupos de WhatsApp obrigatórios:\n\nFROTA/GESTOR: operações, programações e status de viagem — use para informar cada passo da operação.\n\nUTILIDADES: informações gerais — sempre reagir com 👍🏻 para confirmar ciência.\n\nChip VIVO corporativo: use o prefixo 15 (015 + DDD + número).\n\nReunião mensal todo segundo sábado — participação obrigatória." },
  { icon: "💰", tag: "REMUNERAÇÃO", title: "Salário e Prêmios", sub: "Seu desempenho define seu ganho", body: "FIXO: salário base + 30% periculosidade + DSR + Cartão Caju R$95/dia.\n\nPRÊMIOS VARIÁVEIS sobre o faturamento do veículo:\n— 3% Produtividade\n— 1% Comprometimento (sem ocorrências)\n— 1% Não Avarias\n— 4% Extra Economia\n\nTotal possível: 9%.\nExemplo: R$56.000 faturados = R$5.040 em prêmios no mês." },
  { icon: "📊", tag: "RANKING", title: "Ranking de Desempenho", sub: "Média dos últimos 6 meses", body: "Avaliação mensal com base em 3 critérios:\n\n— Faturamento: até 5 pontos\n— Extra Economia: até 1,5 pontos\n— Ocorrências: até 2 pontos\n\nPontuação mínima desejada: 8,5 pontos.\nAbaixo de 8,0 por 3 meses consecutivos = risco de rescisão contratual.\n\nRanking disponível no sistema 8quali e compartilhado no WhatsApp." },
  { icon: "⚠️", tag: "SEGURANÇA", title: "Segurança na Estrada", sub: "Regras inegociáveis de condução", body: "VELOCIDADES MÁXIMAS:\n— Geral: 85 km/h (telemetria)\n— Chuva / neblina: 75 km/h\n— Produto químico: 80 km/h\n— Pedágios: 40 km/h\n\nJORNADA: parar até 23h / retomar somente às 04h.\n\nCOMPORTAMENTO: cinto sempre | celular proibido ao volante | nunca obstruir câmera interna." },
  { icon: "🗺️", tag: "OPERAÇÃO", title: "Viagem — Passo a Passo", sub: "Protocolo obrigatório em cada viagem", body: "1. Receber programação no grupo da frota\n2. Enviar macro de INÍCIO DE VIAGEM\n3. Aguardar mensagem 'LIBERADO'\n4. Comunicar cada etapa no grupo\n5. Reaperto das cintas a cada 200 km\n6. Enviar macro de FIM somente com canhotos assinados\n7. Foto legível dos comprovantes no grupo da frota" },
  { icon: "🏆", tag: "CONCLUÍDO", title: "Pronto para o Trabalho!", sub: "Onboarding básico concluído", body: "Lembre sempre:\n\n— Comunicação proativa em cada etapa da operação\n— Respeite as velocidades e a jornada\n— Cuide do veículo como se fosse seu\n— Ranking elevado = prêmios e novas oportunidades\n— Use o assistente BEN para qualquer dúvida\n\nBem-vindo ao time Bendini!" },
];

const CAT_ICONS = { Documentos: "📄", Veículo: "🚚", Carga: "📦", Segurança: "🦺", Comunicação: "📡" };

// ── Palette extraída da screenshot do bendinilog.com.br ──
// Fundo principal: azul marinho escuro tipo #0e1a2b / #111e30
// Navbar: #0a1520 (ainda mais escuro)
// Cards: #13223a
// Bordas: #1e3050
// Vermelho: #c0392b (detalhe, botão Home ativo)
// Texto principal: #ffffff
// Texto secundário: #7a9bbf (azulado acinzentado)

const C = {
  BG:      "#0e1a2b",   // fundo da página
  NAV:     "#091520",   // navbar / header
  CARD:    "#13223a",   // cards e superfícies elevadas
  CARD2:   "#182d4a",   // hover / card mais claro
  BORDER:  "#1c3050",   // bordas suaves
  BORDER2: "#254070",   // bordas de ênfase
  RED:     "#c0392b",   // vermelho — detalhe / ativo
  WHITE:   "#ffffff",
  TEXT:    "#d8e8f5",   // texto principal
  MUTED:   "#5c7d9e",   // texto secundário azulado
  MUTED2:  "#3a5a7a",   // texto muito apagado
  GREEN:   "#2ecc71",
};

export default function App() {
  const [tab, setTab] = useState("chat");
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    content: "Olá! Sou o **BEN**, assistente oficial da Bendini Logística.\n\nEstou aqui para responder suas dúvidas sobre regras, procedimentos e tudo que você precisa saber para trabalhar na Bendini.\n\nComo posso ajudar?"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState({});
  const [step, setStep] = useState(0);
  const [qi, setQi] = useState(0);
  const [qsel, setQsel] = useState(null);
  const [qscore, setQscore] = useState(0);
  const [qdone, setQdone] = useState(false);
  const [qshow, setQshow] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    setMsgs(p => [...p, { role: "user", content: txt }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: BENDINI_KNOWLEDGE,
          messages: [...msgs.map(m => ({ role: m.role, content: m.content })), { role: "user", content: txt }]
        })
      });
      const d = await res.json();
      setMsgs(p => [...p, { role: "assistant", content: d.content?.[0]?.text || "Não foi possível processar. Tente novamente." }]);
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "Erro de conexão. Tente novamente." }]);
    }
    setLoading(false);
  };

  const totalChecked = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((totalChecked / CHECKLIST_ITEMS.length) * 100);
  const bycat = CHECKLIST_ITEMS.reduce((a, i) => { (a[i.cat] = a[i.cat] || []).push(i); return a; }, {});

  const answerQuiz = (idx) => {
    if (qsel !== null) return;
    setQsel(idx);
    setQshow(true);
    if (idx === QUIZ[qi].c) setQscore(s => s + 1);
  };

  const nextQ = () => {
    if (qi + 1 >= QUIZ.length) setQdone(true);
    else { setQi(i => i + 1); setQsel(null); setQshow(false); }
  };

  const resetQ = () => { setQi(0); setQsel(null); setQscore(0); setQdone(false); setQshow(false); };

  const fmt = (txt) => txt.split("\n").map((l, i) => {
    const b = l.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return <p key={i} dangerouslySetInnerHTML={{ __html: b }} style={{ margin: "1px 0", lineHeight: 1.65 }} />;
  });

  const TABS = [
    { id: "chat",       label: "Assistente IA" },
    { id: "onboarding", label: "Onboarding"    },
    { id: "checklist",  label: "Checklist"     },
    { id: "quiz",       label: "Quiz"          },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.BG, fontFamily: "'Barlow', 'Segoe UI', sans-serif", color: C.TEXT, display: "flex", flexDirection: "column" }}>

      {/* ══ HEADER ══ */}
      <div style={{ background: C.NAV, borderBottom: `1px solid ${C.BORDER}`, padding: "0 20px", display: "flex", alignItems: "center", height: 62, gap: 14, flexShrink: 0 }}>
        {/* barra vermelha lateral — igual ao logo do site */}
        <div style={{ width: 3, height: 36, background: C.RED, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, color: C.WHITE, textTransform: "uppercase", lineHeight: 1 }}>Bendini</div>
          <div style={{ fontSize: 8, letterSpacing: 3.5, color: C.MUTED, textTransform: "uppercase", marginTop: 3, fontWeight: 600 }}>Operador Logístico</div>
        </div>
        <div style={{ width: 1, height: 28, background: C.BORDER2, margin: "0 10px" }} />
        <div style={{ fontSize: 10, color: C.MUTED2, letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase" }}>Agente BEN</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.GREEN }} />
          <span style={{ fontSize: 9, color: C.MUTED, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>Online</span>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div style={{ background: C.NAV, borderBottom: `1px solid ${C.BORDER}`, display: "flex", flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "13px 4px", background: t.id === tab ? C.CARD : "none",
            border: "none",
            borderBottom: t.id === tab ? `2px solid ${C.RED}` : `2px solid transparent`,
            color: t.id === tab ? C.WHITE : C.MUTED,
            cursor: "pointer", fontSize: 10, fontWeight: 800,
            letterSpacing: 1.5, textTransform: "uppercase", transition: "all 0.15s"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ══════════════ CHAT ══════════════ */}
        {tab === "chat" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>
                  {m.role === "assistant" && (
                    <div style={{ width: 32, height: 32, borderRadius: 2, background: C.RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: C.WHITE, flexShrink: 0, letterSpacing: 1 }}>BEN</div>
                  )}
                  <div style={{
                    maxWidth: "78%", padding: "10px 14px",
                    borderRadius: m.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                    background: m.role === "user" ? C.RED : C.CARD,
                    border: m.role === "assistant" ? `1px solid ${C.BORDER}` : "none",
                    fontSize: 14, color: C.TEXT
                  }}>
                    {fmt(m.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 2, background: C.RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: C.WHITE, flexShrink: 0 }}>BEN</div>
                  <div style={{ padding: "12px 16px", background: C.CARD, border: `1px solid ${C.BORDER}`, borderRadius: "10px 10px 10px 2px", display: "flex", gap: 5, alignItems: "center" }}>
                    {[0,1,2].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: C.RED, animation: `bpulse 1s ${j*0.22}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* sugestões rápidas */}
            <div style={{ padding: "6px 16px 8px", display: "flex", gap: 7, overflowX: "auto", flexShrink: 0 }}>
              {["Como funcionam os prêmios?", "Quais são as proibições?", "Como é o ranking?", "Velocidades na estrada"].map(q => (
                <button key={q} onClick={() => setInput(q)} style={{
                  background: "none", border: `1px solid ${C.BORDER2}`, borderRadius: 2,
                  padding: "5px 12px", color: C.MUTED, fontSize: 10,
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  letterSpacing: 0.8, fontWeight: 700, textTransform: "uppercase", fontFamily: "inherit"
                }}>{q}</button>
              ))}
            </div>

            <div style={{ padding: "10px 16px 12px", borderTop: `1px solid ${C.BORDER}`, display: "flex", gap: 10, background: C.NAV, flexShrink: 0 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Digite sua dúvida sobre as regras da Bendini..."
                style={{ flex: 1, background: C.CARD, border: `1px solid ${C.BORDER2}`, borderRadius: 2, padding: "11px 14px", color: C.TEXT, fontSize: 13, outline: "none", fontFamily: "inherit" }}
              />
              <button onClick={send} disabled={loading || !input.trim()} style={{
                background: (!loading && input.trim()) ? C.RED : C.CARD2,
                border: "none", borderRadius: 2, width: 46,
                cursor: (!loading && input.trim()) ? "pointer" : "not-allowed",
                color: (!loading && input.trim()) ? C.WHITE : C.MUTED2,
                fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900
              }}>›</button>
            </div>
          </div>
        )}

        {/* ══════════════ ONBOARDING ══════════════ */}
        {tab === "onboarding" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: C.MUTED, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>Progresso</span>
              <span style={{ fontSize: 9, color: C.RED, letterSpacing: 1, fontWeight: 800 }}>{step + 1} / {ONBOARDING.length}</span>
            </div>
            <div style={{ height: 2, background: C.BORDER, borderRadius: 1, marginBottom: 20 }}>
              <div style={{ height: "100%", width: `${((step + 1) / ONBOARDING.length) * 100}%`, background: C.RED, transition: "width 0.4s", borderRadius: 1 }} />
            </div>

            {/* dots */}
            <div style={{ display: "flex", gap: 5, marginBottom: 22 }}>
              {ONBOARDING.map((_, i) => (
                <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 24 : 8, height: 3, background: i <= step ? C.RED : C.BORDER2, cursor: "pointer", transition: "all 0.3s", borderRadius: 2 }} />
              ))}
            </div>

            <div style={{ background: C.CARD, border: `1px solid ${C.BORDER}`, borderRadius: 2, padding: "24px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, display: "inline-block", background: C.RED, color: C.WHITE, letterSpacing: 2, fontWeight: 900, padding: "3px 9px", marginBottom: 16, textTransform: "uppercase" }}>
                {ONBOARDING[step].tag}
              </div>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{ONBOARDING[step].icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.WHITE, marginBottom: 6, letterSpacing: -0.5, lineHeight: 1.2 }}>{ONBOARDING[step].title}</div>
              <div style={{ fontSize: 11, color: C.MUTED, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 20 }}>{ONBOARDING[step].sub}</div>
              <div style={{ fontSize: 14, color: C.TEXT, whiteSpace: "pre-line", lineHeight: 1.85 }}>{ONBOARDING[step].body}</div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{
                flex: 1, padding: "13px", background: "none",
                border: `1px solid ${step === 0 ? C.BORDER : C.BORDER2}`,
                borderRadius: 2, color: step === 0 ? C.MUTED2 : C.MUTED,
                cursor: step === 0 ? "not-allowed" : "pointer",
                fontWeight: 800, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontFamily: "inherit"
              }}>← Anterior</button>
              <button onClick={() => setStep(s => Math.min(ONBOARDING.length - 1, s + 1))} disabled={step === ONBOARDING.length - 1} style={{
                flex: 2, padding: "13px",
                background: step === ONBOARDING.length - 1 ? C.CARD2 : C.RED,
                border: "none", borderRadius: 2,
                color: step === ONBOARDING.length - 1 ? C.MUTED2 : C.WHITE,
                cursor: step === ONBOARDING.length - 1 ? "not-allowed" : "pointer",
                fontWeight: 900, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontFamily: "inherit"
              }}>Próximo Passo →</button>
            </div>
          </div>
        )}

        {/* ══════════════ CHECKLIST ══════════════ */}
        {tab === "checklist" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            <div style={{ background: C.CARD, border: `1px solid ${C.BORDER}`, borderRadius: 2, padding: "16px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ fontSize: 38, fontWeight: 900, color: pct === 100 ? C.GREEN : C.WHITE, lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 10, color: C.MUTED, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginTop: 4 }}>{totalChecked} de {CHECKLIST_ITEMS.length} itens</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 3, background: C.BORDER, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? C.GREEN : C.RED, transition: "width 0.3s", borderRadius: 2 }} />
                </div>
                {pct === 100 && <div style={{ fontSize: 10, color: C.GREEN, marginTop: 8, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>✓ Veículo pronto para partir</div>}
              </div>
            </div>

            {Object.entries(bycat).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: C.MUTED, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>
                  {CAT_ICONS[cat]} {cat}
                </div>
                <div style={{ background: C.CARD, border: `1px solid ${C.BORDER}`, borderRadius: 2, overflow: "hidden" }}>
                  {items.map((item, i) => (
                    <div key={item.id} onClick={() => setChecks(p => ({ ...p, [item.id]: !p[item.id] }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                        cursor: "pointer",
                        background: checks[item.id] ? C.CARD2 : "transparent",
                        borderBottom: i < items.length - 1 ? `1px solid ${C.BORDER}` : "none",
                        transition: "background 0.15s"
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 2, flexShrink: 0,
                        border: `2px solid ${checks[item.id] ? C.RED : C.BORDER2}`,
                        background: checks[item.id] ? C.RED : "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s"
                      }}>
                        {checks[item.id] && <span style={{ fontSize: 10, color: C.WHITE, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, color: checks[item.id] ? C.MUTED : C.TEXT, textDecoration: checks[item.id] ? "line-through" : "none", lineHeight: 1.45 }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={() => setChecks({})} style={{
              width: "100%", padding: "12px", background: "none",
              border: `1px solid ${C.BORDER}`, borderRadius: 2, color: C.MUTED2,
              cursor: "pointer", fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
              fontWeight: 800, marginTop: 4, fontFamily: "inherit"
            }}>↺ Reiniciar Checklist</button>
          </div>
        )}

        {/* ══════════════ QUIZ ══════════════ */}
        {tab === "quiz" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {qdone ? (
              <div style={{ background: C.CARD, border: `1px solid ${C.BORDER}`, borderRadius: 2, padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{qscore >= 7 ? "🏆" : qscore >= 5 ? "👍" : "📚"}</div>
                <div style={{ fontSize: 9, color: C.RED, letterSpacing: 2.5, fontWeight: 900, textTransform: "uppercase", marginBottom: 12 }}>Resultado Final</div>
                <div style={{ fontSize: 54, fontWeight: 900, color: C.WHITE, lineHeight: 1 }}>
                  {qscore}<span style={{ fontSize: 20, color: C.MUTED, fontWeight: 400 }}>/{QUIZ.length}</span>
                </div>
                <div style={{ fontSize: 13, color: C.MUTED, marginTop: 14, marginBottom: 28, lineHeight: 1.7 }}>
                  {qscore >= 7 ? "Excelente! Você conhece bem as regras da Bendini." : qscore >= 5 ? "Bom resultado. Vale revisar alguns pontos." : "Revise o material de onboarding e tente novamente."}
                </div>
                <button onClick={resetQ} style={{
                  background: C.RED, border: "none", borderRadius: 2, padding: "13px 32px",
                  color: C.WHITE, fontWeight: 900, cursor: "pointer", fontSize: 10,
                  letterSpacing: 2, textTransform: "uppercase", fontFamily: "inherit"
                }}>↺ Tentar Novamente</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 9, color: C.MUTED, letterSpacing: 2, fontWeight: 800, textTransform: "uppercase" }}>Pergunta {qi + 1} de {QUIZ.length}</span>
                  <span style={{ fontSize: 9, color: C.GREEN, letterSpacing: 1, fontWeight: 800 }}>{qscore} corretas</span>
                </div>
                <div style={{ height: 2, background: C.BORDER, borderRadius: 1, marginBottom: 22 }}>
                  <div style={{ height: "100%", width: `${(qi / QUIZ.length) * 100}%`, background: C.RED, borderRadius: 1 }} />
                </div>

                <div style={{ background: C.CARD, border: `1px solid ${C.BORDER}`, borderRadius: 2, padding: "20px 18px", marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: C.RED, letterSpacing: 2, fontWeight: 900, textTransform: "uppercase", marginBottom: 12 }}>Questão {qi + 1}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5, color: C.WHITE }}>{QUIZ[qi].q}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {QUIZ[qi].opts.map((opt, idx) => {
                    const isC = idx === QUIZ[qi].c;
                    const isSel = idx === qsel;
                    let bg = C.CARD, border = `1px solid ${C.BORDER}`, color = C.TEXT;
                    if (qshow) {
                      if (isC)      { bg = "rgba(46,204,113,0.1)";  border = "1px solid #2ecc71"; color = "#2ecc71"; }
                      else if (isSel) { bg = "rgba(192,57,43,0.12)"; border = `1px solid ${C.RED}`; color = "#e07070"; }
                    }
                    return (
                      <button key={idx} onClick={() => answerQuiz(idx)} style={{
                        background: bg, border, borderRadius: 2, padding: "12px 16px",
                        color, textAlign: "left", cursor: qsel !== null ? "default" : "pointer",
                        fontSize: 14, lineHeight: 1.4, width: "100%", display: "block",
                        fontFamily: "inherit", fontWeight: isSel && qshow ? 700 : 400, transition: "all 0.15s"
                      }}>
                        <span style={{ fontWeight: 900, marginRight: 10, color: C.MUTED2, fontSize: 12 }}>{["A","B","C","D"][idx]}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {qshow && (
                  <>
                    <div style={{
                      background: qsel === QUIZ[qi].c ? "rgba(46,204,113,0.07)" : "rgba(192,57,43,0.08)",
                      border: `1px solid ${qsel === QUIZ[qi].c ? "#2ecc71" : C.RED}`,
                      borderRadius: 2, padding: "12px 14px", marginBottom: 14,
                      fontSize: 13, color: qsel === QUIZ[qi].c ? "#2ecc71" : "#e07070", lineHeight: 1.65
                    }}>
                      {qsel === QUIZ[qi].c ? "✓ Correto — " : "✗ Incorreto — "}{QUIZ[qi].exp}
                    </div>
                    <button onClick={nextQ} style={{
                      width: "100%", padding: "14px", background: C.RED, border: "none",
                      borderRadius: 2, color: C.WHITE, fontWeight: 900, cursor: "pointer",
                      fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontFamily: "inherit"
                    }}>
                      {qi + 1 >= QUIZ.length ? "Ver Resultado" : "Próxima Pergunta →"}
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
        @keyframes bpulse { 0%,80%,100%{transform:scale(0.5);opacity:0.3} 40%{transform:scale(1);opacity:1} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.NAV}; }
        ::-webkit-scrollbar-thumb { background: ${C.BORDER2}; border-radius: 2px; }
        input::placeholder { color: ${C.MUTED2}; }
        button:focus { outline: none; }
      `}</style>
    </div>
  );
}
