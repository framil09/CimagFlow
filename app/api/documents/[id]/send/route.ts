import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { sendEmail, buildSignatureEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const doc = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        signers: { include: { signer: true } },
        creator: { select: { name: true } },
      },
    });

    if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (doc.signers.length === 0) return NextResponse.json({ error: "Adicione assinantes antes de enviar" }, { status: 400 });

    await prisma.document.update({
      where: { id: params.id },
      data: { status: "EM_ANDAMENTO" },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const emailPromises = doc.signers.map(async (ds: any) => {
      const signLink = `${baseUrl}/assinar/${ds.token}`;
      const html = buildSignatureEmail({
        signerName: ds.signer.name,
        documentTitle: doc.title,
        creatorName: doc.creator.name,
        message: doc.message ?? undefined,
        signLink,
        deadline: doc.deadline ? new Date(doc.deadline).toLocaleDateString("pt-BR") : undefined,
      });

      await sendEmail({
        to: ds.signer.email,
        subject: `✍️ Documento para assinar: ${doc.title}`,
        html,
        notificationId: process.env.NOTIF_ID_DOCUMENTO_ENVIADO_PARA_ASSINATURA ?? "",
      });
    });

    await Promise.allSettled(emailPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
