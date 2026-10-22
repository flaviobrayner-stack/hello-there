import { describe, expect, it } from "vitest";
import {
  isValidCpf,
  normalizeDigits,
  validateEnrollmentPreflight,
} from "./enrollment-validation";

const validPayload = () => ({
  schema_version: 1,
  academic_year: 2026,
  course_id: "550e8400-e29b-41d4-a716-446655440000",
  quota: { is_quota: false, quota_type: null },
  student: {
    fullName: "Estudante de Teste",
    cpf: "529.982.247-25",
    birthDate: "2008-05-10",
  },
});

describe("normalizeDigits", () => {
  it("keeps only numeric characters", () => {
    expect(normalizeDigits("(81) 99999-1234")).toBe("81999991234");
  });
});

describe("isValidCpf", () => {
  it("accepts a CPF with valid check digits", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("rejects repeated digits and invalid check digits", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
});

describe("validateEnrollmentPreflight", () => {
  it("accepts a valid, minimal synthetic payload and normalizes CPF", () => {
    const result = validateEnrollmentPreflight(validPayload());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.student.cpf).toBe("52998224725");
      expect(result.value.student.fullName).toBe("Estudante de Teste");
    }
  });

  it("rejects non-object payloads", () => {
    const result = validateEnrollmentPreflight([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.code).toBe("INVALID_OBJECT");
  });

  it("rejects unknown top-level and student fields", () => {
    const payload = { ...validPayload(), created_by: "attacker" };
    const result = validateEnrollmentPreflight({
      ...payload,
      student: { ...payload.student, secretField: "ignored?" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toContain("UNKNOWN_FIELD");
    }
  });

  it("rejects invalid CPF", () => {
    const payload = validPayload();
    payload.student.cpf = "111.111.111-11";
    const result = validateEnrollmentPreflight(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((issue) => issue.code)).toContain("INVALID_CPF");
  });

  it("rejects inconsistent quota flags", () => {
    const payload = validPayload();
    payload.quota = { is_quota: true, quota_type: null };
    const result = validateEnrollmentPreflight(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((issue) => issue.code)).toContain("INCONSISTENT_QUOTA");
  });

  it("rejects malformed course IDs and unsupported contract versions", () => {
    const payload = { ...validPayload(), schema_version: 2, course_id: "not-a-uuid" };
    const result = validateEnrollmentPreflight(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toContain("UNSUPPORTED_VERSION");
      expect(result.issues.map((issue) => issue.code)).toContain("INVALID_COURSE_ID");
    }
  });

  it("rejects impossible and future birth dates", () => {
    for (const birthDate of ["2020-02-31", "2999-01-01"]) {
      const payload = validPayload();
      payload.student.birthDate = birthDate;
      const result = validateEnrollmentPreflight(payload);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.issues.map((issue) => issue.code)).toContain("INVALID_BIRTH_DATE");
    }
  });
});
