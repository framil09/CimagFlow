import DocumentoDetalheClient from "./_components/documento-detalhe-client";
export const dynamic = "force-dynamic";
export default function DocumentoDetalhePage({ params }: { params: { id: string } }) {
  return <DocumentoDetalheClient id={params.id} />;
}
