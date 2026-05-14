import { Loader2, BarChart3 } from 'lucide-react';
import { useDrafterMonitoring } from '../../hooks/useDrafterMonitoring';
import { DrafterStatsHeader } from '../../components/dashboard/monitoring/DrafterStatsHeader';
import { DrafterMonitoringControls } from '../../components/dashboard/monitoring/DrafterMonitoringControls';
import { DrafterPerformanceCard } from '../../components/dashboard/monitoring/DrafterPerformanceCard';
import { useNavigate } from 'react-router-dom';

export default function DrafterMonitoring() {
    const {
        loading, search, setSearch,
        activeTab, setActiveTab,
        serviceFilter, setServiceFilter,
        expandedDrafters, toggleDrafter,
        stats, groupedByDrafter
    } = useDrafterMonitoring();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                <p className="text-gray-500 font-medium">Menghubungkan ke pemantauan...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <DrafterStatsHeader stats={stats} />

            <DrafterMonitoringControls 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                stats={stats}
                search={search}
                setSearch={setSearch}
                serviceFilter={serviceFilter}
                setServiceFilter={setServiceFilter}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {groupedByDrafter.length === 0 ? (
                    <div className="lg:col-span-2 glass-panel p-20 text-center text-gray-400">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p className="text-lg font-medium italic">Tidak ada data pengerjaan yang sesuai dengan filter</p>
                    </div>
                ) : (
                    groupedByDrafter.map((group, gIdx) => (
                        <DrafterPerformanceCard 
                            key={group.drafterID}
                            group={group}
                            isExpanded={expandedDrafters[group.drafterID]}
                            onToggle={() => toggleDrafter(group.drafterID)}
                            onNavigateSubmission={(id) => navigate(`/dashboard/submissions/${id}`)}
                            index={gIdx}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
