import { useEffect, useState } from 'react';
import { getMyMeetings, getMyForms, scheduleMeeting, updateMeeting, type TeleMeeting, type TeleForm } from '../../services/teleService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, Clock, Video, Phone, MessageCircle,
  CheckCircle2, XCircle, AlertCircle, ArrowUpRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const MEETING_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-500/20 text-blue-400',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400',
  CANCELLED: 'bg-dark-600/50 text-dark-400',
  NO_SHOW: 'bg-rose-500/20 text-rose-400',
};

const TYPE_ICONS: Record<string, typeof Video> = {
  ZOOM: Video,
  GMEET: Video,
  WHATSAPP: Phone,
};

export default function MeetingSchedule() {
  const [meetings, setMeetings] = useState<TeleMeeting[]>([]);
  const [forms, setForms] = useState<TeleForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    tele_form_id: '',
    scheduled_at: '',
    duration: 30,
    meeting_type: 'ZOOM',
    meeting_link: '',
    notes: '',
  });

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await getMyMeetings({ page: 1, limit: 50 });
      setMeetings(res.data.data || []);
    } catch {
      toast.error('Gagal memuat meeting');
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      const res = await getMyForms({ page: 1, limit: 100, status: 'TELECONFERENCE_QUEUED' });
      setForms(res.data.data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchForms();
  }, []);

  const handleSchedule = async () => {
    if (!newMeeting.tele_form_id || !newMeeting.scheduled_at) {
      toast.error('Form dan waktu harus diisi');
      return;
    }
    try {
      await scheduleMeeting({
        ...newMeeting,
        scheduled_at: new Date(newMeeting.scheduled_at).toISOString(),
      });
      toast.success('Meeting dijadwalkan & notifikasi WA terkirim');
      setShowModal(false);
      setNewMeeting({ tele_form_id: '', scheduled_at: '', duration: 30, meeting_type: 'ZOOM', meeting_link: '', notes: '' });
      fetchMeetings();
      fetchForms();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Gagal';
      toast.error(message);
    }
  };

  const handleStatusUpdate = async (meetingId: string, status: string) => {
    try {
      await updateMeeting(meetingId, { status });
      toast.success('Status meeting diperbarui');
      fetchMeetings();
    } catch {
      toast.error('Gagal memperbarui');
    }
  };

  // Group meetings by date
  const groupedMeetings: Record<string, TeleMeeting[]> = {};
  meetings.forEach((m) => {
    const date = new Date(m.scheduled_at).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!groupedMeetings[date]) groupedMeetings[date] = [];
    groupedMeetings[date].push(m);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-400" /> Jadwal Meeting
          </h1>
          <p className="text-dark-400 text-sm mt-1">Kelola penjadwalan teleconference dengan client</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Jadwalkan
        </button>
      </div>

      {/* Meeting List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : Object.keys(groupedMeetings).length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Calendar className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">Belum ada meeting terjadwal</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMeetings).map(([date, dateMeetings]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-dark-400 mb-3">{date}</h3>
              <div className="space-y-3">
                {dateMeetings.map((meeting, i) => {
                  const Icon = TYPE_ICONS[meeting.meeting_type] || MessageCircle;
                  return (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card p-4 flex items-center gap-4"
                    >
                      {/* Time */}
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold text-white">
                          {new Date(meeting.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-dark-400">{meeting.duration} min</p>
                      </div>

                      <div className="w-px h-12 bg-dark-700/50" />

                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{meeting.tele_form?.name || 'Client'}</p>
                        <p className="text-xs text-dark-400">{meeting.meeting_type} · {meeting.tele_form?.phone}</p>
                        {meeting.notes && <p className="text-xs text-dark-500 mt-1">{meeting.notes}</p>}
                      </div>

                      {/* Status */}
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${MEETING_STATUS_COLORS[meeting.status]}`}>
                        {meeting.status}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {meeting.meeting_link && (
                          <a
                            href={meeting.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
                            title="Join Meeting"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </a>
                        )}
                        {meeting.status === 'SCHEDULED' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(meeting.id, 'COMPLETED')}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Selesai"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(meeting.id, 'NO_SHOW')}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="No Show"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(meeting.id, 'CANCELLED')}
                              className="p-1.5 rounded-lg text-dark-400 hover:bg-dark-700 transition-colors"
                              title="Batal"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white">Jadwalkan Meeting</h3>
                <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Client</label>
                  <select
                    className="form-select"
                    value={newMeeting.tele_form_id}
                    onChange={(e) => setNewMeeting({ ...newMeeting, tele_form_id: e.target.value })}
                  >
                    <option value="">Pilih client</option>
                    {forms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} - {f.phone}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Waktu</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={newMeeting.scheduled_at}
                    onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_at: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Tipe</label>
                    <select
                      className="form-select"
                      value={newMeeting.meeting_type}
                      onChange={(e) => setNewMeeting({ ...newMeeting, meeting_type: e.target.value })}
                    >
                      <option value="ZOOM">Zoom</option>
                      <option value="GMEET">Google Meet</option>
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Durasi (menit)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newMeeting.duration}
                      onChange={(e) => setNewMeeting({ ...newMeeting, duration: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Link Meeting</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://zoom.us/j/..."
                    value={newMeeting.meeting_link}
                    onChange={(e) => setNewMeeting({ ...newMeeting, meeting_link: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Catatan</label>
                  <textarea
                    className="form-input min-h-[80px] resize-none"
                    placeholder="Catatan tambahan..."
                    value={newMeeting.notes}
                    onChange={(e) => setNewMeeting({ ...newMeeting, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Batal
                  </button>
                  <button onClick={handleSchedule} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" /> Jadwalkan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
