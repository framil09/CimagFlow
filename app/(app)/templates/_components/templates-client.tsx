"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileCode2, Plus, Search, Edit2, Trash2, X, Check, Loader2, Tag, Eye, FileText } from "lucide-react";
import Link from "next/link";

const COMMON_VARS = [
  // Data
  "data", "data_atual", "ano",
  // Prefeitura
  "prefeitura", "municipio", "prefeito", "p_nome", "p_cidade", "p_estado", "p_cnpj", "p_endereco", "p_telefone", "p_email", "p_prefeito",
  // Empresa
  "empresa", "fornecedor", "razao_social", "m_nome", "m_cnpj", "m_endereco", "m_cidade", "m_estado", "m_telefone", "m_email", "m_contato",
  // Edital
  "edital", "licitacao", "objeto", "e_numero", "e_ano", "e_modalidade", "e_objeto", "e_valor",
  // Contrato
  "cont_n", "valor_global", "valor_ext",
  // Outros
  "nome_assinante", "cargo", "cpf", "testemunha1", "testemunha2",
];

export default function TemplatesClient() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", content: "", variables: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newVar, setNewVar] = useState("");
  const [previewEditing, setPreviewEditing] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/templates?${params}`);
      const data = await res.json();
      setTemplates(data.templates ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchTemplates, 300);
    return () => clearTimeout(t);
  }, [fetchTemplates]);

  const openCreate = () => { setForm({ name: "", description: "", content: "", variables: [] }); setEditId(null); setShowModal(true); };
  const openEdit = (t: any) => {
    setForm({ name: t.name ?? "", description: t.description ?? "", content: t.content ?? "", variables: t.variables ?? [] });
    setEditId(t.id);
    setShowModal(true);
  };

  const insertVar = (v: string) => {
    setForm((f) => ({ ...f, content: f.content + `{${v}}` }));
    if (!form.variables.includes(v)) setForm((f) => ({ ...f, variables: [...f.variables, v] }));
  };

  const addVar = () => {
    const v = newVar.trim().replace(/\s+/g, "_").toLowerCase();
    if (v && !form.variables.includes(v)) setForm((f) => ({ ...f, variables: [...f.variables, v] }));
    setNewVar("");
  };

  const removeVar = (v: string) => setForm((f) => ({ ...f, variables: f.variables.filter((x) => x !== v) }));

  const extractVars = (content: string) => {
    const matches = content.match(/\{([^}]+)\}/g);
    return matches ? [...new Set(matches.map((m) => m.slice(1, -1)))] : [];
  };

  const handleSave = async () => {
    if (!form.name || !form.content) { alert("Nome e conteúdo obrigatórios"); return; }
    setSaving(true);
    const vars = [...new Set([...form.variables, ...extractVars(form.content)])];
    try {
      const url = editId ? `/api/templates/${editId}` : "/api/templates";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, variables: vars }),
      });
      if (res.ok) { setShowModal(false); fetchTemplates(); }
      else { const d = await res.json(); alert(d.error ?? "Erro ao salvar"); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este modelo?")) return;
    setDeleting(id);
    try { await fetch(`/api/templates/${id}`, { method: "DELETE" }); fetchTemplates(); }
    finally { setDeleting(null); }
  };

  const openPreview = (template: any) => {
    setShowPreview(template);
    setPreviewContent(template.content);
    setPreviewEditing(false);
  };

  const savePreviewChanges = async () => {
    if (!showPreview) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${showPreview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: previewContent }),
      });
      if (res.ok) {
        setShowPreview({ ...showPreview, content: previewContent });
        setPreviewEditing(false);
        fetchTemplates();
      } else {
        const d = await res.json();
        alert(d.error ?? "Erro ao salvar alterações");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modelos</h1>
          <p className="text-gray-500 text-sm">{templates.length} modelo{templates.length !== 1 ? "s" : ""} disponível</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152d4a] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg">
          <Plus className="w-4 h-4" /> Novo Modelo
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar modelos..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-gray-400">Carregando...</p></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileCode2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum modelo encontrado</p>
          <button onClick={openCreate} className="text-emerald-600 hover:underline text-sm mt-1">Criar modelo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{t.name}</h3>
                  {t.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{t.description}</p>}
                </div>
              </div>
              {(t.variables?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {t.variables.slice(0, 4).map((v: string) => (
                    <span key={v} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{`{${v}}`}</span>
                  ))}
                  {t.variables.length > 4 && <span className="text-xs text-gray-400">+{t.variables.length - 4} mais</span>}
                </div>
              )}
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{t.content?.replace(/<[^>]+>/g, " ").substring(0, 100)}...</p>
              <div className="flex items-center gap-2">
                <Link href={`/templates/${t.id}/usar`}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-[#1E3A5F] text-white hover:bg-[#2a4a73] transition-colors font-medium">
                  <FileText className="w-3.5 h-3.5" /> Usar Modelo
                </Link>
                <button onClick={() => openPreview(t)}
                  className="flex items-center justify-center gap-1.5 text-xs p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => openEdit(t)}
                  className="flex items-center justify-center gap-1.5 text-xs p-2 rounded-lg bg-blue-50 text-[#1E3A5F] hover:bg-blue-100 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                  className="flex items-center justify-center gap-1.5 text-xs p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">{editId ? "Editar" : "Novo"} Modelo</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do modelo"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Variáveis comuns</label>
                    <span className="text-xs text-gray-400">Clique para inserir no texto</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {COMMON_VARS.map((v) => (
                      <button key={v} onClick={() => insertVar(v)}
                        className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors font-medium">
                        {`{${v}}`}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newVar} onChange={(e) => setNewVar(e.target.value)} placeholder="Nova variável"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVar(); } }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
                    <button onClick={addVar} className="px-3 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#152d4a]">
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                  {form.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.variables.map((v) => (
                        <span key={v} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          {`{${v}}`}
                          <button onClick={() => removeVar(v)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
                  <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12}
                    placeholder="Digite o conteúdo do modelo aqui. Use {variavel} para campos dinâmicos."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm font-mono resize-y" />
                </div>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1E3A5F] hover:bg-[#152d4a] text-white px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{showPreview.name}</h2>
                  {previewEditing && <p className="text-xs text-amber-600 mt-1">Modo de Edição</p>}
                </div>
                <div className="flex items-center gap-2">
                  {previewEditing ? (
                    <>
                      <button 
                        onClick={() => { setPreviewContent(showPreview.content); setPreviewEditing(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-4 h-4" /> Cancelar
                      </button>
                      <button 
                        onClick={savePreviewChanges}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setPreviewEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                  )}
                  <button onClick={() => { setShowPreview(null); setPreviewEditing(false); }} 
                    className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {previewEditing ? (
                  <textarea 
                    value={previewContent}
                    onChange={(e) => setPreviewContent(e.target.value)}
                    className="w-full h-full min-h-[400px] bg-white border-2 border-blue-200 rounded-xl p-4 font-mono text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Edite o conteúdo aqui..."
                  />
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm whitespace-pre-wrap text-gray-700">
                    {previewContent}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
