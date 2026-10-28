export type UserRole = "admin" | "operador";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatar?: string;
  createdAt: string;
  password?: string;
  mustChangePassword?: boolean;
}

export type Shift = "Manhã" | "Tarde" | "Noite" | "Integral";
export type QuotaType = "Não cotista" | "Escola Pública" | "Renda" | "Vulnerabilidade" | "PCD";

export type EnrollmentStatus = "Concluída" | "Em análise" | "Rascunho" | "Cancelada";

export type DocumentType =
  | "certidao_nascimento"
  | "rg_cpf_estudante"
  | "rg_cpf_responsavel"
  | "ficha_matricula"
  | "duas_fotos_3x4"
  | "comprovante_residencia"
  | "cartao_vacina"
  | "ficha_18"
  | "comprovante_renda"
  | "comprovante_vulnerabilidade";

export type DocumentStatus = "Pendente" | "Entregue" | "Conferido" | "Recusado" | "Não se aplica";

export interface DocumentItem {
  id: string;
  type: DocumentType;
  name: string;
  status: DocumentStatus;
  fileName?: string | undefined;
  fileSize?: string | undefined;
  fileUrl?: string | undefined;
  submittedAt?: string | undefined;
  verifiedAt?: string | undefined;
  verifiedBy?: string | undefined;
  notes?: string | undefined;
  deadline?: string | undefined;
  isMandatory: boolean;
  blocksCompletion: boolean;
}

export interface ParentInfo {
  status: "Informado" | "Não informado" | "Falecido(a)" | "Não se aplica";
  name: string;
  cpf: string;
  rg: string;
  rgIssuer: string;
  phone: string;
  address: string;
  email: string;
  occupation: string;
  workplace: string;
  workPhone: string;
}

export interface LegalGuardianInfo {
  name: string;
  relationship: "Mãe" | "Pai" | "Avô/Avó" | "Tio/Tia" | "Tutor Legal" | "Outro";
  relationshipOther?: string;
  maritalStatus: string;
  occupation: string;
  cpf: string;
  rg: string;
  rgIssuer: string;
  address: string;
  phone: string;
  email: string;
  isSameAddressAsStudent: boolean;
}

export interface HealthInfo {
  hasHealthInsurance: boolean;
  insuranceName?: string;
  indicatedHospital?: string;
  hasDrugAllergy: boolean;
  drugAllergyDetails?: string;
  hasControlledMedication: boolean;
  controlledMedicationDetails?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  useGuardianAsEmergencyContact?: boolean;
  hasOtherHealthCondition: boolean;
  otherHealthConditionDetails?: string;
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Não informado";
}

export interface StudentInfo {
  id: string;
  protocol: string; // Ex: MAT-2026-0148
  academicYear: 2026;
  course: string;
  shift: Shift;
  isQuota: boolean;
  quotaType: QuotaType;
  status: EnrollmentStatus;
  responsibleStaff: string;
  createdAt: string;
  updatedAt: string;

  // Dados Pessoais
  fullName: string;
  socialName?: string;
  cpf: string;
  rg: string;
  rgIssuer: string;
  nisNumber?: string | undefined;
  birthDate: string; // YYYY-MM-DD
  age: number;
  placeOfBirth: string;
  placeOfBirthUf: string;
  gender: "Masculino" | "Feminino" | "Outro" | "Não informado";
  maritalStatus: string;
  phone: string;
  email: string;
  address: string;
  neighborhood: string;
  city: string;
  uf: string;
  cep: string;
  race: "Branca" | "Preta" | "Parda" | "Amarela" | "Indígena" | "Não declarada";
  isPcd: boolean;
  pcdType?: string;
  usesSchoolTransport: boolean;
  transportType?: "Ônibus" | "Van" | "Outro";
  previousSchool: string;
  previousClass?: string;
  yearOfEntry?: string;
  uniformSize: "PP" | "P" | "M" | "G" | "GG" | "XG";
  receivesBolsaFamilia: boolean;

  // Filiação
  mother: ParentInfo;
  father: ParentInfo;

  // Responsável Legal
  guardian: LegalGuardianInfo;

  // Saúde
  health: HealthInfo;

  // Documentos
  documents: DocumentItem[];

  // Termos
  termsAccepted: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  targetId: string;
  targetName: string;
  timestamp: string;
  details: string;
}

export interface GeneratedDocumentRecord {
  id: string;
  enrollmentId: string;
  studentName: string;
  documentType:
    | "Pacote Completo"
    | "Ficha de Matrícula"
    | "Comprovante de Matrícula"
    | "Ficha de Saúde"
    | "Termo de Imagem e Voz"
    | "Resumo de Contato"
    | "Termo de Compromisso";
  templateVersion: string;
  googleDocUrl: string;
  pdfUrl?: string;
  generatedAt: string;
  generatedBy: string;
  status: "Concluído" | "Processando" | "Erro";
  errorMessage?: string;
}

export type EnrollmentData = {
  id: string;
  name: string;
  course: string;
  date: string;
  status: "Concluída" | "Em análise" | "Rascunho" | "Cancelada";
  quota: string;
  docs: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  age?: string;
  gender?: string;
  race?: string;
  motherName?: string;
  motherStatus?: string;
  motherAddress?: string;
  motherEmail?: string;
  fatherName?: string;
  fatherStatus?: string;
  fatherAddress?: string;
  fatherEmail?: string;
  previousClass?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianCpf?: string;
  guardianPhone?: string;
  address?: string;
  city?: string;
  cep?: string;
  pcd?: string;
  pcdType?: string;
  transport?: string;
  allergy?: string;
  allergyType?: string;
  medication?: string;
  medicationName?: string;
  emergencyContact?: string;
};

export function studentToEnrollmentData(s: StudentInfo): EnrollmentData {
  const delivered = s.documents.filter(
    (d) => d.status === "Entregue" || d.status === "Conferido",
  ).length;
  const total = s.documents.length;
  return {
    id: s.protocol || s.id || "MAT-2026-0000",
    name: s.fullName,
    course: s.course,
    date: s.createdAt.split(" ")[0] || "21/10/2026",
    status: s.status,
    quota: s.isQuota ? s.quotaType : "Não cotista",
    docs: `${delivered}/${total}`,
    cpf: s.cpf || "000.000.000-00",
    rg: s.rg || "9.876.543",
    birthDate: s.birthDate || "15/03/2009",
    age: String(s.age || "17"),
    gender: s.gender,
    race: s.race,
    motherName: s.mother.name || "Mãe do Estudante",
    motherStatus: s.mother.status,
    motherAddress: s.mother.address || "",
    motherEmail: s.mother.email || "",
    fatherName: s.father.name || "Pai do Estudante",
    fatherStatus: s.father.status,
    fatherAddress: s.father.address || "",
    fatherEmail: s.father.email || "",
    previousClass: s.previousClass || "",
    guardianName: s.guardian.name || "Responsável Legal",
    guardianRelation: s.guardian.relationship,
    guardianCpf: s.guardian.cpf || "123.456.789-00",
    guardianPhone: s.guardian.phone || "(81) 98765-4321",
    address: s.address || "Rua Principal, 123",
    city: s.city || "Bezerros",
    cep: s.cep || "55660-000",
    pcd: s.isPcd ? "Sim" : "Não",
    pcdType: s.pcdType || "",
    transport: s.usesSchoolTransport ? "Sim" : "Não",
    allergy: s.health.hasDrugAllergy ? "Sim" : "Não",
    allergyType: s.health.drugAllergyDetails || "",
    medication: s.health.hasControlledMedication ? "Sim" : "Não",
    medicationName: s.health.controlledMedicationDetails || "",
    emergencyContact: s.health.emergencyContactName
      ? `${s.health.emergencyContactName} (${s.health.emergencyContactPhone})`
      : "(81) 98765-4321",
  };
}
