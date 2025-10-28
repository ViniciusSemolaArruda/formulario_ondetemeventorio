// app/api/guests/[id]/qr/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import QRCode from "qrcode";

const RAW_BASE = process.env.APP_BASE_URL ?? "https://convidado-ondetemevento.com.br";
const APP_BASE_URL = RAW_BASE.replace(/\/+$/, "");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Next 15: params é Promise
) {
  const { id } = await params;

  const guest = await prisma.guestInvite.findUnique({
    where: { id },
    select: { checkInToken: true },
  });

  if (!guest) {
    return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 });
  }

  const payloadUrl = `${APP_BASE_URL}/api/checkin?t=${guest.checkInToken}`;

  const pngBuffer = await QRCode.toBuffer(payloadUrl, {
    width: 600,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const body = new Uint8Array(pngBuffer); // 👈 resolve o erro do BodyInit

  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
    },
  });
}
