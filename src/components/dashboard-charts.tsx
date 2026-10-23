import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { StudentInfo } from "../lib/types";

interface DashboardChartsProps {
  students: StudentInfo[];
}

const COLORS = ["#1d4ed8", "#059669", "#d97706", "#7c3aed", "#e11d48", "#0284c7"];

export function DashboardCharts({ students }: DashboardChartsProps) {
  // 1. Matrículas por Curso
  const courseCounts: Record<string, number> = {};
  students.forEach((s) => {
    courseCounts[s.course] = (courseCounts[s.course] || 0) + 1;
  });
  const courseData = Object.entries(courseCounts).map(([name, total]) => ({
    name: name.length > 15 ? name.slice(0, 15) + "..." : name,
    fullName: name,
    total,
  }));

  // 2. Matrículas por Cota
  const quotaCounts: Record<string, number> = {};
  students.forEach((s) => {
    quotaCounts[s.quotaType] = (quotaCounts[s.quotaType] || 0) + 1;
  });
  const quotaData = Object.entries(quotaCounts).map(([name, total]) => ({
    name,
    total,
  }));

  // 3. Evolução / Matrículas Recentes
  const dailyCounts = new Map<string, number>();
  students.forEach((student) => {
    const rawDate = student.createdAt?.split(" ")[0] || "";
    const match = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const parsed = match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return;
    const key = parsed.toLocaleDateString("pt-BR");
    dailyCounts.set(key, (dailyCounts.get(key) || 0) + 1);
  });
  const dailyData = Array.from(dailyCounts.entries())
    .map(([date, matriculas]) => {
      const [day, month, year] = date.split("/");
      return { date, matriculas, sortKey: new Date(Number(year), Number(month) - 1, Number(day)).getTime() };
    })
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(-7)
    .map(({ date, matriculas }) => ({ date: date.slice(0, 5), matriculas }));

  // 4. Status de Documentação e Pendências
  let semFotos = 0;
  let semFicha18 = 0;
  let semRenda = 0;
  let semVacina = 0;
  let semResidencia = 0;

  students.forEach((s) => {
    s.documents.forEach((d) => {
      if (d.status === "Pendente") {
        if (d.type === "duas_fotos_3x4") semFotos++;
        if (d.type === "ficha_18") semFicha18++;
        if (d.type === "comprovante_renda") semRenda++;
        if (d.type === "cartao_vacina") semVacina++;
        if (d.type === "comprovante_residencia") semResidencia++;
      }
    });
  });

  const pendenciasData = [
    { name: "Fotos 3×4", total: semFotos },
    { name: "Ficha 18", total: semFicha18 },
    { name: "Comp. Renda", total: semRenda },
    { name: "Cartão Vacina", total: semVacina },
    { name: "Comp. Residência", total: semResidencia },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Gráfico 1: Evolução Diária */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Evolução de Matrículas (Ano Letivo 2026)
          </h3>
          <p className="text-xs text-slate-500">Cadastros homologados e em análise por dia</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="matriculas"
                name="Matrículas"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                dot={{ fill: "#1d4ed8", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Matrículas por Curso */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Distribuição por Curso Técnico
          </h3>
          <p className="text-xs text-slate-500">Total de estudantes por formação</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={courseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="total" name="Estudantes" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 3: Matrículas por Tipo de Cota */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Distribuição por Modalidade de Cota
          </h3>
          <p className="text-xs text-slate-500">Adesão a cotas de ações afirmativas</p>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={quotaData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
              >
                {quotaData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 4: Pendências por Tipo de Documento */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Pendências por Documento (Alerta Operacional)
          </h3>
          <p className="text-xs text-slate-500">
            Itens que necessitam de cobrança ou entrega posterior
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pendenciasData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={95} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="total" name="Pendências" fill="#d97706" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
