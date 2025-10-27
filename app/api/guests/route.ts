// app/api/guests/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { DocumentType } from "@prisma/client";

const payloadSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10).max(14), // apenas dígitos após sanitização
  documentType: z.nativeEnum(DocumentType).optional(),
  documentNumber: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
});

function onlyDigits(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const json = await req.json();

    // Normaliza e valida
    const data = payloadSchema.parse({
      ...json,
      email: String(json.email ?? "").trim().toLowerCase(),
      phone: onlyDigits(json.phone ?? ""),
      documentNumber: json.documentNumber ? onlyDigits(json.documentNumber) : undefined,
    });

    // Construímos uma busca idempotente por chaves "naturais" típicas:
    // email, phone e (se houver) documentNumber.
    const orClauses: any[] = [
      { email: data.email },
      { phone: data.phone },
    ];
    if (data.documentNumber) {
      orClauses.push({ documentNumber: data.documentNumber });
    }

    // Verifica se já existe
    const existing = await prisma.guestInvite.findFirst({
      where: { OR: orClauses },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        guestId: existing.id,
        message: "Você já está cadastrado e fará parte do nosso evento.",
      });
    }

    // Cria caso não exista
    const created = await prisma.guestInvite.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        documentType: data.documentType, // opcional
        documentNumber: data.documentNumber, // opcional
        company: data.company,
        jobTitle: data.jobTitle,
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      alreadyRegistered: false,
      guestId: created.id,
      message: "Inscrição enviada com sucesso! ✔",
    });
  } catch (err: any) {
    // Se bater índice único por corrida, trate como "já cadastrado"
    if (err?.code === "P2002") {
      try {
        const json = await req.json().catch(() => null);
        const email = String(json?.email ?? "").trim().toLowerCase();
        const phone = onlyDigits(json?.phone ?? "");
        const documentNumber = json?.documentNumber ? onlyDigits(json.documentNumber) : undefined;

        const orClauses: any[] = [{ email }, { phone }];
        if (documentNumber) orClauses.push({ documentNumber });

        const existing = await prisma.guestInvite.findFirst({
          where: { OR: orClauses },
          select: { id: true },
        });

        if (existing) {
          return NextResponse.json({
            ok: true,
            alreadyRegistered: true,
            guestId: existing.id,
            message: "Você já está cadastrado e fará parte do nosso evento.",
          });
        }
      } catch {
        // cai para resposta padrão de erro abaixo
      }
    }

    const message = err instanceof Error ? err.message : "Erro ao cadastrar";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
