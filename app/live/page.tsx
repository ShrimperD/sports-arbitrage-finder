'use client';

import { useState } from 'react';
import { Zap, TrendingUp, ArrowUpDown } from 'lucide-react';

interface LiveBet {
  id: string;
  event: string;
  market: string;
  odds1: number;
  odds2: number;
  timeRemaining: string;
  arbitrage: number;
}

const mockLiveBets: LiveBet[] = [
  {
    id: '1',
    event: 'Arsenal vs Chelsea',
    market: '1X2',
    odds1: 2.1,
    odds2: 1.95,
    timeRemaining: '65:23',
    arbitrage: 2.8,
  },
  {
    id: '2',
    event: 'Lakers vs Warriors',
    market: 'Total Points',
    odds1: 1.85,
    odds2: 2.05,
    timeRemaining: '12:45',
    arbitrage: 3.2,
  },
];

export default function LivePage() {
  const [liveBets] = useState<LiveBet[]>(mockLiveBets);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Live Arbitrage</h2>
        <p className="text-muted-foreground">
          Track real-time arbitrage opportunities across live events.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Zap className="h-4 w-4" />
            Live Opportunities
          </div>
          <div className="text-2xl font-bold">{liveBets.length}</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Highest ARB%
          </div>
          <div className="text-2xl font-bold text-green-500">
            {Math.max(...liveBets.map(bet => bet.arbitrage))}%
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ArrowUpDown className="h-4 w-4" />
            Avg. Odds Movement
          </div>
          <div className="text-2xl font-bold">±0.15</div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="grid grid-cols-6 gap-4 p-4 border-b font-medium">
          <div className="col-span-2">Event</div>
          <div>Market</div>
          <div>Time</div>
          <div className="text-right">Best Odds</div>
          <div className="text-right">ARB%</div>
        </div>

        {liveBets.map((bet) => (
          <div
            key={bet.id}
            className="grid grid-cols-6 gap-4 p-4 border-b last:border-0 hover:bg-muted/50"
          >
            <div className="col-span-2 font-medium">{bet.event}</div>
            <div>{bet.market}</div>
            <div className="text-red-500">{bet.timeRemaining}</div>
            <div className="text-right">
              {bet.odds1} / {bet.odds2}
            </div>
            <div className="text-right text-green-500">{bet.arbitrage}%</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg border bg-card">
        <h3 className="text-lg font-semibold mb-4">Live Feed</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• New arbitrage opportunity detected: Arsenal vs Chelsea (2.8%)</p>
          <p>• Odds movement alert: Lakers vs Warriors (Total Points)</p>
          <p>• Market closed: Manchester United vs Liverpool</p>
        </div>
      </div>
    </div>
  );
}