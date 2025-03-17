'use client';

import { ArrowUpDown, ChevronDown, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface Bet {
  id: string;
  arbitrage: number;
  event: string;
  market: string;
  bookmakers: string[];
  betSize: number;
  profit: number;
}

const mockBets: Bet[] = [
  {
    id: '1',
    arbitrage: 3.2,
    event: 'Manchester United vs Liverpool',
    market: '1X2',
    bookmakers: ['Bet365', 'Unibet'],
    betSize: 100,
    profit: 3.2,
  },
  {
    id: '2',
    arbitrage: 2.8,
    event: 'Real Madrid vs Barcelona',
    market: 'Over/Under',
    bookmakers: ['William Hill', 'Betway'],
    betSize: 100,
    profit: 2.8,
  },
];

export function BettingTable() {
  const [bets] = useState<Bet[]>(mockBets);
  const [betAmount, setBetAmount] = useState(100);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1000px]">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="betAmount" className="text-sm font-medium">
              Bet Amount:
            </label>
            <input
              id="betAmount"
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-24 px-3 py-1 rounded border bg-background"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="grid grid-cols-7 gap-4 p-4 border-b font-medium">
            <div className="flex items-center gap-2">
              ARB % <ArrowUpDown className="h-4 w-4" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              EVENT <ArrowUpDown className="h-4 w-4" />
            </div>
            <div>MARKET</div>
            <div>BOOKS</div>
            <div className="text-right">BET SIZE</div>
            <div className="text-right">PROFIT</div>
          </div>

          {bets.map((bet) => (
            <div
              key={bet.id}
              className="grid grid-cols-7 gap-4 p-4 border-b last:border-0 hover:bg-muted/50"
            >
              <div className="text-green-500">{bet.arbitrage}%</div>
              <div className="col-span-2 flex items-center gap-2">
                {bet.event}
                <ChevronDown className="h-4 w-4" />
              </div>
              <div>{bet.market}</div>
              <div className="flex items-center gap-2">
                {bet.bookmakers.join(', ')}
                <ExternalLink className="h-4 w-4" />
              </div>
              <div className="text-right">${bet.betSize}</div>
              <div className="text-right text-green-500">
                ${(bet.profit * bet.betSize / 100).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}