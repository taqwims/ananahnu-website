import { useState, useEffect, useRef } from 'react';
import { Bell, Loader2, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data || []);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch initially to get the unread count
        fetchNotifications();
        
        // Optional: Polling every 30 seconds
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notif: any) => {
        setIsOpen(false);
        
        // Mark as read if unread
        if (!notif.is_read) {
            try {
                await api.put(`/notifications/${notif.id}/read`);
                // Update local state
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (err) {
                console.error("Failed to mark as read", err);
            }
        }

        // Navigate based on related entity
        if (notif.related_entity_id) {
            navigate(`/dashboard/submissions/${notif.related_entity_id}`);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 relative hover:bg-white/50 rounded-full text-gray-600 transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-panel bg-white/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-sm">Notifikasi</h3>
                        {unreadCount > 0 && <span className="text-[10px] bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} Baru</span>}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-500 w-5 h-5" /></div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Tidak ada notifikasi baru</div>
                        ) : (
                            notifications.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`w-full text-left p-4 hover:bg-brand-50 border-b border-gray-50 last:border-0 transition-colors flex gap-3 ${!notif.is_read ? 'bg-brand-50/30' : ''}`}
                                >
                                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.is_read ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {notif.title === 'Tagihan Baru' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold text-gray-800 truncate ${!notif.is_read ? 'text-brand-700' : ''}`}>{notif.title}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                        <button className="text-[11px] font-bold text-brand-600 hover:underline">Tandai Semua Sudah Baca</button>
                    </div>
                </div>
            )}
        </div>
    );
}
