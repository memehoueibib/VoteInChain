import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Candidate } from '../../types';
import GlassCard from '../UI/GlassCard';
import TiltCard from '../UI/TiltCard';

interface ResultsChartProps {
  candidates: Candidate[];
  totalVotes: number;
}

const ResultsChart: React.FC<ResultsChartProps> = ({ candidates, totalVotes }) => {
  const COLORS = ['#00d9ff', '#8b5cf6', '#f97316', '#10b981', '#ef4444'];

  const chartData = candidates.map((candidate, index) => ({
    name: candidate.name,
    votes: candidate.vote_count,
    percentage: totalVotes > 0 ? ((candidate.vote_count / totalVotes) * 100).toFixed(1) : 0,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <TiltCard tiltStrength={3}>
          <GlassCard gradient glow>
            <h3 className="text-xl font-semibold text-white mb-6">Vote Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="votes"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </TiltCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <TiltCard tiltStrength={3}>
          <GlassCard gradient glow>
            <h3 className="text-xl font-semibold text-white mb-6">Vote Count Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255, 255, 255, 0.7)"
                    fontSize={12}
                  />
                  <YAxis stroke="rgba(255, 255, 255, 0.7)" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="votes" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </TiltCard>
      </motion.div>
    </div>
  );
};

export default ResultsChart;