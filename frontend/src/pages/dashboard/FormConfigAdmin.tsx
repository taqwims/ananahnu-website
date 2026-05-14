import { Settings, Plus, Loader2 } from 'lucide-react';
import { useFormConfigAdmin } from '../../hooks/useFormConfigAdmin';
import { formatServiceType } from '../../utils/format';
import { FormConfigTabs } from '../../components/dashboard/formconfig/FormConfigTabs';
import { FieldItem } from '../../components/dashboard/formconfig/FieldItem';
import { AddFieldModal } from '../../components/dashboard/formconfig/AddFieldModal';

export default function FormConfigAdmin() {
    const {
        activeTab, setActiveTab,
        fields, loading,
        saving, showAdd, setShowAdd,
        businessTypes,
        newField, setNewField,
        handleAdd, handleUpdate, handleDelete, updateFieldState
    } = useFormConfigAdmin();

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-2xl shadow-lg shadow-brand-100/50">
                            <Settings className="w-6 h-6" />
                        </div>
                        Konfigurasi Formulir
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Kelola struktur data dan persyaratan dokumen aplikasi</p>
                </div>
            </div>

            <FormConfigTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="glass-panel p-8 space-y-6 min-h-[500px]">
                <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">
                            Atribut Field — {formatServiceType(activeTab)}
                        </h2>
                        <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mt-1">Total {fields.length} Field Dikonfigurasi</p>
                    </div>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" /> Tambah Field
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="animate-spin w-10 h-10 text-brand-600" />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sinkronisasi Schema...</p>
                    </div>
                ) : fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-50 rounded-3xl">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Settings className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold">Belum ada field untuk jenis formulir ini.</p>
                        <button 
                            onClick={() => setShowAdd(true)}
                            className="mt-4 text-brand-600 text-xs font-black uppercase tracking-widest hover:underline"
                        >
                            Klik untuk menambahkan field pertama
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {fields.map(field => (
                            <FieldItem 
                                key={field.id}
                                field={field}
                                businessTypes={businessTypes}
                                onUpdateState={updateFieldState}
                                onHandleUpdate={handleUpdate}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showAdd && (
                <AddFieldModal 
                    newField={newField}
                    setNewField={setNewField}
                    businessTypes={businessTypes}
                    onSave={handleAdd}
                    onClose={() => setShowAdd(false)}
                    saving={saving}
                />
            )}
        </div>
    );
}
