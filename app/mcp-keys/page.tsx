"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, KeyRound, ShieldCheck } from "lucide-react";

type McpPerson = "Bon" | "Ray";
type AccessLevel = "read_only" | "read_write";

interface CreatedApiKey {
  id: number;
  person_name: McpPerson;
  label: string;
  access_level: AccessLevel;
  api_key: string;
}

export default function McpKeysPage() {
  const [label, setLabel] = useState("AI Agent");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("read_write");
  const [createdKeys, setCreatedKeys] = useState<CreatedApiKey[]>([]);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [busyPerson, setBusyPerson] = useState<McpPerson | null>(null);
  const [error, setError] = useState("");

  const createKey = async (personName: McpPerson) => {
    setBusyPerson(personName);
    setError("");
    setCopiedKeyId(null);

    try {
      const response = await fetch("/api/mcp/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_name: personName,
          label: label.trim() || "AI Agent",
          access_level: accessLevel,
        }),
        cache: "no-store",
      });
      const result = await response.json() as CreatedApiKey | { error?: string };
      if (!response.ok) {
        throw new Error("error" in result ? result.error || "Could not generate an API key." : "Could not generate an API key.");
      }

      setCreatedKeys((current) => [result as CreatedApiKey, ...current]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not generate an API key.");
    } finally {
      setBusyPerson(null);
    }
  };

  const copyKey = async (key: CreatedApiKey) => {
    try {
      await navigator.clipboard.writeText(key.api_key);
      setCopiedKeyId(key.id);
    } catch {
      setError("Clipboard access was denied. Select and copy the key manually.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex items-start gap-3">
        <div className="rounded-xl border border-base-300 bg-base-100 p-3 text-primary">
          <KeyRound size={22} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-base-content">สร้าง MCP API key</h1>
          <p className="mt-1 text-sm text-base-content/60">สร้าง key แยกสำหรับ Bon หรือ Ray แล้วนำไปเชื่อมกับ AI Agent</p>
        </div>
      </header>

      <section className="space-y-5 rounded-xl border border-base-300 bg-base-100 p-5">
        <div className="flex items-start gap-3 rounded-lg border border-base-300 bg-base-200/40 p-4">
          <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={18} aria-hidden="true" />
          <p className="text-sm leading-6 text-base-content/70">
            Key ผูกกับข้อมูลของคนที่เลือกเท่านั้น ระบบแสดง key เต็มให้คัดลอกหลังสร้าง และไม่สามารถเรียกดูซ้ำได้
          </p>
        </div>

        <label className="form-control gap-2 text-sm font-medium">
          <span>ชื่อที่ใช้แยก Agent</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={80}
            className="input input-bordered w-full rounded-xl"
            placeholder="เช่น n8n, ChatGPT, Finance Agent"
          />
        </label>

        <label className="form-control gap-2 text-sm font-medium">
          <span>สิทธิ์ของ key</span>
          <select
            value={accessLevel}
            onChange={(event) => setAccessLevel(event.target.value as AccessLevel)}
            className="select select-bordered w-full rounded-xl"
          >
            <option value="read_write">อ่าน สร้าง แก้ไข และลบ</option>
            <option value="read_only">อ่านอย่างเดียว</option>
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          {(["Bon", "Ray"] as const).map((personName) => (
            <button
              key={personName}
              type="button"
              className="btn btn-primary min-h-12 rounded-xl"
              disabled={busyPerson !== null}
              onClick={() => void createKey(personName)}
            >
              <KeyRound size={17} aria-hidden="true" />
              {busyPerson === personName ? "กำลังสร้าง..." : `สร้าง key สำหรับ ${personName}`}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="text-sm text-error">{error}</p>}
      </section>

      {createdKeys.length > 0 && (
        <section className="space-y-4" aria-live="polite">
          {createdKeys.map((key) => (
            <article key={key.id} className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div>
                <h2 className="font-bold">{key.person_name} · {key.label}</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  {key.access_level === "read_write" ? "อ่านและแก้ไขข้อมูลได้" : "อ่านข้อมูลได้อย่างเดียว"} คัดลอก key ไปเก็บในระบบ Agent ตอนนี้
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <code className="min-w-0 flex-1 break-all rounded-lg border border-base-300 bg-base-100 p-3 text-xs">{key.api_key}</code>
                <button
                  type="button"
                  className="btn btn-outline min-h-11 rounded-xl"
                  onClick={() => void copyKey(key)}
                  aria-label={`คัดลอก API key ของ ${key.person_name}`}
                >
                  <Copy size={16} aria-hidden="true" />
                  {copiedKeyId === key.id ? "คัดลอกแล้ว" : "คัดลอก"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-base-300 bg-base-100 p-5">
        <h2 className="font-bold">ตั้งค่าใน AI Agent</h2>
        <p className="text-sm text-base-content/60">ส่ง API key ผ่าน Authorization Bearer หรือ X-API-Key header ได้</p>
        <code className="block overflow-x-auto rounded-lg border border-base-300 bg-base-200/40 p-3 text-xs">https://income-ashy.vercel.app/api/mcp</code>
        <code className="block overflow-x-auto rounded-lg border border-base-300 bg-base-200/40 p-3 text-xs">Authorization: Bearer &lt;API key&gt;</code>
        <code className="block overflow-x-auto rounded-lg border border-base-300 bg-base-200/40 p-3 text-xs">X-API-Key: &lt;API key&gt;</code>
        <p className="text-xs leading-5 text-base-content/50">
          ChatGPT connector ใช้ OAuth: เลือก OAuth ตอนเชื่อม MCP แล้วกรอก key ในหน้าอนุญาตของระบบ
        </p>
      </section>

      <div className="text-sm">
        <Link href="/mcp-keys/manage" className="link link-primary">จัดการและยกเลิก keys ที่สร้างไว้</Link>
      </div>
    </main>
  );
}
