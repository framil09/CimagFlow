import { Suspense } from "react";
import NovoDocumentoClient from "./_components/novo-documento-client";
export const dynamic = "force-dynamic";
export default function NovoDocumentoPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>}>
      <NovoDocumentoClient />
    </Suspense>
  );
}
