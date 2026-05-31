import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import PlaceholderNotice from '@/components/PlaceholderNotice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tilt3D } from '@/components/ui/tilt-3d';
import {
  bot,
  collectibleLabel,
  formatRarity,
  placeholderCatalog,
  type RarityClass,
  rarityBadgeClass,
} from '@/lib/bot';
import { staggerContainer } from '@/lib/motion';

export default function Nations({ searchQuery = '' }: { searchQuery?: string }) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [classFilter, setClassFilter] = useState<string>('all');

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const filteredCatalog = placeholderCatalog.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(localQuery.toLowerCase()) ||
      entry.id.toLowerCase().includes(localQuery.toLowerCase());
    const matchesClass = classFilter === 'all' || entry.class === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6 space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 capitalize">
            {bot.collectible.plural}
          </h1>
          <p className="text-sm text-white/50">
            Global catalog from{' '}
            <code className="text-white/60">{bot.vars.globalCatalog}.nations</code> — rarity
            classes: {bot.rarityClasses.join(', ')}.
          </p>
        </div>
        <PlaceholderNotice />
      </div>

      <Tilt3D enterDelay={0.12} maxTilt={5} lift={6} sheen={false}>
        <Card className="bg-[#1A1A1A] border-[#252525]">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-white/70" />
                <h3 className="text-sm font-medium text-white/70 capitalize">
                  Catalog ({placeholderCatalog.length} {collectibleLabel(placeholderCatalog.length)}
                  )
                </h3>
              </div>

              <motion.div
                className="flex flex-col gap-2 md:flex-row md:items-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    className="h-9 w-full border-[#333] bg-[#252525] pl-9 pr-3 text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0"
                    placeholder={`Search by name or ID...`}
                  />
                </div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-9 w-full shrink-0 border-[#333] bg-[#252525] text-xs text-white md:w-36">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent className="border-[#333] bg-[#252525] text-white">
                    <SelectItem value="all">All classes</SelectItem>
                    {bot.rarityClasses.map((rarity) => (
                      <SelectItem key={rarity} value={rarity} className="capitalize">
                        {formatRarity(rarity)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            </div>

            <motion.div
              layout
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredCatalog.map((entry, i) => (
                  <Tilt3D
                    key={entry.id}
                    enterDelay={Math.min(i * 0.05, 0.35)}
                    maxTilt={11}
                    lift={12}
                    className="h-full"
                  >
                    <motion.div
                      layout
                      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                      className="h-full"
                    >
                      <div className="bg-[#252525] rounded-lg p-4 border border-[#333] hover:border-[#444] transition-colors h-full">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-white block truncate">
                              {entry.name}
                            </span>
                            <span className="text-[10px] font-mono text-white/40">{entry.id}</span>
                          </div>
                          <motion.span
                            whileHover={{ scale: 1.08 }}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${rarityBadgeClass[entry.class as RarityClass]}`}
                          >
                            {formatRarity(entry.class)}
                          </motion.span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>{entry.globalCaught.toLocaleString()} global caught</span>
                          <span>weight {entry.weight}</span>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/50 hover:text-white h-7 text-xs"
                            disabled
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </Tilt3D>
                ))}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {filteredCatalog.length === 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-white/40 text-center py-8"
                >
                  No catalog entries match.
                </motion.p>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </Tilt3D>
    </div>
  );
}
