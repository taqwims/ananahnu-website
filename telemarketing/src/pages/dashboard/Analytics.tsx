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
      <div className="flex items-center justify-center h-64 bg-white/40 rounded-2xl border border-dark-200/50">
        <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass-card p-12 text-center text-dark-500 border border-white/60">
        Gagal memuat data analytics
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Total Form',
      value: analytics.total_forms,
      icon: FileText,
      valueClass: 'bg-gradient-to-r from-brand-700 to-brand-900 bg-clip-text text-transparent',
      iconClass: 'text-brand-600',
      bg: 'bg-gradient-card border-brand-100/50'
    },
    {
      label: 'Akun Dibuat',
      value: analytics.total_account_created,
      icon: UserCheck,
      valueClass: 'bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent',
      iconClass: 'text-emerald-600',
      bg: 'bg-gradient-emerald border-emerald-100/50'
    },
    {
      label: 'Dibayar',
      value: analytics.total_paid,
      icon: CreditCard,
      valueClass: 'bg-gradient-to-r from-gold-600 to-gold-800 bg-clip-text text-transparent',
      iconClass: 'text-gold-600',
      bg: 'bg-gradient-amber border-gold-200/50'
    },
    {
      label: 'Conversion',
      value: `${analytics.conversion_rate.toFixed(1)}%`,
      icon: Percent,
      valueClass: 'bg-gradient-to-r from-brand-700 to-gold-600 bg-clip-text text-transparent',
      iconClass: 'text-brand-600',
      bg: 'bg-gradient-card border-brand-100/50'
    },
  ];

  // Custom tooltip component matching our premium design system
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div className="glass-card p-3.5 border border-brand-500/10 shadow-lg text-xs bg-white/95">
        <p className="text-dark-800 font-extrabold mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: entry.color }} />
              <p className="font-semibold text-dark-600">
                {entry.name}: <span className="text-dark-950 font-bold">{entry.value}</span>
              </p>
            </div>
          ))}
        </div>
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`stat-card ${card.bg} border`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-500 text-xs font-bold uppercase tracking-wider">{card.label}</p>
                <p className={`text-3xl font-black mt-2.5 ${card.valueClass}`}>{card.value}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-dark-100 shadow-2xs">
                <card.icon className={`w-5 h-5 ${card.iconClass}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 border border-white/60 shadow-md"
        >
          <h3 className="text-sm font-extrabold text-brand-900 mb-5 flex items-center gap-2 uppercase tracking-wider">
            <ArrowDown className="w-4 h-4 text-brand-600" /> Conversion Funnel
          </h3>

          <div className="space-y-4">
            {analytics.funnel_data.map((step, i) => {
              const maxCount = analytics.funnel_data[0]?.count || 1;
              const percentage = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
              const icons = [FileText, Users, UserCheck, FileCheck, Receipt, CreditCard];
              const Icon = icons[i] || FileText;

              return (
                <div key={step.step} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-dark-500 group-hover:text-brand-600 transition-colors" />
                      <span className="text-xs text-dark-750 font-bold">{step.step}</span>
                    </div>
                    <span className="text-xs font-black text-brand-950 bg-brand-50/50 border border-brand-100/60 px-2.5 py-0.5 rounded-full">{step.count}</span>
                  </div>
                  <div className="h-3 rounded-full bg-dark-100 overflow-hidden shadow-inner border border-dark-200/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.4 + i * 0.08, duration: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-700 via-brand-500 to-gold-450 shadow-sm"
                    />
                  </div>
                  {i > 0 && maxCount > 0 && (
                    <p className="text-[10px] text-dark-500 mt-1 font-semibold pl-6">
                      {percentage.toFixed(1)}% dari total form masuk
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Route Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 border border-white/60 shadow-md"
        >
          <h3 className="text-sm font-extrabold text-brand-900 mb-5 flex items-center gap-2 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Distribusi Routing
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-8 justify-center py-6">
            {/* Teleconference */}
            <div className="text-center space-y-3">
              <div className="w-28 h-28 rounded-full border border-dark-100 bg-white/50 backdrop-blur-xs flex items-center justify-center mx-auto relative shadow-sm hover:scale-102 transition-transform duration-300">
                <div className="text-center z-10">
                  <p className="text-2xl font-black text-brand-900 leading-none">{analytics.total_teleconference}</p>
                  <p className="text-[9px] text-dark-500 font-extrabold uppercase mt-1 tracking-wider">form</p>
                </div>
                <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                  <defs>
                    <linearGradient id="teleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#004033" />
                      <stop offset="100%" stopColor="#3b9b7a" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="rgba(0,64,51,0.05)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#teleGrad)"
                    strokeWidth="3"
                    strokeDasharray={`${analytics.total_forms > 0 ? (analytics.total_teleconference / analytics.total_forms) * 100 : 0}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-dark-900 font-extrabold">Teleconference</p>
                <p className="text-[10px] text-brand-600 font-bold uppercase tracking-widest">Reguler</p>
              </div>
            </div>

            {/* Self Declare */}
            <div className="text-center space-y-3">
              <div className="w-28 h-28 rounded-full border border-dark-100 bg-white/50 backdrop-blur-xs flex items-center justify-center mx-auto relative shadow-sm hover:scale-102 transition-transform duration-300">
                <div className="text-center z-10">
                  <p className="text-2xl font-black text-gold-700 leading-none">{analytics.total_self_declare}</p>
                  <p className="text-[9px] text-dark-500 font-extrabold uppercase mt-1 tracking-wider">form</p>
                </div>
                <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                  <defs>
                    <linearGradient id="selfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c0a060" />
                      <stop offset="100%" stopColor="#ebbd5e" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="rgba(192,160,96,0.05)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#selfGrad)"
                    strokeWidth="3"
                    strokeDasharray={`${analytics.total_forms > 0 ? (analytics.total_self_declare / analytics.total_forms) * 100 : 0}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-dark-900 font-extrabold">Self Declare</p>
                <p className="text-[10px] text-gold-600 font-bold uppercase tracking-widest">Mandiri</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monthly Trend */}
      {analytics.monthly_trend && analytics.monthly_trend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 border border-white/60 shadow-md"
        >
          <h3 className="text-sm font-extrabold text-brand-900 mb-5 uppercase tracking-wider">Tren Bulanan</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,64,51,0.05)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
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
          <div className="flex flex-wrap items-center justify-center gap-6 mt-5 pt-3 border-t border-dark-100/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-600 shadow-2xs" />
              <span className="text-xs text-dark-600 font-bold">Form Masuk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gold-500 shadow-2xs" />
              <span className="text-xs text-dark-600 font-bold">Akun Dibuat</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs" />
              <span className="text-xs text-dark-600 font-bold">Dibayar</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
