"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, XCircle, FileText, User, Calendar, Loader2, PenLine, Eye } from "lucide-react";

export default function AssinarClient({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<"signed" | "refused" | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/sign/${token}`);
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Token inválido"); return; }
        setData(json.documentSigner);
      } catch (e) { setError("Erro ao carregar documento"); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [token]);

  const handleAction = async (action: "sign" | "refuse") => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (res.ok) { setResult(action === "sign" ? "signed" : "refused"); setDone(true); }
      else setError(json.error ?? "Erro ao processar");
    } finally { setProcessing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-[#1E3A5F]" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Link Inválido</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
        {result === "signed" ? (
          <><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Documento Assinado!</h2>
          <p className="text-gray-500">Sua assinatura foi registrada com sucesso. Você pode fechar esta janela.</p></>
        ) : (
          <><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assinatura Recusada</h2>
          <p className="text-gray-500">Você recusou assinar este documento.</p></>
        )}
      </motion.div>
    </div>
  );

  if (data?.status !== "PENDENTE") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
        {data?.status === "ASSINADO" ? (
          <><CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Já Assinado</h2>
          <p className="text-gray-500 mt-2">Este documento já foi assinado.</p></>
        ) : (
          <><XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Não Disponível</h2>
          <p className="text-gray-500 mt-2">Este link não está mais disponível.</p></>
        )}
      </div>
    </div>
  );

  const doc = data?.document;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0D2340] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 relative flex-shrink-0">
            <Image
              src="/cimag-logo.png"
              alt="CIMAG Logo"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-white font-bold text-lg">CimagFlow</span>
            <p className="text-blue-200 text-xs">Assinatura Digital</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 mt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{doc?.title}</h2>
              {doc?.description && <p className="text-sm text-gray-500 mt-0.5">{doc.description}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span>Enviado por: <strong>{doc?.creatorName}</strong></span>
            </div>
            {doc?.deadline && (
              <div className="flex items-center gap-2 text-amber-600">
                <Calendar className="w-4 h-4" />
                <span>Prazo: {new Date(doc.deadline).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
          </div>

          {doc?.message && (
            <div className="bg-blue-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-600 font-medium mb-1">Mensagem do remetente</p>
              <p className="text-sm text-gray-700">"{doc.message}"</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Olá, {data?.signer?.name}!</strong> Você está prestes a assinar este documento.
              Ao clicar em "Assinar Documento", você concorda com o conteúdo apresentado.
            </p>
          </div>

          {/* Visualizar conteúdo do documento (criado a partir de template) */}
          {doc?.content && (
            <>
              <button onClick={() => setShowContent(!showContent)}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors mb-4">
                <FileText className="w-4 h-4" /> {showContent ? "Ocultar" : "Ver"} Conteúdo do Documento
              </button>
              {showContent && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{doc.content}</pre>
                </div>
              )}
            </>
          )}

          {doc?.fileUrl && (
            <button onClick={() => setShowPdf(!showPdf)}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors mb-4">
              <Eye className="w-4 h-4" /> {showPdf ? "Ocultar" : "Visualizar"} PDF Anexo
            </button>
          )}
          {showPdf && doc?.fileUrl && (
            <iframe src={doc.fileUrl} className="w-full h-96 rounded-xl border border-gray-200 mb-4" title="Documento" />
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Sua decisão</h3>
          <div className="flex gap-3">
            <button
              onClick={() => handleAction("refuse")}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 border border-red-100"
            >
              <XCircle className="w-5 h-5" /> Recusar
            </button>
            <button
              onClick={() => handleAction("sign")}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 shadow-lg"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PenLine className="w-5 h-5" />}
              Assinar Documento
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            Ao assinar, você concorda com o conteúdo do documento acima.
          </p>
        </motion.div>

        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-6 h-6 relative">
              <Image
                src="/cimag-logo.png"
                alt="CIMAG"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold text-gray-600">CimagFlow</span>
          </div>
          <p className="text-xs text-gray-400">Assinatura Digital • Documento legalmente válido</p>
        </div>
      </div>
    </div>
  );
}
