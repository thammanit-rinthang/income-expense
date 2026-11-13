import { z } from "zod";
import prisma from "@/lib/prisma";
import { findActiveApiKey, getMcpPublicUrl, getMcpResourceUrl } from "@/lib/mcp-auth";
import {
  getRedirectUris,
  hashOAuthSecret,
  isValidRedirectUri,
  newOAuthSecret,
  oauthError,
  renderApiKeyLoginForm,
} from "@/lib/mcp-oauth";

export const dynamic = "force-dynamic";

const authorizeSchema = z.object({
  client_id: z.string().min(1).max(200),
  redirect_uri: z.string().url(),
  response_type: z.literal("code"),
  state: z.string().max(512).optional(),
  code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  code_challenge_method: z.literal("S256"),
  resource: z.string().url().optional(),
  scope: z.string().max(200).optional(),
});

function paramsFromSearch(searchParams: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of ["client_id", "redirect_uri", "response_type", "state", "code_challenge", "code_challenge_method", "resource", "scope"]) {
    const value = searchParams.get(key);
    if (value !== null) result[key] = value;
  }
  return result;
}

async function validateRequest(params: Record<string, string>, requestUrl: string) {
  const parsed = authorizeSchema.safeParse(params);
  if (!parsed.success) return { failure: { code: "invalid_request", status: 400 } } as const;

  const data = parsed.data;
  if (!isValidRedirectUri(data.redirect_uri)) {
    return { failure: { code: "invalid_request", status: 400 } } as const;
  }

  const client = await prisma.mcpOAuthClient.findUnique({ where: { client_id: data.client_id } });
  if (!client || !getRedirectUris(client.redirect_uris).includes(data.redirect_uri)) {
    return { failure: { code: "invalid_client", status: 400 } } as const;
  }

  let resource: string;
  try {
    resource = getMcpResourceUrl(requestUrl);
  } catch {
    return { failure: { code: "server_error", status: 503 } } as const;
  }
  if (data.resource && data.resource !== resource) {
    return { failure: { code: "invalid_target", status: 400 } } as const;
  }

  const requestedScopes = data.scope?.split(/\s+/).filter(Boolean) || ["finance:read", "finance:write"];
  if (requestedScopes.some((scope) => !["finance:read", "finance:write", "offline_access"].includes(scope))) {
    return { failure: { code: "invalid_scope", status: 400 } } as const;
  }
  if (!requestedScopes.includes("finance:read")) {
    return { failure: { code: "invalid_scope", status: 400 } } as const;
  }

  return { data, client, resource, requestedScopes } as const;
}

async function authorizationFailure(
  requestUrl: string,
  fields: Record<string, string>,
  code: string,
  status: number,
): Promise<Response> {
  const clientId = fields.client_id || "";
  const redirectUri = fields.redirect_uri || "";

  if (clientId && isValidRedirectUri(redirectUri)) {
    const client = await prisma.mcpOAuthClient.findUnique({ where: { client_id: clientId } });
    if (client && getRedirectUris(client.redirect_uris).includes(redirectUri)) {
      try {
        const redirect = new URL(redirectUri);
        redirect.searchParams.set("error", code);
        if (fields.state !== undefined && fields.state.length <= 512) {
          redirect.searchParams.set("state", fields.state);
        }
        redirect.searchParams.set("iss", getMcpPublicUrl(requestUrl).origin);
        return new Response(null, {
          status: 302,
          headers: {
            Location: redirect.toString(),
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer",
          },
        });
      } catch {
        // Fall back to a local OAuth error if the public issuer is not configured.
      }
    }
  }

  return oauthError(code, status);
}

function safeHtmlErrorResponse(message: string, status: number, hiddenFields: Record<string, string>): Response {
  const page = renderApiKeyLoginForm("/api/mcp/oauth/authorize", hiddenFields, message);
  return new Response(page.body, { status, headers: page.headers });
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const fields = paramsFromSearch(searchParams);
  const validated = await validateRequest(fields, request.url);
  if (validated.failure) {
    return authorizationFailure(request.url, fields, validated.failure.code, validated.failure.status);
  }

  const hiddenFields = { ...fields, resource: validated.resource };
  return renderApiKeyLoginForm("/api/mcp/oauth/authorize", hiddenFields);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8_192) return oauthError("invalid_request", 413);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/x-www-form-urlencoded")) return oauthError("invalid_request");
  const formText = await request.text();
  if (formText.length > 8_192) return oauthError("invalid_request", 413);
  const formData = new URLSearchParams(formText);

  const fields: Record<string, string> = {};
  for (const field of ["client_id", "redirect_uri", "response_type", "state", "code_challenge", "code_challenge_method", "resource", "scope"]) {
    const value = formData.get(field);
    if (value !== null) fields[field] = value;
  }

  const validated = await validateRequest(fields, request.url);
  if (validated.failure) {
    return authorizationFailure(request.url, fields, validated.failure.code, validated.failure.status);
  }

  const apiKeyText = formData.get("api_key") || "";
  const apiKey = apiKeyText.length <= 160 ? await findActiveApiKey(apiKeyText) : null;
  const hiddenFields = { ...fields, resource: validated.resource };
  if (!apiKey) return safeHtmlErrorResponse("The API key is invalid or has been revoked.", 401, hiddenFields);

  const allowedScopes = apiKey.access_level === "read_write"
    ? ["finance:read", "finance:write", "offline_access"]
    : ["finance:read", "offline_access"];
  const grantedScopes = validated.requestedScopes.filter((scope) => allowedScopes.includes(scope));
  if (!grantedScopes.includes("finance:read")) {
    return safeHtmlErrorResponse("This key does not grant the requested access.", 403, hiddenFields);
  }

  try {
    const authorizationCode = newOAuthSecret("mcp_code_");
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.mcpAuthorizationCode.deleteMany({ where: { expires_at: { lt: now } } });
      await tx.mcpAuthorizationCode.create({
        data: {
          code_hash: hashOAuthSecret(authorizationCode),
          client_id: validated.client.client_id,
          api_key_id: apiKey.id,
          redirect_uri: validated.data.redirect_uri,
          code_challenge: validated.data.code_challenge,
          resource: validated.resource,
          scope: grantedScopes.join(" "),
          expires_at: new Date(now.getTime() + 5 * 60 * 1000),
        },
      });
      await tx.mcpApiKey.update({ where: { id: apiKey.id }, data: { last_used_at: now } });
    });

    const redirect = new URL(validated.data.redirect_uri);
    redirect.searchParams.set("code", authorizationCode);
    if (validated.data.state !== undefined) redirect.searchParams.set("state", validated.data.state);
    redirect.searchParams.set("iss", getMcpPublicUrl(request.url).origin);
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirect.toString(),
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("Failed to create MCP authorization code:", error);
    return safeHtmlErrorResponse("Unable to authorize the connection. Try again.", 500, hiddenFields);
  }
}
