import { getMcpPublicUrl } from "@/lib/mcp-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const origin = getMcpPublicUrl(request.url).origin;
    return Response.json(
      {
        issuer: origin,
        authorization_endpoint: `${origin}/api/mcp/oauth/authorize`,
        token_endpoint: `${origin}/api/mcp/oauth/token`,
        registration_endpoint: `${origin}/api/mcp/oauth/register`,
        revocation_endpoint: `${origin}/api/mcp/oauth/revoke`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none"],
        scopes_supported: ["finance:read", "finance:write", "offline_access"],
        resource_parameter_supported: true,
        authorization_response_iss_parameter_supported: true,
        revocation_endpoint_auth_methods_supported: ["none"],
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
