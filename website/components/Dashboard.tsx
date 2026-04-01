// Dashboard component
'use client';

// Import React and external libraries
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

// Import UI components
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define the stats array
const stats = [
  {
    id: 1,
    label: 'Total Users',
    value: '1,234',
    change: "+2.3% that's last month",
    icon: ArrowUpRight,
  },
  {
    id: 2,
    label: 'Nations Caught',
    value: '45,678',
    change: "+12.5% that's last week",
    icon: ArrowUpRight,
  },
  {
    id: 3,
    label: 'Active Guilds',
    value: '42',
    progress: { active: 60, total: 30 },
    icon: ArrowUpRight,
  },
];

// Define the top nations array
const topNations = [
  { name: 'United States', data: [100, 300, 500, 300, 500, 1000, 500] },
  { name: 'United Kingdom', data: [300, 500, 300, 100, 500, 300, 100] },
  { name: 'Japan', data: [500, 1000, 500, 300, 100, 500, 300] },
  { name: 'Germany', data: [100, 300, 100, 500, 300, 100, 500] },
  { name: 'France', data: [300, 100, 500, 1000, 500, 300, 100] },
  { name: 'Canada', data: [100, 500, 300, 500, 100, 300, 500] },
];

// Define the months array
const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

// Define the getColorForValue function
const getColorForValue = (value: number) => {
  if (value >= 1000) return 'bg-purple-900';
  if (value >= 500) return 'bg-purple-700';
  if (value >= 300) return 'bg-purple-500';
  return 'bg-purple-300';
};

// Define the Dashboard component
export default function Dashboard() {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('Annually');

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 px-1 sm:px-0">
          See the current statistics performance.
        </h1>

        <div className="flex flex-wrap gap-2 px-1 sm:px-0">
          {['All', 'Users', 'Nations', 'Guilds', 'Activity'].map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                selectedFilter === filter
                  ? 'bg-white text-[#0F0F0F]'
                  : 'bg-[#1A1A1A] text-white/70 hover:text-white hover:bg-[#252525]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-[#1A1A1A] border-[#252525] hover:border-[#333] transition-colors h-full">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xs sm:text-sm font-medium text-white/70">{stat.label}</h3>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3 h-3 text-white/50" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white mb-1">{stat.value}</p>
                  {stat.change && <p className="text-xs text-green-500">{stat.change}</p>}
                  {stat.progress && (
                    <div className="mt-3 space-y-2">
                      <div className="flex h-3 w-full rounded-full overflow-hidden text-[10px] font-medium">
                        <div
                          className="bg-yellow-500 flex items-center justify-center text-black"
                          style={{
                            flex: stat.progress.active,
                          }}
                        >
                          <span className="hidden sm:inline">Active</span>
                        </div>
                        <div
                          className="bg-gray-600 flex items-center justify-center text-black"
                          style={{
                            flex: stat.progress.total,
                          }}
                        >
                          <span className="hidden sm:inline">Total</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="bg-[#1A1A1A] border-[#252525] hover:border-[#333] transition-colors">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h3 className="text-sm font-medium text-white/70">Top Caught Nations</h3>
                <Select defaultValue="all">
                  <SelectTrigger className="bg-[#252525] text-white text-xs border-[#333] w-full sm:w-auto h-8">
                    <SelectValue placeholder="All Nations" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border-[#333]">
                    <SelectItem value="all">All Nations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 text-[10px] text-white/50">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-purple-300"></div>
                  <span>100</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-purple-500"></div>
                  <span>300</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-purple-700"></div>
                  <span>500</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-purple-900"></div>
                  <span>1000</span>
                </div>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-white/50 pb-2 pr-4">Nation</th>

                      {months.map((month) => (
                        <th key={month} className="text-xs text-white/50 pb-2 px-1 text-center">
                          <span
                            className={`inline-block px-2 py-1 ${
                              month === 'Aug' ? 'bg-purple-500/20 rounded-md' : ''
                            }`}
                          >
                            {month}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topNations.map((nation) => (
                      <tr key={nation.name} className="border-t border-[#252525]">
                        <td className="text-xs sm:text-sm text-white/70 py-2 pr-4 font-medium">
                          {nation.name}
                        </td>
                        {nation.data.map((value, idx) => (
                          <td key={`${nation.name}-${months[idx]}`} className="px-1 py-2">
                            <div
                              className={`w-5 h-5 sm:w-6 sm:h-6 rounded mx-auto ${getColorForValue(value)}`}
                            ></div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-[#1A1A1A] border-[#252525] hover:border-[#333] transition-colors h-full">
            <CardContent className="p-4 sm:p-5">
              {/* HEADER */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-sm font-medium text-white/70">Catch Growth</h3>

                <div className="flex bg-[#252525] rounded p-0.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setTimeRange('Month')}
                    className={`flex-1 sm:flex-none px-3 py-1 text-xs rounded transition
            ${
              timeRange === 'Month' ? 'bg-white text-[#0F0F0F]' : 'text-white/70 hover:text-white'
            }`}
                  >
                    Month
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeRange('Annually')}
                    className={`flex-1 sm:flex-none px-3 py-1 text-xs rounded transition
            ${
              timeRange === 'Annually'
                ? 'bg-white text-[#0F0F0F]'
                : 'text-white/70 hover:text-white'
            }`}
                  >
                    Annually
                  </button>
                </div>
              </div>

              {/* CHART */}
              <div className="space-y-3 sm:space-y-4">
                {['Jun', 'Jul', 'Aug'].map((month, idx) => {
                  const height = [15, 20, 25][idx];
                  const isAug = month === 'Aug';

                  return (
                    <div key={month} className="flex items-end gap-2 sm:gap-3">
                      {/* Month label */}
                      <div className="w-8 sm:w-10 text-xs text-white/50 shrink-0">{month}</div>

                      {/* Bar */}
                      <div className="flex-1 relative">
                        <div
                          className={`relative rounded-t ${
                            isAug ? 'bg-purple-400' : 'bg-gray-700'
                          }`}
                          style={{
                            height: `${height * 3}px`,
                          }}
                        >
                          {isAug && (
                            <div
                              className="
                      absolute left-1/2 -translate-x-1/2
                      -top-9 sm:-top-10
                      bg-yellow-500 text-[#0F0F0F]
                      text-[10px] px-2 py-1 rounded
                      text-center leading-tight
                      whitespace-nowrap
                      shadow-md
                    "
                            >
                              +22.9%
                              <br />
                              August, 2024
                              <br />
                              432,988
                            </div>
                          )}
                        </div>
                      </div>

                      {/* % label */}
                      <div className="w-6 sm:w-8 text-[10px] text-white/30 text-right shrink-0">
                        {height}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
