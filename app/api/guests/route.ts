// app/api/guests/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { DocumentType } from "@prisma/client";

const payloadSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10).max(14), // só dígitos após sanitização
  documentType: z.nativeEnum(DocumentType).optional(),
  documentNumber: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
});

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = payloadSchema.parse({
      ...json,
      email: String(json.email ?? "").trim().toLowerCase(), // normaliza
      phone: onlyDigits(json.phone ?? ""),
      documentNumber: json.documentNumber
        ? onlyDigits(json.documentNumber)
        : undefined,
    });

    const created = await prisma.guestInvite.create({ data });
    return NextResponse.json({ ok: true, guestId: created.id });
  } catch (err: any) {
    // Trata violação de unique (ex.: mesmo email+phone)
    if (err?.code === "P2002") {
      return NextResponse.json(
        { ok: false, message: "Convidado já cadastrado com este e-mail/telefone." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Erro ao cadastrar";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
