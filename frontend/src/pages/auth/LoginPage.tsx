import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

import loginImg from '../../assets/login.png';
import Logo from '../../components/ui/Logo';

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', data);
            const { user, access_token } = response.data;
            setAuth(user, access_token);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
            {/* Left Side - Image/Branding */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex lg:w-3/5 relative bg-brand-900"
            >
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-brand-900 via-brand-900/40 to-transparent"></div>
                <img 
                    src={loginImg} 
                    alt="Login Visual" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                
                <div className="relative z-20 w-full h-full flex flex-col justify-end p-16">
                    <Logo size="xl" variant="white" className="mb-8 !items-start" />
                    <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                        Excellence in <span className="text-gold-400">Halal Ecosystem</span>
                    </h2>
                    <p className="text-xl text-brand-100/70 max-w-lg leading-relaxed">
                        Join our digital platform to streamline your Halal certification and business excellence journey.
                    </p>
                    
                    <div className="mt-12 flex gap-8">
                        <div>
                            <p className="text-2xl font-bold text-white">5000+</p>
                            <p className="text-sm text-brand-200/60 uppercase tracking-wider">Certified Businesses</p>
                        </div>
                        <div className="w-px h-12 bg-white/10"></div>
                        <div>
                            <p className="text-2xl font-bold text-white">100%</p>
                            <p className="text-sm text-brand-200/60 uppercase tracking-wider">Syariah Compliance</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 bg-gray-50"
            >
                <div className="max-w-md w-full">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-12">
                        <Logo size="lg" />
                    </div>

                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-500">Sign in to access your Halal Core dashboard</p>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 text-sm font-medium border border-red-100 flex gap-3 items-start"
                        >
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-600 transition-colors" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="name@company.com"
                                    className={`w-full h-14 pl-12 pr-4 rounded-xl bg-white border border-gray-200 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all shadow-sm ${errors.email ? 'border-red-300 ring-4 ring-red-500/10' : ''}`}
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-semibold text-gray-700">Password</label>
                                <a href="/forgot-password" className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline">Forgot password?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-600 transition-colors" />
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder="••••••••"
                                    className={`w-full h-14 pl-12 pr-4 rounded-xl bg-white border border-gray-200 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all shadow-sm ${errors.password ? 'border-red-300 ring-4 ring-red-500/10' : ''}`}
                                />
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 active:scale-[0.98] transition-all shadow-lg shadow-brand-900/10 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-gray-500">
                            Don't have an account?{" "}
                            <a href="/register" className="text-brand-600 font-bold hover:text-brand-700 hover:underline">
                                Create an account
                            </a>
                        </p>
                    </div>
                    
                    <div className="mt-16 flex justify-center gap-6 text-xs text-gray-400 font-medium">
                        <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
                        <span>&bull;</span>
                        <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
                        <span>&bull;</span>
                        <a href="#" className="hover:text-gray-600 transition-colors">Help Center</a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
