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
        'SELF_DECLARE': 'Self Declare Fasilitasi (Gratis)',
        'SELF_DECLARE_MANDIRI': 'Self Declare Mandiri',
        'REGULER': 'Reguler',
        'RECRUITMENT': 'Rekrutmen',
    };
    return labels[serviceType] || serviceType.replace(/_/g, ' ');
};
