import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { bot } from '@/lib/bot';
import { fadeIn } from '@/lib/motion';

export default function PlaceholderNotice() {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="show"
      className="flex items-start gap-2 rounded-lg border border-[#333] bg-[#1A1A1A]/80 px-3 py-2.5 text-xs text-white/50"
    >
      <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.5, delay: 0.3 }}>
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
      </motion.div>
      <p>
        Placeholder UI mirroring <code className="text-white/60">src/config</code> and ForgeDB vars
        (<code className="text-white/60">{bot.vars.globalCatalog}</code>,{' '}
        <code className="text-white/60">{bot.vars.userInventory}</code>,{' '}
        <code className="text-white/60">{bot.vars.spawnConfig}</code>). Not connected to the bot
        database yet.
      </p>
    </motion.div>
  );
}
