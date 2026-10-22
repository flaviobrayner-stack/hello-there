import type { StudentInfo, UserProfile } from "./types";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://oreeyfyidnhpkwnxubpw.supabase.co";
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || "sb_publishable_r9HALBJWZKnLe_vy060umg_B9s7JKwA";
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
    expires_at: Number(params.get("expires_at") || 0) || undefined,
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
