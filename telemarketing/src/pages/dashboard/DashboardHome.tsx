import { useEffect, useState } from 'react';
import { getDashboard, type TeleDashboard } from '../../services/teleService';
import { motion } from 'framer-motion';
import {
  Users, Calendar, TrendingUp, UserCheck, Clock,
  ArrowUpRight, Phone, Video, MessageCircle
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  TELECONFERENCE_QUEUED: 'Antrian Telekonferensi',
  MEETING_SCHEDULED: 'Meeting Dijadwalkan',
  MEETING_COMPLETED: 'Meeting Selesai',
  ACCOUNT_CREATED: 'Akun Dibuat',
  DATA_INPUT: 'Input Data',
  AGREEMENT_SIGNED: 'Kontrak Ditandatangani',
  INVOICE_SENT: 'Invoice Terkirim',
  PAID: 'Dibayar',
  EXPIRED: 'Kadaluarsa',
};

const MEETING_ICONS: Record<string, typeof Video> = {
  ZOOM: Video,
  GMEET: Video,
  WHATSAPP: Phone,
};

export default function DashboardHome() {
  const [data, setData] = useState<TeleDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
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

  const stats = [
    {
      label: 'Total Assigned',
      value: data?.total_assigned || 0,
      icon: Users,
      gradient: 'bg-gradient-card',
      color: 'text-brand-700',
    },
    {
      label: 'Form Pending',
      value: data?.pending_forms || 0,
      icon: Clock,
      gradient: 'bg-gradient-amber',
      color: 'text-amber-600',
    },
    {
      label: 'Meeting Hari Ini',
      value: data?.today_meetings?.length || 0,
      icon: Calendar,
      gradient: 'bg-gradient-emerald',
      color: 'text-emerald-600',
    },
    {
      label: 'Client Aktif',
      value: data?.active_clients || 0,
      icon: UserCheck,
      gradient: 'bg-gradient-card',
      color: 'text-brand-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Dashboard</h1>
        <p className="text-dark-500 text-sm mt-1">Overview aktivitas telemarketing Anda</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -4 }}
            className={`stat-card ${stat.gradient} hover:shadow-lg transition-all duration-300`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-500 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                <p className={`text-3xl font-extrabold mt-1.5 tracking-tight ${stat.color}`}>{stat.value}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-brand-500/10 shadow-sm shadow-brand-900/[0.01]">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Meetings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5 border-b border-dark-100 pb-3">
            <h3 className="text-sm font-bold text-brand-950 flex items-center gap-2 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-brand-600" />
              Meeting Hari Ini
            </h3>
            <span className="text-xs text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-500/10 font-bold">{data?.today_meetings?.length || 0} Meeting</span>
          </div>

          {data?.today_meetings && data.today_meetings.length > 0 ? (
            <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {data.today_meetings.map((meeting) => {
                const Icon = MEETING_ICONS[meeting.meeting_type] || MessageCircle;
                return (
                  <div
                    key={meeting.id}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-dark-100 hover:border-brand-500/25 transition-all shadow-sm duration-200"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 border border-brand-100/30">
                      <Icon className="w-5 h-5 text-brand-650" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-dark-900 truncate">
                        {meeting.tele_form?.name || 'Client'}
                      </p>
                      <p className="text-xs text-dark-500 font-semibold mt-0.5">
                        {new Date(meeting.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {meeting.duration} menit
                      </p>
                    </div>
                    {meeting.meeting_link && (
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-all active:scale-95 shadow-sm"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-dark-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
              <Calendar className="w-8 h-8 text-dark-300" />
              Tidak ada meeting hari ini
            </div>
          )}
        </motion.div>

        {/* Recent Forms */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5 border-b border-dark-100 pb-3">
            <h3 className="text-sm font-bold text-brand-950 flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Form Terbaru
            </h3>
          </div>

          {data?.recent_forms && data.recent_forms.length > 0 ? (
            <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {data.recent_forms.slice(0, 5).map((form) => (
                <div
                  key={form.id}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-dark-100 shadow-sm hover:border-brand-500/15 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 border border-brand-100/30">
                    <span className="text-sm font-bold text-brand-700">
                      {form.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-dark-900 truncate">{form.name}</p>
                    <p className="text-xs text-dark-500 font-semibold mt-0.5">{form.business_type} · {form.email}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                    form.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                    form.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border border-rose-250' :
                    'bg-brand-50 text-brand-700 border border-brand-100/60'
                  }`}>
                    {STATUS_LABELS[form.status] || form.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-dark-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
              <TrendingUp className="w-8 h-8 text-dark-300" />
              Belum ada form yang masuk
            </div>
          )}
        </motion.div>
      </div>

      {/* Status Distribution */}
      {data?.status_counts && Object.keys(data.status_counts).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-bold text-brand-950 mb-5 border-b border-dark-100 pb-3 uppercase tracking-wider">Distribusi Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {Object.entries(data.status_counts).map(([status, count]) => (
              <div key={status} className="p-4 rounded-2xl bg-white border border-dark-100 shadow-sm text-center hover:border-brand-500/10 transition-colors">
                <p className="text-2xl font-extrabold text-brand-900">{count}</p>
                <p className="text-[10px] text-dark-400 font-bold mt-1.5 uppercase tracking-widest">{STATUS_LABELS[status] || status}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
