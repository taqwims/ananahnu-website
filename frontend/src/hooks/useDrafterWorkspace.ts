import { useState, useEffect, useMemo, useCallback } from 'react';
import { submissionService } from '../services/submissionService';
import type { Submission, FormFieldValue } from '../types';
import toast from 'react-hot-toast';

export const useDrafterWorkspace = (initialSubId: string | null) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubId, setActiveSubId] = useState<string | null>(initialSubId);
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    
    // Client Edit States
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [isEditingDocs, setIsEditingDocs] = useState(false);
    const [nibFile, setNibFile] = useState<File | null>(null);
    const [clientForm, setClientForm] = useState({
        business_name: '',
        client_name: '',
        nib: '',
        nib_file_url: '',
        nik: '',
        product_name: '',
        address: ''
    });

    // Details for active submission
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [fieldValues, setFieldValues] = useState<FormFieldValue[]>([]);

    const loadSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const [drafterData, revisionData] = await Promise.all([
                submissionService.getAll({ status: 'DRAFTER' }),
                submissionService.getAll({ status: 'REVISION' })
            ]);
            setSubmissions([...drafterData, ...revisionData]);
        } catch (err: any) {
            toast.error(err.message || "Gagal memuat daftar tugas");
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
                    nib_file_url: sub.client.nib_file_url || '',
                    nik: sub.client.nik || '',
                    product_name: sub.client.product_name || '',
                    address: sub.client.address || ''
                });
            }
            
            if (sub.audit_date) {
                // Done loading audit date
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

    const handleAction = async (action: 'approve') => {
        if (!activeSubmission) return;
        setProcessing(true);
        try {
            if (action === 'approve') {
                await submissionService.approve(activeSubmission.id);
                toast.success("Pengajuan diteruskan ke QC Review");
                setActiveSubId(null);
                loadSubmissions();
            }
            if (activeSubId) await loadDetail(activeSubId);
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
            let finalNIBFileURL = clientForm.nib_file_url;
            if (nibFile) {
                const toastId = toast.loading('Mengunggah File NIB...');
                try {
                    finalNIBFileURL = await submissionService.uploadMedia(nibFile);
                    toast.success('Berhasil mengunggah NIB', { id: toastId });
                } catch (e: any) {
                    toast.error(e.message || 'Gagal mengunggah NIB', { id: toastId });
                    setProcessing(false);
                    return;
                }
            }

            await submissionService.updateClient(activeSubmission.client_id, {
                ...clientForm,
                nib_file_url: finalNIBFileURL
            });
            toast.success("Data klien diperbarui");
            setIsEditingClient(false);
            setNibFile(null);
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

    const updateFieldValue = (index: number, key: string, value: any) => {
        const newFields = [...fieldValues];
        newFields[index] = { ...newFields[index], [key]: value };
        setFieldValues(newFields);
    };

    const handleUpdateAuditResult = async (url1: string, url2: string) => {
        if (!activeSubmission) return;
        setProcessing(true);
        try {
            await submissionService.saveAuditResult(activeSubmission.id, url1, url2);
            toast.success("Hasil audit diperbarui");
            if (activeSubId) await loadDetail(activeSubId);
        } catch (err: any) {
            toast.error(err.message || "Gagal memperbarui hasil audit");
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
        isEditingClient,
        setIsEditingClient,
        isEditingDocs,
        setIsEditingDocs,
        clientForm,
        setClientForm,
        nibFile,
        setNibFile,
        handleAction,
        handleUpdateClient,
        handleUpdateDocs,
        handleUpdateAuditResult,
        updateFieldValue,
        loadSubmissions
    };
};
