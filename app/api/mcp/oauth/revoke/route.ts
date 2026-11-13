import prisma from "@/lib/prisma";
import { hashOAuthSecret } from "@/lib/mcp-oauth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8_192) return new Response(null, { status: 400 });
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/x-www-form-urlencoded")) {
    return new Response(null, { status: 400 });
  }

  const bodyText = await request.text();
  if (bodyText.length > 8_192) return new Response(null, { status: 413 });
  const form = new URLSearchParams(bodyText);
  const token = form.get("token") || "";
  const clientId = form.get("client_id") || "";
  if (!token || !clientId) return new Response(null, { status: 200, headers: { "Cache-Control": "no-store" } });

  try {
    const storedToken = await prisma.mcpOAuthToken.findUnique({
      where: { token_hash: hashOAuthSecret(token) },
      select: { client_id: true, api_key_id: true, resource: true },
    });
    if (storedToken?.client_id === clientId) {
      await prisma.mcpOAuthToken.updateMany({
        where: {
          client_id: clientId,
          api_key_id: storedToken.api_key_id,
          resource: storedToken.resource,
          revoked_at: null,
        },
        data: { revoked_at: new Date() },
      });
    }
  } catch (error) {
    console.error("MCP OAuth token revocation failed:", error);
  }

  return new Response(null, { status: 200, headers: { "Cache-Control": "no-store" } });
}
