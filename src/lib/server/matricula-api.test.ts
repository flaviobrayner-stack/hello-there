import { afterEach, describe, expect, it, vi } from "vitest";

import { authenticateStaff, backendDisabledResponse } from "./matricula-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("matricula API safety gates", () => {
  it("returns 503 while backend activation is disabled", async () => {
    vi.stubEnv("MATRICULA_BACKEND_ENABLED", "false");
    vi.stubEnv("MATRICULA_ACCESS_POLICY_APPROVED", "false");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await authenticateStaff(new Request("https://example.test/api/enrollments"));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not enable the backend without explicit access-policy approval", async () => {
    vi.stubEnv("MATRICULA_BACKEND_ENABLED", "true");
    vi.stubEnv("MATRICULA_ACCESS_POLICY_APPROVED", "false");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await authenticateStaff(new Request("https://example.test/api/enrollments"));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("marks disabled responses as non-cacheable", () => {
    const response = backendDisabledResponse();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
