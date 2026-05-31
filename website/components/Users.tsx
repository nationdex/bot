import { AnimatePresence, motion } from 'framer-motion';
import { Search, Users as UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import PlaceholderNotice from '@/components/PlaceholderNotice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tilt3D } from '@/components/ui/tilt-3d';
import { bot, collectibleLabel, placeholderUsers } from '@/lib/bot';
import { listItem, staggerContainer } from '@/lib/motion';

export default function UsersPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const filteredUsers = placeholderUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(localQuery.toLowerCase()) ||
      user.discordId.includes(localQuery)
  );

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6 space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Users</h1>
          <p className="text-sm text-white/50">
            Browse player inventories from{' '}
            <code className="text-white/60">getUserVar[{bot.vars.userInventory}]</code> — total,
            unique, rarity counts, and privacy settings.
          </p>
        </div>
        <PlaceholderNotice />
      </div>

      <Tilt3D enterDelay={0.1} maxTilt={4} lift={5} sheen={false}>
        <Card className="bg-[#1A1A1A] border-[#252525]">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-white/70" />
                <h3 className="text-sm font-medium text-white/70">Player inventories</h3>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  className="bg-[#252525] border-[#333] text-white pl-9"
                  placeholder="Search by username or Discord ID..."
                />
              </div>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#252525]">
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Username</th>
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Discord ID</th>
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Total</th>
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Unique</th>
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Value</th>
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Privacy</th>
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Gifts</th>
                    <th className="text-right text-xs text-white/50 pb-3">Actions</th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  key={localQuery}
                >
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user) => (
                      <motion.tr
                        key={user.discordId}
                        layout
                        variants={listItem}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        whileHover={{
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          rotateX: 2,
                          z: 4,
                        }}
                        style={{ transformPerspective: 900 }}
                        className="preserve-3d border-b border-[#252525] last:border-0"
                      >
                        <td className="py-3 pr-4 text-sm text-white">{user.username}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-white/70">
                          {user.discordId}
                        </td>
                        <td className="py-3 pr-4 text-sm text-white">
                          {user.total} {collectibleLabel(user.total)}
                        </td>
                        <td className="py-3 pr-4 text-sm text-white">{user.unique}</td>
                        <td className="py-3 pr-4 text-sm text-white">{user.totalValue}</td>
                        <td className="py-3 pr-4 text-sm text-white/70 capitalize">
                          {user.inventoryPrivacy}
                        </td>
                        <td className="py-3 pr-4 text-sm text-white/70">
                          {user.acceptGifts ? 'Yes' : 'No'}
                        </td>
                        <td className="py-3 text-right">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white/50 hover:text-white"
                            >
                              View
                            </Button>
                          </motion.div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Tilt3D>
    </div>
  );
}
