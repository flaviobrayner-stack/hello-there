import { useState } from "react";
import { UserProfile, UserRole } from "../lib/types";
import { Users, X, Plus, ShieldCheck, UserCheck, UserX, KeyRound } from "lucide-react";

interface AdminUsersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
  onCreateUser: (name: string, email: string, role: UserRole) => Promise<UserProfile>;
  onChangeUserPassword: (id: string, password: string) => Promise<void>;
  onChangeUserRole: (id: string, role: UserRole) => Promise<void>;
  onSetUserActive: (id: string, active: boolean) => Promise<void>;
  currentUser: UserProfile;
}

export function AdminUsersDialog({
  isOpen,
  onClose,
  users,
  onUpdateUsers,
  onCreateUser,
  onChangeUserPassword,
  onChangeUserRole,
  onSetUserActive,
  currentUser,
}: AdminUsersDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("operador");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setBusy(true);
    try {
      const newUser = await onCreateUser(newName.trim(), newEmail.trim(), newRole);
      setNewName(""); setNewEmail(""); setShowAddForm(false);
      setNotice("Convite enviado para " + newUser.email + ". A pessoa deverá usar o link recebido por e-mail para definir a própria senha.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao criar usuário.");
    } finally { setBusy(false); }
  };

  const handleResetPassword = async (id: string) => {
    const password = passwords[id] || "";
    if (password.length < 8) {
      setNotice("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setActionBusyId(id);
    try {
      await onChangeUserPassword(id, password);
      setPasswords((current) => ({ ...current, [id]: "" }));
      setNotice("Senha alterada com sucesso. Informe a nova senha ao usuário por um canal seguro.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleToggleRole = async (id: string, role: UserRole) => {
    if (id === currentUser.id) {
      setNotice("Não é permitido alterar o próprio papel administrativo.");
      return;
    }
    setActionBusyId(id);
    try {
      await onChangeUserRole(id, role);
      setNotice("Permissão do usuário atualizada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível alterar a permissão.");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    if (id === currentUser.id) {
      setNotice("Não é permitido desativar a própria conta em uso.");
      return;
    }
    setActionBusyId(id);
    try {
      await onSetUserActive(id, active);
      setNotice(active ? "Usuário ativado." : "Usuário bloqueado.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível alterar o status.");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
              <Users size={19} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Gestão de Usuários e Permissões (RBAC)
              </h3>
              <p className="text-xs text-slate-500">
                Acesso restrito a Administradores · Políticas de segurança
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {notice && (
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-2.5 text-xs font-semibold text-blue-800 flex justify-between items-center">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} className="hover:underline">
              ✕
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Equipe Administrativa Cadastrada ({users.length})
            </p>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition"
              >
                <Plus size={14} /> Novo Usuário
              </button>
            )}
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddUser}
              className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3"
            >
              <h4 className="font-bold text-blue-950 text-xs uppercase tracking-wide">
                Convidar Novo Funcionário
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nome Completo
                  </label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome do funcionário"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@ete.pe.gov.br"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-400"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Papel de Acesso
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold"
                  >
                    <option value="operador">Operador (Cadastrar, editar, anexar)</option>
                    <option value="admin">Administrador (Acesso total)</option>
                  </select>
                </div>
                <div className="flex items-end gap-2 pt-5">
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-800"
                  >
                    {busy ? "Enviando convite…" : "Enviar convite"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {users.map((u) => {
              const isAdmin = u.role === "admin";
              return (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          isAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        <ShieldCheck size={11} />
                        {isAdmin ? "Administrador" : "Operador"}
                      </span>
                      {!u.active && (
                        <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          Bloqueado
                        </span>
                      )}
                      {u.mustChangePassword && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800" title="Usuário deve alterar a senha padrão no primeiro acesso">
                          Senha Padrão (Pendente Troca)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{u.email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwords[u.id] || ""}
                        onChange={(event) => setPasswords((current) => ({ ...current, [u.id]: event.target.value }))}
                        placeholder="Nova senha (mín. 8)"
                        aria-label={`Nova senha para ${u.name}`}
                        minLength={8}
                        className="w-36 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        disabled={actionBusyId === u.id || (passwords[u.id] || "").length < 8}
                        onClick={() => void handleResetPassword(u.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                        title="Definir nova senha para este usuário"
                      >
                        <KeyRound size={12} /> Alterar senha
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={actionBusyId === u.id || u.id === currentUser.id}
                      onClick={() => void handleToggleRole(u.id, isAdmin ? "operador" : "admin")}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      title="Alterar papel de acesso"
                    >
                      Mudar para {isAdmin ? "Operador" : "Admin"}
                    </button>
                    <button
                      type="button"
                      disabled={actionBusyId === u.id || u.id === currentUser.id}
                      onClick={() => void handleToggleActive(u.id, !u.active)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${
                        u.active
                          ? "border border-rose-200 text-rose-700 hover:bg-rose-50"
                          : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {u.active ? <UserX size={13} /> : <UserCheck size={13} />}
                      {u.active ? "Bloquear" : "Ativar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
