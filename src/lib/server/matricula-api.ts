/**
 * Backend boundary for the enrollment API.
 *
 * This module is server-only. It deliberately uses the caller's Supabase access
 * token and the public/anon key, never a service-role key. Postgres RLS remains
 * the authorization boundary. The API stays disabled until an operator has
 * explicitly enabled it after reviewing and applying the approved schema.
 */
type StaffProfile = {
  id: string;
  role: "admin" | "operador";
  active: boolean;
};

type AuthenticatedStaff = {
  accessToken: string;
  profile: StaffProfile;
};

const API_DISABLED_MESSAGE =
  "O backend de matrículas ainda não foi habilitado para este ambiente.";

function backendConfig() {
  const enabled =
    process.env.MATRICULA_BACKEND_ENABLED === "true" &&
    process.env.MATRICULA_ACCESS_POLICY_APPROVED === "true";
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!enabled || !url || !anonKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return null;
  } catch {
    return null;
  }

  return { url, anonKey };
}

export function backendDisabledResponse(): Response {
  return Response.json(
    { error: API_DISABLED_MESSAGE, code: "BACKEND_NOT_ENABLED" },
    { status: 503, headers: { "cache-control": "no-store" } },
  );
}

export function jsonError(message: string, status: number, code: string): Response {
  return Response.json(
    { error: message, code },
    { status, headers: { "cache-control": "no-store" } },
  );
}

export async function authenticateStaff(request: Request): Promise<
  | { ok: true; staff: AuthenticatedStaff; config: NonNullable<ReturnType<typeof backendConfig>> }
  | { ok: false; response: Response }
> {
  const config = backendConfig();
  if (!config) return { ok: false, response: backendDisabledResponse() };

  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([A-Za-z0-9._~-]+)$/i.exec(authorization);
  if (!match) {
    return {
      ok: false,
      response: jsonError("Autenticação necessária.", 401, "UNAUTHENTICATED"),
    };
  }

  const accessToken = match[1];
  if (!accessToken) {
    return {
      ok: false,
      response: jsonError("Autenticação necessária.", 401, "UNAUTHENTICATED"),
    };
  }

  try {
    const authResponse = await fetch(`${config.url}/auth/v1/user`, {
      headers: {
        apikey: config.anonKey,
        authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!authResponse.ok) {
      return {
        ok: false,
        response: jsonError("Sessão inválida ou expirada.", 401, "INVALID_SESSION"),
      };
    }

    const authUser = (await authResponse.json()) as { id?: unknown };
    if (typeof authUser.id !== "string" || !authUser.id) {
      return {
        ok: false,
        response: jsonError("Sessão inválida ou expirada.", 401, "INVALID_SESSION"),
      };
    }

    const profileUrl = new URL(`${config.url}/rest/v1/profiles`);
    profileUrl.searchParams.set("select", "id,role,active");
    profileUrl.searchParams.set("id", `eq.${authUser.id}`);
    profileUrl.searchParams.set("limit", "1");

    const profileResponse = await fetch(profileUrl, {
      headers: {
        apikey: config.anonKey,
        authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      return {
        ok: false,
        response: jsonError("Não foi possível verificar as permissões da conta.", 403, "PROFILE_CHECK_FAILED"),
      };
    }

    const profiles = (await profileResponse.json()) as StaffProfile[];
    const profile = profiles[0];
    if (
      !profile ||
      profile.id !== authUser.id ||
      profile.active !== true ||
      (profile.role !== "admin" && profile.role !== "operador")
    ) {
      return {
        ok: false,
        response: jsonError("Conta sem autorização para acessar o sistema.", 403, "STAFF_ACCESS_DENIED"),
      };
    }

    return { ok: true, staff: { accessToken, profile }, config };
  } catch {
    return {
      ok: false,
      response: jsonError("Serviço de autenticação indisponível.", 503, "AUTH_SERVICE_UNAVAILABLE"),
    };
  }
}

/** Generic PostgREST request that always forwards the verified user's JWT. */
export async function staffRestRequest(
  config: NonNullable<ReturnType<typeof backendConfig>>,
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("apikey", config.anonKey);
  headers.set("authorization", `Bearer ${accessToken}`);
  headers.set("accept", "application/json");

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  return response;
}

/** Keep internal Supabase/Postgres details out of public API responses. */
export async function safeRestFailure(response: Response): Promise<Response> {
  const status = response.status === 401 ? 401 : response.status === 403 ? 403 : 502;
  return jsonError(
    status === 401
      ? "Sessão inválida ou expirada."
      : status === 403
        ? "Você não tem permissão para esta operação."
        : "Não foi possível concluir a consulta. Tente novamente.",
    status,
    status === 401 ? "INVALID_SESSION" : status === 403 ? "FORBIDDEN" : "DATA_SERVICE_ERROR",
  );
}
