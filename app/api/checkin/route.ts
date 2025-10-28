// app/api/checkin/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function json(
  body: Record<string, unknown>,
  init?: ResponseInit,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(extraHeaders ?? {}),
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = (searchParams.get("t") ?? "").trim();

    if (!token) {
      return json({ ok: false, message: "Token ausente" }, { status: 400 });
    }

    // Busca o convite pelo token (sem exigir unique no token)
    const invite = await prisma.guestInvite.findFirst({
      where: { checkInToken: token },
      select: {
        id: true,
        status: true,
        fullName: true,
        email: true,
        company: true,   // <- incluído
        jobTitle: true,  // <- incluído
        checkInAt: true,
      },
    });

    if (!invite) {
      return json({ ok: false, message: "QR inválido" }, { status: 404 });
    }

    if (invite.status === "REVOKED") {
      return json({ ok: false, message: "Convite revogado" }, { status: 403 });
    }

    if (invite.status === "CHECKED_IN") {
      // Já tinha check-in
      return json({
        ok: true,
        alreadyChecked: true,
        guestId: invite.id,
        fullName: invite.fullName,
        email: invite.email,
        company: invite.company ?? null,
        jobTitle: invite.jobTitle ?? null,
        checkInAt: invite.checkInAt,
        message: "Convidado já havia realizado check-in.",
      });
    }

    // Marca o check-in agora (atualiza por ID, que é único)
    const updated = await prisma.guestInvite.update({
      where: { id: invite.id },
      data: { status: "CHECKED_IN", checkInAt: new Date() },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,   // <- incluído
        jobTitle: true,  // <- incluído
        checkInAt: true,
      },
    });

    return json({
      ok: true,
      alreadyChecked: false,
      guestId: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      company: updated.company ?? null,
      jobTitle: updated.jobTitle ?? null,
      checkInAt: updated.checkInAt,
      message: "Check-in realizado com sucesso!",
    });
  } catch (err) {
    console.error("[/api/checkin] error:", err);
    return json(
      { ok: false, message: "Erro interno ao processar o check-in." },
      { status: 500 }
    );
  }
}

// Opcional: rejeita outros métodos com 405 (caso queira explicitar)
export async function POST() {
  return json(
    { ok: false, message: "Método não permitido. Use GET com ?t=..." },
    { status: 405 },
    { Allow: "GET" }
  );
}
