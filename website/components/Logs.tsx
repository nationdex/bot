'use client';

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const mockLogs = [
  {
    id: '1',
    timestamp: '2024-08-17T01:01:00Z',
    level: 'info',
    message: 'New user registered: player_one',
  },
  {
    id: '2',
    timestamp: '2024-08-17T00:45:00Z',
    level: 'info',
    message: 'Nation caught: United States by player_one',
  },
  {
    id: '3',
    timestamp: '2024-08-17T00:30:00Z',
    level: 'warn',
    message: 'Spawn rate configuration changed to normal',
  },
  {
    id: '4',
    timestamp: '2024-08-16T23:15:00Z',
    level: 'error',
    message: 'Failed to connect to gateway: timeout after 30s',
  },
  {
    id: '5',
    timestamp: '2024-08-16T23:00:00Z',
    level: 'info',
    message: 'Bot started successfully on shard 0',
  },
];

const levelColors: Record<string, string> = {
  info: 'text-blue-400 bg-blue-400/10',
  warn: 'text-yellow-400 bg-yellow-400/10',
  error: 'text-red-400 bg-red-400/10',
};

export default function Logs() {
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const filteredLogs = filter === 'all' ? mockLogs : mockLogs.filter((log) => log.level === filter);

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Logs</h1>
        <p className="text-sm text-white/50">View bot activity and error logs.</p>
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
                <FileText className="w-4 h-4 text-white/70" />
                <h3 className="text-sm font-medium text-white/70">Activity Log</h3>
              </div>
              <div className="flex gap-1.5">
                {(['all', 'info', 'warn', 'error'] as const).map((level) => (
                  <Button
                    key={level}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter(level)}
                    className={`text-xs capitalize ${
                      filter === level
                        ? 'bg-white text-[#0F0F0F] hover:bg-white/90 hover:text-[#0F0F0F]'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${levelColors[log.level] ?? ''}`}
                  >
                    {log.level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{log.message}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
