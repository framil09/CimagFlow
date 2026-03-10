"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  Building,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface Adhesion {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  requesterCpf: string | null;
  requesterCnpj: string | null;
  companyName: string | null;
  position: string | null;
  status: string;
  justification: string | null;
  requestDate: string;
  reviewComment: string | null;
  reviewedAt: string | null;
  minute: {
    number: string;
    title: string;
  };
  reviewer: {
    name: string;
    email: string;
  } | null;
}

const STATUS_CONFIG = {
  PENDENTE: { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  APROVADA: { label: "Aprovada", color: "bg-green-100 text-green-700", icon: CheckCircle },
  REJEITADA: { label: "Rejeitada", color: "bg-red-100 text-red-700", icon: XCircle },
  CANCELADA: { label: "Cancelada", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
};

export default function AdesoesPage() {
  const [adhesions, setAdhesions] = useState<Adhesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    fetchAdhesions();
  }, [filterStatus]);

  const fetchAdhesions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "TODOS") params.append("status", filterStatus);

      const res = await fetch(`/api/adhesions?${params}`);
      const data = await res.json();
      setAdhesions(data.adhesions || []);
    } catch {
      toast.error("Erro ao carregar adesões");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, status: "APROVADA" | "REJEITADA") => {
    try {
      const res = await fetch(`/api/adhesions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewComment }),
      });

      if (!res.ok) throw new Error();

      toast.success(
        status === "APROVADA" ? "Adesão aprovada!" : "Adesão rejeitada!"
      );
      setReviewingId(null);
      setReviewComment("");
      fetchAdhesions();
    } catch {
      toast.error("Erro ao processar adesão");
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/atas"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Voltar para Atas
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Solicitações de Adesão</h1>
          <p className="text-gray-500">Gerencie as solicitações de adesão às atas</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="TODOS">Todos os Status</option>
          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : adhesions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {adhesions.map((adhesion) => {
            const statusConfig = STATUS_CONFIG[adhesion.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={adhesion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(adhesion.requestDate), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ata: {adhesion.minute.number} - {adhesion.minute.title}
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">
                          <strong>Nome:</strong> {adhesion.requesterName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">
                          <strong>E-mail:</strong> {adhesion.requesterEmail}
                        </span>
                      </div>
                      {adhesion.requesterPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">
                            <strong>Telefone:</strong> {adhesion.requesterPhone}
                          </span>
                        </div>
                      )}
                      {adhesion.companyName && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="w-4 h-4 text-orange-600" />
                          <span className="text-gray-700">
                            <strong>Empresa:</strong> {adhesion.companyName}
                          </span>
                        </div>
                      )}
                      {adhesion.requesterCpf && (
                        <div className="text-sm">
                          <strong>CPF:</strong> {adhesion.requesterCpf}
                        </div>
                      )}
                      {adhesion.requesterCnpj && (
                        <div className="text-sm">
                          <strong>CNPJ:</strong> {adhesion.requesterCnpj}
                        </div>
                      )}
                      {adhesion.position && (
                        <div className="text-sm">
                          <strong>Cargo:</strong> {adhesion.position}
                        </div>
                      )}
                    </div>

                    {adhesion.justification && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          Justificativa:
                        </p>
                        <p className="text-sm text-gray-700">{adhesion.justification}</p>
                      </div>
                    )}

                    {adhesion.reviewComment && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-sm text-blue-600 font-medium mb-1">
                          Comentário da revisão:
                        </p>
                        <p className="text-sm text-gray-700">{adhesion.reviewComment}</p>
                        {adhesion.reviewer && (
                          <p className="text-xs text-gray-500 mt-2">
                            Revisado por: {adhesion.reviewer.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {adhesion.status === "PENDENTE" && (
                    <div className="flex flex-col gap-3 min-w-[200px]">
                      {reviewingId === adhesion.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Comentário (opcional)"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() => handleReview(adhesion.id, "APROVADA")}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReview(adhesion.id, "REJEITADA")}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeitar
                          </button>
                          <button
                            onClick={() => {
                              setReviewingId(null);
                              setReviewComment("");
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewingId(adhesion.id)}
                          className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                          Revisar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
