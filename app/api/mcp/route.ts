import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createFinanceMcpServer } from "@/mcp/create-server";
import { findActiveOAuthIdentity, getMcpPublicUrl, getMcpResourceUrl } from "@/lib/mcp-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function methodNotAllowedResponse(): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    },
    {
      status: 405,
      headers: { Allow: "POST", "Cache-Control": "no-store" },
    },
  );
}

function unauthorizedResponse(requestUrl: string): Response {
  let metadataUrl = "";
  try {
    const base = getMcpPublicUrl(requestUrl);
    metadataUrl = new URL("/.well-known/oauth-protected-resource/api/mcp", base).toString();
  } catch {
    // Keep the response generic while MCP_PUBLIC_URL is being configured.
  }

  return Response.json(
    { error: "A valid OAuth bearer token is required." },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${metadataUrl}", scope="finance:read"`,
        "Cache-Control": "no-store",
      },
    },
  );
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!accessToken || accessToken.length > 256) return unauthorizedResponse(request.url);

  try {
    const resource = getMcpResourceUrl(request.url);
    const identity = await findActiveOAuthIdentity(accessToken, resource);
    if (!identity || !identity.scopes.includes("finance:read")) return unauthorizedResponse(request.url);
    if (request.method !== "POST") return methodNotAllowedResponse();

    const origin = getMcpPublicUrl(request.url).origin;
    const server = createFinanceMcpServer({
      apiBaseUrl: origin,
      allowRemoteApi: true,
      personName: identity.personName,
      scopes: identity.scopes,
    });
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    try {
      const response = await transport.handleRequest(request, {
        authInfo: {
          token: accessToken,
          clientId: identity.clientId,
          scopes: identity.scopes,
          resource: new URL(resource),
          extra: { personName: identity.personName },
        },
      });
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } finally {
      await transport.close();
      await server.close();
    }
  } catch (error) {
    console.error("MCP request failed:", error);
    return Response.json({ error: "MCP request could not be processed." }, { status: 500 });
  }
}

export const POST = handleMcpRequest;
export const GET = handleMcpRequest;
export const DELETE = handleMcpRequest;
