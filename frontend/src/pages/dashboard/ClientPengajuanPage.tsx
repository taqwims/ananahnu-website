import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    Users, 
    ShieldCheck, 
    Award, 
    CheckCircle2, 
    ArrowRight, 
    AlertTriangle, 
    XCircle, 
    MessageSquare, 
    UserCheck,
    Loader2
} from 'lucide-react';
import api from '../../services/api';

interface ScreeningOption {
    text: string;
    isEligible: boolean;
}

interface ScreeningQuestion {
    id: number;
    question: string;
    options: ScreeningOption[];
}

const SCREENING_QUESTIONS: ScreeningQuestion[] = [
    {
        id: 1,
        question: "Berapa estimasi total penjualan kotor (omzet) usaha Anda dalam satu tahun terakhir?",
        options: [
            {
                text: "Maksimal Rp500 juta per tahun",
                isEligible: true
            },
            {
                text: "Lebih dari Rp500 juta per tahun",
                isEligible: false
            }
        ]
    },
    {
        id: 2,
        question: "Apakah seluruh proses produksi dilakukan secara mandiri oleh usaha Anda (tidak diserahkan/maklon ke pabrik atau pihak lain)?",
        options: [
            {
                text: "Ya, seluruhnya diproduksi sendiri",
                isEligible: true
            },
            {
                text: "Tidak, sebagian atau seluruh produksi diserahkan ke pihak lain (maklon)",
                isEligible: false
            }
        ]
    },
    {
        id: 3,
        question: "Apakah seluruh bahan baku, bahan tambahan, dan bahan penolong yang digunakan sudah dipastikan kehalalannya?",
        options: [
            {
                text: "Ya, semua bahan sudah bersertifikat halal atau merupakan bahan segar/murni tanpa proses (seperti air, sayur, buah segar)",
                isEligible: true
            },
            {
                text: "Tidak, masih ada bahan yang belum jelas status kehalalannya / tidak memiliki sertifikat halal",
                isEligible: false
            }
        ]
    },
    {
        id: 4,
        question: "Apakah ada produk Anda yang menggunakan daging atau bahan turunan hewan dari hasil penyembelihan (ayam, sapi, bebek, dll.)?",
        options: [
            {
                text: "Ya, dan semua diperoleh dari Rumah Potong Hewan/Unggas (RPH/RPU) yang sudah memiliki Sertifikat Halal",
                isEligible: true
            },
            {
                text: "Ya, tetapi dibeli dari pasar/pemasok biasa yang belum memiliki Sertifikat Halal",
                isEligible: false
            },
            {
                text: "Tidak menggunakan bahan dari hewan sembelihan sama sekali",
                isEligible: true
            }
        ]
    },
    {
        id: 5,
        question: "Bagaimana tingkat kerumitan teknologi dan alat yang digunakan dalam proses produksi Anda?",
        options: [
            {
                text: "Sederhana (manual atau semi-otomatis skala rumah tangga) dan tidak menggunakan teknologi rekayasa genetika (GMO) atau iradiasi",
                isEligible: true
            },
            {
                text: "Kompleks (menggunakan mesin industri besar otomatis penuh, atau pengawetan tingkat tinggi)",
                isEligible: false
            }
        ]
    },
    {
        id: 6,
        question: "Bagaimana status lokasi, tempat, dan alat produksi yang Anda gunakan?",
        options: [
            {
                text: "Sepenuhnya bersih, bebas dari najis, dan terpisah total dari bahan, alat, atau kegiatan non-halal (terutama babi/anjing)",
                isEligible: true
            },
            {
                text: "Masih bercampur atau menggunakan alat yang sama secara bergantian dengan pengolahan bahan non-halal",
                isEligible: false
            }
        ]
    },
    {
        id: 7,
        question: "Kategori produk apa yang Anda daftarkan dalam sertifikasi ini?",
        options: [
            {
                text: "Produk berupa barang olahan (makanan/minuman kemasan) yang berisiko rendah",
                isEligible: true
            },
            {
                text: "Jasa (seperti Katering, Restoran, Rumah Makan, Cafe, Dapur Umum, atau Warung Makan)",
                isEligible: false
            }
        ]
    },
    {
        id: 8,
        question: "Apakah nama produk atau merek yang Anda daftarkan terbebas dari kata/istilah yang bertentangan dengan syariat Islam?",
        options: [
            {
                text: "Ya, nama produk terbebas dari unsur vulgar, erotis, nama setan, atau istilah produk non-halal (misal: bacon, beer, rum, tuak)",
                isEligible: true
            },
            {
                text: "Tidak, nama produk masih mengandung kata/istilah yang merujuk pada hal-hal tersebut",
                isEligible: false
            }
        ]
    },
    {
        id: 9,
        question: "Apakah Anda sudah memiliki atau bersedia menunjuk Penyelia Halal yang beragama Islam di internal usaha Anda?",
        options: [
            {
                text: "Ya, ada/bersedia menunjuk Penyelia Halal beragama Islam (bisa pemilik usaha itu sendiri atau karyawan)",
                isEligible: true
            },
            {
                text: "Tidak ada dan tidak bersedia menunjuk Penyelia Halal beragama Islam",
                isEligible: false
            }
        ]
    },
    {
        id: 10,
        question: "Apakah Anda bersedia bekerja sama dan diperiksa lokasinya oleh Pendamping Proses Produk Halal (PPH)?",
        options: [
            {
                text: "Ya, bersedia didampingi dan diperiksa langsung proses produksinya",
                isEligible: true
            },
            {
                text: "Tidak bersedia diperiksa atau didampingi",
                isEligible: false
            }
        ]
    }
];

export default function ClientPengajuanPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [selectedService, setSelectedService] = useState<'REGULER' | 'SELF_DECLARE' | 'SELF_DECLARE_MANDIRI'>(
        (searchParams.get('service') as any) || 'SELF_DECLARE'
    );

    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [screeningFinished, setScreeningFinished] = useState(false);
    const [isEligible, setIsEligible] = useState<boolean | null>(null);

    const [facilitators, setFacilitators] = useState<any[]>([]);
    const [selectedFacilitator, setSelectedFacilitator] = useState<string>('');
    const [loadingFacilitators, setLoadingFacilitators] = useState(false);

    // Quota state (mock/fetch)
    const [quotaLimit] = useState(10000);
    const [quotaUsed] = useState(1245);

    useEffect(() => {
        setLoadingFacilitators(true);
        api.get('/auth/facilitators')
            .then(res => {
                setFacilitators(res.data || []);
            })
            .catch(err => console.error("Gagal memuat pendamping halal", err))
            .finally(() => setLoadingFacilitators(false));
    }, []);

    const handleAnswer = (optionIdx: number) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIdx]: optionIdx }));
    };

    const handleNextQuestion = () => {
        if (answers[currentQuestionIdx] === undefined) return;

        if (currentQuestionIdx < SCREENING_QUESTIONS.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
        } else {
            // Evaluasi hasil screening:
            // Lolos jika seluruh jawaban memilih opsi yang isEligible === true
            const eligible = SCREENING_QUESTIONS.every((q, idx) => {
                const chosenOptIdx = answers[idx];
                return chosenOptIdx !== undefined && q.options[chosenOptIdx]?.isEligible === true;
            });
            setIsEligible(eligible);
            setScreeningFinished(true);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIdx > 0) {
            setCurrentQuestionIdx(prev => prev - 1);
        }
    };

    const [submitting, setSubmitting] = useState(false);

    const handleProceedToForm = async () => {
        setSubmitting(true);
        try {
            const payload = {
                client_data: {
                    service_type: selectedService,
                    facilitator_id: selectedFacilitator ? selectedFacilitator : undefined
                }
            };
            const res = await api.post('/submissions/create-full', payload);
            toast.success('Draf pengajuan berhasil dibuat!');
            navigate(`/dashboard/submissions/${res.data.id}`);
        } catch (err: any) {
            console.error("Gagal membuat draf pengajuan", err);
            toast.error(err.response?.data?.error || err.message || 'Gagal membuat draf pengajuan');
        } finally {
            setSubmitting(false);
        }
    };

    const currentQ = SCREENING_QUESTIONS[currentQuestionIdx];

    return (
        <div className="max-w-[1440px] mx-auto space-y-8 px-4 sm:px-6 py-4">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pilih Jenis Layanan</h1>
                <p className="text-gray-500 font-medium mt-1">Pilih layanan pendampingan halal yang sesuai dengan kebutuhan usaha Anda.</p>
            </div>

            {/* 3 Main Service Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Reguler */}
                <div 
                    onClick={() => {
                        setSelectedService('REGULER');
                        setScreeningFinished(false);
                    }}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedService === 'REGULER'
                            ? 'bg-white border-brand-600 ring-2 ring-brand-600/20 shadow-xl'
                            : 'bg-white/80 border-gray-150 hover:border-gray-300 hover:shadow-md'
                    }`}
                >
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100 shadow-sm">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Reguler</h3>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                                Pendampingan pembuatan Sertifikat Halal melalui proses reguler bersama Halal Advisor profesional.
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService('REGULER');
                        }}
                        className={`mt-6 w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                            selectedService === 'REGULER'
                                ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 hover:bg-brand-700'
                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        Pilih Reguler
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* 2. Self Declare Fasilitasi */}
                <div 
                    onClick={() => setSelectedService('SELF_DECLARE')}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                        selectedService === 'SELF_DECLARE'
                            ? 'bg-white border-brand-600 ring-2 ring-brand-600/20 shadow-xl'
                            : 'bg-white/80 border-gray-150 hover:border-gray-300 hover:shadow-md'
                    }`}
                >
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Self Declare (Fasilitasi)</h3>
                            </div>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                                Fasilitasi pendaftaran Self Declare dengan biaya Rp0 (disubsidi BPJPH).
                            </p>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                Kuota Tersedia
                            </div>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService('SELF_DECLARE');
                        }}
                        className={`mt-6 w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                            selectedService === 'SELF_DECLARE'
                                ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 hover:bg-brand-700'
                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        Pilih Fasilitasi
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* 3. Self Declare Mandiri */}
                <div 
                    onClick={() => {
                        setSelectedService('SELF_DECLARE_MANDIRI');
                        setScreeningFinished(false);
                    }}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedService === 'SELF_DECLARE_MANDIRI'
                            ? 'bg-white border-brand-600 ring-2 ring-brand-600/20 shadow-xl'
                            : 'bg-white/80 border-gray-150 hover:border-gray-300 hover:shadow-md'
                    }`}
                >
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Self Declare (Mandiri)</h3>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                                Pendampingan Self Declare Mandiri untuk pelaku usaha yang ingin proses lebih mandiri.
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService('SELF_DECLARE_MANDIRI');
                        }}
                        className={`mt-6 w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                            selectedService === 'SELF_DECLARE_MANDIRI'
                                ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 hover:bg-brand-700'
                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        Pilih Mandiri
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Flow & Questionnaire / Direct Form */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Alur Layanan Stepper */}
                    <div className="glass-panel p-6 bg-white border border-gray-150 rounded-3xl">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">
                            Alur Layanan {selectedService === 'REGULER' ? 'Reguler' : 'Self Declare'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                                !screeningFinished ? 'bg-brand-50/70 border-brand-200' : 'bg-gray-50 border-gray-150 opacity-80'
                            }`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                    !screeningFinished ? 'bg-brand-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    1
                                </div>
                                <div>
                                    <p className="font-black text-xs text-gray-900">Screening Kelayakan</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Cek kelayakan usaha Anda</p>
                                </div>
                            </div>

                            <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                                screeningFinished && isEligible !== null ? 'bg-brand-50/70 border-brand-200' : 'bg-gray-50 border-gray-150 opacity-60'
                            }`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                    screeningFinished ? 'bg-brand-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    2
                                </div>
                                <div>
                                    <p className="font-black text-xs text-gray-900">Hasil Screening</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Lihat hasil kelayakan</p>
                                </div>
                            </div>

                            <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                                screeningFinished && isEligible ? 'bg-brand-50/70 border-brand-200' : 'bg-gray-50 border-gray-150 opacity-60'
                            }`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                    screeningFinished && isEligible ? 'bg-brand-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    3
                                </div>
                                <div>
                                    <p className="font-black text-xs text-gray-900">Lanjut Pengajuan</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Pilih pendamping & buat ajuan</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Screening Box or Result */}
                    {selectedService === 'REGULER' ? (
                        /* Reguler Flow direct action */
                        <div className="glass-panel p-8 bg-white border border-gray-150 rounded-3xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Pengajuan Skema Reguler</h3>
                                    <p className="text-xs text-gray-500 font-medium">Skema untuk semua skala usaha dengan fasilitas audit LPH dan sidang fatwa komisi MUI.</p>
                                </div>
                            </div>

                            {/* Facilitator Selection */}
                            <div className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200 space-y-4">
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-brand-600" />
                                    Pilih Pendamping Halal (Halal Advisor)
                                </label>
                                <p className="text-xs text-gray-500 font-medium">
                                    Pilih tenaga pendamping halal bersertifikat yang akan membantu proses pengajuan Anda.
                                </p>
                                {loadingFacilitators ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Memuat daftar pendamping...
                                    </div>
                                ) : (
                                    <select
                                        value={selectedFacilitator}
                                        onChange={(e) => setSelectedFacilitator(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-brand-600 focus:outline-none"
                                    >
                                        <option value="">-- Belum Memilih (Akan Ditentukan Tim Marketing) --</option>
                                        {facilitators.map(f => (
                                            <option key={f.id} value={f.id}>
                                                {f.full_name} ({f.email})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleProceedToForm}
                                disabled={submitting}
                                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Lanjut Isi Data Pengajuan
                                        <ArrowRight className="w-5 h-5 text-gold-400" />
                                    </>
                                )}
                            </button>
                        </div>
                    ) : !screeningFinished ? (
                        /* Screening Question Card */
                        <div className="glass-panel p-8 bg-white border border-gray-150 rounded-3xl space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Screening Kelayakan Usaha</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Jawab pertanyaan berikut untuk mengetahui kelayakan usaha Anda.</p>
                                </div>
                                <span className="px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100 text-xs font-black">
                                    {currentQuestionIdx + 1} dari {SCREENING_QUESTIONS.length}
                                </span>
                            </div>

                            <div className="py-4 space-y-4">
                                <h4 className="text-base font-black text-gray-800 leading-snug">
                                    {currentQ.id}. {currentQ.question}
                                </h4>

                                <div className="space-y-3 pt-2">
                                    {currentQ.options.map((opt, optIdx) => {
                                        const isSelected = answers[currentQuestionIdx] === optIdx;
                                        return (
                                            <label 
                                                key={optIdx}
                                                className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'bg-brand-50/80 border-brand-600 text-brand-900 font-bold ring-1 ring-brand-600/20 shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`q_${currentQ.id}`}
                                                    value={optIdx}
                                                    checked={isSelected}
                                                    onChange={() => handleAnswer(optIdx)}
                                                    className="mt-1 w-4 h-4 text-brand-600 accent-brand-600 shrink-0"
                                                />
                                                <span className="text-xs sm:text-sm leading-relaxed">{opt.text}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={handlePrevQuestion}
                                    disabled={currentQuestionIdx === 0}
                                    className="px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-black text-xs hover:bg-gray-50 transition-all disabled:opacity-40"
                                >
                                    Kembali
                                </button>

                                <button
                                    type="button"
                                    onClick={handleNextQuestion}
                                    disabled={answers[currentQuestionIdx] === undefined}
                                    className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-brand-100 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                >
                                    {currentQuestionIdx === SCREENING_QUESTIONS.length - 1 ? 'Selesaikan Screening' : 'Selanjutnya'}
                                    <ArrowRight className="w-4 h-4 text-gold-400" />
                                </button>
                            </div>
                        </div>
                    ) : isEligible ? (
                        /* Eligible Result Card */
                        <div className="glass-panel p-8 bg-white border border-emerald-200 rounded-3xl space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-1">
                                        Hasil Screening Lolos
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Usaha Anda Memenuhi Syarat!</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                                        Selamat! Berdasarkan hasil screening, produk dan usaha Anda memenuhi kriteria program Self Declare.
                                    </p>
                                </div>
                            </div>

                            {/* Facilitator Selection */}
                            <div className="p-6 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-4">
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-brand-600" />
                                    Pilih Pendamping Halal (Halal Advisor)
                                </label>
                                <p className="text-xs text-gray-500 font-medium">
                                    Pilih tenaga pendamping halal bersertifikat yang akan mendampingi proses verifikasi berkas dan kunjungan PPH Anda.
                                </p>
                                {loadingFacilitators ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Memuat daftar pendamping...
                                    </div>
                                ) : (
                                    <select
                                        value={selectedFacilitator}
                                        onChange={(e) => setSelectedFacilitator(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-brand-600 focus:outline-none"
                                    >
                                        <option value="">-- Belum Memilih (Akan Ditentukan Tim Marketing) --</option>
                                        {facilitators.map(f => (
                                            <option key={f.id} value={f.id}>
                                                {f.full_name} ({f.email})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setScreeningFinished(false);
                                        setCurrentQuestionIdx(0);
                                        setAnswers({});
                                    }}
                                    className="py-4 px-6 rounded-2xl bg-white border border-gray-200 text-gray-700 font-black text-xs hover:bg-gray-50 transition-all"
                                >
                                    Ulangi Screening
                                </button>

                                <button
                                    type="button"
                                    onClick={handleProceedToForm}
                                    disabled={submitting}
                                    className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-xs shadow-xl shadow-brand-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>
                                            Lanjut Pengajuan Sertifikasi
                                            <ArrowRight className="w-4 h-4 text-gold-400" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Ineligible Result Card (matches screenshot 2) */
                        <div className="glass-panel p-8 bg-white border border-red-200 rounded-3xl space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                    <XCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Tidak Memenuhi Syarat</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                                        Usaha Anda belum memenuhi kriteria untuk mengikuti skema Self Declare. Silakan pilih skema <b>Reguler</b> untuk melanjutkan proses Sertifikat Halal.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-red-50/50 border border-red-100 text-xs text-red-700 font-medium space-y-2">
                                <p className="font-bold">Kenapa tidak memenuhi syarat Self Declare?</p>
                                <p>Skema Self Declare diperuntukkan khusus bagi usaha mikro/kecil dengan proses pengolahan sederhana dan bahan baku yang sudah bersertifikat halal. Untuk produk dengan proses kompleks atau bahan non-sertifikasi, Anda dapat memilih skema Reguler.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedService('REGULER')}
                                    className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-xs shadow-xl shadow-brand-100 transition-all flex items-center justify-center gap-2"
                                >
                                    Pilih Reguler
                                    <ArrowRight className="w-4 h-4 text-gold-400" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setScreeningFinished(false);
                                        setCurrentQuestionIdx(0);
                                        setAnswers({});
                                    }}
                                    className="py-4 px-6 rounded-2xl bg-white border border-gray-200 text-gray-700 font-black text-xs hover:bg-gray-50 transition-all"
                                >
                                    Coba Screening Lagi
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Info Kuota, Alerts, Support (matches screenshot 2) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Info Kuota Fasilitasi */}
                    <div className="glass-panel p-6 bg-white border border-gray-150 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3 text-brand-800">
                            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900">Info Kuota Fasilitasi</h4>
                                <p className="text-[10px] text-gray-500 font-medium">Disubsidi BPJPH untuk pelaku usaha</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Kuota Tersedia</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-gray-900 font-mono">
                                    {(quotaLimit - quotaUsed).toLocaleString('id-ID')}
                                </span>
                                <span className="text-xs text-gray-500 font-bold">Kuota</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">
                                Dari total {quotaLimit.toLocaleString('id-ID')} kuota tahun 2026
                            </p>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-3">
                                <div 
                                    className="bg-brand-600 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(100, (quotaUsed / quotaLimit) * 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-gray-400 pt-1">
                                <span>Terpakai: {((quotaUsed / quotaLimit) * 100).toFixed(1)}%</span>
                                <span>Tersedia: {(100 - (quotaUsed / quotaLimit) * 100).toFixed(1)}%</span>
                            </div>
                        </div>

                        <p className="text-[10px] text-gray-400 font-medium italic text-center">
                            *Kuota diperbarui setiap hari pukul 00.00 WIB
                        </p>
                    </div>

                    {/* Kuota Habis Alert Card (shown conditionally or as reference widget) */}
                    {quotaLimit - quotaUsed <= 0 && (
                        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
                            <div className="flex items-center gap-2 text-amber-700">
                                <AlertTriangle className="w-5 h-5" />
                                <h4 className="text-xs font-black uppercase tracking-wider">Kuota Fasilitasi Habis</h4>
                            </div>
                            <p className="text-xs leading-relaxed font-medium text-amber-800">
                                Maaf, kuota fasilitasi saat ini habis. Silakan menggunakan skema Self Declare Mandiri atau Reguler.
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedService('SELF_DECLARE_MANDIRI')}
                                    className="py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-black text-amber-800 hover:bg-amber-100"
                                >
                                    Pilih Mandiri
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedService('REGULER')}
                                    className="py-2.5 bg-brand-600 text-white rounded-xl text-xs font-black hover:bg-brand-700"
                                >
                                    Pilih Reguler
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Butuh Bantuan WhatsApp widget (matches screenshot 2) */}
                    <div className="glass-panel p-6 bg-white border border-gray-150 rounded-3xl space-y-4">
                        <div>
                            <h4 className="text-sm font-black text-gray-900">Butuh Bantuan?</h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Tim HalalCore siap membantu Anda.</p>
                        </div>
                        <a
                            href="https://wa.me/6281234567890"
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 active:scale-95 group"
                        >
                            <MessageSquare className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                            Chat via WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
