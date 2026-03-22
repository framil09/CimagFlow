import AssinarClient from "./_components/assinar-client";
export const dynamic = "force-dynamic";
export default async function AssinarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AssinarClient token={token} />;
}
