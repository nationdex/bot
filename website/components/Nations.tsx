// Nations component
'use client';

// Import React and external libraries
import { motion } from 'framer-motion';
import { Globe, Search } from 'lucide-react';
import { useState } from 'react';

// Import UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Define the mock nations array
const mockNations = [
  { id: '1', name: 'United States', catches: 1245, rarity: 'Common' },
  { id: '2', name: 'Japan', catches: 892, rarity: 'Common' },
  { id: '3', name: 'Germany', catches: 756, rarity: 'Common' },
  { id: '4', name: 'Monaco', catches: 34, rarity: 'Rare' },
  { id: '5', name: 'Vatican City', catches: 5, rarity: 'Legendary' },
  { id: '6', name: 'Liechtenstein', catches: 18, rarity: 'Epic' },
];

// Define the Nations component
export default function Nations() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNations = mockNations.filter((nation) =>
    nation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Nations</h1>
        <p className="text-sm text-white/50">Browse and manage all available nations in the dex.</p>
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
                <Globe className="w-4 h-4 text-white/70" />
                <h3 className="text-sm font-medium text-white/70">All Nations</h3>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#252525] border-[#333] text-white pl-9"
                  placeholder="Search nations..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredNations.map((nation, i) => (
                <motion.div
                  key={nation.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="bg-[#252525] rounded-lg p-4 border border-[#333] hover:border-[#444] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{nation.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          nation.rarity === 'Common'
                            ? 'bg-gray-500/20 text-gray-400'
                            : nation.rarity === 'Rare'
                              ? 'bg-blue-500/20 text-blue-400'
                              : nation.rarity === 'Epic'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {nation.rarity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">
                        {nation.catches.toLocaleString()} catches
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/50 hover:text-white h-7 text-xs"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
