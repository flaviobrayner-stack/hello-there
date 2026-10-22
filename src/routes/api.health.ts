import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  authenticateStaff,
  jsonError,
  safeRestFailure,
  staffRestRequest,
} from "../lib/server/matricula-api";

const searchSchema = z.string().trim().min(3).max(120).regex(
  /^[\p{L}\p{M}\s'-]+$/u,
  "Informe um nome válido.",
);

type Relation<T> = T | T[] | null | undefined;

type HealthRow = {
  medication_allergy: boolean | null;
  allergy_details: string | null;
  food_allergy: boolean | null;
  food_allergy_details: string | null;
  health_notes: boolean | null;
  health_notes_details: string | null;
  controlled_medication: boolean | null;
  medication_details: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  emergency_relationship: string | null;
  enrollment: Relation<{
    protocol: string;
    student: Relation<{ full_name: string }>;
  }>;
};

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authenticateStaff(request);
        if (!auth.ok) return auth.response;

        // Health information is sensitive: only the administrator role can query it.
        if (auth.staff.profile.role !== "admin") {
          return jsonError("A consulta de saúde é restrita ao perfil administrador.", 403, "HEALTH_ACCESS_DENIED");
        }

        const parsed = searchSchema.safeParse(new URL(request.url).searchParams.get("name") ?? "");
        if (!parsed.success) {
          return jsonError("Informe pelo menos 3 letras do nome do estudante.", 400, "INVALID_SEARCH");
        }

        const query = new URLSearchParams({
          select: "medication_allergy,allergy_details,food_allergy,food_allergy_details,health_notes,health_notes_details,controlled_medication,medication_details,emergency_name,emergency_phone,emergency_relationship,enrollment:enrollments!inner(protocol,student:students!inner(full_name))",
          "enrollment.student.full_name": `ilike.*${parsed.data}*`,
          order: "updated_at.desc",
          limit: "25",
        });

        const upstream = await staffRestRequest(auth.config, auth.staff.accessToken, `health_records?${query.toString()}`);
        if (!upstream.ok) return safeRestFailure(upstream);

        const rows = (await upstream.json()) as unknown;
        if (!Array.isArray(rows)) {
          return jsonError("Resposta inválida do serviço de dados.", 502, "INVALID_DATA_RESPONSE");
        }

        const relationValue = <T,>(value: Relation<T>): T | undefined =>
          Array.isArray(value) ? value[0] : value ?? undefined;

        const data = (rows as HealthRow[]).flatMap((row) => {
          const enrollment = relationValue(row.enrollment);
          const student = relationValue(enrollment?.student);
          if (!enrollment?.protocol || !student?.full_name) return [];
          return [{
            protocol: enrollment.protocol,
            studentName: student.full_name,
            medicationAllergy: row.medication_allergy,
            allergyDetails: row.allergy_details,
            foodAllergy: row.food_allergy,
            foodAllergyDetails: row.food_allergy_details,
            healthNotes: row.health_notes,
            healthNotesDetails: row.health_notes_details,
            controlledMedication: row.controlled_medication,
            medicationDetails: row.medication_details,
            emergencyName: row.emergency_name,
            emergencyPhone: row.emergency_phone,
            emergencyRelationship: row.emergency_relationship,
          }];
        });

        return Response.json({ data }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});
