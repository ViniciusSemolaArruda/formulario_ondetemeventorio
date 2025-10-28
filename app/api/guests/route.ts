// app/api/guests/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";
import { DocumentType, Prisma } from "@prisma/client";
import crypto from "crypto";
import QRCode from "qrcode";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const RAW_BASE = process.env.APP_BASE_URL ?? "https://convidado-ondetemevento.com.br";
const APP_BASE_URL = RAW_BASE.replace(/\/+$/, ""); // remove barra no final
const MAIL_FROM = process.env.MAIL_FROM ?? "Convites <onboarding@resend.dev>";
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
  // ✅ Em vez de z.enum(...), usamos string + transform + refine
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
  qrBase64Png,
}: {
  to: string;
  name: string;
  passUrl: string;
  qrBase64Png: string;
}) {
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto">
    <h2>Olá, ${name}!</h2>
    <p>Seu cadastro foi confirmado. Apresente este QR Code na entrada para realizar o check-in.</p>
    <p><strong>Dica:</strong> Salve este e-mail ou baixe a imagem.</p>
    <p style="text-align:center">
      <img alt="Seu QR Code" style="width:260px;height:auto"
           src="data:image/png;base64,${qrBase64Png}" />
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
    // Normalização e validação
    const data = payloadSchema.parse({
      ...raw,
      email: String(raw.email ?? "").trim().toLowerCase(),
      phone: onlyDigits(raw.phone ?? ""),
      documentNumber: raw.documentNumber ? onlyDigits(raw.documentNumber) : undefined,
      // state e city já são tratados pelo schema (transform/refine)
    });

    // Idempotência por e-mail/telefone/documento
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
          const payloadUrl = `${APP_BASE_URL}/api/checkin?t=${existing.checkInToken}`;
          const passUrl = `${APP_BASE_URL}/guests/${existing.id}/pass`;
          const png = await QRCode.toBuffer(payloadUrl, {
            width: 600,
            margin: 1,
            errorCorrectionLevel: "M",
          });
          await sendInviteEmail({
            to: existing.email,
            name: existing.fullName,
            passUrl,
            qrBase64Png: png.toString("base64"),
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

    // Criação
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

    // Envio de e-mail com QR (best effort)
    let emailSent = false;
    try {
      if (SEND_EMAILS === "true") {
        const payloadUrl = `${APP_BASE_URL}/api/checkin?t=${created.checkInToken}`;
        const passUrl = `${APP_BASE_URL}/guests/${created.id}/pass`;
        const png = await QRCode.toBuffer(payloadUrl, {
          width: 600,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        await sendInviteEmail({
          to: created.email,
          name: created.fullName,
          passUrl,
          qrBase64Png: png.toString("base64"),
        });
        emailSent = true;
      } else {
        console.warn("EMAILS DESATIVADOS (SEND_EMAILS!=true)");
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
