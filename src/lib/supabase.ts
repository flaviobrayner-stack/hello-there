import type { StudentInfo, UserProfile } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const SESSION_KEY = "matricula2026.supabase.session";

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

export async function saveEnrollment(session: SupabaseSession, student: StudentInfo) {
  const { url, key } = config();
  const courses = await request<Array<{ id: string; name: string }>>(
    "/rest/v1/courses?select=id,name&active=eq.true&name=eq." + encodeURIComponent(student.course) + "&limit=1",
    {}, session.access_token,
  );
  if (!courses[0]) throw new Error(`O curso "${student.course}" não está cadastrado como ativo no Supabase.`);
  const payload = {
    ...student,
    documents: student.documents.map((doc) => ({
      ...doc,
      fileSizeBytes: doc.fileSize ? Number(String(doc.fileSize).replace(/[^0-9]/g, "")) || undefined : undefined,
      storagePath: doc.fileUrl || undefined,
    })),
  };
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/create_enrollment_transaction`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_student: payload,
      p_course_id: courses[0].id,
      p_academic_year: student.academicYear,
      p_is_quota: student.isQuota,
      p_quota_type: student.isQuota ? quotaToDb[student.quotaType] : null,
    }),
  });
  const body = await response.text();
  const data = body ? JSON.parse(body) : null;
  if (!response.ok) throw new Error(data?.message || data?.details || data?.hint || `Falha ao gravar matrícula (${response.status})`);
  return data as { id: string; protocol: string; academic_year: number; status: string };
}

export async function pingAdminBootstrap() { return true; }

export async function createStaffUser(session: SupabaseSession, fullName: string, email: string, role: "admin" | "operador") {
  const { url, key } = config();
  const response = await fetch(url + "/functions/v1/manage-staff-users", {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create-user", fullName, email, role, redirectTo: window.location.origin }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Não foi possível convidar o usuário.");
  return data;
}
