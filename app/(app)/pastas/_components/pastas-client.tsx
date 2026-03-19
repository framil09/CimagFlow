"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  FolderPlus,
  Search,
  ChevronRight,
  Home,
  FileText,
  Trash2,
  Edit2,
  X,
  ArrowLeft,
  FilePlus,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useDebounce } from "@/hooks/use-debounce";

interface Folder {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  prefectureId: string | null;
  createdAt: string;
  _count: { children: number; documents: number };
  prefecture?: { id: string; name: string; city: string; state: string };
}

interface Document {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function PastasClient() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isGestor = userRole === "GESTOR";

  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [prefectures, setPrefectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Raiz" },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", prefectureId: "" });

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFolderId) params.append("parentId", currentFolderId);
      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await fetch(`/api/folders?${params}`);
      const data = await res.json();
      setFolders(data);

      if (currentFolderId) {
        const folderRes = await fetch(`/api/folders/${currentFolderId}`);
        const folderData = await folderRes.json();
        setDocuments(folderData.documents || []);
      } else {
        setDocuments([]);
      }
    } catch {
      toast.error("Erro ao carregar pastas");
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, debouncedSearch]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    const fetchPrefectures = async () => {
      try {
        const res = await fetch("/api/prefectures");
        const data = await res.json();
        setPrefectures(Array.isArray(data) ? data : data.prefectures || []);
      } catch {
        console.error("Erro ao carregar prefeituras");
      }
    };
    fetchPrefectures();
  }, []);

  const navigateToFolder = async (folderId: string | null, folderName: string) => {
    if (folderId === null) {
      setBreadcrumb([{ id: null, name: "Raiz" }]);
    } else {
      const existingIndex = breadcrumb.findIndex((b) => b.id === folderId);
      if (existingIndex >= 0) {
        setBreadcrumb(breadcrumb.slice(0, existingIndex + 1));
      } else {
        setBreadcrumb([...breadcrumb, { id: folderId, name: folderName }]);
      }
    }
    setCurrentFolderId(folderId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFolder) {
        const patchData = isGestor ? { name: formData.name } : formData;
        await fetch(`/api/folders/${editingFolder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchData),
        });
        toast.success("Pasta atualizada!");
      } else {
        await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, parentId: currentFolderId, prefectureId: formData.prefectureId || null }),
        });
        toast.success("Pasta criada!");
      }
      setShowModal(false);
      setEditingFolder(null);
      setFormData({ name: "", description: "", prefectureId: "" });
      fetchFolders();
    } catch {
      toast.error("Erro ao salvar pasta");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta pasta?")) return;
    try {
      await fetch(`/api/folders/${id}`, { method: "DELETE" });
      toast.success("Pasta excluída!");
      fetchFolders();
    } catch {
      toast.error("Erro ao excluir pasta");
    }
  };

  const openEditModal = (folder: Folder) => {
    setEditingFolder(folder);
    setFormData({ name: folder.name, description: folder.description || "", prefectureId: folder.prefectureId || "" });
    setShowModal(true);
  };

  const statusColors: Record<string, string> = {
    RASCUNHO: "bg-gray-100 text-gray-700",
    EM_ANDAMENTO: "bg-yellow-100 text-yellow-700",
    CONCLUIDO: "bg-green-100 text-green-700",
    CANCELADO: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pastas</h1>
          <p className="text-gray-500">Organize seus documentos em pastas</p>
        </div>
        <div className="flex items-center gap-3">
          {currentFolderId && !isGestor && (
            <Link
              href={`/documentos/novo?folderId=${currentFolderId}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <FilePlus className="w-5 h-5" />
              Adicionar Contrato
            </Link>
          )}
          {!isGestor && (
            <button
              onClick={() => {
                setEditingFolder(null);
                setFormData({ name: "", description: "", prefectureId: "" });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <FolderPlus className="w-5 h-5" />
              Nova Pasta
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
        {breadcrumb.map((item, index) => (
          <div key={item.id ?? "root"} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <button
              onClick={() => navigateToFolder(item.id, item.name)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                index === breadcrumb.length - 1
                  ? "bg-emerald-100 text-emerald-700 font-medium"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              {index === 0 && <Home className="w-4 h-4" />}
              {item.name}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6">
        {currentFolderId && (
          <button
            onClick={() => {
              const parent = breadcrumb[breadcrumb.length - 2];
              navigateToFolder(parent?.id ?? null, parent?.name ?? "Raiz");
            }}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        )}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pastas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outlin