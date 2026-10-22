import { afterEach, describe, expect, it, vi } from "vitest";

import { authenticateStaff } from "./matricula-api";

function enableTestBackend() {
  vi.stubEnv("MATRICULA_BACKEND_ENABLED", "true");
  vi.stubEnv("MATRICULA_ACCESS_POLICY_APPROVED", "true");
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "publishable-test-key");
}

function staffRequest(token = "test-access-token") {
  return new Request("https://school.example/api/enrollments", {
    headers: { authorization: `Bearer ${token}` },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("authenticateStaff", () => {
  it("fails closed without calling fetch while backend flags are disabled", async () => {
    vi.stubEnv("MATRICULA_BACKEND_ENABLED", "false");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await authenticateStaff(staffRequest());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects missing credentials without calling Supabase", async () => {
    enableTestBackend();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await authenticateStaff(
      new Request("https://school.example/api/enrollments"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toMatchObject({
        code: "UNAUTHENTICATED",
      });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid session and never queries the staff profile", async () => {
    enableTestBackend();
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await authenticateStaff(staffRequest());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toMatchObject({
        code: "INVALID_SESSION",
      });
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://project.supabase.co/auth/v1/user",
    );
  });

  it("rejects an authenticated user without an active operator profile", async () => {
    enableTestBackend();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ id: "user-123" }, { status: 200 }),
      )
      .mockResolvedValueOnce(
        Response.json([{ id: "user-123", role: "operador", active: false }], {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await authenticateStaff(staffRequest());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toMatchObject({
        code: "STAFF_ACCESS_DENIED",
      });
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("accepts an active operator profile and forwards only the supplied user token", async () => {
    enableTestBackend();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ id: "user-123" }, { status: 200 }),
      )
      .mockResolvedValueOnce(
        Response.json([{ id: "user-123", role: "operador", active: true }], {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await authenticateStaff(staffRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.staff.profile).toEqual({
        id: "user-123",
        role: "operador",
        active: true,
      });
      expect(result.config.url).toBe("https://project.supabase.co");
    }
    for (const [, init] of fetchMock.mock.calls) {
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer test-access-token",
      );
      expect(new Headers(init?.headers).get("apikey")).toBe("publishable-test-key");
    }
  });

  it("fails closed when Supabase fetch throws", async () => {
    enableTestBackend();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private upstream detail")));

    const result = await authenticateStaff(staffRequest());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(503);
      const body = await result.response.text();
      expect(body).toContain("AUTH_SERVICE_UNAVAILABLE");
      expect(body).not.toContain("private upstream detail");
    }
  });
});
