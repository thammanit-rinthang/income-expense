import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import prisma from "@/lib/prisma";

export const MCP_PEOPLE = ["Bon", "Ray"] as const;
export type McpPerson = (typeof MCP_PEOPLE)[number];

export interface McpIdentity {
  apiKeyId: number;
  clientId: string;
  personName: McpPerson;
  scopes: string[];
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function newSecret(prefix: string): string {
  return `${prefix}${randomBytes(32).toString("base64url")}`;
}

export function secureEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function getMcpPublicUrl(requestUrl?: string): URL {
  const configuredUrl = process.env.MCP_PUBLIC_URL;
  if (process.env.NODE_ENV === "production" && !configuredUrl) {
    throw new Error("Set MCP_PUBLIC_URL to the public HTTPS origin before enabling cloud MCP.");
  }
  const candidate = configuredUrl || (requestUrl ? new URL(requestUrl).origin : "http://127.0.0.1:3000");
  const parsed = new URL(candidate);
  const localHost = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);

  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && localHost)) {
    throw new Error("MCP_PUBLIC_URL must use HTTPS outside local development.");
  }
  if (parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error("MCP_PUBLIC_URL must be an origin without a path, query, or credentials.");
  }

  return parsed;
}

export function getMcpResourceUrl(requestUrl?: string): string {
  return new URL("/api/mcp", getMcpPublicUrl(requestUrl)).toString();
}

export function requireMcpAdminSecret(request: Request): Response | null {
  const configuredSecret = process.env.MCP_KEY_ADMIN_SECRET;
  if (!configuredSecret || configuredSecret.length < 32) {
    return Response.json(
      { error: "MCP key management is disabled. Set MCP_KEY_ADMIN_SECRET to a random value of at least 32 characters." },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") || "";
  const suppliedSecret = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!suppliedSecret || !secureEquals(suppliedSecret, configuredSecret)) {
    return Response.json({ error: "Administrator authorization is required." }, { status: 401 });
  }

  return null;
}

export async function findActiveApiKey(rawKey: string) {
  const keyHash = hashSecret(rawKey);
  const apiKey = await prisma.mcpApiKey.findUnique({ where: { key_hash: keyHash } });
  if (!apiKey || apiKey.revoked_at) return null;
  return apiKey;
}

async function markApiKeyUsed(apiKeyId: number): Promise<void> {
  const now = new Date();
  await prisma.mcpApiKey.updateMany({
    where: {
      id: apiKeyId,
      revoked_at: null,
      OR: [
        { last_used_at: null },
        { last_used_at: { lt: new Date(now.getTime() - 60_000) } },
      ],
    },
    data: { last_used_at: now },
  });
}

export async function findActiveApiKeyIdentity(rawKey: string): Promise<McpIdentity | null> {
  const apiKey = await findActiveApiKey(rawKey);
  if (!apiKey || !MCP_PEOPLE.includes(apiKey.person_name as McpPerson)) return null;

  await markApiKeyUsed(apiKey.id);

  return {
    apiKeyId: apiKey.id,
    clientId: `api-key:${apiKey.key_prefix}`,
    personName: apiKey.person_name as McpPerson,
    scopes: apiKey.access_level === "read_write" ? ["finance:read", "finance:write"] : ["finance:read"],
  };
}

export async function findActiveOAuthIdentity(rawToken: string, resource: string): Promise<McpIdentity | null> {
  const tokenHash = hashSecret(rawToken);
  const token = await prisma.mcpOAuthToken.findUnique({
    where: { token_hash: tokenHash },
    include: { api_key: true },
  });

  if (
    !token ||
    token.token_type !== "access" ||
    token.revoked_at ||
    token.expires_at <= new Date() ||
    token.resource !== resource ||
    token.api_key.revoked_at
  ) {
    return null;
  }

  const personName = token.api_key.person_name;
  if (!MCP_PEOPLE.includes(personName as McpPerson)) return null;

  await markApiKeyUsed(token.api_key_id);

  return {
    apiKeyId: token.api_key_id,
    clientId: token.client_id,
    personName: personName as McpPerson,
    scopes: token.scope.split(" ").filter(Boolean),
  };
}
