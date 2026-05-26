import { draftBrief } from "../../../../lib/server/actions";
import { apiOk, readJson } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  return apiOk(draftBrief(body));
}
