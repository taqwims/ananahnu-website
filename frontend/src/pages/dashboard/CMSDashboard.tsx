import { Loader2 } from 'lucide-react';
import { useCMSDashboard } from '../../hooks/useCMSDashboard';
import { CMSTabs } from '../../components/dashboard/cms/CMSTabs';
import { NewsList } from '../../components/dashboard/cms/NewsList';
import { ContentBlocksList } from '../../components/dashboard/cms/ContentBlocksList';
import { AffiliatesList } from '../../components/dashboard/cms/AffiliatesList';
import { ProductsList } from '../../components/dashboard/cms/ProductsList';
import { CMSModal } from '../../components/dashboard/cms/CMSModal';

export default function CMSDashboard() {
    const {
        activeTab, setActiveTab,
        news, blocks, affiliates, products,
        loading,
        showModal, setShowModal,
        editingItem,
        formData, setFormData,
        handleSave, handleDelete, openCreate, openEdit
    } = useCMSDashboard();

    const tabLabels: Record<string, string> = {
        news: 'Berita',
        blocks: 'Content Blocks',
        affiliates: 'Affiliates',
        products: 'Produk Bersertifikat'
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
            </div>

            <CMSTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="glass-panel p-6 min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                        <p className="text-gray-500 font-medium animate-pulse">Memuat konten {tabLabels[activeTab]}...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'news' && (
                            <NewsList 
                                news={news} 
                                onAdd={openCreate} 
                                onEdit={openEdit} 
                                onDelete={handleDelete} 
                            />
                        )}

                        {activeTab === 'blocks' && (
                            <ContentBlocksList 
                                blocks={blocks} 
                                onEdit={openEdit} 
                            />
                        )}

                        {activeTab === 'affiliates' && (
                            <AffiliatesList 
                                affiliates={affiliates} 
                                onAdd={openCreate} 
                                onEdit={openEdit} 
                                onDelete={handleDelete} 
                            />
                        )}

                        {activeTab === 'products' && (
                            <ProductsList 
                                products={products} 
                                onAdd={openCreate} 
                                onEdit={openEdit} 
                                onDelete={handleDelete} 
                            />
                        )}
                    </>
                )}
            </div>

            {showModal && (
                <CMSModal 
                    activeTab={activeTab}
                    editingItem={editingItem}
                    formData={formData}
                    setFormData={setFormData}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                    label={tabLabels[activeTab]}
                />
            )}
        </div>
    );
}
