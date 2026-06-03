import { useEffect, useState } from 'react';
import { getAnalytics, type TeleAnalytics } from '../../services/teleService';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, CreditCard, Percent,
  ArrowDown, FileText, UserCheck, FileCheck, Receipt
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis, YAxis, CartesianGrid,
  Tooltip, AreaChart, Area
} from 'recharts';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<TeleAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-dark-500">
        Gagal memuat data analytics
      </div>
    );
  }

  const summaryCards = [
    { label: 'Total Form', value: analytics.total_forms, icon: FileText, color: 'text-brand-700', bg: 'bg-gradient-card' },
    { label: 'Akun Dibuat', value: analytics.total_account_created, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-gradient-emerald' },
    { label: 'Dibayar', value: analytics.total_paid, icon: CreditCard, color: 'text-amber-600', bg: 'bg-gradient-amber' },
    { label: 'Conversion', value: `${analytics.conversion_rate.toFixed(1)}%`, icon: Percent, color: 'text-brand-700', bg: 'bg-gradient-card' },
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div className="glass p-3 !rounded-lg text-xs border border-brand-500/10 shadow-md">
        <p className="text-dark-700 font-bold mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-600" /> Analytics
        </h1>
        <p className="text-dark-500 text-sm mt-1">Data konversi dan performa telemarketing</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`stat-card ${card.bg}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-500 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
                <p className={`text-3xl font-extrabold mt-2 ${card.color}`}>{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bg} border border-brand-500/10`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-base font-bold text-brand-900 mb-4 flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-brand-600" /> Conversion Funnel
          </h3>

          <div className="space-y-3">
            {analytics.funnel_data.map((step, i) => {
              const maxCount = analytics.funnel_data[0]?.count || 1;
              const percentage = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
              const icons = [FileText, Users, UserCheck, FileCheck, Receipt, CreditCard];
              const Icon = icons[i] || FileText;

              return (
                <div key={step.step} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-dark-500 group-hover:text-brand-600 transition-colors" />
                      <span className="text-sm text-dark-700 font-medium">{step.step}</span>
                    </div>
                    <span className="text-sm font-bold text-dark-900">{step.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-dark-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                    />
                  </div>
                  {i > 0 && maxCount > 0 && (
                    <p className="text-[10px] text-dark-500 mt-0.5">
                      {percentage.toFixed(1)}% dari total form
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Route Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="text-base font-bold text-brand-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Distribusi Routing
          </h3>

          <div className="flex items-center gap-8 justify-center py-8">
            {/* Teleconference */}
            <div className="text-center">
              <div className="w-28 h-28 rounded-full border-[6px] border-brand-100 flex items-center justify-center mx-auto relative">
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-700">{analytics.total_teleconference}</p>
                  <p className="text-[10px] text-dark-500 font-bold uppercase">form</p>
                </div>
                <svg className="absolute inset-0" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#004033"
                    strokeWidth="2"
                    strokeDasharray={`${analytics.total_forms > 0 ? (analytics.total_teleconference / analytics.total_forms) * 100 : 0}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-sm text-dark-800 mt-3 font-bold">Teleconference</p>
              <p className="text-[10px] text-dark-500 font-bold uppercase">Reguler</p>
            </div>

            {/* Self Declare */}
            <div className="text-center">
              <div className="w-28 h-28 rounded-full border-[6px] border-amber-100 flex items-center justify-center mx-auto relative">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{analytics.total_self_declare}</p>
                  <p className="text-[10px] text-dark-500 font-bold uppercase">form</p>
                </div>
                <svg className="absolute inset-0" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#c0a060"
                    strokeWidth="2"
                    strokeDasharray={`${analytics.total_forms > 0 ? (analytics.total_self_declare / analytics.total_forms) * 100 : 0}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-sm text-dark-800 mt-3 font-bold">Self Declare</p>
              <p className="text-[10px] text-dark-500 font-bold uppercase">Mandiri</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monthly Trend */}
      {analytics.monthly_trend && analytics.monthly_trend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-base font-bold text-brand-900 mb-4">Tren Bulanan</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthly_trend}>
                <defs>
                  <linearGradient id="formGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004033" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#004033" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,64,51,0.06)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="forms_received"
                  name="Form Masuk"
                  stroke="#004033"
                  fill="url(#formGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="accounts_created"
                  name="Akun Dibuat"
                  stroke="#c0a060"
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Area
                  type="monotone"
                  dataKey="paid"
                  name="Dibayar"
                  stroke="#10b981"
                  fill="url(#paidGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-600" />
              <span className="text-xs text-dark-500 font-semibold">Form Masuk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gold-500" />
              <span className="text-xs text-dark-500 font-semibold">Akun Dibuat</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-dark-500 font-semibold">Dibayar</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
