import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
export default function AstrologersPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-white">Astrologers</h1>
      <div className="glass-card p-16 text-center">
        <Star className="w-10 h-10 mx-auto mb-2 text-white/10" />
        <p className="text-white/30">Approve and manage astrologer profiles</p>
      </div>
    </motion.div>
  );
}
