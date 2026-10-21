import { useState } from "react";
import { UserProfile } from "../lib/types";
import { LockKeyhole, KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle2, X } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  isForced: boolean;
  user: UserProfile;
  onSave: (newPassword: string) => void;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  isForced,
  user,
  onSave,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState(isForced ? "123456" : "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (!isForced) {
      const storedPass = user.password || "123456";
      if (currentPassword !== storedPass) {
        setError("A senha atual informada está incorreta.");
        return;
      }
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (newPassword === "123456") {
      setError("A nova senha não pode ser igual à senha padrão (123456). Escolha uma senha segura.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A confirmação não coincide com a nova senha digitada.");
      return;
    }

    onSave(newPassword);
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isForced ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${
              isForced ? "bg-amber-600" : "bg-blue-700"
            }`}>
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isForced ? "Primeiro Acesso: Alteração de Senha" : "Alterar Minha Senha"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {user.name} ({user.role === "admin" ? "Administrador" : "Operador"})
              </p>
            </div>
          </div>
          {!isForced && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isForced ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert size={18} className="shrink-0 text-amber-700 mt-0.5" />
              <div>
                <strong className="block font-semibold">Alteração Obrigatória de Segurança</strong>
                Olá, {user.name}! Como este é seu primeiro acesso com a senha padrão (<strong>123456</strong>), você precisa cadastrar uma nova senha pessoal antes de acessar o sistema.
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Digite sua senha atual e escolha uma nova senha de no mínimo 6 dígitos para sua conta.
            </p>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <ShieldAlert size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!isForced && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nova Senha (mínimo 6 caracteres)
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha segura"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite novamente a nova senha"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              required
              minLength={6}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            {!isForced && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className={`rounded-xl px-5 py-2 text-xs font-bold text-white transition shadow-sm ${
                isForced
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                  : "bg-blue-700 hover:bg-blue-800 shadow-blue-700/20"
              }`}
            >
              Salvar Nova Senha {isForced ? "e Acessar" : ""}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
