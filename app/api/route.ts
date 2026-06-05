import { apiOk } from "../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiOk({
    name: "AIGClancer API",
    version: "1.0.0",
    endpoints: [
      "GET /api/marketplace",
      "GET /api/health",
      "POST /api/auth/register",
      "POST /api/auth/register role=admin inviteCode=ADMIN_INVITE_CODE",
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
      "PATCH /api/admin/users/:id/suspend",
      "GET/POST /api/reports",
      "GET/POST /api/feedback",
      "PATCH /api/admin/feedback/:id"
    ]
  });
}
