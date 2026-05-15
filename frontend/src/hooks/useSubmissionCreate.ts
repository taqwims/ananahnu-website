import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { FormFieldConfig } from '../types';
import toast from 'react-hot-toast';

export const useSubmissionCreate = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [submissionId] = useState(crypto.randomUUID());
    const initialType = searchParams.get('type') || 'SELF_DECLARE';
    const initialName = searchParams.get('name') || '';

    const [clientData, setClientData] = useState({
        nib: '',
        nik: '',
        business_name: initialName,
        client_name: '',
        address: '',
        product_name: '',
        service_type: initialType,
        business_type_id: '',
        contact_person: '',
        phone: ''
    });

    const [businessTypes, setBusinessTypes] = useState<any[]>([]);

    const [configs, setConfigs] = useState<FormFieldConfig[]>([]);
    const [fieldValues, setFieldValues] = useState<Record<number, { text_value: string; file_url: string; link_value: string }>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<Record<number, boolean>>({});
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [verStatus, setVerStatus] = useState<{ profile: boolean; training: boolean } | null>(null);

    const checkVerification = useCallback(async () => {
        if (user?.role === 'HALAL_KONSULTAN') {
            try {
                const profileRes = await api.get(`/consultant/profile/${user.id}`);
                const profileVerified = profileRes.data?.is_verified ?? false;

                const trainingRes = await api.get(`/user-trainings/${user.id}`);
                const trainings = trainingRes.data || [];
                const isGraduated = trainings.some((t: any) => t.status === 'LULUS');

                setVerStatus({ profile: profileVerified, training: isGraduated });
                setIsVerified(profileVerified && isGraduated);
            } catch (err) {
                setIsVerified(false);
            }
        } else {
            setIsVerified(true);
        }
    }, [user]);

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (clientData.business_type_id) {
                params.business_type_id = clientData.business_type_id;
            }
            const res = await api.get(`/form-config/${clientData.service_type}`, { params });
            setConfigs(res.data || []);
            
            const valueMap: typeof fieldValues = {};
            (res.data || []).forEach((cfg: FormFieldConfig) => {
                valueMap[cfg.id] = { text_value: '', file_url: '', link_value: '' };
            });
            setFieldValues(valueMap);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [clientData.service_type, clientData.business_type_id]);

    useEffect(() => {
        const fetchBT = async () => {
            try {
                const res = await api.get('/billing-config/business-types');
                setBusinessTypes(res.data || []);
            } catch (err) {
                console.error("Gagal memuat bidang usaha", err);
            }
        };
        fetchBT();
    }, []);

    useEffect(() => {
        checkVerification();
        loadConfigs();
    }, [checkVerification, loadConfigs]);

    const handleFileUpload = async (fieldId: number, file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Ukuran file tidak boleh lebih dari 2MB");
            return;
        }

        setUploading(prev => ({ ...prev, [fieldId]: true }));
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await api.post(`/media/upload?subfolder=submission_${submissionId}`, formData);
            
            setFieldValues(prev => ({
                ...prev,
                [fieldId]: { ...prev[fieldId], file_url: res.data.url }
            }));
            toast.success("File berhasil diunggah");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal mengunggah file");
        } finally {
            setUploading(prev => ({ ...prev, [fieldId]: false }));
        }
    };

    const handleSave = async () => {
        if (!clientData.business_name || !clientData.client_name || !clientData.nik || !clientData.business_type_id) {
            toast.error("Nama Usaha, Nama Klien, NIK, dan Bidang Usaha wajib diisi");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                id: submissionId,
                client_data: {
                    ...clientData,
                    business_type_id: clientData.business_type_id ? parseInt(clientData.business_type_id) : null
                },
                field_values: configs.map(cfg => ({
                    form_field_id: cfg.id,
                    ...fieldValues[cfg.id]
                }))
            };

            await api.post('/submissions/create-full', payload);
            toast.success("Pengajuan berhasil dibuat");
            navigate('/dashboard/submissions');
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal menyimpan data");
        } finally {
            setSaving(false);
        }
    };

    return {
        submissionId,
        clientData, setClientData,
        configs,
        fieldValues, setFieldValues,
        loading,
        saving,
        uploading,
        isVerified,
        verStatus,
        handleFileUpload,
        handleSave,
        businessTypes,
        navigate
    };
};
