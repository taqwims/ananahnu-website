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
        <div className="w-8 h-8 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Assigned',
      value: data?.total_assigned || 0,
      icon: Users,
      gradient: 'bg-gradient-card',
      color: 'text-primary-400',
    },
    {
      label: 'Form Pending',
      value: data?.pending_forms || 0,
      icon: Clock,
      gradient: 'bg-gradient-amber',
      color: 'text-amber-400',
    },
    {
      label: 'Meeting Hari Ini',
      value: data?.today_meetings?.length || 0,
      icon: Calendar,
      gradient: 'bg-gradient-emerald',
      color: 'text-emerald-400',
    },
    {
      label: 'Client Aktif',
      value: data?.active_clients || 0,
      icon: UserCheck,
      gradient: 'bg-gradient-card',
      color: 'text-primary-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 text-sm mt-1">Overview aktivitas telemarketing Anda</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`stat-card ${stat.gradient}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.gradient} border border-dark-600/30`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Meetings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-400" />
              Meeting Hari Ini
            </h3>
            <span className="text-xs text-dark-400">{data?.today_meetings?.length || 0} meeting</span>
          </div>

          {data?.today_meetings && data.today_meetings.length > 0 ? (
            <div className="space-y-3">
              {data.today_meetings.map((meeting) => {
                const Icon = MEETING_ICONS[meeting.meeting_type] || MessageCircle;
                return (
                  <div
                    key={meeting.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/40 border border-dark-700/30 hover:border-primary-500/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {meeting.tele_form?.name || 'Client'}
                      </p>
                      <p className="text-xs text-dark-400">
                        {new Date(meeting.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {meeting.duration} menit
                      </p>
                    </div>
                    {meeting.meeting_link && (
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-500 text-sm">
              Tidak ada meeting hari ini
            </div>
          )}
        </motion.div>

        {/* Recent Forms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Form Terbaru
            </h3>
          </div>

          {data?.recent_forms && data.recent_forms.length > 0 ? (
            <div className="space-y-3">
              {data.recent_forms.slice(0, 5).map((form) => (
                <div
                  key={form.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/40 border border-dark-700/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-400">
                      {form.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{form.name}</p>
                    <p className="text-xs text-dark-400">{form.business_type} · {form.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                    form.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                    form.status === 'EXPIRED' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-primary-500/20 text-primary-400'
                  }`}>
                    {STATUS_LABELS[form.status] || form.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-500 text-sm">
              Belum ada form yang masuk
            </div>
          )}
        </motion.div>
      </div>

      {/* Status Distribution */}
      {data?.status_counts && Object.keys(data.status_counts).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-base font-semibold text-white mb-4">Distribusi Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(data.status_counts).map(([status, count]) => (
              <div key={status} className="p-3 rounded-xl bg-dark-800/40 border border-dark-700/30 text-center">
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-[10px] text-dark-400 mt-1">{STATUS_LABELS[status] || status}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
