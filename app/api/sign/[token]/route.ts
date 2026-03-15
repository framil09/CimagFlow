import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendEmail, buildCompletedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const ds = await prisma.documentSigner.findUnique({
      where: { token: params.token },
      include: {
        document: { include: { creator: { select: { name: true, email: true } } } },
        signer: true,
      },
    });

    if (!ds) return NextResponse.json({ error: "Token inválido" }, { status: 404 });

    return NextResponse.json({
      documentSigner: {
        id: ds.id,
        status: ds.status,
        signedAt: ds.signedAt,
        document: {
          id: ds.document.id,
          title: ds.document.title,
          description: ds.document.description,
          fileUrl: ds.document.fileUrl,
          message: ds.document.message,
          deadline: ds.document.deadline,
          creatorName: ds.document.creator.name,
        },
        signer: {
          name: ds.signer.name,
          email: ds.signer.email,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const body = await req.json();
    const { action, cpf, signatureImage } = body; // "sign" or "refuse"

    const ds = await prisma.documentSigner.findUnique({
      where: { token: params.token },
      include: {
        document: {
          include: {
            creator: { select: { name: true, email: true } },
            signers: { include: { signer: true } },
          },
        },
        signer: true,
      },
    });

    if (!ds) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
    if (ds.status !== "PENDENTE") return NextResponse.json({ error: "Documento já processado" }, { status: 400 });

    const newStatus = action === "sign" ? "ASSINADO" : "RECUSADO";
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")?.[0] ?? null;

    const updateData: any = { status: newStatus, signedAt: new Date(), tokenUsedAt: new Date(), ipAddress: ip };
    if (action === "sign" && cpf) updateData.cpfUsed = cpf.replace(/\D/g, "");
    if (action === "sign" && signatureImage) updateData.signatureImage = signatureImage;

    await prisma.documentSigner.update({
      where: { token: params.token },
      data: updateData,
    });

    // Check if all signed
    if (action === "sign") {
      const updatedSigners = await prisma.documentSigner.findMany({
        where: { documentId: ds.documentId },
      });

      const allSigned = updatedSigners.every((s: any) => s.status === "ASSINADO" || s.id === ds.id);

      if (allSigned) {
        await prisma.document.update({
          where: { id: ds.documentId },
          data: { status: "CONCLUIDO" },
        });

        const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
        const html = buildCompletedEmail({
          creatorName: ds.document.creator.name,
          documentTitle: ds.document.title,
          totalSigners: ds.document.signers.length,
          documentLink: `${baseUrl}/documentos/${ds.documentId}`,
        });

        await sendEmail({
          to: ds.document.creator.email,
          subject: `✅ Documento assinado: ${ds.document.title}`,
          html,
          notificationId: process.env.NOTIF_ID_DOCUMENTO_COMPLETAMENTE_ASSINADO ?? "",
        });
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
