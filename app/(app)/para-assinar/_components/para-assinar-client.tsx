"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PenLine, Clock, CheckCircle2, Loader2, FileText, Copy, Check, 
  ExternalLink, FolderOpen, Users, ChevronDown, ChevronUp, Send,
  XCircle, AlertCircle, Link2
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Signer {
  id: string;
  token: string;
  status: string;
  signedAt: string | null;
  signer: { id: string; name: string; email: string };
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  createdAt: string;
  folder: { id: string; name: string } | null;
  signers: Signer[];
  stats: { total: number; signed: number; pending: number; refused: number };
}

export default function ParaAssinarClient() {
  const { data: session } = useSession() ?? {};
  const [activeTab, setActiveTab] = useState<"personal" | "all">("all");
  const [personalItems, setPersonalItems] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<{ token: string; name: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "personal") {
          const res = await fetch("/api/para-assinar?view=personal");
          const data = await res.json();
          setPersonalItems(data.items ?? []);
        } else {
          const res = await fetch("/api/para-assinar?view=all");
          const data = await res.json();
          setDocuments(data.documents ?? []);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [activeTab]);

  const copyLink = async (token: string) => {
    if (!token) {
      toast.error("Token não encontrado");
      return;
    }
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/assinar/${token}`;
    
    try {
      // Tenta usar o clipboard API moderno
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        // Fallback para navegadores antigos ou contexto não seguro
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedToken(token);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
      // Se falhar, mostra o link em um toast para copiar manualmente
      toast.error(
        <div className="text-sm">
          <p className="font-medium mb-1">Não foi possível copiar automaticamente.</p>
          <p className="break-all text-xs bg-gray-100 p-2 rounded">{link}</p>
        </div>,
        { duration: 8000 }
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ASSINADO":
        return <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle2 className="w-3 h-3" /> Assinado</span>;
      case "RECUSADO":
        return <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium"><XCircle className="w-3 h-3" /> Recusado</span>;
      default:
        return <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> Pendente</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Para Assinar</h1>
          <p className="text-gray-500 text-sm">Gerencie e acompanhe as assinaturas dos contratos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "all" ? "bg-white text-[#1E3A5F] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Contratos em Andamento
        </button>
        <button
          onClick={() => setActiveTab("personal")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "personal" ? "bg-white text-[#1E3A5F] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <PenLine className="w-4 h-4 inline mr-2" />
          Minha Assinatura
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#1E3A5F] mx-auto" /></div>
      ) : activeTab === "personal" ? (
        // View: Documentos para eu assinar
        personalItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <p className="font-semibold text-gray-600">Nenhum documento pendente!</p>
            <p className="text-sm mt-1">Todos os documentos foram assinados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {personalItems.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PenLine className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{item.document?.title}</h3>
                    {item.document?.description && <p className="text-sm text-gray-500 mt-0.5">{item.document.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Por: {item.document?.creatorName}</span>
                      {item.document?.deadline && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="w-3 h-3" /> Prazo: {new Date(item.document.deadline).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <a href={`/assinar/${item.token}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors flex-shrink-0">
                    <PenLine className="w-4 h-4" /> Assinar
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        // View: Todos os contratos em andamento
        documents.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-600">Nenhum contrato em andamento</p>
            <p className="text-sm mt-1">Crie um novo documento e envie para assinatura.</p>
            <Link href="/documentos/novo" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#2a4a73]">
              <FileText className="w-4 h-4" /> Novo Documento
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header do documento */}
                <div 
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                        {doc.folder && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">
                            <FolderOpen className="w-3 h-3" /> {doc.folder.name}
                          </span>
                        )}
                      </div>
                      {doc.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{doc.description}</p>}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-emerald-600 font-medium">{doc.stats.signed}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{doc.stats.total} assinados</span>
                          </div>
                        </div>
                        {doc.stats.pending > 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertCircle className="w-3 h-3" /> {doc.stats.pending} pendente{doc.stats.pending > 1 ? "s" : ""}
                          </span>
                        )}
                        {doc.deadline && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" /> {new Date(doc.deadline).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Barra de progresso */}
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(doc.stats.signed / doc.stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {Math.round((doc.stats.signed / doc.stats.total) * 100)}%
                      </span>
                      {expandedDoc === doc.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de assinantes (expandido) */}
                <AnimatePresence>
                  {expandedDoc === doc.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Assinantes
                        </h4>
                        <div className="space-y-2">
                          {doc.signers.map((signer, idx) => (
                            <div key={signer.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{signer.signer.name}</p>
                                <p className="text-xs text-gray-500">{signer.signer.email}</p>
                              </div>
                              {getStatusBadge(signer.status)}
                              {signer.status === "PENDENTE" && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyLink(signer.token); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A5F] text-white rounded-lg text-xs font-medium hover:bg-[#2a4a73] transition-colors"
                                  >
                                    {copiedToken === signer.token ? (
                                      <><Check className="w-3 h-3" /> Copiado</>
                                    ) : (
                                      <><Copy className="w-3 h-3" /> Copiar Link</>
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShowLinkModal({ token: signer.token, name: signer.signer.name }); }}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Ver link completo"
                                  >
                                    <Link2 className="w-4 h-4 text-gray-500" />
                                  </button>
                                  <a
                                    href={`/assinar/${signer.token}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Abrir link"
                                  >
                                    <ExternalLink className="w-4 h-4 text-gray-500" />
                                  </a>
                                </div>
                              )}
                              {signer.status === "ASSINADO" && signer.signedAt && (
                                <span className="text-xs text-gray-400">
                                  {new Date(signer.signedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end mt-3">
                          <Link
                            href={`/documentos/${doc.id}`}
                            className="flex items-center gap-2 text-sm text-[#1E3A5F] hover:underline"
                          >
                            Ver detalhes do documento <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Modal para mostrar link completo */}
      <AnimatePresence>
        {showLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLinkModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Link de Assinatura</h2>
                <button onClick={() => setShowLinkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Link para <span className="font-medium">{showLinkModal.name}</span> assinar:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-gray-800 break-all select-all font-mono">
                  {typeof window !== "undefined" ? `${window.location.origin}/assinar/${showLinkModal.token}` : `/assinar/${showLinkModal.token}`}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    copyLink(showLinkModal.token);
                    setShowLinkModal(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-xl font-medium hover:bg-[#2a4a73] transition-colors"
                >
                  <Copy className="w-4 h-4" /> Copiar Link
                </button>
                <a
                  href={`/assinar/${showLinkModal.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Abrir Link
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
