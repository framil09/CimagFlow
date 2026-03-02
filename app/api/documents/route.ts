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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where: any = { createdBy: userId };
    if (status && status !== "TODOS") where.status = status;
    if (search) where.title = { contains: search, mode: "insensitive" };

    const [total, docs] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          signers: { include: { signer: { select: { name: true, email: true } } } },
        },
      }),
    ]);

    return NextResponse.json({ documents: docs, total, page, limit });
  } catch (error) {
    console.error("GET /api/documents", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const userId = (session.user as any).id;
    const body = await req.json();
    const { title, description, fileUrl, fileName, fileSize, message, deadline, reminderDays, signerIds, folderId } = body;

    if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

    const document = await prisma.document.create({
      data: {
        title,
        description: description ?? null,
        fileUrl: fileUrl ?? null,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        message: message ?? null,
        deadline: deadline ? new Date(deadline) : null,
        reminderDays: reminderDays ?? 3,
        status: "RASCUNHO",
        createdBy: userId,
        folderId: folderId ?? null,
      },
    });

    if (signerIds?.length > 0) {
      await prisma.documentSigner.createMany({
        data: signerIds.map((id: string, idx: number) => ({
          documentId: document.id,
          signerId: id,
          order: idx,
        })),
      });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
