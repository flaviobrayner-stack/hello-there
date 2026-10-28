import { useState } from "react";
import {
  Printer,
  Download,
  CheckCircle2,
  X,
  FileText,
  ShieldCheck,
  Building2,
  HeartPulse,
  Award,
  Copy,
} from "lucide-react";

import { EnrollmentData } from "../lib/types";

interface PdfConverterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: EnrollmentData;
}

type DocType = "ficha" | "comprovante" | "saude" | "termo" | "documentacao";

export function PdfConverterDialog({ isOpen, onClose, enrollment }: PdfConverterDialogProps) {
  const [docType, setDocType] = useState<DocType>("ficha");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const printArea = document.getElementById("printable-pdf-document");
    if (!printArea) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${enrollment.id} - ${enrollment.name} - ${docType.toUpperCase()}</title>
  <style>
    @page { size: A4; margin: 12mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11pt; line-height: 1.4; }
    .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 14pt; margin: 0; color: #1e3a8a; font-weight: bold; text-transform: uppercase; }
    .header h2 { font-size: 11pt; margin: 4px 0 0; color: #334155; font-weight: 600; }
    .header p { font-size: 9pt; margin: 2px 0 0; color: #64748b; }
    .section-title { background: #1e3a8a; color: white; padding: 4px 8px; font-size: 9.5pt; font-weight: bold; text-transform: uppercase; margin-top: 14px; margin-bottom: 8px; border-radius: 3px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
    .field { border: 1px solid #cbd5e1; padding: 6px 8px; border-radius: 4px; background: #fff; }
    .field-label { font-size: 7.5pt; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
    .field-value { font-size: 9.5pt; font-weight: 600; color: #0f172a; }
    .signatures { margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; page-break-inside: avoid; }
    .signature-line { border-top: 1px solid #0f172a; text-align: center; padding-top: 6px; font-size: 8.5pt; color: #334155; }
    .checklist { list-style: none; padding: 0; margin: 0; }
    .checklist li { padding: 4px 0; border-bottom: 1px dashed #e2e8f0; font-size: 8.5pt; display: flex; align-items: center; gap: 6px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 8pt; font-weight: bold; border: 1px solid #cbd5e1; }
  </style>
</head>
<body>
  ${printArea.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Matricula_${enrollment.id}_${docType}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const text = `ESTADO DE PERNAMBUCO - ESCOLA TÉCNICA ESTADUAL MARIA JOSÉ VASCONCELOS
SISTEMA DE MATRÍCULA 2026 - DOCUMENTO OFICIAL
Protocolo: ${enrollment.id}
Estudante: ${enrollment.name}
Curso: ${enrollment.course}
Ano Letivo: 2026
Situação: ${enrollment.status}
Cota: ${enrollment.quota}
Documentos conferidos: ${enrollment.docs}
Data de emissão: ${enrollment.date}
Responsável legal: ${enrollment.guardianName || "Informado no formulário"}
Telefone: ${enrollment.guardianPhone || "(81) 98765-4321"}
Endereço: ${enrollment.address || "Rua Principal, 123, Centro"} - ${enrollment.city || "Bezerros"}/PE`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Actions (do not print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-700/20">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Converter em PDF / Impressão Oficial
              </h2>
              <p className="text-xs text-slate-500">
                Modelo compatível com o documento oficial “Ficha Ok 2026”
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              title="Copiar dados"
            >
              <Copy size={14} />
              {copied ? "Copiado!" : "Copiar"}
            </button>
            <button
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              title="Baixar cópia pronta para PDF"
            >
              <Download size={14} />
              Baixar HTML/PDF
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-800 transition"
            >
              <Printer size={14} />
              Imprimir / Salvar como PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Tabs (do not print) */}
        <div className="no-print flex items-center gap-2 border-b border-slate-200 bg-white px-6 py-2 overflow-x-auto text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] mr-2">
            Documento:
          </span>
          <button
            onClick={() => setDocType("ficha")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              docType === "ficha" ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Ficha de Matrícula (Ficha Ok 2026)
          </button>
          <button
            onClick={() => setDocType("comprovante")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              docType === "comprovante"
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Comprovante de Matrícula
          </button>
          <button
            onClick={() => setDocType("saude")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              docType === "saude" ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Ficha de Saúde
          </button>
          <button
            onClick={() => setDocType("termo")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              docType === "termo" ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Termos & Concessão de Imagem
          </button>
          <button
            onClick={() => setDocType("documentacao")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              docType === "documentacao"
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Protocolo de Documentos
          </button>
        </div>

        {/* Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 print:bg-white print:p-0">
          <div
            id="printable-pdf-document"
            className="print-page mx-auto max-w-[210mm] bg-white p-8 sm:p-10 shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 text-slate-900"
          >
            {/* Official Header */}
            <div className="text-center border-b-2 border-blue-900 pb-3 mb-4">
              <div className="flex items-center justify-center gap-3 mb-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white font-bold text-sm">
                  PE
                </span>
                <div>
                  <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-blue-950">
                    Governo do Estado de Pernambuco
                  </h1>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-700">
                    Secretaria de Educação e Esportes
                  </h2>
                </div>
              </div>
              <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                Escola Técnica Estadual Maria José Vasconcelos — Bezerros/PE
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-[11px] font-bold text-blue-900">
                {docType === "ficha" && "FICHA OFICIAL DE MATRÍCULA — ANO LETIVO 2026"}
                {docType === "comprovante" && "COMPROVANTE OFICIAL DE MATRÍCULA 2026"}
                {docType === "saude" && "FICHA DE SAÚDE E DADOS DE EMERGÊNCIA 2026"}
                {docType === "termo" && "TERMO DE COMPROMISSO EDUCACIONAL E CONCESSÃO DE IMAGEM"}
                {docType === "documentacao" && "PROTOCOLO DE ENTREGA E CONFERÊNCIA DE DOCUMENTOS"}
              </div>
            </div>

            {/* Protocol and Metadata Bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs mb-4">
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                  Protocolo / Número de Matrícula
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">{enrollment.id}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                  Data de Emissão
                </span>
                <span className="font-semibold text-slate-800">{enrollment.date}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                  Situação
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-blue-900">
                  <CheckCircle2 size={13} className="text-blue-700" />
                  {enrollment.status}
                </span>
              </div>
            </div>

            {/* 1. DOCUMENT TYPE: FICHA DE MATRÍCULA (COMPLETE) */}
            {docType === "ficha" && (
              <div className="space-y-4 text-xs">
                {/* 1. Curso & Identificação */}
                <div>
                  <div className="bg-blue-950 text-white font-bold px-2.5 py-1 uppercase text-[11px] rounded tracking-wide mb-2">
                    1. Dados da Matrícula e do Curso
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="border border-slate-200 rounded p-2 bg-white col-span-2">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Curso Técnico
                      </span>
                      <span className="font-bold text-blue-950">{enrollment.course}</span>
                    </div>
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Turno / Cota
                      </span>
                      <span className="font-semibold text-slate-900">{enrollment.quota}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Dados Pessoais */}
                <div>
                  <div className="bg-blue-950 text-white font-bold px-2.5 py-1 uppercase text-[11px] rounded tracking-wide mb-2">
                    2. Dados Pessoais do(a) Estudante
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="border border-slate-200 rounded p-2 bg-white col-span-2 sm:col-span-2">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Nome Completo
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{enrollment.name}</span>
                    </div>
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        CPF
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {enrollment.cpf || "000.000.000-00"}
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Data de Nascimento
                      </span>
                      <span className="font-semibold text-slate-900">
                        {enrollment.birthDate || "15/03/2010"}
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Idade Calculada
                      </span>
                      <span className="font-semibold text-slate-900">
                        {enrollment.age || "16"} anos
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        PCD / Necessidade Especial
                      </span>
                      <span className="font-semibold text-slate-900">
                        {enrollment.pcd || "Não"}
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded p-2 bg-white col-span-2">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Endereço Residencial
                      </span>
                      <span className="font-semibold text-slate-900">
                        {enrollment.address || "Rua Principal, 123, Centro"}
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Município / UF
                      </span>
                      <span className="font-semibold text-slate-900">
                        {enrollment.city || "Bezerros"} / PE
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Filiação & Responsável Legal */}
                <div>
                  <div className="bg-blue-950 text-white font-bold px-2.5 py-1 uppercase text-[11px] rounded tracking-wide mb-2">
                    3. Filiação e Responsabilidade Legal
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Nome da Mãe
                      </span>
                      <span className="font-semibold text-slate-900">
                        {enrollment.motherName || "Maria da Silva"}
                      </span>
                      <div className="mt-1 text-[10px] text-slate-600">
                        Endereço: {enrollment.motherAddress || enrollment.address || "Não Informado"}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        E-mail: {enrollment.motherEmail || "Não Informado"}
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Nome do Pai
                      </span>
                      <span className="font-semibold text-slate-900">
                        {enrollment.fatherName || "José da Silva"}
                      </span>
                      <div className="mt-1 text-[10px] text-slate-600">
                        Endereço: {enrollment.fatherAddress || enrollment.address || "Não Informado"}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        E-mail: {enrollment.fatherEmail || "Não Informado"}
                      </div>
                    </div>
                    <div className="border border-blue-200 bg-blue-50/50 rounded p-2 col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] uppercase font-bold text-blue-900">
                          Responsável Legal Indicado
                        </span>
                        <span className="text-[10px] font-semibold text-blue-800">
                          Vínculo: {enrollment.guardianRelation || "Mãe"}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">
                        {enrollment.guardianName || enrollment.motherName || "Maria da Silva"}
                      </p>
                      <div className="mt-1 flex gap-4 text-[11px] text-slate-600">
                        <span>CPF: {enrollment.guardianCpf || "123.456.789-00"}</span>
                        <span>Telefone: {enrollment.guardianPhone || "(81) 98765-4321"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Saúde & Emergência */}
                <div>
                  <div className="bg-blue-950 text-white font-bold px-2.5 py-1 uppercase text-[11px] rounded tracking-wide mb-2">
                    4. Informações de Saúde e Emergência
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Alergia Medicamentosa
                      </span>
                      <span className="font-semibold text-slate-900">
                        {enrollment.allergy || "Não"}
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Medicação Controlada
                      </span>
                      <span className="font-semibold text-slate-900">
                        {enrollment.medication || "Não"}
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded p-2 bg-white">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        Contato de Emergência
                      </span>
                      <span className="font-semibold text-slate-900">
                        {enrollment.emergencyContact || "(81) 98888-0000"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Documentos Conferidos */}
                <div>
                  <div className="bg-blue-950 text-white font-bold px-2.5 py-1 uppercase text-[11px] rounded tracking-wide mb-2">
                    5. Documentos Apresentados ({enrollment.docs})
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] border border-slate-200 rounded p-3 bg-white">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Certidão de Nascimento
                      / Casamento
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" /> RG e CPF do(a)
                      Estudante
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" /> RG e CPF do(a)
                      Responsável Legal
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Comprovante de
                      Residência Atualizado
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Ficha 18 / Histórico
                      Escolar
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Cartão de Vacina
                      Atualizado
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" /> 02 Fotos 3x4 Recentes
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Comprovante de Cota
                      (se aplicável)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DOCUMENT TYPE: COMPROVANTE */}
            {docType === "comprovante" && (
              <div className="space-y-6 text-xs py-4">
                <div className="border-2 border-dashed border-blue-900 p-6 rounded-xl bg-blue-50/30 text-center">
                  <Award size={36} className="mx-auto text-blue-900 mb-2" />
                  <h3 className="text-base font-extrabold text-blue-950 uppercase">
                    Comprovante Oficial de Matrícula — 2026
                  </h3>
                  <p className="text-slate-600 mt-1 max-w-lg mx-auto">
                    Certificamos que o(a) estudante abaixo identificado(a) encontra-se devidamente
                    cadastrado(a) no Sistema de Matrícula 2026 da Escola Técnica Estadual Maria José
                    Vasconcelos.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 bg-white">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Nome do Estudante
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{enrollment.name}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Protocolo Oficial
                    </span>
                    <span className="font-mono font-bold text-blue-900 text-sm">
                      {enrollment.id}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Curso
                    </span>
                    <span className="font-bold text-slate-800">{enrollment.course}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Data e Hora de Registro
                    </span>
                    <span className="font-semibold text-slate-700">
                      {enrollment.date} - 10:45:12
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Cota / Vaga
                    </span>
                    <span className="font-semibold text-slate-700">{enrollment.quota}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Status da Matrícula
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 size={14} /> {enrollment.status}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-[11px] text-slate-600 leading-relaxed">
                  <p className="font-bold text-slate-800 mb-1">Orientações Importantes:</p>
                  <p>1. Guarde este comprovante para apresentação no primeiro dia letivo.</p>
                  <p>
                    2. O início das aulas está previsto conforme calendário da Secretaria Estadual
                    de Educação.
                  </p>
                  <p>
                    3. Eventuais pendências de documentação devem ser regularizadas na secretaria
                    escolar.
                  </p>
                </div>
              </div>
            )}

            {/* 3. DOCUMENT TYPE: SAÚDE */}
            {docType === "saude" && (
              <div className="space-y-4 text-xs py-2">
                <div className="bg-rose-900 text-white font-bold px-3 py-1.5 uppercase text-[11px] rounded tracking-wide flex items-center gap-2">
                  <HeartPulse size={16} /> Ficha de Saúde Escolar e Atendimento de Emergência
                </div>
                <p className="text-slate-600 text-[11px]">
                  Informações estritamente confidenciais para atendimento médico e primeiros
                  socorros dentro do ambiente escolar, regidas pela LGPD.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded p-3 bg-white">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Estudante
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{enrollment.name}</span>
                  </div>
                  <div className="border border-slate-200 rounded p-3 bg-white">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Tipo Sanguíneo e RH
                    </span>
                    <span className="font-bold text-slate-900">O+ (Positivo)</span>
                  </div>
                  <div className="border border-slate-200 rounded p-3 bg-white">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Alergias Diagnosticadas
                    </span>
                    <span className="font-semibold text-slate-900">
                      {enrollment.allergy === "Sim"
                        ? "Alergia especificada em laudo"
                        : "Nenhuma alergia relatada"}
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded p-3 bg-white">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Uso Contínuo de Medicamento
                    </span>
                    <span className="font-semibold text-slate-900">
                      {enrollment.medication === "Sim"
                        ? "Medicação contínua controlada"
                        : "Não faz uso regular"}
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded p-3 bg-white col-span-2">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Contatos Autorizados para Emergência Médica
                    </span>
                    <p className="font-semibold text-slate-800 mt-1">
                      1º Contato: {enrollment.guardianName || "Responsável Legal"} - Telefone:{" "}
                      {enrollment.guardianPhone || "(81) 98765-4321"}
                    </p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      2º Contato / Hospital de Referência: Hospital Regional de Bezerros / UPA
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. DOCUMENT TYPE: TERMOS & IMAGEM */}
            {docType === "termo" && (
              <div className="space-y-4 text-xs py-2 leading-relaxed">
                <div className="bg-blue-950 text-white font-bold px-3 py-1.5 uppercase text-[11px] rounded tracking-wide">
                  Termo de Compromisso Educacional e Autorização de Uso de Imagem
                </div>

                <div className="border border-slate-200 rounded p-4 bg-white space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px]">
                    Cláusula 1ª — Do Compromisso Educacional
                  </h4>
                  <p className="text-slate-700 text-[11px] text-justify">
                    Pelo presente instrumento, o(a) estudante e seu(sua) responsável legal declaram
                    conhecer e aceitar as normas regimentais da Escola Técnica Estadual Maria José
                    Vasconcelos, comprometendo-se com a frequência mínima exigida por lei, zelo pelo
                    patrimônio escolar e cumprimento do calendário pedagógico do ano letivo de 2026.
                  </p>

                  <h4 className="font-bold text-slate-900 uppercase text-[11px] pt-2">
                    Cláusula 2ª — Da Concessão de Imagem e Som de Voz
                  </h4>
                  <p className="text-slate-700 text-[11px] text-justify">
                    Autorizo a captação e veiculação gratuita da imagem e voz do(a) estudante
                    exclusivamente para fins pedagógicos, institucionais e de divulgação de projetos
                    educacionais da Escola e da Secretaria de Educação de Pernambuco, sem fins
                    comerciais.
                  </p>

                  <h4 className="font-bold text-slate-900 uppercase text-[11px] pt-2">
                    Cláusula 3ª — Da Veracidade das Declarações
                  </h4>
                  <p className="text-slate-700 text-[11px] text-justify">
                    Declaro, sob as penas da lei (art. 299 do Código Penal), que todas as
                    informações e documentos apresentados nesta matrícula são autênticos e
                    correspondem fielmente à verdade.
                  </p>
                </div>
              </div>
            )}

            {/* 5. DOCUMENT TYPE: PROTOCOLO DE DOCUMENTAÇÃO */}
            {docType === "documentacao" && (
              <div className="space-y-4 text-xs py-2">
                <div className="bg-blue-950 text-white font-bold px-3 py-1.5 uppercase text-[11px] rounded tracking-wide">
                  Protocolo de Documentação Escolar e Checklist de Entrega
                </div>
                <div className="border border-slate-200 rounded p-4 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase text-[9px]">
                        <th className="py-2">Item</th>
                        <th className="py-2">Documento</th>
                        <th className="py-2">Situação</th>
                        <th className="py-2">Conferência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 font-mono text-slate-400">01</td>
                        <td className="py-2 font-semibold">Certidão de Nascimento ou Casamento</td>
                        <td className="py-2 text-emerald-700 font-bold">Entregue</td>
                        <td className="py-2 text-slate-500">Conferido original</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-slate-400">02</td>
                        <td className="py-2 font-semibold">RG e CPF do Estudante</td>
                        <td className="py-2 text-emerald-700 font-bold">Entregue</td>
                        <td className="py-2 text-slate-500">Cópia autenticada</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-slate-400">03</td>
                        <td className="py-2 font-semibold">RG e CPF do Responsável Legal</td>
                        <td className="py-2 text-emerald-700 font-bold">Entregue</td>
                        <td className="py-2 text-slate-500">Cópia arquivada</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-slate-400">04</td>
                        <td className="py-2 font-semibold">Duas fotos 3x4 recentes</td>
                        <td className="py-2 text-emerald-700 font-bold">Entregue</td>
                        <td className="py-2 text-slate-500">Anexadas à ficha</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-slate-400">05</td>
                        <td className="py-2 font-semibold">Comprovante de Residência Atualizado</td>
                        <td className="py-2 text-emerald-700 font-bold">Entregue</td>
                        <td className="py-2 text-slate-500">Com CEP legível</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-slate-400">06</td>
                        <td className="py-2 font-semibold">Cartão de Vacinação Atualizado</td>
                        <td className="py-2 text-emerald-700 font-bold">Entregue</td>
                        <td className="py-2 text-slate-500">Conferido</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-slate-400">07</td>
                        <td className="py-2 font-semibold">
                          Ficha 18 (Histórico Escolar Fundamental)
                        </td>
                        <td className="py-2 text-emerald-700 font-bold">Entregue</td>
                        <td className="py-2 text-slate-500">Original arquivado</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-slate-400">08</td>
                        <td className="py-2 font-semibold">Comprovante de Cotista / Renda / PCD</td>
                        <td className="py-2 text-blue-700 font-semibold">Conforme cota</td>
                        <td className="py-2 text-slate-500">Validado pela comissão</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Official Signatures Section (Always present on all official print documents) */}
            <div className="mt-8 pt-4 border-t border-slate-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-[10px] text-slate-600">
                <div>
                  <div className="border-t border-slate-800 pt-1.5 mt-8 font-semibold text-slate-900">
                    Assinatura do(a) Estudante
                  </div>
                  <p className="text-[9px] text-slate-500">{enrollment.name}</p>
                </div>
                <div>
                  <div className="border-t border-slate-800 pt-1.5 mt-8 font-semibold text-slate-900">
                    Assinatura do(a) Responsável Legal
                  </div>
                  <p className="text-[9px] text-slate-500">
                    {enrollment.guardianName || "Responsável Legal"}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="border-t border-slate-800 pt-1.5 mt-8 font-semibold text-slate-900">
                    Secretaria Escolar / Matrícula
                  </div>
                  <p className="text-[9px] text-slate-500">Carimbo e Assinatura</p>
                </div>
              </div>

              {/* Security & Verification Footer */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-3 text-[9px] text-slate-400">
                <div className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-blue-900" />
                  <span>Documento gerado eletronicamente pelo Sistema de Matrícula 2026</span>
                </div>
                <div className="mt-1 sm:mt-0 font-mono">
                  Autenticação: {enrollment.id}-ETE2026-OK
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info (no print) */}
        <div className="no-print border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            Pressione <strong>Ctrl + P</strong> (ou <strong>Cmd + P</strong>) para salvar
            diretamente como PDF no navegador.
          </span>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
