import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  accessTokenCookie,
  authenticateStaff,
  backendDisabledResponse,
  getBackendConfig,
  jsonError,
  sameOriginRequest,
} from "../lib/server/matricula-api";

const credentialsSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(1024),
  })
  .strict();

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!sameOriginRequest(request)) {
          return jsonError("Origem da solicitação não autorizada.", 403, "ORIGIN_NOT_ALLOWED");
        }

        const config = getBackendConfig();
        if (!config) return backendDisabledResponse();

        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
          return jsonError("Envie as credenciais em formato JSON.", 415, "UNSUPPORTED_MEDIA_TYPE");
        }

        const contentLength = Number(request.headers.get("content-length") ?? "0");
        if (Number.isFinite(contentLength) && contentLength > 8192) {
          return jsonError("Solicitação excede o limite permitido.", 413, "PAYLOAD_TOO_LARGE");
        }

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return jsonError("Corpo JSON inválido.", 400, "INVALID_JSON");
        }

        const parsed = credentialsSchema.safeParse(payload);
        if (!parsed.success) {
          return jsonError("Informe e-mail e senha válidos.", 400, "VALIDATION_FAILED");
        }

        try {
          const upstream = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: {
              apikey: config.anonKey,
              "content-type": "application/json",
            },
            body: JSON.stringify(parsed.data),
            cache: "no-store",
          });

          if (!upstream.ok) {
            // Same response for unknown user and incorrect password.
            return jsonError(
              "Não foi possível autenticar com essas credenciais.",
              401,
              "LOGIN_FAILED",
            );
          }

          const session = (await upstream.json()) as {
            access_token?: unknown;
            expires_in?: unknown;
          };
          if (typeof session.access_token !== "string" || !session.access_token) {
            return jsonError(
              "Serviço de autenticação retornou uma sessão inválida.",
              502,
              "INVALID_AUTH_RESPONSE",
            );
          }

          const verificationRequest = new Request(request.url, {
            headers: { authorization: `Bearer ${session.access_token}` },
          });
          const auth = await authenticateStaff(verificationRequest);
          if (!auth.ok) {
            return jsonError("Conta sem perfil institucional ativo.", 403, "STAFF_ACCESS_DENIED");
          }

          const expiresIn =
            typeof session.expires_in === "number" && Number.isFinite(session.expires_in)
              ? session.expires_in
              : 3600;
          const response = Response.json(
            { data: { id: auth.staff.profile.id, role: auth.staff.profile.role } },
            { headers: { "cache-control": "no-store" } },
          );
          response.headers.append(
            "set-cookie",
            accessTokenCookie(request, session.access_token, expiresIn),
          );
          return response;
        } catch {
          return jsonError(
            "Serviço de autenticação indisponível.",
            503,
            "AUTH_SERVICE_UNAVAILABLE",
          );
        }
      },
    },
  },
});
