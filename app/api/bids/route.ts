import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { number: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "TODOS") {
      where.status = status;
    }

    if (type && type !== "TODOS") {
      where.type = type;
    }

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          prefecture: true,
          creator: { select: { name: true } },
          _count: { select: { documents: true } },
        },
      }),
      prisma.bid.count({ where }),
    ]);

    return NextResponse.json({ bids, total, page, limit });
  } catch (error) {
    console.error("Error fetching bids:", error);
    return NextResponse.json({ error: "Erro ao buscar editais" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { number, title, description, type, status, openingDate, closingDate, value, prefectureId } = body;

    if (!number || !title) {
      return NextResponse.json({ error: "Número e título são obrigatórios" }, { status: 400 });
    }

    const bid = await prisma.bid.create({
      data: {
        number,
        title,
        description,
        type: type || "PREGAO",
        status: status || "ABERTO",
        openingDate: openingDate ? new Date(openingDate) : null,
        closingDate: closingDate ? new Date(closingDate) : null,
        value: value ? parseFloat(value) : null,
        prefectureId: prefectureId || null,
        createdBy: userId,
      },
      include: { prefecture: true },
    });

    return NextResponse.json(bid, { status: 201 });
  } catch (error) {
    console.error("Error creating bid:", error);
    return NextResponse.json({ error: "Erro ao criar edital" }, { status: 500 });
  }
}
