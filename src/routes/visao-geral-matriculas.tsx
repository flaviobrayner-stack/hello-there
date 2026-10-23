import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, RefreshCw, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/visao-geral-matriculas")({
  head: () => ({
    meta: [
      { title: "Visão Geral das Matrículas — Sistema de Matrícula 2026" },
      { name: "description", content: "Acesse o painel com gráficos e quantidades de matrículas." },
    ],
  }),
  component: VisaoGeralMatriculas,
});

function VisaoGeralMatriculas() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white">
          <GraduationCap size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Visão Geral das Matrículas</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Abra o painel principal para consultar os gráficos e as quantidades de matrículas carregadas do sistema.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <BarChart3 size={17} />
            Abrir gráficos e quantidades
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Atualizar página
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Voltar para a página inicial
          </Link>
        </div>
      </section>
    </main>
  );
}
