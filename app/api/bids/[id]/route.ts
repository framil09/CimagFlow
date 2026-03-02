import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const bid = await prisma.bid.findUnique({
      where: { id: params.id },
      include: {
        prefecture: true,
        creator: { select: { name: true } },
        documents: { include: { signers: { include: { signer: true } } } },
      },
    });

    if (!bid) {
      return NextResponse.json({ error: "Edital não encontrado" }, { status: 404 });
    }

    return NextResponse.json(bid);
  } catch (error) {
    console.error("Error fetching bid:", error);
    return NextResponse.json({ error: "Erro ao buscar edital" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    const updateData: Record<string, unknown> = { ...body };
    if (body.openingDate) updateData.openingDate = new Date(body.openingDate);
    if (body.closingDate) updateData.closingDate = new Date(body.closingDate);
    if (body.value) updateData.value = parseFloat(body.value);

    const bid = await prisma.bid.update({
      where: { id: params.id },
      data: updateData,
      include: { prefecture: true },
    });

    return NextResponse.json(bid);
  } catch (error) {
    console.error("Error updating bid:", error);
    return NextResponse.json({ error: "Erro ao atualizar edital" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.bid.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bid:", error);
    return NextResponse.json({ error: "Erro ao excluir edital" }, { status: 500 });
  }
}
