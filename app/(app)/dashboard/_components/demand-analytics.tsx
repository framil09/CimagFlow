"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Building2,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

interface DemandAnalytics {
  totalDemands: number;
  demandsByStatus: { status: string; count: number }[];
  demandsByPriority: { priority: string; count: number }[];
  demandsCreatedInPeriod: number;
  demandsCompletedInPeriod: number;
  topPrefectures: {
    prefecture: {
      id: string;
      name: string;
      city: string;
      state: string;
    };
    count: number;
  }[];
  completedByMonth: { month: Date; count: number }[];
  avgResolutionDays: number;
  publicDemands: number;
  internalDemands: number;
  topResolvers: {
    user: { id: string; name: string; email: string };
    count: number;
  }[];
  completionRateByPriority: {
    priority: string;
    total: number;
    completed: number;
    rate: number;
  }[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em Análise",
  EM_ANDAMENTO: "Em Andamento",
  AGUARDANDO_RETORNO: "Aguardando Retorno",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "#F59E0B",
  EM_ANALISE: "#3B82F6",
  EM_ANDAMENTO: "#8B5CF6",
  AGUARDANDO_RETORNO: "#F97316",
  CONCLUIDA: "#10B981",
  CANCELADA: "#EF4444",
};

function AnimatedNumber({ target, decimals = 0 }: { target: number; decimals?: number }) {
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
        setValue(current);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{decimals > 0 ? value.toFixed(decimals) : Math.floor(value)}</>;
}

export default function DemandAnalytics() {
  const [analytics, setAnalytics] = useState<DemandAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch(`/api/analytics/demands?period=${period}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching demand analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const completionRate =
    analytics.totalDemands > 0
      ? (analytics.demandsByStatus.find((s) => s.status === "CONCLUIDA")?.count ?? 0) /
        analytics.totalDemands *
        100
      : 0;

  const statusChartData = analytics.demandsByStatus.map((s) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || "#6B7280",
  }));

  const priorityChartData = analytics.demandsByPriority.map((p) => ({
    name: p.priority,
    value: p.count,
  }));

  const summaryCards = [
    {
      label: "Total de Demandas",
      value: analytics.totalDemands,
      icon: BarChart3,
      color: "from-blue-500 to-blue-700",
      decimals: 0,
    },
    {
      label: "Taxa de Conclusão",
      value: completionRate,
      icon: CheckCircle2,
      color: "from-emerald-500 to-emerald-700",
      decimals: 1,
      suffix: "%",
    },
    {
      label: "Tempo Médio (dias)",
      value: analytics.avgResolutionDays,
      icon: Clock,
      color: "from-amber-500 to-amber-700",
      decimals: 1,
    },
    {
      label: `Concluídas (${period}d)`,
      value: analytics.demandsCompletedInPeriod,
      icon: TrendingUp,
      color: "from-purple-500 to-purple-700",
      decimals: 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Análise de Demandas</h2>
          <p className="text-gray-500 text-sm mt-1">Estatísticas e insights sobre demandas</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  <AnimatedNumber target={card.value} decimals={card.decimals} />
                  {card.suffix}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
              >
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Prefeituras */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-800">
              Prefeituras com Mais Solicitações
            </h3>
          </div>

          {analytics.topPrefectures.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma demanda registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.topPrefectures.slice(0, 5).map((item, idx) => (
                <div
                  key={item.prefecture.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {item.prefecture.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.prefecture.city}/{item.prefecture.state}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-500">demandas</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Distribuição por Status
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Completion Rate by Priority */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Taxa de Conclusão por Prioridade
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={analytics.completionRateByPriority}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]} fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Resolvers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Top Colaboradores (Resoluções)
          </h3>
          {analytics.topResolvers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma resolução no período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.topResolvers.map((item, idx) => (
                <div
                  key={item.user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.user.name}</p>
                      <p className="text-xs text-gray-500">{item.user.email}</p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{item.count}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Public vs Internal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-base font-semibold text-gray-800 mb-4">Tipo de Submissão</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-600 font-medium">Demandas Públicas</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{analytics.publicDemands}</p>
            <p className="text-xs text-blue-500 mt-1">
              {analytics.totalDemands > 0
                ? ((analytics.publicDemands / analytics.totalDemands) * 100).toFixed(1)
                : 0}
              % do total
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-sm text-emerald-600 font-medium">Demandas Internas</p>
            <p className="text-3xl font-bold text-emerald-700 mt-2">{analytics.internalDemands}</p>
            <p className="text-xs text-emerald-500 mt-1">
              {analytics.totalDemands > 0
                ? ((analytics.internalDemands / analytics.totalDemands) * 100).toFixed(1)
                : 0}
              % do total
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
