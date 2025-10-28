// app/api/checkin/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("t") ?? "";

  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Token ausente" },
      { status: 400 }
    );
  }

  // Usa findFirst para funcionar mesmo sem @unique no checkInToken
  const invite = await prisma.guestInvite.findFirst({
    where: { checkInToken: token },
    select: {
      id: true,
      status: true,
      fullName: true,
      email: true,
      checkInAt: true,
    },
  });

  if (!invite) {
    return NextResponse.json(
      { ok: false, message: "QR inválido" },
      { status: 404 }
    );
  }

  if (invite.status === "REVOKED") {
    return NextResponse.json(
      { ok: false, message: "Convite revogado" },
      { status: 403 }
    );
  }

  if (invite.status === "CHECKED_IN") {
    return NextResponse.json({
      ok: true,
      alreadyChecked: true,
      guestId: invite.id,
      fullName: invite.fullName,
      email: invite.email,
      checkInAt: invite.checkInAt,
      message: "Convidado já havia realizado check-in.",
    });
  }

  // Atualiza pelo ID (sempre único), evitando exigir unique no token
  const updated = await prisma.guestInvite.update({
    where: { id: invite.id },
    data: { status: "CHECKED_IN", checkInAt: new Date() },
    select: { id: true, fullName: true, email: true, checkInAt: true },
  });

  return NextResponse.json({
    ok: true,
    alreadyChecked: false,
    guestId: updated.id,
    fullName: updated.fullName,
    email: updated.email,
    checkInAt: updated.checkInAt,
    message: "Check-in realizado com sucesso!",
  });
}
