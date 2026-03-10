import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const minute = await prisma.minutesOfMeeting.findUnique({
      where: { id: params.id },
      include: {
        prefecture: true,
        bid: { select: { id: true, number: true, title: true } },
        creator: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    });

    if (!minute) {
      return NextResponse.json({ error: "Ata não encontrada" }, { status: 404 });
    }

    return NextResponse.json(minute);
  } catch (error) {
    console.error("Error fetching minute:", error);
    return NextResponse.json({ error: "Erro ao buscar ata" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      number,
      title,
      description,
      type,
      status,
      meetingDate,
      startTime,
      endTime,
      location,
      participants,
      content,
      decisions,
      prefectureId,
      bidId,
      isPriceRegistry,
      validityStartDate,
      validityEndDate,
      isPublic,
      allowAdhesion,
      priceValue,
      items,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (number !== undefined) updateData.number = number;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (meetingDate !== undefined) updateData.meetingDate = new Date(meetingDate);
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (location !== undefined) updateData.location = location;
    if (participants !== undefined) updateData.participants = participants;
    if (content !== undefined) updateData.content = content;
    if (decisions !== undefined) updateData.decisions = decisions;
    if (prefectureId !== undefined) updateData.prefectureId = prefectureId || null;
    if (bidId !== undefined) updateData.bidId = bidId || null;
    if (isPriceRegistry !== undefined) updateData.isPriceRegistry = isPriceRegistry;
    if (validityStartDate !== undefined)
      updateData.validityStartDate = validityStartDate ? new Date(validityStartDate) : null;
    if (validityEndDate !== undefined)
      updateData.validityEndDate = validityEndDate ? new Date(validityEndDate) : null;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (allowAdhesion !== undefined) updateData.allowAdhesion = allowAdhesion;
    if (priceValue !== undefined) updateData.priceValue = priceValue ? parseFloat(priceValue) : null;
    if (items !== undefined) updateData.items = items;

    const minute = await prisma.minutesOfMeeting.update({
      where: { id: params.id },
      data: updateData,
      include: {
        prefecture: true,
        bid: { select: { id: true, number: true, title: true } },
        creator: { select: { name: true } },
      },
    });

    return NextResponse.json(minute);
  } catch (error) {
    console.error("Error updating minute:", error);
    return NextResponse.json({ error: "Erro ao atualizar ata" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.minutesOfMeeting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting minute:", error);
    return NextResponse.json({ error: "Erro ao excluir ata" }, { status: 500 });
  }
}
