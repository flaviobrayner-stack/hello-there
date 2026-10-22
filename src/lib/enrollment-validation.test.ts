import { describe, expect, it } from "vitest";
import {
  calculateAge,
  formatCep,
  formatCpf,
  formatPhone,
  isValidCpf,
  normalizeCpf,
} from "./enrollment-validation";

describe("CPF utilities used by the enrollment form and API", () => {
  it("normalizes and formats CPF without changing its digits", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  it("accepts valid CPF and rejects repeated or incorrect digits", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
});

describe("age calculation", () => {
  it("calculates age before and on the birthday using the supplied date", () => {
    expect(calculateAge("2000-10-23", new Date("2026-10-22T12:00:00"))).toBe(25);
    expect(calculateAge("2000-10-22", new Date("2026-10-22T12:00:00"))).toBe(26);
  });

  it("returns null for missing, invalid, or future dates", () => {
    expect(calculateAge("")).toBeNull();
    expect(calculateAge("not-a-date")).toBeNull();
    expect(calculateAge("2999-01-01", new Date("2026-10-22T12:00:00"))).toBeNull();
  });
});

describe("Brazilian contact formatting", () => {
  it("formats CEP and limits it to eight digits", () => {
    expect(formatCep("12345678")).toBe("12345-678");
    expect(formatCep("123456789")).toBe("12345-678");
  });

  it("formats mobile and landline numbers", () => {
    expect(formatPhone("81999991234")).toBe("(81) 99999-1234");
    expect(formatPhone("8133334444")).toBe("(81) 3333-4444");
  });
});
