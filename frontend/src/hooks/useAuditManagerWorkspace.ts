import { useState, useEffect, useMemo, useCallback } from 'react';
import { submissionService } from '../services/submissionService';
import type { Submission, FormFieldValue, User } from '../types';
import toast from 'react-hot-toast';

export const useAuditManagerWorkspace = (initialSubId: string | null) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubId, setActiveSubId] = useState<string | null>(initialSubId);
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    
    // Distribution state
    const [drafters, setDrafters] = useState<User[]>([]);
    const [selectedDrafter, setSelectedDrafter] = useState('');
    const [consultants, setConsultants] = useState<User[]>([]);
    const [selectedConsultant, setSelectedConsultant] = useState('');
    
    // Rejection state
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    
    // Client Edit States
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [isEditingDocs, setIsEditingDocs] = useState(false);
    const [clientForm, setClientForm] = useState({
        business_name: '',
        client_name: '',
        nib: '',
        nik: '',
        product_name: '',
        address: ''
    });

    // Details for active submission
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [fieldValues, setFieldValues] = useState<FormFieldValue[]>([]);
    const [auditDate, setAuditDate] = useState('');
    const [isEditingAudit, setIsEditingAudit] = useState(false);

    const loadSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            // Audit Manager only handles REGULER service type
            const [qcOff, qcRev, fatwa, drfts, conslts] = await Promise.all([
                submissionService.getAll({ status: 'QC_OFFICER', service_type: 'REGULER' }),
                submissionService.getAll({ status: 'QC_REVIEW', service_type: 'REGULER' }),
                submissionService.getAll({ status: 'SIDANG_FATWA', service_type: 'REGULER' }),
                submissionService.getDrafters(),
                submissionService.getConsultants()
            ]);
            
            setSubmissions([...qcOff, ...qcRev, ...fatwa]);
            setDrafters(drfts);
            setConsultants(conslts || []);
        } catch (err: any) {
            toast.error(err.message || "Gagal memuat daftar tugas Audit Manager");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDetail = useCallback(async (id: string) => {
        try {
            const [sub, fields] = await Promise.all([
                submissionService.getById(id),
                submissionService.getFields(id)
            ]);
            setActiveSubmission(sub);
            setFieldValues(fields);
            
            if (sub.client) {
                setClientForm({
                    business_name: sub.client.business_name || '',
                    client_name: sub.client.client_name || '',
                    nib: sub.client.nib || '',
                    nik: sub.client.nik || '',
                    product_name: sub.client.product_name || '',
                    address: sub.client.address || ''
                });
            }
            
            if (sub.audit_date) {
                setAuditDate(new Date(sub.audit_date).toISOString().split('T')[0]);
            } else {
                setAuditDate('');
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal memuat detail pengajuan");
        }
    }, []);

    useEffect(() => {
        loadSubmissions();
    }, [loadSubmissions]);

    useEffect(() => {
        if (activeSubId) {
            loadDetail(activeSubId);
        } else {
            setActiveSubmission(null);
            setFieldValues([]);
        }
    }, [activeSubId, loadDetail]);

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s =>
            s.client?.business_name.toLowerCase().includes(search.toLowerCase()) ||
            s.id.toLowerCase().includes(search.toLowerCase())
        );
    }, [submissions, search]);

    const handleDistribute = async () => {
        if (!activeSubmission || !selectedDrafter) return;
        setProcessing(true);
        try {
            await submissionService.assignDrafter(activeSubmission.id, selectedDrafter);
            toast.success("Pengajuan berhasil didistribusikan ke Drafter");
            setActiveSubId(null);
            loadSubmissions();
        } catch (err: any) {
            toast.error(err.message || "Gagal mendistribusikan pengajuan");
        } finally {
            setProcessing(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject' | 'reject_consultant') => {
        if (!activeSubmission) return;
        setProcessing(true);
        try {
            switch (action) {
                case 'approve':
                    await submissionService.approve(activeSubmission.id);
                    toast.success("Pengajuan disetujui");
                    break;
                case 'reject':
                    await submissionService.reject(activeSubmission.id, rejectNote);
                    toast.success("Pengajuan dikembalikan ke Drafter");
                    setRejectNote('');
                    break;
                case 'reject_consultant':
                    if (activeSubmission.data_source === 'MARKETING' && selectedConsultant) {
                        await submissionService.assignConsultant(activeSubmission.id, selectedConsultant);
                        toast.success("Advisor ditunjuk & pengajuan dikembalikan");
                    } else {
                        await submissionService.reject(activeSubmission.id, rejectNote);
                        toast.success("Pengajuan dikembalikan ke Advisor");
                    }
                    setRejectNote('');
                    setSelectedConsultant('');
                    break;
            }
            setActiveSubId(null);
            loadSubmissions();
        } catch (err: any) {
            toast.error(err.message || "Gagal memproses aksi");
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateClient = async () => {
        if (!activeSubmission?.client_id) return;
        setProcessing(true);
        try {
            await submissionService.updateClient(activeSubmission.client_id, clientForm);
            toast.success("Data klien diperbarui");
            setIsEditingClient(false);
            if (activeSubId) await loadDetail(activeSubId);
        } catch (err: any) {
            toast.error(err.message || "Gagal memperbarui data klien");
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateDocs = async () => {
        if (!activeSubmission) return;
        setProcessing(true);
        try {
            const inputs = fieldValues.map(fv => ({
                field_id: fv.form_field_id,
                text_value: fv.text_value,
                link_value: fv.link_value,
                file_url: fv.file_url
            }));
            await submissionService.updateFields(activeSubmission.id, inputs);
            toast.success("Dokumen diperbarui");
            setIsEditingDocs(false);
            if (activeSubId) await loadDetail(activeSubId);
        } catch (err: any) {
            toast.error(err.message || "Gagal memperbarui dokumen");
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateAudit = async () => {
        if (!activeSubmission) return;
        setProcessing(true);
        try {
            await submissionService.saveAuditInfo(activeSubmission.id, auditDate);
            toast.success("Tanggal audit diperbarui");
            setIsEditingAudit(false);
            if (activeSubId) await loadDetail(activeSubId);
        } catch (err: any) {
            toast.error(err.message || "Gagal memperbarui tanggal audit");
        } finally {
            setProcessing(false);
        }
    };

    const updateFieldValue = (index: number, key: string, value: any) => {
        const newFields = [...fieldValues];
        newFields[index] = { ...newFields[index], [key]: value };
        setFieldValues(newFields);
    };

    const handleIssueSH = async (shUrl: string) => {
        if (!activeSubmission) return;
        setProcessing(true);
        try {
            await submissionService.issueSH(activeSubmission.id, shUrl);
            toast.success("Sertifikat Halal berhasil diterbitkan");
            setActiveSubId(null);
            loadSubmissions();
        } catch (err: any) {
            toast.error(err.message || "Gagal menerbitkan Sertifikat Halal");
        } finally {
            setProcessing(false);
        }
    };

    return {
        submissions,
        filteredSubmissions,
        activeSubId,
        setActiveSubId,
        activeSubmission,
        fieldValues,
        loading,
        processing,
        search,
        setSearch,
        isFocusMode,
        setIsFocusMode,
        drafters,
        selectedDrafter,
        setSelectedDrafter,
        consultants,
        selectedConsultant,
        setSelectedConsultant,
        showRejectModal,
        setShowRejectModal,
        rejectNote,
        setRejectNote,
        isEditingClient,
        setIsEditingClient,
        isEditingDocs,
        setIsEditingDocs,
        clientForm,
        setClientForm,
        auditDate,
        setAuditDate,
        isEditingAudit,
        setIsEditingAudit,
        handleDistribute,
        handleAction,
        handleUpdateClient,
        handleUpdateDocs,
        handleUpdateAudit,
        handleIssueSH,
        updateFieldValue,
        loadSubmissions
    };
};
