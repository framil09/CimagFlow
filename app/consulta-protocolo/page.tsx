"use client";

import { useState } from "react";
import { Search, FileText, Clock, CheckCircle2, AlertCircle, Paperclip, Download, AlertTriangle, Send, FileCheck2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Image from "next/image";

const statusConfig = {
  ABERTA: { label: "Aberta", icon: FileText, color: "bg-blue-500" },
  EM_ANALISE: { label: "Em Análise", icon: Clock, color: "bg-yellow-500" },
  EM_ANDAMENTO: { label: "Em Andamento", icon: AlertCircle, color: "bg-orange-500" },
  AGUARDANDO_RESPOSTA: { label: "Aguardando Resposta", icon: Clock, color: "bg-purple-500" },
  CONCLUIDA: { label: "Concluída", icon: CheckCircle2, color: "bg-green-500" },
  CANCELADA: { label: "Cancelada", icon: CheckCircle2, color: "bg-red-500" },
};

const priorityConfig = {
  BAIXA: { label: "Baixa", color: "bg-gray-500" },
  MEDIA: { label: "Média", color: "bg-blue-500" },
  ALTA: { label: "Alta", color: "bg-orange-500" },
  URGENTE: { label: "Urgente", color: "bg-red-500" },
};

export default function ConsultaProtocoloPage() {
  const [protocolNumber, setProtocolNumber] = useState("");
  const [demand, setDemand] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolNumber.trim()) {
      toast.error("Digite um número de protocolo");
      return;
    }

    setLoading(true);
    setSearched(true);
    setDemand(null);

    try {
      const res = await fetch(`/api/demands/protocol/${protocolNumber.trim()}`);
      if (res.status === 404) {
        toast.error("Protocolo não encontrado");
        return;
      }
      if (!res.ok) {
        throw new Error("Erro ao buscar protocolo");
      }

      const data = await res.json();
      setDemand(data);
    } catch (error) {
      toast.error("Erro ao buscar protocolo");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  const getFileName = (url: string) => {
    const parts = url.split("/");
    const fileNameWithParams = parts[parts.length - 1];
    return decodeURIComponent(fileNameWithParams.split("?")[0]);
  };

  const StatusIcon = demand ? statusConfig[demand.status as keyof typeof statusConfig].icon : FileText;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0D2340] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <Image
              src="/cimag-logo.png"
              alt="CIMAG Logo"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Consulta de Protocolo</h1>
          <p className="text-blue-200">
            Acompanhe o status da sua demanda usando o número de protocolo
          </p>
        </div>

        {/* Search Form */}
        <Card className="p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              placeholder="Digite o número do protocolo (ex: 2026-000001)"
              value={protocolNumber}
              onChange={(e) => setProtocolNumber(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Consultar
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Results */}
        {searched && !loading && !demand && (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Protocolo não encontrado</p>
              <p className="text-sm mt-2">
                Verifique se o número do protocolo está correto e tente novamente
              </p>
            </div>
          </Card>
        )}

        {demand && (
          <div className="space-y-6">
            {/* Main Info */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                      {demand.protocolNumber}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{demand.title}</h2>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityConfig[demand.priority as keyof typeof priorityConfig].color}>
                      {priorityConfig[demand.priority as keyof typeof priorityConfig].label}
                    </Badge>
                    <Badge className={statusConfig[demand.status as keyof typeof statusConfig].color}>
                      {statusConfig[demand.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>
                </div>
                <StatusIcon className="h-12 w-12 text-muted-foreground" />
              </div>

              {demand.prefecture && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Prefeitura</p>
                    <p className="font-medium">
                      {demand.prefecture.name} - {demand.prefecture.city}/{demand.prefecture.state}
                    </p>
                  </div>
                </>
              )}

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Criada em</p>
                  <p className="font-medium">{formatDateTime(demand.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
                  <p className="font-medium">{formatDateTime(demand.updatedAt)}</p>
                </div>
              </div>

              {demand.dueDate && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Data Limite / Prazo</p>
                      <p className="font-semibold text-orange-600">{formatDate(demand.dueDate)}</p>
                    </div>
                  </div>
                </>
              )}

              {demand.resolvedAt && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data de Conclusão</p>
                    <p className="font-medium text-green-600">{formatDateTime(demand.resolvedAt)}</p>
                  </div>
                </>
              )}
            </Card>

            {/* Contratos Gerados */}
            {demand.documents && demand.documents.length > 0 && (
              <Card className="p-6 border-emerald-200 bg-emerald-50/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-900">
                  <FileCheck2 className="h-5 w-5" />
                  Contrato(s) Gerado(s)
                </h3>
                <div className="space-y-3">
                  {demand.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-4 bg-white border border-emerald-200 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Gerado em {formatDateTime(doc.createdAt)}
                        </p>
                      </div>
                      <Badge className={
                        doc.status === "CONCLUIDO" ? "bg-green-500" :
                        doc.status === "EM_ANDAMENTO" ? "bg-orange-500" :
                        doc.status === "CANCELADO" ? "bg-red-500" :
                        "bg-blue-500"
                      }>
                        {doc.status === "RASCUNHO" ? "Em Elaboração" :
                         doc.status === "EM_ANDAMENTO" ? "Em Assinatura" :
                         doc.status === "CONCLUIDO" ? "Assinado" :
                         "Cancelado"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Arquivos Enviados */}
            {demand.attachments && demand.attachments.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Documentos Enviados
                </h3>
                <div className="grid gap-3">
                  {demand.attachments.map((file: string, index: number) => (
                    <a
                      key={index}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <span className="flex-1 text-sm truncate">{getFileName(file)}</span>
                      <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {/* Resposta (se houver) */}
            {(demand.responseComment || (demand.responseAttachments && demand.responseAttachments.length > 0)) && (
              <Card className="p-6 border-green-200 bg-green-50/50">
                <h3 className="text-lg font-semibold mb-4 text-green-900">Resposta Recebida</h3>
                
                {demand.responseComment && (
                  <div className="mb-4">
                    <p className="whitespace-pre-wrap text-sm">{demand.responseComment}</p>
                  </div>
                )}

                {demand.responseAttachments && demand.responseAttachments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-3 text-green-800">
                      Documentos Anexados na Resposta:
                    </p>
                    <div className="grid gap-2">
                      {demand.responseAttachments.map((file: string, index: number) => (
                        <a
                          key={index}
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 border border-green-300 rounded-lg hover:bg-green-100 transition-colors bg-white"
                        >
                          <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <span className="flex-1 text-sm truncate">{getFileName(file)}</span>
                          <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Pendências (se houver) */}
            {demand.history && demand.history.filter((h: any) => h.action === "PENDENCIA_ENVIADA").length > 0 && (
              <Card className="p-6 border-amber-300 bg-amber-50/80">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Pendência(s) — Ação Necessária
                </h3>
                <div className="space-y-3">
                  {demand.history
                    .filter((h: any) => h.action === "PENDENCIA_ENVIADA")
                    .map((item: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 bg-white border border-amber-200 rounded-lg"
                      >
                        <p className="text-xs text-muted-foreground mb-2">
                          Enviada em {formatDateTime(item.createdAt)}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{item.comment}</p>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-amber-700 mt-3">
                  Por favor, providencie o que foi solicitado para dar continuidade ao atendimento da sua demanda.
                </p>
                <Button
                  onClick={() =>
                    window.location.href = `/responder-demanda?protocolo=${encodeURIComponent(demand.protocolNumber)}`
                  }
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Responder Pendência
                </Button>
              </Card>
            )}

            {/* Timeline */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Histórico</h3>
              <div className="space-y-4">
                {demand.history && demand.history.length > 0 ? (
                  demand.history.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${item.action === "PENDENCIA_ENVIADA" ? "bg-amber-500" : item.action === "RESPOSTA_SOLICITANTE" ? "bg-emerald-500" : item.action === "CONTRATO_GERADO" ? "bg-blue-500" : item.action === "PRAZO_ALTERADO" ? "bg-orange-500" : "bg-primary"}`} />
                        {index < demand.history.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={item.action === "PENDENCIA_ENVIADA" ? "border-amber-500 text-amber-700" : item.action === "RESPOSTA_SOLICITANTE" ? "border-emerald-500 text-emerald-700" : item.action === "CONTRATO_GERADO" ? "border-blue-500 text-blue-700" : item.action === "PRAZO_ALTERADO" ? "border-orange-500 text-orange-700" : ""}>
                            {item.action === "PENDENCIA_ENVIADA" ? "Pendência Enviada" : item.action === "RESPOSTA_SOLICITANTE" ? "Sua Resposta" : item.action === "CONTRATO_GERADO" ? "Contrato Gerado" : item.action === "PRAZO_ALTERADO" ? "Prazo Atualizado" : item.action}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>
                        {item.comment && (
                          <p className="text-sm text-muted-foreground">{item.comment}</p>
                        )}
                        {item.newValue && (
                          <p className="text-sm font-medium">{item.newValue}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum histórico disponível</p>
                )}
              </div>
            </Card>

            {/* Info Box */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Informações Importantes</p>
                  <p className="text-blue-700">
                    Esta é uma consulta pública do protocolo. Para mais informações ou atualizações
                    sobre sua demanda, você receberá notificações no email cadastrado.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-blue-200 text-sm">
          <p>© 2026 Cimagflow. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
