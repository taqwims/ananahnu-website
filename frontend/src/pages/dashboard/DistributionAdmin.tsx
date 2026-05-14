import { Loader2, FileText } from 'lucide-react';
import { useDistributionAdmin } from '../../hooks/useDistributionAdmin';
import { DistributionHeader } from '../../components/dashboard/distribution/DistributionHeader';
import { DistributionControls } from '../../components/dashboard/distribution/DistributionControls';
import { DistributionGroup } from '../../components/dashboard/distribution/DistributionGroup';

export default function DistributionAdmin() {
    const {
        drafters, loading, search, setSearch,
        selectedIDs, setSelectedIDs, selectedDrafter, setSelectedDrafter,
        assigning, handleBulkAssign, toggleSelection,
        groupedData, stats
    } = useDistributionAdmin();

    const handleToggleGroup = (ids: string[], isAllSelected: boolean) => {
        if (isAllSelected) {
            setSelectedIDs(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setSelectedIDs(prev => Array.from(new Set([...prev, ...ids])));
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                <p className="text-gray-500 font-medium animate-pulse">Menyiapkan data distribusi...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <DistributionHeader stats={stats} />

            <DistributionControls 
                search={search}
                setSearch={setSearch}
                selectedIDs={selectedIDs}
                selectedDrafter={selectedDrafter}
                setSelectedDrafter={setSelectedDrafter}
                drafters={drafters}
                onAssign={handleBulkAssign}
                assigning={assigning}
            />

            <div className="space-y-10">
                {groupedData.length === 0 ? (
                    <div className="glass-panel p-20 text-center text-gray-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p className="text-lg font-medium">Tidak ada data yang cocok</p>
                    </div>
                ) : (
                    groupedData.map((group, gIdx) => (
                        <DistributionGroup 
                            key={group.coordinator}
                            group={group}
                            selectedIDs={selectedIDs}
                            onToggleSelection={toggleSelection}
                            onToggleGroup={handleToggleGroup}
                            index={gIdx}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
