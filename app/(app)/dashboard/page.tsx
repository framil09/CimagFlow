import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";

const DashboardClient = nextDynamic(
  () => import("./_components/dashboard-client"),
  { ssr: false, loading: () => (
    <div className="max-w-7xl mx-auto space-y-6 p-1 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  )}
);

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardClient
      userName={session.user?.name ?? ""}
      userRole={(session.user as any)?.role ?? "COLABORADOR"}
    />
  );
}
