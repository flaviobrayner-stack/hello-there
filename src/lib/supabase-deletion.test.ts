import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteEnrollment, type SupabaseSession } from "./supabase";

const session: SupabaseSession = { access_token: "test-token", refresh_token: "test-refresh", user: { id: "test-user" } };
const id = "00000000-0000-4000-8000-000000000001";

afterEach(() => { vi.unstubAllGlobals(); window.localStorage.clear(); });

describe("authenticated enrollment deletion (mocked network only)", () => {
  it("sends the enrollment ID and session token to the existing RPC without changing the session", async () => {
    window.localStorage.setItem("matricula2026.supabase.session", JSON.stringify(session));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, id, protocol: "MAT-2026-000001" })));
    vi.stubGlobal("fetch", fetchMock);
    await expect(deleteEnrollment(session, id)).resolves.toMatchObject({ success: true, id });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/rest/v1/rpc/delete_enrollment_transaction"), expect.objectContaining({
      method: "POST", body: JSON.stringify({ p_enrollment_id: id }),
      headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
    }));
    expect(window.localStorage.getItem("matricula2026.supabase.session")).toBe(JSON.stringify(session));
  });

  it("propagates a database error rather than reporting success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Matrícula não encontrada." }), { status: 400 })));
    await expect(deleteEnrollment(session, id)).rejects.toThrow("Matrícula não encontrada.");
  });

  it.each([null, { success: false, id }, { success: true, id: "different-id" }])("rejects an unconfirmed deletion: %j", async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
    await expect(deleteEnrollment(session, id)).rejects.toThrow("O banco não confirmou a exclusão");
  });
});