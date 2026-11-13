import { z } from "zod";
import prisma from "@/lib/prisma";
import { isChatGptRedirectUri, isValidRedirectUri, newOAuthSecret, oauthError } from "@/lib/mcp-oauth";

export const dynamic = "force-dynamic";

const registrationSchema = z.object({
  client_name: z.string().trim().min(1).max(120).optional(),
  redirect_uris: z.array(z.string().url()).min(1).max(10),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  token_endpoint_auth_method: z.string().optional(),
}).passthrough();

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_384) return oauthError("invalid_client_metadata", 413);

  try {
    const bodyText = await request.text();
    if (bodyText.length > 16_384) return oauthError("invalid_client_metadata", 413);
    let rawBody: unknown;
    try {
      rawBody = JSON.parse(bodyText) as unknown;
    } catch {
      return oauthError("invalid_client_metadata");
    }
    const parsed = registrationSchema.safeParse(rawBody);
    if (!parsed.success) return oauthError("invalid_client_metadata");

    const data = parsed.data;
    if (data.redirect_uris.some((uri) => !isValidRedirectUri(uri) || !isChatGptRedirectUri(uri))) {
      return oauthError("invalid_redirect_uri");
    }
    if (data.token_endpoint_auth_method && data.token_endpoint_auth_method !== "none") {
      return oauthError("invalid_client_metadata");
    }
    if (data.grant_types?.some((grant) => !["authorization_code", "refresh_token"].includes(grant))) {
      return oauthError("invalid_client_metadata");
    }
    if (data.grant_types && !data.grant_types.includes("authorization_code")) {
      return oauthError("invalid_client_metadata");
    }
    if (data.response_types?.some((type) => type !== "code")) {
      return oauthError("invalid_client_metadata");
    }
    if (data.response_types && !data.response_types.includes("code")) {
      return oauthError("invalid_client_metadata");
    }

    const clientId = newOAuthSecret("chatgpt_");
    const client = await prisma.mcpOAuthClient.create({
      data: {
        client_id: clientId,
        client_name: data.client_name || "ChatGPT",
        redirect_uris: data.redirect_uris,
      },
    });

    return Response.json(
      {
        client_id: client.client_id,
        client_name: client.client_name,
        redirect_uris: data.redirect_uris,
        grant_types: data.grant_types || ["authorization_code", "refresh_token"],
        response_types: data.response_types || ["code"],
        token_endpoint_auth_method: "none",
        client_id_issued_at: Math.floor(client.created_at.getTime() / 1000),
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to register MCP OAuth client:", error);
    return oauthError("server_error", 500);
  }
}
