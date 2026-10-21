import { useState } from "react";
import { StudentInfo, DocumentItem, DocumentStatus, UserProfile } from "../lib/types";
import {
  FileCheck,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Check,
  Ban,
} from "lucide-react";

interface DocumentConferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentInfo;
  currentUser: UserProfile;
  onUpdateStudent: (updatedStudent: StudentInfo) => void;
}

export function DocumentConferenceModal({
  isOpen,
  onClose,
  student,
  currentUser,
  onUpdateStudent,
}: DocumentConferenceModalProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(student.documents);
  const [notice, setNotice] = useState("");

  if (!isOpen) return null;

  const handleStatusChange = (docId: string, newStatus: DocumentStatus, notes?: string) => {
    const updated = documents.map((doc) => {
      if (doc.id !== docId) return doc;
      const today = new Date().toLocaleDateString("pt-BR");
      return {
        ...doc,
        status: newStatus,
        verifiedAt: newStatus === "Conferido" ? today : doc.verifiedAt,
        verifiedBy: newStatus === "Conferido" ? currentUser.name : doc.verifiedBy,
        notes: notes !== undefined ? notes : doc.notes,
      };
    });
    setDocuments(updated);
  };

  const handleSaveAll = () => {
    const updatedStudent: StudentInfo = {
      ...student,
      documents,
      updatedAt: new Date().toLocaleDateString("pt-BR"),
    };
    onUpdateStudent(updatedStudent);
    onClose();
  };

  const deliveredCount = documents.filter(
    (d) => d.status === "Entregue" || d.status === "Conferido",
  ).length;
  const verifiedCount = documents.filter((d) => d.status === "Conferido").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
              <FileCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Conferência de Documentos da Matrícula
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {student.protocol} — {student.fullName} ({student.course})
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

        {/* Stats bar */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              Entregues:{" "}
              <strong>
                {deliveredCount}/{documents.length}
              </strong>
            </span>
            <span>
              Conferidos: <strong className="text-emerald-700">{verifiedCount}</strong>
            </span>
          </div>
          <span className="font-semibold text-slate-500">Conferente atual: {currentUser.name}</span>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {documents.map((doc) => {
            const isVerified = doc.status === "Conferido";
            const isDelivered = doc.status === "Entregue";
            const isRejected = doc.status === "Recusado";

            return (
              <div
                key={doc.id}
                className={`rounded-xl border p-4 transition ${
                  isVerified
                    ? "border-emerald-200 bg-emerald-50/20"
                    : isRejected
                      ? "border-rose-200 bg-rose-50/20"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{doc.name}</span>
                      {doc.isMandatory && (
                        <span className="rounded bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5">
                          Obrigatório
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isVerified
                            ? "bg-emerald-100 text-emerald-800"
                            : isDelivered
                              ? "bg-blue-100 text-blue-800"
                              : isRejected
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {doc.submittedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> Entregue em: {doc.submittedAt}
                        </span>
                      )}
                      {doc.verifiedBy && (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <Check size={12} /> Conferido por: {doc.verifiedBy} ({doc.verifiedAt})
                        </span>
                      )}
                      {doc.deadline && (
                        <span className="flex items-center gap-1 text-amber-700 font-semibold">
                          <Clock size={12} /> Prazo: {doc.deadline}
                        </span>
                      )}
                    </div>

                    {/* Observações */}
                    <div className="mt-2">
                      <input
                        value={doc.notes || ""}
                        onChange={(e) => handleStatusChange(doc.id, doc.status, e.target.value)}
                        placeholder="Observação da secretaria sobre o documento..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-400"
                      />
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(doc.id, "Conferido")}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      title="Aprovar e marcar como Conferido"
                    >
                      <Check size={14} /> Conferido
                    </button>
                    <button
                      onClick={() => handleStatusChange(doc.id, "Recusado")}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
                      title="Recusar documento com pendência"
                    >
                      <Ban size={14} /> Recusar
                    </button>
                    <button
                      onClick={() => handleStatusChange(doc.id, "Pendente")}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      title="Retornar a Pendente"
                    >
                      Pendente
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveAll}
            className="rounded-xl bg-blue-700 px-5 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow"
          >
            Salvar Conferência
          </button>
        </div>
      </div>
    </div>
  );
}
