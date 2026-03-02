"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Send, XCircle, CheckCircle2, Clock, User, Calendar, ArrowLeft, Loader2, Eye, Copy } from "lucide-react";
import Link from "next/link";

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  RASCUNHO: { label: "Rascunho", bg: "bg-gray-100", color: "text-gray-600" },
  EM_ANDAMENTO: { label: "Em Andamento", bg: "bg-amber-50", color: "text-amber-700" },
  CONCLUIDO: { label: "Concluído", bg: "bg-emerald-50", color: "text-emerald-700" },
  CANCELADO: { label: "Cancelado", bg: "bg-red-50", color: "text-red-600" },
};

const signerStatusConfig: Record<string, { label: string; bg: string }> = {
  PENDENTE: { label: "Pendente", bg: "bg-amber-100 text-amber-700" },
  ASSINADO: { label: "Assinado", bg: "bg-emerald-100 text-emerald-700" },
  RECUSADO: { label: "Recusado", bg: "bg-red-100 text-red-600" },
};

export default function DocumentoDetalheClient({ id }: { id: string }) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  const fetchDoc = async () => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      setDoc(data.document ?? null);
      if (data.document?.fileUrl) {
        const urlRes = await fetch("/api/upload/file-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cloud_storage_path: data.document.fileUrl, isPublic: true }),
        });
        const urlData = await urlRes.json();
        setFileUrl(urlData.url ?? null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDoc(); }, [id]);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/documents/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { alert("Enviado para assinatura!"); fetchDoc(); }
      else alert(data.error ?? "Erro ao enviar");
    } finally { setSending(false); }
  };

  const handleCancel = async () => {
    if (!confirm("Cancelar?")) return;
    await fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELADO" }) });
    fetchDoc();
  };

  const copySignLink = (token: string) => {
    navigator.clipboard?.writeText(`${window.location.origin}/assinar/${token}`);
    alert("Link copiado!");
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#1E3A5F]" /></div>;
  if (!doc) return <div className="text-center py-24 text-gray-400"><p>Documento não encontrado</p><Link href="/documentos" className="text-emerald-600 hover:underline text-sm mt-2 block">Voltar</Link></div>;

  const cfg = statusConfig[doc.status] ?? statusConfig.RASCUNHO;
  const signedCount = doc.signers?.filter((s: any) => s.status === "ASSINADO")?.length ?? 0;
  const totalSigners = doc.signers?.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/documentos" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{doc.title}</h1>
          <p className="text-sm text-gray-500">Criado em {new Date(doc.createdAt).toLocaleDateString("pt-BR")}</p>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Detalhes</h3>
            {doc.description && <p className="text-sm text-gray-600 mb-4">{doc.description}</p>}
            {doc.message && <div className="bg-blue-50 rounded-xl p-3 mb-4"><p className="text-xs text-blue-600 font-medium mb-1">Mensagem</p><p className="text-sm text-gray-700">{doc.message}</p></div>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {doc.deadline && <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-400" /><span>Prazo: {new Date(doc.deadline).toLocaleDateString("pt-BR")}</span></div>}
              <div className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4 text-gray-400" /><span>{doc.creator?.name}</span></div>
            </div>
            {doc.content && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Conteúdo do Documento
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap font-mono border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: doc.content.replace(/\n/g, "<br />") }} />
              </div>
            )}
            {fileUrl && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowPdf(!showPdf)} className="flex items-center gap-2 text-[#1E3A5F] hover:underline text-sm font-medium">
                    <Eye className="w-4 h-4" /> {showPdf ? "Ocultar" : "Visualizar"} PDF
                  </button>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm font-medium">
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
                {showPdf && <iframe src={fileUrl} className="w-full h-96 rounded-xl border border-gray-200" title="Documento PDF" />}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Assinantes</h3>
              <span className="text-sm text-gray-500">{signedCount}/{totalSigners} assinado(s)</span>
            </div>
            {(doc.signers?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum assinante</p>
            ) : (
              <div className="space-y-2">
                {doc.signers?.map((ds: any, i: number) => {
                  const scfg = signerStatusConfig[ds.status] ?? signerStatusConfig.PENDENTE;
                  return (
                    <div key={ds.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{ds.signer?.name}</p>
                        <p className="text-xs text-gray-400">{ds.signer?.email}</p>
                        {ds.signedAt && <p className="text-xs text-emerald-600">Assinado em {new Date(ds.signedAt).toLocaleDateString("pt-BR")}</p>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${scfg.bg}`}>{scfg.label}</span>
                      {ds.status === "PENDENTE" && (
                        <button onClick={() => copySignLink(ds.token)} className="text-gray-400 hover:text-[#1E3A5F]" title="Copiar link">
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">Ações</h3>
            <div className="space-y-2">
              {doc.status === "RASCUNHO" && (
                <button onClick={handleSend} disabled={sending || totalSigners === 0}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar para Assinatura
                </button>
              )}
              {doc.status === "EM_ANDAMENTO" && (
                <button onClick={handleCancel}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-medium text-sm transition-colors">
                  <XCircle className="w-4 h-4" /> Cancelar
                </button>
              )}
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-2.5 rounded-xl font-medium text-sm transition-colors">
                  <Download className="w-4 h-4" /> Baixar Documento
                </a>
              )}
            </div>
          </motion.div>
          {totalSigners > 0 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Progresso</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#1E3A5F]">{signedCount}/{totalSigners}</div>
                <p className="text-sm text-gray-500">assinaturas</p>
                <div className="mt-3 bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-500 rounded-full h-2 transition-all" style={{ width: `${totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0}%` }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
