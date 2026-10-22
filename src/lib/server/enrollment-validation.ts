/**
 * Strict, side-effect-free preflight validation for enrollment payloads.
 *
 * This module is intentionally NOT wired to the live enrollment endpoint yet:
 * the official "Ficha Ok 2026" and institutional rules must be confirmed first.
 * It is safe to unit-test without Supabase credentials or real student data.
 */
export type EnrollmentValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type EnrollmentValidationResult =
  | { ok: true; value: EnrollmentPreflightPayload }
  | { ok: false; issues: EnrollmentValidationIssue[] };

export type EnrollmentPreflightPayload = {
  schema_version: 1;
  academic_year: number;
  course_id: string;
  quota: {
    is_quota: boolean;
    quota_type: "escola_publica" | "renda" | "vulnerabilidade" | "pcd" | null;
  };
  student: {
    fullName: string;
    cpf?: string | null;
    birthDate?: string | null;
  };
};

const TOP_LEVEL_KEYS = ["schema_version", "academic_year", "course_id", "quota", "student"];
const QUOTA_KEYS = ["is_quota", "quota_type"];
const STUDENT_KEYS = ["fullName", "cpf", "birthDate"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addIssue(
  issues: EnrollmentValidationIssue[],
  path: string,
  code: string,
  message: string,
) {
  issues.push({ path, code, message });
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowed: string[],
  path: string,
  issues: EnrollmentValidationIssue[],
) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      addIssue(issues, path ? `${path}.${key}` : key, "UNKNOWN_FIELD", "Campo não permitido.");
    }
  }
}

export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Validates CPF check digits; formatting characters are ignored. */
export function isValidCpf(value: string): boolean {
  const cpf = normalizeDigits(value);
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;

  const calculateDigit = (length: number, weightStart: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (weightStart - i);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9, 10) === Number(cpf[9]) &&
    calculateDigit(10, 11) === Number(cpf[10]);
}

function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= todayUtc;
}

/**
 * Validates only the currently approved preflight envelope, not the full official
 * form. The allowlist deliberately rejects fields not in this small contract.
 */
export function validateEnrollmentPreflight(input: unknown): EnrollmentValidationResult {
  const issues: EnrollmentValidationIssue[] = [];
  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [{ path: "", code: "INVALID_OBJECT", message: "Envie um objeto JSON válido." }],
    };
  }

  rejectUnknownKeys(input, TOP_LEVEL_KEYS, "", issues);

  if (input.schema_version !== 1) {
    addIssue(issues, "schema_version", "UNSUPPORTED_VERSION", "Versão do contrato não suportada.");
  }

  if (
    typeof input.academic_year !== "number" ||
    !Number.isInteger(input.academic_year) ||
    input.academic_year < 2020 ||
    input.academic_year > 2100
  ) {
    addIssue(issues, "academic_year", "INVALID_YEAR", "Ano letivo inválido.");
  }

  if (typeof input.course_id !== "string" || !UUID_RE.test(input.course_id)) {
    addIssue(issues, "course_id", "INVALID_COURSE_ID", "Identificador do curso inválido.");
  }

  let quota: EnrollmentPreflightPayload["quota"] | undefined;
  if (!isRecord(input.quota)) {
    addIssue(issues, "quota", "INVALID_OBJECT", "Informe a configuração da cota.");
  } else {
    rejectUnknownKeys(input.quota, QUOTA_KEYS, "quota", issues);
    const isQuota = input.quota.is_quota;
    const quotaType = input.quota.quota_type;
    const allowedTypes = ["escola_publica", "renda", "vulnerabilidade", "pcd"];
    if (typeof isQuota !== "boolean") {
      addIssue(issues, "quota.is_quota", "INVALID_BOOLEAN", "Informe se a matrícula é por cota.");
    }
    if (
      quotaType !== null &&
      (typeof quotaType !== "string" || !allowedTypes.includes(quotaType))
    ) {
      addIssue(issues, "quota.quota_type", "INVALID_QUOTA_TYPE", "Tipo de cota inválido.");
    }
    if (typeof isQuota === "boolean" && (isQuota !== (quotaType !== null))) {
      addIssue(issues, "quota", "INCONSISTENT_QUOTA", "A opção de cota e seu tipo são incompatíveis.");
    }
    if (
      typeof isQuota === "boolean" &&
      (quotaType === null || (typeof quotaType === "string" && allowedTypes.includes(quotaType)))
    ) {
      quota = {
        is_quota: isQuota,
        quota_type: quotaType as EnrollmentPreflightPayload["quota"]["quota_type"],
      };
    }
  }

  let student: EnrollmentPreflightPayload["student"] | undefined;
  if (!isRecord(input.student)) {
    addIssue(issues, "student", "INVALID_OBJECT", "Informe os dados do estudante.");
  } else {
    rejectUnknownKeys(input.student, STUDENT_KEYS, "student", issues);
    const fullName = input.student.fullName;
    if (typeof fullName !== "string" || fullName.trim().length < 3 || fullName.trim().length > 160) {
      addIssue(issues, "student.fullName", "INVALID_NAME", "O nome deve ter entre 3 e 160 caracteres.");
    }

    let cpf: string | null | undefined;
    if (input.student.cpf === null || input.student.cpf === undefined || input.student.cpf === "") {
      cpf = input.student.cpf as null | undefined | "";
    } else if (typeof input.student.cpf !== "string") {
      addIssue(issues, "student.cpf", "INVALID_TYPE", "CPF deve ser texto.");
    } else if (!isValidCpf(input.student.cpf)) {
      addIssue(issues, "student.cpf", "INVALID_CPF", "CPF inválido.");
    } else {
      cpf = normalizeDigits(input.student.cpf);
    }

    let birthDate: string | null | undefined;
    if (input.student.birthDate === null || input.student.birthDate === undefined || input.student.birthDate === "") {
      birthDate = input.student.birthDate as null | undefined | "";
    } else if (typeof input.student.birthDate !== "string" || !isValidCalendarDate(input.student.birthDate)) {
      addIssue(issues, "student.birthDate", "INVALID_BIRTH_DATE", "Data de nascimento inválida ou futura.");
    } else {
      birthDate = input.student.birthDate;
    }

    if (typeof fullName === "string" && fullName.trim().length >= 3 && fullName.trim().length <= 160) {
      student = {
        fullName: fullName.trim(),
        ...(cpf !== undefined ? { cpf: cpf === "" ? null : cpf } : {}),
        ...(birthDate !== undefined ? { birthDate: birthDate === "" ? null : birthDate } : {}),
      };
    }
  }

  if (issues.length > 0 || !quota || !student) return { ok: false, issues };

  return {
    ok: true,
    value: {
      schema_version: 1,
      academic_year: input.academic_year as number,
      course_id: input.course_id as string,
      quota,
      student,
    },
  };
}
