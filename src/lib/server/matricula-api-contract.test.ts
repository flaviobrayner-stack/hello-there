import { afterEach, describe, expect, it, vi } from "vitest";

import {
  accessTokenCookie,
  backendDisabledResponse,
  clearAccessTokenCookie,
  getBackendConfig,
  getCookie,
  jsonError,
  sameOriginRequest,
  safeRestFailure,
} from "./matricula-api";

describe("matricula API security boundary helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("keeps the backend disabled unless both explicit flags are true", () => {
    vi.stubEnv("MATRICULA_BACKEND_ENABLED", "true");
    vi.stubEnv("MATRICULA_ACCESS_POLICY_APPROVED", "false");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "publishable-test-key");
    expect(getBackendConfig()).toBeNull();
  });

  it("rejects non-HTTPS Supabase URLs outside localhost", () => {
    vi.stubEnv("MATRICULA_BACKEND_ENABLED", "true");
    vi.stubEnv("MATRICULA_ACCESS_POLICY_APPROVED", "true");
    vi.stubEnv("SUPABASE_URL", "http://example.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "publishable-test-key");
    expect(getBackendConfig()).toBeNull();
  });

  it("returns a no-store 503 while backend is disabled", async () => {
    const response = backendDisabledResponse();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      code: "BACKEND_NOT_ENABLED",
    });
  });

  it("accepts only an exact same-origin Origin header", () => {
    expect(
      sameOriginRequest(
        new Request("https://school.example/api/enrollments", {
          headers: { origin: "https://school.example" },
        }),
      ),
    ).toBe(true);
    expect(
      sameOriginRequest(
        new Request("https://school.example/api/enrollments", {
          headers: { origin: "https://attacker.example" },
        }),
      ),
    ).toBe(false);
    expect(sameOriginRequest(new Request("https://school.example/api/enrollments"))).toBe(
      false,
    );
  });

  it("reads the named cookie without confusing prefix names", () => {
    const request = new Request("https://school.example", {
      headers: { cookie: "other=abc; matricula_access=token%2Evalue; matricula_access_extra=no" },
    });
    expect(getCookie(request, "matricula_access")).toBe("token.value");
    expect(getCookie(request, "missing")).toBeNull();
  });

  it("fails closed when the selected cookie has malformed encoding", () => {
    const request = new Request("https://school.example", {
      headers: { cookie: "matricula_access=%E0%A4%A" },
    });
    expect(getCookie(request, "matricula_access")).toBeNull();
  });

  it("sets HttpOnly, SameSite Strict, bounded lifetime and Secure on HTTPS", () => {
    const request = new Request("https://school.example");
    const cookie = accessTokenCookie(request, "sample-token", 99_999);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("Max-Age=3600");
    expect(clearAccessTokenCookie(request)).toContain("Max-Age=0");
  });

  it("does not expose upstream response details in errors", async () => {
    const upstream = new Response("sensitive SQL details and table names", { status: 500 });
    const response = await safeRestFailure(upstream);
    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).toContain("DATA_SERVICE_ERROR");
    expect(body).not.toContain("sensitive SQL");
    expect(body).not.toContain("table names");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns stable no-store JSON errors", async () => {
    const response = jsonError("Solicitação inválida.", 400, "VALIDATION_FAILED");
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Solicitação inválida.",
      code: "VALIDATION_FAILED",
    });
  });
});
