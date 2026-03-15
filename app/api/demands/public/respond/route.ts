import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";

// POST /api/demands/public/respond - Solicitante responde a uma pendência (sem auth)
export async function POST(req: NextRequest) {
  try {
    const { protocolNumber, requesterEmail, message, attachments } = await req.json();

    if (!protocolNumber || !requesterEmail) {
      return NextResponse.json(
        { error: "Protocolo e email são obrigatórios" },
        { status: 400 }
      );
    }

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "Envie uma mensagem ou anexe pelo menos um arquivo" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requesterEmail)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Buscar demanda pelo protocolo
    const demand = await prisma.demand.findUnique({
      where: { protocolNumber },
      include: {
        assignedTo: true,
        prefecture: true,
      },
    });

    if (!demand) {
      return NextResponse.json(
        { error: "Protocolo não encontrado" },
        { status: 404 }
      );
    }

    // Verificar que o email corresponde ao solicitante
    if (demand.requesterEmail.toLowerCase() !== requesterEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Email não corresponde ao solicitante desta demanda" },
        { status: 403 }
      );
    }

    // Atualizar demanda: append novos anexos, mudar status para EM_ANALISE
    const existingAttachments = demand.attachments || [];
    const newAttachments = attachments || [];
    const allAttachments = [...existingAttachments, ...newAttachments];

    const oldStatus = demand.status;

    await prisma.demand.update({
      where: { id: demand.id },
      data: {
        attachments: allAttachments,
        status: "EM_ANALISE",
      },
    });

    // Registrar status change
    if (oldStatus !== "EM_ANALISE") {
      await prisma.demandHistory.create({
        data: {
          demandId: demand.id,
          userName: demand.requesterName,
          action: "STATUS_ALTERADO",
          oldValue: oldStatus,
          newValue: "EM_ANALISE",
          comment: "Status alterado automaticamente após resposta do solicitante",
        },
      });
    }

    // Registrar a resposta no histórico
    const fileCount = newAttachments.length;
    const commentParts: string[] = [];
    if (message?.trim()) commentParts.push(message.trim());
    if (fileCount > 0) commentParts.push(`${fileCount} arquivo(s) anexado(s)`);

    await prisma.demandHistory.create({
      data: {
        demandId: demand.id,
        userName: demand.requesterName,
        action: "RESPOSTA_SOLICITANTE",
        comment: commentParts.join("\n\n"),
      },
    });

    // Notificar o analista responsável por email
    if (demand.assignedTo?.email) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await sendEmail({
          to: demand.assignedTo.email,
          subject: `Resposta do Solicitante - Demanda #${demand.protocolNumber}`,
          notificationId:
            process.env.NOTIF_ID_DOCUMENTO_COMPLETAMENTE_ASSINADO || "default",
          html: `
            <h2>Resposta Recebida do Solicitante</h2>
            <p>Olá <strong>${demand.assignedTo.name}</strong>,</p>
            <p>O solicitante <strong>${demand.requesterName}</strong> respondeu à pendência da demanda:</p>
            <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p><strong>Protocolo:</strong> ${demand.protocolNumber}</p>
              <p><strong>Título:</strong> ${demand.title}</p>
            </div>
            ${message?.trim() ? `<div style="background: #E8F5E9; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4CAF50;"><p><strong>Mensagem:</strong></p><p style="white-space: pre-wrap;">${message.trim()}</p></div>` : ""}
            ${fileCount > 0 ? `<p><strong>Arquivos anexados:</strong> ${fileCount} documento(s)</p>` : ""}
            <p>Acesse a demanda para verificar:<br>
            <a href="${appUrl}/demandas/${demand.id}">${appUrl}/demandas/${demand.id}</a></p>
            <p>Atenciosamente,<br><strong>Equipe Cimagflow</strong></p>
          `,
        });
      } catch (emailError) {
        console.error("Erro ao enviar email ao analista:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      protocolNumber: demand.protocolNumber,
    });
  } catch (error) {
    console.error("Erro ao processar resposta do solicitante:", error);
    return NextResponse.json(
      { error: "Erro ao processar resposta" },
      { status: 500 }
    );
  }
}
