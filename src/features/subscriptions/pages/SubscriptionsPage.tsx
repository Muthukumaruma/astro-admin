import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
export default function SubscriptionsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-white">Subscriptions</h1>
      <div className="glass-card p-16 text-center">
        <CreditCard className="w-10 h-10 mx-auto mb-2 text-white/10" />
        <p className="text-white/30">Revenue analytics and subscription management</p>
      </div>
    </motion.div>
  );
}
