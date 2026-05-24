import { motion } from 'framer-motion';
import { Users, Search, Filter } from 'lucide-react';

export default function UsersPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Users</h1>
          <p className="text-white/40 text-sm">Manage all platform users</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm"><Search className="w-4 h-4" /> Search</button>
          <button className="btn-ghost text-sm"><Filter className="w-4 h-4" /> Filter</button>
        </div>
      </div>
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-16 text-white/20">
          <div className="text-center">
            <Users className="w-10 h-10 mx-auto mb-2 text-white/10" />
            <p>Connect to GET /admin/users endpoint</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
