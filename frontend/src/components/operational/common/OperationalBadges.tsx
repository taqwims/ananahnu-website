import type { PriorityLevel } from '../../../types/operational';

export function PriorityBadge({ priority }: { priority: PriorityLevel | string }) {
    switch (priority) {
        case 'Kritis':
        case 'CRITICAL':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">Kritis</span>;
        case 'Mendesak':
        case 'URGENT':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">Mendesak</span>;
        case 'Tinggi':
        case 'HIGH':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200">Tinggi</span>;
        case 'Normal':
        case 'NORMAL':
        default:
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">Normal</span>;
    }
}

export function CompletenessBadge({ status }: { status: string }) {
    switch (status) {
        case 'Lengkap':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Lengkap</span>;
        case 'Belum Lengkap':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Belum Lengkap</span>;
        case 'Perlu Perbaikan':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Perlu Perbaikan</span>;
        default:
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
}

export function AssignStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'Menunggu Review':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Menunggu Review</span>;
        case 'Ditugaskan ke QCO':
        case 'Sedang Diproses QCO':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">{status}</span>;
        case 'Ditugaskan ke Drafter':
        case 'Penyusunan HDO':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">{status}</span>;
        case 'Lolos QC':
        case 'Selesai':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">{status}</span>;
        default:
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
}

export function SlaBadge({ sla, isOverdue }: { sla: string; isOverdue?: boolean }) {
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
            {sla}
        </span>
    );
}

export function ServiceTypeBadge({ service }: { service: string }) {
    switch (service) {
        case 'Self Declare Fasilitasi':
            return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">Self Declare Fasilitasi</span>;
        case 'Self Declare Mandiri':
            return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Self Declare Mandiri</span>;
        case 'Reguler':
            return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">Reguler</span>;
        default:
            return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700">{service}</span>;
    }
}
