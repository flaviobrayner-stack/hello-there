import { createFileRoute } from "@tanstack/react-router";

import {
  authenticateStaff,
  jsonError,
  safeRestFailure,
  staffRestRequest,
} from "../lib/server/matricula-api";

export const Route = createFileRoute("/api/courses")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authenticateStaff(request);
        if (!auth.ok) return auth.response;

        const upstream = await staffRestRequest(
          auth.config,
          auth.staff.accessToken,
          "courses?select=id,name&active=eq.true&order=name.asc&limit=100",
        );

        if (!upstream.ok) return safeRestFailure(upstream);
        const rows = (await upstream.json()) as unknown;
        if (!Array.isArray(rows)) {
          return jsonError("Resposta inválida do serviço de dados.", 502, "INVALID_DATA_RESPONSE");
        }

        return Response.json(
          { data: rows, limit: 100 },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
