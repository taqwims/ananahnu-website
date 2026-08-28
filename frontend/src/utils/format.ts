export const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Maps internal service type codes to user-friendly display names.
 * Use this everywhere service_type is displayed to keep labels consistent.
 */
export const formatServiceType = (serviceType: string): string => {
    const labels: Record<string, string> = {
        'CLIENT_SUBMISSION': 'Form Pengajuan Klien',
        'SELF_DECLARE': 'Self Declare Fasilitasi (Gratis)',
        'SELF_DECLARE_MANDIRI': 'Self Declare Mandiri',
        'REGULER': 'Reguler',
        'RECRUITMENT': 'Rekrutmen',
    };
    return labels[serviceType] || serviceType.replace(/_/g, ' ');
};

export const formatCurrency = formatRupiah;

export const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

export const formatRoleName = (role: string): string => {
    if (!role) return '';
    const labels: Record<string, string> = {
        'BUSINESS_DEVELOPMENT': 'Marketing & BD Manager',
        'DRAFT_MANAGER': 'Operasional Manager',
        'DRAFTER': 'HDO (Halal Documentation Officer)',
        'ADMIN_KEUANGAN': 'Finance & Legal',
        'ADMIN_PELATIHAN': 'Training & Recruitment',
        'VERIFIKATOR': 'Verifikator Dokumen',
        'QC_OFFICER': 'QC Officer (Verifikator)',
    };
    return labels[role.toUpperCase()] || role.replace(/_/g, ' ');
};

/**
 * Converts a raw phone number (from COMPANY_PHONE in system settings)
 * into a valid WhatsApp click-to-chat URL (wa.me) with prefilled message.
 */
export const formatWhatsAppUrl = (phone?: string, text?: string): string => {
    const rawNumber = (phone && phone.trim()) ? phone : '6281564955280';
    let cleanNumber = rawNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
        cleanNumber = '62' + cleanNumber.slice(1);
    } else if (!cleanNumber.startsWith('62') && cleanNumber.length > 0) {
        cleanNumber = '62' + cleanNumber;
    }
    const defaultText = text || "Halo HalalCore, saya ingin konsultasi mengenai pengurusan Sertifikat Halal.";
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultText)}`;
};

