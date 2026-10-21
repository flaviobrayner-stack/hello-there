import { createFileRoute } from "@tanstack/react-router";

import { authenticateStaff } from "../lib/server/matricula-api";

export const Route = createFileRoute("/api/auth/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authenticateStaff(request);
        if (!auth.ok) return auth.response;

        return Response.json(
          { data: { id: auth.staff.profile.id, role: auth.staff.profile.role } },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
