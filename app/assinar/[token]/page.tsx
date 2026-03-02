import AssinarClient from "./_components/assinar-client";
export const dynamic = "force-dynamic";
export default function AssinarPage({ params }: { params: { token: string } }) {
  return <AssinarClient token={params.token} />;
}
