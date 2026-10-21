import { describe, expect, it } from "vitest";
import {
  calculateAge,
  formatCep,
  formatCpf,
  formatPhone,
  isValidCpf,
  normalizeCpf,
} from "./enrollment-validation";

describe("normalizeCpf", () => {
  it("keeps only digits", () => expect(normalizeCpf("529.982.247-25")).toBe("52998224725"));
});

describe("isValidCpf", () => {
  it("accepts a CPF with valid check digits", () =>
    expect(isValidCpf("529.982.247-25")).toBe(true));
  it("rejects repeated digits", () => expect(isValidCpf("111.111.111-11")).toBe(false));
  it("rejects an invalid check digit", () => expect(isValidCpf("529.982.247-24")).toBe(false));
  it("rejects incomplete values", () => expect(isValidCpf("123")).toBe(false));
});

describe("calculateAge", () => {
  it("calculates age before the birthday", () =>
    expect(calculateAge("2008-12-10", new Date("2026-10-21T12:00:00"))).toBe(17));
  it("calculates age on the birthday", () =>
    expect(calculateAge("2008-10-21", new Date("2026-10-21T12:00:00"))).toBe(18));
  it("handles today even before noon", () =>
    expect(calculateAge("2008-10-21", new Date("2026-10-21T08:00:00"))).toBe(18));
  it("rejects a future birth date", () =>
    expect(calculateAge("2030-01-01", new Date("2026-10-21T12:00:00"))).toBe(null));
});

describe("formatCpf", () => {
  it("formats at most 11 digits", () => expect(formatCpf("52998224725999")).toBe("529.982.247-25"));
});

describe("formatPhone", () => {
  it("formats a Brazilian mobile number", () =>
    expect(formatPhone("81987654321")).toBe("(81) 98765-4321"));
});

describe("formatCep", () => {
  it("formats eight digits", () => expect(formatCep("50000000")).toBe("50000-000"));
});
