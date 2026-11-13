import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashSecret, newSecret, requireMcpAdminSecret } from "@/lib/mcp-auth";

const createKeySchema = z.object({
  person_name: z.enum(["Bon", "Ray"]),
  label: z.string().trim().min(1).max(80),
  access_level: z.enum(["read_only", "read_write"]).default("read_write"),
});

export async function GET(request: Request) {
  const unauthorized = requireMcpAdminSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const keys = await prisma.mcpApiKey.findMany({
      select: {
        id: true,
        person_name: true,
        label: true,
        access_level: true,
        key_prefix: true,
        created_at: true,
        last_used_at: true,
        revoked_at: true,
      },
      orderBy: [{ person_name: "asc" }, { created_at: "desc" }],
    });
    return NextResponse.json(keys, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to list MCP API keys:", error);
    return NextResponse.json({ error: "Unable to list API keys." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = requireMcpAdminSecret(request);
  if (unauthorized) return unauthorized;
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4_096) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });

  try {
    const bodyText = await request.text();
    if (bodyText.length > 4_096) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    let rawBody: unknown;
    try {
      rawBody = JSON.parse(bodyText) as unknown;
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const data = createKeySchema.parse(rawBody);
    const rawKey = newSecret(`income_${data.person_name.toLowerCase()}_`);
    const key = await prisma.mcpApiKey.create({
      data: {
        person_name: data.person_name,
        label: data.label,
        access_level: data.access_level,
        key_prefix: rawKey.slice(0, 22),
        key_hash: hashSecret(rawKey),
      },
      select: {
        id: true,
        person_name: true,
        label: true,
        access_level: true,
        key_prefix: true,
        created_at: true,
      },
    });

    return NextResponse.json({ ...key, api_key: rawKey }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Failed to create MCP API key:", error);
    return NextResponse.json({ error: "Unable to create API key." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = requireMcpAdminSecret(request);
  if (unauthorized) return unauthorized;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "A valid API key ID is required." }, { status: 400 });
  }

  try {
    const result = await prisma.mcpApiKey.updateMany({
      where: { id, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    if (!result.count) {
      return NextResponse.json({ error: "Active API key not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to revoke MCP API key:", error);
    return NextResponse.json({ error: "Unable to revoke API key." }, { status: 500 });
  }
}
