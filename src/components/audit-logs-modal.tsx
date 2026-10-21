import { useState } from "react";
import { AuditLog } from "../lib/types";
import { ShieldAlert, X, Search, Clock, FileText, CheckCircle2 } from "lucide-react";

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export function AuditLogsModal({ isOpen, onClose, logs }: AuditLogsModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) =>
    `${log.action} ${log.actor} ${log.targetId} ${log.targetName} ${log.details}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <ShieldAlert size={19} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Trilha de Auditoria e Conformidade
              </h3>
              <p className="text-xs text-slate-500">
                Registro inalterável de eventos e ações administrativas
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

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por ação, funcionário, protocolo ou estudante..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                      {log.action}
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-900">
                      {log.targetId}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">— {log.targetName}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock size={12} />
                    {log.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 pl-1">{log.details}</p>
                <div className="mt-1.5 flex items-center gap-2 pl-1 text-[11px] text-slate-400">
                  <span>
                    Ator: <strong className="text-slate-700">{log.actor}</strong>
                  </span>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                Nenhum registro de auditoria encontrado para o filtro.
              </div>
            )}
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
