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
    const periodDays = parseInt(searchParams.get("period") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const isAdmin = userRole === "ADMIN";

    // ─── Contagens gerais (paralelo) ───
    const [
      totalDocuments,
      docsByStatus,
      docsInPeriod,
      totalDemands,
      demandsByStatus,
      demandsByPriority,
      demandsInPeriod,
      demandsCompletedInPeriod,
      totalBids,
      bidsByStatus,
      totalPrefectures,
      activePrefectures,
      totalCompanies,
      activeCompanies,
      totalSigners,
      activeSigners,
      totalTemplates,
      totalFolders,
      totalUsers,
      activeUsers,
      totalMinutes,
      minutesByStatus,
      totalAdhesions,
      adhesionsByStatus,
      pendingToSign,
      totalSignatures,
      signaturesByStatus,
    ] = await Promise.all([
      prisma.document.count(),
      prisma.document.groupBy({ by: ["status"], _count: true }),
      prisma.document.count({ where: { createdAt: { gte: startDate } } }),
      prisma.demand.count(),
      prisma.demand.groupBy({ by: ["status"], _count: true }),
      prisma.demand.groupBy({ by: ["priority"], _count: true }),
      prisma.demand.count({ where: { createdAt: { gte: startDate } } }),
      prisma.demand.count({ where: { status: "CONCLUIDA", resolvedAt: { gte: startDate } } }),
      prisma.bid.count(),
      prisma.bid.groupBy({ by: ["status"], _count: true }),
      prisma.prefecture.count(),
      prisma.prefecture.count({ where: { isActive: true } }),
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.signer.count(),
      prisma.signer.count({ where: { isActive: true } }),
      prisma.template.count(),
      prisma.folder.count(),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.minutesOfMeeting.count(),
      prisma.minutesOfMeeting.groupBy({ by: ["status"], _count: true }),
      prisma.minuteAdhesion.count(),
      prisma.minuteAdhesion.groupBy({ by: ["status"], _count: true }),
      prisma.documentSigner.count({
        where: {
          signer: { email: session.user?.email ?? "" },
          status: "PENDENTE",
        },
      }),
      prisma.documentSigner.count(),
      prisma.documentSigner.groupBy({ by: ["status"], _count: true }),
    ]);

    // ─── Tempo médio de resolução de demandas ───
    const resolvedDemands = await prisma.demand.findMany({
      where: { status: "CONCLUIDA", resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 200,
      orderBy: { resolvedAt: "desc" },
    });

    let avgResolutionDays = 0;
    if (resolvedDemands.length > 0) {
      const totalDays = resolvedDemands.reduce((acc, d) => {
        if (d.resolvedAt) {
          return acc + (d.resolvedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        }
        return acc;
      }, 0);
      avgResolutionDays = Math.round((totalDays / resolvedDemands.length) * 10) / 10;
    }

    // ─── Demandas por tipo de submissão ───
    const [publicDemands, internalDemands] = await Promise.all([
      prisma.demand.count({ where: { publicSubmission: true } }),
      prisma.demand.count({ where: { publicSubmission: false } }),
    ]);

    // ─── Top prefeituras com mais demandas ───
    const topPrefecturesRaw = await prisma.demand.groupBy({
      by: ["prefectureId"],
      where: { prefectureId: { not: null } },
      _count: true,
      orderBy: { _count: { prefectureId: "desc" } },
      take: 5,
    });

    const prefIds = topPrefecturesRaw.map((p) => p.prefectureId).filter((id): id is string => !!id);
    const prefInfos = await prisma.prefecture.findMany({
      where: { id: { in: prefIds } },
      select: { id: true, name: true, city: true, state: true },
    });

    const topPrefectures = topPrefecturesRaw
      .map((p) => ({
        prefecture: prefInfos.find((i) => i.id === p.prefectureId),
        count: p._count,
      }))
      .filter((p) => p.prefecture);

    // ─── Documentos recentes do usuário ───
    const recentDocs = await prisma.document.findMany({
      where: isAdmin ? {} : { createdBy: userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { signers: { include: { signer: true } } },
    });

    // ─── Demandas recentes ───
    const recentDemands = await prisma.demand.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        prefecture: { select: { name: true, city: true } },
        assignedTo: { select: { name: true } },
      },
    });

    // ─── Documentos criados por mês (últimos 6 meses) ───
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const docsByMonth = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
      FROM documents
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    ` as { month: Date; count: bigint }[];

    // ─── Demandas concluídas por mês ───
    const demandsByMonth = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
      FROM demands
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    ` as { month: Date; count: bigint }[];

    // ─── Atividade recente (audit logs) ───
    const recentActivity = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    });

    // ─── Taxa de conclusão de demandas por prioridade ───
    const completionRateByPriority = await Promise.all(
      [
        { priority: "BAIXA" as const, label: "Baixa" },
        { priority: "MEDIA" as const, label: "Média" },
        { priority: "ALTA" as const, label: "Alta" },
        { priority: "URGENTE" as const, label: "Urgente" },
      ].map(async ({ priority, label }) => {
        const [total, completed] = await Promise.all([
          prisma.demand.count({ where: { priority } }),
          prisma.demand.count({ where: { priority, status: "CONCLUIDA" } }),
        ]);
        return { priority: label, total, completed, rate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0 };
      })
    );

    // ─── Helper para extrair contagem de groupBy ───
    const getCount = (arr: { _count: number; [key: string]: any }[], key: string, value: string) =>
      arr.find((i: any) => i[key] === value)?._count ?? 0;

    return NextResponse.json({
      // Overview cards
      overview: {
        documents: { total: totalDocuments, period: docsInPeriod },
        demands: { total: totalDemands, period: demandsInPeriod, completed: demandsCompletedInPeriod },
        bids: totalBids,
        prefectures: { total: totalPrefectures, active: activePrefectures },
        companies: { total: totalCompanies, active: activeCompanies },
        signers: { total: totalSigners, active: activeSigners },
        templates: totalTemplates,
        folders: totalFolders,
        users: { total: totalUsers, active: activeUsers },
        minutes: totalMinutes,
        adhesions: totalAdhesions,
        pendingToSign,
        signatures: totalSignatures,
      },
      // Documents breakdown
      documents: {
        byStatus: docsByStatus.map((s) => ({ status: s.status, count: s._count })),
        byMonth: docsByMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
      },
      // Demands breakdown
      demands: {
        byStatus: demandsByStatus.map((s) => ({ status: s.status, count: s._count })),
        byPriority: demandsByPriority.map((p) => ({ priority: p.priority, count: p._count })),
        byMonth: demandsByMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
        avgResolutionDays,
        publicDemands,
        internalDemands,
        completionRate: totalDemands > 0
          ? Math.round(((demandsByStatus.find((s: any) => s.status === "CONCLUIDA")?._count ?? 0) / totalDemands) * 1000) / 10
          : 0,
        completionRateByPriority,
        topPrefectures,
      },
      // Bids breakdown
      bids: {
        byStatus: bidsByStatus.map((s) => ({ status: s.status, count: s._count })),
      },
      // Minutes breakdown
      minutes: {
        byStatus: minutesByStatus.map((s) => ({ status: s.status, count: s._count })),
      },
      // Adhesions breakdown
      adhesions: {
        byStatus: adhesionsByStatus.map((s) => ({ status: s.status, count: s._count })),
      },
      // Signatures breakdown
      signatures: {
        byStatus: signaturesByStatus.map((s) => ({ status: s.status, count: s._count })),
      },
      // Recent items
      recentDocs: recentDocs.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
        signersCount: d.signers?.length ?? 0,
        signedCount: d.signers?.filter((s) => s.status === "ASSINADO")?.length ?? 0,
      })),
      recentDemands: recentDemands.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        priority: d.priority,
        protocolNumber: d.protocolNumber,
        prefecture: d.prefecture?.name ?? null,
        assignedTo: d.assignedTo?.name ?? null,
        createdAt: d.createdAt.toISOString(),
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        entityName: a.entityName,
        userName: a.user?.name ?? a.userName,
        createdAt: a.createdAt.toISOString(),
      })),
      period: periodDays,
    });
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
