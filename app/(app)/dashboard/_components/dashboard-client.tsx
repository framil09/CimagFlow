"use client";

import { motion } from "framer-motion";
import { FileText, CheckCircle2, Clock, FileEdit, XCircle, PenLine, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";
import { useEffect, useState } from "react";

interface Stats {
  totalDocs: number;
  signed: number;
  inProgress: number;
  drafts: number;
  cancelled: number;
  pendingToSign: number;
}

interface RecentDoc {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  signersCount: number;
  signedCount: number;
}

interface Props {
  stats: Stats;
  recentDocs: RecentDoc[];
  userName: string;
}

const statusConfig: Record<string, { label: string; bg: string }> = {
  RASCUNHO: { label: "Rascunho", bg: "bg-gray-100 text-gray-600" },
  EM_ANDAMENTO: { label: "Em andamento", bg: "bg-amber-100 text-amber-700" },
  CONCLUIDO: { label: "Concluído", bg: "bg-emerald-100 text-emerald-700" },
  CANCELADO: { label: "Cancelado", bg: "bg-red-100 text-red-600" },
};

function AnimatedNumber({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let current = 0;
    const duration = 1000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{value}</>;
}

export default function DashboardClient({ stats, recentDocs, userName }: Props) {
  const cards = [
    { label: "Para Assinar", value: stats.pendingToSign, icon: PenLine, color: "from-purple-500 to-purple-700", link: "/para-assinar" },
    { label: "Assinados", value: stats.signed, icon: CheckCircle2, color: "from-emerald-500 to-emerald-700", link: "/documentos?status=CONCLUIDO" },
    { label: "Em Andamento", value: stats.inProgress, icon: Clock, color: "from-amber-500 to-amber-700", link: "/documentos?status=EM_ANDAMENTO" },
    { label: "Rascunhos", value: stats.drafts, icon: FileEdit, color: "from-blue-500 to-blue-700", link: "/documentos?status=RASCUNHO" },
    { label: "Cancelados", value: stats.cancelled, icon: XCircle, color: "from-red-500 to-red-700", link: "/documentos?status=CANCELADO" },
    { label: "Total", value: stats.totalDocs, icon: FileText, color: "from-[#1E3A5F] to-[#0D2340]", link: "/documentos" },
  ];

  const pieData = [
    { name: "Assinados", value: stats.signed, color: "#10B981" },
    { name: "Em Andamento", value: stats.inProgress, color: "#F59E0B" },
    { name: "Rascunhos", value: stats.drafts, color: "#60B5FF" },
    { name: "Cancelados", value: stats.cancelled, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "Assinados", value: stats.signed, fill: "#10B981" },
    { name: "Em Andamento", value: stats.inProgress, fill: "#F59E0B" },
    { name: "Rascunhos", value: stats.drafts, fill: "#60B5FF" },
    { name: "Cancelados", value: stats.cancelled, fill: "#EF4444" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-gray-900">
          Olá, {userName?.split(" ")?.[0] ?? ""} 👋
        </motion.h1>
        <p className="text-gray-500 mt-1">Resumo da sua atividade no sistema</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Link href={card.link}>
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1"><AnimatedNumber target={card.value} /></p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 group-hover:text-emerald-600 transition-colors">
                  <span>Ver detalhes</span><ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {stats.totalDocs > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Documentos por Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Documentos Recentes</h3>
          <Link href="/documentos" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentDocs?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum documento ainda</p>
            <Link href="/documentos/novo" className="text-emerald-600 hover:underline text-sm mt-1 block">Criar primeiro documento</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(recentDocs ?? []).map((doc) => (
              <Link key={doc.id} href={`/documentos/${doc.id}`}
                className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-400">
                    {doc.signedCount}/{doc.signersCount} assinaturas · {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statusConfig[doc.status]?.bg ?? "bg-gray-100 text-gray-600"}`}>
                  {statusConfig[doc.status]?.label ?? doc.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
