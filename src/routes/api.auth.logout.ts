import { createFileRoute } from "@tanstack/react-router";

import { clearAccessTokenCookie, jsonError, sameOriginRequest } from "../lib/server/matricula-api";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!sameOriginRequest(request)) {
          return jsonError("Origem da solicitação não autorizada.", 403, "ORIGIN_NOT_ALLOWED");
        }

        const response = Response.json(
          { data: { signedOut: true } },
          { headers: { "cache-control": "no-store" } },
        );
        response.headers.append("set-cookie", clearAccessTokenCookie(request));
        return response;
      },
    },
  },
});
