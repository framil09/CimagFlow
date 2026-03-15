"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit2, Save, X, Clock, User, Mail, Phone, Building2, Calendar, FileText, Trash2, Paperclip, Download, Upload, Send, AlertTriangle, MessageCircle, CheckCircle2, XCircle, Timer, Eye, Loader2, Hash, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const statusConfig = {
  ABERTA: { label: "Aberta", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800", dot: "bg-blue-500", icon: Eye },
  EM_ANALISE: { label: "Em Análise", color: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800", dot: "bg-yellow-500", icon: Timer },
  EM_ANDAMENTO: { label: "Em Andamento", color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800", dot: "bg-orange-500", icon: Loader2 },
  AGUARDANDO_RESPOSTA: { label: "Aguardando Resposta", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800", dot: "bg-purple-500", icon: Clock },
  CONCLUIDA: { label: "Concluída", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800", dot: "bg-emerald-500", icon: CheckCircle2 },
  CANCELADA: { label: "Cancelada", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800", dot: "bg-red-500", icon: XCircle },
};

const priorityConfig = {
  BAIXA: { label: "Baixa", color: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-950/50 dark:text-slate-300 dark:border-slate-700" },
  MEDIA: { label: "Média", color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800" },
  ALTA: { label: "Alta", color: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800" },
  URGENTE: { label: "Urgente", color: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800" },
};

const actionLabels: Record<string, string> = {
  CRIACAO: "Demanda criada",
  STATUS_ALTERADO: "Status alterado",
  ATRIBUICAO_ALTERADA: "Atribuição alterada",
  PRIORIDADE_ALTERADA: "Prioridade alterada",
};

export default function DemandaDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const [demand, setDemand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const [editData, setEditData] = useState({
    status: "",
    priority: "",
    assignedToId: "",
    resolution: "",
    internalNotes: "",
  });

  const [messageText, setMessageText] = useState("");
  const [messageFiles, setMessageFiles] = useState<string[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isPendency, setIsPendency] = useState(false);

  useEffect(() => {
    loadDemand();
    loadUsers();
  }, [params.id]);

  const loadDemand = async () => {
    try {
      const res = await fetch(`/api/demands/${params.id}`);
      if (!res.ok) throw new Error("Erro ao carregar demanda");
      const data = await res.json();
      setDemand(data);
      setEditData({
        status: data.status,
        priority: data.priority,
        assignedToId: data.assignedToId || "",
        resolution: data.resolution || "",
        internalNotes: data.internalNotes || "",
      });
    } catch (error) {
      toast.error("Erro ao carregar demanda");
      router.push("/demandas");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/collaborators");
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/demands/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (!res.ok) throw new Error("Erro ao atualizar demanda");

      const updated = await res.json();
      setDemand(updated);
      setEditing(false);
      toast.success("Demanda atualizada com sucesso!");
      loadDemand(); // Recarregar para pegar histórico atualizado
    } catch (error) {
      toast.error("Erro ao atualizar demanda");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/demands/${params.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao deletar demanda");

      toast.success("Demanda deletada com sucesso!");
      router.push("/demandas");
    } catch (error) {
      toast.error("Erro ao deletar demanda");
    }
  };

  const getFileName = (url: string) => {
    const parts = url.split("/");
    const fileNameWithParams = parts[parts.length - 1];
    return decodeURIComponent(fileNameWithParams.split("?")[0]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setSendingMessage(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        // Get presigned URL
        const presignedRes = await fetch("/api/upload/presigned-private", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });

        if (!presignedRes.ok) throw new Error("Erro ao obter URL de upload");

        const { url, fileUrl } = await presignedRes.json();

        // Upload to S3
        const uploadRes = await fetch(url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadRes.ok) throw new Error("Erro ao fazer upload do arquivo");
        uploadedUrls.push(fileUrl);
      }

      setMessageFiles([...messageFiles, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} arquivo(s) adicionado(s)`);
    } catch (error) {
      toast.error("Erro ao fazer upload dos arquivos");
    } finally {
      setSendingMessage(false);
      // Reset the input
      event.target.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (messageFiles.length === 0 && !messageText.trim()) {
      toast.error("Adicione uma mensagem ou arquivos para enviar");
      return;
    }

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/demands/${params.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText.trim(),
          attachments: messageFiles,
          isPendency,
        }),
      });

      if (!res.ok) throw new Error("Erro ao enviar mensagem");

      toast.success(
        isPendency
          ? "Pendência enviada! O solicitante será notificado por email."
          : "Mensagem enviada! O solicitante será notificado por email."
      );
      setMessageText("");
      setMessageFiles([]);
      setIsPendency(false);
      loadDemand();
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted mx-auto" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-[#1E3A5F] animate-spin mx-auto" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando demanda...</p>
        </div>
      </div>
    );
  }

  if (!demand) return null;

  const status = statusConfig[demand.status as keyof typeof statusConfig];
  const priority = priorityConfig[demand.priority as keyof typeof priorityConfig];
  const StatusIcon = status.icon;

  const messageHistory = demand.history?.filter((h: any) =>
    ["PENDENCIA_ENVIADA", "RESPOSTA_ENVIADA", "RESPOSTA_SOLICITANTE"].includes(h.action)
  ) || [];

  const adminHistory = demand.history?.filter((h: any) =>
    !["PENDENCIA_ENVIADA", "RESPOSTA_ENVIADA", "RESPOSTA_SOLICITANTE"].includes(h.action)
  ) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-[#1E3A5F] to-[#2d5a8e] p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-white/80 hover:text-white hover:bg-white/10 mt-1 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs bg-white/10 border-white/20 text-white/90 backdrop-blur-sm">
                    <Hash className="h-3 w-3 mr-1" />
                    {demand.protocolNumber}
                  </Badge>
                  <Badge variant="outline" className={`border text-xs font-medium ${priority.color}`}>
                    {priority.label}
                  </Badge>
                  <Badge variant="outline" className={`border text-xs font-medium ${status.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{demand.title}</h1>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateTime(demand.createdAt)}
                  </span>
                  {demand.prefecture && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {demand.prefecture.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!editing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="text-white/80 hover:text-white hover:bg-white/10 border border-white/20"
                  >
                    <Edit2 className="mr-2 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-200 hover:text-white hover:bg-red-500/20 border border-red-300/20"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Deletar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar esta demanda? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                          Deletar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="text-white/80 hover:text-white hover:bg-white/10 border border-white/20"
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Save className="mr-2 h-3.5 w-3.5" />
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição */}
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400" />
                Descrição
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {demand.description}
              </p>
            </CardContent>
          </Card>

          {/* Arquivos Enviados pelo Solicitante */}
          {demand.attachments && demand.attachments.length > 0 && (
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400" />
                  Arquivos Enviados
                  <Badge variant="secondary" className="ml-auto text-xs font-normal">
                    {demand.attachments.length} arquivo{demand.attachments.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-2">
                  {demand.attachments.map((file: string, index: number) => (
                    <a
                      key={index}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-3 border rounded-lg hover:bg-accent hover:border-[#1E3A5F]/20 transition-all"
                    >
                      <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-950 transition-colors">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="flex-1 text-sm truncate font-medium">{getFileName(file)}</span>
                      <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comunicação com o Solicitante */}
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400" />
                Comunicação com o Solicitante
                {messageHistory.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs font-normal">
                    {messageHistory.length} mensage{messageHistory.length !== 1 ? "ns" : "m"}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Conversation history */}
              {messageHistory.length > 0 && (
                <div className="mb-6 space-y-3 max-h-[420px] overflow-y-auto pr-1 scroll-smooth">
                  {[...messageHistory]
                    .reverse()
                    .map((item: any) => {
                      const isRequester = item.action === "RESPOSTA_SOLICITANTE";
                      const isPend = item.action === "PENDENCIA_ENVIADA";
                      let parsedFiles: string[] = [];
                      try {
                        if (item.newValue) parsedFiles = JSON.parse(item.newValue);
                      } catch {}

                      return (
                        <div
                          key={item.id}
                          className={`flex ${isRequester ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                              isRequester
                                ? "bg-muted/60 rounded-bl-md"
                                : isPend
                                ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60 rounded-br-md"
                                : "bg-[#1E3A5F]/5 border border-[#1E3A5F]/10 dark:bg-blue-950/30 dark:border-blue-800/60 rounded-br-md"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                                isRequester ? "bg-gray-400" : "bg-[#1E3A5F]"
                              }`}>
                                {isRequester ? getInitials(demand.requesterName) : getInitials(item.userName)}
                              </div>
                              <span className="text-xs font-semibold">
                                {isRequester ? demand.requesterName : item.userName}
                              </span>
                              {isPend && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40">
                                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                  Pendência
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {formatDateTime(item.createdAt)}
                              </span>
                            </div>
                            {item.comment && (
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.comment}</p>
                            )}
                            {parsedFiles.length > 0 && (
                              <div className="mt-3 space-y-1.5">
                                {parsedFiles.map((file: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs p-2 rounded-md bg-white/80 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors border border-border/50"
                                  >
                                    <Paperclip className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                    <span className="truncate font-medium">{getFileName(file)}</span>
                                    <Download className="h-3 w-3 flex-shrink-0 ml-auto text-muted-foreground" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {messageHistory.length > 0 && <Separator className="mb-4" />}

              {/* Compose */}
              <div className="space-y-3">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Digite sua mensagem para o solicitante..."
                  rows={3}
                  disabled={sendingMessage}
                  className="resize-none focus-visible:ring-[#1E3A5F]/30"
                />

                {/* File upload area */}
                <div className="space-y-2">
                  <div className="border-2 border-dashed rounded-lg p-3 hover:border-[#1E3A5F]/30 hover:bg-muted/30 transition-all cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="message-file-upload"
                      disabled={sendingMessage}
                    />
                    <label
                      htmlFor="message-file-upload"
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Anexar Arquivos</p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX, imagens</p>
                      </div>
                    </label>
                  </div>

                  {messageFiles.length > 0 && (
                    <div className="space-y-1.5">
                      {messageFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border text-sm"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span className="flex-1 truncate text-xs font-medium">{getFileName(file)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500"
                            onClick={() => {
                              setMessageFiles(messageFiles.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pendency toggle + send */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant={isPendency ? "default" : "outline"}
                    size="sm"
                    className={isPendency
                      ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                      : "text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/30"
                    }
                    onClick={() => setIsPendency(!isPendency)}
                  >
                    <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                    {isPendency ? "Pendência ativa" : "Pendência"}
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (messageFiles.length === 0 && !messageText.trim())}
                    className={`flex-1 ${
                      isPendency
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-[#1E3A5F] hover:bg-[#162d4a]"
                    } text-white`}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sendingMessage
                      ? "Enviando..."
                      : isPendency
                      ? "Enviar Pendência"
                      : "Enviar Mensagem"}
                  </Button>
                </div>

                {isPendency && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      O status será alterado para &quot;Aguardando Resposta&quot; e o solicitante receberá um link para responder.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Atualização de Status */}
          {editing && (
            <Card className="overflow-hidden border shadow-sm border-emerald-200 dark:border-emerald-800/50">
              <CardHeader className="bg-emerald-50/80 dark:bg-emerald-950/30 pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Atualizar Demanda
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</Label>
                    <Select
                      value={editData.status}
                      onValueChange={(value) => setEditData({ ...editData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridade</Label>
                    <Select
                      value={editData.priority}
                      onValueChange={(value) => setEditData({ ...editData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Responsável</Label>
                  <Select
                    value={editData.assignedToId}
                    onValueChange={(value) => setEditData({ ...editData, assignedToId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(users) && users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - {user.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolução</Label>
                  <Textarea
                    value={editData.resolution}
                    onChange={(e) => setEditData({ ...editData, resolution: e.target.value })}
                    placeholder="Descreva a resolução da demanda..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notas Internas</Label>
                  <Textarea
                    value={editData.internalNotes}
                    onChange={(e) => setEditData({ ...editData, internalNotes: e.target.value })}
                    placeholder="Notas visíveis apenas internamente..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolução */}
          {demand.resolution && !editing && (
            <Card className="overflow-hidden border shadow-sm border-emerald-200 dark:border-emerald-800/50">
              <CardHeader className="bg-emerald-50/80 dark:bg-emerald-950/30 pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Resolução
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {demand.resolution}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400" />
                Histórico de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-0">
                {adminHistory.length > 0 ? (
                  adminHistory.map((item: any, index: number) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-[#1E3A5F]/10 transition-colors">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#1E3A5F] dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                        {index < adminHistory.length - 1 && (
                          <div className="w-px flex-1 bg-border my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{item.userName}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {actionLabels[item.action] || item.action}
                        </p>
                        {item.oldValue && item.newValue && (
                          <div className="mt-1.5 flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="font-normal text-[11px]">{item.oldValue}</Badge>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="outline" className="font-normal text-[11px]">{item.newValue}</Badge>
                          </div>
                        )}
                        {item.comment && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{item.comment}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status Summary Card */}
          <Card className="overflow-hidden border shadow-sm">
            <div className={`px-4 py-3 border-b ${status.color}`}>
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-semibold">{status.label}</span>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/40">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Prioridade</p>
                  <Badge variant="outline" className={`text-xs ${priority.color}`}>
                    {priority.label}
                  </Badge>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/40">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Mensagens</p>
                  <p className="text-lg font-bold text-foreground">{messageHistory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requerente */}
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-[#1E3A5F] dark:text-blue-400" />
                Requerente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-muted">
                  <AvatarFallback className="bg-[#1E3A5F]/10 text-[#1E3A5F] dark:bg-blue-950 dark:text-blue-300 text-xs font-bold">
                    {getInitials(demand.requesterName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{demand.requesterName}</p>
                  <a
                    href={`mailto:${demand.requesterEmail}`}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block"
                  >
                    {demand.requesterEmail}
                  </a>
                </div>
              </div>
              {(demand.requesterPhone || demand.requesterCpf) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {demand.requesterPhone && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{demand.requesterPhone}</span>
                      </div>
                    )}
                    {demand.requesterCpf && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{demand.requesterCpf}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Prefeitura */}
          {demand.prefecture && (
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-[#1E3A5F] dark:text-blue-400" />
                  Prefeitura
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#1E3A5F]/10 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-[#1E3A5F] dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{demand.prefecture.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {demand.prefecture.city}/{demand.prefecture.state}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Responsável */}
          {demand.assignedTo && (
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-[#1E3A5F] dark:text-blue-400" />
                  Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-muted">
                    <AvatarImage src={demand.assignedTo.photo} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                      {getInitials(demand.assignedTo.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{demand.assignedTo.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{demand.assignedTo.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Datas */}
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-[#1E3A5F] dark:text-blue-400" />
                Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Criada em</span>
                <span className="text-xs font-medium">{formatDateTime(demand.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Atualizada em</span>
                <span className="text-xs font-medium">{formatDateTime(demand.updatedAt)}</span>
              </div>
              {demand.dueDate && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Data Limite</span>
                    <Badge variant="outline" className="text-xs font-medium text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800">
                      {formatDate(demand.dueDate)}
                    </Badge>
                  </div>
                </>
              )}
              {demand.resolvedAt && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Resolvida em</span>
                    <Badge variant="outline" className="text-xs font-medium text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">
                      {formatDateTime(demand.resolvedAt)}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
