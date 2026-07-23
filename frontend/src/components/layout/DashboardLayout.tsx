import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const updateUser = useAuthStore(state => state.updateUser);

    useEffect(() => {
        // Sync profil & role terbaru dari backend ke authStore
        userService.getProfile().then(profile => {
            if (profile && profile.role) {
                updateUser({
                    full_name: profile.full_name,
                    email: profile.email,
                    phone: profile.phone,
                    address: profile.address,
                    role: profile.role,
                    avatar_url: profile.avatar_url,
                    leader_id: profile.leader?.id || profile.leader_id
                });
            }
        }).catch(err => {
            console.error("Gagal sinkronisasi profil user:", err);
        });
    }, [updateUser]);

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100">
            <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
