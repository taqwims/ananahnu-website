import type { ProductTier } from '../types';

export interface CalculatedCost {
    unitCost: number;
    multiplier: number;
    multiplierLabel: string;
    totalAmount: number;
}

export function parseProductTiers(productTiers: any): ProductTier[] {
    if (!productTiers) return [];
    if (Array.isArray(productTiers)) return productTiers;
    if (typeof productTiers === 'string') {
        try {
            return JSON.parse(productTiers);
        } catch {
            return [];
        }
    }
    return [];
}

export function calculateComponentCost(
    compType: string = 'FIXED',
    baseAmount: number = 0,
    productTiersRaw: any = null,
    productCount: number = 1,
    branchCount: number = 1,
    customQty: number = 1
): CalculatedCost {
    const pCount = Math.max(1, productCount || 1);
    const bCount = Math.max(1, branchCount || 1);
    const qCount = Math.max(1, customQty || 1);

    const typeStr = compType || 'FIXED';
    const hasPerProduk = typeStr.includes('PER_PRODUK');
    const hasPerCabang = typeStr.includes('PER_CABANG');
    const hasPerManday = typeStr.includes('PER_MANDAY');

    let unitCost = baseAmount || 0;
    let multiplier = 1;
    const labels: string[] = [];

    if (hasPerProduk) {
        const tiers = parseProductTiers(productTiersRaw);
        if (tiers.length > 0) {
            let matched = false;
            for (const t of tiers) {
                const min = Number(t.min_qty) || 1;
                const max = Number(t.max_qty) || 0;
                if (pCount >= min && (max === 0 || pCount <= max)) {
                    unitCost = Number(t.price) || 0;
                    labels.push(max > 0 ? `${min}-${max} Produk` : `>${min} Produk`);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                const lastTier = tiers[tiers.length - 1];
                const lastMax = Number(lastTier.max_qty) || 0;
                if (lastMax > 0 && pCount > lastMax) {
                    unitCost = Number(lastTier.price) || 0;
                    labels.push(`${pCount} Produk (Tier Maks)`);
                } else {
                    labels.push(`${pCount} Produk`);
                }
            }
        } else {
            multiplier *= pCount;
            labels.push(`${pCount} Produk`);
        }
    }

    if (hasPerCabang) {
        multiplier *= bCount;
        labels.push(`${bCount} Cabang`);
    }

    if (hasPerManday) {
        multiplier *= qCount;
        if (qCount > 1) {
            labels.push(`${qCount} Qty`);
        }
    }

    const multiplierLabel = labels.length > 0 ? ` (${labels.join(', ')})` : '';
    const totalAmount = unitCost * multiplier;

    return {
        unitCost,
        multiplier,
        multiplierLabel,
        totalAmount
    };
}
