import { describe, expect, it } from "vitest";
import {
  maskCpf,
  maskCpfPrivate,
  validateCpf,
  calculateAge,
  maskPhone,
  maskCep,
} from "../lib/mask";

describe("Validation and Mask utilities", () => {
  it("formats and validates CPF correctly", () => {
    // Valid CPF algorithm test
    expect(validateCpf("111.444.777-35")).toBe(true);
    expect(validateCpf("11144477735")).toBe(true);

    // Invalid CPF
    expect(validateCpf("111.111.111-11")).toBe(false);
    expect(validateCpf("123.456.789-00")).toBe(false);

    // Masks
    expect(maskCpf("11144477735")).toBe("111.444.777-35");
    expect(maskCpfPrivate("11144477735")).toBe("***.444.777-**");
  });

  it("calculates age accurately based on birth date", () => {
    const age2009 = calculateAge("2009-01-01");
    expect(age2009).toBeGreaterThanOrEqual(16);

    const invalid = calculateAge("");
    expect(invalid).toBeNull();
  });

  it("masks phone and cep", () => {
    expect(maskPhone("81987654321")).toBe("(81) 98765-4321");
    expect(maskCep("55660000")).toBe("55660-000");
  });
});
