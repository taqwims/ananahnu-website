import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { login } from '../../services/teleService';
import { motion } from 'framer-motion';
import { Headphones, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      const { access_token, refresh_token, user } = res.data;

      if (user.role === 'CLIENT') {
        const mainAppUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:5173'
          : 'https://halalcore.id';
        toast.success('Login berhasil! Mengalihkan ke HalalCore...');
        setTimeout(() => {
          window.location.href = `${mainAppUrl}/login?token=${access_token}&refresh=${refresh_token}`;
        }, 1000);
        return;
      }

      if (user.role !== 'TELEMARKETER' && user.role !== 'DIRECTOR') {
        toast.error('Akses hanya untuk Telemarketer');
        return;
      }

      setAuth(user, access_token, refresh_token);
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login gagal';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      <Toaster position="top-right" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-xl shadow-brand-600/20"
          >
            <Headphones className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-brand-900">HalalCore</h1>
          <p className="text-brand-700 text-sm mt-1">Telemarketing Portal</p>
        </div>

        {/* Form Card */}
        <motion.div
          className="glass-card p-8 hover:shadow-2xl hover:shadow-brand-900/[0.04] transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
        >
          <h2 className="text-xl font-bold text-brand-900 mb-1">Selamat Datang</h2>
          <p className="text-dark-500 text-sm mb-6">Masuk ke akun telemarketer Anda</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="form-label">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-11"
                  placeholder="email@halalcore.id"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="form-label">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-11 pr-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-brand-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Masuk <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center text-dark-500 text-xs mt-6">
          © 2026 HalalCore by PT Ana Nahnu Indonesia
        </p>
      </motion.div>
    </div>
  );
}
