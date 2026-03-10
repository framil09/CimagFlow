import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

// Listar adesões
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const minuteId = searchParams.get("minuteId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (minuteId) {
      where.minuteId = minuteId;
    }

    if (status && status !== "TODOS") {
      where.status = status;
    }

    const adhesions = await prisma.minuteAdhesion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        minute: {
          select: {
            number: true,
            title: true,
          },
        },
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ adhesions });
  } catch (error) {
    console.error("Error fetching adhesions:", error);
    return NextResponse.json({ error: "Erro ao buscar adesões" }, { status: 500 });
  }
}
