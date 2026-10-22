import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { isValidCpf } from "../lib/enrollment-validation";
import { readJsonBodyLimited } from "../lib/server/request-body";
import {
  authenticateStaff,
  jsonError,
  safeRestFailure,
  sameOriginRequest,
  staffRestRequest,
} from "../lib/server/matricula-api";

const studentSchema = z
  .object({
    fullName: z.string().trim().min(3).max(160),
    socialName: z.string().trim().max(160).optional(),
    cpf: z.string().trim().max(14).optional(),
    rg: z.string().trim().max(40).optional(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    phone: z.string().trim().max(30).optional(),
    email: z.string().trim().email().max(254).optional(),
    address: z.string().trim().max(240).optional(),
    city: z.string().trim().max(120).optional(),
    state: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/)
      .optional(),
    cep: z.string().trim().max(10).optional(),
    raceColor: z.string().trim().max(60).optional(),
    pcd: z.boolean().optional(),
    previousSchool: z.string().trim().max(180).optional(),
  })
  .strict()
  .superRefine((student, context) => {
    if (student.cpf && !isValidCpf(student.cpf)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cpf"],
        message: "CPF inválido.",
      });
    }

    if (student.birthDate) {
      const parsed = new Date(`${student.birthDate}T00:00:00.000Z`);
      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== student.birthDate
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["birthDate"],
          message: "Data de nascimento inválida.",
        });
      }
    }
  });

const createEnrollmentSchema = z
  .object({
    courseId: z.string().uuid(),
    academicYear: z.number().int().min(2020).max(2100).default(2026),
    quotaType: z
      .enum(["escola_publica", "renda", "vulnerabilidade", "pcd"])
      .nullable()
      .default(null),
    student: studentSchema,
  })
  .strict();

export const Route = createFileRoute("/api/enrollments")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authenticateStaff(request);
        if (!auth.ok) return auth.response;

        // Explicit projection: never return health records, parent details,
        // storage paths, document contents, or complete CPF values here.
        const query = new URLSearchParams({
          select:
            "id,protocol,academic_year,status,created_at,quota_type,course:courses(name),student:students(full_name)",
          order: "created_at.desc",
          limit: "50",
        });

        const upstream = await staffRestRequest(
          auth.config,
          auth.staff.accessToken,
          `enrollments?${query.toString()}`,
        );

        if (!upstream.ok) return safeRestFailure(upstream);

        const rows = (await upstream.json()) as unknown;
        if (!Array.isArray(rows)) {
          return jsonError("Resposta inválida do serviço de dados.", 502, "INVALID_DATA_RESPONSE");
        }

        return Response.json(
          { data: rows, limit: 50 },
          { headers: { "cache-control": "no-store" } },
        );
      },
      POST: async ({ request }) => {
        if (!sameOriginRequest(request)) {
          return jsonError("Origem da solicitação não autorizada.", 403, "ORIGIN_NOT_ALLOWED");
        }

        const auth = await authenticateStaff(request);
        if (!auth.ok) return auth.response;

        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
          return jsonError("Envie os dados em formato JSON.", 415, "UNSUPPORTED_MEDIA_TYPE");
        }

        const bodyResult = await readJsonBodyLimited(request, 16_384);
        if (!bodyResult.ok) {
          if (bodyResult.reason === "too_large") {
            return jsonError(
              "Os dados enviados excedem o limite permitido.",
              413,
              "PAYLOAD_TOO_LARGE",
            );
          }
          if (bodyResult.reason === "unreadable") {
            return jsonError("Não foi possível ler o corpo da solicitação.", 400, "UNREADABLE_BODY");
          }
          return jsonError("Corpo JSON inválido.", 400, "INVALID_JSON");
        }

        const parsed = createEnrollmentSchema.safeParse(bodyResult.value);
        if (!parsed.success) {
          return jsonError(
            "Confira os campos da matrícula e tente novamente.",
            400,
            "VALIDATION_FAILED",
          );
        }

        const { student, courseId, academicYear, quotaType } = parsed.data;
        const upstream = await staffRestRequest(
          auth.config,
          auth.staff.accessToken,
          "rpc/create_enrollment_transaction",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              p_student: student,
              p_course_id: courseId,
              p_academic_year: academicYear,
              p_is_quota: quotaType !== null,
              p_quota_type: quotaType,
            }),
          },
        );

        if (!upstream.ok) return safeRestFailure(upstream);

        const created = (await upstream.json()) as unknown;
        if (
          created === null ||
          typeof created !== "object" ||
          !("id" in created) ||
          !("protocol" in created)
        ) {
          return jsonError("Resposta inválida ao criar matrícula.", 502, "INVALID_CREATE_RESPONSE");
        }

        return Response.json(
          { data: created },
          { status: 201, headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
