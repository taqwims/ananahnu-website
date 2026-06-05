import { useEffect, useState } from 'react';
import { getMyMeetings, getMyForms, scheduleMeeting, updateMeeting, deleteMeeting, type TeleMeeting, type TeleForm } from '../../services/teleService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Plus, Clock, Video, Phone, MessageCircle,
  CheckCircle2, XCircle, AlertCircle, ArrowUpRight, X, ArrowLeft, ArrowRight, List,
  Trash2, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const MEETING_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  CANCELLED: 'bg-dark-50 text-dark-400 border border-dark-100',
  NO_SHOW: 'bg-rose-50 text-rose-700 border border-rose-100',
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

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [modalTab, setModalTab] = useState<'initial' | 'followup'>('initial');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDate(today);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const getMeetingsForDate = (d: Date) => {
    return meetings.filter((m) => {
      const mDate = new Date(m.scheduled_at);
      return isSameDay(mDate, d);
    });
  };

  const getDaysInMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0-6 (Sun-Sat)
    // Adjust for Monday start: Sun (0) becomes 6, Mon (1) becomes 0, etc.
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const totalDaysPrev = new Date(year, month, 0).getDate();

    const grid = [];

    // Previous month's trailing days
    for (let i = startOffset - 1; i >= 0; i--) {
      grid.push({
        day: totalDaysPrev - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, totalDaysPrev - i),
      });
    }

    // Current month's days
    for (let i = 1; i <= totalDays; i++) {
      grid.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Next month's leading days to complete grid (42 days)
    const remainingSlots = 42 - grid.length;
    for (let i = 1; i <= remainingSlots; i++) {
      grid.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return grid;
  };

  const openScheduleModalForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setNewMeeting({
      ...newMeeting,
      scheduled_at: `${year}-${month}-${day}T09:00`,
    });
    setShowModal(true);
  };

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
      const res = await getMyForms({ page: 1, limit: 150 });
      setForms(res.data.data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchForms();
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingMeetingId(null);
    setModalTab('initial');
    setNewMeeting({
      tele_form_id: '',
      scheduled_at: '',
      duration: 30,
      meeting_type: 'ZOOM',
      meeting_link: '',
      notes: '',
    });
  };

  const handleSchedule = async () => {
    if (!newMeeting.tele_form_id || !newMeeting.scheduled_at) {
      toast.error('Form dan waktu harus diisi');
      return;
    }
    try {
      if (isEditMode && editingMeetingId) {
        await updateMeeting(editingMeetingId, {
          ...newMeeting,
          scheduled_at: new Date(newMeeting.scheduled_at).toISOString(),
        });
        toast.success('Jadwal meeting berhasil diperbarui');
      } else {
        await scheduleMeeting({
          ...newMeeting,
          scheduled_at: new Date(newMeeting.scheduled_at).toISOString(),
        });
        toast.success('Meeting dijadwalkan & notifikasi WA terkirim');
      }
      handleCloseModal();
      fetchMeetings();
      fetchForms();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Gagal';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal meeting ini? Status client akan dikembalikan ke antrian.')) {
      try {
        await deleteMeeting(id);
        toast.success('Jadwal meeting berhasil dihapus');
        fetchMeetings();
        fetchForms();
      } catch {
        toast.error('Gagal menghapus meeting');
      }
    }
  };

  const handleEditOpen = (meeting: TeleMeeting) => {
    // Convert to datetime-local format: YYYY-MM-DDThh:mm
    const dateObj = new Date(meeting.scheduled_at);
    // Adjust timezone offset to local ISO string
    const offsetMs = dateObj.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(dateObj.getTime() - offsetMs);
    const localISOTime = localDate.toISOString().slice(0, 16);

    setNewMeeting({
      tele_form_id: meeting.tele_form_id,
      scheduled_at: localISOTime,
      duration: meeting.duration,
      meeting_type: meeting.meeting_type,
      meeting_link: meeting.meeting_link || '',
      notes: meeting.notes || '',
    });
    setEditingMeetingId(meeting.id);
    setIsEditMode(true);
    setShowModal(true);
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

  const getFilteredFormsForModal = () => {
    if (isEditMode) {
      return forms;
    }
    if (modalTab === 'initial') {
      return forms.filter((f) => f.status === 'TELECONFERENCE_QUEUED');
    }
    return forms.filter(
      (f) => f.status !== 'TELECONFERENCE_QUEUED' && f.status !== 'PENDING' && f.status !== 'DELETED'
    );
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-brand-600" /> Jadwal Meeting
          </h1>
          <p className="text-dark-500 text-sm mt-1">Kelola penjadwalan teleconference dengan client</p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Toggle View Mode */}
          <div className="flex items-center rounded-xl bg-dark-100 p-1 border border-dark-200 shadow-inner">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-dark-500 hover:text-dark-800'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Kalender
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-dark-500 hover:text-dark-800'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Daftar
            </button>
          </div>

          <button
            onClick={() => openScheduleModalForDate(selectedDate)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Jadwalkan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white/40 rounded-2xl border border-dark-200/50">
          <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : viewMode === 'calendar' ? (
        /* Calendar Mode Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid Container */}
          <div className="lg:col-span-8 space-y-4">
            {/* Month Navigation Banner */}
            <div className="flex items-center justify-between bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl text-dark-500 hover:bg-dark-100 hover:text-dark-800 transition-colors cursor-pointer"
                  title="Bulan Sebelumnya"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-bold text-brand-900 min-w-[140px] text-center capitalize">
                  {MONTH_NAMES[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl text-dark-500 hover:bg-dark-100 hover:text-dark-800 transition-colors cursor-pointer"
                  title="Bulan Berikutnya"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleGoToToday}
                className="px-3.5 py-1.5 rounded-xl border border-dark-200 text-dark-700 text-xs font-bold hover:bg-dark-50 transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
            </div>

            {/* Grid Sheet */}
            <div className="glass-card p-5 shadow-sm overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-7 gap-1.5 mb-2">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="text-center py-2 text-xs font-extrabold text-brand-900 uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {getDaysInMonthGrid(currentMonthDate).map(({ day, isCurrentMonth, date: cellDate }, idx) => {
                    const dayMeetings = getMeetingsForDate(cellDate);
                    const isSelected = isSameDay(cellDate, selectedDate);
                    const isToday = isSameDay(cellDate, new Date());

                    // Build cell classes
                    let cellClass = "min-h-[85px] p-2 flex flex-col justify-between border transition-all duration-200 relative select-none cursor-pointer rounded-xl ";
                    if (isSelected) {
                      cellClass += "bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-600/20 z-10 scale-[1.01]";
                    } else if (isToday) {
                      cellClass += "bg-gold-50 border-gold-300 text-dark-900 hover:bg-gold-100 hover:border-gold-400";
                    } else if (isCurrentMonth) {
                      cellClass += "bg-white border-dark-100 text-dark-900 hover:border-brand-500/20 hover:bg-brand-50/10";
                    } else {
                      cellClass += "bg-dark-50/30 border-dark-100/50 text-dark-400 opacity-40 hover:opacity-75";
                    }

                    return (
                      <div
                        key={idx}
                        className={cellClass}
                        onClick={() => setSelectedDate(cellDate)}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : isToday ? 'text-gold-700' : 'text-dark-800'}`}>
                            {day}
                          </span>
                          {dayMeetings.length > 0 && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-white text-brand-800' : 'bg-brand-100 text-brand-800'
                            }`}>
                              {dayMeetings.length}
                            </span>
                          )}
                        </div>

                        {/* Status dots */}
                        <div className="flex flex-wrap gap-0.5 mt-1.5">
                          {dayMeetings.slice(0, 3).map((meeting) => (
                            <div
                              key={meeting.id}
                              className={`w-1.5 h-1.5 rounded-full ${
                                meeting.status === 'COMPLETED'
                                  ? 'bg-emerald-500'
                                  : meeting.status === 'CANCELLED'
                                  ? 'bg-dark-400'
                                  : meeting.status === 'NO_SHOW'
                                  ? 'bg-rose-500'
                                  : 'bg-blue-500'
                              }`}
                              title={`${meeting.tele_form?.name || 'Client'} - ${meeting.status}`}
                            />
                          ))}
                          {dayMeetings.length > 3 && (
                            <span className={`text-[8px] leading-none font-bold ${isSelected ? 'text-white/80' : 'text-dark-450'}`}>
                              +
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Details Sidebar Pane */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-card p-5 flex flex-col min-h-[460px] h-full shadow-sm bg-white">
              <div className="border-b border-dark-100 pb-3.5 mb-4">
                <h3 className="text-sm font-extrabold text-brand-900 uppercase tracking-wider">
                  Detail Meeting
                </h3>
                <p className="text-xs text-dark-500 font-semibold mt-1">
                  {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 max-h-[450px]">
                {getMeetingsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-3">
                      <CalendarIcon className="w-6 h-6 text-brand-500" />
                    </div>
                    <p className="text-xs text-dark-500 font-bold">Tidak ada meeting terjadwal</p>
                    <button
                      onClick={() => openScheduleModalForDate(selectedDate)}
                      className="mt-4 px-4 py-2 bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 hover:text-brand-800 transition-colors rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Jadwalkan Baru
                    </button>
                  </div>
                ) : (
                  getMeetingsForDate(selectedDate).map((meeting) => {
                    const Icon = TYPE_ICONS[meeting.meeting_type] || MessageCircle;
                    return (
                      <div
                        key={meeting.id}
                        className="p-3.5 rounded-xl border border-dark-100 bg-white hover:border-brand-500/20 hover:shadow-sm transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-brand-700" />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-dark-900">
                                {new Date(meeting.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-[9px] text-dark-500 font-bold uppercase">{meeting.duration} Menit · {meeting.meeting_type}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${MEETING_STATUS_COLORS[meeting.status]}`}>
                            {meeting.status}
                          </span>
                        </div>

                        <div className="text-left">
                          <p className="text-xs font-extrabold text-dark-900">{meeting.tele_form?.name || 'Client'}</p>
                          <p className="text-[10px] text-dark-500 font-medium">{meeting.tele_form?.phone}</p>
                          {meeting.notes && (
                            <p className="text-[10px] text-dark-600 bg-dark-50 p-2 rounded-lg mt-2 border border-dark-100 italic">
                              "{meeting.notes}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-dark-100/50 pt-2.5">
                          {meeting.meeting_link && (
                            <a
                              href={meeting.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Join Meeting"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" /> Join
                            </a>
                          )}
                          <button
                            onClick={() => handleEditOpen(meeting)}
                            className="px-2.5 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Jadwal"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(meeting.id)}
                            className="px-2.5 py-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                          {meeting.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(meeting.id, 'COMPLETED')}
                                className="px-2.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Selesai"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(meeting.id, 'NO_SHOW')}
                                className="px-2.5 py-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="No Show"
                              >
                                <AlertCircle className="w-3.5 h-3.5" /> No Show
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(meeting.id, 'CANCELLED')}
                                className="px-2.5 py-1.5 rounded-lg text-dark-600 bg-dark-50 hover:bg-dark-100 border border-dark-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Batal"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Batal
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List Mode Layout */
        Object.keys(groupedMeetings).length === 0 ? (
          <div className="glass-card p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-dark-400 mx-auto mb-3" />
            <p className="text-dark-500 font-medium">Belum ada meeting terjadwal</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMeetings).map(([date, dateMeetings]) => (
              <div key={date}>
                <h3 className="text-sm font-bold text-brand-800 mb-3 uppercase tracking-wider">{date}</h3>
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
                          <p className="text-lg font-extrabold text-dark-900">
                            {new Date(meeting.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[10px] text-dark-500 font-bold uppercase tracking-wider">{meeting.duration} min</p>
                        </div>

                        <div className="w-px h-12 bg-dark-100" />

                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-brand-700" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-bold text-dark-900">{meeting.tele_form?.name || 'Client'}</p>
                          <p className="text-xs text-dark-500 font-medium">{meeting.meeting_type} · {meeting.tele_form?.phone}</p>
                          {meeting.notes && <p className="text-xs text-dark-600 mt-1 italic font-medium">{meeting.notes}</p>}
                        </div>

                        {/* Status */}
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${MEETING_STATUS_COLORS[meeting.status]}`}>
                          {meeting.status}
                        </span>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {meeting.meeting_link && (
                            <a
                              href={meeting.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Join Meeting"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" /> Join
                            </a>
                          )}
                          <button
                            onClick={() => handleEditOpen(meeting)}
                            className="px-2.5 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Jadwal"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(meeting.id)}
                            className="px-2.5 py-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                          {meeting.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(meeting.id, 'COMPLETED')}
                                className="px-2.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Selesai"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(meeting.id, 'NO_SHOW')}
                                className="px-2.5 py-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="No Show"
                              >
                                <AlertCircle className="w-3.5 h-3.5" /> No Show
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(meeting.id, 'CANCELLED')}
                                className="px-2.5 py-1.5 rounded-lg text-dark-600 bg-dark-50 hover:bg-dark-100 border border-dark-100/50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Batal"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Batal
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
        )
      )}

      {/* Schedule Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-brand-100 p-6 max-w-md w-full rounded-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-brand-900">
                  {isEditMode ? 'Edit Jadwal Meeting' : 'Jadwalkan Meeting'}
                </h3>
                <button onClick={handleCloseModal} className="text-dark-400 hover:text-brand-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isEditMode && (
                <div className="flex border-b border-dark-100 mb-4">
                  <button
                    onClick={() => {
                      setModalTab('initial');
                      setNewMeeting((prev) => ({ ...prev, tele_form_id: '' }));
                    }}
                    className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      modalTab === 'initial'
                        ? 'border-brand-600 text-brand-600'
                        : 'border-transparent text-dark-500 hover:text-dark-800'
                    }`}
                  >
                    Jadwal Awal
                  </button>
                  <button
                    onClick={() => {
                      setModalTab('followup');
                      setNewMeeting((prev) => ({ ...prev, tele_form_id: '' }));
                    }}
                    className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      modalTab === 'followup'
                        ? 'border-brand-600 text-brand-600'
                        : 'border-transparent text-dark-500 hover:text-dark-800'
                    }`}
                  >
                    Meeting Lanjutan
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {!isEditMode && modalTab === 'followup' && (
                  <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl text-[11px] text-brand-850 font-semibold mb-3">
                    Meeting lanjutan untuk client sudah mendapatkan jadwal
                  </div>
                )}

                <div>
                  <label className="form-label">Client</label>
                  <select
                    className="form-select"
                    value={newMeeting.tele_form_id}
                    onChange={(e) => setNewMeeting({ ...newMeeting, tele_form_id: e.target.value })}
                    disabled={isEditMode}
                  >
                    <option value="">Pilih client</option>
                    {getFilteredFormsForModal().map((f) => (
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
                  <button onClick={handleCloseModal} className="btn-secondary flex-1 cursor-pointer">
                    Batal
                  </button>
                  <button onClick={handleSchedule} className="btn-primary flex-1 flex items-center justify-center gap-2 cursor-pointer">
                    <Clock className="w-4 h-4" /> {isEditMode ? 'Simpan' : 'Jadwalkan'}
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
