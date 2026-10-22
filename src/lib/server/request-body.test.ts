import { describe, expect, it } from "vitest";

import { readJsonBodyLimited } from "./request-body";

describe("readJsonBodyLimited", () => {
  it("parses valid JSON under the byte limit", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      body: '{"ok":true}',
    });
    await expect(readJsonBodyLimited(request, 32)).resolves.toEqual({
      ok: true,
      value: { ok: true },
    });
  });

  it("rejects a body over the limit even when Content-Length is absent", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      body: '{"value":"123456789"}',
    });
    await expect(readJsonBodyLimited(request, 10)).resolves.toEqual({
      ok: false,
      reason: "too_large",
    });
  });

  it("measures UTF-8 bytes rather than JavaScript characters", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      body: '"ááá"',
    });
    await expect(readJsonBodyLimited(request, 5)).resolves.toEqual({
      ok: false,
      reason: "too_large",
    });
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      body: '{"unfinished":',
    });
    await expect(readJsonBodyLimited(request, 64)).resolves.toEqual({
      ok: false,
      reason: "invalid_json",
    });
  });

  it("rejects invalid UTF-8 bytes", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      body: new Uint8Array([0xc3, 0x28]),
    });
    await expect(readJsonBodyLimited(request, 16)).resolves.toEqual({
      ok: false,
      reason: "invalid_json",
    });
  });

  it("rejects a missing body", async () => {
    const request = new Request("https://example.test", { method: "POST" });
    await expect(readJsonBodyLimited(request, 16)).resolves.toEqual({
      ok: false,
      reason: "invalid_json",
    });
  });

  it("rejects a non-positive byte limit", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      body: "{}",
    });
    await expect(readJsonBodyLimited(request, 0)).rejects.toThrow(RangeError);
  });
});
