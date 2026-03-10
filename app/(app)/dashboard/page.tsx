import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import DashboardClient from "./_components/dashboard-client";
import DemandAnalytics from "./_components/demand-analytics";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? "";

  // Usar groupBy para reduzir número de queries
  const statusCounts = await prisma.document.groupBy({
    by: ['status'],
    where: { createdBy: userId },
    _count: { status: true },
  });

  const totalDocs = statusCounts.reduce((acc, s) => acc + s._count.status, 0);
  const signed = statusCounts.find(s => s.status === "CONCLUIDO")?._count.status ?? 0;
  const inProgress = statusCounts.find(s => s.status === "EM_ANDAMENTO")?._count.status ?? 0;
  const drafts = statusCounts.find(s => s.status === "RASCUNHO")?._count.status ?? 0;
  const cancelled = statusCounts.find(s => s.status === "CANCELADO")?._count.status ?? 0;

  // Buscar documentos recentes e contagem de pendentes em uma única execução
  const [recentDocs, pendingToSign] = await Promise.all([
    prisma.document.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { signers: { include: { signer: true } } },
    }),
    prisma.documentSigner.count({
      where: {
        signer: { email: session?.user?.email ?? "" },
        status: "PENDENTE",
      },
    }),
  ]);

  const stats = { totalDocs, signed, inProgress, drafts, cancelled, pendingToSign };

  const recent = recentDocs.map((d: any) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    signersCount: d.signers?.length ?? 0,
    signedCount: d.signers?.filter((s: any) => s.status === "ASSINADO")?.length ?? 0,
  }));

  return (
    <div className="space-y-8">
      <DashboardClient stats={stats} recentDocs={recent} userName={session?.user?.name ?? ""} />
      <DemandAnalytics />
    </div>
  );
}
