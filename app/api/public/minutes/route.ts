import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const onlyActive = searchParams.get("onlyActive") === "true";

    const where: Record<string, unknown> = {
      isPublic: true,
      isPriceRegistry: true,
      status: { in: ["APROVADA", "PUBLICADA"] },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { number: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (onlyActive) {
      where.validityEndDate = {
        gte: new Date(),
      };
    }

    const minutes = await prisma.minutesOfMeeting.findMany({
      where,
      orderBy: { validityEndDate: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        description: true,
        validityStartDate: true,
        validityEndDate: true,
        priceValue: true,
        items: true,
        allowAdhesion: true,
        prefecture: {
          select: {
            name: true,
            city: true,
            state: true,
          },
        },
        bid: {
          select: {
            number: true,
            title: true,
          },
        },
        _count: {
          select: {
            adhesions: true,
          },
        },
      },
    });

    return NextResponse.json({ minutes });
  } catch (error) {
    console.error("Error fetching public minutes:", error);
    return NextResponse.json({ error: "Erro ao buscar atas" }, { status: 500 });
  }
}
