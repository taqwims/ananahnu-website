import { Shield, Search, Eye } from 'lucide-react';
import { useConsultantVerification } from '../../hooks/useConsultantVerification';
import { ConsultantList } from '../../components/dashboard/consultant/ConsultantList';
import { ConsultantVerificationDetails } from '../../components/dashboard/consultant/ConsultantVerificationDetails';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsultantVerification() {
    const {
        loading, search, setSearch,
        selectedProfile, setSelectedProfile,
        coordinators, selectedLeader, setSelectedLeader,
        verifying, handleVerify, filteredProfiles
    } = useConsultantVerification();

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        Verifikasi Advisor
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Validasi dokumen rekrutmen dan status keanggotaan advisor</p>
                </div>
                
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Cari nama atau email..."
                        className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl text-sm border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Section */}
                <div className="lg:col-span-1">
                    <ConsultantList 
                        profiles={filteredProfiles}
                        loading={loading}
                        selectedId={selectedProfile?.id}
                        onSelect={setSelectedProfile}
                    />
                </div>

                {/* Detail Section */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {!selectedProfile ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-panel h-[600px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-gray-200 bg-gray-50/30"
                            >
                                <div className="p-6 bg-white rounded-3xl shadow-sm mb-6">
                                    <Eye className="w-12 h-12 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-black text-gray-800">Pilih Advisor</h3>
                                <p className="text-gray-500 max-w-xs mt-2 text-sm">
                                    Pilih salah satu profil advisor dari daftar untuk meninjau dokumen dan melakukan verifikasi.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={selectedProfile.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-panel p-8"
                            >
                                <ConsultantVerificationDetails 
                                    profile={selectedProfile}
                                    coordinators={coordinators}
                                    selectedLeader={selectedLeader}
                                    setSelectedLeader={setSelectedLeader}
                                    onVerify={handleVerify}
                                    verifying={verifying}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
