import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { FormFieldConfig } from '../types';
import toast from 'react-hot-toast';

export const useFormConfigAdmin = () => {
    const [activeTab, setActiveTab] = useState<string>('SELF_DECLARE');
    const [fields, setFields] = useState<FormFieldConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [businessTypes, setBusinessTypes] = useState<{id: number; name: string}[]>([]);
    const [newField, setNewField] = useState({
        field_key: '', field_label: '', input_type: 'TEXT' as string,
        is_required: false, sort_order: 0, description: '', business_type_id: '' as string,
        step_number: 1, step_name: 'Step 1'
    });

    const loadFields = useCallback(async (formType: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/form-config/${formType}`);
            setFields(res.data || []);
        } catch {
            setFields([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadBusinessTypes = useCallback(async () => {
        try {
            const res = await api.get('/billing-config/business-types');
            setBusinessTypes(res.data || []);
        } catch {
            setBusinessTypes([]);
        }
    }, []);

    useEffect(() => { loadFields(activeTab); }, [activeTab, loadFields]);
    useEffect(() => { loadBusinessTypes(); }, [loadBusinessTypes]);

    const handleAdd = async () => {
        setSaving(true);
        try {
            await api.post('/form-config/', {
                ...newField,
                form_type: activeTab,
                sort_order: fields.length + 1,
                business_type_id: newField.business_type_id ? parseInt(newField.business_type_id) : null,
                step_number: parseInt(newField.step_number as any) || 1,
            });
            setShowAdd(false);
            setNewField({ field_key: '', field_label: '', input_type: 'TEXT', is_required: false, sort_order: 0, description: '', business_type_id: '', step_number: 1, step_name: 'Step 1' });
            loadFields(activeTab);
            toast.success('Field berhasil ditambahkan');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menambahkan field');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (field: FormFieldConfig) => {
        try {
            await api.put(`/form-config/${field.id}`, field);
            toast.success('Field diperbarui');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal memperbarui field');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Hapus field ini?')) return;
        try {
            await api.delete(`/form-config/${id}`);
            loadFields(activeTab);
            toast.success('Field dihapus');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menghapus field');
        }
    };

    const updateFieldState = (id: number, key: string, value: any) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    return {
        activeTab, setActiveTab,
        fields, loading,
        saving, showAdd, setShowAdd,
        businessTypes,
        newField, setNewField,
        handleAdd, handleUpdate, handleDelete, updateFieldState,
        loadFields
    };
};
