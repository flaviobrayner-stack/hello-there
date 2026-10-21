import { createFileRoute } from "@tanstack/react-router";

import {
  authenticateStaff,
  jsonError,
  safeRestFailure,
  staffRestRequest,
} from "../lib/server/matricula-api";

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
            "id,protocol,academic_year,status,created_at,course:courses(name),student:students(full_name)",
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
        const auth = await authenticateStaff(request);
        if (!auth.ok) return auth.response;

        // Creation must be one transaction (student + enrollment + protocol +
        // audit). It remains closed until the reviewed RPC/migration and
        // authorization tests exist; separate REST inserts could leave orphans.
        return jsonError(
          "A criação de matrículas será habilitada após a função transacional e suas políticas serem revisadas.",
          501,
          "TRANSACTIONAL_CREATE_NOT_READY",
        );
      },
    },
  },
});
