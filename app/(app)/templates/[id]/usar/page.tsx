import { Suspense } from "react";
import UsarModeloClient from "./_components/usar-modelo-client";

export const dynamic = "force-dynamic";

export default function UsarModeloPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full" /></div>}>
      <UsarModeloClient templateId={params.id} />
    </Suspense>
  );
}
