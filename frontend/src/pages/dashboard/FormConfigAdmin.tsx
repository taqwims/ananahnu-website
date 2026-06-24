import { Settings, Plus, Loader2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFormConfigAdmin } from '../../hooks/useFormConfigAdmin';
import { formatServiceType } from '../../utils/format';
import { FormConfigTabs } from '../../components/dashboard/formconfig/FormConfigTabs';
import { FieldItem } from '../../components/dashboard/formconfig/FieldItem';
import { AddFieldModal } from '../../components/dashboard/formconfig/AddFieldModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function FormConfigAdmin() {
    const {
        activeTab, setActiveTab,
        fields, loading,
        saving, showAdd, setShowAdd,
        businessTypes,
        newField, setNewField,
        handleAdd, handleUpdate, handleDelete, updateFieldState,
        loadFields
    } = useFormConfigAdmin();

    const [activeStepNum, setActiveStepNum] = useState<number>(1);
    const [customStepNames, setCustomStepNames] = useState<Record<number, string>>({});
    const [stepNameInput, setStepNameInput] = useState('');
    const [renaming, setRenaming] = useState(false);

    // Group fields to find steps
    const stepsMap = fields.reduce((acc, field) => {
        const stepNum = field.step_number || 1;
        const stepName = field.step_name || `Step ${stepNum}`;
        if (!acc[stepNum]) {
            acc[stepNum] = { step_number: stepNum, step_name: stepName, fieldsCount: 0 };
        }
        if (field.step_name && acc[stepNum].step_name === `Step ${stepNum}`) {
            acc[stepNum].step_name = field.step_name;
        }
        acc[stepNum].fieldsCount++;
        return acc;
    }, {} as Record<number, { step_number: number; step_name: string; fieldsCount: number }>);

    // Ensure activeStepNum or any custom steps created are also shown
    const allStepNums = new Set([
        ...Object.keys(stepsMap).map(Number),
        activeStepNum,
        ...Object.keys(customStepNames).map(Number)
    ]);
    if (allStepNums.size === 0) {
        allStepNums.add(1);
    }

    const stepsList = Array.from(allStepNums).sort((a, b) => a - b).map(stepNum => {
        const existing = stepsMap[stepNum];
        return {
            step_number: stepNum,
            step_name: existing?.step_name || customStepNames[stepNum] || `Step ${stepNum}`,
            fieldsCount: existing?.fieldsCount || 0
        };
    });

    const getStepName = (stepNum: number) => {
        const found = stepsList.find(s => s.step_number === stepNum);
        return found ? found.step_name : `Step ${stepNum}`;
    };

    // Reset step selection when main tab changes
    useEffect(() => {
        setActiveStepNum(1);
        setCustomStepNames({});
    }, [activeTab]);

    // Sync input field when active step changes
    useEffect(() => {
        const name = getStepName(activeStepNum);
        setStepNameInput(name);
    }, [activeStepNum, fields, customStepNames]);

    const handleRenameStep = async () => {
        const fieldsToUpdate = fields.filter(f => (f.step_number || 1) === activeStepNum);
        if (fieldsToUpdate.length === 0) {
            setCustomStepNames(prev => ({ ...prev, [activeStepNum]: stepNameInput }));
            toast.success('Nama step disimpan (akan diterapkan pada field baru)');
            return;
        }

        setRenaming(true);
        try {
            await Promise.all(fieldsToUpdate.map(field => 
                api.put(`/form-config/${field.id}`, {
                    ...field,
                    step_name: stepNameInput
                })
            ));
            toast.success('Nama step berhasil diperbarui');
            loadFields(activeTab);
        } catch (err) {
            toast.error('Gagal memperbarui nama step');
        } finally {
            setRenaming(false);
        }
    };

    const handleOpenAdd = () => {
        const currentStepName = getStepName(activeStepNum);
        setNewField((prev: any) => ({
            ...prev,
            step_number: activeStepNum,
            step_name: currentStepName
        }));
        setShowAdd(true);
    };

    const filteredFields = fields.filter(f => (f.step_number || 1) === activeStepNum);

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
                {/* Step Tabs Sub-Navigation */}
                <div className="space-y-4 border-b border-gray-100 pb-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Langkah / Step Pengisian ({formatServiceType(activeTab)})
                        </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {stepsList.map(step => {
                            const isActive = step.step_number === activeStepNum;
                            return (
                                <button
                                    key={step.step_number}
                                    onClick={() => setActiveStepNum(step.step_number)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                        isActive
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm scale-105'
                                            : 'bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-100'
                                    }`}
                                >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {step.step_number}
                                    </span>
                                    <span>{step.step_name}</span>
                                    <span className="text-[10px] opacity-60 font-medium">({step.fieldsCount} field)</span>
                                </button>
                            );
                        })}
                        <button
                            onClick={() => {
                                const nextStepNum = Math.max(...stepsList.map(s => s.step_number), 0) + 1;
                                setCustomStepNames(prev => ({ ...prev, [nextStepNum]: `Step ${nextStepNum}` }));
                                setActiveStepNum(nextStepNum);
                                toast.success(`Step ${nextStepNum} ditambahkan`);
                            }}
                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold border border-dashed border-gray-200 transition-all flex items-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" /> Tambah Step
                        </button>
                    </div>
                </div>

                {/* Step Rename Editor */}
                <div className="bg-blue-50/30 border border-blue-100/50 p-5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-end gap-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest block">
                            Nama Step {activeStepNum}
                        </label>
                        <input
                            type="text"
                            className="glass-input text-sm w-full bg-white border-blue-150 focus:border-blue-300"
                            placeholder={`Masukkan nama untuk Step ${activeStepNum}...`}
                            value={stepNameInput}
                            onChange={e => setStepNameInput(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleRenameStep}
                        disabled={renaming || !stepNameInput.trim()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-100"
                    >
                        {renaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Simpan Nama Step
                    </button>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">
                            Atribut Field — {getStepName(activeStepNum)} (Step {activeStepNum})
                        </h2>
                        <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mt-1">Total {filteredFields.length} Field di Step Ini</p>
                    </div>
                    <button
                        onClick={handleOpenAdd}
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
                ) : filteredFields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-50 rounded-3xl">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Settings className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold">Belum ada field untuk step ini.</p>
                        <button 
                            onClick={handleOpenAdd}
                            className="mt-4 text-brand-600 text-xs font-black uppercase tracking-widest hover:underline"
                        >
                            Klik untuk menambahkan field pertama
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredFields.map(field => (
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
