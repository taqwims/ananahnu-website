import { useState, useEffect, useCallback } from 'react';
import { systemSettingsService } from '../services/systemSettingsService';
import { toast } from 'react-hot-toast';

export const useSystemSettings = () => {
    const [settings, setSettings] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await systemSettingsService.getAll();
            setSettings(data);
        } catch (err: any) {
            toast.error(err.message || 'Gagal mengambil pengaturan');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const updateSetting = async (key: string, value: string, silent = false) => {
        try {
            setIsSaving(true);
            await systemSettingsService.update(key, value);
            setSettings(prev => ({ ...prev, [key]: value }));
            if (!silent) toast.success('Pengaturan berhasil diperbarui');
        } catch (err: any) {
            toast.error(err.message || 'Gagal menyimpan pengaturan');
        } finally {
            setIsSaving(false);
        }
    };

    const updateLocalSetting = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return {
        settings,
        loading,
        isSaving,
        fetchSettings,
        updateSetting,
        updateLocalSetting
    };
};
