// Bot configuration component
'use client';

// Import the React hooks and components
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Define the BotConfig component
export default function BotConfig() {
  const [config, setConfig] = useState({
    prefix: '!',
    spawnRate: 'normal',
    cooldown: '30',
    maxInventory: '100',
  });

  // Handle changes to the configuration
  const handleChange = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Return the JSX for the component
  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
          Bot Configuration
        </h1>
        <p className="text-sm text-white/50">Manage your bot settings and behavior.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-[#1A1A1A] border-[#252525]">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-medium text-white/70">General Settings</h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-white/70">Command Prefix</Label>
                  <Input
                    value={config.prefix}
                    onChange={(e) => handleChange('prefix', e.target.value)}
                    className="bg-[#252525] border-[#333] text-white"
                    placeholder="!"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70">Spawn Rate</Label>
                  <Input
                    value={config.spawnRate}
                    onChange={(e) => handleChange('spawnRate', e.target.value)}
                    className="bg-[#252525] border-[#333] text-white"
                    placeholder="normal"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70">Cooldown (seconds)</Label>
                  <Input
                    type="number"
                    value={config.cooldown}
                    onChange={(e) => handleChange('cooldown', e.target.value)}
                    className="bg-[#252525] border-[#333] text-white"
                    placeholder="30"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70">Max Inventory Size</Label>
                  <Input
                    type="number"
                    value={config.maxInventory}
                    onChange={(e) => handleChange('maxInventory', e.target.value)}
                    className="bg-[#252525] border-[#333] text-white"
                    placeholder="100"
                  />
                </div>
              </div>

              <Button className="w-full bg-white text-[#0F0F0F] hover:bg-white/90">
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#1A1A1A] border-[#252525]">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-medium text-white/70">Bot Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[#252525]">
                  <span className="text-sm text-white/70">Status</span>
                  <span className="text-sm text-green-400">Online</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#252525]">
                  <span className="text-sm text-white/70">Uptime</span>
                  <span className="text-sm text-white">--</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#252525]">
                  <span className="text-sm text-white/70">Latency</span>
                  <span className="text-sm text-white">-- ms</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white/70">Version</span>
                  <span className="text-sm text-white">1.0.0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
