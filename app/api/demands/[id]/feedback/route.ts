import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "A mensagem de pendência é obrigatória" },
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

    const oldStatus = demand.status;

    // Update status to AGUARDANDO_RESPOSTA and store the feedback
    const updated = await prisma.demand.update({
      where: { id: params.id },
      data: {
        status: "AGUARDANDO_RESPOSTA",
      },
      include: {
        assignedTo: true,
        prefecture: true,
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Record status change if different
    if (oldStatus !== "AGUARDANDO_RESPOSTA") {
      await prisma.demandHistory.create({
        data: {
          demandId: params.id,
          userId: user?.id,
          userName: user?.name || session.user.name || "Sistema",
          action: "STATUS_ALTERADO",
          oldValue: oldStatus,
          newValue: "AGUARDANDO_RESPOSTA",
        },
      });
    }

    // Record the pendency feedback
    await prisma.demandHistory.create({
      data: {
        demandId: params.id,
        userId: user?.id,
        userName: user?.name || session.user.name || "Sistema",
        action: "PENDENCIA_ENVIADA",
        comment: message.trim(),
      },
    });

    // Send email to requester
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const responderUrl = `${appUrl}/responder-demanda?protocolo=${encodeURIComponent(demand.protocolNumber)}&email=${encodeURIComponent(demand.requesterEmail)}`;
      const consultaUrl = `${appUrl}/consulta-protocolo`;

      await sendEmail({
        to: demand.requesterEmail,
        subject: `Pendência na Demanda #${demand.protocolNumber} - Ação Necessária`,
        notificationId:
          process.env.NOTIF_ID_DOCUMENTO_COMPLETAMENTE_ASSINADO || "default",
        html: `
          <h2>Pendência Identificada na sua Demanda</h2>
          <p>Olá <strong>${demand.requesterName}</strong>,</p>
          <p>O analista responsável identificou uma pendência na sua demanda e precisa de ação da sua parte:</p>
          <div style="background: #FFF3CD; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #FFC107;">
            <p><strong>Protocolo:</strong> ${demand.protocolNumber}</p>
            <p><strong>Título:</strong> ${demand.title}</p>
          </div>
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Mensagem do Analista:</strong></p>
            <p style="white-space: pre-wrap;">${message.trim()}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${responderUrl}" style="display: inline-block; background: #10B981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Responder Pendência</a>
          </div>
          <p>Ou consulte o status da sua demanda em:<br>
          <a href="${consultaUrl}">${consultaUrl}</a></p>
          <p>Atenciosamente,<br><strong>Equipe Cimagflow</strong></p>
        `,
      });
    } catch (emailError) {
      console.error("Erro ao enviar email de pendência:", emailError);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao enviar pendência:", error);
    return NextResponse.json(
      { error: "Erro ao enviar pendência" },
      { status: 500 }
    );
  }
}
