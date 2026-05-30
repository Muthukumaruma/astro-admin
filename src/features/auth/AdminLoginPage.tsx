import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Shield, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAdminAuthStore } from '../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';

export default function AdminLoginPage() {
  const { setToken, setUser } = useAdminAuthStore();
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      const res = await axios.post(`${API}/auth/login`, data, { withCredentials: true });
      if (res.data.data.user.role !== 'admin') {
        toast.error('Admin access only');
        return;
      }
      setToken(res.data.data.accessToken);
      setUser(res.data.data.user);
    } catch {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-gradient bg-grid flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-600/80 flex items-center justify-center mb-4 shadow-glow-red">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Admin Portal</h1>
          <p className="text-white/40 text-sm">ASTRO Platform Control</p>
        </div>
        <div className="glass-card p-8 border border-red-500/20">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
              <input {...register('email')} type="email" placeholder="admin@astro.com" className="input-cosmic" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <input {...register('password')} type="password" placeholder="••••••••" className="input-cosmic" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
              <LogIn className="w-4 h-4" /> Sign In as Admin
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
