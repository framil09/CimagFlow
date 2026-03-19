"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, CheckCircle2, FileText, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import FileUpload from "@/components/file-upload";

function ResponderDemandaContent() {
  const searchParams = useSearchParams();
  const initialProtocol = searchParams.get("protocolo") || "";
  const initialEmail = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    protocolNumber: initialProtocol,
    requesterEmail: initialEmail,
    message: "",
    attachments: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.protocolNumber.trim()) {
        toast.error("Informe o número do protocolo");
        return;
      }

      if (!formData.requesterEmail.trim()) {
        toast.error("Informe seu email");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.requesterEmail)) {
        toast.error("Email inválido");
        return;
      }

      if (!formData.message.trim() && formData.attachments.length === 0) {
        toast.error("Envie uma mensagem ou anexe pelo menos um arquivo");
        return;
      }

      const res = await fetch("/api/demands/public/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao enviar resposta");
      }

      setSuccess(true);
      toast.success("Resposta enviada com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar resposta");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0D2340] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
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
          </div>

          <Card className="p-8 text-center shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Resposta Enviada com Sucesso!
            </h1>

            <p className="text-gray-600 mb-6">
              Sua resposta foi registrada e o analista responsável será notificado.
              Você receberá atualizações sobre o andamento no seu email.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() =>
                  window.location.href = `/consulta-protocolo?protocol=${formData.protocolNumber}`
                }
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <FileText className="h-4 w-4" />
                Consultar Protocolo
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <Link
                href="/nova-solicitacao"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Abrir Nova Solicitação →
              </Link>
            </div>
          </Card>

          <div className="mt-8 text-center text-blue-200 text-sm">
            <p>© 2026 Cimagflow. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">
            Responder Pendência
          </h1>
          <p className="text-blue-200">
            Envie documentos ou informações solicitadas pelo analista
          </p>
        </div>

        {/* Alert */}
        <Card className="p-4 mb-6 border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Pendência identificada na sua demanda</p>
              <p>
                Use este formulário para enviar os documentos ou informações
                solicitados. Após o envio, o analista será notificado automaticamente.
              </p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <Card className="p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identificação */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Identificação
              </h2>

              <div className="grid gap-2">
                <Label htmlFor="protocol">Número do Protocolo *</Label>
                <Input
                  id="protocol"
                  value={formData.protocolNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, protocolNumber: e.target.value })
                  }
                  placeholder="Ex: 2026-000001"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Seu Email (cadastrado na demanda) *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.requesterEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, requesterEmail: e.target.value })
                    }
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Mensagem */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                Sua Resposta
              </h2>

              <div className="grid gap-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Descreva aqui as informações solicitadas ou observações sobre os documentos enviados..."
                  rows={5}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label>Anexar Documentos</Label>
                <FileUpload
                  onFilesChange={(files) =>
                    setFormData({ ...formData, attachments: files })
                  }
                  maxFiles={10}
                  maxSizeMB={10}
                  publicUpload={true}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                loading ||
                (!formData.message.trim() && formData.attachments.length === 0)
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Resposta
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Links */}
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <Link
            href="/consulta-protocolo"
            className="text-blue-200 hover:text-white transition-colors"
          >
            Consultar Protocolo
          </Link>
          <Link
            href="/nova-solicitacao"
            className="text-blue-200 hover:text-white transition-colors"
          >
            Nova Solicitação
          </Link>
        </div>

        <div className="mt-8 text-center text-blue-200 text-sm">
          <p>© 2026 Cimagflow. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}

export default function ResponderDemandaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0D2340] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        </div>
      }
    >
      <ResponderDemandaContent />
    </Suspense>
  );
}
