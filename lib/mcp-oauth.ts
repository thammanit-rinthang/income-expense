import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "@/app/generated/prisma/client";

export interface OAuthTokenPair {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export function oauthError(error: string, status = 400): Response {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export function noStoreHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "no-store");
  headers.set("Pragma", "no-cache");
  return headers;
}

export function hashOAuthSecret(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function newOAuthSecret(prefix: string): string {
  return `${prefix}${randomBytes(32).toString("base64url")}`;
}

export function createPkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier, "ascii").digest("base64url");
}

export function isValidRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return (
      (url.protocol === "https:" || (url.protocol === "http:" && isLocalHost)) &&
      !url.username &&
      !url.password &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export function isChatGptRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "chatgpt.com" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.pathname === "/connector_platform_oauth_redirect" ||
        /^\/connector\/oauth\/[A-Za-z0-9_-]+$/.test(url.pathname))
    );
  } catch {
    return false;
  }
}

const GEMINI_REDIRECT_HOSTS = new Set([
  "oauth-redirect.googleusercontent.com",
  "oauth-redirect-sandbox.googleusercontent.com",
  "oauth-redirect-test.googleusercontent.com",
]);

export function isGeminiRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.port &&
      GEMINI_REDIRECT_HOSTS.has(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      /^\/(r|a)\/[A-Za-z0-9_-]+$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function isSupportedMcpRedirectUri(value: string): boolean {
  return isChatGptRedirectUri(value) || isGeminiRedirectUri(value);
}

export function getRedirectUris(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] || character;
  });
}

export function renderApiKeyLoginForm(
  action: string,
  hiddenFields: Record<string, string>,
  message = "",
): Response {
  const formActionHosts = [
    "https://chatgpt.com",
    "https://oauth-redirect.googleusercontent.com",
    "https://oauth-redirect-sandbox.googleusercontent.com",
    "https://oauth-redirect-test.googleusercontent.com",
  ].join(" ");
  const hiddenInputs = Object.entries(hiddenFields)
    .map(([name, value]) => `<input type="hidden" name="${htmlEscape(name)}" value="${htmlEscape(value)}">`)
    .join("");
  const safeMessage = message ? `<p role="alert">${htmlEscape(message)}</p>` : "";
  const document = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect Income Expense</title><style>body{font:16px system-ui,sans-serif;background:#f7f8fa;color:#202735;margin:0;min-height:100vh;display:grid;place-items:center}.card{width:min(420px,calc(100% - 32px));box-sizing:border-box;background:white;border:1px solid #e2e6eb;border-radius:16px;padding:28px}h1{font-size:22px;margin:0 0 8px}p{color:#687385;line-height:1.5}label{display:block;font-weight:600;margin:20px 0 8px}input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #cbd2dc;border-radius:10px;font:inherit}button{width:100%;margin-top:16px;padding:12px;border:0;border-radius:10px;background:#166b5d;color:white;font:inherit;font-weight:700;cursor:pointer}[role=alert]{color:#a33232}</style></head><body><main class="card"><h1>Connect Income Expense</h1><p>Enter the personal API key issued for your account. It grants access only to that person's financial data. Actions depend on the key's access level.</p>${safeMessage}<form method="post" action="${htmlEscape(action)}">${hiddenInputs}<label for="api_key">Personal API key</label><input id="api_key" name="api_key" type="password" autocomplete="off" required maxlength="160"><button type="submit">Authorize connection</button></form></main></body></html>`;
  return new Response(document, {
    headers: noStoreHeaders({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${formActionHosts}; base-uri 'none'; frame-ancestors 'none'`,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    }),
  });
}

export async function issueOAuthTokenPair(
  tx: Prisma.TransactionClient,
  input: {
    clientId: string;
    apiKeyId: number;
    resource: string;
    scope: string;
    refreshToken?: string;
  },
): Promise<OAuthTokenPair> {
  const accessToken = newOAuthSecret("mcp_at_");
  const refreshToken = input.refreshToken || newOAuthSecret("mcp_rt_");
  const now = new Date();
  const accessExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  const refreshExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await tx.mcpOAuthToken.deleteMany({
    where: {
      OR: [
        { expires_at: { lt: now } },
        { revoked_at: { not: null } },
      ],
    },
  });

  await tx.mcpOAuthToken.create({
    data: {
      token_hash: hashOAuthSecret(accessToken),
      token_type: "access",
      client_id: input.clientId,
      api_key_id: input.apiKeyId,
      resource: input.resource,
      scope: input.scope,
      expires_at: accessExpiresAt,
    },
  });

  if (input.refreshToken) {
    await tx.mcpOAuthToken.update({
      where: { token_hash: hashOAuthSecret(refreshToken) },
      data: { expires_at: refreshExpiresAt, scope: input.scope },
    });
  } else {
    await tx.mcpOAuthToken.create({
      data: {
        token_hash: hashOAuthSecret(refreshToken),
        token_type: "refresh",
        client_id: input.clientId,
        api_key_id: input.apiKeyId,
        resource: input.resource,
        scope: input.scope,
        expires_at: refreshExpiresAt,
      },
    });
  }

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 15 * 60,
    refresh_token: refreshToken,
    scope: input.scope,
  };
}
