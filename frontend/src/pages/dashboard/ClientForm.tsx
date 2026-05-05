import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';

const clientSchema = z.object({
    nib: z.string().min(13, "NIB must be 13 digits").max(13, "NIB must be 13 digits"),
    nik: z.string().min(16, "NIK must be 16 digits").max(16, "NIK must be 16 digits"),
    business_name: z.string().min(3, "Business Name is required"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    product_name: z.string().min(3, "Product Name is required"),
    service_type: z.enum(["REGULER", "SELF_DECLARE", "SELF_DECLARE_MANDIRI"]),
    contact_person: z.string().min(3, "Contact Person is required"),
    phone: z.string().min(10, "Phone number is required"),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            service_type: "REGULER"
        }
    });

    useEffect(() => {
        if (id) {
            api.get(`/clients/${id}`)
                .then(res => {
                    reset(res.data);
                })
                .finally(() => setInitialLoading(false));
        }
    }, [id, reset]);

    const onSubmit = async (data: ClientFormValues) => {
        setLoading(true);
        try {
            if (id) {
                await api.put(`/clients/${id}`, data);
            } else {
                await api.post('/clients', data); // This endpoint needs to be verified in backend
                // In backend I implemented GET /clients, GET /clients/:id, PUT /clients/:id
                // STARTBACKEND CHECK: Did I implement POST /clients?
                // Checking client_handler.go... I might have missed POST /clients in the quick CRUD implementation step.
                // I will check this after writing the file.
            }
            navigate('/dashboard/clients');
        } catch (err) {
            console.error(err);
            alert("Failed to save client");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard/clients')} className="p-2 hover:bg-white/50 rounded-lg">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{id ? 'Edit Client' : 'New Client Registration'}</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Business Info Section */}
                <div className="glass-panel p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Business Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NIB</label>
                            <input {...register('nib')} className={`glass-input ${errors.nib ? 'border-red-300' : ''}`} placeholder="1234567890123" />
                            {errors.nib && <p className="text-red-500 text-xs mt-1">{errors.nib.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NIK</label>
                            <input {...register('nik')} className={`glass-input ${errors.nik ? 'border-red-300' : ''}`} placeholder="16-digit identity number" />
                            {errors.nik && <p className="text-red-500 text-xs mt-1">{errors.nik.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                            <input {...register('business_name')} className={`glass-input ${errors.business_name ? 'border-red-300' : ''}`} placeholder="UD. Example" />
                            {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input {...register('product_name')} className={`glass-input ${errors.product_name ? 'border-red-300' : ''}`} placeholder="Bread & Bakery" />
                            {errors.product_name && <p className="text-red-500 text-xs mt-1">{errors.product_name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                            <select {...register('service_type')} className="glass-input appearance-none">
                                <option value="REGULER">Reguler</option>
                                <option value="SELF_DECLARE">Self Declare</option>
                                <option value="SELF_DECLARE_MANDIRI">Self Declare Mandiri</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea {...register('address')} rows={3} className={`glass-input ${errors.address ? 'border-red-300' : ''}`} placeholder="Full business address" />
                            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Contact Info Section */}
                <div className="glass-panel p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Contact Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                            <input {...register('contact_person')} className={`glass-input ${errors.contact_person ? 'border-red-300' : ''}`} />
                            {errors.contact_person && <p className="text-red-500 text-xs mt-1">{errors.contact_person.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input {...register('phone')} className={`glass-input ${errors.phone ? 'border-red-300' : ''}`} placeholder="0812..." />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => navigate('/dashboard/clients')} className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="glass-button flex items-center gap-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Client
                    </button>
                </div>
            </form>
        </div>
    );
}
