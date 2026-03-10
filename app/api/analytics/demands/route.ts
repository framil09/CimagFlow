import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30"; // days
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Estatísticas gerais de demandas
    const [
      totalDemands,
      demandsByStatus,
      demandsByPriority,
      demandsCreatedInPeriod,
      demandsCompletedInPeriod,
    ] = await Promise.all([
      prisma.demand.count(),
      prisma.demand.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.demand.groupBy({
        by: ["priority"],
        _count: true,
      }),
      prisma.demand.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.demand.count({
        where: {
          status: "CONCLUIDA",
          resolvedAt: { gte: startDate },
        },
      }),
    ]);

    // Top prefeituras que mais fazem solicitações
    const topPrefectures = await prisma.demand.groupBy({
      by: ["prefectureId"],
      where: {
        prefectureId: { not: null },
      },
      _count: true,
      orderBy: { _count: { prefectureId: "desc" } },
      take: 10,
    });

    const prefectureIds = topPrefectures
      .map((p) => p.prefectureId)
      .filter((id): id is string => id !== null);

    const prefecturesInfo = await prisma.prefecture.findMany({
      where: { id: { in: prefectureIds } },
      select: { id: true, name: true, city: true, state: true },
    });

    const topPrefecturesWithInfo = topPrefectures
      .map((p) => ({
        prefecture: prefecturesInfo.find((info) => info.id === p.prefectureId),
        count: p._count,
      }))
      .filter((p) => p.prefecture);

    // Demandas concluídas por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const completedByMonth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "resolvedAt") as month,
        COUNT(*) as count
      FROM demands
      WHERE "status" = 'CONCLUIDA' 
        AND "resolvedAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "resolvedAt")
      ORDER BY month DESC
    ` as { month: Date; count: bigint }[];

    // Tempo médio de resolução (em dias)
    const resolvedDemands = await prisma.demand.findMany({
      where: {
        status: "CONCLUIDA",
        resolvedAt: { not: null },
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionDays = 0;
    if (resolvedDemands.length > 0) {
      const totalDays = resolvedDemands.reduce((acc, demand) => {
        if (demand.resolvedAt) {
          const diff = demand.resolvedAt.getTime() - demand.createdAt.getTime();
          return acc + diff / (1000 * 60 * 60 * 24); // Convert to days
        }
        return acc;
      }, 0);
      avgResolutionDays = totalDays / resolvedDemands.length;
    }

    // Demandas por tipo de submissão (pública vs interna)
    const publicDemands = await prisma.demand.count({
      where: { publicSubmission: true },
    });
    const internalDemands = await prisma.demand.count({
      where: { publicSubmission: false },
    });

    // Top usuários que mais resolvem demandas
    const topResolvers = await prisma.demand.groupBy({
      by: ["assignedToId"],
      where: {
        status: "CONCLUIDA",
        assignedToId: { not: null },
        resolvedAt: { gte: startDate },
      },
      _count: true,
      orderBy: { _count: { assignedToId: "desc" } },
      take: 5,
    });

    const userIds = topResolvers
      .map((r) => r.assignedToId)
      .filter((id): id is string => id !== null);

    const usersInfo = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const topResolversWithInfo = topResolvers.map((r) => ({
      user: usersInfo.find((info) => info.id === r.assignedToId),
      count: r._count,
    }));

    // Taxa de conclusão por prioridade
    const completionRateByPriority = await Promise.all([
      { priority: "BAIXA" as const, label: "Baixa" },
      { priority: "MEDIA" as const, label: "Média" },
      { priority: "ALTA" as const, label: "Alta" },
      { priority: "URGENTE" as const, label: "Urgente" },
    ].map(async ({ priority, label }) => {
      const total = await prisma.demand.count({
        where: { priority },
      });
      const completed = await prisma.demand.count({
        where: { priority, status: "CONCLUIDA" },
      });
      return {
        priority: label,
        total,
        completed,
        rate: total > 0 ? (completed / total) * 100 : 0,
      };
    }));

    return NextResponse.json({
      totalDemands,
      demandsByStatus: demandsByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      demandsByPriority: demandsByPriority.map((p) => ({
        priority: p.priority,
        count: p._count,
      })),
      demandsCreatedInPeriod,
      demandsCompletedInPeriod,
      topPrefectures: topPrefecturesWithInfo,
      completedByMonth: completedByMonth.map((m) => ({
        month: m.month,
        count: Number(m.count),
      })),
      avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
      publicDemands,
      internalDemands,
      topResolvers: topResolversWithInfo,
      completionRateByPriority,
    });
  } catch (error) {
    console.error("Error fetching demand analytics:", error);
    return NextResponse.json(
      { error: "Erro ao buscar análises de demandas" },
      { status: 500 }
    );
  }
}
