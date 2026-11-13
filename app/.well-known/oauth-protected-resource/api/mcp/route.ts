import { getMcpPublicUrl, getMcpResourceUrl } from "@/lib/mcp-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const origin = getMcpPublicUrl(request.url).origin;
    return Response.json(
      {
        resource: getMcpResourceUrl(request.url),
        authorization_servers: [origin],
        scopes_supported: ["finance:read", "finance:write"],
        bearer_methods_supported: ["header"],
      },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "OAuth metadata is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
