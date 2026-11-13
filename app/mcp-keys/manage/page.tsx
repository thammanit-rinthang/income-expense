"use client";

import { useCallback, useState } from "react";
import { KeyRound, Copy, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";

interface ApiKeyRecord {
  id: number;
  person_name: "Bon" | "Ray";
  label: string;
  access_level: "read_only" | "read_write";
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

interface CreatedApiKey extends ApiKeyRecord {
  api_key: string;
}

function formatDate(value: string | null): string {
  if (!value) return "ยังไม่เคยใช้";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function McpKeysPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [personName, setPersonName] = useState<"Bon" | "Ray">("Bon");
  const [label, setLabel] = useState("ChatGPT Cloud");
  const [accessLevel, setAccessLevel] = useState<"read_only" | "read_write">("read_write");
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const loadKeys = useCallback(async (secret: string) => {
    const response = await fetch("/api/mcp/keys", {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const result = await response.json() as ApiKeyRecord[] | { error?: string };
    if (!response.ok) throw new Error("error" in result ? result.error || "โหลด API keys ไม่สำเร็จ" : "โหลด API keys ไม่สำเร็จ");
    setKeys(result as ApiKeyRecord[]);
    setAuthorized(true);
  }, []);

  const authorize = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loadKeys(adminSecret);
    } catch (loadError) {
      setAuthorized(false);
      setError(loadError instanceof Error ? loadError.message : "ยืนยันตัวตนไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const createKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCreatedKey(null);
    try {
      const response = await fetch("/api/mcp/keys", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminSecret}`, "Content-Type": "application/json" },
        body: JSON.stringify({ person_name: personName, label, access_level: accessLevel }),
      });
      const result = await response.json() as CreatedApiKey | { error?: string };
      if (!response.ok) throw new Error("error" in result ? result.error || "สร้าง API key ไม่สำเร็จ" : "สร้าง API key ไม่สำเร็จ");
      setCreatedKey(result as CreatedApiKey);
      await loadKeys(adminSecret);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "สร้าง API key ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const revokeKey = async (key: ApiKeyRecord) => {
    if (!window.confirm(`ยกเลิก API key “${key.label}” ของ ${key.person_name}?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/mcp/keys?id=${key.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminSecret}` },
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "ยกเลิก API key ไม่สำเร็จ");
      if (createdKey?.id === key.id) setCreatedKey(null);
      await loadKeys(adminSecret);
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "ยกเลิก API key ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex items-start gap-3">
        <div className="rounded-xl border border-base-300 bg-base-100 p-3 text-primary">
          <KeyRound size={22} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-base-content">API keys สำหรับ MCP</h1>
          <p className="mt-1 text-sm text-base-content/60">ออกคีย์แยกตามบุคคลเพื่อเชื่อม ChatGPT Cloud</p>
        </div>
      </header>

      {!authorized ? (
        <form onSubmit={authorize} className="space-y-4 rounded-xl border border-base-300 bg-base-100 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={17} aria-hidden="true" />
            ต้องใช้รหัสผู้ดูแล
          </div>
          <p className="text-sm text-base-content/60">ใส่ค่า MCP_KEY_ADMIN_SECRET ที่ตั้งไว้ใน Environment Variables ของ Vercel</p>
          <input
            type="password"
            autoComplete="current-password"
            value={adminSecret}
            onChange={(event) => setAdminSecret(event.target.value)}
            className="input input-bordered w-full rounded-xl"
            aria-label="รหัสผู้ดูแล MCP"
            required
          />
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <button className="btn btn-primary min-h-11 w-full rounded-xl" disabled={busy}>
            {busy ? "กำลังตรวจสอบ…" : "เปิดหน้าจัดการคีย์"}
          </button>
        </form>
      ) : (
        <>
          <form onSubmit={createKey} className="grid gap-4 rounded-xl border border-base-300 bg-base-100 p-5 sm:grid-cols-2">
            <label className="form-control gap-2 text-sm font-medium">
              <span>เจ้าของข้อมูล</span>
              <select value={personName} onChange={(event) => setPersonName(event.target.value as "Bon" | "Ray")} className="select select-bordered w-full rounded-xl">
                <option value="Bon">Bon</option>
                <option value="Ray">Ray</option>
              </select>
            </label>
            <label className="form-control gap-2 text-sm font-medium">
              <span>ชื่อคีย์</span>
              <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} className="input input-bordered w-full rounded-xl" required />
            </label>
            <label className="form-control gap-2 text-sm font-medium sm:col-span-2">
              <span>สิทธิ์</span>
              <select value={accessLevel} onChange={(event) => setAccessLevel(event.target.value as "read_only" | "read_write")} className="select select-bordered w-full rounded-xl">
                <option value="read_write">อ่านและแก้ไขข้อมูล</option>
                <option value="read_only">อ่านอย่างเดียว</option>
              </select>
            </label>
            <button className="btn btn-primary min-h-11 rounded-xl sm:col-span-2" disabled={busy}>
              สร้าง API key
            </button>
          </form>

          {createdKey && (
            <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5" aria-live="polite">
              <div>
                <h2 className="font-bold">คีย์ใหม่ของ {createdKey.person_name}</h2>
                <p className="mt-1 text-sm text-base-content/60">คัดลอกเก็บไว้ตอนนี้ คีย์ฉบับเต็มจะแสดงครั้งนี้ครั้งเดียว</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <code className="min-w-0 flex-1 break-all rounded-lg border border-base-300 bg-base-100 p-3 text-xs">{createdKey.api_key}</code>
                <button
                  type="button"
                  className="btn btn-outline min-h-11 rounded-xl"
                  onClick={() => void navigator.clipboard.writeText(createdKey.api_key)}
                  aria-label="คัดลอก API key"
                >
                  <Copy size={16} aria-hidden="true" /> คัดลอก
                </button>
              </div>
            </section>
          )}

          <section className="space-y-3 rounded-xl border border-base-300 bg-base-100 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">คีย์ที่ออกแล้ว</h2>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void loadKeys(adminSecret)}>
                <RefreshCw size={15} aria-hidden="true" /> โหลดใหม่
              </button>
            </div>
            {keys.length === 0 ? (
              <p className="text-sm text-base-content/60">ยังไม่มี API key</p>
            ) : (
              <ul className="divide-y divide-base-300">
                {keys.map((key) => (
                  <li key={key.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">{key.person_name} · {key.label}</p>
                      <p className="mt-1 break-all font-mono text-xs text-base-content/60">{key.key_prefix}…</p>
                      <p className="mt-1 text-xs text-base-content/50">
                        {key.access_level === "read_write" ? "อ่านและแก้ไข" : "อ่านอย่างเดียว"} · ใช้ล่าสุด {formatDate(key.last_used_at)}
                      </p>
                    </div>
                    {key.revoked_at ? (
                      <span className="badge badge-ghost">ยกเลิกแล้ว</span>
                    ) : (
                      <button type="button" className="btn btn-outline btn-error min-h-10 rounded-lg" disabled={busy} onClick={() => void revokeKey(key)}>
                        <Trash2 size={15} aria-hidden="true" /> ยกเลิก
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p className="text-sm"><Link href="/mcp-keys" className="link link-primary">Generate another key</Link></p>
      {error && authorized && <p role="alert" className="text-sm text-error">{error}</p>}
    </main>
  );
}
