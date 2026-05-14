import { useState, useEffect, useCallback } from 'react';
import { submissionService } from '../services/submissionService';
import type { Submission, AuditLog, FormFieldValue, Invoice, Client } from '../types';
import { toast } from 'react-hot-toast';

export const useSubmission = (id: string | undefined) => {
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [history, setHistory] = useState<AuditLog[]>([]);
    const [fieldValues, setFieldValues] = useState<FormFieldValue[]>([]);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [sub, hist, fields, inv] = await Promise.all([
                submissionService.getById(id),
                submissionService.getHistory(id),
                submissionService.getFields(id),
                submissionService.getInvoice(id)
            ]);
            setSubmission(sub);
            setHistory(hist);
            setFieldValues(fields);
            setInvoice(inv);
        } catch (err: any) {
            toast.error(err.message || 'Gagal mengambil data pengajuan');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = async () => {
        if (!id) return;
        try {
            const [sub, hist] = await Promise.all([
                submissionService.getById(id),
                submissionService.getHistory(id)
            ]);
            setSubmission(sub);
            setHistory(hist);
        } catch (err: any) {
            toast.error(err.message || 'Gagal memperbarui data');
        }
    };

    const updateClient = async (clientId: string, data: Partial<Client>) => {
        setProcessing(true);
        try {
            await submissionService.updateClient(clientId, data);
            toast.success('Data klien berhasil diperbarui');
            await refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleAction = async (action: 'submit' | 'approve' | 'reject' | 'assign_consultant', payload?: any) => {
        if (!id) return;
        setProcessing(true);
        try {
            switch (action) {
                case 'submit':
                    await submissionService.submit(id);
                    break;
                case 'approve':
                    await submissionService.approve(id, payload);
                    break;
                case 'reject':
                    await submissionService.reject(id, payload.note);
                    break;
                case 'assign_consultant':
                    await submissionService.assignConsultant(id, payload.consultantId);
                    break;
            }
            toast.success('Aksi berhasil dilakukan');
            await refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const issueSH = async (shUrl: string) => {
        if (!id) return;
        setProcessing(true);
        try {
            await submissionService.issueSH(id, shUrl);
            toast.success('Sertifikat Halal berhasil diterbitkan');
            await refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const saveAuditInfo = async (auditDate: string) => {
        if (!id) return;
        setProcessing(true);
        try {
            await submissionService.saveAuditInfo(id, auditDate);
            toast.success('Info audit berhasil disimpan');
            await refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const saveAuditResult = async (url1: string, url2: string) => {
        if (!id) return;
        setProcessing(true);
        try {
            await submissionService.saveAuditResult(id, url1, url2);
            toast.success('Hasil audit berhasil disimpan');
            await refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessing(false);
        }
    };

    return {
        submission,
        history,
        fieldValues,
        invoice,
        loading,
        processing,
        refresh,
        updateClient,
        handleAction,
        issueSH,
        saveAuditInfo,
        saveAuditResult
    };
};
