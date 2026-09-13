import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import {
  Home, CalendarDays, Heart, Wallet, TrendingUp, Plus, Check, Trash2, Pencil,
  Clock, Repeat, Bell, User, Settings, Smile, Moon, Sparkles, BookOpen, Target,
  Gift, FolderKanban, ArrowUpCircle, ArrowDownCircle, PiggyBank, ChevronRight,
  ChevronLeft, X, Flame, Star, ListChecks, Sun, Sunset, MoonStar,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

/* =========================================================
   TOKENS DE DESIGN
========================================================= */
const C = {
  bg: "#FFF6F8",
  card: "#FFFFFF",
  rosaClaro: "#FDE6EC",
  rosaCha: "#F3C6D3",
  malva: "#E3B8D6",
  lilas: "#CBB4E0",
  champagne: "#CBA76B",
  texto: "#5B4B57",
  textoSuave: "#9A8A95",
  verde: "#9CC7A1",
  vermelho: "#E3A0A0",
};

const estiloInput = {
  width: "100%", padding: "10px 14px", borderRadius: 14,
  border: `1px solid ${C.rosaClaro}`, fontSize: 14, color: C.texto,
  outline: "none", background: "#FFFBFC", boxSizing: "border-box",
};

/* =========================================================
   PERSISTÊNCIA LOCAL (salva os dados no próprio dispositivo)
========================================================= */
const CHAVE_ARMAZENAMENTO = "meuPlannerDados_v1";

function carregarEstadoSalvo() {
  try {
    const bruto = window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    if (!dados || typeof dados !== "object") return null;
    return dados;
  } catch (erro) {
    console.warn("Não foi possível carregar os dados salvos no dispositivo:", erro);
    return null;
  }
}

function salvarEstado(estado) {
  try {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(estado));
  } catch (erro) {
    console.warn("Não foi possível salvar os dados no dispositivo:", erro);
  }
}

/* =========================================================
   HELPERS
========================================================= */
let contador = 0;
const uid = () => `id-${Date.now()}-${contador++}`;

function isoDeHoje(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
const HOJE_ISO = isoDeHoje(0);

function formatarDataLonga(iso) {
  const d = new Date(iso + "T12:00:00");
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function diaCurto(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}
function numeroDia(iso) {
  return new Date(iso + "T12:00:00").getDate();
}
function indiceSemana(iso) {
  const d = new Date(iso + "T12:00:00").getDay();
  return (d + 6) % 7; // 0=Seg ... 6=Dom
}
function formatBRL(v) {
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function diasEntre(isoAlvo) {
  const hoje = new Date(HOJE_ISO + "T00:00:00");
  const alvo = new Date(isoAlvo + "T00:00:00");
  return Math.round((alvo - hoje) / 86400000);
}

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const FRASES = [
  "Cuidar de você também é produtividade.",
  "Pequenos passos, todos os dias, mudam tudo.",
  "Organizar sua rotina é um ato de amor-próprio.",
  "Você não precisa ser perfeita, só constante.",
  "Hoje é um bom dia para recomeçar com leveza.",
  "Progresso é progresso, mesmo devagar.",
  "Respire. Você está indo bem.",
];
const AVATARES = ["🌸", "🌷", "🦋", "✨", "🌙", "🍑", "🪷"];

const CATEGORIAS_TAREFA = ["Trabalho", "Pessoal", "Casa", "Saúde", "Estudos", "Outros"];
const PRIORIDADES = ["Alta", "Média", "Baixa"];
const CORES_PRIORIDADE = { Alta: C.vermelho, Média: C.champagne, Baixa: C.verde };
const CATEGORIAS_META = ["Pessoal", "Carreira", "Saúde", "Financeiro", "Outros"];
const CATEGORIAS_RECEITA = ["Salário", "Freelance", "Presente", "Outros"];
const CATEGORIAS_DESPESA = ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Compras", "Assinaturas", "Outros"];
const CONTAS = ["Carteira", "Conta Corrente", "Poupança", "Cartão de Crédito"];
const HUMORES = [
  { valor: "otima", emoji: "😊", rotulo: "Ótima" },
  { valor: "bem", emoji: "😌", rotulo: "Bem" },
  { valor: "neutra", emoji: "😐", rotulo: "Neutra" },
  { valor: "cansada", emoji: "😔", rotulo: "Cansada" },
  { valor: "dificil", emoji: "😫", rotulo: "Difícil" },
];

/* =========================================================
   OCORRÊNCIA / CONCLUSÃO DE TAREFAS (com recorrência)
========================================================= */
function tarefaOcorreEm(t, iso) {
  if (!t.recorrente) return t.data === iso;
  if (t.frequencia === "diaria") return iso >= t.data;
  if (t.frequencia === "semanal") return iso >= t.data && (t.diasSemana || []).includes(indiceSemana(iso));
  return t.data === iso;
}
function tarefaConcluidaEm(t, iso) {
  if (!t.recorrente) return !!t.concluida && t.data === iso;
  return !!(t.historico && t.historico[iso]);
}

/* =========================================================
   DADOS INICIAIS (exemplo, tudo editável/removível)
========================================================= */
function dadosIniciais() {
  return {
    perfil: null, // dispara onboarding se null
    humorHoje: null,
    tarefas: [
      { id: uid(), titulo: "Reunião com equipe", categoria: "Trabalho", prioridade: "Alta", hora: "09:00", data: HOJE_ISO, recorrente: false, concluida: false, lembrete: true, historico: {} },
      { id: uid(), titulo: "Beber 2L de água", categoria: "Saúde", prioridade: "Média", hora: "08:00", data: HOJE_ISO, recorrente: true, frequencia: "diaria", diasSemana: [], concluida: false, lembrete: false, historico: {} },
      { id: uid(), titulo: "Pagar conta de luz", categoria: "Casa", prioridade: "Alta", hora: "18:00", data: HOJE_ISO, recorrente: false, concluida: false, lembrete: true, historico: {} },
      { id: uid(), titulo: "Ler 10 páginas", categoria: "Estudos", prioridade: "Baixa", hora: "20:00", data: HOJE_ISO, recorrente: false, concluida: true, lembrete: false, historico: {} },
    ],
    habitos: [
      { id: uid(), nome: "Beber água", frequencia: "Diário", lembrete: true, historico: { [isoDeHoje(-2)]: true, [isoDeHoje(-1)]: true } },
      { id: uid(), nome: "Alongar-se", frequencia: "Diário", lembrete: false, historico: { [isoDeHoje(-1)]: true } },
      { id: uid(), nome: "Ler antes de dormir", frequencia: "Semanal", lembrete: false, historico: {} },
    ],
    autocuidado: [
      { id: uid(), nome: "Skincare da noite", feitoHoje: false },
      { id: uid(), nome: "10 min de respiração", feitoHoje: false },
      { id: uid(), nome: "Momento sem telas", feitoHoje: false },
    ],
    diario: [
      { id: uid(), data: isoDeHoje(-1), texto: "Dia corrido, mas consegui organizar minha semana.", humor: "bem" },
    ],
    desejos: [
      { id: uid(), titulo: "Fim de semana na praia", categoria: "Viagem", preco: 800 },
    ],
    projetos: [
      { id: uid(), titulo: "Projeto Bem-Estar", etapasTotal: 15, etapasConcluidas: 4 },
    ],
    metas: [
      { id: uid(), titulo: "Organizar o guarda-roupa", categoria: "Pessoal", prazo: isoDeHoje(10), progresso: 40 },
      { id: uid(), titulo: "Concluir curso online", categoria: "Carreira", prazo: isoDeHoje(20), progresso: 65 },
    ],
    transacoes: [
      { id: uid(), tipo: "Receita", descricao: "Salário", categoria: "Salário", conta: "Conta Corrente", valor: 3200, data: isoDeHoje(-5) },
      { id: uid(), tipo: "Despesa", descricao: "Supermercado", categoria: "Alimentação", conta: "Cartão de Crédito", valor: 420, data: isoDeHoje(-3) },
      { id: uid(), tipo: "Despesa", descricao: "Uber", categoria: "Transporte", conta: "Carteira", valor: 38, data: isoDeHoje(-1) },
      { id: uid(), tipo: "Despesa", descricao: "Assinatura streaming", categoria: "Assinaturas", conta: "Cartão de Crédito", valor: 45, data: isoDeHoje(-2) },
    ],
    orcamentoMensal: 2200,
    metasFinanceiras: [
      { id: uid(), titulo: "Reserva de emergência", valorAlvo: 5000, valorAtual: 1800, prazo: isoDeHoje(120) },
    ],
    historicoDemo: [
      { dia: "5 dias atrás", pct: 62 }, { dia: "4 dias atrás", pct: 70 },
      { dia: "3 dias atrás", pct: 55 }, { dia: "2 dias atrás", pct: 80 },
      { dia: "Ontem", pct: 75 },
    ],
  };
}

/* =========================================================
   CONTEXTO GLOBAL
========================================================= */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* =========================================================
   ÁTOMOS DE UI
========================================================= */
function Cartao({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: C.card, borderRadius: 20, boxShadow: "0 2px 12px rgba(203,180,224,0.14)", ...style }}
    >
      {children}
    </div>
  );
}
function Pill({ children, cor, ativo = true }) {
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999,
        background: ativo ? cor + "22" : C.rosaClaro, color: ativo ? cor : C.textoSuave,
      }}
    >
      {children}
    </span>
  );
}
function BotaoFlutuante({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed", bottom: 84, right: "50%", transform: "translateX(160px)",
        width: 52, height: 52, borderRadius: 26, border: "none",
        background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})`,
        boxShadow: "0 6px 16px rgba(203,180,224,0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 40,
      }}
    >
      <Plus size={24} color="#fff" />
    </button>
  );
}
function ProgressoBarra({ pct, cor = C.champagne, alto = 8 }) {
  return (
    <div style={{ width: "100%", height: alto, borderRadius: 999, background: C.rosaClaro }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", borderRadius: 999, background: cor, transition: "width .3s" }} />
    </div>
  );
}
function ProgressoCirculo({ pct, size = 60, stroke = 7, cor = C.champagne }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={C.rosaClaro} strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={cor} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={c - (Math.min(100, pct) / 100) * c}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset .4s" }} />
      <text x="50%" y="53%" textAnchor="middle" fontSize={size * 0.24} fontWeight="600" fill={C.texto}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}
function ItemLinha({ icone: Icone, corIcone = C.malva, titulo, subtitulo, direita, onClick, riscado }) {
  return (
    <Cartao style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }} onClick={onClick}>
      {Icone && (
        <div style={{ width: 38, height: 38, borderRadius: 19, background: corIcone + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icone size={17} color={corIcone} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: C.texto, margin: 0, textDecoration: riscado ? "line-through" : "none", opacity: riscado ? 0.5 : 1 }}>{titulo}</p>
        {subtitulo && <p style={{ fontSize: 12, color: C.textoSuave, margin: "2px 0 0" }}>{subtitulo}</p>}
      </div>
      {direita}
    </Cartao>
  );
}
function BotaoIcone({ icone: Icone, onClick, cor = C.textoSuave }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", padding: 6, cursor: "pointer", display: "flex" }}>
      <Icone size={16} color={cor} />
    </button>
  );
}
function TituloSecao({ children, acao }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 4px 10px" }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: C.texto, margin: 0 }}>{children}</h2>
      {acao}
    </div>
  );
}
function EstadoVazio({ texto }) {
  return (
    <div style={{ padding: "26px 10px", textAlign: "center", color: C.textoSuave, fontSize: 13 }}>{texto}</div>
  );
}

/* =========================================================
   MODAL DE FORMULÁRIO GENÉRICO
========================================================= */
function ModalFormulario({ titulo, campos, valores, onFechar, onSalvar, onExcluir, corDestaque = C.texto }) {
  const [dados, setDados] = useState(valores);
  const set = (chave, val) => setDados((d) => ({ ...d, [chave]: val }));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(91,75,87,0.35)" }} onClick={onFechar}>
      <div style={{ width: "100%", maxWidth: 384, background: "#fff", borderRadius: "28px 28px 0 0", padding: 22, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.texto, margin: 0 }}>{titulo}</h3>
          <button onClick={onFechar} style={{ background: "none", border: "none" }}><X size={20} color={C.textoSuave} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {campos.map((c) => (
            <div key={c.chave}>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textoSuave, display: "block", marginBottom: 6 }}>{c.rotulo}</label>
              {c.tipo === "texto" && <input style={estiloInput} value={dados[c.chave] || ""} onChange={(e) => set(c.chave, e.target.value)} placeholder={c.placeholder} />}
              {c.tipo === "textarea" && <textarea style={{ ...estiloInput, resize: "none" }} rows={4} value={dados[c.chave] || ""} onChange={(e) => set(c.chave, e.target.value)} placeholder={c.placeholder} />}
              {c.tipo === "numero" && <input type="number" style={estiloInput} value={dados[c.chave] ?? ""} onChange={(e) => set(c.chave, e.target.value === "" ? "" : Number(e.target.value))} placeholder={c.placeholder} />}
              {c.tipo === "data" && <input type="date" style={estiloInput} value={dados[c.chave] || ""} onChange={(e) => set(c.chave, e.target.value)} />}
              {c.tipo === "hora" && <input type="time" style={estiloInput} value={dados[c.chave] || ""} onChange={(e) => set(c.chave, e.target.value)} />}
              {c.tipo === "select" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {c.opcoes.map((op) => (
                    <button key={op.valor} onClick={() => set(c.chave, op.valor)}
                      style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12, fontWeight: 500, border: "none",
                        background: dados[c.chave] === op.valor ? corDestaque : C.rosaClaro,
                        color: dados[c.chave] === op.valor ? "#fff" : C.texto }}>
                      {op.rotulo}
                    </button>
                  ))}
                </div>
              )}
              {c.tipo === "multiselect" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {c.opcoes.map((op) => {
                    const lista = dados[c.chave] || [];
                    const ativo = lista.includes(op.valor);
                    return (
                      <button key={op.valor} onClick={() => set(c.chave, ativo ? lista.filter((v) => v !== op.valor) : [...lista, op.valor])}
                        style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12, fontWeight: 500, border: "none",
                          background: ativo ? corDestaque : C.rosaClaro, color: ativo ? "#fff" : C.texto }}>
                        {op.rotulo}
                      </button>
                    );
                  })}
                </div>
              )}
              {c.tipo === "toggle" && (
                <button onClick={() => set(c.chave, !dados[c.chave])}
                  style={{ padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500, border: "none",
                    background: dados[c.chave] ? corDestaque : C.rosaClaro, color: dados[c.chave] ? "#fff" : C.texto }}>
                  {dados[c.chave] ? "Sim" : "Não"}
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={() => onSalvar(dados)} style={{ width: "100%", marginTop: 20, padding: "13px 0", borderRadius: 999, border: "none", fontSize: 14, fontWeight: 600, color: "#fff", background: corDestaque }}>
          Salvar
        </button>
        {onExcluir && (
          <button onClick={onExcluir} style={{ width: "100%", marginTop: 10, padding: "11px 0", borderRadius: 999, border: "none", fontSize: 13, fontWeight: 500, color: C.vermelho, background: "transparent" }}>
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ONBOARDING
========================================================= */
function Onboarding({ onConcluir }) {
  const [nome, setNome] = useState("");
  const [avatar, setAvatar] = useState(AVATARES[0]);
  const [horario, setHorario] = useState("07:00");
  const [objetivo, setObjetivo] = useState("");
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosaClaro}, ${C.lilas}55)`, display: "flex", justifyContent: "center", fontFamily: "'Poppins','Segoe UI',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 384, padding: "48px 24px" }}>
        <p style={{ fontSize: 13, color: C.textoSuave, marginBottom: 4 }}>Bem-vinda ao</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.texto, margin: "0 0 26px" }}>Meu Planner</h1>

        <Cartao style={{ padding: 20 }}>
          <label style={{ fontSize: 12, color: C.textoSuave, fontWeight: 500 }}>Como podemos te chamar?</label>
          <input style={{ ...estiloInput, marginTop: 6, marginBottom: 16 }} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />

          <label style={{ fontSize: 12, color: C.textoSuave, fontWeight: 500 }}>Escolha um avatar</label>
          <div style={{ display: "flex", gap: 8, margin: "8px 0 16px" }}>
            {AVATARES.map((a) => (
              <button key={a} onClick={() => setAvatar(a)} style={{ width: 40, height: 40, borderRadius: 20, fontSize: 18, border: "none", background: avatar === a ? C.champagne : C.rosaClaro }}>{a}</button>
            ))}
          </div>

          <label style={{ fontSize: 12, color: C.textoSuave, fontWeight: 500 }}>Horário de início do dia</label>
          <input type="time" style={{ ...estiloInput, marginTop: 6, marginBottom: 16 }} value={horario} onChange={(e) => setHorario(e.target.value)} />

          <label style={{ fontSize: 12, color: C.textoSuave, fontWeight: 500 }}>Seu principal objetivo agora</label>
          <input style={{ ...estiloInput, marginTop: 6 }} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Ex: mais equilíbrio na rotina" />
        </Cartao>

        <button
          disabled={!nome}
          onClick={() => onConcluir({ nome, avatar, horarioInicio: horario, objetivos: objetivo })}
          style={{ width: "100%", marginTop: 24, padding: "14px 0", borderRadius: 999, border: "none", fontWeight: 600, color: "#fff", fontSize: 14,
            background: nome ? `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})` : C.rosaClaro, opacity: nome ? 1 : 0.7 }}
        >
          Começar a organizar minha vida
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   NAVEGAÇÃO INFERIOR
========================================================= */
function NavegacaoInferior({ ativa, onMudar }) {
  const itens = [
    { id: "inicio", label: "Início", icone: Home },
    { id: "dia", label: "Meu Dia", icone: CalendarDays },
    { id: "vida", label: "Vida", icone: Heart },
    { id: "dinheiro", label: "Dinheiro", icone: Wallet },
    { id: "escala", label: "Escala", icone: TrendingUp },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 384, background: "#fff", borderTop: `1px solid ${C.rosaClaro}`, display: "flex", padding: "8px 4px calc(8px + env(safe-area-inset-bottom))", zIndex: 30 }}>
      {itens.map((it) => {
        const Icone = it.icone;
        const ativo = ativa === it.id;
        return (
          <button key={it.id} onClick={() => onMudar(it.id)} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0" }}>
            <Icone size={19} color={ativo ? C.champagne : C.textoSuave} />
            <span style={{ fontSize: 10, fontWeight: ativo ? 600 : 400, color: ativo ? C.champagne : C.textoSuave }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   CABEÇALHO SUPERIOR
========================================================= */
function Cabecalho({ titulo, subtitulo, onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const { perfil } = useApp();
  return (
    <div style={{ padding: "22px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.texto, margin: 0 }}>{titulo}</h1>
        {subtitulo && <p style={{ fontSize: 12, color: C.textoSuave, margin: "2px 0 0" }}>{subtitulo}</p>}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={onAbrirNotificacoes} style={{ position: "relative", background: C.rosaClaro, border: "none", width: 36, height: 36, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bell size={16} color={C.texto} />
          {qtdNotificacoes > 0 && <span style={{ position: "absolute", top: -2, right: -2, width: 15, height: 15, borderRadius: 8, background: C.vermelho, color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{qtdNotificacoes}</span>}
        </button>
        <button onClick={onAbrirPerfil} style={{ background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})`, border: "none", width: 36, height: 36, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          {perfil?.avatar || "🌸"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   SUGESTÕES INTELIGENTES
========================================================= */
function useSugestoes() {
  const { tarefas, habitos, metas, transacoes, orcamentoMensal } = useApp();
  return useMemo(() => {
    const lista = [];
    const tarefasHoje = tarefas.filter((t) => tarefaOcorreEm(t, HOJE_ISO));
    const pendentes = tarefasHoje.filter((t) => !tarefaConcluidaEm(t, HOJE_ISO));
    if (pendentes.length > 0) lista.push({ icone: ListChecks, texto: `Você tem ${pendentes.length} tarefa(s) pendente(s) hoje.` });

    const altaPendente = pendentes.find((t) => t.prioridade === "Alta");
    if (altaPendente) lista.push({ icone: Flame, texto: `Prioridade alta: "${altaPendente.titulo}" ainda não foi feita.` });

    const habitosNaoFeitos = habitos.filter((h) => !h.historico[HOJE_ISO]);
    if (habitosNaoFeitos.length > 0) lista.push({ icone: Repeat, texto: `Hábito pendente hoje: ${habitosNaoFeitos[0].nome}.` });

    const metaProxima = metas.find((m) => m.progresso < 100 && diasEntre(m.prazo) <= 7 && diasEntre(m.prazo) >= 0);
    if (metaProxima) lista.push({ icone: Target, texto: `Meta "${metaProxima.titulo}" vence em ${diasEntre(metaProxima.prazo)} dia(s).` });

    const mesAtual = HOJE_ISO.slice(0, 7);
    const gastoMes = transacoes.filter((t) => t.tipo === "Despesa" && t.data.startsWith(mesAtual)).reduce((s, t) => s + t.valor, 0);
    if (orcamentoMensal && gastoMes > orcamentoMensal) lista.push({ icone: Wallet, texto: "Seus gastos do mês já passaram do orçamento definido." });

    if (lista.length === 0) lista.push({ icone: Sparkles, texto: "Tudo em ordem por aqui — aproveite o seu dia!" });
    return lista.slice(0, 4);
  }, [tarefas, habitos, metas, transacoes, orcamentoMensal]);
}

/* =========================================================
   TELA: INÍCIO
========================================================= */
function TelaInicio({ irPara, onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const { perfil, tarefas, habitos, metas, transacoes, humorHoje, setHumorHoje, alternarTarefa, alternarHabito } = useApp();
  const sugestoes = useSugestoes();

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const IconeHora = hora < 12 ? Sun : hora < 18 ? Sunset : MoonStar;
  const frase = FRASES[new Date().getDate() % FRASES.length];

  const tarefasHoje = tarefas.filter((t) => tarefaOcorreEm(t, HOJE_ISO));
  const concluidasHoje = tarefasHoje.filter((t) => tarefaConcluidaEm(t, HOJE_ISO));
  const habitosHoje = habitos;
  const habitosFeitos = habitos.filter((h) => h.historico[HOJE_ISO]);
  const totalItens = tarefasHoje.length + habitosHoje.length;
  const totalFeitos = concluidasHoje.length + habitosFeitos.length;
  const pctDia = totalItens ? (totalFeitos / totalItens) * 100 : 0;

  const proximosCompromissos = tarefasHoje.filter((t) => !tarefaConcluidaEm(t, HOJE_ISO)).sort((a, b) => (a.hora || "").localeCompare(b.hora || "")).slice(0, 3);

  const mesAtual = HOJE_ISO.slice(0, 7);
  const entradasMes = transacoes.filter((t) => t.tipo === "Receita" && t.data.startsWith(mesAtual)).reduce((s, t) => s + t.valor, 0);
  const saidasMes = transacoes.filter((t) => t.tipo === "Despesa" && t.data.startsWith(mesAtual)).reduce((s, t) => s + t.valor, 0);
  const saldoGeral = transacoes.reduce((s, t) => s + (t.tipo === "Receita" ? t.valor : -t.valor), 0);

  const metasEmAndamento = metas.filter((m) => m.progresso < 100).slice(0, 2);

  return (
    <div style={{ padding: "0 18px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IconeHora size={18} color={C.champagne} />
          <h1 style={{ fontSize: 19, fontWeight: 700, color: C.texto, margin: 0 }}>{saudacao}, {perfil?.nome}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={onAbrirNotificacoes} style={{ position: "relative", background: C.rosaClaro, border: "none", width: 34, height: 34, borderRadius: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={15} color={C.texto} />
            {qtdNotificacoes > 0 && <span style={{ position: "absolute", top: -2, right: -2, width: 14, height: 14, borderRadius: 7, background: C.vermelho, color: "#fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>{qtdNotificacoes}</span>}
          </button>
          <button onClick={onAbrirPerfil} style={{ background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})`, border: "none", width: 34, height: 34, borderRadius: 17, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
            {perfil?.avatar || "🌸"}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: C.textoSuave, margin: "4px 0 2px" }}>{formatarDataLonga(HOJE_ISO)}</p>
      <p style={{ fontSize: 13, color: C.texto, fontStyle: "italic", margin: "6px 0 0" }}>"{frase}"</p>

      {/* Progresso + humor */}
      <Cartao style={{ marginTop: 16, padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
        <ProgressoCirculo pct={pctDia} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.texto, margin: 0 }}>Progresso de hoje</p>
          <p style={{ fontSize: 12, color: C.textoSuave, margin: "2px 0 8px" }}>{totalFeitos} de {totalItens} concluídos</p>
          <div style={{ display: "flex", gap: 6 }}>
            {HUMORES.map((h) => (
              <button key={h.valor} onClick={() => setHumorHoje(h.valor)} style={{ fontSize: 16, background: humorHoje === h.valor ? C.rosaClaro : "transparent", border: "none", borderRadius: 10, padding: 3 }}>{h.emoji}</button>
            ))}
          </div>
        </div>
      </Cartao>

      <button onClick={() => irPara("dia")} style={{ width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 999, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})` }}>
        Organizar meu dia
      </button>

      <TituloSecao>Próximos compromissos</TituloSecao>
      {proximosCompromissos.length === 0 ? <EstadoVazio texto="Nenhum compromisso pendente hoje 🎉" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {proximosCompromissos.map((t) => (
            <ItemLinha key={t.id} icone={Clock} corIcone={CORES_PRIORIDADE[t.prioridade]} titulo={t.titulo} subtitulo={`${t.hora || "—"} · ${t.categoria}`}
              direita={<button onClick={() => alternarTarefa(t.id, HOJE_ISO)} style={{ width: 26, height: 26, borderRadius: 13, border: `2px solid ${C.rosaClaro}`, background: "none" }} />} />
          ))}
        </div>
      )}

      <TituloSecao>Hábitos de hoje</TituloSecao>
      {habitos.length === 0 ? <EstadoVazio texto="Nenhum hábito cadastrado ainda." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {habitos.map((h) => {
            const feito = !!h.historico[HOJE_ISO];
            return (
              <ItemLinha key={h.id} icone={Repeat} corIcone={C.lilas} titulo={h.nome} subtitulo={`${h.frequencia} · sequência de ${sequenciaHabito(h)} dia(s)`} riscado={feito}
                direita={<button onClick={() => alternarHabito(h.id, HOJE_ISO)} style={{ width: 26, height: 26, borderRadius: 13, border: "none", background: feito ? C.champagne : C.rosaClaro, display: "flex", alignItems: "center", justifyContent: "center" }}>{feito && <Check size={14} color="#fff" />}</button>} />
            );
          })}
        </div>
      )}

      <TituloSecao>Resumo financeiro</TituloSecao>
      <Cartao style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: C.textoSuave }}>Saldo disponível</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.texto }}>{formatBRL(saldoGeral)}</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}><ArrowUpCircle size={15} color={C.verde} /><span style={{ fontSize: 12, color: C.textoSuave }}>{formatBRL(entradasMes)}</span></div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}><ArrowDownCircle size={15} color={C.vermelho} /><span style={{ fontSize: 12, color: C.textoSuave }}>{formatBRL(saidasMes)}</span></div>
        </div>
      </Cartao>

      <TituloSecao>Metas em andamento</TituloSecao>
      {metasEmAndamento.length === 0 ? <EstadoVazio texto="Nenhuma meta em andamento." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {metasEmAndamento.map((m) => (
            <Cartao key={m.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.texto }}>{m.titulo}</span>
                <span style={{ fontSize: 12, color: C.textoSuave }}>{m.progresso}%</span>
              </div>
              <ProgressoBarra pct={m.progresso} />
            </Cartao>
          ))}
        </div>
      )}

      <TituloSecao>Sugestões para você</TituloSecao>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sugestoes.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: `linear-gradient(135deg, ${C.rosaClaro}, ${C.malva}33)`, borderRadius: 16, padding: 12 }}>
            <s.icone size={16} color={C.texto} />
            <span style={{ fontSize: 12.5, color: C.texto }}>{s.texto}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function sequenciaHabito(h) {
  let seq = 0;
  for (let i = 0; i < 60; i++) {
    if (h.historico[isoDeHoje(-i)]) seq++; else break;
  }
  return seq;
}

/* =========================================================
   TELA: MEU DIA
========================================================= */
function TelaMeuDia({ onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const { tarefas, adicionarTarefa, editarTarefa, removerTarefa, alternarTarefa } = useApp();
  const [visao, setVisao] = useState("dia");
  const [dataSel, setDataSel] = useState(HOJE_ISO);
  const [modal, setModal] = useState(null); // {editando}

  const tarefasDoDia = tarefas.filter((t) => tarefaOcorreEm(t, dataSel)).sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  const concluidasDoDia = tarefasDoDia.filter((t) => tarefaConcluidaEm(t, dataSel));
  const pct = tarefasDoDia.length ? (concluidasDoDia.length / tarefasDoDia.length) * 100 : 0;

  const semana = Array.from({ length: 7 }, (_, i) => isoDeHoje(i - indiceSemana(HOJE_ISO)));

  function mover(idx, dir) {
    const alvo = tarefasDoDia[idx];
    const outro = tarefasDoDia[idx + dir];
    if (!alvo || !outro) return;
    const h1 = alvo.hora, h2 = outro.hora;
    editarTarefa(alvo.id, { hora: h2 });
    editarTarefa(outro.id, { hora: h1 });
  }

  const campos = [
    { chave: "titulo", rotulo: "Título da tarefa", tipo: "texto", placeholder: "Ex: Ligar para o dentista" },
    { chave: "categoria", rotulo: "Categoria", tipo: "select", opcoes: CATEGORIAS_TAREFA.map((c) => ({ valor: c, rotulo: c })) },
    { chave: "prioridade", rotulo: "Prioridade", tipo: "select", opcoes: PRIORIDADES.map((c) => ({ valor: c, rotulo: c })) },
    { chave: "hora", rotulo: "Horário", tipo: "hora" },
    { chave: "data", rotulo: "Data", tipo: "data" },
    { chave: "recorrente", rotulo: "Tarefa recorrente", tipo: "toggle" },
    { chave: "frequencia", rotulo: "Repetir", tipo: "select", opcoes: [{ valor: "diaria", rotulo: "Todo dia" }, { valor: "semanal", rotulo: "Dias da semana" }] },
    { chave: "diasSemana", rotulo: "Quais dias", tipo: "multiselect", opcoes: DIAS_SEMANA.map((d, i) => ({ valor: i, rotulo: d })) },
    { chave: "lembrete", rotulo: "Criar lembrete", tipo: "toggle" },
  ];

  return (
    <div style={{ padding: "0 18px 90px" }}>
      <Cabecalho titulo="Meu Dia" subtitulo={formatarDataLonga(dataSel)} onAbrirNotificacoes={onAbrirNotificacoes} onAbrirPerfil={onAbrirPerfil} qtdNotificacoes={qtdNotificacoes} />
      <div style={{ margin: "0 0 14px", display: "flex", gap: 8 }}>
        {["dia", "semana"].map((v) => (
          <button key={v} onClick={() => setVisao(v)} style={{ flex: 1, padding: "8px 0", borderRadius: 999, border: "none", fontSize: 12, fontWeight: 600, background: visao === v ? C.texto : C.rosaClaro, color: visao === v ? "#fff" : C.texto }}>
            {v === "dia" ? "Dia" : "Semana"}
          </button>
        ))}
      </div>

      {visao === "semana" && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 6 }}>
          {semana.map((iso) => {
            const dt = tarefas.filter((t) => tarefaOcorreEm(t, iso));
            const dc = dt.filter((t) => tarefaConcluidaEm(t, iso));
            const p = dt.length ? (dc.length / dt.length) * 100 : 0;
            return (
              <button key={iso} onClick={() => { setDataSel(iso); setVisao("dia"); }} style={{ minWidth: 60, background: iso === dataSel ? C.rosaCha : C.card, border: "none", borderRadius: 16, padding: "10px 6px", boxShadow: "0 2px 8px rgba(203,180,224,0.12)" }}>
                <p style={{ fontSize: 10, color: iso === dataSel ? "#fff" : C.textoSuave, margin: 0, textTransform: "capitalize" }}>{diaCurto(iso)}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: iso === dataSel ? "#fff" : C.texto, margin: "2px 0 6px" }}>{numeroDia(iso)}</p>
                <ProgressoBarra pct={p} cor={iso === dataSel ? "#fff" : C.champagne} alto={4} />
              </button>
            );
          })}
        </div>
      )}

      <Cartao style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <ProgressoCirculo pct={pct} size={48} stroke={5} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.texto, margin: 0 }}>Progresso do dia</p>
          <p style={{ fontSize: 12, color: C.textoSuave, margin: "2px 0 0" }}>{concluidasDoDia.length} de {tarefasDoDia.length} tarefas</p>
        </div>
      </Cartao>

      {tarefasDoDia.length === 0 ? <EstadoVazio texto="Nenhuma tarefa para este dia. Toque em + para adicionar." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tarefasDoDia.map((t, idx) => {
            const feita = tarefaConcluidaEm(t, dataSel);
            return (
              <Cartao key={t.id} style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => alternarTarefa(t.id, dataSel)} style={{ width: 24, height: 24, borderRadius: 12, border: `2px solid ${CORES_PRIORIDADE[t.prioridade]}`, background: feita ? CORES_PRIORIDADE[t.prioridade] : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {feita && <Check size={13} color="#fff" />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => setModal({ editando: t })}>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: C.texto, margin: 0, textDecoration: feita ? "line-through" : "none", opacity: feita ? 0.55 : 1 }}>{t.titulo}</p>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.textoSuave }}>{t.hora || "sem horário"}</span>
                    <Pill cor={CORES_PRIORIDADE[t.prioridade]}>{t.prioridade}</Pill>
                    <Pill cor={C.lilas}>{t.categoria}</Pill>
                    {t.recorrente && <Repeat size={11} color={C.textoSuave} />}
                    {t.lembrete && <Bell size={11} color={C.textoSuave} />}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <BotaoIcone icone={ChevronLeft} onClick={() => mover(idx, -1)} />
                  <BotaoIcone icone={ChevronRight} onClick={() => mover(idx, 1)} />
                </div>
                <BotaoIcone icone={Trash2} cor={C.vermelho} onClick={() => removerTarefa(t.id)} />
              </Cartao>
            );
          })}
        </div>
      )}

      <BotaoFlutuante onClick={() => setModal({ editando: { data: dataSel, categoria: "Pessoal", prioridade: "Média", recorrente: false, frequencia: "diaria", diasSemana: [], lembrete: false } })} />

      {modal && (
        <ModalFormulario
          titulo={modal.editando.id ? "Editar tarefa" : "Nova tarefa"}
          campos={campos}
          valores={modal.editando}
          corDestaque={C.rosaCha}
          onFechar={() => setModal(null)}
          onExcluir={modal.editando.id ? () => { removerTarefa(modal.editando.id); setModal(null); } : undefined}
          onSalvar={(dados) => {
            if (!dados.titulo) return;
            if (modal.editando.id) editarTarefa(modal.editando.id, dados);
            else adicionarTarefa(dados);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   TELA: VIDA (com sub-abas)
========================================================= */
function TelaVida({ onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const [sub, setSub] = useState("metas");
  const subs = [
    { id: "metas", label: "Metas" },
    { id: "habitos", label: "Hábitos" },
    { id: "autocuidado", label: "Autocuidado" },
    { id: "diario", label: "Diário" },
    { id: "desejos", label: "Desejos" },
    { id: "projetos", label: "Projetos" },
  ];
  return (
    <div style={{ padding: "0 18px 90px" }}>
      <Cabecalho titulo="Vida" subtitulo="Sua organização pessoal" onAbrirNotificacoes={onAbrirNotificacoes} onAbrirPerfil={onAbrirPerfil} qtdNotificacoes={qtdNotificacoes} />
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {subs.map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)} style={{ whiteSpace: "nowrap", padding: "7px 13px", borderRadius: 999, border: "none", fontSize: 11.5, fontWeight: 600, background: sub === s.id ? C.texto : C.rosaClaro, color: sub === s.id ? "#fff" : C.texto }}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        {sub === "metas" && <SecaoMetas />}
        {sub === "habitos" && <SecaoHabitos />}
        {sub === "autocuidado" && <SecaoAutocuidado />}
        {sub === "diario" && <SecaoDiario />}
        {sub === "desejos" && <SecaoDesejos />}
        {sub === "projetos" && <SecaoProjetos />}
      </div>
    </div>
  );
}

function SecaoMetas() {
  const { metas, adicionarMeta, editarMeta, removerMeta } = useApp();
  const [modal, setModal] = useState(null);
  const campos = [
    { chave: "titulo", rotulo: "Título da meta", tipo: "texto", placeholder: "Ex: Ler 12 livros este ano" },
    { chave: "categoria", rotulo: "Categoria", tipo: "select", opcoes: CATEGORIAS_META.map((c) => ({ valor: c, rotulo: c })) },
    { chave: "prazo", rotulo: "Prazo", tipo: "data" },
    { chave: "progresso", rotulo: "Progresso (%)", tipo: "numero", placeholder: "0 a 100" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {metas.length === 0 && <EstadoVazio texto="Nenhuma meta cadastrada." />}
      {metas.map((m) => (
        <Cartao key={m.id} style={{ padding: 14 }} onClick={() => setModal({ editando: m })}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: C.texto }}>{m.titulo}</span>
            <Pill cor={C.lilas}>{m.categoria}</Pill>
          </div>
          <ProgressoBarra pct={m.progresso} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: C.textoSuave }}>Prazo: {formatarDataLonga(m.prazo)}</span>
            <span style={{ fontSize: 11, color: C.textoSuave }}>{m.progresso}%</span>
          </div>
        </Cartao>
      ))}
      <BotaoFlutuante onClick={() => setModal({ editando: { categoria: "Pessoal", progresso: 0, prazo: isoDeHoje(30) } })} />
      {modal && (
        <ModalFormulario titulo={modal.editando.id ? "Editar meta" : "Nova meta"} campos={campos} valores={modal.editando} corDestaque={C.lilas}
          onFechar={() => setModal(null)}
          onExcluir={modal.editando.id ? () => { removerMeta(modal.editando.id); setModal(null); } : undefined}
          onSalvar={(d) => { if (!d.titulo) return; modal.editando.id ? editarMeta(modal.editando.id, d) : adicionarMeta(d); setModal(null); }} />
      )}
    </div>
  );
}

function SecaoHabitos() {
  const { habitos, adicionarHabito, editarHabito, removerHabito, alternarHabito } = useApp();
  const [modal, setModal] = useState(null);
  const campos = [
    { chave: "nome", rotulo: "Nome do hábito", tipo: "texto", placeholder: "Ex: Meditar" },
    { chave: "frequencia", rotulo: "Frequência", tipo: "select", opcoes: [{ valor: "Diário", rotulo: "Diário" }, { valor: "Semanal", rotulo: "Semanal" }] },
    { chave: "lembrete", rotulo: "Criar lembrete", tipo: "toggle" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {habitos.length === 0 && <EstadoVazio texto="Nenhum hábito cadastrado." />}
      {habitos.map((h) => {
        const feito = !!h.historico[HOJE_ISO];
        const ultimosDias = Array.from({ length: 7 }, (_, i) => isoDeHoje(-6 + i));
        return (
          <Cartao key={h.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div onClick={() => setModal({ editando: h })} style={{ flex: 1 }}>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: C.texto, margin: 0 }}>{h.nome}</p>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                  <Pill cor={C.lilas}>{h.frequencia}</Pill>
                  <span style={{ fontSize: 11, color: C.textoSuave, display: "flex", alignItems: "center", gap: 3 }}><Flame size={11} color={C.champagne} /> {sequenciaHabito(h)} dias</span>
                </div>
              </div>
              <button onClick={() => alternarHabito(h.id, HOJE_ISO)} style={{ width: 30, height: 30, borderRadius: 15, border: "none", background: feito ? C.champagne : C.rosaClaro, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {feito && <Check size={15} color="#fff" />}
              </button>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
              {ultimosDias.map((iso) => (
                <div key={iso} style={{ flex: 1, height: 6, borderRadius: 3, background: h.historico[iso] ? C.champagne : C.rosaClaro }} />
              ))}
            </div>
          </Cartao>
        );
      })}
      <BotaoFlutuante onClick={() => setModal({ editando: { frequencia: "Diário", lembrete: false } })} />
      {modal && (
        <ModalFormulario titulo={modal.editando.id ? "Editar hábito" : "Novo hábito"} campos={campos} valores={modal.editando} corDestaque={C.lilas}
          onFechar={() => setModal(null)}
          onExcluir={modal.editando.id ? () => { removerHabito(modal.editando.id); setModal(null); } : undefined}
          onSalvar={(d) => { if (!d.nome) return; modal.editando.id ? editarHabito(modal.editando.id, d) : adicionarHabito(d); setModal(null); }} />
      )}
    </div>
  );
}

function SecaoAutocuidado() {
  const { autocuidado, adicionarAutocuidado, alternarAutocuidado, removerAutocuidado } = useApp();
  const [modal, setModal] = useState(null);
  const feitos = autocuidado.filter((a) => a.feitoHoje).length;
  return (
    <div>
      <Cartao style={{ padding: 14, marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.texto, margin: "0 0 8px" }}>Checklist de hoje</p>
        <ProgressoBarra pct={autocuidado.length ? (feitos / autocuidado.length) * 100 : 0} />
      </Cartao>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {autocuidado.length === 0 && <EstadoVazio texto="Nenhum item de autocuidado ainda." />}
        {autocuidado.map((a) => (
          <ItemLinha key={a.id} icone={Sparkles} corIcone={C.malva} titulo={a.nome} riscado={a.feitoHoje}
            direita={<div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => alternarAutocuidado(a.id)} style={{ width: 26, height: 26, borderRadius: 13, border: "none", background: a.feitoHoje ? C.champagne : C.rosaClaro, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.feitoHoje && <Check size={13} color="#fff" />}</button>
              <BotaoIcone icone={Trash2} cor={C.vermelho} onClick={() => removerAutocuidado(a.id)} />
            </div>} />
        ))}
      </div>
      <BotaoFlutuante onClick={() => setModal({ editando: {} })} />
      {modal && (
        <ModalFormulario titulo="Novo item de autocuidado" campos={[{ chave: "nome", rotulo: "Nome", tipo: "texto", placeholder: "Ex: Hidratar a pele" }]} valores={modal.editando} corDestaque={C.malva}
          onFechar={() => setModal(null)} onSalvar={(d) => { if (!d.nome) return; adicionarAutocuidado(d); setModal(null); }} />
      )}
    </div>
  );
}

function SecaoDiario() {
  const { diario, adicionarDiario, removerDiario } = useApp();
  const [modal, setModal] = useState(null);
  const campos = [
    { chave: "texto", rotulo: "Como foi o seu dia?", tipo: "textarea", placeholder: "Escreva livremente..." },
    { chave: "humor", rotulo: "Humor", tipo: "select", opcoes: HUMORES.map((h) => ({ valor: h.valor, rotulo: `${h.emoji} ${h.rotulo}` })) },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {diario.length === 0 && <EstadoVazio texto="Nenhum registro no diário ainda." />}
      {[...diario].reverse().map((d) => {
        const h = HUMORES.find((x) => x.valor === d.humor);
        return (
          <Cartao key={d.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.textoSuave }}>{formatarDataLonga(d.data)}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>{h?.emoji}</span>
                <BotaoIcone icone={Trash2} cor={C.vermelho} onClick={() => removerDiario(d.id)} />
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.texto, margin: 0, lineHeight: 1.5 }}>{d.texto}</p>
          </Cartao>
        );
      })}
      <BotaoFlutuante onClick={() => setModal({ editando: { humor: "bem" } })} />
      {modal && (
        <ModalFormulario titulo="Novo registro" campos={campos} valores={modal.editando} corDestaque={C.rosaCha}
          onFechar={() => setModal(null)} onSalvar={(d) => { if (!d.texto) return; adicionarDiario({ ...d, data: HOJE_ISO }); setModal(null); }} />
      )}
    </div>
  );
}

function SecaoDesejos() {
  const { desejos, adicionarDesejo, removerDesejo } = useApp();
  const [modal, setModal] = useState(null);
  const campos = [
    { chave: "titulo", rotulo: "O que você deseja?", tipo: "texto", placeholder: "Ex: Curso de fotografia" },
    { chave: "categoria", rotulo: "Categoria", tipo: "texto", placeholder: "Ex: Lazer" },
    { chave: "preco", rotulo: "Valor estimado (R$)", tipo: "numero" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {desejos.length === 0 && <EstadoVazio texto="Sua lista de desejos está vazia." />}
      {desejos.map((d) => (
        <ItemLinha key={d.id} icone={Gift} corIcone={C.champagne} titulo={d.titulo} subtitulo={`${d.categoria} · ${formatBRL(d.preco)}`}
          direita={<BotaoIcone icone={Trash2} cor={C.vermelho} onClick={() => removerDesejo(d.id)} />} />
      ))}
      <BotaoFlutuante onClick={() => setModal({ editando: {} })} />
      {modal && (
        <ModalFormulario titulo="Novo desejo" campos={campos} valores={modal.editando} corDestaque={C.champagne}
          onFechar={() => setModal(null)} onSalvar={(d) => { if (!d.titulo) return; adicionarDesejo(d); setModal(null); }} />
      )}
    </div>
  );
}

function SecaoProjetos() {
  const { projetos, adicionarProjeto, editarProjeto, removerProjeto } = useApp();
  const [modal, setModal] = useState(null);
  const campos = [
    { chave: "titulo", rotulo: "Nome do projeto", tipo: "texto", placeholder: "Ex: Reforma do quarto" },
    { chave: "etapasTotal", rotulo: "Total de etapas", tipo: "numero" },
    { chave: "etapasConcluidas", rotulo: "Etapas concluídas", tipo: "numero" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {projetos.length === 0 && <EstadoVazio texto="Nenhum projeto pessoal ainda." />}
      {projetos.map((p) => (
        <Cartao key={p.id} style={{ padding: 14 }} onClick={() => setModal({ editando: p })}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <FolderKanban size={16} color={C.lilas} />
            <span style={{ fontSize: 13.5, fontWeight: 500, color: C.texto }}>{p.titulo}</span>
          </div>
          <ProgressoBarra pct={(p.etapasConcluidas / (p.etapasTotal || 1)) * 100} cor={C.lilas} />
          <p style={{ fontSize: 11, color: C.textoSuave, margin: "6px 0 0" }}>{p.etapasConcluidas} de {p.etapasTotal} etapas</p>
        </Cartao>
      ))}
      <BotaoFlutuante onClick={() => setModal({ editando: { etapasTotal: 1, etapasConcluidas: 0 } })} />
      {modal && (
        <ModalFormulario titulo={modal.editando.id ? "Editar projeto" : "Novo projeto"} campos={campos} valores={modal.editando} corDestaque={C.lilas}
          onFechar={() => setModal(null)}
          onExcluir={modal.editando.id ? () => { removerProjeto(modal.editando.id); setModal(null); } : undefined}
          onSalvar={(d) => { if (!d.titulo) return; modal.editando.id ? editarProjeto(modal.editando.id, d) : adicionarProjeto(d); setModal(null); }} />
      )}
    </div>
  );
}

/* =========================================================
   TELA: DINHEIRO
========================================================= */
function TelaDinheiro({ onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const { transacoes, adicionarTransacao, removerTransacao, orcamentoMensal, setOrcamentoMensal, metasFinanceiras, adicionarMetaFinanceira, contribuirMetaFinanceira, removerMetaFinanceira } = useApp();
  const [modalTx, setModalTx] = useState(null);
  const [modalMeta, setModalMeta] = useState(null);
  const [editandoOrcamento, setEditandoOrcamento] = useState(false);
  const [novoOrcamento, setNovoOrcamento] = useState(orcamentoMensal);

  const mesAtual = HOJE_ISO.slice(0, 7);
  const doMes = transacoes.filter((t) => t.data.startsWith(mesAtual));
  const entradas = doMes.filter((t) => t.tipo === "Receita").reduce((s, t) => s + t.valor, 0);
  const saidas = doMes.filter((t) => t.tipo === "Despesa").reduce((s, t) => s + t.valor, 0);
  const saldo = transacoes.reduce((s, t) => s + (t.tipo === "Receita" ? t.valor : -t.valor), 0);

  const porCategoria = {};
  doMes.filter((t) => t.tipo === "Despesa").forEach((t) => { porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.valor; });
  const dadosGrafico = Object.entries(porCategoria).map(([cat, valor]) => ({ cat, valor }));

  const campos = [
    { chave: "tipo", rotulo: "Tipo", tipo: "select", opcoes: [{ valor: "Receita", rotulo: "Receita" }, { valor: "Despesa", rotulo: "Despesa" }] },
    { chave: "descricao", rotulo: "Descrição", tipo: "texto", placeholder: "Ex: Supermercado" },
    { chave: "categoria", rotulo: "Categoria", tipo: "select", opcoes: (modalTx?.editando?.tipo === "Receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((c) => ({ valor: c, rotulo: c })) },
    { chave: "conta", rotulo: "Conta", tipo: "select", opcoes: CONTAS.map((c) => ({ valor: c, rotulo: c })) },
    { chave: "valor", rotulo: "Valor (R$)", tipo: "numero" },
    { chave: "data", rotulo: "Data", tipo: "data" },
  ];
  const camposMeta = [
    { chave: "titulo", rotulo: "Nome da meta", tipo: "texto", placeholder: "Ex: Viagem dos sonhos" },
    { chave: "valorAlvo", rotulo: "Valor alvo (R$)", tipo: "numero" },
    { chave: "valorAtual", rotulo: "Valor já guardado (R$)", tipo: "numero" },
    { chave: "prazo", rotulo: "Prazo", tipo: "data" },
  ];

  return (
    <div style={{ padding: "0 18px 90px" }}>
      <Cabecalho titulo="Dinheiro" subtitulo="Seu controle financeiro" onAbrirNotificacoes={onAbrirNotificacoes} onAbrirPerfil={onAbrirPerfil} qtdNotificacoes={qtdNotificacoes} />

      <Cartao style={{ padding: 18, background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})` }}>
        <p style={{ fontSize: 12, color: "#fff9", margin: 0 }}>Saldo disponível</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "4px 0 12px" }}>{formatBRL(saldo)}</p>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}><ArrowUpCircle size={15} color="#fff" /><span style={{ fontSize: 12, color: "#fff" }}>{formatBRL(entradas)}</span></div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}><ArrowDownCircle size={15} color="#fff" /><span style={{ fontSize: 12, color: "#fff" }}>{formatBRL(saidas)}</span></div>
        </div>
      </Cartao>

      <TituloSecao acao={<button onClick={() => setEditandoOrcamento(true)} style={{ background: "none", border: "none", color: C.champagne, fontSize: 12, fontWeight: 600 }}>Editar</button>}>Orçamento mensal</TituloSecao>
      <Cartao style={{ padding: 14 }}>
        {editandoOrcamento ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" style={estiloInput} value={novoOrcamento} onChange={(e) => setNovoOrcamento(Number(e.target.value))} />
            <button onClick={() => { setOrcamentoMensal(novoOrcamento); setEditandoOrcamento(false); }} style={{ background: C.champagne, border: "none", borderRadius: 12, padding: "0 16px", color: "#fff", fontSize: 12, fontWeight: 600 }}>OK</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.textoSuave }}>Gasto: {formatBRL(saidas)}</span>
              <span style={{ fontSize: 12, color: C.textoSuave }}>Limite: {formatBRL(orcamentoMensal)}</span>
            </div>
            <ProgressoBarra pct={orcamentoMensal ? (saidas / orcamentoMensal) * 100 : 0} cor={saidas > orcamentoMensal ? C.vermelho : C.champagne} />
          </>
        )}
      </Cartao>

      {dadosGrafico.length > 0 && (
        <>
          <TituloSecao>Despesas por categoria</TituloSecao>
          <Cartao style={{ padding: 14 }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dadosGrafico}>
                <CartesianGrid stroke={C.rosaClaro} vertical={false} />
                <XAxis dataKey="cat" tick={{ fontSize: 9, fill: C.textoSuave }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} formatter={(v) => formatBRL(v)} />
                <Bar dataKey="valor" fill={C.rosaCha} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Cartao>
        </>
      )}

      <TituloSecao>Metas financeiras</TituloSecao>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {metasFinanceiras.length === 0 && <EstadoVazio texto="Nenhuma meta financeira ainda." />}
        {metasFinanceiras.map((m) => (
          <Cartao key={m.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.texto }}>{m.titulo}</span>
              <BotaoIcone icone={Trash2} cor={C.vermelho} onClick={() => removerMetaFinanceira(m.id)} />
            </div>
            <ProgressoBarra pct={(m.valorAtual / (m.valorAlvo || 1)) * 100} cor={C.verde} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: C.textoSuave }}>{formatBRL(m.valorAtual)} de {formatBRL(m.valorAlvo)}</span>
              <button onClick={() => contribuirMetaFinanceira(m.id, 50)} style={{ background: C.verde, border: "none", borderRadius: 999, padding: "5px 12px", color: "#fff", fontSize: 11, fontWeight: 600 }}>+ R$50</button>
            </div>
          </Cartao>
        ))}
        <button onClick={() => setModalMeta({ editando: { valorAtual: 0, valorAlvo: 1000, prazo: isoDeHoje(90) } })} style={{ padding: "10px 0", borderRadius: 14, border: `1.5px dashed ${C.lilas}`, background: "none", color: C.lilas, fontSize: 12, fontWeight: 600 }}>
          + Nova meta financeira
        </button>
      </div>

      <TituloSecao>Histórico de movimentações</TituloSecao>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[...transacoes].sort((a, b) => b.data.localeCompare(a.data)).map((t) => (
          <ItemLinha key={t.id} icone={t.tipo === "Receita" ? ArrowUpCircle : ArrowDownCircle} corIcone={t.tipo === "Receita" ? C.verde : C.vermelho}
            titulo={t.descricao} subtitulo={`${t.categoria} · ${t.conta} · ${new Date(t.data + "T12:00:00").toLocaleDateString("pt-BR")}`}
            direita={<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: t.tipo === "Receita" ? C.verde : C.vermelho }}>{t.tipo === "Receita" ? "+" : "-"}{formatBRL(t.valor)}</span>
              <BotaoIcone icone={Trash2} cor={C.vermelho} onClick={() => removerTransacao(t.id)} />
            </div>} />
        ))}
      </div>

      <BotaoFlutuante onClick={() => setModalTx({ editando: { tipo: "Despesa", categoria: CATEGORIAS_DESPESA[0], conta: CONTAS[0], data: HOJE_ISO } })} />

      {modalTx && (
        <ModalFormulario titulo="Nova movimentação" campos={campos} valores={modalTx.editando} corDestaque={C.champagne}
          onFechar={() => setModalTx(null)}
          onSalvar={(d) => { if (!d.descricao || !d.valor) return; adicionarTransacao(d); setModalTx(null); }} />
      )}
      {modalMeta && (
        <ModalFormulario titulo="Nova meta financeira" campos={camposMeta} valores={modalMeta.editando} corDestaque={C.verde}
          onFechar={() => setModalMeta(null)}
          onSalvar={(d) => { if (!d.titulo) return; adicionarMetaFinanceira(d); setModalMeta(null); }} />
      )}
    </div>
  );
}

/* =========================================================
   TELA: ESCALA
========================================================= */
function TelaEscala({ onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const { tarefas, habitos, metas, historicoDemo } = useApp();
  const tarefasHoje = tarefas.filter((t) => tarefaOcorreEm(t, HOJE_ISO));
  const concluidasHoje = tarefasHoje.filter((t) => tarefaConcluidaEm(t, HOJE_ISO));
  const pctTarefas = tarefasHoje.length ? (concluidasHoje.length / tarefasHoje.length) * 100 : 0;

  const habitosFeitos = habitos.filter((h) => h.historico[HOJE_ISO]).length;
  const pctHabitos = habitos.length ? (habitosFeitos / habitos.length) * 100 : 0;

  const progressoMedioMetas = metas.length ? metas.reduce((s, m) => s + m.progresso, 0) / metas.length : 0;

  const pctGeralHoje = Math.round((pctTarefas + pctHabitos) / 2);
  const dadosSemana = [...historicoDemo, { dia: "Hoje", pct: pctGeralHoje }];

  const dadosMensais = [
    { semana: "Sem. 1", pct: 58 }, { semana: "Sem. 2", pct: 66 },
    { semana: "Sem. 3", pct: 71 }, { semana: "Sem. 4", pct: Math.round((66 + pctGeralHoje) / 2) },
  ];

  return (
    <div style={{ padding: "0 18px 90px" }}>
      <Cabecalho titulo="Escala" subtitulo="Sua evolução" onAbrirNotificacoes={onAbrirNotificacoes} onAbrirPerfil={onAbrirPerfil} qtdNotificacoes={qtdNotificacoes} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Cartao style={{ padding: 14, textAlign: "center" }}>
          <ProgressoCirculo pct={pctTarefas} size={54} />
          <p style={{ fontSize: 11, color: C.textoSuave, margin: "8px 0 0" }}>Tarefas concluídas</p>
        </Cartao>
        <Cartao style={{ padding: 14, textAlign: "center" }}>
          <ProgressoCirculo pct={pctHabitos} size={54} cor={C.lilas} />
          <p style={{ fontSize: 11, color: C.textoSuave, margin: "8px 0 0" }}>Hábitos concluídos</p>
        </Cartao>
        <Cartao style={{ padding: 14, textAlign: "center" }}>
          <ProgressoCirculo pct={progressoMedioMetas} size={54} cor={C.champagne} />
          <p style={{ fontSize: 11, color: C.textoSuave, margin: "8px 0 0" }}>Progresso das metas</p>
        </Cartao>
        <Cartao style={{ padding: 14, textAlign: "center" }}>
          <ProgressoCirculo pct={pctGeralHoje} size={54} cor={C.verde} />
          <p style={{ fontSize: 11, color: C.textoSuave, margin: "8px 0 0" }}>Produtividade geral</p>
        </Cartao>
      </div>

      <TituloSecao>Evolução semanal</TituloSecao>
      <Cartao style={{ padding: 14 }}>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={dadosSemana}>
            <CartesianGrid stroke={C.rosaClaro} vertical={false} />
            <XAxis dataKey="dia" tick={{ fontSize: 9, fill: C.textoSuave }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
            <Line type="monotone" dataKey="pct" stroke={C.champagne} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 10.5, color: C.textoSuave, margin: "6px 0 0" }}>O ponto "Hoje" reflete sua atividade real; os anteriores são ilustrativos.</p>
      </Cartao>

      <TituloSecao>Evolução mensal</TituloSecao>
      <Cartao style={{ padding: 14 }}>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={dadosMensais}>
            <CartesianGrid stroke={C.rosaClaro} vertical={false} />
            <XAxis dataKey="semana" tick={{ fontSize: 10, fill: C.textoSuave }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
            <Bar dataKey="pct" fill={C.lilas} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Cartao>

      <TituloSecao>Resumo de desempenho</TituloSecao>
      <Cartao style={{ padding: 16, background: `linear-gradient(135deg, ${C.rosaClaro}, ${C.malva}33)` }}>
        <p style={{ fontSize: 13, color: C.texto, margin: 0, lineHeight: 1.6 }}>
          Hoje você concluiu {concluidasHoje.length} de {tarefasHoje.length} tarefas e {habitosFeitos} de {habitos.length} hábitos.
          Suas metas estão em {Math.round(progressoMedioMetas)}% de progresso médio. Continue no seu ritmo — cada avanço conta.
        </p>
      </Cartao>
    </div>
  );
}

/* =========================================================
   PERFIL / CONFIGURAÇÕES
========================================================= */
function TelaPerfil({ onFechar }) {
  const { perfil, editarPerfil, tarefas, habitos, metas } = useApp();
  const [editando, setEditando] = useState(false);
  const campos = [
    { chave: "nome", rotulo: "Nome", tipo: "texto" },
    { chave: "horarioInicio", rotulo: "Horário de início do dia", tipo: "hora" },
    { chave: "objetivos", rotulo: "Objetivo principal", tipo: "texto" },
  ];
  const lembretes = [
    ...tarefas.filter((t) => t.lembrete).map((t) => ({ tipo: "Tarefa", nome: t.titulo, quando: t.hora || t.data })),
    ...habitos.filter((h) => h.lembrete).map((h) => ({ tipo: "Hábito", nome: h.nome, quando: h.frequencia })),
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 60, overflowY: "auto" }}>
      <div style={{ maxWidth: 384, margin: "0 auto", padding: "22px 20px 40px" }}>
        <button onClick={onFechar} style={{ background: "none", border: "none", color: C.textoSuave, fontSize: 13, marginBottom: 12 }}>← Voltar</button>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 10px" }}>{perfil?.avatar}</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.texto, margin: 0 }}>{perfil?.nome}</h2>
          <p style={{ fontSize: 12, color: C.textoSuave, margin: "4px 0 0" }}>{perfil?.objetivos}</p>
        </div>

        <Cartao style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.texto, margin: 0 }}>Preferências</p>
            <button onClick={() => setEditando(true)} style={{ background: "none", border: "none", color: C.champagne, fontSize: 12, fontWeight: 600 }}>Editar</button>
          </div>
          <p style={{ fontSize: 12, color: C.textoSuave, margin: "4px 0" }}>Início do dia: {perfil?.horarioInicio}</p>
        </Cartao>

        <TituloSecao>Notificações e lembretes</TituloSecao>
        {lembretes.length === 0 ? <EstadoVazio texto="Nenhum lembrete configurado." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lembretes.map((l, i) => (
              <ItemLinha key={i} icone={Bell} corIcone={C.champagne} titulo={l.nome} subtitulo={`${l.tipo} · ${l.quando}`} />
            ))}
          </div>
        )}

        <TituloSecao>Configurações</TituloSecao>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ItemLinha icone={User} corIcone={C.malva} titulo="Editar perfil" onClick={() => setEditando(true)} direita={<ChevronRight size={16} color={C.textoSuave} />} />
          <ItemLinha icone={Settings} corIcone={C.textoSuave} titulo="Categorias e rotinas" subtitulo="Personalize suas categorias" direita={<ChevronRight size={16} color={C.textoSuave} />} />
        </div>

        {editando && (
          <ModalFormulario titulo="Editar perfil" campos={campos} valores={perfil} corDestaque={C.rosaCha}
            onFechar={() => setEditando(false)} onSalvar={(d) => { editarPerfil(d); setEditando(false); }} />
        )}
      </div>
    </div>
  );
}

function TelaNotificacoes({ onFechar }) {
  const { tarefas, habitos } = useApp();
  const itens = [
    ...tarefas.filter((t) => t.lembrete && !tarefaConcluidaEm(t, HOJE_ISO)).map((t) => ({ nome: t.titulo, quando: `Hoje às ${t.hora || "—"}`, tipo: "Tarefa" })),
    ...habitos.filter((h) => h.lembrete && !h.historico[HOJE_ISO]).map((h) => ({ nome: h.nome, quando: h.frequencia, tipo: "Hábito" })),
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(91,75,87,0.35)", zIndex: 60, display: "flex", justifyContent: "center", alignItems: "flex-end" }} onClick={onFechar}>
      <div style={{ width: "100%", maxWidth: 384, background: "#fff", borderRadius: "28px 28px 0 0", padding: 22, maxHeight: "75vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.texto, margin: 0 }}>Notificações</h3>
          <button onClick={onFechar} style={{ background: "none", border: "none" }}><X size={20} color={C.textoSuave} /></button>
        </div>
        {itens.length === 0 ? <EstadoVazio texto="Você está em dia com tudo! 🎉" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {itens.map((it, i) => <ItemLinha key={i} icone={Bell} corIcone={C.champagne} titulo={it.nome} subtitulo={`${it.tipo} · ${it.quando}`} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PROVIDER (estado global + ações)
   Agora com persistência automática no dispositivo (localStorage)
========================================================= */
function AppProvider({ children }) {
  const [estado, setEstado] = useState(() => carregarEstadoSalvo() || dadosIniciais());

  // Sempre que o estado mudar, salva automaticamente no dispositivo
  useEffect(() => {
    salvarEstado(estado);
  }, [estado]);

  const acoes = {
    editarPerfil: (novo) => setEstado((e) => ({ ...e, perfil: { ...e.perfil, ...novo } })),
    setHumorHoje: (v) => setEstado((e) => ({ ...e, humorHoje: v })),

    adicionarTarefa: (t) => setEstado((e) => ({ ...e, tarefas: [...e.tarefas, { id: uid(), historico: {}, concluida: false, ...t }] })),
    editarTarefa: (id, novo) => setEstado((e) => ({ ...e, tarefas: e.tarefas.map((t) => (t.id === id ? { ...t, ...novo } : t)) })),
    removerTarefa: (id) => setEstado((e) => ({ ...e, tarefas: e.tarefas.filter((t) => t.id !== id) })),
    alternarTarefa: (id, iso) => setEstado((e) => ({
      ...e, tarefas: e.tarefas.map((t) => {
        if (t.id !== id) return t;
        if (t.recorrente) return { ...t, historico: { ...t.historico, [iso]: !t.historico[iso] } };
        return { ...t, concluida: !t.concluida };
      }),
    })),

    adicionarHabito: (h) => setEstado((e) => ({ ...e, habitos: [...e.habitos, { id: uid(), historico: {}, ...h }] })),
    editarHabito: (id, novo) => setEstado((e) => ({ ...e, habitos: e.habitos.map((h) => (h.id === id ? { ...h, ...novo } : h)) })),
    removerHabito: (id) => setEstado((e) => ({ ...e, habitos: e.habitos.filter((h) => h.id !== id) })),
    alternarHabito: (id, iso) => setEstado((e) => ({ ...e, habitos: e.habitos.map((h) => (h.id === id ? { ...h, historico: { ...h.historico, [iso]: !h.historico[iso] } } : h)) })),

    adicionarAutocuidado: (a) => setEstado((e) => ({ ...e, autocuidado: [...e.autocuidado, { id: uid(), feitoHoje: false, ...a }] })),
    alternarAutocuidado: (id) => setEstado((e) => ({ ...e, autocuidado: e.autocuidado.map((a) => (a.id === id ? { ...a, feitoHoje: !a.feitoHoje } : a)) })),
    removerAutocuidado: (id) => setEstado((e) => ({ ...e, autocuidado: e.autocuidado.filter((a) => a.id !== id) })),

    adicionarDiario: (d) => setEstado((e) => ({ ...e, diario: [...e.diario, { id: uid(), ...d }] })),
    removerDiario: (id) => setEstado((e) => ({ ...e, diario: e.diario.filter((d) => d.id !== id) })),

    adicionarDesejo: (d) => setEstado((e) => ({ ...e, desejos: [...e.desejos, { id: uid(), ...d }] })),
    removerDesejo: (id) => setEstado((e) => ({ ...e, desejos: e.desejos.filter((d) => d.id !== id) })),

    adicionarProjeto: (p) => setEstado((e) => ({ ...e, projetos: [...e.projetos, { id: uid(), ...p }] })),
    editarProjeto: (id, novo) => setEstado((e) => ({ ...e, projetos: e.projetos.map((p) => (p.id === id ? { ...p, ...novo } : p)) })),
    removerProjeto: (id) => setEstado((e) => ({ ...e, projetos: e.projetos.filter((p) => p.id !== id) })),

    adicionarMeta: (m) => setEstado((e) => ({ ...e, metas: [...e.metas, { id: uid(), ...m }] })),
    editarMeta: (id, novo) => setEstado((e) => ({ ...e, metas: e.metas.map((m) => (m.id === id ? { ...m, ...novo } : m)) })),
    removerMeta: (id) => setEstado((e) => ({ ...e, metas: e.metas.filter((m) => m.id !== id) })),

    adicionarTransacao: (t) => setEstado((e) => ({ ...e, transacoes: [...e.transacoes, { id: uid(), ...t }] })),
    removerTransacao: (id) => setEstado((e) => ({ ...e, transacoes: e.transacoes.filter((t) => t.id !== id) })),
    setOrcamentoMensal: (v) => setEstado((e) => ({ ...e, orcamentoMensal: v })),

    adicionarMetaFinanceira: (m) => setEstado((e) => ({ ...e, metasFinanceiras: [...e.metasFinanceiras, { id: uid(), ...m }] })),
    contribuirMetaFinanceira: (id, valor) => setEstado((e) => ({ ...e, metasFinanceiras: e.metasFinanceiras.map((m) => (m.id === id ? { ...m, valorAtual: m.valorAtual + valor } : m)) })),
    removerMetaFinanceira: (id) => setEstado((e) => ({ ...e, metasFinanceiras: e.metasFinanceiras.filter((m) => m.id !== id) })),
  };

  return <AppCtx.Provider value={{ ...estado, ...acoes }}>{children}</AppCtx.Provider>;
}

/* =========================================================
   APP PRINCIPAL
========================================================= */
function Conteudo() {
  const { perfil, editarPerfil, tarefas, habitos } = useApp();
  const [aba, setAba] = useState("inicio");
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [mostrarNotif, setMostrarNotif] = useState(false);

  if (!perfil) {
    return <Onboarding onConcluir={(dados) => editarPerfil(dados)} />;
  }

  const qtdNotif = tarefas.filter((t) => t.lembrete && !tarefaConcluidaEm(t, HOJE_ISO)).length +
    habitos.filter((h) => h.lembrete && !h.historico[HOJE_ISO]).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Poppins','Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 384, margin: "0 auto", position: "relative" }}>
        {aba === "inicio" && (
          <TelaInicio
            irPara={setAba}
            onAbrirNotificacoes={() => setMostrarNotif(true)}
            onAbrirPerfil={() => setMostrarPerfil(true)}
            qtdNotificacoes={qtdNotif}
          />
        )}
        {aba === "dia" && <TelaMeuDia onAbrirNotificacoes={() => setMostrarNotif(true)} onAbrirPerfil={() => setMostrarPerfil(true)} qtdNotificacoes={qtdNotif} />}
        {aba === "vida" && <TelaVida onAbrirNotificacoes={() => setMostrarNotif(true)} onAbrirPerfil={() => setMostrarPerfil(true)} qtdNotificacoes={qtdNotif} />}
        {aba === "dinheiro" && <TelaDinheiro onAbrirNotificacoes={() => setMostrarNotif(true)} onAbrirPerfil={() => setMostrarPerfil(true)} qtdNotificacoes={qtdNotif} />}
        {aba === "escala" && <TelaEscala onAbrirNotificacoes={() => setMostrarNotif(true)} onAbrirPerfil={() => setMostrarPerfil(true)} qtdNotificacoes={qtdNotif} />}

        <NavegacaoInferior ativa={aba} onMudar={setAba} />
        {mostrarPerfil && <TelaPerfil onFechar={() => setMostrarPerfil(false)} />}
        {mostrarNotif && <TelaNotificacoes onFechar={() => setMostrarNotif(false)} />}
      </div>
    </div>
  );
}

function MeuPlanner() {
  return (
    <AppProvider>
      <Conteudo />
    </AppProvider>
  );
}

/* =========================================================
   MONTAGEM DO APP (sem necessidade de bundler)
========================================================= */
const elementoRaiz = document.getElementById("root");
const raiz = createRoot(elementoRaiz);
raiz.render(<MeuPlanner />);
