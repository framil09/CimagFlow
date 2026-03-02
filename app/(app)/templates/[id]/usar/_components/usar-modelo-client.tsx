"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, ArrowLeft, Save, Send, Loader2, Building2, Landmark,
  FileCode2, FolderOpen, Users, ChevronDown, ChevronUp, Check, AlertCircle,
  Sparkles, Eye, EyeOff, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface UsarModeloClientProps {
  templateId: string;
}

// Mapeamento completo de variáveis para entidades (igual Firmaí)
const PREFECTURE_VARS: Record<string, string> = {
  // Variáveis padrão
  p_nome: "name", p_cidade: "city", p_estado: "state", p_cnpj: "cnpj",
  p_endereco: "address", p_telefone: "phone", p_email: "email", p_prefeito: "mayorName",
  // Variáveis alternativas
  prefeitura: "name", prefeito: "mayorName", municipio: "city",
  nome_prefeitura: "name", cidade_prefeitura: "city", estado_prefeitura: "state",
  cnpj_prefeitura: "cnpj", endereco_prefeitura: "address", telefone_prefeitura: "phone",
  email_prefeitura: "email", nome_prefeito: "mayorName",
  contratante: "name", nome_contratante: "name", cnpj_contratante: "cnpj",
  endereco_contratante: "address", cidade_contratante: "city", estado_contratante: "state",
};

const COMPANY_VARS: Record<string, string> = {
  // Variáveis padrão
  m_nome: "name", m_cnpj: "cnpj", m_endereco: "address", m_cidade: "city",
  m_estado: "state", m_telefone: "phone", m_email: "email", m_contato: "contactName",
  // Variáveis alternativas
  empresa: "name", fornecedor: "name", razao_social: "name", nome_fantasia: "tradeName",
  nome_empresa: "name", cnpj_empresa: "cnpj", endereco_empresa: "address",
  cidade_empresa: "city", estado_empresa: "state", telefone_empresa: "phone",
  email_empresa: "email", contato_empresa: "contactName",
  contratada: "name", nome_contratada: "name", cnpj_contratada: "cnpj",
  endereco_contratada: "address", cidade_contratada: "city", estado_contratada: "state",
  representante: "contactName", representante_legal: "contactName",
};

const BID_VARS: Record<string, string> = {
  // Variáveis padrão
  e_numero: "number", e_ano: "year", e_modalidade: "modality", e_objeto: "object",
  e_valor: "estimatedValue",
  // Variáveis alternativas
  edital: "number", licitacao: "number", objeto: "object",
  numero_edital: "number", ano_edital: "year", modalidade: "modality",
  objeto_licitacao: "object", valor_estimado: "estimatedValue",
  numero_licitacao: "number", ano_licitacao: "year",
  processo: "number", numero_processo: "number",
};

// Categorização de variáveis para melhor UX
const VAR_CATEGORIES = {
  data: ["data", "data_atual", "data_assinatura", "data_contrato", "data_inicio", "data_fim", "data_termino", "data_vencimento", "prazo", "vigencia"],
  valores: ["valor", "valor_total", "valor_contrato", "valor_mensal", "valor_unitario", "valor_global", "preco", "preco_total"],
  contrato: ["numero_contrato", "contrato", "clausula", "objeto_contrato", "descricao"],
};

export default function UsarModeloClient({ templateId }: UsarModeloClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [prefectures, setPrefectures] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [signers, setSigners] = useState<any[]>([]);

  const [selectedPrefecture, setSelectedPrefecture] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedBid, setSelectedBid] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedSigners, setSelectedSigners] = useState<string[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [sendAfterCreate, setSendAfterCreate] = useState(false);
  const [showSigners, setShowSigners] = useState(false);
  const [preview, setPreview] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/templates/${templateId}/use`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        setTemplate(data.template);
        setPrefectures(data.prefectures || []);
        setCompanies(data.companies || []);
        setBids(data.bids || []);
        setFolders(data.folders || []);
        setSigners(data.signers || []);
        setTitle(data.template.name);

        // Extrair variáveis do template
        const vars = extractVariables(data.template.content);
        const initialVars: Record<string, string> = {};
        vars.forEach(v => { initialVars[v] = ""; });
        
        // Preencher data atual automaticamente
        const today = new Date();
        const formattedDate = today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
        const shortDate = today.toLocaleDateString("pt-BR");
        
        VAR_CATEGORIES.data.forEach(dateVar => {
          if (vars.includes(dateVar)) {
            initialVars[dateVar] = dateVar.includes("atual") ? formattedDate : shortDate;
          }
        });
        
        setVariables(initialVars);
      } catch (e: any) {
        toast.error(e.message || "Erro ao carregar modelo");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [templateId]);

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g);
    return matches ? [...new Set(matches.map(m => m.slice(1, -1)))] : [];
  };

  // Preencher variáveis baseado na prefeitura selecionada
  useEffect(() => {
    if (!selectedPrefecture || !autoFillEnabled) return;
    const pref = prefectures.find(p => p.id === selectedPrefecture);
    if (!pref) return;
    
    setVariables(prev => {
      const updated = { ...prev };
      Object.entries(PREFECTURE_VARS).forEach(([varName, field]) => {
        if (varName in updated && pref[field]) {
          updated[varName] = pref[field];
        }
      });
      return updated;
    });
    toast.success(`Dados da prefeitura "${pref.name}" preenchidos!`, { duration: 2000 });
  }, [selectedPrefecture, prefectures, autoFillEnabled]);

  // Preencher variáveis baseado na empresa selecionada
  useEffect(() => {
    if (!selectedCompany || !autoFillEnabled) return;
    const comp = companies.find(c => c.id === selectedCompany);
    if (!comp) return;
    
    setVariables(prev => {
      const updated = { ...prev };
      Object.entries(COMPANY_VARS).forEach(([varName, field]) => {
        if (varName in updated && comp[field]) {
          updated[varName] = comp[field];
        }
      });
      return updated;
    });
    toast.success(`Dados da empresa "${comp.name}" preenchidos!`, { duration: 2000 });
  }, [selectedCompany, companies, autoFillEnabled]);

  // Preencher variáveis baseado no edital selecionado
  useEffect(() => {
    if (!selectedBid || !autoFillEnabled) return;
    const bid = bids.find(b => b.id === selectedBid);
    if (!bid) return;
    
    setVariables(prev => {
      const updated = { ...prev };
      Object.entries(BID_VARS).forEach(([varName, field]) => {
        if (varName in updated && bid[field]) {
          let value = String(bid[field]);
          // Formatar valor monetário
          if (field === "estimatedValue" && bid[field]) {
            value = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(bid[field]);
          }
          updated[varName] = value;
        }
      });
      return updated;
    });
    toast.success(`Dados do edital "${bid.number}/${bid.year}" preenchidos!`, { duration: 2000 });
  }, [selectedBid, bids, autoFillEnabled]);

  // Atualizar preview
  useEffect(() => {
    if (!template) return;
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      if (value) {
        content = content.replace(regex, `<span class="bg-emerald-100 text-emerald-800 px-1 rounded">${value}</span>`);
      } else {
        content = content.replace(regex, `<span class="bg-amber-100 text-amber-700 px-1 rounded">{${key}}</span>`);
      }
    });
    setPreview(content);
  }, [template, variables]);

  const handleSubmit = async (send: boolean) => {
    if (!title.trim()) {
      toast.error("Informe o título do documento");
      return;
    }

    // Verificar se há variáveis não preenchidas
    const emptyVars = Object.entries(variables).filter(([_, v]) => !v);
    if (emptyVars.length > 0) {
      const confirm = window.confirm(`Há ${emptyVars.length} campo(s) não preenchido(s). Deseja continuar mesmo assim?`);
      if (!confirm) return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          variables,
          folderId: selectedFolder || null,
          signerIds: selectedSigners,
          sendAfterCreate: send,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(send ? "Documento criado e enviado para assinatura!" : "Documento salvo como rascunho!");
      router.push(`/documentos/${data.document.id}`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar documento");
    } finally {
      setSaving(false);
    }
  };

  const toggleSigner = (id: string) => {
    setSelectedSigners(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const resetVariables = () => {
    const vars = extractVariables(template.content);
    const resetVars: Record<string, string> = {};
    vars.forEach(v => { resetVars[v] = ""; });
    setVariables(resetVars);
    setSelectedPrefecture("");
    setSelectedCompany("");
    setSelectedBid("");
    toast.success("Campos resetados!");
  };

  // Contar variáveis preenchidas
  const templateVars = useMemo(() => template ? extractVariables(template.content) : [], [template]);
  const filledVars = useMemo(() => Object.values(variables).filter(v => v).length, [variables]);
  const totalVars = templateVars.length;
  const fillPercentage = totalVars > 0 ? Math.round((filledVars / totalVars) * 100) : 0;

  // Filtrar pastas baseado na prefeitura selecionada
  const filteredFolders = useMemo(() => {
    if (!selectedPrefecture) return folders;
    // Mostrar APENAS pastas da prefeitura selecionada
    return folders.filter(f => f.prefectureId === selectedPrefecture);
  }, [folders, selectedPrefecture]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#1E3A5F]" />
        <p className="text-gray-500">Carregando modelo...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <p className="text-gray-600">Modelo não encontrado</p>
        <Link href="/templates" className="text-[#1E3A5F] hover:underline mt-2 inline-block">Voltar aos modelos</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/templates" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Usar Modelo
            </h1>
            <p className="text-gray-500">{template.name}</p>
          </div>
        </div>
        
        {/* Progresso de preenchimento */}
        <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{filledVars}/{totalVars} campos</p>
            <p className="text-xs text-gray-400">preenchidos</p>
          </div>
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${fillPercentage === 100 ? 'bg-emerald-500' : 'bg-[#1E3A5F]'}`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
          <span className="text-sm font-bold text-gray-700">{fillPercentage}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="space-y-6">
          {/* Título e configurações */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Informações do Documento</h3>
              <button
                onClick={resetVariables}
                className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Resetar campos
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título do Documento *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all"
                placeholder="Digite o título do documento"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoFill"
                checked={autoFillEnabled}
                onChange={e => setAutoFillEnabled(e.target.checked)}
                className="w-4 h-4 text-[#1E3A5F] rounded border-gray-300 focus:ring-[#1E3A5F]"
              />
              <label htmlFor="autoFill" className="text-sm text-gray-600 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Preenchimento automático de campos
              </label>
            </div>
          </motion.div>

          {/* Seleções de entidades - COMO O FIRMAÍ */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Preenchimento Automático</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Selecione as entidades abaixo para preencher automaticamente os campos do contrato.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {/* Edital */}
              {bids.length > 0 && (
                <div className="bg-white/70 rounded-xl p-4 border border-blue-100">
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-blue-600" /> Edital / Licitação
                  </label>
                  <select
                    value={selectedBid}
                    onChange={e => setSelectedBid(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Selecione o edital...</option>
                    {bids.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.number}/{b.year} - {b.modality} {b.prefecture?.name ? `(${b.prefecture.name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Prefeitura */}
              {prefectures.length > 0 && (
                <div className="bg-white/70 rounded-xl p-4 border border-blue-100">
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-blue-600" /> Prefeitura / Contratante
                  </label>
                  <select
                    value={selectedPrefecture}
                    onChange={e => setSelectedPrefecture(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Selecione a prefeitura...</option>
                    {prefectures.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.city}/{p.state}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Empresa */}
              {companies.length > 0 && (
                <div className="bg-white/70 rounded-xl p-4 border border-blue-100">
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" /> Empresa / Contratada
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={e => setSelectedCompany(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Selecione a empresa...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.cnpj ? `(${c.cnpj})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pasta */}
              {folders.length > 0 && (
                <div className="bg-white/70 rounded-xl p-4 border border-blue-100">
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-600" /> Salvar na Pasta
                    {selectedPrefecture && filteredFolders.length < folders.length && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        Filtrado
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedFolder}
                    onChange={e => setSelectedFolder(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Nenhuma (raiz)</option>
                    {filteredFolders.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  {selectedPrefecture && filteredFolders.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Nenhuma pasta encontrada para esta prefeitura
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Variáveis do modelo */}
          {templateVars.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Campos do Modelo
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {filledVars}/{totalVars} preenchidos
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
                {templateVars.map(varName => {
                  const isFilled = !!variables[varName];
                  return (
                    <div key={varName} className={`relative ${isFilled ? 'ring-1 ring-emerald-200' : ''} rounded-lg`}>
                      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        {isFilled && <Check className="w-3 h-3 text-emerald-500" />}
                        <code className="bg-gray-100 px-1 rounded text-[10px]">{`{${varName}}`}</code>
                      </label>
                      <input
                        type="text"
                        value={variables[varName] || ""}
                        onChange={e => setVariables(prev => ({ ...prev, [varName]: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all ${
                          isFilled ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200'
                        }`}
                        placeholder={varName.replace(/_/g, " ")}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Assinantes */}
          {signers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <button
                type="button"
                onClick={() => setShowSigners(!showSigners)}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-[#1E3A5F] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Assinantes
                  {selectedSigners.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                      {selectedSigners.length} selecionado(s)
                    </span>
                  )}
                </span>
                {showSigners ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {showSigners && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 max-h-48 overflow-y-auto space-y-2 border border-gray-100 rounded-xl p-3">
                      {signers.map(s => (
                        <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedSigners.includes(s.id)}
                            onChange={() => toggleSigner(s.id)}
                            className="w-4 h-4 text-[#1E3A5F] rounded border-gray-300 focus:ring-[#1E3A5F]"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.email}</p>
                          </div>
                          {s.type && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.type}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Botões de ação */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3 sticky bottom-0 bg-gray-50 py-4 -mx-2 px-2"
          >
            <button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Rascunho
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={saving || selectedSigners.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1E3A5F] text-white rounded-xl font-medium hover:bg-[#2a4a73] transition-colors disabled:opacity-50 shadow-lg"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Criar e Enviar
            </button>
          </motion.div>
        </div>

        {/* Preview */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-6 h-fit"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Pré-visualização
            </h3>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="bg-gray-50 rounded-xl p-4 mb-3">
                  <p className="text-xs text-gray-500 mb-2">Legenda:</p>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-emerald-100 rounded"></span> Preenchido
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-amber-100 rounded"></span> Pendente
                    </span>
                  </div>
                </div>
                <div 
                  className="bg-white border border-gray-200 rounded-xl p-4 min-h-[400px] max-h-[600px] overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: preview.replace(/\n/g, "<br />") }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
