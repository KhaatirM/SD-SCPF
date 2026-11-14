import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Lightweight health / env check for Render.
 * Never returns secret values — only booleans / status.
 */
export async function GET() {
  const databaseUrlSet = Boolean(process.env.DATABASE_URL?.trim());
  const body = {
    ok: true,
    databaseUrlSet,
    nodeEnv: process.env.NODE_ENV ?? null,
    standalone: process.env.NEXT_RUNTIME ? true : undefined,
  };

  // One-line startup-style signal in logs (boolean only).
  console.log(
    `[sd-scpf] health: DATABASE_URL=${databaseUrlSet ? "set" : "missing"}`,
  );

  return NextResponse.json(body, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
