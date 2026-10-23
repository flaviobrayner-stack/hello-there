import type { StudentInfo, UserProfile } from "./types";

const SUPABASE_URL = (import.meta.env['VITE_SUPABASE_URL'] as string | undefined) || "https://oreeyfyidnhpkwnxubpw.supabase.co";
const SUPABASE_KEY = (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined) || "sb_publishable_r9HALBJWZKnLe_vy060umg_B9s7JKwA";
const SESSION_KEY = "matricula2026.supabase.session";
const APP_URL = "https://matriculaetemjv.lovable.app";

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string; email?: string };
}

export class SupabaseConfigError extends Error {
  constructor(message: string) { super(message); this.name = "SupabaseConfigError"; }
}

function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new SupabaseConfigError("Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY nas variáveis de ambiente do projeto.");
  }
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_KEY };
}

export function getStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as SupabaseSession : null;
  } catch { return null; }
}

function storeSession(session: SupabaseSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token || key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.text();
  const data = body ? JSON.parse(body) : null;
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || `Erro Supabase (${response.status})`;
    throw new Error(String(message));
  }
  return data as T;
}

export async function signIn(email: string, password: string): Promise<{ session: SupabaseSession; profile: UserProfile }> {
  const auth = await request<SupabaseSession>("/auth/v1/token?grant_type=password", {
    method: "POST", body: JSON.stringify({ email: email.trim(), password }),
  });
  storeSession(auth);
  try {
    const rows = await request<Array<{ id: string; full_name: string; email: string; role: "admin" | "operador"; active: boolean }>>(
      "/rest/v1/profiles?select=id,full_name,email,role,active&id=eq." + encodeURIComponent(auth.user.id) + "&limit=1",
      {}, auth.access_token,
    );
    const row = rows[0];
    if (!row || !row.active || !["admin", "operador"].includes(row.role)) {
      storeSession(null);
      throw new Error("Usuário autenticado, mas sem perfil ativo autorizado. Peça ao administrador para provisionar seu perfil.");
    }
    return {
      session: auth,
      profile: { id: row.id, name: row.full_name, email: row.email, role: row.role, active: row.active, createdAt: new Date().toISOString() },
    };
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("sem perfil ativo"))) storeSession(null);
    throw error;
  }
}


export async function consumeAuthRedirect(): Promise<{ session: SupabaseSession; type: string } | null> {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type") || "";
  if (!accessToken || !refreshToken || !["invite", "recovery", "signup"].includes(type)) return null;
  const { url, key } = config();
  const response = await fetch(url + "/auth/v1/user", {
    headers: { apikey: key, Authorization: "Bearer " + accessToken },
  });
  const user = await response.json();
  if (!response.ok || !user?.id) throw new Error("O link de convite expirou ou é inválido. Peça um novo convite ao administrador.");
  const session: SupabaseSession = {
    access_token: accessToken,
    refresh_token: refreshToken,
    ...(Number(params.get("expires_at") || 0) ? { expires_at: Number(params.get("expires_at")) } : {}),
    user: { id: user.id, email: user.email },
  };
  storeSession(session);
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return { session, type };
}

export async function updatePassword(session: SupabaseSession, password: string) {
  const { url, key } = config();
  const response = await fetch(url + "/auth/v1/user", {
    method: "PUT",
    headers: { apikey: key, Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || "Não foi possível definir a senha.");
  return data;
}

export async function sendPasswordRecovery(email: string, redirectTo: string) {
  await request("/auth/v1/recover", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), redirect_to: redirectTo }),
  });
}

export async function signOut(session: SupabaseSession | null) {
  try { if (session) await request("/auth/v1/logout", { method: "POST" }, session.access_token); }
  finally { storeSession(null); }
}

export async function getProfile(session: SupabaseSession): Promise<UserProfile> {
  const rows = await request<Array<{ id: string; full_name: string; email: string; role: "admin" | "operador"; active: boolean }>>(
    "/rest/v1/profiles?select=id,full_name,email,role,active&id=eq." + encodeURIComponent(session.user.id) + "&limit=1",
    {}, session.access_token,
  );
  const row = rows[0];
  if (!row || !row.active) throw new Error("Perfil inativo ou inexistente.");
  return { id: row.id, name: row.full_name, email: row.email, role: row.role, active: row.active, createdAt: new Date().toISOString() };
}

const quotaToDb: Record<string, string> = {
  "Escola Pública": "escola_publica", Renda: "renda", Vulnerabilidade: "vulnerabilidade", PCD: "pcd",
};

export async function saveEnrollment(session: SupabaseSession, student: StudentInfo, isDraft = true) {
  const { url, key } = config();
  const courses = await request<Array<{ id: string; name: string }>>(
    "/rest/v1/courses?select=id,name&active=eq.true&name=eq." + encodeURIComponent(student.course) + "&limit=1",
    {}, session.access_token,
  );
  if (!courses[0]) throw new Error(`O curso "${student.course}" não está cadastrado como ativo no Supabase.`);
  // O formulário exibe datas em pt-BR em alguns metadados de documentos,
  // mas o PostgreSQL espera YYYY-MM-DD para colunas date.
  const normalizeDateValues = (value: unknown): unknown => {
    if (typeof value === "string") {
      const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (match) return `${match[3]}-${match[2]}-${match[1]}`;
      return value;
    }
    if (Array.isArray(value)) return value.map(normalizeDateValues);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, normalizeDateValues(nested)]),
      );
    }
    return value;
  };
  const payload = normalizeDateValues({
    ...student,
    documents: student.documents.map((doc) => ({
      ...doc,
      fileSizeBytes: doc.fileSize ? Number(String(doc.fileSize).replace(/[^0-9]/g, "")) || undefined : undefined,
      storagePath: doc.fileUrl || undefined,
    })),
  });
  const isExistingEnrollment = Boolean(student.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(student.id));
  const rpc = isExistingEnrollment ? "update_enrollment_transaction" : "create_enrollment_transaction";
  const args = {
    p_student: payload,
    p_course_id: courses[0].id,
    p_academic_year: student.academicYear,
    p_is_quota: student.isQuota,
    p_quota_type: student.isQuota ? quotaToDb[student.quotaType] : null,
    ...(isExistingEnrollment ? { p_enrollment_id: student.id } : {}),
  };
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const body = await response.text();
  const data = body ? JSON.parse(body) : null;
  if (!response.ok) throw new Error(data?.message || data?.details || data?.hint || `Falha ao gravar matrícula (${response.status})`);
  const result = data as { id: string; protocol: string; academic_year: number; status: string };
  if (!isDraft) {
    return await request<{ id: string; protocol: string; academic_year: number; status: string }>(
      "/rest/v1/rpc/transition_enrollment_status",
      {
        method: "POST",
        body: JSON.stringify({ p_enrollment_id: result.id, p_new_status: "concluida" }),
      },
      session.access_token,
    );
  }
  return result;
}


/** The existing RPC deletes related records and records the audit atomically. */
export async function deleteEnrollment(session: SupabaseSession, enrollmentId: string) {
  if (!session.access_token) throw new Error("Entre com uma conta autorizada para excluir a matrícula.");
  const result = await request<{ success: boolean; id: string; protocol: string } | null>(
    "/rest/v1/rpc/delete_enrollment_transaction",
    { method: "POST", body: JSON.stringify({ p_enrollment_id: enrollmentId }) },
    session.access_token,
  );
  if (result?.success !== true || result.id !== enrollmentId) {
    throw new Error("O banco não confirmou a exclusão. Atualize a lista antes de tentar novamente.");
  }
  return result;
}

const dbStatusToUi = (status: string): StudentInfo["status"] => ({
  rascunho: "Rascunho",
  em_analise: "Em análise",
  concluida: "Concluída",
  cancelada: "Cancelada",
} as Record<string, StudentInfo["status"]>)[status] || "Rascunho";

const dbDocumentStatusToUi = (status: string): StudentInfo["documents"][number]["status"] => ({
  pendente: "Pendente",
  entregue: "Entregue",
  conferido: "Conferido",
  recusado: "Recusado",
  nao_se_aplica: "Não se aplica",
} as Record<string, StudentInfo["documents"][number]["status"]>)[status] || "Pendente";

const dbQuotaToUi = (quota: string | null, isQuota: boolean): StudentInfo["quotaType"] => {
  if (!isQuota) return "Não cotista";
  return ({
    escola_publica: "Escola Pública",
    renda: "Renda",
    vulnerabilidade: "Vulnerabilidade",
    pcd: "PCD",
  } as Record<string, StudentInfo["quotaType"]>)[quota || ""] || "Escola Pública";
};

const displayDateTime = (value: string | null | undefined) => {
  if (!value) return new Date().toLocaleDateString("pt-BR");
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const emptyParent = (status: "Informado" | "Não informado" | "Falecido(a)" | "Não se aplica" = "Não informado") => ({
  status, name: "", cpf: "", rg: "", rgIssuer: "", phone: "", address: "", email: "", occupation: "", workplace: "", workPhone: "",
});

const emptyGuardian = () => ({
  name: "", relationship: "Outro" as const, maritalStatus: "", occupation: "", cpf: "", rg: "", rgIssuer: "", address: "", phone: "", email: "", isSameAddressAsStudent: false,
});

/** Loads persisted enrollments after login. Health details are only requested for administrators,
 * because the database intentionally restricts health_records to the admin role. */
export async function listEnrollments(session: SupabaseSession): Promise<StudentInfo[]> {
  const profile = await getProfile(session);
  const enrollments = await request<Array<Record<string, any>>>(
    "/rest/v1/enrollments?select=*,students(*),courses(name)&order=created_at.desc",
    {}, session.access_token,
  );
  if (!enrollments.length) return [];
  const ids = enrollments.map((row) => row['id']).filter((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id));
  const inFilter = "in.(" + ids.join(",") + ")";
  const [parentRows, documentRows, healthRows] = await Promise.all([
    request<Array<Record<string, any>>>("/rest/v1/parents_guardians?select=*&enrollment_id=" + encodeURIComponent(inFilter), {}, session.access_token),
    request<Array<Record<string, any>>>("/rest/v1/documents?select=*&enrollment_id=" + encodeURIComponent(inFilter), {}, session.access_token),
    profile.role === "admin"
      ? request<Array<Record<string, any>>>("/rest/v1/health_records?select=*&enrollment_id=" + encodeURIComponent(inFilter), {}, session.access_token)
      : Promise.resolve([] as Array<Record<string, any>>),
  ]);
  const parentsByEnrollment = new Map<string, Array<Record<string, any>>>();
  const documentsByEnrollment = new Map<string, Array<Record<string, any>>>();
  const healthByEnrollment = new Map<string, Record<string, any>>();
  parentRows.forEach((row) => parentsByEnrollment.set(row['enrollment_id'], [...(parentsByEnrollment.get(row['enrollment_id']) || []), row]));
  documentRows.forEach((row) => documentsByEnrollment.set(row['enrollment_id'], [...(documentsByEnrollment.get(row['enrollment_id']) || []), row]));
  healthRows.forEach((row) => healthByEnrollment.set(row['enrollment_id'], row));

  return enrollments.map((enrollment) => {
    const student = enrollment['students'] || {};
    const parents = parentsByEnrollment.get(enrollment['id']) || [];
    const motherRow = parents.find((row) => row['relationship_type'] === "mae");
    const fatherRow = parents.find((row) => row['relationship_type'] === "pai");
    const guardianRow = parents.find((row) => row['is_legal_guardian']) || parents.find((row) => row['relationship_type'] === "responsavel");
    const health = healthByEnrollment.get(enrollment['id']);
    const documents = (documentsByEnrollment.get(enrollment['id']) || []).map((doc) => ({
      id: doc['id'],
      type: doc['document_type'],
      name: String(doc['document_type'] || "Documento").replace(/_/g, " "),
      status: dbDocumentStatusToUi(doc['status']),
      fileName: doc['file_name'] || undefined,
      fileSize: doc['file_size_bytes'] == null ? undefined : String(doc['file_size_bytes']),
      fileUrl: doc['storage_path'] || undefined,
      submittedAt: doc['submitted_at'] || undefined,
      verifiedAt: doc['checked_at'] || undefined,
      verifiedBy: doc['checked_by'] || undefined,
      notes: doc['notes'] || undefined,
      deadline: doc['due_at'] || undefined,
      isMandatory: doc['required'] !== false,
      blocksCompletion: doc['required'] !== false,
    })) as StudentInfo["documents"];
    const parent = (row: Record<string, any> | undefined) => row ? ({
      status: row['status'] === "falecido" ? "Falecido(a)" : row['status'] === "nao_se_aplica" ? "Não se aplica" : row['status'] === "nao_informado" ? "Não informado" : "Informado",
      name: row['full_name'] || "", cpf: row['cpf_digits'] || "", rg: row['rg'] || "", rgIssuer: row['rg_issuer'] || "",
      phone: row['phone'] || "", address: row['address'] || "", email: row['email'] || "", occupation: row['profession'] || "",
      workplace: row['workplace'] || "", workPhone: row['work_phone'] || "",
    }) : emptyParent();
    const guardian = guardianRow ? ({
      name: guardianRow['full_name'] || "",
      relationship: guardianRow['relationship_type'] === "mae" ? "Mãe" : guardianRow['relationship_type'] === "pai" ? "Pai" : "Outro",
      maritalStatus: guardianRow['marital_status'] || "", occupation: guardianRow['profession'] || "", cpf: guardianRow['cpf_digits'] || "",
      rg: guardianRow['rg'] || "", rgIssuer: guardianRow['rg_issuer'] || "", address: guardianRow['address'] || "",
      phone: guardianRow['phone'] || "", email: guardianRow['email'] || "", isSameAddressAsStudent: Boolean(guardianRow['address'] && guardianRow['address'] === student['address']),
    } as StudentInfo["guardian"]) : emptyGuardian();
    const blood = health?.['blood_type'] && health['blood_type'] !== "Não informado"
      ? health['blood_type'] + (health['rh_factor'] || "")
      : "Não informado";
    return {
      id: enrollment['id'],
      protocol: enrollment['protocol'],
      academicYear: enrollment['academic_year'],
      course: enrollment['courses']?.name || "Curso não informado",
      shift: "Integral",
      isQuota: Boolean(enrollment['is_quota']),
      quotaType: dbQuotaToUi(enrollment['quota_type'], Boolean(enrollment['is_quota'])),
      status: dbStatusToUi(enrollment['status']),
      responsibleStaff: profile.name,
      createdAt: displayDateTime(enrollment['created_at']),
      updatedAt: displayDateTime(enrollment['updated_at']),
      fullName: student['full_name'] || "",
      socialName: student['social_name'] || "",
      cpf: student['cpf_digits'] || "",
      rg: student['rg'] || "",
      rgIssuer: student['rg_issuer'] || "",
      birthDate: student['birth_date'] || "",
      age: student['birth_date'] ? Math.max(0, new Date().getFullYear() - new Date(student['birth_date']).getFullYear()) : 0,
      placeOfBirth: student['birthplace'] || "",
      placeOfBirthUf: "",
      gender: student['sex'] === "M" || student['sex'] === "Masculino" ? "Masculino" : student['sex'] === "F" || student['sex'] === "Feminino" ? "Feminino" : "Não informado",
      maritalStatus: student['marital_status'] || "",
      phone: student['phone'] || "",
      email: student['email'] || "",
      address: student['address'] || "",
      neighborhood: student['neighborhood'] || "",
      city: student['city'] || "",
      uf: student['state'] || "",
      cep: student['cep_digits'] || "",
      race: ({"branca":"Branca","preta":"Preta","parda":"Parda","amarela":"Amarela","indigena":"Indígena","nao_declarada":"Não declarada"} as Record<string, StudentInfo["race"]>)[student['race_color']] || "Não declarada",
      isPcd: Boolean(student['pcd']),
      pcdType: student['pcd_type'] || "",
      usesSchoolTransport: Boolean(student['school_transport']),
      transportType: student['transport_type'] || undefined,
      previousSchool: student['previous_school'] || "",
      uniformSize: student['shirt_size'] || "M",
      receivesBolsaFamilia: Boolean(student['bolsa_familia']),
      nisNumber: "",
      mother: parent(motherRow),
      father: parent(fatherRow),
      guardian,
      health: {
        hasHealthInsurance: Boolean(health?.['health_insurance']),
        insuranceName: health?.['accredited_hospital'] || "",
        indicatedHospital: health?.['family_hospital'] || "",
        hasDrugAllergy: Boolean(health?.['medication_allergy']),
        drugAllergyDetails: health?.['allergy_details'] || "",
        hasControlledMedication: Boolean(health?.['controlled_medication']),
        controlledMedicationDetails: health?.['medication_details'] || "",
        emergencyContactName: health?.['emergency_name'] || guardian.name || "",
        emergencyContactPhone: health?.['emergency_phone'] || guardian.phone || "",
        emergencyContactRelationship: health?.['emergency_relationship'] || guardian.relationship || "",
        hasOtherHealthCondition: Boolean(health?.['health_notes']),
        otherHealthConditionDetails: health?.['health_notes_details'] || "",
        bloodType: blood as StudentInfo["health"]["bloodType"],
      },
      documents,
      termsAccepted: true,
    } as StudentInfo;
  });
}

export async function pingAdminBootstrap() { return true; }

export async function createStaffUser(session: SupabaseSession, fullName: string, email: string, role: "admin" | "operador") {
  const { url, key } = config();
  const response = await fetch(url + "/functions/v1/manage-staff-users", {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create-user", fullName, email, role, redirectTo: APP_URL }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Não foi possível convidar o usuário.");
  return data;
}

export async function listStaffUsers(session: SupabaseSession): Promise<UserProfile[]> {
  const rows = await request<Array<{ id: string; full_name: string; email: string; role: "admin" | "operador"; active: boolean; created_at: string }>>(
    "/rest/v1/profiles?select=id,full_name,email,role,active,created_at&order=created_at.asc",
    {}, session.access_token,
  );
  return rows.map((row) => ({ id: row.id, name: row.full_name, email: row.email, role: row.role, active: row.active, createdAt: row.created_at }));
}

export async function requestAdminSetup(email: string) {
  const { url, key } = config();
  const response = await fetch(url + "/functions/v1/manage-staff-users", { method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify({ action: "bootstrap-admin", email, redirectTo: APP_URL }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Não foi possível enviar o convite.");
  return data;
}

// Todas as ações privilegiadas de gestão de usuários são validadas no Edge Function.
export async function manageStaffUser(
  session: SupabaseSession,
  action: "change-password" | "change-role" | "set-active",
  payload: { userId: string; password?: string; role?: "admin" | "operador"; active?: boolean },
) {
  const { url, key } = config();
  const response = await fetch(url + "/functions/v1/manage-staff-users", {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: "Bearer " + session.access_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Não foi possível atualizar o usuário.");
  }
  return data;
}
