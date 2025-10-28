// app/api/guests/[id]/qr/route.ts
export const runtime = "nodejs"; // garante Node APIs

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import QRCode from "qrcode";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://convidado-ondetemevento.com.br/";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const guest = await prisma.guestInvite.findUnique({
    where: { id: params.id },
    select: { checkInToken: true },
  });

  if (!guest) {
    return NextResponse.json({ error: "Convidado não encontrado" }, { status: 404 });
  }

  const payloadUrl = `${APP_BASE_URL}/api/checkin?t=${guest.checkInToken}`;

  // qrcode retorna Buffer (Node). Convertemos para Uint8Array (BodyInit válido no runtime web)
  const pngBuffer = await QRCode.toBuffer(payloadUrl, {
    width: 600,
    margin: 1,
    errorCorrectionLevel: "M",
  });
  const pngUint8 = new Uint8Array(pngBuffer); // <- conversão que resolve o erro de tipo

  return new Response(pngUint8, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
    },
  });
}
