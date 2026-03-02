import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
            { state: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [prefectures, total] = await Promise.all([
      prisma.prefecture.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
        include: { _count: { select: { signers: true, bids: true } } },
      }),
      prisma.prefecture.count({ where }),
    ]);

    return NextResponse.json({ prefectures, total, page, limit });
  } catch (error) {
    console.error("Error fetching prefectures:", error);
    return NextResponse.json({ error: "Erro ao buscar prefeituras" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, city, state, cnpj, address, phone, email, mayorName } = body;

    if (!name || !city || !state) {
      return NextResponse.json({ error: "Nome, cidade e estado são obrigatórios" }, { status: 400 });
    }

    const prefecture = await prisma.prefecture.create({
      data: { name, city, state, cnpj, address, phone, email, mayorName },
    });

    return NextResponse.json(prefecture, { status: 201 });
  } catch (error) {
    console.error("Error creating prefecture:", error);
    return NextResponse.json({ error: "Erro ao criar prefeitura" }, { status: 500 });
  }
}
