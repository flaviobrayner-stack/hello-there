import { useState, useMemo, useRef } from "react";
import {
  ClipboardCheck,
  UserRound,
  Users,
  ShieldCheck,
  HeartPulse,
  FileCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Printer,
  Save,
  Check,
  Info,
} from "lucide-react";
import {
  StudentInfo,
  QuotaType,
  Shift,
  UserProfile,
  DocumentItem,
  DocumentStatus,
  ParentInfo,
  LegalGuardianInfo,
  HealthInfo,
} from "../lib/types";
import { maskCpf, maskPhone, maskCep, calculateAge, validateCpf } from "../lib/mask";
import { availableCourses, availableCities, standardDocumentList } from "../lib/mock-data";

interface EnrollmentWizardProps {
  currentUser: UserProfile;
  existingStudents: StudentInfo[];
  initialData?: StudentInfo | null;
  onSave: (student: StudentInfo, isDraft: boolean) => void;
  onCancel: () => void;
  onOpenPdf: (student: StudentInfo) => void;
}

const WIZARD_STEPS = [
  { label: "Identificação", hint: "Curso, funcionário e cota", icon: ClipboardCheck },
  { label: "Estudante", hint: "Dados pessoais e endereço", icon: UserRound },
  { label: "Filiação", hint: "Dados de mãe e pai", icon: Users },
  { label: "Responsável", hint: "Responsável legal indicado", icon: ShieldCheck },
  { label: "Saúde", hint: "Saúde e emergência", icon: HeartPulse },
  { label: "Documentos", hint: "Anexos e conferência", icon: FileCheck2 },
  { label: "Revisão", hint: "Conferir e finalizar", icon: CheckCircle2 },
];

export function EnrollmentWizard({
  currentUser,
  existingStudents,
  initialData,
  onSave,
  onCancel,
  onOpenPdf,
}: EnrollmentWizardProps) {
  const [step, setStep] = useState(0);
  const [cpfError, setCpfError] = useState("");
  const [notification, setNotification] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Initial State setup
  const nextProtocol = useMemo(() => {
    if (initialData?.protocol) return initialData.protocol;
    const count = existingStudents.length + 149;
    return `MAT-2026-${String(count).padStart(4, "0")}`;
  }, [existingStudents, initialData]);

  const [student, setStudent] = useState<StudentInfo>(() => {
    if (initialData) return initialData;

    return {
      id: "std-" + Date.now(),
      protocol: nextProtocol,
      academicYear: 2026,
      course: "Administração",
      shift: "Integral",
      isQuota: false,
      quotaType: "Não cotista",
      status: "Rascunho",
      responsibleStaff: currentUser.name,
      createdAt:
        new Date().toLocaleDateString("pt-BR") +
        " " +
        new Date().toLocaleTimeString("pt-BR").slice(0, 5),
      updatedAt: new Date().toLocaleDateString("pt-BR"),

      fullName: "",
      socialName: "",
      cpf: "",
      rg: "",
      rgIssuer: "SDS/PE",
      birthDate: "",
      age: 0,
      placeOfBirth: "Bezerros",
      placeOfBirthUf: "PE",
      gender: "Não informado",
      maritalStatus: "Solteiro(a)",
      phone: "",
      email: "",
      address: "",
      neighborhood: "",
      city: "Bezerros",
      uf: "PE",
      cep: "",
      race: "Parda",
      isPcd: false,
      pcdType: "",
      usesSchoolTransport: false,
      transportType: "Ônibus",
      previousSchool: "",
      previousClass: "",
      yearOfEntry: "",
      uniformSize: "M",
      receivesBolsaFamilia: false,

      mother: {
        status: "Informado",
        name: "",
        cpf: "",
        rg: "",
        rgIssuer: "SDS/PE",
        phone: "",
        address: "",
        email: "",
        occupation: "",
        workplace: "",
        workPhone: "",
      },
      father: {
        status: "Informado",
        name: "",
        cpf: "",
        rg: "",
        rgIssuer: "SDS/PE",
        phone: "",
        address: "",
        email: "",
        occupation: "",
        workplace: "",
        workPhone: "",
      },
      guardian: {
        name: "",
        relationship: "Mãe",
        maritalStatus: "Casada",
        occupation: "",
        cpf: "",
        rg: "",
        rgIssuer: "SDS/PE",
        address: "",
        phone: "",
        email: "",
        isSameAddressAsStudent: true,
      },
      health: {
        hasHealthInsurance: false,
        insuranceName: "",
        indicatedHospital: "",
        hasDrugAllergy: false,
        drugAllergyDetails: "",
        hasControlledMedication: false,
        controlledMedicationDetails: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        useGuardianAsEmergencyContact: false,
        hasOtherHealthCondition: false,
        otherHealthConditionDetails: "",
        bloodType: "Não informado",
      },
      documents: standardDocumentList(),
      termsAccepted: false,
    };
  });

  // Calculate age dynamically
  const calculatedAge = useMemo(() => {
    return calculateAge(student.birthDate);
  }, [student.birthDate]);

  // Handle CPF Change with validation & duplicate check
  const handleCpfChange = (val: string) => {
    const masked = maskCpf(val);
    setStudent((prev) => ({ ...prev, cpf: masked }));

    if (masked.replace(/\D/g, "").length === 11) {
      if (!validateCpf(masked)) {
        setCpfError("CPF inválido segundo dígito verificador.");
        return;
      }
      // Impede nova matrícula para aluno que já possui matrícula concluída.
      const duplicateCompleted = existingStudents.find(
        (s) => s.cpf.replace(/\D/g, "") === masked.replace(/\D/g, "") &&
          s.id !== student.id && s.status === "Concluída",
      );
      if (duplicateCompleted) {
        setCpfError(
          `Este aluno já possui a matrícula concluída ${duplicateCompleted.protocol}. Não é possível criar outro registro ativo.`,
        );
        return;
      }
      setCpfError("");
    } else {
      setCpfError("");
    }
  };

  // Copy Mother to Legal Guardian
  const copyMotherToGuardian = () => {
    setStudent((prev) => ({
      ...prev,
      guardian: {
        name: prev.mother.name,
        relationship: "Mãe",
        maritalStatus: "Casada",
        occupation: prev.mother.occupation,
        cpf: prev.mother.cpf,
        rg: prev.mother.rg,
        rgIssuer: prev.mother.rgIssuer,
        address: prev.mother.address || prev.address,
        phone: prev.mother.phone,
        email: prev.mother.email,
        isSameAddressAsStudent: true,
      },
    }));
    setNotification("Dados da Mãe copiados para o Responsável Legal com sucesso.");
  };

  // Copy Father to Legal Guardian
  const copyFatherToGuardian = () => {
    setStudent((prev) => ({
      ...prev,
      guardian: {
        name: prev.father.name,
        relationship: "Pai",
        maritalStatus: "Casado",
        occupation: prev.father.occupation,
        cpf: prev.father.cpf,
        rg: prev.father.rg,
        rgIssuer: prev.father.rgIssuer,
        address: prev.father.address || prev.address,
        phone: prev.father.phone,
        email: prev.father.email,
        isSameAddressAsStudent: true,
      },
    }));
    setNotification("Dados do Pai copiados para o Responsável Legal com sucesso.");
  };

  // Document status update & simulated upload
  const handleDocumentStatusChange = (docId: string, status: DocumentStatus) => {
    setStudent((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              status,
              submittedAt:
                status === "Entregue" || status === "Conferido"
                  ? new Date().toLocaleDateString("pt-BR")
                  : d.submittedAt,
              verifiedAt:
                status === "Conferido" ? new Date().toLocaleDateString("pt-BR") : d.verifiedAt,
              verifiedBy: status === "Conferido" ? currentUser.name : d.verifiedBy,
            }
          : d,
      ),
    }));
  };


  // Progress Calculation
  const deliveredCount = student.documents.filter(
    (d) => d.status === "Entregue" || d.status === "Conferido",
  ).length;
  const docsPercentage = Math.round((deliveredCount / student.documents.length) * 100);

  // Validation before complete
  const missingFields: string[] = [];
  if (!student.fullName) missingFields.push("Nome do Estudante");
  if (!student.cpf || cpfError) missingFields.push("CPF do Estudante válido");
  if (!student.birthDate) missingFields.push("Data de Nascimento");
  if (!student.guardian.name) missingFields.push("Nome do Responsável Legal");
  if (!student.guardian.cpf) missingFields.push("CPF do Responsável Legal");
  if (!student.guardian.phone) missingFields.push("Telefone do Responsável Legal");

  const handleSave = async (asDraft: boolean) => {
    // Impede que cliques repetidos criem várias matrículas para o mesmo envio.
    if (savingRef.current) return;
    if (!asDraft && missingFields.length > 0) {
      setNotification(`Não é possível concluir. Campos pendentes: ${missingFields.join(", ")}`);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const finalStudent: StudentInfo = {
        ...student,
        age: calculatedAge || student.age,
        status: asDraft ? "Rascunho" : "Concluída",
        updatedAt: new Date().toLocaleDateString("pt-BR"),
      };
      await onSave(finalStudent, asDraft);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50";

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info size={17} />
          <span>{notification}</span>
          <button
            onClick={() => setNotification("")}
            className="ml-auto text-xs font-bold hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        {/* Step Navigation Sidebar */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="px-2 pb-4 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Fluxo da Matrícula 2026
            </span>
            <h2 className="mt-1 text-base font-bold text-slate-900">{student.protocol}</h2>
            <p className="mt-1 text-xs text-slate-500">
              Cadastro oficial · ETE Maria José Vasconcelos
            </p>
          </div>

          <div className="space-y-1">
            {WIZARD_STEPS.map((s, i) => {
              const isCurrent = step === i;
              const isPassed = step > i;
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    isCurrent
                      ? "bg-blue-50 text-blue-800 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                      isCurrent
                        ? "bg-blue-700 text-white shadow-sm"
                        : isPassed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isPassed ? <Check size={15} /> : <s.icon size={15} />}
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold">
                      {i + 1}. {s.label}
                    </span>
                    <span className="block text-[11px] text-slate-400 truncate">{s.hint}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Document Progress indicator */}
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-600 mb-2">
              <span className="font-semibold">Documentação</span>
              <span className="font-bold text-blue-700">{docsPercentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-700 transition-all duration-300"
                style={{ width: `${docsPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              {deliveredCount} de {student.documents.length} documentos entregues
            </p>
          </div>
        </div>

        {/* Wizard Step Content */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header of Step */}
          <div className="border-b border-slate-100 p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-700">
                  Etapa {step + 1} de {WIZARD_STEPS.length}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {WIZARD_STEPS[step]?.label}: {WIZARD_STEPS[step]?.hint}
                </h3>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                {step === 0 && <ClipboardCheck size={20} />}
                {step === 1 && <UserRound size={20} />}
                {step === 2 && <Users size={20} />}
                {step === 3 && <ShieldCheck size={20} />}
                {step === 4 && <HeartPulse size={20} />}
                {step === 5 && <FileCheck2 size={20} />}
                {step === 6 && <CheckCircle2 size={20} />}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-6">
            {/* ETAPA 1: IDENTIFICAÇÃO */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Responsável pela Matrícula *
                    </label>
                    <input
                      value={student.responsibleStaff}
                      onChange={(e) => setStudent((prev) => ({ ...prev, responsibleStaff: e.target.value }))}
                      required
                      placeholder="Nome do funcionário responsável"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Número de Matrícula / Protocolo Único
                    </label>
                    <input
                      value={student.protocol}
                      readOnly
                      className={`${inputClass} bg-slate-50 font-mono font-bold text-blue-900`}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Ano Letivo
                    </label>
                    <input
                      value="2026"
                      disabled
                      className={`${inputClass} bg-slate-50 font-bold`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Curso Técnico *
                    </label>
                    <select
                      value={student.course}
                      onChange={(e) => setStudent((prev) => ({ ...prev, course: e.target.value }))}
                      className={inputClass}
                    >
                      {availableCourses
                        .filter((c) => c.active)
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Turno
                    </label>
                    <select
                      value={student.shift}
                      onChange={(e) =>
                        setStudent((prev) => ({ ...prev, shift: e.target.value as Shift }))
                      }
                      className={inputClass}
                    >
                      <option value="Integral">Integral</option>
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Estudante Cotista? *
                    </label>
                    <select
                      value={student.isQuota ? "Sim" : "Não"}
                      onChange={(e) => {
                        const isQ = e.target.value === "Sim";
                        setStudent((prev) => ({
                          ...prev,
                          isQuota: isQ,
                          quotaType: isQ ? "Escola Pública" : "Não cotista",
                        }));
                      }}
                      className={inputClass}
                    >
                      <option value="Não">Não (Ampla Concorrência)</option>
                      <option value="Sim">Sim (Cota / Ação Afirmativa)</option>
                    </select>
                  </div>
                </div>

                {student.isQuota && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                    <label className="block text-xs font-bold uppercase text-blue-900">
                      Tipo de Cota Declarada *
                    </label>
                    <select
                      value={student.quotaType}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          quotaType: e.target.value as QuotaType,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="Escola Pública">
                        Escola Pública (Ensino Fundamental em Rede Pública)
                      </option>
                      <option value="Renda">Renda Familiar Bruta per capita ≤ 1,5 SM</option>
                      <option value="Vulnerabilidade">Vulnerabilidade Social / CadÚnico</option>
                      <option value="PCD">Pessoa com Deficiência (PCD)</option>
                    </select>
                    <p className="text-xs text-blue-800">
                      {student.quotaType === "Renda" &&
                        "• Exigência obrigatória: Comprovante de renda familiar dos últimos 3 meses."}
                      {student.quotaType === "Vulnerabilidade" &&
                        "• Exigência obrigatória: Folha resumo do CadÚnico / Comprovante de vulnerabilidade."}
                      {student.quotaType === "PCD" &&
                        "• Exigência obrigatória: Laudo médico comprobatório com CID legível."}
                      {student.quotaType === "Escola Pública" &&
                        "• Exigência obrigatória: Ficha 18 comprovando anos fundamentais na rede pública."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 2: DADOS DO ESTUDANTE */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Nome Completo do Estudante *
                    </label>
                    <input
                      value={student.fullName}
                      onChange={(e) =>
                        setStudent((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      placeholder="Conforme certidão ou documento oficial"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Nome Social (se aplicável)
                    </label>
                    <input
                      value={student.socialName || ""}
                      onChange={(e) =>
                        setStudent((prev) => ({ ...prev, socialName: e.target.value }))
                      }
                      placeholder="Identidade de gênero autoidentificada"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      CPF do Estudante *
                    </label>
                    <input
                      value={student.cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      className={`${inputClass} font-mono ${cpfError ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : ""}`}
                    />
                    {cpfError && (
                      <p className="mt-1 text-xs font-semibold text-rose-600">{cpfError}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Sexo
                    </label>
                    <select
                      value={student.gender === "Masculino" || student.gender === "Feminino" ? student.gender : ""}
                      onChange={(e) => setStudent((prev) => ({ ...prev, gender: e.target.value as StudentInfo["gender"] }))}
                      className={inputClass}
                    >
                      <option value="">Selecione</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Cidade de Nascimento do Estudante
                    </label>
                    <input
                      value={student.placeOfBirth || ""}
                      onChange={(e) => setStudent((prev) => ({ ...prev, placeOfBirth: e.target.value }))}
                      placeholder="Cidade onde nasceu"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      RG do Estudante
                    </label>
                    <input
                      value={student.rg}
                      onChange={(e) => setStudent((prev) => ({ ...prev, rg: e.target.value }))}
                      placeholder="Ex: 9.876.543"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Órgão Expedidor / UF
                    </label>
                    <input
                      value={student.rgIssuer}
                      onChange={(e) =>
                        setStudent((prev) => ({ ...prev, rgIssuer: e.target.value }))
                      }
                      placeholder="Ex: SDS/PE"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      value={student.birthDate}
                      onChange={(e) =>
                        setStudent((prev) => ({ ...prev, birthDate: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Idade calculada automaticamente */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-blue-700" />
                    <span className="text-xs text-slate-600">
                      Idade calculada pela data de nascimento:
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    {calculatedAge !== null ? `${calculatedAge} anos` : "Aguardando data"}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Telefone / WhatsApp
                    </label>
                    <input
                      value={student.phone}
                      onChange={(e) =>
                        setStudent((prev) => ({ ...prev, phone: maskPhone(e.target.value) }))
                      }
                      placeholder="(81) 98765-4321"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      E-mail do Estudante
                    </label>
                    <input
                      type="email"
                      value={student.email}
                      onChange={(e) => setStudent((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="estudante@exemplo.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Endereço (Rua, Número, Complemento) *
                    </label>
                    <input
                      value={student.address}
                      onChange={(e) => setStudent((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Ex: Rua Cel. Bezerra, 120, Apto 101"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Bairro
                    </label>
                    <input
                      value={student.neighborhood}
                      onChange={(e) =>
                        setStudent((prev) => ({ ...prev, neighborhood: e.target.value }))
                      }
                      placeholder="Ex: Centro"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Município
                    </label>
                    <select
                      value={student.city}
                      onChange={(e) => setStudent((prev) => ({ ...prev, city: e.target.value }))}
                      className={inputClass}
                    >
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      UF
                    </label>
                    <input value="PE" readOnly className={`${inputClass} bg-slate-50 font-bold`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      CEP
                    </label>
                    <input
                      value={student.cep}
                      onChange={(e) =>
                        setStudent((prev) => ({ ...prev, cep: maskCep(e.target.value) }))
                      }
                      placeholder="55660-000"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Raça / Cor
                    </label>
                    <select
                      value={student.race}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          race: e.target.value as StudentInfo["race"],
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="Parda">Parda</option>
                      <option value="Branca">Branca</option>
                      <option value="Preta">Preta</option>
                      <option value="Amarela">Amarela</option>
                      <option value="Indígena">Indígena</option>
                      <option value="Não declarada">Não declarada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Estudante PCD?
                    </label>
                    <select
                      value={student.isPcd ? "Sim" : "Não"}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          isPcd: e.target.value === "Sim",
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Tamanho da Farda
                    </label>
                    <select
                      value={student.uniformSize}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          uniformSize: e.target.value as StudentInfo["uniformSize"],
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="PP">PP</option>
                      <option value="P">P</option>
                      <option value="M">M</option>
                      <option value="G">G</option>
                      <option value="GG">GG</option>
                      <option value="XG">XG</option>
                    </select>
                  </div>
                </div>

                {student.isPcd && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Especificação da Necessidade Especial / PCD *
                    </label>
                    <input
                      value={student.pcdType || ""}
                      onChange={(e) => setStudent((prev) => ({ ...prev, pcdType: e.target.value }))}
                      placeholder="Descreva a condição com CID ou necessidades em sala de aula"
                      className={inputClass}
                    />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Utiliza Transporte Escolar?
                    </label>
                    <select
                      value={student.usesSchoolTransport ? "Sim" : "Não"}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          usesSchoolTransport: e.target.value === "Sim",
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </select>
                  </div>
                  {student.usesSchoolTransport && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                        Modalidade de Transporte
                      </label>
                      <select
                        value={student.transportType || "Ônibus"}
                        onChange={(e) =>
                          setStudent((prev) => ({
                            ...prev,
                            transportType: e.target.value as "Ônibus" | "Van" | "Outro",
                          }))
                        }
                        className={inputClass}
                      >
                        <option value="Ônibus">Ônibus Escolar</option>
                        <option value="Van">Van Escolar</option>
                        <option value="Outro">Outro Transporte</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Escola de Origem (Ensino Fundamental)
                    </label>
                    <input
                      value={student.previousSchool}
                      onChange={(e) =>
                        setStudent((prev) => ({ ...prev, previousSchool: e.target.value }))
                      }
                      placeholder="Nome da escola anterior"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
Série/Ano anterior
                    </label>
                    <input
                      value={student.previousClass || ""}
                      onChange={(e) => setStudent((prev) => ({ ...prev, previousClass: e.target.value }))}
                      placeholder="Ex.: 9º ano B"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Recebe Bolsa Família?
                    </label>
                    <select
                      value={student.receivesBolsaFamilia ? "Sim" : "Não"}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          receivesBolsaFamilia: e.target.value === "Sim",
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: FILIAÇÃO (MÃE E PAI) */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Bloco Mãe */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 text-sm">1. Dados da Mãe</h4>
                    <select
                      value={student.mother.status}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          mother: {
                            ...prev.mother,
                            status: e.target.value as ParentInfo["status"],
                          },
                        }))
                      }
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold"
                    >
                      <option value="Informado">Informado</option>
                      <option value="Não informado">Não informado</option>
                      <option value="Falecido(a)">Falecida</option>
                      <option value="Não se aplica">Não se aplica</option>
                    </select>
                  </div>

                  {student.mother.status === "Informado" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                          Nome Completo da Mãe
                        </label>
                        <input
                          value={student.mother.name}
                          onChange={(e) =>
                            setStudent((prev) => ({
                              ...prev,
                              mother: { ...prev.mother, name: e.target.value },
                            }))
                          }
                          placeholder="Nome da mãe"
                          className={inputClass}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            CPF da Mãe
                          </label>
                          <input
                            value={student.mother.cpf}
                            onChange={(e) =>
                              setStudent((prev) => ({
                                ...prev,
                                mother: { ...prev.mother, cpf: maskCpf(e.target.value) },
                              }))
                            }
                            placeholder="000.000.000-00"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Telefone da Mãe
                          </label>
                          <input
                            value={student.mother.phone}
                            onChange={(e) =>
                              setStudent((prev) => ({
                                ...prev,
                                mother: { ...prev.mother, phone: maskPhone(e.target.value) },
                              }))
                            }
                            placeholder="(81) 98765-4321"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Endereço da Mãe
                          </label>
                          <input
                            value={student.mother.address}
                            onChange={(e) => setStudent((prev) => ({
                              ...prev,
                              mother: { ...prev.mother, address: e.target.value },
                            }))}
                            placeholder="Endereço residencial da mãe"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            E-mail da Mãe
                          </label>
                          <input
                            type="email"
                            value={student.mother.email}
                            onChange={(e) => setStudent((prev) => ({
                              ...prev,
                              mother: { ...prev.mother, email: e.target.value },
                            }))}
                            placeholder="email@exemplo.com"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Profissão da Mãe
                          </label>
                          <input
                            value={student.mother.occupation}
                            onChange={(e) =>
                              setStudent((prev) => ({
                                ...prev,
                                mother: { ...prev.mother, occupation: e.target.value },
                              }))
                            }
                            placeholder="Profissão"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Local de Trabalho
                          </label>
                          <input
                            value={student.mother.workplace}
                            onChange={(e) =>
                              setStudent((prev) => ({
                                ...prev,
                                mother: { ...prev.mother, workplace: e.target.value },
                              }))
                            }
                            placeholder="Empresa / Estabelecimento"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bloco Pai */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 text-sm">2. Dados do Pai</h4>
                    <select
                      value={student.father.status}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          father: {
                            ...prev.father,
                            status: e.target.value as ParentInfo["status"],
                          },
                        }))
                      }
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold"
                    >
                      <option value="Informado">Informado</option>
                      <option value="Não informado">Não informado</option>
                      <option value="Falecido(a)">Falecido</option>
                      <option value="Não se aplica">Não se aplica</option>
                    </select>
                  </div>

                  {student.father.status === "Informado" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                          Nome Completo do Pai
                        </label>
                        <input
                          value={student.father.name}
                          onChange={(e) =>
                            setStudent((prev) => ({
                              ...prev,
                              father: { ...prev.father, name: e.target.value },
                            }))
                          }
                          placeholder="Nome do pai"
                          className={inputClass}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            CPF do Pai
                          </label>
                          <input
                            value={student.father.cpf}
                            onChange={(e) =>
                              setStudent((prev) => ({
                                ...prev,
                                father: { ...prev.father, cpf: maskCpf(e.target.value) },
                              }))
                            }
                            placeholder="000.000.000-00"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Telefone do Pai
                          </label>
                          <input
                            value={student.father.phone}
                            onChange={(e) =>
                              setStudent((prev) => ({
                                ...prev,
                                father: { ...prev.father, phone: maskPhone(e.target.value) },
                              }))
                            }
                            placeholder="(81) 98765-4321"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Endereço do Pai
                          </label>
                          <input
                            value={student.father.address}
                            onChange={(e) => setStudent((prev) => ({
                              ...prev,
                              father: { ...prev.father, address: e.target.value },
                            }))}
                            placeholder="Endereço residencial do pai"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            E-mail do Pai
                          </label>
                          <input
                            type="email"
                            value={student.father.email}
                            onChange={(e) => setStudent((prev) => ({
                              ...prev,
                              father: { ...prev.father, email: e.target.value },
                            }))}
                            placeholder="email@exemplo.com"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Profissão do Pai
                          </label>
                          <input
                            value={student.father.occupation}
                            onChange={(e) =>
                              setStudent((prev) => ({
                                ...prev,
                                father: { ...prev.father, occupation: e.target.value },
                              }))
                            }
                            placeholder="Profissão"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Local de Trabalho
                          </label>
                          <input
                            value={student.father.workplace}
                            onChange={(e) =>
                              setStudent((prev) => ({
                                ...prev,
                                father: { ...prev.father, workplace: e.target.value },
                              }))
                            }
                            placeholder="Empresa / Estabelecimento"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ETAPA 4: RESPONSÁVEL LEGAL */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 leading-relaxed">
                  <strong>Atenção:</strong> O sistema não presume automaticamente que a mãe é a
                  responsável legal. O termo de compromisso e a concessão de imagem serão emitidos
                  rigorosamente no nome do responsável indicado abaixo.
                </div>

                {/* Quick copy buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 mr-1">
                    Preenchimento Rápido:
                  </span>
                  <button
                    type="button"
                    onClick={copyMotherToGuardian}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Copiar Dados da Mãe
                  </button>
                  <button
                    type="button"
                    onClick={copyFatherToGuardian}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Copiar Dados do Pai
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Nome do Responsável Legal *
                    </label>
                    <input
                      value={student.guardian.name}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          guardian: { ...prev.guardian, name: e.target.value },
                        }))
                      }
                      placeholder="Nome completo do responsável legal"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Grau de Parentesco / Vínculo com o Estudante *
                    </label>
                    <select
                      value={student.guardian.relationship}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          guardian: {
                            ...prev.guardian,
                            relationship: e.target.value as LegalGuardianInfo["relationship"],
                          },
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="Mãe">Mãe</option>
                      <option value="Pai">Pai</option>
                      <option value="Avô/Avó">Avô / Avó</option>
                      <option value="Tio/Tia">Tio / Tia</option>
                      <option value="Tutor Legal">Tutor Legal / Judicial</option>
                      <option value="Outro">Outro Responsável</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      CPF do Responsável *
                    </label>
                    <input
                      value={student.guardian.cpf}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          guardian: { ...prev.guardian, cpf: maskCpf(e.target.value) },
                        }))
                      }
                      placeholder="000.000.000-00"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Telefone Principal *
                    </label>
                    <input
                      value={student.guardian.phone}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          guardian: { ...prev.guardian, phone: maskPhone(e.target.value) },
                        }))
                      }
                      placeholder="(81) 98765-4321"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Profissão
                    </label>
                    <input
                      value={student.guardian.occupation}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          guardian: { ...prev.guardian, occupation: e.target.value },
                        }))
                      }
                      placeholder="Profissão"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      E-mail do Responsável
                    </label>
                    <input
                      value={student.guardian.email}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          guardian: { ...prev.guardian, email: e.target.value },
                        }))
                      }
                      placeholder="responsavel@email.com"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 5: SAÚDE E EMERGÊNCIA */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 leading-relaxed">
                  <strong>Proteção de Dados Sensíveis (LGPD):</strong> Registros de saúde são
                  estritamente confidenciais para apoio a primeiros socorros escolares. Estes dados
                  não são exibidos em listagens gerais.
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Existe algum dado de Saúde do Estudante que deve ser informado à Escola?
                  </label>
                  <select
                    value={student.health.hasOtherHealthCondition ? "Sim" : "Não"}
                    onChange={(e) => setStudent((prev) => ({
                      ...prev,
                      health: {
                        ...prev.health,
                        hasOtherHealthCondition: e.target.value === "Sim",
                        otherHealthConditionDetails: e.target.value === "Não" ? "" : (prev.health.otherHealthConditionDetails || ""),
                      },
                    }))}
                    className={inputClass}
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                  {student.health.hasOtherHealthCondition && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                        Informe os dados de saúde que a escola deve conhecer
                      </label>
                      <textarea
                        value={student.health.otherHealthConditionDetails || ""}
                        onChange={(e) => setStudent((prev) => ({
                          ...prev,
                          health: { ...prev.health, otherHealthConditionDetails: e.target.value },
                        }))}
                        placeholder="Descreva somente as informações necessárias para o cuidado e a segurança do estudante."
                        rows={3}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Possui Seguro / Plano de Saúde?
                    </label>
                    <select
                      value={student.health.hasHealthInsurance ? "Sim" : "Não"}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          health: { ...prev.health, hasHealthInsurance: e.target.value === "Sim" },
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="Não">Não (Utiliza SUS)</option>
                      <option value="Sim">Sim (Possui plano privado)</option>
                    </select>
                  </div>
                  {student.health.hasHealthInsurance && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                        Nome do Plano / Hospital Credenciado
                      </label>
                      <input
                        value={student.health.insuranceName || ""}
                        onChange={(e) =>
                          setStudent((prev) => ({
                            ...prev,
                            health: { ...prev.health, insuranceName: e.target.value },
                          }))
                        }
                        placeholder="Ex: Unimed, Bradesco Saúde, etc."
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Possui Alergia Medicamentosa?
                    </label>
                    <select
                      value={student.health.hasDrugAllergy ? "Sim" : "Não"}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          health: { ...prev.health, hasDrugAllergy: e.target.value === "Sim" },
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </select>
                  </div>
                  {student.health.hasDrugAllergy && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                        Medicamentos que Causam Alergia *
                      </label>
                      <input
                        value={student.health.drugAllergyDetails || ""}
                        onChange={(e) =>
                          setStudent((prev) => ({
                            ...prev,
                            health: { ...prev.health, drugAllergyDetails: e.target.value },
                          }))
                        }
                        placeholder="Ex: Dipirona, Penicilina, etc."
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Utiliza Medicação Controlada?
                    </label>
                    <select
                      value={student.health.hasControlledMedication ? "Sim" : "Não"}
                      onChange={(e) =>
                        setStudent((prev) => ({
                          ...prev,
                          health: {
                            ...prev.health,
                            hasControlledMedication: e.target.value === "Sim",
                          },
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </select>
                  </div>
                  {student.health.hasControlledMedication && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                        Nome da Medicação e Horário *
                      </label>
                      <input
                        value={student.health.controlledMedicationDetails || ""}
                        onChange={(e) =>
                          setStudent((prev) => ({
                            ...prev,
                            health: { ...prev.health, controlledMedicationDetails: e.target.value },
                          }))
                        }
                        placeholder="Nome do remédio e dosagem"
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Tipo Sanguíneo / Fator RH</label>
                    <select value={student.health.bloodType}
                      onChange={(e) => setStudent((prev) => ({ ...prev, health: { ...prev.health, bloodType: e.target.value as HealthInfo["bloodType"] } }))}
                      className={inputClass}>
                      <option value="Não informado">Não informado</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Deseja manter os dados do responsável legal como contato de emergência?</label>
                    <select value={student.health.useGuardianAsEmergencyContact ? "Sim" : "Não"}
                      onChange={(e) => {
                        const useGuardian = e.target.value === "Sim";
                        setStudent((prev) => ({
                          ...prev,
                          health: {
                            ...prev.health,
                            useGuardianAsEmergencyContact: useGuardian,
                            emergencyContactName: useGuardian ? prev.guardian.name : "",
                            emergencyContactPhone: useGuardian ? prev.guardian.phone : "",
                            emergencyContactRelationship: useGuardian
                              ? (prev.guardian.relationship === "Outro" && prev.guardian.relationshipOther ? prev.guardian.relationshipOther : prev.guardian.relationship)
                              : "",
                          },
                        }));
                      }}
                      className={inputClass}>
                      <option value="Não">Não</option><option value="Sim">Sim</option>
                    </select>
                    {student.health.useGuardianAsEmergencyContact && <p className="mt-1 text-xs text-emerald-700">Nome e telefone do responsável legal foram copiados para o contato de emergência.</p>}
                  </div>
                </div>
                {!student.health.useGuardianAsEmergencyContact && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Nome do Contato de Emergência</label>
                      <input value={student.health.emergencyContactName}
                        onChange={(e) => setStudent((prev) => ({ ...prev, health: { ...prev.health, emergencyContactName: e.target.value } }))}
                        placeholder="Pessoa para ligar em emergência" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Telefone de Emergência</label>
                      <input value={student.health.emergencyContactPhone}
                        onChange={(e) => setStudent((prev) => ({ ...prev, health: { ...prev.health, emergencyContactPhone: maskPhone(e.target.value) } }))}
                        placeholder="(81) 98888-0000" className={inputClass} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 6: DOCUMENTOS & UPLOAD */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-blue-950 text-sm">
                      Checklist Oficial de Documentação ({deliveredCount}/{student.documents.length}
                      )
                    </h4>
                    <p className="text-xs text-blue-800 mt-0.5">
                      Marque cada documento como Entregue ou Pendente. Anexos não são obrigatórios para concluir a matrícula.
                    </p>
                  </div>
                  <div className="text-right font-mono font-bold text-blue-900 text-lg">
                    {docsPercentage}%
                  </div>
                </div>

                <div className="space-y-3">
                  {student.documents.map((doc) => {
                    const isDelivered = doc.status === "Entregue" || doc.status === "Conferido";
                    return (
                      <div
                        key={doc.id}
                        className={`rounded-xl border p-4 transition ${
                          isDelivered
                            ? "border-emerald-200 bg-emerald-50/20"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                  isDelivered
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {isDelivered ? <Check size={13} /> : "!"}
                              </span>
                              <span className="font-semibold text-slate-900 text-sm">
                                {doc.name}
                              </span>
                              {doc.isMandatory && (
                                <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                  Obrigatório
                                </span>
                              )}
                            </div>
                            {doc.fileName && (
                              <p className="mt-1 text-xs text-slate-500 pl-8">
                                Arquivo: <strong className="text-slate-700">{doc.fileName}</strong>{" "}
                                ({doc.fileSize})
                              </p>
                            )}
                            {doc.deadline && (
                              <p className="mt-0.5 text-[11px] text-amber-700 pl-8 font-medium">
                                Prazo posterior tolerado: {doc.deadline}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pl-8 sm:pl-0">
                            {/* Status Selector */}
                            <select
                              value={doc.status}
                              onChange={(e) =>
                                handleDocumentStatusChange(doc.id, e.target.value as DocumentStatus)
                              }
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold"
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Entregue">Entregue</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ETAPA 7: REVISÃO */}
            {step === 6 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 p-5 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Resumo Geral da Matrícula 2026
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                        {student.fullName || "Nome não informado"}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {student.protocol} · {student.course} ({student.shift})
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                      {student.quotaType}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">
                        CPF
                      </span>
                      <span className="font-semibold text-slate-800">
                        {student.cpf || "Não informado"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">
                        Nascimento / Idade
                      </span>
                      <span className="font-semibold text-slate-800">
                        {student.birthDate
                          ? `${student.birthDate} (${calculatedAge} anos)`
                          : "Não informado"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">
                        Responsável Legal
                      </span>
                      <span className="font-semibold text-slate-800">
                        {student.guardian.name || "Não informado"} ({student.guardian.relationship})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">
                        Telefone Principal
                      </span>
                      <span className="font-semibold text-slate-800">
                        {student.guardian.phone || student.phone || "Não informado"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">
                        Endereço
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {student.address || "Não informado"}, {student.city}/PE
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[10px]">
                        Documentos Entregues
                      </span>
                      <span className="font-semibold text-slate-800">
                        {deliveredCount} de {student.documents.length} itens
                      </span>
                    </div>
                  </div>
                </div>

                {/* Missing fields alert */}
                {missingFields.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-rose-900 text-sm">
                          Campos Obrigatórios Pendentes ({missingFields.length})
                        </h5>
                        <ul className="mt-1 list-disc pl-4 text-xs text-rose-800 space-y-0.5">
                          {missingFields.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirmation Checkbox */}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={student.termsAccepted}
                    onChange={(e) =>
                      setStudent((prev) => ({ ...prev, termsAccepted: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 accent-blue-700"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    Confirmo a exatidão das informações prestadas nesta matrícula da Escola Técnica
                    Estadual Maria José Vasconcelos. Declaro que o responsável legal indicado foi
                    devidamente cientificado dos termos regimentais e autorizações de saída.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="border-t border-slate-100 p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave(true)}
                className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs ${saving ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <Save size={15} />
                Salvar Rascunho
              </button>

              {/* Converter em PDF */}
              <button
                type="button"
                onClick={() => onOpenPdf(student)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs"
              >
                <Printer size={15} />
                Converter em PDF (Ficha Ok 2026)
              </button>

              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <ChevronLeft size={16} />
                  Voltar
                </button>
              )}

              {step < WIZARD_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-700/20 hover:bg-blue-800 transition"
                >
                  Próxima Etapa
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave(false)}
                  className={`inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition ${saving ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <CheckCircle2 size={16} />
                  Concluir Matrícula
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
