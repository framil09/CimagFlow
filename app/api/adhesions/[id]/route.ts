import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

// Aprovar, rejeitar ou cancelar adesão
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { status, reviewComment } = body;

    if (!status || !["APROVADA", "REJEITADA", "CANCELADA"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const adhesion = await prisma.minuteAdhesion.update({
      where: { id: params.id },
      data: {
        status,
        reviewComment,
        reviewedBy: userId,
        reviewedAt: new Date(),
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

    return NextResponse.json(adhesion);
  } catch (error) {
    console.error("Error updating adhesion:", error);
    return NextResponse.json({ error: "Erro ao atualizar adesão" }, { status: 500 });
  }
}

// Excluir adesão
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.minuteAdhesion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting adhesion:", error);
    return NextResponse.json({ error: "Erro ao excluir adesão" }, { status: 500 });
  }
}
