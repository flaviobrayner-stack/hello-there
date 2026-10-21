import { useState } from "react";
import { UserProfile } from "../lib/types";
import {
  GraduationCap,
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  AlertCircle,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react";

interface LoginViewProps {
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
}

export function LoginView({ users, onLogin }: LoginViewProps) {
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("flavio.brayner@ete.pe.gov.br");
  const [password, setPassword] = useState<string>("123456");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleQuickSelect = (user: UserProfile) => {
    setSelectedUserEmail(user.email);
    setPassword(user.password || "123456");
    setErrorMessage("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const targetUser = users.find(
      (u) => u.email.toLowerCase().trim() === selectedUserEmail.toLowerCase().trim(),
    );

    if (!targetUser) {
      setErrorMessage("Usuário não encontrado. Verifique o e-mail informado.");
      return;
    }

    if (!targetUser.active) {
      setErrorMessage("Esta conta de usuário está desativada. Contate a administração.");
      return;
    }

    const expectedPassword = targetUser.password || "123456";
    if (password !== expectedPassword) {
      setErrorMessage("Senha incorreta. A senha padrão inicial é 123456.");
      return;
    }

    onLogin(targetUser);
  };

  const flavio = users.find((u) => u.role === "admin") || users[0];
  const viviane = users.find((u) => u.role === "operador") || users[1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-lg">
        {/* Top Branding Card */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 mb-4 ring-8 ring-blue-500/10">
            <GraduationCap size={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Sistema de Matrícula <span className="text-blue-400">2026</span>
          </h1>
          <p className="mt-1 text-sm text-slate-300 font-medium">
            Escola Técnica Estadual Maria José Vasconcelos
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Cursos: Administração & Redes de Computadores
          </div>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl border border-slate-700/60 bg-slate-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <LockKeyhole size={18} className="text-blue-400" />
              Autenticação de Usuário
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Selecione seu perfil institucional ou informe suas credenciais:
            </p>
          </div>

          {/* Quick User Selection Cards */}
          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {flavio && (
              <button
                type="button"
                onClick={() => handleQuickSelect(flavio)}
                className={`relative flex flex-col text-left p-3.5 rounded-2xl border transition ${
                  selectedUserEmail === flavio.email
                    ? "border-blue-500 bg-blue-600/20 ring-2 ring-blue-500/30"
                    : "border-slate-700/70 bg-slate-900/40 hover:bg-slate-700/30 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">{flavio.name}</span>
                  <span className="rounded-full bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-bold uppercase border border-purple-400/20">
                    ADM
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono truncate">{flavio.email}</span>
                <span className="text-[10px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
                  <ShieldCheck size={12} /> Acesso Total (Dashboard incluso)
                </span>
              </button>
            )}

            {viviane && (
              <button
                type="button"
                onClick={() => handleQuickSelect(viviane)}
                className={`relative flex flex-col text-left p-3.5 rounded-2xl border transition ${
                  selectedUserEmail === viviane.email
                    ? "border-blue-500 bg-blue-600/20 ring-2 ring-blue-500/30"
                    : "border-slate-700/70 bg-slate-900/40 hover:bg-slate-700/30 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">{viviane.name}</span>
                  <span className="rounded-full bg-blue-500/20 text-blue-300 px-2 py-0.5 text-[10px] font-bold uppercase border border-blue-400/20">
                    Operador
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono truncate">{viviane.email}</span>
                <span className="text-[10px] text-amber-300 mt-2 font-medium flex items-center gap-1">
                  <UserCheck size={12} /> Matrículas (Sem Dashboard)
                </span>
              </button>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail Institucional ou Usuário
              </label>
              <select
                value={selectedUserEmail}
                onChange={(e) => {
                  setSelectedUserEmail(e.target.value);
                  const u = users.find((x) => x.email === e.target.value);
                  if (u) setPassword(u.password || "123456");
                  setErrorMessage("");
                }}
                className="w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.email} className="bg-slate-800 text-white">
                    {u.name} ({u.role === "admin" ? "Administrador / ADM" : "Operador"}) — {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha de Acesso
                </label>
                <span className="text-[10px] text-blue-400 font-mono">Padrão: 123456</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Information Notice */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-200/90 flex items-start gap-2.5">
              <Info size={16} className="shrink-0 text-blue-400 mt-0.5" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <p>
                  <strong>Segurança no Primeiro Acesso:</strong> Ao logar com a senha padrão <strong>123456</strong>, o sistema exigirá a alteração imediata da senha.
                </p>
                <p className="text-slate-300">
                  <strong>Flavio Brayner (ADM):</strong> Acesso geral completo ao painel de controle e auditoria.
                </p>
                <p className="text-slate-300">
                  <strong>Viviane Rito (Operador):</strong> Acesso restrito a matrículas e documentos (sem dashboard).
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-[0.99]"
            >
              <span>Acessar o Sistema</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-[11px] text-slate-400">
          Governo do Estado de Pernambuco · Secretaria de Educação e Esportes
        </p>
      </div>
    </div>
  );
}
