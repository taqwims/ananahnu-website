import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { login } from '../../services/teleService';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Logo from '../../components/ui/Logo';
import loginImg from '../../assets/login.png';

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden relative">
      <Toaster position="top-right" />

      {/* Left Side - Image/Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-3/5 relative bg-brand-900"
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-brand-950 via-brand-900/50 to-transparent"></div>
        <img 
          src={loginImg} 
          alt="Telemarketing Visual" 
          className="absolute inset-0 w-full h-full object-cover opacity-75"
        />
        
        <div className="relative z-20 w-full h-full flex flex-col justify-end p-16">
          <Logo size="xl" variant="white" className="mb-8 !items-start" clickable={true} />
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Digitalizing <span className="text-gold-400">Halal Advisory</span> Excellence
          </h2>
          <p className="text-xl text-brand-100/70 max-w-lg leading-relaxed font-medium">
            Empowering telemarketers to assist businesses in achieving Halal standards through online guidance and digital workflow.
          </p>
          
          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-2xl font-bold text-white">15.000+</p>
              <p className="text-sm text-brand-200/60 uppercase tracking-wider font-semibold">Certified UKM</p>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-sm text-brand-200/60 uppercase tracking-wider font-semibold">Online Assistance</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 bg-gradient-brand/5"
      >
        <div className="max-w-md w-full relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-12">
            <Logo size="lg" clickable={true} />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-brand-900 mb-2">Selamat Datang</h1>
            <p className="text-dark-500 font-medium">Masuk ke akun telemarketer Anda</p>
          </div>

          {/* Form Card */}
          <motion.div
            className="glass-card p-8 hover:shadow-2xl hover:shadow-brand-900/[0.04] transition-all duration-300 border border-brand-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="form-label text-dark-800 font-bold ml-0.5">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dark-400 group-focus-within:text-brand-600 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input pl-11"
                    placeholder="email@halalcore.id"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="form-label text-dark-800 font-bold ml-0.5">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dark-400 group-focus-within:text-brand-500 transition-colors" />
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
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6 py-3.5 font-bold cursor-pointer"
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

          <p className="text-center text-dark-500 text-xs mt-12 font-medium">
            © 2026 PT Ana Nahnu Indonesia. Semua Hak Dilindungi.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
