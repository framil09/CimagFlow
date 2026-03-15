import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";

// POST /api/demands/[id]/message - Unified communication endpoint
// Handles: analyst sending message/files, requesting pendency
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { message, attachments, isPendency } = await req.json();

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "Envie uma mensagem ou anexe pelo menos um arquivo" },
        { status: 400 }
      );
    }

    const demand = await prisma.demand.findUnique({
      where: { id: params.id },
      include: { prefecture: true },
    });

    if (!demand) {
      return NextResponse.json(
        { error: "Demanda não encontrada" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const userName = user?.name || session.user.name || "Sistema";
    const oldStatus = demand.status;

    // Build history comment
    const commentParts: string[] = [];
    if (message?.trim()) commentParts.push(message.trim());
    const fileCount = attachments?.length || 0;
    if (fileCount > 0) commentParts.push(`📎 ${fileCount} arquivo(s) anexado(s)`);

    if (isPendency) {
      // --- PENDENCY FLOW ---
      // Change status to AGUARDANDO_RESPOSTA
      await prisma.demand.update({
        where: { id: params.id },
        data: { status: "AGUARDANDO_RESPOSTA" },
      });

      if (oldStatus !== "AGUARDANDO_RESPOSTA") {
        await prisma.demandHistory.create({
          data: {
            demandId: params.id,
            userId: user?.id,
            userName,
            action: "STATUS_ALTERADO",
            oldValue: oldStatus,
            newValue: "AGUARDANDO_RESPOSTA",
          },
        });
      }

      // Record pendency with attachments info
      await prisma.demandHistory.create({
        data: {
          demandId: params.id,
          userId: user?.id,
          userName,
          action: "PENDENCIA_ENVIADA",
          comment: commentParts.join("\n\n"),
          // Store attachment URLs in newValue as JSON
          newValue: fileCount > 0 ? JSON.stringify(attachments) : null,
        },
      });

      // Send email with response link
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const responderUrl = `${appUrl}/responder-demanda?protocolo=${encodeURIComponent(demand.protocolNumber)}&email=${encodeURIComponent(demand.requesterEmail)}`;

        await sendEmail({
          to: demand.requesterEmail,
          subject: `Pendência na Demanda #${demand.protocolNumber} - Ação Necessária`,
          notificationId: process.env.NOTIF_ID_DOCUMENTO_COMPLETAMENTE_ASSINADO || "default",
          html: `
            <h2>Pendência Identificada na sua Demanda</h2>
            <p>Olá <strong>${demand.requesterName}</strong>,</p>
            <p>O analista responsável enviou uma mensagem sobre sua demanda:</p>
            <div style="background: #FFF3CD; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #FFC107;">
              <p><strong>Protocolo:</strong> ${demand.protocolNumber}</p>
              <p><strong>Título:</strong> ${demand.title}</p>
            </div>
            ${message?.trim() ? `<div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;"><p><strong>Mensagem do Analista:</strong></p><p style="white-space: pre-wrap;">${message.trim()}</p></div>` : ""}
            ${fileCount > 0 ? `<p>📎 <strong>${fileCount} documento(s)</strong> anexado(s) à mensagem.</p>` : ""}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${responderUrl}" style="display: inline-block; background: #10B981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Responder Pendência</a>
            </div>
            <p>Atenciosamente,<br><strong>Equipe Cimagflow</strong></p>
          `,
        });
      } catch (emailError) {
        console.error("Erro ao enviar email de pendência:", emailError);
      }
    } else {
      // --- NORMAL MESSAGE/RESPONSE FLOW ---
      // Update demand with response attachments and comment
      const updateData: any = {};
      if (attachments && attachments.length > 0) {
        updateData.responseAttachments = attachments;
      }
      if (message?.trim()) {
        updateData.responseComment = message.trim();
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.demand.update({
          where: { id: params.id },
          data: updateData,
        });
      }

      // Record in history
      await prisma.demandHistory.create({
        data: {
          demandId: params.id,
          userId: user?.id,
          userName,
          action: "RESPOSTA_ENVIADA",
          comment: commentParts.join("\n\n"),
          newValue: fileCount > 0 ? JSON.stringify(attachments) : null,
        },
      });

      // Send email to requester
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const responderUrl = `${appUrl}/responder-demanda?protocolo=${encodeURIComponent(demand.protocolNumber)}&email=${encodeURIComponent(demand.requesterEmail)}`;

        await sendEmail({
          to: demand.requesterEmail,
          subject: `Nova Mensagem - Demanda #${demand.protocolNumber}`,
          notificationId: process.env.NOTIF_ID_DOCUMENTO_COMPLETAMENTE_ASSINADO || "default",
          html: `
            <h2>Nova Mensagem sobre sua Demanda</h2>
            <p>Olá <strong>${demand.requesterName}</strong>,</p>
            <p>Você recebeu uma nova mensagem sobre sua demanda:</p>
            <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p><strong>Protocolo:</strong> ${demand.protocolNumber}</p>
              <p><strong>Título:</strong> ${demand.title}</p>
            </div>
            ${message?.trim() ? `<div style="background: #E8F5E9; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4CAF50;"><p><strong>Mensagem:</strong></p><p style="white-space: pre-wrap;">${message.trim()}</p></div>` : ""}
            ${fileCount > 0 ? `<p>📎 <strong>${fileCount} documento(s)</strong> anexado(s) à mensagem.</p>` : ""}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${responderUrl}" style="display: inline-block; background: #1E3A5F; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Responder</a>
            </div>
            <p>Atenciosamente,<br><strong>Equipe Cimagflow</strong></p>
          `,
        });
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError);
      }
    }

    // Reload demand to return updated data
    const updated = await prisma.demand.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: true,
        prefecture: true,
        history: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}
