import { apiOk } from "../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiOk({
    name: "灵工智创平台 API",
    version: "1.0.0",
    endpoints: [
      "GET /api/marketplace",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "POST /api/agent/brief",
      "GET /api/projects",
      "POST /api/projects",
      "GET /api/projects/:id",
      "GET /api/projects/:id/matches",
      "POST /api/projects/:id/invite",
      "POST /api/projects/:id/interest",
      "GET /api/creators",
      "POST /api/creators",
      "GET /api/creators/:id",
      "GET /api/buyers/:id",
      "POST /api/buyers",
      "GET /api/orders",
      "GET /api/orders/:id",
      "POST /api/orders/:id/messages",
      "PATCH /api/orders/:id/status",
      "GET /api/admin/metrics",
      "PATCH /api/admin/verify",
      "POST /api/reset"
    ]
  });
}
