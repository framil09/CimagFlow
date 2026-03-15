import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const userId = (session.user as any).id;
    const email = session.user?.email ?? "";
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "personal"; // "personal" ou "all"

    if (view === "all") {
      // Mostrar todos os documentos do usuário que estão em andamento
      const documents = await prisma.document.findMany({
        where: {
          createdBy: userId,
          status: "EM_ANDAMENTO",
        },
        include: {
          signers: {
            include: { signer: { select: { id: true, name: true, email: true, cpf: true } } },
            orderBy: { order: "asc" },
          },
          folder: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const result = documents.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        deadline: doc.deadline,
        createdAt: doc.createdAt,
        folder: doc.folder,
        signers: doc.signers.map((ds: any) => ({
          id: ds.id,
          token: ds.token,
          status: ds.status,
          signedAt: ds.signedAt,
          signer: {
            id: ds.signer.id,
            name: ds.signer.name,
            email: ds.signer.email,
            cpf: ds.signer.cpf,
          },
        })),
        stats: {
          total: doc.signers.length,
          signed: doc.signers.filter((s: any) => s.status === "ASSINADO").length,
          pending: doc.signers.filter((s: any) => s.status === "PENDENTE").length,
          refused: doc.signers.filter((s: any) => s.status === "RECUSADO").length,
        },
      }));

      return NextResponse.json({ documents: result });
    }

    // View "personal" - documentos que o usuário precisa assinar
    const items = await prisma.documentSigner.findMany({
      where: {
        signer: { email },
        status: "PENDENTE",
        document: { status: "EM_ANDAMENTO" },
      },
      include: {
        document: {
          include: { creator: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = items.map((i: any) => ({
      id: i.id,
      token: i.token,
      document: {
        title: i.document.title,
        description: i.document.description,
        deadline: i.document.deadline,
        creatorName: i.document.creator.name,
      },
    }));

    return NextResponse.json({ items: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
