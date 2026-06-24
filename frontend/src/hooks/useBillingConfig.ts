import { useState, useEffect, useCallback } from 'react';
import { billingService } from '../services/billingService';
import api from '../services/api';
import toast from 'react-hot-toast';

export type MainTab = 'master_data' | 'components' | 'settings';
export type TabKey = 'schemes' | 'business_types' | 'products' | 'scales' | 'components';

export const useBillingConfig = () => {
    const [loading, setLoading] = useState(true);
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('components');
    const [activeTab, setActiveTab] = useState<TabKey>('components');

    // Data Lists
    const [products, setProducts] = useState<any[]>([]);
    const [scales, setScales] = useState<any[]>([]);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [regencies, setRegencies] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [components, setComponents] = useState<any[]>([]);
    const [schemes, setSchemes] = useState<any[]>([]);
    const [businessTypes, setBusinessTypes] = useState<any[]>([]);
    const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
    const [formFields, setFormFields] = useState<any[]>([]);
    
    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        amount: '',
        type: 'FIXED',
        category: 'OPSIONAL',
        mandatory: false,
        businessTypeId: '',
        productCategoryId: '',
        salesSchemeId: '',
        dataSource: 'ORGANIK',
        businessScaleId: '',
        provinceId: '',
        regencyId: '',
        districtId: '',
        formFieldConfigId: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [p, s, c, sc, bt, prov, sys, regulerFields, sdFields] = await Promise.all([
                billingService.getProductCategories(),
                billingService.getBusinessScales(),
                billingService.getComponents(),
                billingService.getSalesSchemes(),
                billingService.getBusinessTypes(),
                billingService.getProvinces(),
                billingService.getSystemSettings(),
                api.get('/form-config/REGULER').then(r => r.data).catch(() => []),
                api.get('/form-config/SELF_DECLARE').then(r => r.data).catch(() => [])
            ]);
            setProducts(p);
            setScales(s);
            setComponents(c);
            setSchemes(sc);
            setBusinessTypes(bt);
            setProvinces(prov);
            setSystemSettings(sys);
            setFormFields([...regulerFields, ...sdFields]);
        } catch (err: any) {
            toast.error("Gagal memuat data billing");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Geographical Cascades
    useEffect(() => {
        if (formData.provinceId) {
            billingService.getRegencies(formData.provinceId).then(setRegencies);
        } else {
            setRegencies([]);
            setFormData(prev => ({ ...prev, regencyId: '', districtId: '' }));
        }
    }, [formData.provinceId]);

    useEffect(() => {
        if (formData.regencyId) {
            billingService.getDistricts(formData.regencyId).then(setDistricts);
        } else {
            setDistricts([]);
            setFormData(prev => ({ ...prev, districtId: '' }));
        }
    }, [formData.regencyId]);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            amount: '',
            type: 'FIXED',
            category: 'OPSIONAL',
            mandatory: false,
            businessTypeId: '',
            productCategoryId: '',
            salesSchemeId: '',
            dataSource: 'ORGANIK',
            businessScaleId: '',
            provinceId: '',
            regencyId: '',
            districtId: '',
            formFieldConfigId: ''
        });
        setEditingId(null);
    };

    const handleSave = async (customPayloads?: any[]) => {
        if (!customPayloads && !formData.name) return;
        try {
            let endpoint = '';
            
            if (activeTab === 'products') {
                endpoint = '/billing-config/product-categories';
                if (customPayloads && customPayloads.length > 0) {
                    await Promise.all(
                        customPayloads.map(p => 
                            billingService.createMaster(endpoint, {
                                name: p.name,
                                description: p.description,
                                business_type_id: parseInt(formData.businessTypeId)
                            })
                        )
                    );
                    resetForm();
                    fetchData();
                    toast.success('Data berhasil disimpan');
                    return;
                }
                
                const payload = {
                    name: formData.name,
                    description: formData.description,
                    business_type_id: parseInt(formData.businessTypeId)
                };
                if (editingId) {
                    await billingService.updateMaster(endpoint, editingId, payload);
                } else {
                    await billingService.createMaster(endpoint, payload);
                }
            } else {
                let endpoint = '';
                const payload: any = { name: formData.name, description: formData.description };

                if (activeTab === 'scales') {
                    endpoint = '/billing-config/business-scales';
                } else if (activeTab === 'schemes') {
                    endpoint = '/billing-config/sales-schemes';
                } else if (activeTab === 'business_types') {
                    endpoint = '/billing-config/business-types';
                } else if (activeTab === 'components') {
                    endpoint = '/billing-config/components';
                    payload.category = formData.category;
                    payload.type = formData.type;
                    payload.base_amount = parseFloat(formData.amount) || 0;
                    payload.is_mandatory = formData.mandatory;
                    payload.business_type_id = formData.businessTypeId ? parseInt(formData.businessTypeId) : null;
                    payload.product_category_id = formData.productCategoryId ? parseInt(formData.productCategoryId) : null;
                    payload.province_id = formData.provinceId ? parseInt(formData.provinceId) : null;
                    payload.regency_id = formData.regencyId ? parseInt(formData.regencyId) : null;
                    payload.district_id = formData.districtId ? parseInt(formData.districtId) : null;
                    payload.sales_scheme_id = formData.salesSchemeId ? parseInt(formData.salesSchemeId) : null;
                    payload.data_source = formData.dataSource;
                    payload.business_scale_id = formData.businessScaleId ? parseInt(formData.businessScaleId) : null;
                    payload.form_field_config_id = formData.formFieldConfigId ? parseInt(formData.formFieldConfigId) : null;
                }

                if (editingId) {
                    await billingService.updateMaster(endpoint, editingId, payload);
                } else {
                    await billingService.createMaster(endpoint, payload);
                }
            }

            resetForm();
            fetchData();
            toast.success('Data berhasil disimpan');
        } catch (err: any) {
            toast.error("Gagal menyimpan data");
        }
    };

    const handleDelete = async (endpoint: string, id: number) => {
        try {
            await billingService.deleteMaster(endpoint, id);
            fetchData();
            toast.success('Data berhasil dihapus');
        } catch (err: any) {
            toast.error("Gagal menghapus data");
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            description: item.description || '',
            amount: item.base_amount?.toString() || '',
            type: item.type || 'FIXED',
            category: item.category || 'OPSIONAL',
            mandatory: item.is_mandatory || false,
            businessTypeId: item.business_type_id?.toString() || '',
            productCategoryId: item.product_category_id?.toString() || '',
            salesSchemeId: item.sales_scheme_id?.toString() || '',
            dataSource: item.data_source || 'ORGANIK',
            businessScaleId: item.business_scale_id?.toString() || '',
            provinceId: item.province_id?.toString() || '',
            regencyId: item.regency_id?.toString() || '',
            districtId: item.district_id?.toString() || '',
            formFieldConfigId: item.form_field_config_id?.toString() || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateSystemSetting = async (key: string, value: string) => {
        try {
            await billingService.updateSystemSetting(key, value);
            toast.success("Pengaturan berhasil disimpan");
        } catch (err: any) {
            toast.error("Gagal menyimpan pengaturan");
        }
    };

    return {
        loading,
        activeMainTab,
        setActiveMainTab,
        activeTab,
        setActiveTab,
        products,
        scales,
        provinces,
        regencies,
        districts,
        components,
        schemes,
        businessTypes,
        systemSettings,
        setSystemSettings,
        editingId,
        formData,
        setFormData,
        handleSave,
        handleDelete,
        handleEdit,
        resetForm,
        handleUpdateSystemSetting,
        formFields
    };
};
