import { useState } from 'react';
import { CreditCard, Upload, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import type { Submission } from '../../types';

interface PaymentSectionProps {
    submission: Submission;
    onPaymentSuccess: () => void;
}

declare global {
    interface Window {
        snap: any;
    }
}

export default function PaymentSection({ submission, onPaymentSuccess }: PaymentSectionProps) {
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState<'MANUAL' | 'MIDTRANS'>('MIDTRANS');
    const [proofUrl, setProofUrl] = useState(''); // Simple text input for now, ideally file upload

    const handlePay = async () => {
        setLoading(true);
        try {
            if (method === 'MIDTRANS') {
                const res = await api.post('/payments/midtrans', {
                    submission_id: submission.id,
                    amount: 500000, // Fixed amount for example
                    email: 'customer@example.com' // Should come from client data
                });
                const snapToken = res.data.snap_token;

                window.snap.pay(snapToken, {
                    onSuccess: function (result: any) {
                        console.log('success', result);
                        onPaymentSuccess();
                    },
                    onPending: function (result: any) {
                        console.log('pending', result);
                    },
                    onError: function (result: any) {
                        console.log('error', result);
                        alert("Payment Failed");
                    },
                    onClose: function () {
                        console.log('customer closed the popup without finishing the payment');
                    }
                });
            } else {
                await api.post('/payments/manual', {
                    submission_id: submission.id,
                    amount: 500000,
                    proof_url: proofUrl,
                });
                alert("Payment proof uploaded. Waiting for verification.");
                onPaymentSuccess();
            }
        } catch (err) {
            console.error(err);
            alert("Payment creation failed");
        } finally {
            setLoading(false);
        }
    };

    const paidPayment = submission.payments?.find(p => p.status === 'PAID');
    const pendingPayment = submission.payments?.find(p => p.status === 'PENDING');

    if (paidPayment) {
        return (
            <div className="glass-panel p-6 bg-green-50 border-green-200">
                <div className="flex items-center gap-3 text-green-800">
                    <CheckCircle className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Payment Completed</h3>
                </div>
                <p className="text-sm text-green-700 mt-2">Amount: Rp {paidPayment.amount.toLocaleString()}</p>
            </div>
        );
    }

    // If pending, show status
    if (pendingPayment && pendingPayment.method === 'MANUAL') {
        return (
            <div className="glass-panel p-6 bg-yellow-50 border-yellow-200">
                <h3 className="text-lg font-bold text-yellow-800">Waiting For Verification</h3>
                <p className="text-sm text-yellow-700">Manual payment proof uploaded. Please wait for admin approval.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Payment Required</h3>
            <p className="text-sm text-gray-500">Please complete the payment to proceed with verification.</p>

            <div className="flex gap-4">
                <button
                    onClick={() => setMethod('MIDTRANS')}
                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${method === 'MIDTRANS' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                    <CreditCard className="w-6 h-6" />
                    <span className="font-medium">Online Payment</span>
                </button>
                <button
                    onClick={() => setMethod('MANUAL')}
                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${method === 'MANUAL' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                    <Upload className="w-6 h-6" />
                    <span className="font-medium">Manual Transfer</span>
                </button>
            </div>

            {method === 'MANUAL' && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Proof URL (Simulated)</label>
                    <input
                        type="text"
                        className="glass-input"
                        placeholder="https://example.com/receipt.jpg"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                    />
                </div>
            )}

            <button
                onClick={handlePay}
                disabled={loading || (method === 'MANUAL' && !proofUrl)}
                className="w-full glass-button bg-brand-600 text-white hover:bg-brand-700 font-bold py-3 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : `Pay Rp 500,000`}
            </button>
        </div>
    );
}
