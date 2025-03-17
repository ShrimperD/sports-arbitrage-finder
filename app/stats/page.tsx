'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', profit: 4000 },
  { name: 'Feb', profit: 3000 },
  { name: 'Mar', profit: 2000 },
  { name: 'Apr', profit: 2780 },
  { name: 'May', profit: 1890 },
  { name: 'Jun', profit: 2390 },
];

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Statistics</h2>
        <p className="text-muted-foreground">
          View your betting performance and analytics over time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm font-medium text-muted-foreground">Total Profit</div>
          <div className="text-2xl font-bold text-green-500">$16,060</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm font-medium text-muted-foreground">Win Rate</div>
          <div className="text-2xl font-bold">87%</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm font-medium text-muted-foreground">Total Bets</div>
          <div className="text-2xl font-bold">156</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm font-medium text-muted-foreground">Avg. Return</div>
          <div className="text-2xl font-bold">2.4%</div>
        </div>
      </div>

      <div className="h-[400px] border rounded-lg p-4 bg-card">
        <h3 className="text-lg font-semibold mb-4">Monthly Profit</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="profit" fill="hsl(var(--chart-1))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}