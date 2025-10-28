// app/api/guests/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";
import { DocumentType, Prisma } from "@prisma/client";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const RAW_BASE = process.env.APP_BASE_URL ?? "https://convidado-ondetemevento.com.br";
const APP_BASE_URL = RAW_BASE.replace(/\/+$/, ""); // remove barra no final
const MAIL_FROM = process.env.MAIL_FROM!;
const SEND_EMAILS = process.env.SEND_EMAILS ?? "true";

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
] as const;
const UF_SET = new Set<string>(UF_LIST as unknown as string[]);

const payloadSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10).max(14),
  documentType: z.nativeEnum(DocumentType).optional(),
  documentNumber: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  state: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .refine((s) => UF_SET.has(s), { message: "Selecione o estado (UF) válido" }),
  city: z.string().min(2, "Informe o município").max(120),
});

function onlyDigits(v: string) {
  return (v ?? "").replace(/\D/g, "");
}
function genToken() {
  return crypto.randomBytes(24).toString("base64url");
}

async function sendInviteEmail({
  to,
  name,
  passUrl,
  qrUrl,
}: {
  to: string;
  name: string;
  passUrl: string;
  qrUrl: string;
}) {
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto">
    <h2>Olá, ${name}!</h2>
    <p>Seu cadastro foi confirmado. Apresente este QR Code na entrada para realizar o check-in.</p>
    <p><strong>Dica:</strong> Salve este e-mail ou baixe a imagem.</p>
    <p style="text-align:center">
      <img alt="Seu QR Code" style="width:260px;height:auto"
           src="${qrUrl}" />
    </p>
    <p>Se preferir, abra seu passe aqui:<br/>
      <a href="${passUrl}" target="_blank" rel="noopener noreferrer">${passUrl}</a>
    </p>
    <hr/>
    <p style="font-size:12px;color:#666">Se você não solicitou este convite, pode ignorar.</p>
  </div>`.trim();

  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: "Seu convite – Check-in com QR Code",
    html,
  });

  if (error) throw error;
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  if (!raw) {
    return NextResponse.json({ ok: false, message: "Body inválido" }, { status: 400 });
  }

  try {
    const data = payloadSchema.parse({
      ...raw,
      email: String(raw.email ?? "").trim().toLowerCase(),
      phone: onlyDigits(raw.phone ?? ""),
      documentNumber: raw.documentNumber ? onlyDigits(raw.documentNumber) : undefined,
    });

    const orClauses: Prisma.GuestInviteWhereInput[] = [
      { email: data.email },
      { phone: data.phone },
    ];
    if (data.documentNumber) orClauses.push({ documentNumber: data.documentNumber });

    const existing = await prisma.guestInvite.findFirst({
      where: { OR: orClauses },
      select: { id: true, fullName: true, email: true, checkInToken: true },
    });

    if (existing) {
      let emailSent = false;
      try {
        if (SEND_EMAILS === "true") {
          const passUrl = `${APP_BASE_URL}/guests/${existing.id}/pass`;
          const qrUrl = `${APP_BASE_URL}/api/guests/${existing.id}/qr`;
          await sendInviteEmail({
            to: existing.email,
            name: existing.fullName,
            passUrl,
            qrUrl,
          });
          emailSent = true;
        }
      } catch (e) {
        console.error("Falha ao reenviar e-mail:", e);
      }

      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        guestId: existing.id,
        emailSent,
        message: emailSent
          ? "Você já está cadastrado. Reenviei o QR por e-mail."
          : "Você já está cadastrado. Não foi possível reenviar o e-mail agora.",
      });
    }

    const created = await prisma.guestInvite.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        company: data.company,
        jobTitle: data.jobTitle,
        state: data.state,
        city: data.city,
        checkInToken: genToken(),
      },
      select: { id: true, fullName: true, email: true, checkInToken: true },
    });

    let emailSent = false;
    try {
      if (SEND_EMAILS === "true") {
        const passUrl = `${APP_BASE_URL}/guests/${created.id}/pass`;
        const qrUrl = `${APP_BASE_URL}/api/guests/${created.id}/qr`;
        await sendInviteEmail({
          to: created.email,
          name: created.fullName,
          passUrl,
          qrUrl,
        });
        emailSent = true;
      }
    } catch (e) {
      console.error("Falha ao enviar e-mail:", e);
    }

    return NextResponse.json({
      ok: true,
      alreadyRegistered: false,
      guestId: created.id,
      emailSent,
      message: emailSent
        ? "Inscrição enviada com sucesso! O QR foi enviado por e-mail. ✔"
        : "Inscrição enviada com sucesso! Não consegui enviar o e-mail agora.",
    });
  } catch (err: any) {
    console.error("POST /api/guests erro:", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { ok: false, message: "E-mail/telefone já cadastrados." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Erro ao cadastrar";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
