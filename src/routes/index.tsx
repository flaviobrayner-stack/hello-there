import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
  AlertCircle,
  CircleHelp,
  Printer,
  History,
  ShieldAlert,
  Edit,
  Eye,
  FileCheck,
  UserCheck,
  Trash2,
} from "lucide-react";

import {
  StudentInfo,
  UserProfile,
  AuditLog,
  GeneratedDocumentRecord,
  EnrollmentData,
  studentToEnrollmentData,
} from "../lib/types";
import {
  initialStudents,
  initialUsers,
  initialAuditLogs,
  initialGeneratedDocuments,
  availableCourses,
} from "../lib/mock-data";
import { maskCpfPrivate } from "../lib/mask";
import { DashboardCharts } from "../components/dashboard-charts";
import { EnrollmentWizard } from "../components/enrollment-wizard";
import { AdminUsersDialog } from "../components/admin-users-dialog";
import { AuditLogsModal } from "../components/audit-logs-modal";
import { DocumentConferenceModal } from "../components/document-conference-modal";
import {
  EnrollmentDocumentPreview,
  type EnrollmentDocumentData,
} from "../components/enrollment-document-preview";

export const Route = createFileRoute("/")({
  component: Index,
});

type Section =
  "dashboard" | "matriculas" | "nova" | "saude-emergencia" | "documentos" | "documentos-gerados" | "configuracoes";

function StatusBadge({ status }: { status: StudentInfo["status"] }) {
  const styles = {
    Concluída: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Em análise": "bg-amber-50 text-amber-700 ring-amber-200",
    Rascunho: "bg-slate-100 text-slate-600 ring-slate-200",
    Cancelada: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || styles["Rascunho"]
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  note: string;
  icon: typeof Users;
  tone?: "blue" | "green" | "amber" | "violet" | "rose";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function toEnrollmentDocumentPreviewData(s: StudentInfo): EnrollmentDocumentData {
  const blood = s.health.bloodType || "Não informado";
  const bloodType = blood === "Não informado" ? "" : blood.slice(0, -1);
  const rhFactor = blood.endsWith("+") ? "POSITIVO" : blood.endsWith("-") ? "NEGATIVO" : "";
  const raw = {
    student: s.fullName,
    socialName: s.socialName,
    cpf: s.cpf,
    rg: s.rg,
    rgIssuer: s.rgIssuer,
    birth: s.birthDate,
    sex: s.gender,
    phone: s.phone,
    email: s.email,
    address: s.address,
    neighborhood: s.neighborhood,
    city: s.city,
    state: s.uf,
    cep: s.cep,
    race: s.race,
    pcd: s.isPcd ? "Sim" : "Não",
    pcdType: s.pcdType,
    transport: s.usesSchoolTransport ? "Sim" : "Não",
    transportType: s.transportType,
    schoolOrigin: s.previousSchool,
    shirtSize: s.uniformSize,
    bolsaFamilia: s.receivesBolsaFamilia ? "Sim" : "Não",
    course: s.course,
    quota: s.quotaType,
    cotista: s.isQuota ? "Sim" : "Não",
    mother: s.mother.name,
    motherCpf: s.mother.cpf,
    motherRg: s.mother.rg,
    motherRgIssuer: s.mother.rgIssuer,
    motherPhone: s.mother.phone,
    motherEmail: s.mother.email,
    motherOccupation: s.mother.occupation,
    motherWorkplace: s.mother.workplace,
    motherWorkPhone: s.mother.workPhone,
    father: s.father.name,
    fatherCpf: s.father.cpf,
    fatherRg: s.father.rg,
    fatherRgIssuer: s.father.rgIssuer,
    fatherPhone: s.father.phone,
    fatherEmail: s.father.email,
    fatherOccupation: s.father.occupation,
    fatherWorkplace: s.father.workplace,
    fatherWorkPhone: s.father.workPhone,
    guardian: s.guardian.name,
    guardianRelation: s.guardian.relationship,
    guardianCpf: s.guardian.cpf,
    healthInsurance: s.health.hasHealthInsurance ? "Sim" : "Não",
    hospital: s.health.insuranceName,
    familyHospital: s.health.indicatedHospital,
    allergy: s.health.hasDrugAllergy ? "Sim" : "Não",
    allergyDetails: s.health.drugAllergyDetails,
    medication: s.health.hasControlledMedication ? "Sim" : "Não",
    medicationDetails: s.health.controlledMedicationDetails,
    bloodType,
    rhFactor,
    emergencyContact: s.health.emergencyContactPhone,
    emergencyName: s.health.emergencyContactName,
    emergencyRelation: s.health.emergencyContactRelationship,
    healthNotes: s.health.hasOtherHealthCondition ? "Sim" : "Não",
    healthNotesDetails: s.health.otherHealthConditionDetails,
  };
  // Com exactOptionalPropertyTypes, campos sem valor são omitidos em vez de
  // receberem undefined explicitamente.
  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== undefined),
  ) as EnrollmentDocumentData;
}

function Index() {
  // App State
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [currentUserId, setCurrentUserId] = useState<string>("usr-admin-1");
  const [students, setStudents] = useState<StudentInfo[]>(initialStudents);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [generatedDocs, setGeneratedDocs] =
    useState<GeneratedDocumentRecord[]>(initialGeneratedDocuments);

  // Navigation & Filtering
  const [section, setSection] = useState<Section>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [healthSearch, setHealthSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quotaFilter, setQuotaFilter] = useState("all");

  // Selection & Editing
  const [editingStudent, setEditingStudent] = useState<StudentInfo | null>(null);
  const [conferencingStudent, setConferencingStudent] = useState<StudentInfo | null>(null);
  const [studentPendingDeletion, setStudentPendingDeletion] = useState<StudentInfo | null>(null);

  // Modals
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [selectedPdfEnrollment, setSelectedPdfEnrollment] = useState<EnrollmentData>(() =>
    studentToEnrollmentData(initialStudents[0]!),
  );
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  // App Settings (Configurações)
  const [settings, setSettings] = useState({
    protocolFormat: "MAT-2026-XXXX",
    googleDriveFolderId: "1ete-maria-jose-vasconcelos-2026-drive-folder",
    blockers: ["certidao_nascimento", "rg_cpf_estudante", "rg_cpf_responsavel"],
    ficha18GracePeriod: true,
    mandatoryImageTerm: true,
    bundleMode: "pacote_unico", // ou "arquivos_separados"
    field373Title: "Responsável Financeiro Adicional / Contato Secundário",
  });

  // Current logged in user object
  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0]!;
  }, [users, currentUserId]);

  const isAdmin = currentUser.role === "admin";

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        `${s.protocol} ${s.fullName} ${s.cpf} ${s.course} ${s.status} ${s.guardian.name}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCourse = courseFilter === "all" || s.course === courseFilter;
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesQuota = quotaFilter === "all" || s.quotaType === quotaFilter;

      return matchesSearch && matchesCourse && matchesStatus && matchesQuota;
    });
  }, [students, search, courseFilter, statusFilter, quotaFilter]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const total = students.length;
    const concluidas = students.filter((s) => s.status === "Concluída").length;
    const analise = students.filter((s) => s.status === "Em análise").length;
    const rascunhos = students.filter((s) => s.status === "Rascunho").length;
    const cotistas = students.filter((s) => s.isQuota).length;
    const naoCotistas = total - cotistas;

    let semFotos = 0;
    let semFicha18 = 0;
    let docsCompletos = 0;

    students.forEach((s) => {
      const delivered = s.documents.filter(
        (d) => d.status === "Entregue" || d.status === "Conferido",
      ).length;
      if (delivered === s.documents.length) docsCompletos++;

      const fotoDoc = s.documents.find((d) => d.type === "duas_fotos_3x4");
      if (fotoDoc && fotoDoc.status === "Pendente") semFotos++;

      const f18Doc = s.documents.find((d) => d.type === "ficha_18");
      if (f18Doc && f18Doc.status === "Pendente") semFicha18++;
    });

    return {
      total,
      concluidas,
      analise,
      rascunhos,
      cotistas,
      naoCotistas,
      semFotos,
      semFicha18,
      docsCompletos,
      docsPendentes: total - docsCompletos,
    };
  }, [students]);

  // Handle Save / Update Student
  const handleSaveStudent = (savedStudent: StudentInfo, isDraft: boolean) => {
    const exists = students.some((s) => s.id === savedStudent.id);
    let updatedList: StudentInfo[];

    if (exists) {
      updatedList = students.map((s) => (s.id === savedStudent.id ? savedStudent : s));
    } else {
      updatedList = [savedStudent, ...students];
    }

    setStudents(updatedList);
    setEditingStudent(null);
    setSection("matriculas");

    // Add Audit Log
    const newLog: AuditLog = {
      id: "log-" + Date.now(),
      action: isDraft ? "Salvamento de Rascunho" : "Conclusão de Matrícula",
      actor: currentUser.name,
      targetId: savedStudent.protocol,
      targetName: savedStudent.fullName,
      timestamp:
        new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
      details: isDraft
        ? `Rascunho atualizado com ${savedStudent.documents.filter((d) => d.status === "Entregue").length} documentos`
        : `Matrícula concluída no curso de ${savedStudent.course}`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    setNotice(
      isDraft
        ? `Rascunho de ${savedStudent.fullName} salvo com sucesso.`
        : `Matrícula ${savedStudent.protocol} (${savedStudent.fullName}) concluída com sucesso!`,
    );
  };

  // Excluir matrícula após confirmação explícita do usuário.
  const handleDeleteStudent = (student: StudentInfo) => {
    setStudents((prev) => prev.filter((item) => item.id !== student.id));
    setGeneratedDocs((prev) => prev.filter((doc) => doc.enrollmentId !== student.protocol));
    setAuditLogs((prev) => [
      {
        id: "log-" + Date.now(),
        action: "Exclusão de Matrícula",
        actor: currentUser.name,
        targetId: student.protocol,
        targetName: student.fullName,
        timestamp: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
        details: "Matrícula removida após confirmação do usuário.",
      },
      ...prev,
    ]);
    if (editingStudent?.id === student.id) setEditingStudent(null);
    if (conferencingStudent?.id === student.id) setConferencingStudent(null);
    setStudentPendingDeletion(null);
    setNotice(`Matrícula ${student.protocol} — ${student.fullName} excluída.`);
  };

  // Open PDF for a student
  const handleOpenPdfForStudent = (s: StudentInfo) => {
    setSelectedPdfEnrollment(studentToEnrollmentData(s));
    setPdfDialogOpen(true);

    // Record generation
    const newGen: GeneratedDocumentRecord = {
      id: "gdoc-" + Date.now(),
      enrollmentId: s.protocol,
      studentName: s.fullName,
      documentType: "Pacote Completo",
      templateVersion: "Ficha Ok 2026 v1.2",
      googleDocUrl: `https://docs.google.com/document/d/mock-${s.protocol}/edit`,
      pdfUrl: `https://drive.google.com/file/d/mock-${s.protocol}.pdf/view`,
      generatedAt:
        new Date().toLocaleDateString("pt-BR") +
        " " +
        new Date().toLocaleTimeString("pt-BR").slice(0, 5),
      generatedBy: currentUser.name,
      status: "Concluído",
    };
    setGeneratedDocs((prev) => [newGen, ...prev]);
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      "Protocolo",
      "Nome",
      "CPF (Mascarado)",
      "Curso",
      "Turno",
      "Cota",
      "Status",
      "Data",
      "Responsavel_Legal",
      "Telefone",
    ];

    const rows = filteredStudents.map((s) => [
      s.protocol,
      `"${s.fullName}"`,
      s.cpf ? maskCpfPrivate(s.cpf) : "Nao informado",
      `"${s.course}"`,
      s.shift,
      `"${s.quotaType}"`,
      s.status,
      s.createdAt.split(" ")[0],
      `"${s.guardian.name}"`,
      s.guardian.phone,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Matriculas_ETE_2026_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotice(`${filteredStudents.length} registros exportados para CSV com CPF protegido.`);
  };

  // Navigation Items
  const navItems = [
    { id: "dashboard" as const, label: "Visão geral", icon: LayoutDashboard },
    { id: "matriculas" as const, label: "Matrículas", icon: GraduationCap },
    { id: "saude-emergencia" as const, label: "Pesquisa de Saúde e Emergência", icon: HeartPulse },
    { id: "documentos" as const, label: "Documentação oficial", icon: FileText },
    {
      id: "documentos-gerados" as const,
      label: "Documentos gerados",
      icon: History,
    },
    { id: "configuracoes" as const, label: "Configurações", icon: Settings2 },
  ];

  const title =
    section === "dashboard"
      ? "Painel Administrativo"
      : section === "matriculas"
        ? "Gestão de Matrículas"
        : section === "nova"
          ? editingStudent
            ? `Editar Matrícula: ${editingStudent.protocol}`
            : "Nova Matrícula 2026"
          : section === "saude-emergencia"
          ? "Pesquisa de Saúde e Emergência"
          : section === "documentos"
            ? "Central de Documentação (Ficha Ok 2026)"
            : section === "documentos-gerados"
              ? "Histórico de Documentos Gerados"
              : "Configurações do Sistema";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[84px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/20">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">
              Matrícula <span className="text-blue-700">2026</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">ETE Maria José Vasconcelos</p>
          </div>
          <button
            onClick={() => setMobileMenu(false)}
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-4 pt-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Menu principal
          </p>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSection(item.id);
                  setEditingStudent(null);
                  setMobileMenu(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  section === item.id
                    ? "bg-blue-50 text-blue-800 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon size={18} />
                {item.label}
                {item.id === "matriculas" && (
                  <span className="ml-auto rounded-md bg-white px-2 py-0.5 text-xs text-slate-500 border border-slate-200">
                    {students.length}
                  </span>
                )}
                {item.id === "documentos-gerados" && (
                  <span className="ml-auto rounded-md bg-white px-2 py-0.5 text-xs text-slate-500 border border-slate-200">
                    {generatedDocs.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Admin Tools Shortcut */}
        <div className="px-4 pt-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Controle & Auditoria
          </p>
          <div className="mt-2 space-y-1">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setUsersDialogOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Users size={16} /> Gestão de Usuários
                </button>
                <button
                  onClick={() => setAuditModalOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <ShieldAlert size={16} /> Logs de Auditoria ({auditLogs.length})
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-500">
                <span className="font-bold block text-slate-700">Modo Operador</span>
                Usuários e auditoria restritos ao perfil Admin.
              </div>
            )}
          </div>
        </div>

        {/* Current User & Role Switcher */}
        <div className="mt-auto p-4 border-t border-slate-100">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                Simulação de Papel
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  isAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                }`}
              >
                {currentUser.role}
              </span>
            </div>

            <select
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
              className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="min-h-screen lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Início</span>
                <span>/</span>
                <span className="font-medium text-slate-600">{title}</span>
              </div>
              <h1 className="mt-0.5 text-lg font-bold tracking-tight">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick action: Converter em PDF */}
            <button
              onClick={() => {
                if (students[0]) handleOpenPdfForStudent(students[0]);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs"
              title="Converter matrícula selecionada em PDF"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Converter em</span> PDF
            </button>

            {/* Nova matrícula button */}
            {section !== "nova" && (
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setSection("nova");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-700/20 hover:bg-blue-800 transition"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Nova Matrícula</span>
              </button>
            )}

            <div className="hidden h-9 w-px bg-slate-200 sm:block" />

            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 capitalize">
                {currentUser.role === "admin"
                  ? "Administrador do Sistema"
                  : "Operador de Matrícula"}
              </p>
            </div>
          </div>
        </header>

        {/* Body Container */}
        <div className="mx-auto max-w-[1440px] p-4 sm:p-7 lg:p-10">
          {/* Notifications */}
          {notice && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 shadow-xs">
              <CheckCircle2 size={17} className="shrink-0" />
              <span>{notice}</span>
              <button
                className="ml-auto text-xs font-bold hover:underline"
                onClick={() => setNotice("")}
              >
                Dispensar
              </button>
            </div>
          )}

          {/* 1. SECTION: DASHBOARD */}
          {section === "dashboard" && (
            <div className="space-y-7">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Ano Letivo 2026 · Painel Administrativo Seguro
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-slate-900">
                    Visão Geral das Matrículas
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                    Acompanhamento em tempo real de matrículas, cotas afirmativas, conferência de
                    documentos e alertas de pendências.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingStudent(null);
                      setSection("nova");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/15 hover:bg-blue-800 transition"
                  >
                    <Plus size={18} />
                    Nova matrícula
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <ArrowDownToLine size={16} />
                    Exportar CSV
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Total de Matrículas"
                  value={metrics.total}
                  note={`${metrics.concluidas} concluídas · ${metrics.analise} em análise`}
                  icon={GraduationCap}
                  tone="blue"
                />
                <MetricCard
                  label="Documentação Completa"
                  value={metrics.docsCompletos}
                  note={`${Math.round((metrics.docsCompletos / (metrics.total || 1)) * 100)}% das matrículas 100% conferidas`}
                  icon={CheckCircle2}
                  tone="green"
                />
                <MetricCard
                  label="Alunos sem Fotos 3×4"
                  value={metrics.semFotos}
                  note="Alerta: Fotos pendentes de entrega"
                  icon={FileCheck2}
                  tone="amber"
                />
                <MetricCard
                  label="Alunos sem Ficha 18"
                  value={metrics.semFicha18}
                  note="Histórico fundamental com prazo"
                  icon={Clock3}
                  tone="rose"
                />
              </div>

              {/* Recharts Analytics */}
              <DashboardCharts students={students} />

              {/* Tabela de Matrículas Recentes */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 p-5 gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">Matrículas Recentes Cadastradas</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Últimos registros submetidos pela equipe escolar
                    </p>
                  </div>
                  <button
                    onClick={() => setSection("matriculas")}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Ver todas as {students.length} matrículas <ArrowRight size={15} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Protocolo / Estudante</th>
                        <th className="px-4 py-3">Curso</th>
                        <th className="px-4 py-3">Cota</th>
                        <th className="px-4 py-3">Documentos</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.slice(0, 5).map((s) => {
                        const delivered = s.documents.filter(
                          (d) => d.status === "Entregue" || d.status === "Conferido",
                        ).length;
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-800">{s.fullName}</p>
                              <p className="mt-0.5 text-xs text-slate-400 font-mono">
                                {s.protocol} · CPF: {maskCpfPrivate(s.cpf)}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{s.course}</td>
                            <td className="px-4 py-4">
                              <span className="text-xs font-semibold text-slate-700">
                                {s.quotaType}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-bold text-slate-800">
                                {delivered}/{s.documents.length}
                              </span>
                              <span className="ml-1 text-xs text-slate-400">entregues</span>
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={s.status} />
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenPdfForStudent(s)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                  title="Converter em PDF / Imprimir"
                                >
                                  <Printer size={13} />
                                  PDF
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingStudent(s);
                                    setSection("nova");
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  title="Editar"
                                >
                                  <Edit size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. SECTION: MATRÍCULAS LIST WITH ADVANCED FILTERS */}
          {section === "matriculas" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Registros de Matrículas</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Consulta, busca, filtros de cotas e conferência individual de documentos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingStudent(null);
                      setSection("nova");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-700/20 hover:bg-blue-800 transition"
                  >
                    <Plus size={16} /> Nova Matrícula
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <ArrowDownToLine size={15} /> Exportar
                  </button>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, CPF (completo ou parcial), protocolo ou responsável legal..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Filtrar por Curso
                    </label>
                    <select
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium"
                    >
                      <option value="all">Todos os Cursos</option>
                      {availableCourses.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Filtrar por Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="Concluída">Concluída</option>
                      <option value="Em análise">Em análise</option>
                      <option value="Rascunho">Rascunho</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Filtrar por Cota
                    </label>
                    <select
                      value={quotaFilter}
                      onChange={(e) => setQuotaFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium"
                    >
                      <option value="all">Todas as Cotas</option>
                      <option value="Não cotista">Não cotista</option>
                      <option value="Escola Pública">Escola Pública</option>
                      <option value="Renda">Renda</option>
                      <option value="Vulnerabilidade">Vulnerabilidade</option>
                      <option value="PCD">PCD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3.5">Protocolo / Estudante</th>
                        <th className="px-4 py-3.5">Curso & Turno</th>
                        <th className="px-4 py-3.5">Cota</th>
                        <th className="px-4 py-3.5">Documentos</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Ações Oficiais</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((s) => {
                        const delivered = s.documents.filter(
                          (d) => d.status === "Entregue" || d.status === "Conferido",
                        ).length;
                        const pct = Math.round((delivered / s.documents.length) * 100);

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900">{s.fullName}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                                <span>{s.protocol}</span>
                                <span>·</span>
                                <span>CPF: {maskCpfPrivate(s.cpf)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-semibold text-slate-800">{s.course}</p>
                              <p className="text-xs text-slate-500">{s.shift}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-medium text-xs text-slate-700">
                                {s.quotaType}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className="h-full rounded-full bg-blue-700"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-700">{pct}%</span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {delivered}/{s.documents.length} itens
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={s.status} />
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Converter em PDF */}
                                <button
                                  onClick={() => handleOpenPdfForStudent(s)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs"
                                  title="Converter em PDF / Imprimir"
                                >
                                  <Printer size={13} />
                                  PDF
                                </button>

                                {/* Conferência de Documentos */}
                                <button
                                  onClick={() => setConferencingStudent(s)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
                                  title="Conferir Documentos"
                                >
                                  <FileCheck size={13} />
                                  Conferir
                                </button>

                                {/* Editar */}
                                <button
                                  onClick={() => {
                                    setEditingStudent(s);
                                    setSection("nova");
                                  }}
                                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition"
                                  title="Editar Matrícula"
                                >
                                  <Edit size={14} />
                                </button>
                                {/* Excluir — disponível para qualquer usuário; exige confirmação */}
                                <button
                                  onClick={() => setStudentPendingDeletion(s)}
                                  className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-700 hover:bg-rose-50 transition"
                                  title="Excluir Matrícula"
                                  aria-label={`Excluir matrícula ${s.protocol}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredStudents.length === 0 && (
                    <div className="p-10 text-center text-xs text-slate-500">
                      Nenhuma matrícula encontrada com os filtros informados.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pesquisa de saúde e emergência — consulta os dados já cadastrados na matrícula */}
          {section === "saude-emergencia" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
                    <HeartPulse size={25} />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Pesquisa de Saúde e Emergência</h2>
                    <p className="mt-1 text-sm text-slate-600">Pesquise um aluno para consultar informações de saúde e localizar o contato de emergência.</p>
                  </div>
                </div>
                <div className="relative mt-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={healthSearch}
                    onChange={(e) => setHealthSearch(e.target.value)}
                    placeholder="Digite nome, número da matrícula ou CPF..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    aria-label="Pesquisar aluno para consulta de saúde e emergência"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">Informações exibidas conforme os dados disponíveis no cadastro.</p>
              </div>

              {(() => {
                const query = healthSearch.trim().toLocaleLowerCase("pt-BR");
                const matches = query
                  ? students.filter((student) =>
                      [student.fullName, student.socialName || "", student.protocol, student.cpf]
                        .some((value) => value.toLocaleLowerCase("pt-BR").includes(query)),
                    )
                  : [];
                if (!query) {
                  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <Search className="mx-auto text-slate-300" size={30} />
                    <p className="mt-3 text-sm font-semibold text-slate-700">Pesquise um aluno para começar</p>
                    <p className="mt-1 text-xs text-slate-500">Digite pelo menos parte do nome, matrícula ou CPF.</p>
                  </div>;
                }
                if (matches.length === 0) {
                  return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Nenhum aluno encontrado para essa pesquisa.</div>;
                }
                return <div className="space-y-4">
                  <p className="text-sm text-slate-500">{matches.length} aluno(s) encontrado(s)</p>
                  {matches.map((student) => (
                    <article key={student.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">{student.fullName}</h3>
                          <p className="mt-1 text-xs text-slate-500">Matrícula: {student.protocol} · Curso: {student.course}</p>
                        </div>
                        <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{student.status}</span>
                      </div>
                      <div className="grid gap-5 p-5 md:grid-cols-2">
                        <section className="space-y-3">
                          <h4 className="flex items-center gap-2 font-bold text-slate-800"><HeartPulse size={17} className="text-rose-600" /> Informações de saúde</h4>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Tipo sanguíneo</p>
                            <p className="mt-1 font-semibold text-slate-800">{student.health.bloodType || "Não informado"}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Alergia a medicamentos</p>
                            <p className="mt-1 font-semibold text-slate-800">{student.health.hasDrugAllergy ? "Sim" : "Não informado"}</p>
                            {student.health.hasDrugAllergy && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{student.health.drugAllergyDetails || "Detalhes não informados"}</p>}
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Medicamento de uso controlado</p>
                            <p className="mt-1 font-semibold text-slate-800">{student.health.hasControlledMedication ? "Sim" : "Não informado"}</p>
                            {student.health.hasControlledMedication && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{student.health.controlledMedicationDetails || "Detalhes não informados"}</p>}
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Outras condições de saúde</p>
                            <p className="mt-1 font-semibold text-slate-800">{student.health.hasOtherHealthCondition ? "Sim" : "Não informado"}</p>
                            {student.health.hasOtherHealthCondition && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{student.health.otherHealthConditionDetails || "Detalhes não informados"}</p>}
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Plano de saúde / hospital indicado</p>
                            <p className="mt-1 font-semibold text-slate-800">{student.health.hasHealthInsurance ? (student.health.insuranceName || "Plano informado, sem nome cadastrado") : "Não informado"}</p>
                            {student.health.indicatedHospital && <p className="mt-1 text-sm text-slate-700">Hospital: {student.health.indicatedHospital}</p>}
                          </div>
                        </section>
                        <section className="space-y-3">
                          <h4 className="flex items-center gap-2 font-bold text-slate-800"><AlertCircle size={17} className="text-amber-600" /> Contato de emergência</h4>
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-xs text-amber-800">Nome do contato</p>
                            <p className="mt-1 font-bold text-slate-900">{student.health.emergencyContactName || "Não informado"}</p>
                            <p className="mt-3 text-xs text-amber-800">Parentesco</p>
                            <p className="mt-1 font-semibold text-slate-800">{student.health.emergencyContactRelationship || "Não informado"}</p>
                            <p className="mt-3 text-xs text-amber-800">Telefone para emergência</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">{student.health.emergencyContactPhone || "Não informado"}</p>
                            {student.health.emergencyContactPhone && <a href={`tel:${student.health.emergencyContactPhone.replace(/[^+\\d]/g, "")}`} className="mt-3 inline-flex items-center rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700">Ligar para contato</a>}
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Responsável legal</p>
                            <p className="mt-1 font-semibold text-slate-800">{student.guardian.name || "Não informado"}</p>
                            <p className="mt-1 text-sm text-slate-600">{student.guardian.phone || "Telefone não informado"}</p>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-500">Uso restrito à equipe autorizada. Confirme as informações com o responsável antes de tomar decisões; esta tela não substitui atendimento profissional de saúde.</p>
                        </section>
                      </div>
                    </article>
                  ))}
                </div>;
              })()}
            </div>
          )}

          {/* 3. SECTION: NOVA MATRÍCULA / EDIÇÃO (WIZARD) */}
          {section === "nova" && (
            <EnrollmentWizard
              currentUser={currentUser}
              existingStudents={students}
              initialData={editingStudent}
              onSave={handleSaveStudent}
              onCancel={() => {
                setEditingStudent(null);
                setSection("matriculas");
              }}
              onOpenPdf={handleOpenPdfForStudent}
            />
          )}

          {/* 4. SECTION: CENTRAL DE DOCUMENTAÇÃO (8 MODELOS OFICIAIS) */}
          {section === "documentos" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-blue-50 p-3 text-blue-700 shadow-sm">
                  <FileText size={24} />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Central de Documentação Oficial (“Ficha Ok 2026”)
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-3xl">
                    O documento oficial Google Docs “Ficha Ok 2026” permanece 100% intacto como
                    modelo matriz. A automação preenche as 8 seções correspondentes por meio de
                    marcadores únicos.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    id: "1",
                    title: "Ficha de Matrícula",
                    desc: "Identificação completa do estudante, curso, cota, filiação e endereço.",
                  },
                  {
                    id: "2",
                    title: "Observações Gerais",
                    desc: "Histórico de anotações da secretaria, autorizações de saída e observações escolares.",
                  },
                  {
                    id: "3",
                    title: "Documentação para Matrícula",
                    desc: "Checklist com conferência de RG, CPF, Certidão, Fotos 3x4 e Ficha 18.",
                  },
                  {
                    id: "4",
                    title: "Comprovante de Matrícula",
                    desc: "Canhoto oficial com protocolo gerado, código de autenticidade e carimbo escolar.",
                  },
                  {
                    id: "5",
                    title: "Ficha de Saúde Escolar",
                    desc: "Dados clínicos confidenciais, alergias, medicações, tipo sanguíneo e contatos de emergência.",
                  },
                  {
                    id: "6",
                    title: "Instrumento de Concessão de Imagem e Som da Voz",
                    desc: "Termo assinado pelo responsável legal para projetos pedagógicos sem fins comerciais.",
                  },
                  {
                    id: "7",
                    title: "Resumo de Contato e Filiação",
                    desc: "Contatos telefônicos e endereços de trabalho da mãe, do pai e do responsável legal.",
                  },
                  {
                    id: "8",
                    title: "Termo de Compromisso Educacional",
                    desc: "Compromisso formal com o regimento escolar da ETE Maria José Vasconcelos e declaração sob as penas da lei.",
                  },
                ].map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-900">
                          {doc.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">{doc.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Modelo “Ficha Ok 2026”
                      </span>
                      <button
                        onClick={() => {
                          if (students[0]) handleOpenPdfForStudent(students[0]);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs"
                      >
                        <Printer size={13} /> Converter em PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Box de Preservação */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
                <div className="flex items-start gap-3">
                  <CircleHelp size={20} className="text-blue-900 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-blue-950 text-sm">
                      Garantia de Não-Alteração do Modelo Google Docs Matriz
                    </h4>
                    <p className="text-xs text-blue-900 leading-relaxed">
                      O sistema cria uma nova cópia no Google Drive a cada matrícula concluída,
                      substituindo marcadores como <code>{"{{NUMERO_MATRICULA}}"}</code> e{" "}
                      <code>{"{{NOME_ESTUDANTE}}"}</code>, assegurando que o arquivo original "Ficha
                      Ok 2026" nunca seja modificado ou sobrescrito.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. SECTION: DOCUMENTOS GERADOS */}
          {section === "documentos-gerados" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Histórico de Documentos Gerados
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Versões geradas a partir do modelo “Ficha Ok 2026”. Versões anteriores nunca são
                  excluídas.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Protocolo / Estudante</th>
                      <th className="px-4 py-3">Tipo de Documento</th>
                      <th className="px-4 py-3">Versão do Modelo</th>
                      <th className="px-4 py-3">Gerado Por</th>
                      <th className="px-4 py-3">Data e Hora</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {generatedDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          {doc.enrollmentId} — {doc.studentName}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{doc.documentType}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {doc.templateVersion}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{doc.generatedBy}</td>
                        <td className="px-4 py-3 text-slate-500">{doc.generatedAt}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              const s = students.find((st) => st.protocol === doc.enrollmentId);
                              if (s) handleOpenPdfForStudent(s);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
                          >
                            <Printer size={12} /> Abrir PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. SECTION: CONFIGURAÇÕES ADMINISTRATIVAS */}
          {section === "configuracoes" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Configurações Administrativas do Sistema
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Parâmetros de negócio e integração que podem ser ajustados pela equipe gestora
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Formato do Número de Matrícula
                    </label>
                    <input
                      value={settings.protocolFormat}
                      onChange={(e) => setSettings({ ...settings, protocolFormat: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono font-bold"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Padrão atual: <code>MAT-2026-XXXX</code> com sequência unívoca no servidor.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Pasta de Destino no Google Drive (ID)
                    </label>
                    <input
                      value={settings.googleDriveFolderId}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          googleDriveFolderId: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      ID seguro da pasta institucional onde as cópias preenchidas são salvas.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Tolerância de Prazo para Ficha 18
                    </label>
                    <select
                      value={settings.ficha18GracePeriod ? "Sim" : "Não"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          ficha18GracePeriod: e.target.value === "Sim",
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold"
                    >
                      <option value="Sim">Sim (Permite entregar após início das aulas)</option>
                      <option value="Não">Não (Exige Ficha 18 para concluir)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Termo de Concessão de Imagem
                    </label>
                    <select
                      value={settings.mandatoryImageTerm ? "Obrigatorio" : "Facultativo"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          mandatoryImageTerm: e.target.value === "Obrigatorio",
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold"
                    >
                      <option value="Obrigatorio">Obrigatório para matrícula</option>
                      <option value="Facultativo">Facultativo (Opt-in)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Campo 3.7.3 do Formulário Oficial (Resolução da Pendência)
                  </label>
                  <input
                    value={settings.field373Title}
                    onChange={(e) => setSettings({ ...settings, field373Title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Definido conforme homologação da secretaria escolar da ETE Maria José
                    Vasconcelos.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setNotice("Configurações administrativas salvas com sucesso.")}
                    className="rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-800 transition"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>Escola Técnica Estadual Maria José Vasconcelos · Gestão de Matrículas 2026</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-700" />
              Sistema Protegido com Controle RBAC e Privacidade LGPD
            </span>
          </footer>
        </div>
      </main>

      {/* Confirmação de exclusão da matrícula */}
      {studentPendingDeletion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-enrollment-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                <AlertCircle size={21} />
              </div>
              <div>
                <h2 id="delete-enrollment-title" className="text-base font-bold text-slate-900">Tem certeza que deseja excluir esta matrícula?</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Você está prestes a excluir a matrícula <strong>{studentPendingDeletion.protocol}</strong> de <strong>{studentPendingDeletion.fullName}</strong>. Esta ação não poderá ser desfeita nesta tela.
                </p>
                <p className="mt-2 text-xs text-rose-700">Os documentos gerados associados também serão removidos desta lista.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setStudentPendingDeletion(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={() => handleDeleteStudent(studentPendingDeletion)} className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-800">Sim, excluir matrícula</button>
            </div>
          </div>
        </div>
      )}

      {/* Prévia imprimível baseada no PDF oficial anexado. O conteúdo é preenchido com o cadastro selecionado. */}
      {pdfDialogOpen && (() => {
        const selectedStudent = students.find((student) => student.protocol === selectedPdfEnrollment.id) || students[0];
        if (!selectedStudent) return null;
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4">
            <div className="mx-auto my-4 max-w-5xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Documentos da matrícula — Ficha Ok 2026</h2>
                  <p className="text-xs text-slate-500">Prévia dos documentos para conferência e impressão; revise antes de assinar ou utilizar oficialmente.</p>
                </div>
                <button type="button" onClick={() => setPdfDialogOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Fechar</button>
              </div>
              <EnrollmentDocumentPreview data={toEnrollmentDocumentPreviewData(selectedStudent)} />
            </div>
          </div>
        );
      })()}

      {/* Admin Users Modal */}
      <AdminUsersDialog
        isOpen={usersDialogOpen}
        onClose={() => setUsersDialogOpen(false)}
        users={users}
        onUpdateUsers={(u) => {
          setUsers(u);
          setNotice("Usuários atualizados com sucesso.");
        }}
        currentUser={currentUser}
      />

      {/* Audit Logs Modal */}
      <AuditLogsModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        logs={auditLogs}
      />

      {/* Document Conference Modal */}
      {conferencingStudent && (
        <DocumentConferenceModal
          isOpen={!!conferencingStudent}
          onClose={() => setConferencingStudent(null)}
          student={conferencingStudent}
          currentUser={currentUser}
          onUpdateStudent={(updated) => {
            setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setNotice(`Conferência de documentos de ${updated.fullName} salva com sucesso.`);
          }}
        />
      )}
    </div>
  );
}
