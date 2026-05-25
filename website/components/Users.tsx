'use client';

import { motion } from 'framer-motion';
import { Search, Users as UsersIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const mockUsers = [
  {
    id: '1',
    username: 'player_one',
    discordId: '123456789012345678',
    nations: 12,
    joinedAt: '2024-08-01',
  },
  {
    id: '2',
    username: 'nation_hunter',
    discordId: '234567890123456789',
    nations: 45,
    joinedAt: '2024-07-15',
  },
  {
    id: '3',
    username: 'collector99',
    discordId: '345678901234567890',
    nations: 8,
    joinedAt: '2024-08-10',
  },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.discordId.includes(searchQuery)
  );

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Users</h1>
        <p className="text-sm text-white/50">View and manage registered bot users.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-[#1A1A1A] border-[#252525]">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-white/70" />
                <h3 className="text-sm font-medium text-white/70">All Users</h3>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#252525] border-[#333] text-white pl-9"
                  placeholder="Search users..."
                />
              </div>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#252525]">
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Username</th>
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Discord ID</th>
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Nations</th>
                    <th className="text-left text-xs text-white/50 pb-3 pr-4">Joined</th>
                    <th className="text-right text-xs text-white/50 pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#252525] last:border-0">
                      <td className="py-3 pr-4 text-sm text-white">{user.username}</td>
                      <td className="py-3 pr-4 text-sm text-white/70 font-mono text-xs">
                        {user.discordId}
                      </td>
                      <td className="py-3 pr-4 text-sm text-white">{user.nations}</td>
                      <td className="py-3 pr-4 text-sm text-white/70">{user.joinedAt}</td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/50 hover:text-white"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
