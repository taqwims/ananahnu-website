import { useState, useEffect, useCallback } from 'react';
import { geographyService } from '../services/geographyService';
import type { Province, Regency, District, BillingRate } from '../types';
import toast from 'react-hot-toast';

export const useGeographyAdmin = () => {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [regencies, setRegencies] = useState<Regency[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [rates, setRates] = useState<BillingRate[]>([]);
    
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
    const [selectedRegency, setSelectedRegency] = useState<Regency | null>(null);
    
    const [showAddProvince, setShowAddProvince] = useState(false);
    const [showAddRegency, setShowAddRegency] = useState(false);
    const [showAddDistrict, setShowAddDistrict] = useState(false);
    const [showAddRate, setShowAddRate] = useState(false);
    
    const [newName, setNewName] = useState('');
    const [rateForm, setRateForm] = useState({ service_type: 'REGULER', amount: 0, description: '' });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const loadProvinces = useCallback(async () => {
        try {
            const data = await geographyService.getProvinces();
            setProvinces(data || []);
        } catch (err) {}
    }, []);

    const loadRegencies = useCallback(async (provId: number) => {
        try {
            const data = await geographyService.getRegencies(provId);
            setRegencies(data || []);
        } catch (err) {}
    }, []);

    const loadDistricts = useCallback(async (regId: number) => {
        try {
            const data = await geographyService.getDistricts(regId);
            setDistricts(data || []);
        } catch (err) {}
    }, []);

    const loadRates = useCallback(async () => {
        try {
            const data = await geographyService.getRates();
            setRates(data || []);
        } catch (err) {}
    }, []);

    useEffect(() => {
        loadProvinces();
        loadRates();
    }, [loadProvinces, loadRates]);

    const selectProvince = (p: Province) => {
        setSelectedProvince(p);
        setSelectedRegency(null);
        setDistricts([]);
        loadRegencies(p.id);
    };

    const selectRegency = (r: Regency) => {
        setSelectedRegency(r);
        loadDistricts(r.id);
    };

    const deselectRegency = () => {
        setSelectedRegency(null);
        setDistricts([]);
    };

    const resetNavigation = () => {
        setSelectedProvince(null);
        setSelectedRegency(null);
        setRegencies([]);
        setDistricts([]);
    };

    const addProvince = async () => {
        if (!newName) return;
        try {
            await geographyService.createProvince(newName);
            setNewName(''); setShowAddProvince(false);
            loadProvinces();
            toast.success('Provinsi berhasil ditambahkan');
        } catch {
            toast.error('Gagal menambahkan provinsi');
        }
    };

    const addRegency = async () => {
        if (!newName || !selectedProvince) return;
        try {
            await geographyService.createRegency(selectedProvince.id, newName);
            setNewName(''); setShowAddRegency(false);
            loadRegencies(selectedProvince.id);
            toast.success('Kabupaten berhasil ditambahkan');
        } catch {
            toast.error('Gagal menambahkan kabupaten');
        }
    };

    const addDistrict = async () => {
        if (!newName || !selectedRegency) return;
        try {
            await geographyService.createDistrict(selectedRegency.id, newName);
            setNewName(''); setShowAddDistrict(false);
            loadDistricts(selectedRegency.id);
            toast.success('Kecamatan berhasil ditambahkan');
        } catch {
            toast.error('Gagal menambahkan kecamatan');
        }
    };

    const deleteProvince = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Provinsi',
            message: 'Hapus provinsi ini? Data kabupaten dan kecamatan di bawahnya mungkin juga terhapus.',
            onConfirm: async () => {
                try {
                    await geographyService.deleteProvince(id);
                    if (selectedProvince?.id === id) { setSelectedProvince(null); setRegencies([]); }
                    loadProvinces();
                    toast.success('Provinsi berhasil dihapus');
                } catch {
                    toast.error('Gagal menghapus provinsi');
                }
            }
        });
    };

    const deleteRegency = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Kabupaten',
            message: 'Hapus kabupaten ini? Data kecamatan di bawahnya mungkin juga terhapus.',
            onConfirm: async () => {
                try {
                    await geographyService.deleteRegency(id);
                    if (selectedRegency?.id === id) { setSelectedRegency(null); setDistricts([]); }
                    if (selectedProvince) loadRegencies(selectedProvince.id);
                    toast.success('Kabupaten berhasil dihapus');
                } catch {
                    toast.error('Gagal menghapus kabupaten');
                }
            }
        });
    };

    const deleteDistrict = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Kecamatan',
            message: 'Hapus kecamatan ini?',
            onConfirm: async () => {
                try {
                    await geographyService.deleteDistrict(id);
                    if (selectedRegency) loadDistricts(selectedRegency.id);
                    toast.success('Kecamatan berhasil dihapus');
                } catch {
                    toast.error('Gagal menghapus kecamatan');
                }
            }
        });
    };

    const addRate = async () => {
        if (!selectedRegency) return;
        try {
            await geographyService.createRate({
                ...rateForm,
                regency_id: selectedRegency.id,
            });
            setShowAddRate(false);
            setRateForm({ service_type: 'REGULER', amount: 0, description: '' });
            loadRates();
            toast.success('Tarif berhasil ditambahkan');
        } catch {
            toast.error('Gagal menambahkan tarif');
        }
    };

    const deleteRate = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Tarif',
            message: 'Hapus tarif khusus ini?',
            onConfirm: async () => {
                try {
                    await geographyService.deleteRate(id);
                    loadRates();
                    toast.success('Tarif berhasil dihapus');
                } catch {
                    toast.error('Gagal menghapus tarif');
                }
            }
        });
    };

    return {
        provinces, regencies, districts, rates,
        selectedProvince, setSelectedProvince: selectProvince,
        selectedRegency, setSelectedRegency: selectRegency,
        deselectRegency,
        showAddProvince, setShowAddProvince,
        showAddRegency, setShowAddRegency,
        showAddDistrict, setShowAddDistrict,
        showAddRate, setShowAddRate,
        newName, setNewName,
        rateForm, setRateForm,
        confirmModal, setConfirmModal,
        resetNavigation,
        addProvince, addRegency, addDistrict, addRate,
        deleteProvince, deleteRegency, deleteDistrict, deleteRate
    };
};
