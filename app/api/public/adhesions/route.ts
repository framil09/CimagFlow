import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      minuteId,
      requesterName,
      requesterEmail,
      requesterPhone,
      requesterCpf,
      requesterCnpj,
      companyName,
      position,
      justification,
    } = body;

    // Validações básicas
    if (!minuteId || !requesterName || !requesterEmail) {
      return NextResponse.json(
        { error: "ID da ata, nome e e-mail são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se a ata existe e permite adesões
    const minute = await prisma.minutesOfMeeting.findUnique({
      where: { id: minuteId },
      select: {
        id: true,
        allowAdhesion: true,
        isPublic: true,
        isPriceRegistry: true,
        validityEndDate: true,
      },
    });

    if (!minute) {
      return NextResponse.json({ error: "Ata não encontrada" }, { status: 404 });
    }

    if (!minute.isPublic || !minute.isPriceRegistry) {
      return NextResponse.json({ error: "Esta ata não está disponível para adesão" }, { status: 400 });
    }

    if (!minute.allowAdhesion) {
      return NextResponse.json({ error: "Esta ata não permite adesões" }, { status: 400 });
    }

    if (minute.validityEndDate && new Date(minute.validityEndDate) < new Date()) {
      return NextResponse.json({ error: "Esta ata já está vencida" }, { status: 400 });
    }

    // Verificar se já existe uma adesão pendente ou aprovada deste email
    const existingAdhesion = await prisma.minuteAdhesion.findFirst({
      where: {
        minuteId,
        requesterEmail,
        status: { in: ["PENDENTE", "APROVADA"] },
      },
    });

    if (existingAdhesion) {
      return NextResponse.json(
        { error: "Você já possui uma solicitação de adesão para esta ata" },
        { status: 400 }
      );
    }

    // Criar a adesão
    const adhesion = await prisma.minuteAdhesion.create({
      data: {
        minuteId,
        requesterName,
        requesterEmail,
        requesterPhone,
        requesterCpf,
        requesterCnpj,
        companyName,
        position,
        justification,
        status: "PENDENTE",
      },
      include: {
        minute: {
          select: {
            number: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Solicitação de adesão enviada com sucesso!",
        adhesion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating adhesion:", error);
    return NextResponse.json({ error: "Erro ao criar solicitação de adesão" }, { status: 500 });
  }
}
