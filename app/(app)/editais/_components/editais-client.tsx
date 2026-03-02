"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar,
  DollarSign,
  Building2,
  Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Prefecture {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface Bid {
  id: string;
  number: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  openingDate: string | null;
  closingDate: string | null;
  value: number | null;
  prefectureId: string | null;
  prefecture: Prefecture | null;
  creator: { name: string };
  createdAt: string;
  _count: { documents: number };
}

const BID_TYPES = [
  { value: "CHAMADA_PUBLICA", label: "Chamada Pública" },
  { value: "COMPRA_DIRETA", label: "Compra Direta" },
  { value: "CONCORRENCIA", label: "Concorrência" },
  { value: "CONCURSO", label: "Concurso" },
  { value: "CONVENIO", label: "Convênio" },
  { value: "CONVITE", label: "Convite" },
  { value: "CREDENCIAMENTO", label: "Credenciamento" },
  { value: "DISPENSA", label: "Dispensa" },
  { value: "INEXIGIBILIDADE", label: "Inexigibilidade" },
  { value: "LEILAO", label: "Leilão" },
  { value: "PREGAO", label: "Pregão" },
  { value: "PREGAO_ELETRONICO", label: "Pregão Eletrônico" },
  { value: "RATEIO", label: "Rateio" },
  { value: "TOMADA_PRECOS", label: "Tomada de Preços" },
];

const BID_STATUS = [
  { value: "ABERTO", label: "Aberto", color: "bg-blue-100 text-blue-700" },
  { value: "EM_ANDAMENTO", label: "Em Andamento", color: "bg-yellow-100 text-yellow-700" },
  { value: "ENCERRADO", label: "Encerrado", color: "bg-green-100 text-green-700" },
  { value: "CANCELADO", label: "Cancelado", color: "bg-red-100 text-red-700" },
  { value: "SUSPENSO", label: "Suspenso", color: "bg-gray-100 text-gray-700" },
];

export default function EditaisClient() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterType, setFilterType] = useState("TODOS");
  const [showModal, setShowModal] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [formData, setFormData] = useState({
    number: "",
    title: "",
    description: "",
    type: "PREGAO_ELETRONICO",
    status: "ABERTO",
    openingDate: "",
    closingDate: "",
    value: "",
    prefectureId: "",
  });

  const fetchBids = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterStatus !== "TODOS") params.append("status", filterStatus);
      if (filterType !== "TODOS") params.append("type", filterType);

      const res = await fetch(`/api/bids?${params}`);
      const data = await res.json();
      setBids(data.bids || []);
    } catch {
      toast.error("Erro ao carregar editais");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterType]);

  const fetchPrefectures = async () => {
    try {
      const res = await fetch("/api/prefectures");
      const data = await res.json();
      setPrefectures(data.prefectures || []);
    } catch {
      console.error("Erro ao carregar prefeituras");
    }
  };

  useEffect(() => {
    fetchBids();
    fetchPrefectures();
  }, [fetchBids]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBid) {
        await fetch(`/api/bids/${editingBid.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        toast.success("Edital atualizado!");
      } else {
        await fetch("/api/bids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        toast.success("Edital cadastrado!");
      }
      setShowModal(false);
      setEditingBid(null);
      resetForm();
      fetchBids();
    } catch {
      toast.error("Erro ao salvar edital");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este edital?")) return;
    try {
      await fetch(`/api/bids/${id}`, { method: "DELETE" });
      toast.success("Edital excluído!");
      fetchBids();
    } catch {
      toast.error("Erro ao excluir edital");
    }
  };

  const openEditModal = (bid: Bid) => {
    setEditingBid(bid);
    setFormData({
      number: bid.number,
      title: bid.title,
      description: bid.description || "",
      type: bid.type,
      status: bid.status,
      openingDate: bid.openingDate ? bid.openingDate.split("T")[0] : "",
      closingDate: bid.closingDate ? bid.closingDate.split("T")[0] : "",
      value: bid.value?.toString() || "",
      prefectureId: bid.prefectureId || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ number: "", title: "", description: "", type: "PREGAO", status: "ABERTO", openingDate: "", closingDate: "", value: "", prefectureId: "" });
  };

  const getStatusBadge = (status: string) => {
    const s = BID_STATUS.find((b) => b.value === status);
    return s ? <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span> : status;
  };

  const getTypeLabel = (type: string) => {
    return BID_TYPES.find((t) => t.value === type)?.label || type;
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editais</h1>
          <p className="text-gray-500">Gerencie os editais de licitação</p>
        </div>
        <button
          onClick={() => { setEditingBid(null); resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Edital
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número ou título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="TODOS">Todos os Status</option>
          {BID_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="TODOS">Todas as Modalidades</option>
          {BID_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : bids.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum edital encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono">{bid.number}</span>
                    {getStatusBadge(bid.status)}
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs">{getTypeLabel(bid.type)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{bid.title}</h3>
                  {bid.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{bid.description}</p>}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {bid.prefecture && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{bid.prefecture.name}</span>
                      </div>
                    )}
                    {bid.value && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatCurrency(bid.value)}</span>
                      </div>
                    )}
                    {bid.openingDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Abertura: {format(new Date(bid.openingDate), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                    {bid.closingDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Encerramento: {format(new Date(bid.closingDate), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{bid._count.documents} documentos</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(bid)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-5 h-5 text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(bid.id)} className="p-2 hover:bg-red-100 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{editingBid ? "Editar Edital" : "Novo Edital"}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                    <input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required placeholder="001/2024" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {BID_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {BID_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prefeitura</label>
                    <select value={formData.prefectureId} onChange={(e) => setFormData({ ...formData, prefectureId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="">Selecione</option>
                      {prefectures.map((p) => (<option key={p.id} value={p.id}>{p.name} - {p.city}/{p.state}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Abertura</label>
                    <input type="date" value={formData.openingDate} onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Encerramento</label>
                    <input type="date" value={formData.closingDate} onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado (R$)</label>
                  <input type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0.00" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600">Salvar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
