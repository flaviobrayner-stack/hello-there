import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, CheckCircle2, Clock3, FileText, RefreshCw, Users, Camera, GraduationCap } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

const SUPABASE_URL = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || "https://oreeyfyidnhpkwnxubpw.supabase.co";
const SUPABASE_KEY = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) || "sb_publishable_r9HALBJWZKnLe_vy060umg_B9s7JKwA";
const COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#e11d48", "#0284c7"];

type Point = { name: string; total: number };
type Overview = {
  total_matriculas: number;
  rascunhos: number;
  em_analise: number;
  documentacao_completa: number;
  percentual_documentacao: number;
  alunos_sem_fotos: number;
  alunos_sem_ficha18: number;
  matriculas_por_dia: Point[];
  matriculas_por_curso: Point[];
  matriculas_por_cota: Point[];
  pendencias_documentais: Point[];
  atualizado_em: string;
};

export const Route = createFileRoute("/visao-geral-matriculas")({
  head: () => ({
    meta: [
      { title: "Visão Geral das Matrículas — ETE Maria José Vasconcelos" },
      { name: "description", content: "Painel público de indicadores agregados de matrículas, cotas e pendências documentais." },
    ],
  }),
  component: VisaoGeralMatriculas,
});

function Metric({ title, value, note, icon: Icon, tone }: {
  title: string; value: number | string; note: string; icon: typeof Users; tone: string;
}) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p></div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon size={21} /></span>
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-500">{note}</p>
  </section>;
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4"><h2 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div>
    <div className="h-72 w-full">{children}</div>
  </section>;
}

function VisaoGeralMatriculas() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/public_enrollment_overview`, {
        method: "POST",
        cache: "no-store",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error("Não foi possível carregar os indicadores públicos. Verifique a publicação e a configuração do banco de dados.");
      const result = await response.json() as Overview;
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao consultar os indicadores.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  const updated = data?.atualizado_em ? new Date(data.atualizado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Aguardando dados";

  return <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-7 lg:px-10">
    <div className="mx-auto max-w-7xl">
      <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img src="/ete-logo.svg" alt="ETE Maria José Vasconcelos" className="h-16 w-16 rounded-xl object-contain" />
          <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">ETE Maria José Vasconcelos</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Visão Geral das Matrículas</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Acompanhamento em tempo real de matrículas, cotas afirmativas, conferência de documentos e alertas de pendências.</p>
          </div>
        </div>
        <button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60">
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Atualizando…" : "Atualizar indicadores"}
        </button>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2"><Activity size={15} /> Atualização automática a cada 30 segundos</span>
        <span>Última atualização: {updated}</span>
      </div>

      {error && <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle size={19} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Indicadores indisponíveis</p><p className="mt-1">{error}</p><button className="mt-2 font-bold underline" onClick={() => void load(true)}>Tentar novamente</button></div></div>}

      {loading && !data ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Carregando indicadores reais do banco de dados…</div> : <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Total de Matrículas" value={data?.total_matriculas ?? "—"} note="Matrículas concluídas" icon={Users} tone="bg-blue-50 text-blue-700" />
          <Metric title="Rascunhos" value={data?.rascunhos ?? "—"} note="Cadastros ainda não concluídos" icon={Clock3} tone="bg-amber-50 text-amber-700" />
          <Metric title="Documentação Completa" value={`${data?.percentual_documentacao ?? 0}%`} note={`${data?.documentacao_completa ?? 0} matrícula(s) concluída(s) com documentos obrigatórios entregues`} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
          <Metric title="Alunos sem Fotos 3×4" value={data?.alunos_sem_fotos ?? "—"} note="Alerta: fotos pendentes de entrega" icon={Camera} tone="bg-rose-50 text-rose-700" />
          <Metric title="Alunos sem Ficha 18" value={data?.alunos_sem_ficha18 ?? "—"} note="Histórico fundamental com prazo" icon={FileText} tone="bg-violet-50 text-violet-700" />
          <Metric title="Matrículas em Análise" value={data?.em_analise ?? "—"} note="Registros aguardando conclusão" icon={GraduationCap} tone="bg-cyan-50 text-cyan-700" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard title="Evolução das Matrículas Concluídas" description="Matrículas concluídas por dia nos últimos dias">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={data?.matriculas_por_dia ?? []}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" fontSize={11} stroke="#64748b" /><YAxis allowDecimals={false} fontSize={11} stroke="#64748b" /><Tooltip /><Line type="monotone" dataKey="total" name="Matrículas" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Matrículas por Curso Técnico" description="Distribuição das matrículas concluídas por curso">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={data?.matriculas_por_curso ?? []}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" fontSize={10} interval={0} stroke="#64748b" /><YAxis allowDecimals={false} fontSize={11} stroke="#64748b" /><Tooltip /><Bar dataKey="total" name="Matrículas" fill="#2563eb" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Cotas e Ações Afirmativas" description="Distribuição agregada por modalidade de cota">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data?.matriculas_por_cota ?? []} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}>{(data?.matriculas_por_cota ?? []).map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Pendências Documentais" description="Quantidade de matrículas concluídas com foto 3×4 ou Ficha 18 pendente">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={data?.pendencias_documentais ?? []} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" allowDecimals={false} fontSize={11} stroke="#64748b" /><YAxis type="category" dataKey="name" width={95} fontSize={11} stroke="#64748b" /><Tooltip /><Bar dataKey="total" name="Pendências" fill="#d97706" radius={[0,6,6,0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
        </div>
      </>}

      <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-xs leading-5 text-slate-500">
        Painel público somente para consulta. Exibe indicadores agregados e não apresenta nomes, CPFs, contatos ou dados individuais dos estudantes.
      </footer>
    </div>
  </main>;
}
