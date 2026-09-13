import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import {
  Home,
  CalendarDays,
  Heart,
  Wallet,
  TrendingUp,
  Plus,
  Check,
  Trash2,
  Pencil,
  Clock,
  Repeat,
  Bell,
  User,
  Settings,
  Smile,
  Moon,
  Sparkles,
  BookOpen,
  Target,
  Gift,
  FolderKanban,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  ChevronRight,
  ChevronLeft,
  X,
  Flame,
  Star,
  ListChecks,
  Sun,
  Sunset,
  MoonStar
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
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
  vermelho: "#E3A0A0"
};
const estiloInput = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 14,
  border: `1px solid ${C.rosaClaro}`,
  fontSize: 14,
  color: C.texto,
  outline: "none",
  background: "#FFFBFC",
  boxSizing: "border-box"
};
const CHAVE_ARMAZENAMENTO = "meuPlannerDados_v1";
function carregarEstadoSalvo() {
  try {
    const bruto = window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    if (!dados || typeof dados !== "object") return null;
    return dados;
  } catch (erro) {
    console.warn("N\xE3o foi poss\xEDvel carregar os dados salvos no dispositivo:", erro);
    return null;
  }
}
function salvarEstado(estado) {
  try {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(estado));
  } catch (erro) {
    console.warn("N\xE3o foi poss\xEDvel salvar os dados no dispositivo:", erro);
  }
}
let contador = 0;
const uid = () => `id-${Date.now()}-${contador++}`;
function isoDeHoje(offset = 0) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
const HOJE_ISO = isoDeHoje(0);
function formatarDataLonga(iso) {
  const d = /* @__PURE__ */ new Date(iso + "T12:00:00");
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function diaCurto(iso) {
  const d = /* @__PURE__ */ new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}
function numeroDia(iso) {
  return (/* @__PURE__ */ new Date(iso + "T12:00:00")).getDate();
}
function indiceSemana(iso) {
  const d = (/* @__PURE__ */ new Date(iso + "T12:00:00")).getDay();
  return (d + 6) % 7;
}
function formatBRL(v) {
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function diasEntre(isoAlvo) {
  const hoje = /* @__PURE__ */ new Date(HOJE_ISO + "T00:00:00");
  const alvo = /* @__PURE__ */ new Date(isoAlvo + "T00:00:00");
  return Math.round((alvo - hoje) / 864e5);
}
const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "S\xE1b", "Dom"];
const NOMES_DIA_SEMANA = ["Domingo", "Segunda", "Ter\xE7a", "Quarta", "Quinta", "Sexta", "S\xE1bado"];
const NOMES_MES = ["Janeiro", "Fevereiro", "Mar\xE7o", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function nomeDiaSemana(iso) {
  return NOMES_DIA_SEMANA[(/* @__PURE__ */ new Date(iso + "T12:00:00")).getDay()];
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function isoDeAnoMesDia(ano, mesIndex, dia) {
  return `${ano}-${pad2(mesIndex + 1)}-${pad2(dia)}`;
}
const FRASES = [
  "Cuidar de voc\xEA tamb\xE9m \xE9 produtividade.",
  "Pequenos passos, todos os dias, mudam tudo.",
  "Organizar sua rotina \xE9 um ato de amor-pr\xF3prio.",
  "Voc\xEA n\xE3o precisa ser perfeita, s\xF3 constante.",
  "Hoje \xE9 um bom dia para recome\xE7ar com leveza.",
  "Progresso \xE9 progresso, mesmo devagar.",
  "Respire. Voc\xEA est\xE1 indo bem."
];
const AVATARES = ["\u{1F338}", "\u{1F337}", "\u{1F98B}", "\u2728", "\u{1F319}", "\u{1F351}", "\u{1FAB7}"];
const CATEGORIAS_TAREFA = ["Trabalho", "Pessoal", "Casa", "Sa\xFAde", "Estudos", "Outros"];
const PRIORIDADES = ["Alta", "M\xE9dia", "Baixa"];
const CORES_PRIORIDADE = { Alta: C.vermelho, M\u00E9dia: C.champagne, Baixa: C.verde };
const CATEGORIAS_META = ["Pessoal", "Carreira", "Sa\xFAde", "Financeiro", "Outros"];
const CATEGORIAS_RECEITA = ["Sal\xE1rio", "Freelance", "Presente", "Outros"];
const CATEGORIAS_DESPESA = ["Alimenta\xE7\xE3o", "Transporte", "Moradia", "Lazer", "Sa\xFAde", "Compras", "Assinaturas", "Outros"];
const CONTAS = ["Carteira", "Conta Corrente", "Poupan\xE7a", "Cart\xE3o de Cr\xE9dito"];
const HUMORES = [
  { valor: "otima", emoji: "\u{1F60A}", rotulo: "\xD3tima" },
  { valor: "bem", emoji: "\u{1F60C}", rotulo: "Bem" },
  { valor: "neutra", emoji: "\u{1F610}", rotulo: "Neutra" },
  { valor: "cansada", emoji: "\u{1F614}", rotulo: "Cansada" },
  { valor: "dificil", emoji: "\u{1F62B}", rotulo: "Dif\xEDcil" }
];
const TIPOS_ESCALA = {
  plantao: { rotulo: "Plant\xE3o Noturno", icone: Moon, corIcone: "#E8B84B", bg: "#E4E7FA" },
  nao_trabalho: { rotulo: "N\xE3o trabalho", icone: X, corIcone: "#E3695E", bg: "#E4E7FA" },
  folga: { rotulo: "Folga", icone: Sun, corIcone: "#6FAE72", bg: "#DDEEDC" },
  ferias: { rotulo: "F\xE9rias", icone: Sparkles, corIcone: "#CBA76B", bg: "#FBE7CE" },
  troca: { rotulo: "Troca de plant\xE3o", icone: Repeat, corIcone: "#6E93B8", bg: "#DCEAF3" }
};
function proximaOcorrenciaEscala(dias, tipo, apartirIso) {
  const datas = Object.keys(dias).filter((d) => dias[d] === tipo && d > apartirIso).sort();
  return datas[0] || null;
}
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
function dadosIniciais() {
  return {
    perfil: null,
    // dispara onboarding se null
    humorHoje: null,
    tarefas: [
      { id: uid(), titulo: "Reuni\xE3o com equipe", categoria: "Trabalho", prioridade: "Alta", hora: "09:00", data: HOJE_ISO, recorrente: false, concluida: false, lembrete: true, historico: {} },
      { id: uid(), titulo: "Beber 2L de \xE1gua", categoria: "Sa\xFAde", prioridade: "M\xE9dia", hora: "08:00", data: HOJE_ISO, recorrente: true, frequencia: "diaria", diasSemana: [], concluida: false, lembrete: false, historico: {} },
      { id: uid(), titulo: "Pagar conta de luz", categoria: "Casa", prioridade: "Alta", hora: "18:00", data: HOJE_ISO, recorrente: false, concluida: false, lembrete: true, historico: {} },
      { id: uid(), titulo: "Ler 10 p\xE1ginas", categoria: "Estudos", prioridade: "Baixa", hora: "20:00", data: HOJE_ISO, recorrente: false, concluida: true, lembrete: false, historico: {} }
    ],
    habitos: [
      { id: uid(), nome: "Beber \xE1gua", frequencia: "Di\xE1rio", lembrete: true, historico: { [isoDeHoje(-2)]: true, [isoDeHoje(-1)]: true } },
      { id: uid(), nome: "Alongar-se", frequencia: "Di\xE1rio", lembrete: false, historico: { [isoDeHoje(-1)]: true } },
      { id: uid(), nome: "Ler antes de dormir", frequencia: "Semanal", lembrete: false, historico: {} }
    ],
    autocuidado: [
      { id: uid(), nome: "Skincare da noite", feitoHoje: false },
      { id: uid(), nome: "10 min de respira\xE7\xE3o", feitoHoje: false },
      { id: uid(), nome: "Momento sem telas", feitoHoje: false }
    ],
    diario: [
      { id: uid(), data: isoDeHoje(-1), texto: "Dia corrido, mas consegui organizar minha semana.", humor: "bem" }
    ],
    desejos: [
      { id: uid(), titulo: "Fim de semana na praia", categoria: "Viagem", preco: 800 }
    ],
    projetos: [
      { id: uid(), titulo: "Projeto Bem-Estar", etapasTotal: 15, etapasConcluidas: 4 }
    ],
    metas: [
      { id: uid(), titulo: "Organizar o guarda-roupa", categoria: "Pessoal", prazo: isoDeHoje(10), progresso: 40 },
      { id: uid(), titulo: "Concluir curso online", categoria: "Carreira", prazo: isoDeHoje(20), progresso: 65 }
    ],
    transacoes: [
      { id: uid(), tipo: "Receita", descricao: "Sal\xE1rio", categoria: "Sal\xE1rio", conta: "Conta Corrente", valor: 3200, data: isoDeHoje(-5) },
      { id: uid(), tipo: "Despesa", descricao: "Supermercado", categoria: "Alimenta\xE7\xE3o", conta: "Cart\xE3o de Cr\xE9dito", valor: 420, data: isoDeHoje(-3) },
      { id: uid(), tipo: "Despesa", descricao: "Uber", categoria: "Transporte", conta: "Carteira", valor: 38, data: isoDeHoje(-1) },
      { id: uid(), tipo: "Despesa", descricao: "Assinatura streaming", categoria: "Assinaturas", conta: "Cart\xE3o de Cr\xE9dito", valor: 45, data: isoDeHoje(-2) }
    ],
    orcamentoMensal: 2200,
    metasFinanceiras: [
      { id: uid(), titulo: "Reserva de emerg\xEAncia", valorAlvo: 5e3, valorAtual: 1800, prazo: isoDeHoje(120) }
    ],
    historicoDemo: [
      { dia: "5 dias atr\xE1s", pct: 62 },
      { dia: "4 dias atr\xE1s", pct: 70 },
      { dia: "3 dias atr\xE1s", pct: 55 },
      { dia: "2 dias atr\xE1s", pct: 80 },
      { dia: "Ontem", pct: 75 }
    ],
    escala: {
      horasPorPlantao: 12,
      dias: {
        [isoDeHoje(-2)]: "plantao",
        [isoDeHoje(-1)]: "nao_trabalho",
        [isoDeHoje(0)]: "plantao",
        [isoDeHoje(1)]: "nao_trabalho",
        [isoDeHoje(2)]: "plantao",
        [isoDeHoje(3)]: "nao_trabalho",
        [isoDeHoje(4)]: "plantao",
        [isoDeHoje(5)]: "nao_trabalho",
        [isoDeHoje(6)]: "plantao",
        [isoDeHoje(7)]: "folga",
        [isoDeHoje(8)]: "folga",
        [isoDeHoje(9)]: "folga",
        [isoDeHoje(10)]: "plantao",
        [isoDeHoje(11)]: "nao_trabalho",
        [isoDeHoje(12)]: "plantao",
        [isoDeHoje(13)]: "nao_trabalho",
        [isoDeHoje(14)]: "plantao",
        [isoDeHoje(15)]: "nao_trabalho",
        [isoDeHoje(16)]: "plantao",
        [isoDeHoje(17)]: "nao_trabalho"
      }
    }
  };
}
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);
function Cartao({ children, style, onClick }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick,
      style: { background: C.card, borderRadius: 20, boxShadow: "0 2px 12px rgba(203,180,224,0.14)", ...style }
    },
    children
  );
}
function Pill({ children, cor, ativo = true }) {
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      style: {
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 999,
        background: ativo ? cor + "22" : C.rosaClaro,
        color: ativo ? cor : C.textoSuave
      }
    },
    children
  );
}
function BotaoFlutuante({ onClick }) {
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      style: {
        position: "fixed",
        bottom: 84,
        right: "50%",
        transform: "translateX(160px)",
        width: 52,
        height: 52,
        borderRadius: 26,
        border: "none",
        background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})`,
        boxShadow: "0 6px 16px rgba(203,180,224,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40
      }
    },
    /* @__PURE__ */ React.createElement(Plus, { size: 24, color: "#fff" })
  );
}
function ProgressoBarra({ pct, cor = C.champagne, alto = 8 }) {
  return /* @__PURE__ */ React.createElement("div", { style: { width: "100%", height: alto, borderRadius: 999, background: C.rosaClaro } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", borderRadius: 999, background: cor, transition: "width .3s" } }));
}
function ProgressoCirculo({ pct, size = 60, stroke = 7, cor = C.champagne }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size }, /* @__PURE__ */ React.createElement("circle", { cx: size / 2, cy: size / 2, r, stroke: C.rosaClaro, strokeWidth: stroke, fill: "none" }), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: size / 2,
      cy: size / 2,
      r,
      stroke: cor,
      strokeWidth: stroke,
      fill: "none",
      strokeDasharray: c,
      strokeDashoffset: c - Math.min(100, pct) / 100 * c,
      strokeLinecap: "round",
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
      style: { transition: "stroke-dashoffset .4s" }
    }
  ), /* @__PURE__ */ React.createElement("text", { x: "50%", y: "53%", textAnchor: "middle", fontSize: size * 0.24, fontWeight: "600", fill: C.texto }, Math.round(pct), "%"));
}
function ItemLinha({ icone: Icone, corIcone = C.malva, titulo, subtitulo, direita, onClick, riscado }) {
  return /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 14, display: "flex", alignItems: "center", gap: 12 }, onClick }, Icone && /* @__PURE__ */ React.createElement("div", { style: { width: 38, height: 38, borderRadius: 19, background: corIcone + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement(Icone, { size: 17, color: corIcone })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, fontWeight: 500, color: C.texto, margin: 0, textDecoration: riscado ? "line-through" : "none", opacity: riscado ? 0.5 : 1 } }, titulo), subtitulo && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "2px 0 0" } }, subtitulo)), direita);
}
function BotaoIcone({ icone: Icone, onClick, cor = C.textoSuave }) {
  return /* @__PURE__ */ React.createElement("button", { onClick, style: { background: "none", border: "none", padding: 6, cursor: "pointer", display: "flex" } }, /* @__PURE__ */ React.createElement(Icone, { size: 16, color: cor }));
}
function TituloSecao({ children, acao }) {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 4px 10px" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 14, fontWeight: 600, color: C.texto, margin: 0 } }, children), acao);
}
function EstadoVazio({ texto }) {
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "26px 10px", textAlign: "center", color: C.textoSuave, fontSize: 13 } }, texto);
}
function ModalFormulario({ titulo, campos, valores, onFechar, onSalvar, onExcluir, corDestaque = C.texto }) {
  const [dados, setDados] = useState(valores);
  const set = (chave, val) => setDados((d) => ({ ...d, [chave]: val }));
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(91,75,87,0.35)" }, onClick: onFechar }, /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 384, background: "#fff", borderRadius: "28px 28px 0 0", padding: 22, maxHeight: "85vh", overflowY: "auto" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 16, fontWeight: 600, color: C.texto, margin: 0 } }, titulo), /* @__PURE__ */ React.createElement("button", { onClick: onFechar, style: { background: "none", border: "none" } }, /* @__PURE__ */ React.createElement(X, { size: 20, color: C.textoSuave }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, campos.map((c) => /* @__PURE__ */ React.createElement("div", { key: c.chave }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, fontWeight: 500, color: C.textoSuave, display: "block", marginBottom: 6 } }, c.rotulo), c.tipo === "texto" && /* @__PURE__ */ React.createElement("input", { style: estiloInput, value: dados[c.chave] || "", onChange: (e) => set(c.chave, e.target.value), placeholder: c.placeholder }), c.tipo === "textarea" && /* @__PURE__ */ React.createElement("textarea", { style: { ...estiloInput, resize: "none" }, rows: 4, value: dados[c.chave] || "", onChange: (e) => set(c.chave, e.target.value), placeholder: c.placeholder }), c.tipo === "numero" && /* @__PURE__ */ React.createElement("input", { type: "number", style: estiloInput, value: dados[c.chave] ?? "", onChange: (e) => set(c.chave, e.target.value === "" ? "" : Number(e.target.value)), placeholder: c.placeholder }), c.tipo === "data" && /* @__PURE__ */ React.createElement("input", { type: "date", style: estiloInput, value: dados[c.chave] || "", onChange: (e) => set(c.chave, e.target.value) }), c.tipo === "hora" && /* @__PURE__ */ React.createElement("input", { type: "time", style: estiloInput, value: dados[c.chave] || "", onChange: (e) => set(c.chave, e.target.value) }), c.tipo === "select" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, c.opcoes.map((op) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: op.valor,
      onClick: () => set(c.chave, op.valor),
      style: {
        padding: "7px 13px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        border: "none",
        background: dados[c.chave] === op.valor ? corDestaque : C.rosaClaro,
        color: dados[c.chave] === op.valor ? "#fff" : C.texto
      }
    },
    op.rotulo
  ))), c.tipo === "multiselect" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, c.opcoes.map((op) => {
    const lista = dados[c.chave] || [];
    const ativo = lista.includes(op.valor);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: op.valor,
        onClick: () => set(c.chave, ativo ? lista.filter((v) => v !== op.valor) : [...lista, op.valor]),
        style: {
          padding: "7px 13px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
          border: "none",
          background: ativo ? corDestaque : C.rosaClaro,
          color: ativo ? "#fff" : C.texto
        }
      },
      op.rotulo
    );
  })), c.tipo === "toggle" && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => set(c.chave, !dados[c.chave]),
      style: {
        padding: "7px 14px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        border: "none",
        background: dados[c.chave] ? corDestaque : C.rosaClaro,
        color: dados[c.chave] ? "#fff" : C.texto
      }
    },
    dados[c.chave] ? "Sim" : "N\xE3o"
  )))), /* @__PURE__ */ React.createElement("button", { onClick: () => onSalvar(dados), style: { width: "100%", marginTop: 20, padding: "13px 0", borderRadius: 999, border: "none", fontSize: 14, fontWeight: 600, color: "#fff", background: corDestaque } }, "Salvar"), onExcluir && /* @__PURE__ */ React.createElement("button", { onClick: onExcluir, style: { width: "100%", marginTop: 10, padding: "11px 0", borderRadius: 999, border: "none", fontSize: 13, fontWeight: 500, color: C.vermelho, background: "transparent" } }, "Excluir")));
}
function Onboarding({ onConcluir }) {
  const [nome, setNome] = useState("");
  const [avatar, setAvatar] = useState(AVATARES[0]);
  const [horario, setHorario] = useState("07:00");
  const [objetivo, setObjetivo] = useState("");
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: `linear-gradient(160deg, ${C.rosaClaro}, ${C.lilas}55)`, display: "flex", justifyContent: "center", fontFamily: "'Poppins','Segoe UI',sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 384, padding: "48px 24px" } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C.textoSuave, marginBottom: 4 } }, "Bem-vinda ao"), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 28, fontWeight: 700, color: C.texto, margin: "0 0 26px" } }, "Meu Planner"), /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 20 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, color: C.textoSuave, fontWeight: 500 } }, "Como podemos te chamar?"), /* @__PURE__ */ React.createElement("input", { style: { ...estiloInput, marginTop: 6, marginBottom: 16 }, value: nome, onChange: (e) => setNome(e.target.value), placeholder: "Seu nome" }), /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, color: C.textoSuave, fontWeight: 500 } }, "Escolha um avatar"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, margin: "8px 0 16px" } }, AVATARES.map((a) => /* @__PURE__ */ React.createElement("button", { key: a, onClick: () => setAvatar(a), style: { width: 40, height: 40, borderRadius: 20, fontSize: 18, border: "none", background: avatar === a ? C.champagne : C.rosaClaro } }, a))), /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, color: C.textoSuave, fontWeight: 500 } }, "Hor\xE1rio de in\xEDcio do dia"), /* @__PURE__ */ React.createElement("input", { type: "time", style: { ...estiloInput, marginTop: 6, marginBottom: 16 }, value: horario, onChange: (e) => setHorario(e.target.value) }), /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, color: C.textoSuave, fontWeight: 500 } }, "Seu principal objetivo agora"), /* @__PURE__ */ React.createElement("input", { style: { ...estiloInput, marginTop: 6 }, value: objetivo, onChange: (e) => setObjetivo(e.target.value), placeholder: "Ex: mais equil\xEDbrio na rotina" })), /* @__PURE__ */ React.createElement(
    "button",
    {
      disabled: !nome,
      onClick: () => onConcluir({ nome, avatar, horarioInicio: horario, objetivos: objetivo }),
      style: {
        width: "100%",
        marginTop: 24,
        padding: "14px 0",
        borderRadius: 999,
        border: "none",
        fontWeight: 600,
        color: "#fff",
        fontSize: 14,
        background: nome ? `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})` : C.rosaClaro,
        opacity: nome ? 1 : 0.7
      }
    },
    "Come\xE7ar a organizar minha vida"
  )));
}
function NavegacaoInferior({ ativa, onMudar }) {
  const itens = [
    { id: "inicio", label: "In\xEDcio", icone: Home },
    { id: "dia", label: "Meu Dia", icone: CalendarDays },
    { id: "vida", label: "Vida", icone: Heart },
    { id: "dinheiro", label: "Dinheiro", icone: Wallet },
    { id: "escala", label: "Escala", icone: TrendingUp }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 384, background: "#fff", borderTop: `1px solid ${C.rosaClaro}`, display: "flex", padding: "8px 4px calc(8px + env(safe-area-inset-bottom))", zIndex: 30 } }, itens.map((it) => {
    const Icone = it.icone;
    const ativo = ativa === it.id;
    return /* @__PURE__ */ React.createElement("button", { key: it.id, onClick: () => onMudar(it.id), style: { flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0" } }, /* @__PURE__ */ React.createElement(Icone, { size: 19, color: ativo ? C.champagne : C.textoSuave }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: ativo ? 600 : 400, color: ativo ? C.champagne : C.textoSuave } }, it.label));
  }));
}
function Cabecalho({ titulo, subtitulo, onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const { perfil } = useApp();
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "22px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 20, fontWeight: 700, color: C.texto, margin: 0 } }, titulo), subtitulo && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "2px 0 0" } }, subtitulo)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { onClick: onAbrirNotificacoes, style: { position: "relative", background: C.rosaClaro, border: "none", width: 36, height: 36, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Bell, { size: 16, color: C.texto }), qtdNotificacoes > 0 && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", top: -2, right: -2, width: 15, height: 15, borderRadius: 8, background: C.vermelho, color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" } }, qtdNotificacoes)), /* @__PURE__ */ React.createElement("button", { onClick: onAbrirPerfil, style: { background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})`, border: "none", width: 36, height: 36, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 } }, perfil?.avatar || "\u{1F338}")));
}
function useSugestoes() {
  const { tarefas, habitos, metas, transacoes, orcamentoMensal } = useApp();
  return useMemo(() => {
    const lista = [];
    const tarefasHoje = tarefas.filter((t) => tarefaOcorreEm(t, HOJE_ISO));
    const pendentes = tarefasHoje.filter((t) => !tarefaConcluidaEm(t, HOJE_ISO));
    if (pendentes.length > 0) lista.push({ icone: ListChecks, texto: `Voc\xEA tem ${pendentes.length} tarefa(s) pendente(s) hoje.` });
    const altaPendente = pendentes.find((t) => t.prioridade === "Alta");
    if (altaPendente) lista.push({ icone: Flame, texto: `Prioridade alta: "${altaPendente.titulo}" ainda n\xE3o foi feita.` });
    const habitosNaoFeitos = habitos.filter((h) => !h.historico[HOJE_ISO]);
    if (habitosNaoFeitos.length > 0) lista.push({ icone: Repeat, texto: `H\xE1bito pendente hoje: ${habitosNaoFeitos[0].nome}.` });
    const metaProxima = metas.find((m) => m.progresso < 100 && diasEntre(m.prazo) <= 7 && diasEntre(m.prazo) >= 0);
    if (metaProxima) lista.push({ icone: Target, texto: `Meta "${metaProxima.titulo}" vence em ${diasEntre(metaProxima.prazo)} dia(s).` });
    const mesAtual = HOJE_ISO.slice(0, 7);
    const gastoMes = transacoes.filter((t) => t.tipo === "Despesa" && t.data.startsWith(mesAtual)).reduce((s, t) => s + t.valor, 0);
    if (orcamentoMensal && gastoMes > orcamentoMensal) lista.push({ icone: Wallet, texto: "Seus gastos do m\xEAs j\xE1 passaram do or\xE7amento definido." });
    if (lista.length === 0) lista.push({ icone: Sparkles, texto: "Tudo em ordem por aqui \u2014 aproveite o seu dia!" });
    return lista.slice(0, 4);
  }, [tarefas, habitos, metas, transacoes, orcamentoMensal]);
}
function TelaInicio({ irPara, onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const { perfil, tarefas, habitos, metas, transacoes, humorHoje, setHumorHoje, alternarTarefa, alternarHabito } = useApp();
  const sugestoes = useSugestoes();
  const hora = (/* @__PURE__ */ new Date()).getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const IconeHora = hora < 12 ? Sun : hora < 18 ? Sunset : MoonStar;
  const frase = FRASES[(/* @__PURE__ */ new Date()).getDate() % FRASES.length];
  const tarefasHoje = tarefas.filter((t) => tarefaOcorreEm(t, HOJE_ISO));
  const concluidasHoje = tarefasHoje.filter((t) => tarefaConcluidaEm(t, HOJE_ISO));
  const habitosHoje = habitos;
  const habitosFeitos = habitos.filter((h) => h.historico[HOJE_ISO]);
  const totalItens = tarefasHoje.length + habitosHoje.length;
  const totalFeitos = concluidasHoje.length + habitosFeitos.length;
  const pctDia = totalItens ? totalFeitos / totalItens * 100 : 0;
  const proximosCompromissos = tarefasHoje.filter((t) => !tarefaConcluidaEm(t, HOJE_ISO)).sort((a, b) => (a.hora || "").localeCompare(b.hora || "")).slice(0, 3);
  const mesAtual = HOJE_ISO.slice(0, 7);
  const entradasMes = transacoes.filter((t) => t.tipo === "Receita" && t.data.startsWith(mesAtual)).reduce((s, t) => s + t.valor, 0);
  const saidasMes = transacoes.filter((t) => t.tipo === "Despesa" && t.data.startsWith(mesAtual)).reduce((s, t) => s + t.valor, 0);
  const saldoGeral = transacoes.reduce((s, t) => s + (t.tipo === "Receita" ? t.valor : -t.valor), 0);
  const metasEmAndamento = metas.filter((m) => m.progresso < 100).slice(0, 2);
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 18px 90px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(IconeHora, { size: 18, color: C.champagne }), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 19, fontWeight: 700, color: C.texto, margin: 0 } }, saudacao, ", ", perfil?.nome)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { onClick: onAbrirNotificacoes, style: { position: "relative", background: C.rosaClaro, border: "none", width: 34, height: 34, borderRadius: 17, display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Bell, { size: 15, color: C.texto }), qtdNotificacoes > 0 && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", top: -2, right: -2, width: 14, height: 14, borderRadius: 7, background: C.vermelho, color: "#fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center" } }, qtdNotificacoes)), /* @__PURE__ */ React.createElement("button", { onClick: onAbrirPerfil, style: { background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})`, border: "none", width: 34, height: 34, borderRadius: 17, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 } }, perfil?.avatar || "\u{1F338}"))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "4px 0 2px" } }, formatarDataLonga(HOJE_ISO)), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C.texto, fontStyle: "italic", margin: "6px 0 0" } }, '"', frase, '"'), /* @__PURE__ */ React.createElement(Cartao, { style: { marginTop: 16, padding: 18, display: "flex", alignItems: "center", gap: 16 } }, /* @__PURE__ */ React.createElement(ProgressoCirculo, { pct: pctDia }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, fontWeight: 600, color: C.texto, margin: 0 } }, "Progresso de hoje"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "2px 0 8px" } }, totalFeitos, " de ", totalItens, " conclu\xEDdos"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, HUMORES.map((h) => /* @__PURE__ */ React.createElement("button", { key: h.valor, onClick: () => setHumorHoje(h.valor), style: { fontSize: 16, background: humorHoje === h.valor ? C.rosaClaro : "transparent", border: "none", borderRadius: 10, padding: 3 } }, h.emoji))))), /* @__PURE__ */ React.createElement("button", { onClick: () => irPara("dia"), style: { width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 999, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})` } }, "Organizar meu dia"), /* @__PURE__ */ React.createElement(TituloSecao, null, "Pr\xF3ximos compromissos"), proximosCompromissos.length === 0 ? /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhum compromisso pendente hoje \u{1F389}" }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, proximosCompromissos.map((t) => /* @__PURE__ */ React.createElement(
    ItemLinha,
    {
      key: t.id,
      icone: Clock,
      corIcone: CORES_PRIORIDADE[t.prioridade],
      titulo: t.titulo,
      subtitulo: `${t.hora || "\u2014"} \xB7 ${t.categoria}`,
      direita: /* @__PURE__ */ React.createElement("button", { onClick: () => alternarTarefa(t.id, HOJE_ISO), style: { width: 26, height: 26, borderRadius: 13, border: `2px solid ${C.rosaClaro}`, background: "none" } })
    }
  ))), /* @__PURE__ */ React.createElement(TituloSecao, null, "H\xE1bitos de hoje"), habitos.length === 0 ? /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhum h\xE1bito cadastrado ainda." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, habitos.map((h) => {
    const feito = !!h.historico[HOJE_ISO];
    return /* @__PURE__ */ React.createElement(
      ItemLinha,
      {
        key: h.id,
        icone: Repeat,
        corIcone: C.lilas,
        titulo: h.nome,
        subtitulo: `${h.frequencia} \xB7 sequ\xEAncia de ${sequenciaHabito(h)} dia(s)`,
        riscado: feito,
        direita: /* @__PURE__ */ React.createElement("button", { onClick: () => alternarHabito(h.id, HOJE_ISO), style: { width: 26, height: 26, borderRadius: 13, border: "none", background: feito ? C.champagne : C.rosaClaro, display: "flex", alignItems: "center", justifyContent: "center" } }, feito && /* @__PURE__ */ React.createElement(Check, { size: 14, color: "#fff" }))
      }
    );
  })), /* @__PURE__ */ React.createElement(TituloSecao, null, "Resumo financeiro"), /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textoSuave } }, "Saldo dispon\xEDvel"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: C.texto } }, formatBRL(saldoGeral))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(ArrowUpCircle, { size: 15, color: C.verde }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textoSuave } }, formatBRL(entradasMes))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement(ArrowDownCircle, { size: 15, color: C.vermelho }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textoSuave } }, formatBRL(saidasMes))))), /* @__PURE__ */ React.createElement(TituloSecao, null, "Metas em andamento"), metasEmAndamento.length === 0 ? /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhuma meta em andamento." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, metasEmAndamento.map((m) => /* @__PURE__ */ React.createElement(Cartao, { key: m.id, style: { padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 500, color: C.texto } }, m.titulo), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textoSuave } }, m.progresso, "%")), /* @__PURE__ */ React.createElement(ProgressoBarra, { pct: m.progresso })))), /* @__PURE__ */ React.createElement(TituloSecao, null, "Sugest\xF5es para voc\xEA"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, sugestoes.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, background: `linear-gradient(135deg, ${C.rosaClaro}, ${C.malva}33)`, borderRadius: 16, padding: 12 } }, /* @__PURE__ */ React.createElement(s.icone, { size: 16, color: C.texto }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, color: C.texto } }, s.texto)))));
}
function sequenciaHabito(h) {
  let seq = 0;
  for (let i = 0; i < 60; i++) {
    if (h.historico[isoDeHoje(-i)]) seq++;
    else break;
  }
  return seq;
}
function TelaMeuDia({ onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const { tarefas, adicionarTarefa, editarTarefa, removerTarefa, alternarTarefa } = useApp();
  const [visao, setVisao] = useState("dia");
  const [dataSel, setDataSel] = useState(HOJE_ISO);
  const [modal, setModal] = useState(null);
  const tarefasDoDia = tarefas.filter((t) => tarefaOcorreEm(t, dataSel)).sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  const concluidasDoDia = tarefasDoDia.filter((t) => tarefaConcluidaEm(t, dataSel));
  const pct = tarefasDoDia.length ? concluidasDoDia.length / tarefasDoDia.length * 100 : 0;
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
    { chave: "titulo", rotulo: "T\xEDtulo da tarefa", tipo: "texto", placeholder: "Ex: Ligar para o dentista" },
    { chave: "categoria", rotulo: "Categoria", tipo: "select", opcoes: CATEGORIAS_TAREFA.map((c) => ({ valor: c, rotulo: c })) },
    { chave: "prioridade", rotulo: "Prioridade", tipo: "select", opcoes: PRIORIDADES.map((c) => ({ valor: c, rotulo: c })) },
    { chave: "hora", rotulo: "Hor\xE1rio", tipo: "hora" },
    { chave: "data", rotulo: "Data", tipo: "data" },
    { chave: "recorrente", rotulo: "Tarefa recorrente", tipo: "toggle" },
    { chave: "frequencia", rotulo: "Repetir", tipo: "select", opcoes: [{ valor: "diaria", rotulo: "Todo dia" }, { valor: "semanal", rotulo: "Dias da semana" }] },
    { chave: "diasSemana", rotulo: "Quais dias", tipo: "multiselect", opcoes: DIAS_SEMANA.map((d, i) => ({ valor: i, rotulo: d })) },
    { chave: "lembrete", rotulo: "Criar lembrete", tipo: "toggle" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 18px 90px" } }, /* @__PURE__ */ React.createElement(Cabecalho, { titulo: "Meu Dia", subtitulo: formatarDataLonga(dataSel), onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }), /* @__PURE__ */ React.createElement("div", { style: { margin: "0 0 14px", display: "flex", gap: 8 } }, ["dia", "semana"].map((v) => /* @__PURE__ */ React.createElement("button", { key: v, onClick: () => setVisao(v), style: { flex: 1, padding: "8px 0", borderRadius: 999, border: "none", fontSize: 12, fontWeight: 600, background: visao === v ? C.texto : C.rosaClaro, color: visao === v ? "#fff" : C.texto } }, v === "dia" ? "Dia" : "Semana"))), visao === "semana" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 6 } }, semana.map((iso) => {
    const dt = tarefas.filter((t) => tarefaOcorreEm(t, iso));
    const dc = dt.filter((t) => tarefaConcluidaEm(t, iso));
    const p = dt.length ? dc.length / dt.length * 100 : 0;
    return /* @__PURE__ */ React.createElement("button", { key: iso, onClick: () => {
      setDataSel(iso);
      setVisao("dia");
    }, style: { minWidth: 60, background: iso === dataSel ? C.rosaCha : C.card, border: "none", borderRadius: 16, padding: "10px 6px", boxShadow: "0 2px 8px rgba(203,180,224,0.12)" } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 10, color: iso === dataSel ? "#fff" : C.textoSuave, margin: 0, textTransform: "capitalize" } }, diaCurto(iso)), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, fontWeight: 700, color: iso === dataSel ? "#fff" : C.texto, margin: "2px 0 6px" } }, numeroDia(iso)), /* @__PURE__ */ React.createElement(ProgressoBarra, { pct: p, cor: iso === dataSel ? "#fff" : C.champagne, alto: 4 }));
  })), /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 14, display: "flex", alignItems: "center", gap: 12, marginBottom: 14 } }, /* @__PURE__ */ React.createElement(ProgressoCirculo, { pct, size: 48, stroke: 5 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, fontWeight: 600, color: C.texto, margin: 0 } }, "Progresso do dia"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "2px 0 0" } }, concluidasDoDia.length, " de ", tarefasDoDia.length, " tarefas"))), tarefasDoDia.length === 0 ? /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhuma tarefa para este dia. Toque em + para adicionar." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, tarefasDoDia.map((t, idx) => {
    const feita = tarefaConcluidaEm(t, dataSel);
    return /* @__PURE__ */ React.createElement(Cartao, { key: t.id, style: { padding: 14, display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => alternarTarefa(t.id, dataSel), style: { width: 24, height: 24, borderRadius: 12, border: `2px solid ${CORES_PRIORIDADE[t.prioridade]}`, background: feita ? CORES_PRIORIDADE[t.prioridade] : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, feita && /* @__PURE__ */ React.createElement(Check, { size: 13, color: "#fff" })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 }, onClick: () => setModal({ editando: t }) }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13.5, fontWeight: 500, color: C.texto, margin: 0, textDecoration: feita ? "line-through" : "none", opacity: feita ? 0.55 : 1 } }, t.titulo), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 4, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textoSuave } }, t.hora || "sem hor\xE1rio"), /* @__PURE__ */ React.createElement(Pill, { cor: CORES_PRIORIDADE[t.prioridade] }, t.prioridade), /* @__PURE__ */ React.createElement(Pill, { cor: C.lilas }, t.categoria), t.recorrente && /* @__PURE__ */ React.createElement(Repeat, { size: 11, color: C.textoSuave }), t.lembrete && /* @__PURE__ */ React.createElement(Bell, { size: 11, color: C.textoSuave }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement(BotaoIcone, { icone: ChevronLeft, onClick: () => mover(idx, -1) }), /* @__PURE__ */ React.createElement(BotaoIcone, { icone: ChevronRight, onClick: () => mover(idx, 1) })), /* @__PURE__ */ React.createElement(BotaoIcone, { icone: Trash2, cor: C.vermelho, onClick: () => removerTarefa(t.id) }));
  })), /* @__PURE__ */ React.createElement(BotaoFlutuante, { onClick: () => setModal({ editando: { data: dataSel, categoria: "Pessoal", prioridade: "M\xE9dia", recorrente: false, frequencia: "diaria", diasSemana: [], lembrete: false } }) }), modal && /* @__PURE__ */ React.createElement(
    ModalFormulario,
    {
      titulo: modal.editando.id ? "Editar tarefa" : "Nova tarefa",
      campos,
      valores: modal.editando,
      corDestaque: C.rosaCha,
      onFechar: () => setModal(null),
      onExcluir: modal.editando.id ? () => {
        removerTarefa(modal.editando.id);
        setModal(null);
      } : void 0,
      onSalvar: (dados) => {
        if (!dados.titulo) return;
        if (modal.editando.id) editarTarefa(modal.editando.id, dados);
        else adicionarTarefa(dados);
        setModal(null);
      }
    }
  ));
}
function TelaVida({ onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const [sub, setSub] = useState("metas");
  const subs = [
    { id: "metas", label: "Metas" },
    { id: "habitos", label: "H\xE1bitos" },
    { id: "autocuidado", label: "Autocuidado" },
    { id: "diario", label: "Di\xE1rio" },
    { id: "desejos", label: "Desejos" },
    { id: "projetos", label: "Projetos" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 18px 90px" } }, /* @__PURE__ */ React.createElement(Cabecalho, { titulo: "Vida", subtitulo: "Sua organiza\xE7\xE3o pessoal", onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 } }, subs.map((s) => /* @__PURE__ */ React.createElement("button", { key: s.id, onClick: () => setSub(s.id), style: { whiteSpace: "nowrap", padding: "7px 13px", borderRadius: 999, border: "none", fontSize: 11.5, fontWeight: 600, background: sub === s.id ? C.texto : C.rosaClaro, color: sub === s.id ? "#fff" : C.texto } }, s.label))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14 } }, sub === "metas" && /* @__PURE__ */ React.createElement(SecaoMetas, null), sub === "habitos" && /* @__PURE__ */ React.createElement(SecaoHabitos, null), sub === "autocuidado" && /* @__PURE__ */ React.createElement(SecaoAutocuidado, null), sub === "diario" && /* @__PURE__ */ React.createElement(SecaoDiario, null), sub === "desejos" && /* @__PURE__ */ React.createElement(SecaoDesejos, null), sub === "projetos" && /* @__PURE__ */ React.createElement(SecaoProjetos, null)));
}
function SecaoMetas() {
  const { metas, adicionarMeta, editarMeta, removerMeta } = useApp();
  const [modal, setModal] = useState(null);
  const campos = [
    { chave: "titulo", rotulo: "T\xEDtulo da meta", tipo: "texto", placeholder: "Ex: Ler 12 livros este ano" },
    { chave: "categoria", rotulo: "Categoria", tipo: "select", opcoes: CATEGORIAS_META.map((c) => ({ valor: c, rotulo: c })) },
    { chave: "prazo", rotulo: "Prazo", tipo: "data" },
    { chave: "progresso", rotulo: "Progresso (%)", tipo: "numero", placeholder: "0 a 100" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, metas.length === 0 && /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhuma meta cadastrada." }), metas.map((m) => /* @__PURE__ */ React.createElement(Cartao, { key: m.id, style: { padding: 14 }, onClick: () => setModal({ editando: m }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13.5, fontWeight: 500, color: C.texto } }, m.titulo), /* @__PURE__ */ React.createElement(Pill, { cor: C.lilas }, m.categoria)), /* @__PURE__ */ React.createElement(ProgressoBarra, { pct: m.progresso }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textoSuave } }, "Prazo: ", formatarDataLonga(m.prazo)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textoSuave } }, m.progresso, "%")))), /* @__PURE__ */ React.createElement(BotaoFlutuante, { onClick: () => setModal({ editando: { categoria: "Pessoal", progresso: 0, prazo: isoDeHoje(30) } }) }), modal && /* @__PURE__ */ React.createElement(
    ModalFormulario,
    {
      titulo: modal.editando.id ? "Editar meta" : "Nova meta",
      campos,
      valores: modal.editando,
      corDestaque: C.lilas,
      onFechar: () => setModal(null),
      onExcluir: modal.editando.id ? () => {
        removerMeta(modal.editando.id);
        setModal(null);
      } : void 0,
      onSalvar: (d) => {
        if (!d.titulo) return;
        modal.editando.id ? editarMeta(modal.editando.id, d) : adicionarMeta(d);
        setModal(null);
      }
    }
  ));
}
function SecaoHabitos() {
  const { habitos, adicionarHabito, editarHabito, removerHabito, alternarHabito } = useApp();
  const [modal, setModal] = useState(null);
  const campos = [
    { chave: "nome", rotulo: "Nome do h\xE1bito", tipo: "texto", placeholder: "Ex: Meditar" },
    { chave: "frequencia", rotulo: "Frequ\xEAncia", tipo: "select", opcoes: [{ valor: "Di\xE1rio", rotulo: "Di\xE1rio" }, { valor: "Semanal", rotulo: "Semanal" }] },
    { chave: "lembrete", rotulo: "Criar lembrete", tipo: "toggle" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, habitos.length === 0 && /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhum h\xE1bito cadastrado." }), habitos.map((h) => {
    const feito = !!h.historico[HOJE_ISO];
    const ultimosDias = Array.from({ length: 7 }, (_, i) => isoDeHoje(-6 + i));
    return /* @__PURE__ */ React.createElement(Cartao, { key: h.id, style: { padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { onClick: () => setModal({ editando: h }), style: { flex: 1 } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13.5, fontWeight: 500, color: C.texto, margin: 0 } }, h.nome), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", marginTop: 4 } }, /* @__PURE__ */ React.createElement(Pill, { cor: C.lilas }, h.frequencia), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textoSuave, display: "flex", alignItems: "center", gap: 3 } }, /* @__PURE__ */ React.createElement(Flame, { size: 11, color: C.champagne }), " ", sequenciaHabito(h), " dias"))), /* @__PURE__ */ React.createElement("button", { onClick: () => alternarHabito(h.id, HOJE_ISO), style: { width: 30, height: 30, borderRadius: 15, border: "none", background: feito ? C.champagne : C.rosaClaro, display: "flex", alignItems: "center", justifyContent: "center" } }, feito && /* @__PURE__ */ React.createElement(Check, { size: 15, color: "#fff" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, marginTop: 10 } }, ultimosDias.map((iso) => /* @__PURE__ */ React.createElement("div", { key: iso, style: { flex: 1, height: 6, borderRadius: 3, background: h.historico[iso] ? C.champagne : C.rosaClaro } }))));
  }), /* @__PURE__ */ React.createElement(BotaoFlutuante, { onClick: () => setModal({ editando: { frequencia: "Di\xE1rio", lembrete: false } }) }), modal && /* @__PURE__ */ React.createElement(
    ModalFormulario,
    {
      titulo: modal.editando.id ? "Editar h\xE1bito" : "Novo h\xE1bito",
      campos,
      valores: modal.editando,
      corDestaque: C.lilas,
      onFechar: () => setModal(null),
      onExcluir: modal.editando.id ? () => {
        removerHabito(modal.editando.id);
        setModal(null);
      } : void 0,
      onSalvar: (d) => {
        if (!d.nome) return;
        modal.editando.id ? editarHabito(modal.editando.id, d) : adicionarHabito(d);
        setModal(null);
      }
    }
  ));
}
function SecaoAutocuidado() {
  const { autocuidado, adicionarAutocuidado, alternarAutocuidado, removerAutocuidado } = useApp();
  const [modal, setModal] = useState(null);
  const feitos = autocuidado.filter((a) => a.feitoHoje).length;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 14, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, fontWeight: 600, color: C.texto, margin: "0 0 8px" } }, "Checklist de hoje"), /* @__PURE__ */ React.createElement(ProgressoBarra, { pct: autocuidado.length ? feitos / autocuidado.length * 100 : 0 })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, autocuidado.length === 0 && /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhum item de autocuidado ainda." }), autocuidado.map((a) => /* @__PURE__ */ React.createElement(
    ItemLinha,
    {
      key: a.id,
      icone: Sparkles,
      corIcone: C.malva,
      titulo: a.nome,
      riscado: a.feitoHoje,
      direita: /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => alternarAutocuidado(a.id), style: { width: 26, height: 26, borderRadius: 13, border: "none", background: a.feitoHoje ? C.champagne : C.rosaClaro, display: "flex", alignItems: "center", justifyContent: "center" } }, a.feitoHoje && /* @__PURE__ */ React.createElement(Check, { size: 13, color: "#fff" })), /* @__PURE__ */ React.createElement(BotaoIcone, { icone: Trash2, cor: C.vermelho, onClick: () => removerAutocuidado(a.id) }))
    }
  ))), /* @__PURE__ */ React.createElement(BotaoFlutuante, { onClick: () => setModal({ editando: {} }) }), modal && /* @__PURE__ */ React.createElement(
    ModalFormulario,
    {
      titulo: "Novo item de autocuidado",
      campos: [{ chave: "nome", rotulo: "Nome", tipo: "texto", placeholder: "Ex: Hidratar a pele" }],
      valores: modal.editando,
      corDestaque: C.malva,
      onFechar: () => setModal(null),
      onSalvar: (d) => {
        if (!d.nome) return;
        adicionarAutocuidado(d);
        setModal(null);
      }
    }
  ));
}
function SecaoDiario() {
  const { diario, adicionarDiario, removerDiario } = useApp();
  const [modal, setModal] = useState(null);
  const campos = [
    { chave: "texto", rotulo: "Como foi o seu dia?", tipo: "textarea", placeholder: "Escreva livremente..." },
    { chave: "humor", rotulo: "Humor", tipo: "select", opcoes: HUMORES.map((h) => ({ valor: h.valor, rotulo: `${h.emoji} ${h.rotulo}` })) }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, diario.length === 0 && /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhum registro no di\xE1rio ainda." }), [...diario].reverse().map((d) => {
    const h = HUMORES.find((x) => x.valor === d.humor);
    return /* @__PURE__ */ React.createElement(Cartao, { key: d.id, style: { padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textoSuave } }, formatarDataLonga(d.data)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, h?.emoji), /* @__PURE__ */ React.createElement(BotaoIcone, { icone: Trash2, cor: C.vermelho, onClick: () => removerDiario(d.id) }))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: C.texto, margin: 0, lineHeight: 1.5 } }, d.texto));
  }), /* @__PURE__ */ React.createElement(BotaoFlutuante, { onClick: () => setModal({ editando: { humor: "bem" } }) }), modal && /* @__PURE__ */ React.createElement(
    ModalFormulario,
    {
      titulo: "Novo registro",
      campos,
      valores: modal.editando,
      corDestaque: C.rosaCha,
      onFechar: () => setModal(null),
      onSalvar: (d) => {
        if (!d.texto) return;
        adicionarDiario({ ...d, data: HOJE_ISO });
        setModal(null);
      }
    }
  ));
}
function SecaoDesejos() {
  const { desejos, adicionarDesejo, removerDesejo } = useApp();
  const [modal, setModal] = useState(null);
  const campos = [
    { chave: "titulo", rotulo: "O que voc\xEA deseja?", tipo: "texto", placeholder: "Ex: Curso de fotografia" },
    { chave: "categoria", rotulo: "Categoria", tipo: "texto", placeholder: "Ex: Lazer" },
    { chave: "preco", rotulo: "Valor estimado (R$)", tipo: "numero" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, desejos.length === 0 && /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Sua lista de desejos est\xE1 vazia." }), desejos.map((d) => /* @__PURE__ */ React.createElement(
    ItemLinha,
    {
      key: d.id,
      icone: Gift,
      corIcone: C.champagne,
      titulo: d.titulo,
      subtitulo: `${d.categoria} \xB7 ${formatBRL(d.preco)}`,
      direita: /* @__PURE__ */ React.createElement(BotaoIcone, { icone: Trash2, cor: C.vermelho, onClick: () => removerDesejo(d.id) })
    }
  )), /* @__PURE__ */ React.createElement(BotaoFlutuante, { onClick: () => setModal({ editando: {} }) }), modal && /* @__PURE__ */ React.createElement(
    ModalFormulario,
    {
      titulo: "Novo desejo",
      campos,
      valores: modal.editando,
      corDestaque: C.champagne,
      onFechar: () => setModal(null),
      onSalvar: (d) => {
        if (!d.titulo) return;
        adicionarDesejo(d);
        setModal(null);
      }
    }
  ));
}
function SecaoProjetos() {
  const { projetos, adicionarProjeto, editarProjeto, removerProjeto } = useApp();
  const [modal, setModal] = useState(null);
  const campos = [
    { chave: "titulo", rotulo: "Nome do projeto", tipo: "texto", placeholder: "Ex: Reforma do quarto" },
    { chave: "etapasTotal", rotulo: "Total de etapas", tipo: "numero" },
    { chave: "etapasConcluidas", rotulo: "Etapas conclu\xEDdas", tipo: "numero" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, projetos.length === 0 && /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhum projeto pessoal ainda." }), projetos.map((p) => /* @__PURE__ */ React.createElement(Cartao, { key: p.id, style: { padding: 14 }, onClick: () => setModal({ editando: p }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(FolderKanban, { size: 16, color: C.lilas }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13.5, fontWeight: 500, color: C.texto } }, p.titulo)), /* @__PURE__ */ React.createElement(ProgressoBarra, { pct: p.etapasConcluidas / (p.etapasTotal || 1) * 100, cor: C.lilas }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: C.textoSuave, margin: "6px 0 0" } }, p.etapasConcluidas, " de ", p.etapasTotal, " etapas"))), /* @__PURE__ */ React.createElement(BotaoFlutuante, { onClick: () => setModal({ editando: { etapasTotal: 1, etapasConcluidas: 0 } }) }), modal && /* @__PURE__ */ React.createElement(
    ModalFormulario,
    {
      titulo: modal.editando.id ? "Editar projeto" : "Novo projeto",
      campos,
      valores: modal.editando,
      corDestaque: C.lilas,
      onFechar: () => setModal(null),
      onExcluir: modal.editando.id ? () => {
        removerProjeto(modal.editando.id);
        setModal(null);
      } : void 0,
      onSalvar: (d) => {
        if (!d.titulo) return;
        modal.editando.id ? editarProjeto(modal.editando.id, d) : adicionarProjeto(d);
        setModal(null);
      }
    }
  ));
}
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
  doMes.filter((t) => t.tipo === "Despesa").forEach((t) => {
    porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.valor;
  });
  const dadosGrafico = Object.entries(porCategoria).map(([cat, valor]) => ({ cat, valor }));
  const campos = [
    { chave: "tipo", rotulo: "Tipo", tipo: "select", opcoes: [{ valor: "Receita", rotulo: "Receita" }, { valor: "Despesa", rotulo: "Despesa" }] },
    { chave: "descricao", rotulo: "Descri\xE7\xE3o", tipo: "texto", placeholder: "Ex: Supermercado" },
    { chave: "categoria", rotulo: "Categoria", tipo: "select", opcoes: (modalTx?.editando?.tipo === "Receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((c) => ({ valor: c, rotulo: c })) },
    { chave: "conta", rotulo: "Conta", tipo: "select", opcoes: CONTAS.map((c) => ({ valor: c, rotulo: c })) },
    { chave: "valor", rotulo: "Valor (R$)", tipo: "numero" },
    { chave: "data", rotulo: "Data", tipo: "data" }
  ];
  const camposMeta = [
    { chave: "titulo", rotulo: "Nome da meta", tipo: "texto", placeholder: "Ex: Viagem dos sonhos" },
    { chave: "valorAlvo", rotulo: "Valor alvo (R$)", tipo: "numero" },
    { chave: "valorAtual", rotulo: "Valor j\xE1 guardado (R$)", tipo: "numero" },
    { chave: "prazo", rotulo: "Prazo", tipo: "data" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 18px 90px" } }, /* @__PURE__ */ React.createElement(Cabecalho, { titulo: "Dinheiro", subtitulo: "Seu controle financeiro", onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }), /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 18, background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})` } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#fff9", margin: 0 } }, "Saldo dispon\xEDvel"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 24, fontWeight: 700, color: "#fff", margin: "4px 0 12px" } }, formatBRL(saldo)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, alignItems: "center" } }, /* @__PURE__ */ React.createElement(ArrowUpCircle, { size: 15, color: "#fff" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#fff" } }, formatBRL(entradas))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, alignItems: "center" } }, /* @__PURE__ */ React.createElement(ArrowDownCircle, { size: 15, color: "#fff" }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#fff" } }, formatBRL(saidas))))), /* @__PURE__ */ React.createElement(TituloSecao, { acao: /* @__PURE__ */ React.createElement("button", { onClick: () => setEditandoOrcamento(true), style: { background: "none", border: "none", color: C.champagne, fontSize: 12, fontWeight: 600 } }, "Editar") }, "Or\xE7amento mensal"), /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 14 } }, editandoOrcamento ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "number", style: estiloInput, value: novoOrcamento, onChange: (e) => setNovoOrcamento(Number(e.target.value)) }), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setOrcamentoMensal(novoOrcamento);
    setEditandoOrcamento(false);
  }, style: { background: C.champagne, border: "none", borderRadius: 12, padding: "0 16px", color: "#fff", fontSize: 12, fontWeight: 600 } }, "OK")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textoSuave } }, "Gasto: ", formatBRL(saidas)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: C.textoSuave } }, "Limite: ", formatBRL(orcamentoMensal))), /* @__PURE__ */ React.createElement(ProgressoBarra, { pct: orcamentoMensal ? saidas / orcamentoMensal * 100 : 0, cor: saidas > orcamentoMensal ? C.vermelho : C.champagne }))), dadosGrafico.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TituloSecao, null, "Despesas por categoria"), /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 14 } }, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 160 }, /* @__PURE__ */ React.createElement(BarChart, { data: dadosGrafico }, /* @__PURE__ */ React.createElement(CartesianGrid, { stroke: C.rosaClaro, vertical: false }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "cat", tick: { fontSize: 9, fill: C.textoSuave }, axisLine: false, tickLine: false, interval: 0, angle: -20, textAnchor: "end", height: 50 }), /* @__PURE__ */ React.createElement(YAxis, { hide: true }), /* @__PURE__ */ React.createElement(Tooltip, { contentStyle: { borderRadius: 12, border: "none", fontSize: 12 }, formatter: (v) => formatBRL(v) }), /* @__PURE__ */ React.createElement(Bar, { dataKey: "valor", fill: C.rosaCha, radius: [6, 6, 0, 0] }))))), /* @__PURE__ */ React.createElement(TituloSecao, null, "Metas financeiras"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, metasFinanceiras.length === 0 && /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhuma meta financeira ainda." }), metasFinanceiras.map((m) => /* @__PURE__ */ React.createElement(Cartao, { key: m.id, style: { padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 500, color: C.texto } }, m.titulo), /* @__PURE__ */ React.createElement(BotaoIcone, { icone: Trash2, cor: C.vermelho, onClick: () => removerMetaFinanceira(m.id) })), /* @__PURE__ */ React.createElement(ProgressoBarra, { pct: m.valorAtual / (m.valorAlvo || 1) * 100, cor: C.verde }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textoSuave } }, formatBRL(m.valorAtual), " de ", formatBRL(m.valorAlvo)), /* @__PURE__ */ React.createElement("button", { onClick: () => contribuirMetaFinanceira(m.id, 50), style: { background: C.verde, border: "none", borderRadius: 999, padding: "5px 12px", color: "#fff", fontSize: 11, fontWeight: 600 } }, "+ R$50")))), /* @__PURE__ */ React.createElement("button", { onClick: () => setModalMeta({ editando: { valorAtual: 0, valorAlvo: 1e3, prazo: isoDeHoje(90) } }), style: { padding: "10px 0", borderRadius: 14, border: `1.5px dashed ${C.lilas}`, background: "none", color: C.lilas, fontSize: 12, fontWeight: 600 } }, "+ Nova meta financeira")), /* @__PURE__ */ React.createElement(TituloSecao, null, "Hist\xF3rico de movimenta\xE7\xF5es"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, [...transacoes].sort((a, b) => b.data.localeCompare(a.data)).map((t) => /* @__PURE__ */ React.createElement(
    ItemLinha,
    {
      key: t.id,
      icone: t.tipo === "Receita" ? ArrowUpCircle : ArrowDownCircle,
      corIcone: t.tipo === "Receita" ? C.verde : C.vermelho,
      titulo: t.descricao,
      subtitulo: `${t.categoria} \xB7 ${t.conta} \xB7 ${(/* @__PURE__ */ new Date(t.data + "T12:00:00")).toLocaleDateString("pt-BR")}`,
      direita: /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: t.tipo === "Receita" ? C.verde : C.vermelho } }, t.tipo === "Receita" ? "+" : "-", formatBRL(t.valor)), /* @__PURE__ */ React.createElement(BotaoIcone, { icone: Trash2, cor: C.vermelho, onClick: () => removerTransacao(t.id) }))
    }
  ))), /* @__PURE__ */ React.createElement(BotaoFlutuante, { onClick: () => setModalTx({ editando: { tipo: "Despesa", categoria: CATEGORIAS_DESPESA[0], conta: CONTAS[0], data: HOJE_ISO } }) }), modalTx && /* @__PURE__ */ React.createElement(
    ModalFormulario,
    {
      titulo: "Nova movimenta\xE7\xE3o",
      campos,
      valores: modalTx.editando,
      corDestaque: C.champagne,
      onFechar: () => setModalTx(null),
      onSalvar: (d) => {
        if (!d.descricao || !d.valor) return;
        adicionarTransacao(d);
        setModalTx(null);
      }
    }
  ), modalMeta && /* @__PURE__ */ React.createElement(
    ModalFormulario,
    {
      titulo: "Nova meta financeira",
      campos: camposMeta,
      valores: modalMeta.editando,
      corDestaque: C.verde,
      onFechar: () => setModalMeta(null),
      onSalvar: (d) => {
        if (!d.titulo) return;
        adicionarMetaFinanceira(d);
        setModalMeta(null);
      }
    }
  ));
}
function TelaEscala({ onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }) {
  const { escala } = useApp();
  const dias = escala.dias;
  const hojeDate = /* @__PURE__ */ new Date(HOJE_ISO + "T12:00:00");
  const [mes, setMes] = useState(hojeDate.getMonth());
  const [ano, setAno] = useState(hojeDate.getFullYear());
  const mudarMes = (delta) => {
    let m = mes + delta, a = ano;
    if (m < 0) {
      m = 11;
      a -= 1;
    }
    if (m > 11) {
      m = 0;
      a += 1;
    }
    setMes(m);
    setAno(a);
  };
  const isoProximaFolga = proximaOcorrenciaEscala(dias, "folga", HOJE_ISO);
  const isoProximoPlantao = proximaOcorrenciaEscala(dias, "plantao", HOJE_ISO);
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
  const isosDoMes = Array.from({ length: totalDiasMes }, (_, i) => isoDeAnoMesDia(ano, mes, i + 1));
  const plantoesNoMes = isosDoMes.filter((iso) => dias[iso] === "plantao").length;
  const folgasNoMes = isosDoMes.filter((iso) => dias[iso] === "folga").length;
  const horasNoMes = plantoesNoMes * (escala.horasPorPlantao || 0);
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const celulasVazias = Array.from({ length: primeiroDiaSemana });
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 18px 90px" } }, /* @__PURE__ */ React.createElement(Cabecalho, { titulo: "Escala", subtitulo: "Minhas folgas", onAbrirNotificacoes, onAbrirPerfil, qtdNotificacoes }), /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "0 0 4px" } }, "Pr\xF3xima folga"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 18, fontWeight: 700, color: C.texto, margin: 0 } }, isoProximaFolga ? `${diasEntre(isoProximaFolga)} dias` : "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "0 0 4px" } }, "Pr\xF3ximo plant\xE3o"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 18, fontWeight: 700, color: C.texto, margin: 0 } }, isoProximoPlantao ? nomeDiaSemana(isoProximoPlantao) : "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "0 0 4px" } }, "Plant\xF5es no m\xEAs"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 18, fontWeight: 700, color: C.texto, margin: 0 } }, plantoesNoMes)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "0 0 4px" } }, "Folgas no m\xEAs"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 18, fontWeight: 700, color: C.texto, margin: 0 } }, folgasNoMes))), /* @__PURE__ */ React.createElement("div", { style: { borderTop: `1px solid ${C.rosaClaro}`, margin: "16px 0 12px" } }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "0 0 4px" } }, "Horas trabalhadas no m\xEAs"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 26, fontWeight: 700, color: C.rosaCha, margin: 0 } }, horasNoMes, "h")), /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 18, marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(BotaoIcone, { icone: ChevronLeft, onClick: () => mudarMes(-1), cor: C.texto }), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 16, fontWeight: 600, color: C.texto, margin: 0, fontFamily: "Georgia, serif" } }, NOMES_MES[mes], " ", ano), /* @__PURE__ */ React.createElement(BotaoIcone, { icone: ChevronRight, onClick: () => mudarMes(1), cor: C.texto })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 } }, ["D", "S", "T", "Q", "Q", "S", "S"].map((l, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { textAlign: "center", fontSize: 11, color: C.textoSuave, fontWeight: 500 } }, l))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 } }, celulasVazias.map((_, i) => /* @__PURE__ */ React.createElement("div", { key: `vazia-${i}` })), isosDoMes.map((iso, i) => {
    const tipo = dias[iso];
    const cfg = tipo ? TIPOS_ESCALA[tipo] : null;
    const Icone = cfg?.icone;
    const ehHoje = iso === HOJE_ISO;
    return /* @__PURE__ */ React.createElement("div", { key: iso, style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      padding: "7px 0",
      borderRadius: 12,
      background: cfg ? cfg.bg : "transparent",
      border: ehHoje ? `2px solid ${C.rosaCha}` : "2px solid transparent",
      boxSizing: "border-box"
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: ehHoje ? C.rosaCha : C.texto } }, i + 1), Icone && /* @__PURE__ */ React.createElement(Icone, { size: 13, color: cfg.corIcone }));
  })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px 14px", marginTop: 16 } }, Object.entries(TIPOS_ESCALA).map(([chave, cfg]) => {
    const Icone = cfg.icone;
    return /* @__PURE__ */ React.createElement("div", { key: chave, style: { display: "flex", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React.createElement(Icone, { size: 13, color: cfg.corIcone }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: C.textoSuave } }, cfg.rotulo));
  }))));
}
function TelaPerfil({ onFechar }) {
  const { perfil, editarPerfil, tarefas, habitos, metas } = useApp();
  const [editando, setEditando] = useState(false);
  const campos = [
    { chave: "nome", rotulo: "Nome", tipo: "texto" },
    { chave: "horarioInicio", rotulo: "Hor\xE1rio de in\xEDcio do dia", tipo: "hora" },
    { chave: "objetivos", rotulo: "Objetivo principal", tipo: "texto" }
  ];
  const lembretes = [
    ...tarefas.filter((t) => t.lembrete).map((t) => ({ tipo: "Tarefa", nome: t.titulo, quando: t.hora || t.data })),
    ...habitos.filter((h) => h.lembrete).map((h) => ({ tipo: "H\xE1bito", nome: h.nome, quando: h.frequencia }))
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: C.bg, zIndex: 60, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 384, margin: "0 auto", padding: "22px 20px 40px" } }, /* @__PURE__ */ React.createElement("button", { onClick: onFechar, style: { background: "none", border: "none", color: C.textoSuave, fontSize: 13, marginBottom: 12 } }, "\u2190 Voltar"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 72, height: 72, borderRadius: 36, background: `linear-gradient(135deg, ${C.rosaCha}, ${C.lilas})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 10px" } }, perfil?.avatar), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: C.texto, margin: 0 } }, perfil?.nome), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "4px 0 0" } }, perfil?.objetivos)), /* @__PURE__ */ React.createElement(Cartao, { style: { padding: 16, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, fontWeight: 600, color: C.texto, margin: 0 } }, "Prefer\xEAncias"), /* @__PURE__ */ React.createElement("button", { onClick: () => setEditando(true), style: { background: "none", border: "none", color: C.champagne, fontSize: 12, fontWeight: 600 } }, "Editar")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: C.textoSuave, margin: "4px 0" } }, "In\xEDcio do dia: ", perfil?.horarioInicio)), /* @__PURE__ */ React.createElement(TituloSecao, null, "Notifica\xE7\xF5es e lembretes"), lembretes.length === 0 ? /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Nenhum lembrete configurado." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, lembretes.map((l, i) => /* @__PURE__ */ React.createElement(ItemLinha, { key: i, icone: Bell, corIcone: C.champagne, titulo: l.nome, subtitulo: `${l.tipo} \xB7 ${l.quando}` }))), /* @__PURE__ */ React.createElement(TituloSecao, null, "Configura\xE7\xF5es"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement(ItemLinha, { icone: User, corIcone: C.malva, titulo: "Editar perfil", onClick: () => setEditando(true), direita: /* @__PURE__ */ React.createElement(ChevronRight, { size: 16, color: C.textoSuave }) }), /* @__PURE__ */ React.createElement(ItemLinha, { icone: Settings, corIcone: C.textoSuave, titulo: "Categorias e rotinas", subtitulo: "Personalize suas categorias", direita: /* @__PURE__ */ React.createElement(ChevronRight, { size: 16, color: C.textoSuave }) })), editando && /* @__PURE__ */ React.createElement(
    ModalFormulario,
    {
      titulo: "Editar perfil",
      campos,
      valores: perfil,
      corDestaque: C.rosaCha,
      onFechar: () => setEditando(false),
      onSalvar: (d) => {
        editarPerfil(d);
        setEditando(false);
      }
    }
  )));
}
function TelaNotificacoes({ onFechar }) {
  const { tarefas, habitos } = useApp();
  const itens = [
    ...tarefas.filter((t) => t.lembrete && !tarefaConcluidaEm(t, HOJE_ISO)).map((t) => ({ nome: t.titulo, quando: `Hoje \xE0s ${t.hora || "\u2014"}`, tipo: "Tarefa" })),
    ...habitos.filter((h) => h.lembrete && !h.historico[HOJE_ISO]).map((h) => ({ nome: h.nome, quando: h.frequencia, tipo: "H\xE1bito" }))
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(91,75,87,0.35)", zIndex: 60, display: "flex", justifyContent: "center", alignItems: "flex-end" }, onClick: onFechar }, /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 384, background: "#fff", borderRadius: "28px 28px 0 0", padding: 22, maxHeight: "75vh", overflowY: "auto" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 16, fontWeight: 600, color: C.texto, margin: 0 } }, "Notifica\xE7\xF5es"), /* @__PURE__ */ React.createElement("button", { onClick: onFechar, style: { background: "none", border: "none" } }, /* @__PURE__ */ React.createElement(X, { size: 20, color: C.textoSuave }))), itens.length === 0 ? /* @__PURE__ */ React.createElement(EstadoVazio, { texto: "Voc\xEA est\xE1 em dia com tudo! \u{1F389}" }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, itens.map((it, i) => /* @__PURE__ */ React.createElement(ItemLinha, { key: i, icone: Bell, corIcone: C.champagne, titulo: it.nome, subtitulo: `${it.tipo} \xB7 ${it.quando}` })))));
}
function AppProvider({ children }) {
  const [estado, setEstado] = useState(() => carregarEstadoSalvo() || dadosIniciais());
  useEffect(() => {
    salvarEstado(estado);
  }, [estado]);
  const acoes = {
    editarPerfil: (novo) => setEstado((e) => ({ ...e, perfil: { ...e.perfil, ...novo } })),
    setHumorHoje: (v) => setEstado((e) => ({ ...e, humorHoje: v })),
    adicionarTarefa: (t) => setEstado((e) => ({ ...e, tarefas: [...e.tarefas, { id: uid(), historico: {}, concluida: false, ...t }] })),
    editarTarefa: (id, novo) => setEstado((e) => ({ ...e, tarefas: e.tarefas.map((t) => t.id === id ? { ...t, ...novo } : t) })),
    removerTarefa: (id) => setEstado((e) => ({ ...e, tarefas: e.tarefas.filter((t) => t.id !== id) })),
    alternarTarefa: (id, iso) => setEstado((e) => ({
      ...e,
      tarefas: e.tarefas.map((t) => {
        if (t.id !== id) return t;
        if (t.recorrente) return { ...t, historico: { ...t.historico, [iso]: !t.historico[iso] } };
        return { ...t, concluida: !t.concluida };
      })
    })),
    adicionarHabito: (h) => setEstado((e) => ({ ...e, habitos: [...e.habitos, { id: uid(), historico: {}, ...h }] })),
    editarHabito: (id, novo) => setEstado((e) => ({ ...e, habitos: e.habitos.map((h) => h.id === id ? { ...h, ...novo } : h) })),
    removerHabito: (id) => setEstado((e) => ({ ...e, habitos: e.habitos.filter((h) => h.id !== id) })),
    alternarHabito: (id, iso) => setEstado((e) => ({ ...e, habitos: e.habitos.map((h) => h.id === id ? { ...h, historico: { ...h.historico, [iso]: !h.historico[iso] } } : h) })),
    adicionarAutocuidado: (a) => setEstado((e) => ({ ...e, autocuidado: [...e.autocuidado, { id: uid(), feitoHoje: false, ...a }] })),
    alternarAutocuidado: (id) => setEstado((e) => ({ ...e, autocuidado: e.autocuidado.map((a) => a.id === id ? { ...a, feitoHoje: !a.feitoHoje } : a) })),
    removerAutocuidado: (id) => setEstado((e) => ({ ...e, autocuidado: e.autocuidado.filter((a) => a.id !== id) })),
    adicionarDiario: (d) => setEstado((e) => ({ ...e, diario: [...e.diario, { id: uid(), ...d }] })),
    removerDiario: (id) => setEstado((e) => ({ ...e, diario: e.diario.filter((d) => d.id !== id) })),
    adicionarDesejo: (d) => setEstado((e) => ({ ...e, desejos: [...e.desejos, { id: uid(), ...d }] })),
    removerDesejo: (id) => setEstado((e) => ({ ...e, desejos: e.desejos.filter((d) => d.id !== id) })),
    adicionarProjeto: (p) => setEstado((e) => ({ ...e, projetos: [...e.projetos, { id: uid(), ...p }] })),
    editarProjeto: (id, novo) => setEstado((e) => ({ ...e, projetos: e.projetos.map((p) => p.id === id ? { ...p, ...novo } : p) })),
    removerProjeto: (id) => setEstado((e) => ({ ...e, projetos: e.projetos.filter((p) => p.id !== id) })),
    adicionarMeta: (m) => setEstado((e) => ({ ...e, metas: [...e.metas, { id: uid(), ...m }] })),
    editarMeta: (id, novo) => setEstado((e) => ({ ...e, metas: e.metas.map((m) => m.id === id ? { ...m, ...novo } : m) })),
    removerMeta: (id) => setEstado((e) => ({ ...e, metas: e.metas.filter((m) => m.id !== id) })),
    adicionarTransacao: (t) => setEstado((e) => ({ ...e, transacoes: [...e.transacoes, { id: uid(), ...t }] })),
    removerTransacao: (id) => setEstado((e) => ({ ...e, transacoes: e.transacoes.filter((t) => t.id !== id) })),
    setOrcamentoMensal: (v) => setEstado((e) => ({ ...e, orcamentoMensal: v })),
    adicionarMetaFinanceira: (m) => setEstado((e) => ({ ...e, metasFinanceiras: [...e.metasFinanceiras, { id: uid(), ...m }] })),
    contribuirMetaFinanceira: (id, valor) => setEstado((e) => ({ ...e, metasFinanceiras: e.metasFinanceiras.map((m) => m.id === id ? { ...m, valorAtual: m.valorAtual + valor } : m) })),
    removerMetaFinanceira: (id) => setEstado((e) => ({ ...e, metasFinanceiras: e.metasFinanceiras.filter((m) => m.id !== id) })),
    definirDiaEscala: (iso, tipo) => setEstado((e) => ({
      ...e,
      escala: {
        ...e.escala,
        dias: tipo ? { ...e.escala.dias, [iso]: tipo } : Object.fromEntries(Object.entries(e.escala.dias).filter(([k]) => k !== iso))
      }
    })),
    setHorasPorPlantao: (v) => setEstado((e) => ({ ...e, escala: { ...e.escala, horasPorPlantao: v } }))
  };
  return /* @__PURE__ */ React.createElement(AppCtx.Provider, { value: { ...estado, ...acoes } }, children);
}
function Conteudo() {
  const { perfil, editarPerfil, tarefas, habitos } = useApp();
  const [aba, setAba] = useState("inicio");
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [mostrarNotif, setMostrarNotif] = useState(false);
  if (!perfil) {
    return /* @__PURE__ */ React.createElement(Onboarding, { onConcluir: (dados) => editarPerfil(dados) });
  }
  const qtdNotif = tarefas.filter((t) => t.lembrete && !tarefaConcluidaEm(t, HOJE_ISO)).length + habitos.filter((h) => h.lembrete && !h.historico[HOJE_ISO]).length;
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: C.bg, fontFamily: "'Poppins','Segoe UI',sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 384, margin: "0 auto", position: "relative" } }, aba === "inicio" && /* @__PURE__ */ React.createElement(
    TelaInicio,
    {
      irPara: setAba,
      onAbrirNotificacoes: () => setMostrarNotif(true),
      onAbrirPerfil: () => setMostrarPerfil(true),
      qtdNotificacoes: qtdNotif
    }
  ), aba === "dia" && /* @__PURE__ */ React.createElement(TelaMeuDia, { onAbrirNotificacoes: () => setMostrarNotif(true), onAbrirPerfil: () => setMostrarPerfil(true), qtdNotificacoes: qtdNotif }), aba === "vida" && /* @__PURE__ */ React.createElement(TelaVida, { onAbrirNotificacoes: () => setMostrarNotif(true), onAbrirPerfil: () => setMostrarPerfil(true), qtdNotificacoes: qtdNotif }), aba === "dinheiro" && /* @__PURE__ */ React.createElement(TelaDinheiro, { onAbrirNotificacoes: () => setMostrarNotif(true), onAbrirPerfil: () => setMostrarPerfil(true), qtdNotificacoes: qtdNotif }), aba === "escala" && /* @__PURE__ */ React.createElement(TelaEscala, { onAbrirNotificacoes: () => setMostrarNotif(true), onAbrirPerfil: () => setMostrarPerfil(true), qtdNotificacoes: qtdNotif }), /* @__PURE__ */ React.createElement(NavegacaoInferior, { ativa: aba, onMudar: setAba }), mostrarPerfil && /* @__PURE__ */ React.createElement(TelaPerfil, { onFechar: () => setMostrarPerfil(false) }), mostrarNotif && /* @__PURE__ */ React.createElement(TelaNotificacoes, { onFechar: () => setMostrarNotif(false) })));
}
function MeuPlanner() {
  return /* @__PURE__ */ React.createElement(AppProvider, null, /* @__PURE__ */ React.createElement(Conteudo, null));
}
const elementoRaiz = document.getElementById("root");
const raiz = createRoot(elementoRaiz);
raiz.render(/* @__PURE__ */ React.createElement(MeuPlanner, null));
