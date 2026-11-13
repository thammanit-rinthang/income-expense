import prisma from "@/lib/prisma";
import { createPkceChallenge, getRedirectUris, hashOAuthSecret, isGeminiRedirectUri, issueOAuthTokenPair, oauthError } from "@/lib/mcp-oauth";
import { getMcpResourceUrl } from "@/lib/mcp-auth";

export const dynamic = "force-dynamic";

async function readForm(request: Request): Promise<URLSearchParams | null> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8_192) return null;

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/x-www-form-urlencoded")) return null;
  const text = await request.text();
  if (text.length > 8_192) return null;
  return new URLSearchParams(text);
}

export async function POST(request: Request) {
  const form = await readForm(request);
  if (!form) return oauthError("invalid_request");

  const grantType = form.get("grant_type");
  const clientId = form.get("client_id");
  if (!clientId) return oauthError("invalid_client");

  const client = await prisma.mcpOAuthClient.findUnique({ where: { client_id: clientId } });
  if (!client) return oauthError("invalid_client", 401);

  try {
    if (grantType === "authorization_code") {
      const code = form.get("code") || "";
      const redirectUri = form.get("redirect_uri") || "";
      const verifier = form.get("code_verifier") || "";
      if (!code || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || !redirectUri) {
        return oauthError("invalid_grant");
      }

      const resource = getMcpResourceUrl(request.url);
      const codeHash = hashOAuthSecret(code);
      const authorization = await prisma.mcpAuthorizationCode.findUnique({ where: { code_hash: codeHash } });
      if (
        !authorization ||
        authorization.client_id !== clientId ||
        authorization.redirect_uri !== redirectUri ||
        authorization.expires_at <= new Date() ||
        authorization.resource !== resource ||
        createPkceChallenge(verifier) !== authorization.code_challenge
      ) {
        return oauthError("invalid_grant");
      }

      const tokens = await prisma.$transaction(async (tx) => {
        const deletion = await tx.mcpAuthorizationCode.deleteMany({ where: { code_hash: codeHash, expires_at: { gt: new Date() } } });
        if (deletion.count !== 1) throw new Error("AUTHORIZATION_CODE_REDEEMED");

        const apiKey = await tx.mcpApiKey.findUnique({ where: { id: authorization.api_key_id } });
        if (!apiKey || apiKey.revoked_at) throw new Error("API_KEY_REVOKED");

        return issueOAuthTokenPair(tx, {
          clientId,
          apiKeyId: apiKey.id,
          resource,
          scope: authorization.scope,
        });
      });

      return Response.json(tokens, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
    }

    if (grantType === "refresh_token") {
      const refreshToken = form.get("refresh_token") || "";
      if (!refreshToken) return oauthError("invalid_grant");

      const refreshHash = hashOAuthSecret(refreshToken);
      const current = await prisma.mcpOAuthToken.findUnique({
        where: { token_hash: refreshHash },
        include: { api_key: true },
      });
      const resource = getMcpResourceUrl(request.url);
      if (
        !current ||
        current.token_type !== "refresh" ||
        current.client_id !== clientId ||
        current.resource !== resource ||
        current.expires_at <= new Date() ||
        current.revoked_at ||
        current.api_key.revoked_at
      ) {
        return oauthError("invalid_grant");
      }

      const requestedScopes = form.get("scope")?.split(/\s+/).filter(Boolean);
      const existingScopes = current.scope.split(" ").filter(Boolean);
      if (requestedScopes?.some((scope) => !existingScopes.includes(scope)) || requestedScopes?.length === 0) {
        return oauthError("invalid_scope");
      }

      const tokens = await prisma.$transaction(async (tx) => {
        const keepsRefreshToken = getRedirectUris(client.redirect_uris).some(isGeminiRedirectUri);
        if (!keepsRefreshToken) {
          const rotation = await tx.mcpOAuthToken.updateMany({
            where: { token_hash: refreshHash, token_type: "refresh", revoked_at: null, expires_at: { gt: new Date() } },
            data: { revoked_at: new Date() },
          });
          if (rotation.count !== 1) throw new Error("REFRESH_TOKEN_REPLAYED");
        }

        const apiKey = await tx.mcpApiKey.findUnique({ where: { id: current.api_key_id } });
        if (!apiKey || apiKey.revoked_at) throw new Error("API_KEY_REVOKED");

        return issueOAuthTokenPair(tx, {
          clientId,
          apiKeyId: apiKey.id,
          resource,
          scope: requestedScopes?.join(" ") || current.scope,
          ...(keepsRefreshToken ? { refreshToken } : {}),
        });
      });

      return Response.json(tokens, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
    }

    return oauthError("unsupported_grant_type");
  } catch (error) {
    if (error instanceof Error && ["AUTHORIZATION_CODE_REDEEMED", "API_KEY_REVOKED", "REFRESH_TOKEN_REPLAYED"].includes(error.message)) {
      return oauthError("invalid_grant");
    }
    console.error("MCP OAuth token exchange failed:", error);
    return oauthError("server_error", 500);
  }
}
